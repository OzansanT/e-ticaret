import { getD1 } from "./index";
import { categorySlugs, products as fallbackProducts, type Product, type ProductVariant } from "@/features/catalog/products";

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

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  label: string;
  price: number | null;
  stock: number;
};

function fromVariant(row: VariantRow): ProductVariant {
  return { id: row.id, sku: row.sku, label: row.label, price: row.price, stock: row.stock };
}

function fromRow(row: ProductRow, variants: ProductVariant[] = []): Product {
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
    ...(variants.length > 0 ? { variants } : {}),
    ...(row.badge ? { badge: row.badge } : {}),
  };
}

export async function ensureDefaultProducts() {
  const db = await getD1();
  const productStatements = fallbackProducts.map((product) =>
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
  const variantStatements = fallbackProducts.flatMap((product) => (product.variants ?? []).map((variant) =>
    db.prepare(`
      INSERT INTO catalog_product_variants (id, product_id, sku, label, price, stock, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO NOTHING
    `).bind(variant.id, product.id, variant.sku, variant.label, variant.price, variant.stock),
  ));
  await db.batch([...productStatements, ...variantStatements]);
}

export async function listProducts(): Promise<Product[]> {
  try {
    await ensureDefaultProducts();
    const db = await getD1();
    const [result, variants] = await Promise.all([
      db.prepare(`
      SELECT id, slug, sku, name, short_name, size, price, stock, image_url,
             category, eyebrow, description, long_description, features, accent, badge
      FROM catalog_products
      WHERE active = 1
      ORDER BY created_at, id
      `).all<ProductRow>(),
      db.prepare(`
        SELECT id, product_id, sku, label, price, stock
        FROM catalog_product_variants WHERE active = 1 ORDER BY created_at, id
      `).all<VariantRow>(),
    ]);
    if (result.results.length === 0) return fallbackProducts;
    return result.results.map((row) => fromRow(
      row,
      variants.results.filter((variant) => variant.product_id === row.id).map(fromVariant),
    ));
  } catch {
    return fallbackProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    await ensureDefaultProducts();
    const db = await getD1();
    const row = await db.prepare(`
      SELECT id, slug, sku, name, short_name, size, price, stock, image_url,
             category, eyebrow, description, long_description, features, accent, badge
      FROM catalog_products
      WHERE slug = ? AND active = 1
      LIMIT 1
    `).bind(slug).first<ProductRow>();
    if (!row) return fallbackProducts.find((product) => product.slug === slug);
    const variants = await db.prepare(`
      SELECT id, product_id, sku, label, price, stock
      FROM catalog_product_variants WHERE product_id = ? AND active = 1 ORDER BY created_at, id
    `).bind(row.id).all<VariantRow>();
    return fromRow(row, variants.results.map(fromVariant));
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
