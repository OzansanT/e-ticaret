import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export async function getRuntimeEnv() {
  return (await import("cloudflare:workers")).env;
}

export async function getDb() {
  const env = await getRuntimeEnv();
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export async function getD1(): Promise<D1Database> {
  const env = await getRuntimeEnv();
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  return env.DB;
}

export async function getBucket(): Promise<R2Bucket> {
  const env = await getRuntimeEnv();
  if (!env.BUCKET) {
    throw new Error("Cloudflare R2 binding `BUCKET` is unavailable.");
  }
  return env.BUCKET;
}
