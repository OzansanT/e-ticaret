import { NextResponse } from "next/server";
import { z } from "zod";
import { getD1, getRuntimeEnv } from "@/db";

const webhookSchema = z.object({
  orderNumber: z.string().min(3).max(80),
  status: z.enum(["paid", "failed", "refunded"]),
  providerReference: z.string().max(200).optional().default(""),
});

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function equalSignature(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function POST(request: Request) {
  const env = await getRuntimeEnv();
  const secret = typeof env.PAYMENT_WEBHOOK_SECRET === "string" ? env.PAYMENT_WEBHOOK_SECRET : "";
  if (!secret) return NextResponse.json({ error: "Lorem ipsum." }, { status: 503 });
  const body = await request.text();
  const signature = request.headers.get("x-commerce-signature") ?? "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  if (!equalSignature(signature.toLowerCase(), expected)) return NextResponse.json({ error: "Lorem ipsum." }, { status: 401 });
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor." }, { status: 400 });
  }
  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Lorem ipsum dolor." }, { status: 400 });

  const db = await getD1();
  const order = await db.prepare("SELECT id, customer_id, status, payment_status, total FROM orders WHERE order_number = ? LIMIT 1")
    .bind(parsed.data.orderNumber).first<{ id: string; customer_id: string | null; status: string; payment_status: string; total: number }>();
  if (!order) return NextResponse.json({ error: "Lorem ipsum." }, { status: 404 });
  if (parsed.data.status === "paid" && order.status === "cancelled") {
    await db.batch([
      db.prepare("UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(order.id),
      db.prepare("UPDATE payment_sessions SET status = 'paid', provider_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?")
        .bind(parsed.data.providerReference || null, order.id),
      db.prepare(`
        INSERT INTO refunds (id, order_id, amount, status, reason)
        VALUES (?, ?, ?, 'requested', ?)
        ON CONFLICT(id) DO NOTHING
      `).bind(`late-payment-${order.id}`, order.id, order.total, "Lorem ipsum dolor sit amet."),
      db.prepare(`
        INSERT INTO order_events (id, order_id, kind, note)
        VALUES (?, ?, 'late_payment', ?)
        ON CONFLICT(id) DO NOTHING
      `).bind(`late-payment-event-${order.id}`, order.id, parsed.data.providerReference || "Lorem ipsum"),
    ]);
    return NextResponse.json({ ok: true });
  }
  if (parsed.data.status === "failed" && ["pending", "processing"].includes(order.status) && order.payment_status !== "paid") {
    const lines = await db.prepare("SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?")
      .bind(order.id).all<{ product_id: string; variant_id: string | null; quantity: number }>();
    await db.batch([
      db.prepare("INSERT INTO order_cancellations (order_id, reason, actor_email) VALUES (?, ?, ?)")
        .bind(order.id, "Lorem ipsum dolor sit amet.", "payment-webhook"),
      ...lines.results.flatMap((line) => [
        db.prepare("UPDATE catalog_products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(line.quantity, line.product_id),
        ...(line.variant_id ? [db.prepare("UPDATE catalog_product_variants SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(line.quantity, line.variant_id)] : []),
      ]),
      db.prepare("UPDATE orders SET payment_status = 'failed', status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(order.id),
      db.prepare("UPDATE payment_sessions SET status = 'failed', provider_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?")
        .bind(parsed.data.providerReference || null, order.id),
      db.prepare("INSERT INTO order_events (id, order_id, kind, note) VALUES (?, ?, 'payment_failed', ?) ON CONFLICT(id) DO NOTHING")
        .bind(`payment-failed-${order.id}`, order.id, parsed.data.providerReference || "Lorem ipsum"),
    ]);
    return NextResponse.json({ ok: true });
  }
  if (parsed.data.status === "failed") return NextResponse.json({ ok: true, ignored: true });

  const orderStatus = parsed.data.status === "paid" ? "processing" : parsed.data.status === "refunded" ? "refunded" : order.status;
  const statements: D1PreparedStatement[] = [
    db.prepare(`
      UPDATE orders SET payment_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(parsed.data.status, orderStatus, order.id),
    db.prepare(`
      UPDATE payment_sessions SET status = ?, provider_reference = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `).bind(parsed.data.status, parsed.data.providerReference || null, order.id),
    db.prepare(`
      INSERT INTO order_events (id, order_id, kind, note)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(`payment-${parsed.data.status}-${order.id}`, order.id, `payment_${parsed.data.status}`, parsed.data.providerReference || "Lorem ipsum"),
  ];
  if (parsed.data.status === "refunded") {
    statements.push(db.prepare(`
      UPDATE refunds SET status = 'completed', provider_reference = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ? AND status IN ('requested', 'processing')
    `).bind(parsed.data.providerReference || null, order.id));
  }
  if (parsed.data.status === "paid" && order.customer_id) {
    statements.push(db.prepare(`
      INSERT INTO loyalty_ledger (id, customer_id, order_id, points, reason)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(`loyalty-order-${order.id}`, order.customer_id, order.id, Math.floor(order.total / 10), "Lorem ipsum"));
  }
  if (parsed.data.status === "refunded" && order.customer_id) {
    statements.push(db.prepare(`
      INSERT INTO loyalty_ledger (id, customer_id, order_id, points, reason)
      SELECT ?, ?, ?, -points, ? FROM loyalty_ledger WHERE id = ?
      ON CONFLICT(id) DO NOTHING
    `).bind(`loyalty-refund-${order.id}`, order.customer_id, order.id, "Dolor sit amet", `loyalty-order-${order.id}`));
  }
  await db.batch(statements);
  return NextResponse.json({ ok: true });
}
