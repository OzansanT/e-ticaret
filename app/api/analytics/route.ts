import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/db";
import { analyticsEventSchema } from "@/lib/commerce-validation";

export async function POST(request: Request) {
  const parsed = analyticsEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 204 });
  try {
    const user = await getChatGPTUser();
    const db = await getD1();
    await db.prepare(`
      INSERT INTO analytics_events (session_id, name, path, properties, user_email)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      parsed.data.sessionId,
      parsed.data.name,
      parsed.data.path,
      JSON.stringify(parsed.data.properties),
      user?.email ?? null,
    ).run();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  return new NextResponse(null, { status: 204 });
}
