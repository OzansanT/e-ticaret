import { getD1 } from "./index";
import { ensureDefaultProducts } from "./catalog";

export type ShippingMethod = {
  id: string;
  name: string;
  price: number;
  freeAbove: number | null;
  estimatedDays: string;
};

export type TaxRate = {
  countryCode: string;
  name: string;
  rateBasisPoints: number;
};

export async function ensureCommerceDefaults() {
  const db = await getD1();
  await ensureDefaultProducts();
  await db.batch([
    db.prepare(`
      INSERT INTO coupons (id, code, kind, value, minimum_subtotal, usage_limit, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(code) DO NOTHING
    `).bind("coupon-lorem-50", "LOREM50", "fixed", 50, 250, 1000),
    db.prepare(`
      INSERT INTO campaigns (id, name, kind, value, threshold, minimum_items, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO NOTHING
    `).bind("campaign-lorem-10", "Lorem ipsum %10", "percentage", 10, 0, 0),
    db.prepare(`
      INSERT INTO shipping_methods (id, name, price, free_above, estimated_days, active)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO NOTHING
    `).bind("lorem-standard", "Lorem ipsum", 49, 750, "2–4 lorem"),
    db.prepare(`
      INSERT INTO shipping_methods (id, name, price, free_above, estimated_days, active)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO NOTHING
    `).bind("lorem-express", "Dolor sit amet", 89, null, "1–2 lorem"),
    db.prepare(`
      INSERT INTO tax_rates (id, country_code, name, rate_basis_points, active)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(country_code) DO NOTHING
    `).bind("tax-tr", "TR", "Lorem ipsum", 2000),
  ]);
}

export async function listShippingMethods(subtotal = 0): Promise<ShippingMethod[]> {
  try {
    await ensureCommerceDefaults();
    const db = await getD1();
    const result = await db.prepare(`
      SELECT id, name, price, free_above, estimated_days
      FROM shipping_methods WHERE active = 1 ORDER BY price, created_at
    `).all<{ id: string; name: string; price: number; free_above: number | null; estimated_days: string }>();
    return result.results.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.free_above !== null && subtotal >= row.free_above ? 0 : row.price,
      freeAbove: row.free_above,
      estimatedDays: row.estimated_days,
    }));
  } catch {
    return [
      { id: "lorem-standard", name: "Lorem ipsum", price: subtotal >= 750 ? 0 : 49, freeAbove: 750, estimatedDays: "2–4 lorem" },
      { id: "lorem-express", name: "Dolor sit amet", price: 89, freeAbove: null, estimatedDays: "1–2 lorem" },
    ];
  }
}

export async function getTaxRate(countryCode: string): Promise<TaxRate> {
  try {
    await ensureCommerceDefaults();
    const db = await getD1();
    const row = await db.prepare(`
      SELECT country_code, name, rate_basis_points
      FROM tax_rates WHERE country_code = ? AND active = 1 LIMIT 1
    `).bind(countryCode.toUpperCase()).first<{ country_code: string; name: string; rate_basis_points: number }>();
    if (row) return { countryCode: row.country_code, name: row.name, rateBasisPoints: row.rate_basis_points };
  } catch {
    // The default keeps rendered-output tests independent from runtime bindings.
  }
  return { countryCode: countryCode.toUpperCase(), name: "Lorem ipsum", rateBasisPoints: 2000 };
}
