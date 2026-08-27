import { NextResponse } from "next/server";
import { ensureDefaultProducts, listProducts } from "@/db/catalog";
import { ensureCommerceDefaults } from "@/db/commerce-config";
import { getD1 } from "@/db";
import { requireAdminApi } from "@/lib/admin";
import { adminActionSchema } from "@/lib/commerce-validation";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Lorem ipsum." }, { status: 403 });
  try {
    await ensureCommerceDefaults();
    const db = await getD1();
    const [campaigns, coupons, metrics, orders, shipping, taxes, refunds, reviews] = await db.batch([
      db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 100"),
      db.prepare("SELECT * FROM coupons ORDER BY created_at DESC LIMIT 100"),
      db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM orders) AS orders,
          (SELECT COALESCE(SUM(total), 0) FROM orders) AS revenue,
          (SELECT COUNT(*) FROM abandoned_carts WHERE recovered = 0) AS abandoned,
          (SELECT COUNT(*) FROM analytics_events) AS events,
          (SELECT COUNT(*) FROM product_reviews WHERE status = 'pending') AS pending_reviews,
          (SELECT COALESCE(SUM(amount), 0) FROM refunds WHERE status IN ('requested', 'processing', 'completed')) AS refunds
      `),
      db.prepare(`
        SELECT order_number, email, status, payment_status, total, created_at
        FROM orders ORDER BY created_at DESC LIMIT 50
      `),
      db.prepare("SELECT * FROM shipping_methods ORDER BY price, created_at"),
      db.prepare("SELECT * FROM tax_rates ORDER BY country_code"),
      db.prepare(`
        SELECT refunds.id, refunds.amount, refunds.status, refunds.reason, refunds.created_at, orders.order_number
        FROM refunds JOIN orders ON orders.id = refunds.order_id
        ORDER BY refunds.created_at DESC LIMIT 50
      `),
      db.prepare(`
        SELECT product_reviews.id, product_reviews.rating, product_reviews.title, product_reviews.body,
               product_reviews.status, product_reviews.created_at, catalog_products.name AS product_name,
               customers.email
        FROM product_reviews
        JOIN catalog_products ON catalog_products.id = product_reviews.product_id
        JOIN customers ON customers.id = product_reviews.customer_id
        ORDER BY product_reviews.created_at DESC LIMIT 100
      `),
    ]);
    return NextResponse.json({
      products: await listProducts(),
      campaigns: campaigns.results,
      coupons: coupons.results,
      metrics: metrics.results[0] ?? {},
      orders: orders.results,
      shipping: shipping.results,
      taxes: taxes.results,
      refunds: refunds.results,
      reviews: reviews.results,
    });
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Lorem ipsum." }, { status: 403 });
  const parsed = adminActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Lorem ipsum dolor." }, { status: 400 });

  try {
    const db = await getD1();
    if (parsed.data.action === "seed") {
      await ensureDefaultProducts();
    } else if (parsed.data.action === "product") {
      const product = parsed.data.product;
      await db.prepare(`
        INSERT INTO catalog_products (
          id, slug, sku, name, short_name, size, price, stock, image_url, category,
          eyebrow, description, long_description, features, accent, badge, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          sku = excluded.sku,
          name = excluded.name,
          short_name = excluded.short_name,
          size = excluded.size,
          price = excluded.price,
          stock = excluded.stock,
          image_url = excluded.image_url,
          category = excluded.category,
          eyebrow = excluded.eyebrow,
          description = excluded.description,
          long_description = excluded.long_description,
          features = excluded.features,
          accent = excluded.accent,
          badge = excluded.badge,
          active = excluded.active,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        product.id, product.slug, product.sku, product.name, product.shortName, product.size,
        product.price, product.stock, product.imageUrl || "/product-placeholder.svg", product.category,
        product.eyebrow, product.description, product.longDescription, JSON.stringify(product.features),
        product.accent, product.badge || null, product.active ? 1 : 0,
      ).run();
    } else if (parsed.data.action === "variant") {
      const variant = parsed.data.variant;
      await db.batch([
        db.prepare(`
          INSERT INTO catalog_product_variants (id, product_id, sku, label, price, stock, active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            product_id = excluded.product_id, sku = excluded.sku, label = excluded.label,
            price = excluded.price, stock = excluded.stock, active = excluded.active,
            updated_at = CURRENT_TIMESTAMP
        `).bind(variant.id, variant.productId, variant.sku, variant.label, variant.price, variant.stock, variant.active ? 1 : 0),
        db.prepare(`
          UPDATE catalog_products SET
            stock = COALESCE((SELECT SUM(stock) FROM catalog_product_variants WHERE product_id = ? AND active = 1), stock),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(variant.productId, variant.productId),
      ]);
    } else if (parsed.data.action === "campaign") {
      const campaign = parsed.data.campaign;
      await db.prepare(`
        INSERT INTO campaigns (id, name, kind, value, threshold, minimum_items, active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          kind = excluded.kind,
          value = excluded.value,
          threshold = excluded.threshold,
          minimum_items = excluded.minimum_items,
          active = excluded.active,
          updated_at = CURRENT_TIMESTAMP
      `).bind(campaign.id, campaign.name, campaign.kind, campaign.value, campaign.threshold, campaign.minimumItems, campaign.active ? 1 : 0).run();
    } else if (parsed.data.action === "coupon") {
      const coupon = parsed.data.coupon;
      await db.prepare(`
        INSERT INTO coupons (id, code, kind, value, minimum_subtotal, usage_limit, active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          code = excluded.code,
          kind = excluded.kind,
          value = excluded.value,
          minimum_subtotal = excluded.minimum_subtotal,
          usage_limit = excluded.usage_limit,
          active = excluded.active,
          updated_at = CURRENT_TIMESTAMP
      `).bind(coupon.id, coupon.code, coupon.kind, coupon.value, coupon.minimumSubtotal, coupon.usageLimit, coupon.active ? 1 : 0).run();
    } else if (parsed.data.action === "shipping") {
      const shipping = parsed.data.shipping;
      await db.prepare(`
        INSERT INTO shipping_methods (id, name, price, free_above, estimated_days, active)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name, price = excluded.price, free_above = excluded.free_above,
          estimated_days = excluded.estimated_days, active = excluded.active,
          updated_at = CURRENT_TIMESTAMP
      `).bind(shipping.id, shipping.name, shipping.price, shipping.freeAbove, shipping.estimatedDays, shipping.active ? 1 : 0).run();
    } else if (parsed.data.action === "tax") {
      const tax = parsed.data.tax;
      await db.prepare(`
        INSERT INTO tax_rates (id, country_code, name, rate_basis_points, active)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(country_code) DO UPDATE SET
          name = excluded.name, rate_basis_points = excluded.rate_basis_points,
          active = excluded.active, updated_at = CURRENT_TIMESTAMP
      `).bind(tax.id, tax.countryCode, tax.name, tax.rateBasisPoints, tax.active ? 1 : 0).run();
    } else if (parsed.data.action === "refund") {
      const order = await db.prepare(`
        SELECT id, total, COALESCE((SELECT SUM(amount) FROM refunds WHERE order_id = orders.id AND status != 'failed'), 0) AS refunded
        FROM orders WHERE order_number = ? LIMIT 1
      `).bind(parsed.data.orderNumber).first<{ id: string; total: number; refunded: number }>();
      if (!order || parsed.data.amount > order.total - order.refunded) {
        return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 409 });
      }
      await db.batch([
        db.prepare(`
          INSERT INTO refunds (id, order_id, amount, status, reason) VALUES (?, ?, ?, 'requested', ?)
        `).bind(crypto.randomUUID(), order.id, parsed.data.amount, parsed.data.reason),
        db.prepare(`
          INSERT INTO order_events (id, order_id, kind, note, actor_email) VALUES (?, ?, 'refund_requested', ?, ?)
        `).bind(crypto.randomUUID(), order.id, parsed.data.reason, admin.email),
      ]);
    } else if (parsed.data.action === "reviewStatus") {
      await db.prepare(`
        UPDATE product_reviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(parsed.data.status, parsed.data.reviewId).run();
    } else {
      const order = await db.prepare("SELECT id, status, payment_status FROM orders WHERE order_number = ? LIMIT 1")
        .bind(parsed.data.orderNumber).first<{ id: string; status: string; payment_status: string }>();
      if (!order) return NextResponse.json({ error: "Lorem ipsum." }, { status: 404 });
      if (parsed.data.status === "cancelled" && order.status !== "cancelled") {
        if (order.payment_status !== "pending" || !["pending", "processing"].includes(order.status)) {
          return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 409 });
        }
        const lines = await db.prepare("SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?")
          .bind(order.id).all<{ product_id: string; variant_id: string | null; quantity: number }>();
        await db.batch([
          db.prepare("INSERT INTO order_cancellations (order_id, reason, actor_email) VALUES (?, ?, ?)")
            .bind(order.id, "Lorem ipsum dolor sit amet.", admin.email),
          ...lines.results.flatMap((line) => [
            db.prepare("UPDATE catalog_products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
              .bind(line.quantity, line.product_id),
            ...(line.variant_id ? [db.prepare("UPDATE catalog_product_variants SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
              .bind(line.quantity, line.variant_id)] : []),
          ]),
          db.prepare("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(order.id),
          db.prepare("INSERT INTO order_events (id, order_id, kind, note, actor_email) VALUES (?, ?, 'cancelled', ?, ?)")
            .bind(crypto.randomUUID(), order.id, "Lorem ipsum dolor sit amet.", admin.email),
        ]);
      } else {
        await db.batch([
          db.prepare(`
            UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `).bind(parsed.data.status, order.id),
          db.prepare(`
            INSERT INTO order_events (id, order_id, kind, note, actor_email) VALUES (?, ?, 'status', ?, ?)
          `).bind(crypto.randomUUID(), order.id, parsed.data.status, admin.email),
        ]);
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 500 });
  }
}
