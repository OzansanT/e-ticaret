import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";
import { orderCustomerActionSchema } from "@/lib/commerce-validation";
import { enforceRateLimit, requestIdentity } from "@/lib/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Lorem ipsum." }, { status: 401 });
  const parsed = orderCustomerActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Lorem ipsum dolor." }, { status: 400 });
  try {
    const limit = await enforceRateLimit("order-action", requestIdentity(request, user.email), 10, 3600);
    if (!limit.allowed) return NextResponse.json({ error: "Lorem ipsum dolor." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
    const { token } = await params;
    const db = await getD1();
    const order = await db.prepare(`
      SELECT id, status, payment_status FROM orders
      WHERE public_token = ? AND lower(email) = lower(?) LIMIT 1
    `).bind(token, user.email).first<{ id: string; status: string; payment_status: string }>();
    if (!order) return NextResponse.json({ error: "Lorem ipsum." }, { status: 404 });
    if (order.status === "cancelled") return NextResponse.json({ ok: true, replayed: true });
    if (order.status !== "pending" || order.payment_status !== "pending") {
      return NextResponse.json({ error: "Lorem ipsum dolor sit amet consectetur." }, { status: 409 });
    }
    const lines = await db.prepare("SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?")
      .bind(order.id).all<{ product_id: string; variant_id: string | null; quantity: number }>();
    await db.batch([
      db.prepare(`
        INSERT INTO order_cancellations (order_id, reason, actor_email) VALUES (?, ?, ?)
      `).bind(order.id, parsed.data.reason, user.email),
      ...lines.results.flatMap((line) => [
        db.prepare(`
          UPDATE catalog_products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(line.quantity, line.product_id),
        ...(line.variant_id ? [db.prepare(`
          UPDATE catalog_product_variants SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(line.quantity, line.variant_id)] : []),
      ]),
      db.prepare(`
        UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(order.id),
      db.prepare(`
        INSERT INTO order_events (id, order_id, kind, note, actor_email) VALUES (?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), order.id, "cancelled", parsed.data.reason, user.email),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor sit amet." }, { status: 500 });
  }
}
