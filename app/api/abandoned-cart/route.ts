import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";
import { abandonedCartSchema } from "@/lib/commerce-validation";

export async function POST(request: Request) {
  const parsed = abandonedCartSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 204 });
  try {
    const user = await getChatGPTUser();
    const db = await getD1();
    await db.prepare(`
      INSERT INTO abandoned_carts (id, cart_id, email, lines, subtotal, recovered)
      VALUES (?, ?, ?, ?, ?, 0)
      ON CONFLICT(cart_id) DO UPDATE SET
        email = COALESCE(excluded.email, abandoned_carts.email),
        lines = excluded.lines,
        subtotal = excluded.subtotal,
        recovered = 0,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      crypto.randomUUID(),
      parsed.data.cartId,
      user?.email ?? parsed.data.email ?? null,
      JSON.stringify(parsed.data.lines),
      parsed.data.subtotal,
    ).run();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  return new NextResponse(null, { status: 204 });
}
