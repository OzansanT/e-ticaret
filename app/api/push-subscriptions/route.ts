import { NextResponse } from "next/server";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({ p256dh: z.string().min(1).max(1000), auth: z.string().min(1).max(1000) }),
});

export async function POST(request: Request) {
  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Lorem ipsum." }, { status: 400 });
  try {
    const user = await getChatGPTUser();
    const db = await getD1();
    await db.prepare(`
      INSERT INTO push_subscriptions (endpoint, email, keys, enabled)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(endpoint) DO UPDATE SET
        email = excluded.email,
        keys = excluded.keys,
        enabled = 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(parsed.data.endpoint, user?.email ?? null, JSON.stringify(parsed.data.keys)).run();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lorem ipsum dolor." }, { status: 500 });
  }
}
