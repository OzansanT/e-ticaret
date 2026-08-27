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

  const orderStatus = parsed.data.status === "paid" ? "processing" : parsed.data.status === "refunded" ? "refunded" : "pending";
  const db = await getD1();
  await db.batch([
    db.prepare(`
      UPDATE orders SET payment_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = ?
    `).bind(parsed.data.status, orderStatus, parsed.data.orderNumber),
    db.prepare(`
      UPDATE payment_sessions SET status = ?, provider_reference = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = (SELECT id FROM orders WHERE order_number = ?)
    `).bind(parsed.data.status, parsed.data.providerReference || null, parsed.data.orderNumber),
  ]);
  return NextResponse.json({ ok: true });
}
