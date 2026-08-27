import type { MetadataRoute } from "next";
import { listProducts } from "@/db/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = "https://e-ticaret.talasresul.chatgpt.site";
  const products = await listProducts();
  return [
    { url: origin, changeFrequency: "daily", priority: 1 },
    ...products.map((product) => ({
      url: `${origin}/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
