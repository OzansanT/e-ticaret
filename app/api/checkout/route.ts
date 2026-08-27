import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { selectBestCampaign } from "@/features/cart/campaigns";
import { ensureDefaultProducts } from "@/db/catalog";
import { getD1, getRuntimeEnv } from "@/db";
import { checkoutSchema } from "@/lib/commerce-validation";

type CheckoutProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
};

type CouponRow = {
  code: string;
  kind: "percentage" | "fixed";
  value: number;
  minimum_subtotal: number;
  usage_limit: number | null;
  usage_count: number;
};

async function ensureCommerceDefaults() {
  const db = await getD1();
  await ensureDefaultProducts();
  await db.batch([
    db.prepare(`
      INSERT INTO coupons (id, code, kind, value, minimum_subtotal, usage_limit, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(code) DO NOTHING
    `).bind("coupon-lorem-50", "LOREM50", "fixed", 50, 250, 1000),
    db.prepare(`
      INSERT INTO campaigns (id, name, kind, value, threshold, minimum_items, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO NOTHING
    `).bind("campaign-lorem-10", "Lorem ipsum %10", "percentage", 10, 0, 0),
  ]);
}

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 400 });
  }

  const input = parsed.data;
  const user = await getChatGPTUser();
  const email = (user?.email ?? input.email).trim().toLowerCase();
  const grouped = new Map<string, number>();
  for (const line of input.lines) {
    grouped.set(line.productId, Math.min(20, (grouped.get(line.productId) ?? 0) + line.quantity));
  }

  try {
    await ensureCommerceDefaults();
    const db = await getD1();
    const requestedLines = [...grouped.entries()].map(([productId, quantity]) => ({ productId, quantity }));
    const productResults = await db.batch(
      requestedLines.map((line) => db.prepare(`
        SELECT id, sku, name, price, stock
        FROM catalog_products WHERE id = ? AND active = 1 LIMIT 1
      `).bind(line.productId)),
    );
    const selectedProducts = productResults.map((result, index) => ({
      product: result.results[0] as unknown as CheckoutProduct | undefined,
      quantity: requestedLines[index].quantity,
    }));

    if (selectedProducts.some(({ product, quantity }) => !product || product.stock < quantity)) {
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
    const total = subtotal - discount;

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
          payment_provider, subtotal, discount, total, coupon_code, referral_code, shipping_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        total,
        coupon?.code ?? null,
        input.referralCode || null,
        JSON.stringify(input.address),
      ),
      db.prepare(`
        INSERT INTO payment_sessions (id, order_id, provider, status)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), orderId, paymentProvider, "pending"),
      db.prepare(`
        INSERT INTO loyalty_ledger (id, customer_id, order_id, points, reason)
        VALUES (?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), customer.id, orderId, Math.floor(total / 10), "Lorem ipsum"),
      db.prepare(`
        INSERT INTO referral_links (id, customer_id, code, active)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(code) DO NOTHING
      `).bind(crypto.randomUUID(), customer.id, customer.referral_code),
    ];

    for (const { product, quantity } of selectedProducts) {
      statements.push(
        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, sku, name, unit_price, quantity)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), orderId, product!.id, product!.sku, product!.name, product!.price, quantity),
        db.prepare("UPDATE catalog_products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(quantity, product!.id),
      );
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
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." }, { status: 500 });
  }
}
