import { NextResponse } from "next/server";
import { getRuntimeEnv } from "@/db";

export async function GET() {
  const env = await getRuntimeEnv();
  const publicKey = typeof env.VAPID_PUBLIC_KEY === "string" ? env.VAPID_PUBLIC_KEY : "";
  return NextResponse.json({ enabled: Boolean(publicKey), ...(publicKey ? { publicKey } : {}) });
}
