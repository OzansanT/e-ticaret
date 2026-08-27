import { NextResponse } from "next/server";
import { getBucket } from "@/db";
import { requireAdminApi } from "@/lib/admin";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Lorem ipsum." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !acceptedTypes.has(file.type) || file.size === 0 || file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Lorem ipsum dolor." }, { status: 400 });
  }
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const key = `products/${crypto.randomUUID()}.${extension}`;
  await (await getBucket()).put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });
  return NextResponse.json({ url: `/media/${key}` }, { status: 201 });
}
