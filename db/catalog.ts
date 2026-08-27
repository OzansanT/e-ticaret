import { getD1 } from "./index";
import { categorySlugs, products as fallbackProducts, type Product } from "@/features/catalog/products";

export type CatalogCategory = {
  name: Product["category"];
  slug: string;
  count: number;
};

type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  short_name: string;
  size: string;
  price: number;
  stock: number;
  image_url: string;
  category: Product["category"];
  eyebrow: string;
  description: string;
  long_description: string;
  features: string;
  accent: string;
  badge: string | null;
};

function fromRow(row: ProductRow): Product {
  let features: string[] = [];
  try {
    features = JSON.parse(row.features) as string[];
  } catch {
    features = [];
  }

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    shortName: row.short_name,
    size: row.size,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    category: row.category,
    eyebrow: row.eyebrow,
    description: row.description,
    longDescription: row.long_description,
    features: [
      features[0] ?? "Lorem ipsum dolor",
      features[1] ?? "Sit amet consectetur",
      features[2] ?? "Adipiscing elit sed",
    ],
    accent: row.accent,
    ...(row.badge ? { badge: row.badge } : {}),
  };
}

export async function ensureDefaultProducts() {
  const db = await getD1();
  const statements = fallbackProducts.map((product) =>
    db.prepare(`
      INSERT INTO catalog_products (
        id, slug, sku, name, short_name, size, price, stock, image_url,
        category, eyebrow, description, long_description, features, accent, badge
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(
      product.id,
      product.slug,
      product.sku,
      product.name,
      product.shortName,
      product.size,
      product.price,
      product.stock,
      product.imageUrl,
      product.category,
      product.eyebrow,
      product.description,
      product.longDescription,
      JSON.stringify(product.features),
      product.accent,
      product.badge ?? null,
    ),
  );
  await db.batch(statements);
}

export async function listProducts(): Promise<Product[]> {
  try {
    const db = await getD1();
    const result = await db.prepare(`
      SELECT id, slug, sku, name, short_name, size, price, stock, image_url,
             category, eyebrow, description, long_description, features, accent, badge
      FROM catalog_products
      WHERE active = 1
      ORDER BY created_at, id
    `).all<ProductRow>();
    return result.results.length > 0 ? result.results.map(fromRow) : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const db = await getD1();
    const row = await db.prepare(`
      SELECT id, slug, sku, name, short_name, size, price, stock, image_url,
             category, eyebrow, description, long_description, features, accent, badge
      FROM catalog_products
      WHERE slug = ? AND active = 1
      LIMIT 1
    `).bind(slug).first<ProductRow>();
    return row ? fromRow(row) : fallbackProducts.find((product) => product.slug === slug);
  } catch {
    return fallbackProducts.find((product) => product.slug === slug);
  }
}

export async function listCatalogCategories(): Promise<CatalogCategory[]> {
  const products = await listProducts();
  return Object.entries(categorySlugs).map(([name, slug]) => ({
    name: name as Product["category"],
    slug,
    count: products.filter((product) => product.category === name).length,
  }));
}

export async function getCategoryBySlug(slug: string) {
  const category = (Object.entries(categorySlugs) as Array<[Product["category"], string]>)
    .find(([, categorySlug]) => categorySlug === slug);
  if (!category) return null;
  const products = (await listProducts()).filter((product) => product.category === category[0]);
  return { name: category[0], slug: category[1], products };
}

export type CampaignRule = {
  name: string;
  kind: "percentage" | "fixed" | "threshold" | "quantity";
  value: number;
  threshold: number;
  minimumItems: number;
};

export async function listCampaignRules(): Promise<CampaignRule[]> {
  try {
    const db = await getD1();
    const result = await db.prepare(`
      SELECT name, kind, value, threshold, minimum_items
      FROM campaigns
      WHERE active = 1
        AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
        AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)
      ORDER BY created_at
    `).all<{ name: string; kind: CampaignRule["kind"]; value: number; threshold: number; minimum_items: number }>();
    return result.results.map((row) => ({
      name: row.name,
      kind: row.kind,
      value: row.value,
      threshold: row.threshold,
      minimumItems: row.minimum_items,
    }));
  } catch {
    return [];
  }
}
