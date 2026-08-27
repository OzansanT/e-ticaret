import { getD1 } from "./index";

export type AccountOrder = {
  order_number: string;
  public_token: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
};

export type AccountAddress = {
  id: string;
  label: string;
  recipient_name: string;
  line_1: string;
  line_2: string | null;
  city: string;
  postal_code: string;
  country_code: string;
  phone: string;
};

export async function getAccountData(email: string) {
  try {
    const db = await getD1();
    const customer = await db.prepare(
      "SELECT id, referral_code FROM customers WHERE lower(email) = lower(?) LIMIT 1",
    ).bind(email).first<{ id: string; referral_code: string }>();
    if (!customer) return { orders: [], addresses: [], points: 0, referralCode: null };

    const [orders, addresses, points] = await db.batch([
      db.prepare(`
        SELECT order_number, public_token, status, payment_status, total, created_at
        FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50
      `).bind(customer.id),
      db.prepare(`
        SELECT id, label, recipient_name, line_1, line_2, city, postal_code, country_code, phone
        FROM addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC
      `).bind(customer.id),
      db.prepare("SELECT COALESCE(SUM(points), 0) AS total FROM loyalty_ledger WHERE customer_id = ?").bind(customer.id),
    ]);

    return {
      orders: orders.results as unknown as AccountOrder[],
      addresses: addresses.results as unknown as AccountAddress[],
      points: Number((points.results[0] as { total?: number } | undefined)?.total ?? 0),
      referralCode: customer.referral_code,
    };
  } catch {
    return { orders: [], addresses: [], points: 0, referralCode: null };
  }
}

export async function getOrderByToken(token: string) {
  try {
    const db = await getD1();
    const order = await db.prepare(`
      SELECT order_number, status, payment_status, payment_provider, subtotal,
             discount, total, email, shipping_address, created_at
      FROM orders WHERE public_token = ? LIMIT 1
    `).bind(token).first<Record<string, unknown>>();
    if (!order) return null;
    const items = await db.prepare(`
      SELECT sku, name, unit_price, quantity
      FROM order_items
      WHERE order_id = (SELECT id FROM orders WHERE public_token = ?)
      ORDER BY rowid
    `).bind(token).all<Record<string, unknown>>();
    return { order, items: items.results };
  } catch {
    return null;
  }
}
