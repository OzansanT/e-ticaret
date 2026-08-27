import { NextResponse } from "next/server";
import { ensureDefaultProducts, listProducts } from "@/db/catalog";
import { getD1 } from "@/db";
import { requireAdminApi } from "@/lib/admin";
import { adminActionSchema } from "@/lib/commerce-validation";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Lorem ipsum." }, { status: 403 });
  try {
    await ensureDefaultProducts();
    const db = await getD1();
    const [campaigns, coupons, metrics, orders] = await db.batch([
      db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 100"),
      db.prepare("SELECT * FROM coupons ORDER BY created_at DESC LIMIT 100"),
      db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM orders) AS orders,
          (SELECT COALESCE(SUM(total), 0) FROM orders) AS revenue,
          (SELECT COUNT(*) FROM abandoned_carts WHERE recovered = 0) AS abandoned,
          (SELECT COUNT(*) FROM analytics_events) AS events
      `),
      db.prepare(`
        SELECT order_number, email, status, payment_status, total, created_at
        FROM orders ORDER BY created_at DESC LIMIT 50
      `),
    ]);
    return NextResponse.json({
      products: await listProducts(),
      campaigns: campaigns.results,
      coupons: coupons.results,
      metrics: metrics.results[0] ?? {},
      orders: orders.results,
    });
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Lorem ipsum." }, { status: 403 });
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
    } else {
      await db.prepare(`
        UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?
      `).bind(parsed.data.status, parsed.data.orderNumber).run();
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 500 });
  }
}
