import { getBucket } from "@/db";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join("/");
  if (!/^products\/[a-f0-9-]+\.(?:jpg|png|webp|avif)$/.test(key)) return new Response(null, { status: 404 });
  const object = await (await getBucket()).get(key);
  if (!object) return new Response(null, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
