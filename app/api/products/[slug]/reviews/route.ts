import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getProductBySlug } from "@/db/catalog";
import { getD1 } from "@/db";
import { reviewSchema } from "@/lib/commerce-validation";
import { enforceRateLimit, requestIdentity } from "@/lib/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 401 });
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 400 });

  try {
    const limit = await enforceRateLimit("review", requestIdentity(request, user.email), 5, 3600);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
    }
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return NextResponse.json({ error: "Lorem ipsum." }, { status: 404 });
    const db = await getD1();
    const purchase = await db.prepare(`
      SELECT customers.id AS customer_id, orders.id AS order_id
      FROM customers
      JOIN orders ON orders.customer_id = customers.id
      JOIN order_items ON order_items.order_id = orders.id
      WHERE lower(customers.email) = lower(?)
        AND order_items.product_id = ?
        AND orders.status = 'fulfilled'
        AND orders.payment_status = 'paid'
      ORDER BY orders.created_at DESC LIMIT 1
    `).bind(user.email, product.id).first<{ customer_id: string; order_id: string }>();
    if (!purchase) return NextResponse.json({ error: "Lorem ipsum dolor sit amet consectetur." }, { status: 403 });

    await db.prepare(`
      INSERT INTO product_reviews (id, product_id, customer_id, order_id, rating, title, body, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      ON CONFLICT(customer_id, product_id) DO UPDATE SET
        order_id = excluded.order_id,
        rating = excluded.rating,
        title = excluded.title,
        body = excluded.body,
        status = 'pending',
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      crypto.randomUUID(), product.id, purchase.customer_id, purchase.order_id,
      parsed.data.rating, parsed.data.title, parsed.data.body,
    ).run();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 500 });
  }
}
