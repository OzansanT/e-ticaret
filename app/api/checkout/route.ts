import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { selectBestCampaign } from "@/features/cart/campaigns";
import { ensureCommerceDefaults } from "@/db/commerce-config";
import { getD1, getRuntimeEnv } from "@/db";
import { checkoutSchema } from "@/lib/commerce-validation";
import { enforceRateLimit, requestIdentity } from "@/lib/rate-limit";

type CheckoutProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  variant_count: number;
  variant_id: string | null;
  variant_sku: string | null;
  variant_label: string | null;
};

type CouponRow = {
  code: string;
  kind: "percentage" | "fixed";
  value: number;
  minimum_subtotal: number;
  usage_limit: number | null;
  usage_count: number;
};

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 400 });
  }

  const input = parsed.data;
  const user = await getChatGPTUser();
  const email = (user?.email ?? input.email).trim().toLowerCase();
  const grouped = new Map<string, { productId: string; variantId?: string; quantity: number }>();
  for (const line of input.lines) {
    const key = `${line.productId}::${line.variantId ?? ""}`;
    const current = grouped.get(key);
    grouped.set(key, { productId: line.productId, ...(line.variantId ? { variantId: line.variantId } : {}), quantity: Math.min(20, (current?.quantity ?? 0) + line.quantity) });
  }

  try {
    await ensureCommerceDefaults();
    const db = await getD1();
    const limit = await enforceRateLimit("checkout", requestIdentity(request, email), 5, 300);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Lorem ipsum dolor sit amet." },
        { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
      );
    }
    const existing = await db.prepare(`
      SELECT order_number, public_token, total, payment_provider, payment_status,
             shipping_total, tax_total
      FROM orders WHERE idempotency_key = ? AND email = ? LIMIT 1
    `).bind(input.checkoutKey, email).first<Record<string, unknown>>();
    if (existing) {
      return NextResponse.json({
        orderNumber: existing.order_number,
        token: existing.public_token,
        total: existing.total,
        paymentProvider: existing.payment_provider,
        paymentStatus: existing.payment_status,
        shippingTotal: existing.shipping_total,
        taxTotal: existing.tax_total,
        replayed: true,
      });
    }
    const requestedLines = [...grouped.values()];
    const productResults = await db.batch(
      requestedLines.map((line) => db.prepare(`
        SELECT catalog_products.id, catalog_products.sku, catalog_products.name,
               COALESCE(catalog_product_variants.price, catalog_products.price) AS price,
               CASE
                 WHEN (SELECT COUNT(*) FROM catalog_product_variants AS active_variants WHERE active_variants.product_id = catalog_products.id AND active_variants.active = 1) > 0
                 THEN COALESCE(catalog_product_variants.stock, -1)
                 ELSE catalog_products.stock
               END AS stock,
               (SELECT COUNT(*) FROM catalog_product_variants AS active_variants WHERE active_variants.product_id = catalog_products.id AND active_variants.active = 1) AS variant_count,
               catalog_product_variants.id AS variant_id,
               catalog_product_variants.sku AS variant_sku,
               catalog_product_variants.label AS variant_label
        FROM catalog_products
        LEFT JOIN catalog_product_variants
          ON catalog_product_variants.product_id = catalog_products.id
         AND catalog_product_variants.id = ?
         AND catalog_product_variants.active = 1
        WHERE catalog_products.id = ? AND catalog_products.active = 1 LIMIT 1
      `).bind(line.variantId ?? "", line.productId)),
    );
    const selectedProducts = productResults.map((result, index) => ({
      product: result.results[0] as unknown as CheckoutProduct | undefined,
      quantity: requestedLines[index].quantity,
    }));

    if (selectedProducts.some(({ product, quantity }, index) =>
      !product ||
      product.stock < quantity ||
      (product.variant_count > 0 && !product.variant_id) ||
      (product.variant_count === 0 && Boolean(requestedLines[index].variantId))
    )) {
      return NextResponse.json({ error: "Lorem ipsum dolor sit amet consectetur." }, { status: 409 });
    }

    const subtotal = selectedProducts.reduce(
      (sum, { product, quantity }) => sum + Number(product!.price) * quantity,
      0,
    );
    const unitPrices = selectedProducts.flatMap(({ product, quantity }) =>
      Array.from({ length: quantity }, () => Number(product!.price)),
    );
    const campaignRows = await db.prepare(`
      SELECT name, kind, value, threshold, minimum_items AS minimumItems
      FROM campaigns
      WHERE active = 1
        AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
        AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)
    `).all();
    const campaign = selectBestCampaign(unitPrices, subtotal, campaignRows.results) as { discount: number };
    let discount = Math.round(campaign.discount);
    let coupon: CouponRow | null = null;

    if (input.couponCode) {
      coupon = await db.prepare(`
        SELECT code, kind, value, minimum_subtotal, usage_limit, usage_count
        FROM coupons
        WHERE code = ? AND active = 1
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        LIMIT 1
      `).bind(input.couponCode.toUpperCase()).first<CouponRow>();
      if (coupon && subtotal >= coupon.minimum_subtotal && (coupon.usage_limit === null || coupon.usage_count < coupon.usage_limit)) {
        const couponDiscount = coupon.kind === "percentage"
          ? Math.round(subtotal * (coupon.value / 100))
          : coupon.value;
        discount = Math.max(discount, couponDiscount);
      } else {
        coupon = null;
      }
    }
    discount = Math.min(discount, subtotal);
    const shipping = await db.prepare(`
      SELECT id, price, free_above FROM shipping_methods WHERE id = ? AND active = 1 LIMIT 1
    `).bind(input.shippingMethodId).first<{ id: string; price: number; free_above: number | null }>();
    if (!shipping) {
      return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 400 });
    }
    const shippingTotal = shipping.free_above !== null && subtotal >= shipping.free_above ? 0 : shipping.price;
    const tax = await db.prepare(`
      SELECT rate_basis_points FROM tax_rates WHERE country_code = ? AND active = 1 LIMIT 1
    `).bind(input.address.countryCode.toUpperCase()).first<{ rate_basis_points: number }>();
    const taxableTotal = Math.max(0, subtotal - discount) + shippingTotal;
    const taxTotal = Math.round(taxableTotal * (Number(tax?.rate_basis_points ?? 0) / 10_000));
    const total = taxableTotal + taxTotal;

    const customerId = crypto.randomUUID();
    const referralCode = `LOREM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await db.prepare(`
      INSERT INTO customers (id, email, display_name, referral_code, referred_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        display_name = COALESCE(excluded.display_name, customers.display_name),
        referred_by = COALESCE(customers.referred_by, excluded.referred_by),
        updated_at = CURRENT_TIMESTAMP
    `).bind(customerId, email, user?.displayName ?? input.address.recipientName, referralCode, input.referralCode || null).run();
    const customer = await db.prepare(
      "SELECT id, referral_code FROM customers WHERE email = ? LIMIT 1",
    ).bind(email).first<{ id: string; referral_code: string }>();
    if (!customer) throw new Error("customer unavailable");

    const orderId = crypto.randomUUID();
    const publicToken = crypto.randomUUID();
    const orderNumber = `LRM-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const runtimeEnv = await getRuntimeEnv();
    const paymentProvider = typeof runtimeEnv.PAYMENT_PROVIDER === "string" && runtimeEnv.PAYMENT_PROVIDER
      ? runtimeEnv.PAYMENT_PROVIDER
      : "manual";
    const statements: D1PreparedStatement[] = [
      db.prepare(`
        INSERT INTO orders (
          id, public_token, order_number, customer_id, email, status, payment_status,
          payment_provider, subtotal, discount, shipping_total, tax_total, total,
          shipping_method, coupon_code, referral_code, idempotency_key, shipping_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        publicToken,
        orderNumber,
        customer.id,
        email,
        "pending",
        "pending",
        paymentProvider,
        subtotal,
        discount,
        shippingTotal,
        taxTotal,
        total,
        shipping.id,
        coupon?.code ?? null,
        input.referralCode || null,
        input.checkoutKey,
        JSON.stringify(input.address),
      ),
      db.prepare(`
        INSERT INTO payment_sessions (id, order_id, provider, status)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), orderId, paymentProvider, "pending"),
      db.prepare(`
        INSERT INTO referral_links (id, customer_id, code, active)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(code) DO NOTHING
      `).bind(crypto.randomUUID(), customer.id, customer.referral_code),
      db.prepare(`
        INSERT INTO order_events (id, order_id, kind, note, actor_email)
        VALUES (?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), orderId, "created", "Lorem ipsum dolor sit amet.", email),
    ];

    for (const { product, quantity } of selectedProducts) {
      statements.push(
        db.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, variant_id, variant_sku, variant_label,
            sku, name, unit_price, quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), orderId, product!.id, product!.variant_id,
          product!.variant_sku, product!.variant_label, product!.sku,
          product!.name, product!.price, quantity,
        ),
        db.prepare("UPDATE catalog_products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(quantity, product!.id),
      );
      if (product!.variant_id) {
        statements.push(db.prepare(`
          UPDATE catalog_product_variants SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(quantity, product!.variant_id));
      }
    }
    if (input.address.save) {
      statements.push(db.prepare(`
        INSERT INTO addresses (
          id, customer_id, label, recipient_name, line_1, line_2, city,
          postal_code, country_code, phone, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), customer.id, input.address.label, input.address.recipientName,
        input.address.line1, input.address.line2 || null, input.address.city,
        input.address.postalCode, input.address.countryCode.toUpperCase(), input.address.phone, 1,
      ));
    }
    if (coupon) {
      statements.push(db.prepare("UPDATE coupons SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE code = ?")
        .bind(coupon.code));
    }
    if (input.referralCode) {
      statements.push(db.prepare("UPDATE referral_links SET conversions = conversions + 1 WHERE code = ? AND active = 1")
        .bind(input.referralCode));
    }
    if (input.cartId) {
      statements.push(db.prepare("UPDATE abandoned_carts SET recovered = 1, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?")
        .bind(input.cartId));
    }

    await db.batch(statements);
    return NextResponse.json({
      orderNumber,
      token: publicToken,
      total,
      paymentProvider,
      paymentStatus: "pending",
      shippingTotal,
      taxTotal,
    }, { status: 201 });
  } catch {
    try {
      const db = await getD1();
      const existing = await db.prepare(`
        SELECT order_number, public_token, total, payment_provider, payment_status,
               shipping_total, tax_total
        FROM orders WHERE idempotency_key = ? AND email = ? LIMIT 1
      `).bind(input.checkoutKey, email).first<Record<string, unknown>>();
      if (existing) {
        return NextResponse.json({
          orderNumber: existing.order_number,
          token: existing.public_token,
          total: existing.total,
          paymentProvider: existing.payment_provider,
          paymentStatus: existing.payment_status,
          shippingTotal: existing.shipping_total,
          taxTotal: existing.tax_total,
          replayed: true,
        });
      }
    } catch {
      // Fall through to the bounded public error below.
    }
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." }, { status: 500 });
  }
}
