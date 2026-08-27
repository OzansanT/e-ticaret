import { getD1 } from "@/db";

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enforceRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const key = `${scope}:${await digest(identifier.toLowerCase())}`;
  const db = await getD1();
  const results = await db.batch([
    db.prepare(`
      INSERT INTO rate_limit_buckets (key, hits, window_started_at)
      VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET
        hits = CASE
          WHEN ? - rate_limit_buckets.window_started_at >= ? THEN 1
          ELSE rate_limit_buckets.hits + 1
        END,
        window_started_at = CASE
          WHEN ? - rate_limit_buckets.window_started_at >= ? THEN ?
          ELSE rate_limit_buckets.window_started_at
        END,
        updated_at = CURRENT_TIMESTAMP
    `).bind(key, now, now, windowSeconds, now, windowSeconds, now),
    db.prepare("SELECT hits, window_started_at FROM rate_limit_buckets WHERE key = ?").bind(key),
    db.prepare("DELETE FROM rate_limit_buckets WHERE window_started_at < ?").bind(now - 86_400),
  ]);
  const bucket = results[1].results[0] as { hits?: number; window_started_at?: number } | undefined;
  const hits = Number(bucket?.hits ?? limit + 1);
  const started = Number(bucket?.window_started_at ?? now);
  return {
    allowed: hits <= limit,
    remaining: Math.max(0, limit - hits),
    retryAfter: Math.max(1, windowSeconds - (now - started)),
  };
}

export function requestIdentity(request: Request, fallback: string) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? fallback;
}
