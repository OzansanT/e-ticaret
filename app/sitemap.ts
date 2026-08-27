import type { MetadataRoute } from "next";
import { listCatalogCategories, listProducts } from "@/db/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = "https://e-ticaret.talasresul.chatgpt.site";
  const [products, categories] = await Promise.all([listProducts(), listCatalogCategories()]);
  return [
    { url: origin, changeFrequency: "daily", priority: 1 },
    ...categories.map((category) => ({
      url: `${origin}/categories/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${origin}/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
