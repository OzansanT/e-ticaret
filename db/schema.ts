import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const catalogProducts = sqliteTable(
  "catalog_products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    size: text("size").notNull(),
    price: integer("price").notNull(),
    stock: integer("stock").notNull().default(0),
    imageUrl: text("image_url").notNull().default("/product-placeholder.svg"),
    category: text("category").notNull(),
    eyebrow: text("eyebrow").notNull(),
    description: text("description").notNull(),
    longDescription: text("long_description").notNull(),
    features: text("features").notNull().default("[]"),
    accent: text("accent").notNull().default("#ff7b00"),
    badge: text("badge"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("catalog_products_slug_unique").on(table.slug),
    uniqueIndex("catalog_products_sku_unique").on(table.sku),
    index("catalog_products_active_idx").on(table.active),
  ],
);

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  value: integer("value").notNull().default(0),
  threshold: integer("threshold").notNull().default(0),
  minimumItems: integer("minimum_items").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    referralCode: text("referral_code").notNull(),
    referredBy: text("referred_by"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("customers_email_unique").on(table.email),
    uniqueIndex("customers_referral_code_unique").on(table.referralCode),
  ],
);

export const addresses = sqliteTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    recipientName: text("recipient_name").notNull(),
    line1: text("line_1").notNull(),
    line2: text("line_2"),
    city: text("city").notNull(),
    postalCode: text("postal_code").notNull(),
    countryCode: text("country_code").notNull().default("TR"),
    phone: text("phone").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("addresses_customer_idx").on(table.customerId)],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    publicToken: text("public_token").notNull(),
    orderNumber: text("order_number").notNull(),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    status: text("status").notNull().default("pending"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    paymentProvider: text("payment_provider").notNull().default("manual"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shippingTotal: integer("shipping_total").notNull().default(0),
    taxTotal: integer("tax_total").notNull().default(0),
    total: integer("total").notNull(),
    shippingMethod: text("shipping_method").notNull().default("lorem-standard"),
    couponCode: text("coupon_code"),
    referralCode: text("referral_code"),
    idempotencyKey: text("idempotency_key"),
    shippingAddress: text("shipping_address").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("orders_public_token_unique").on(table.publicToken),
    uniqueIndex("orders_order_number_unique").on(table.orderNumber),
    uniqueIndex("orders_idempotency_key_unique").on(table.idempotencyKey),
    index("orders_customer_idx").on(table.customerId),
    index("orders_email_idx").on(table.email),
  ],
);

export const shippingMethods = sqliteTable("shipping_methods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull().default(0),
  freeAbove: integer("free_above"),
  estimatedDays: text("estimated_days").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const taxRates = sqliteTable(
  "tax_rates",
  {
    id: text("id").primaryKey(),
    countryCode: text("country_code").notNull(),
    name: text("name").notNull(),
    rateBasisPoints: integer("rate_basis_points").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("tax_rates_country_unique").on(table.countryCode)],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => catalogProducts.id),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const paymentSessions = sqliteTable(
  "payment_sessions",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    status: text("status").notNull().default("pending"),
    providerReference: text("provider_reference"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("payment_sessions_order_idx").on(table.orderId)],
);

export const refunds = sqliteTable(
  "refunds",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    status: text("status").notNull().default("requested"),
    reason: text("reason").notNull(),
    providerReference: text("provider_reference"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("refunds_order_idx").on(table.orderId)],
);

export const orderEvents = sqliteTable(
  "order_events",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    note: text("note").notNull(),
    actorEmail: text("actor_email"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("order_events_order_idx").on(table.orderId)],
);

export const orderCancellations = sqliteTable("order_cancellations", {
  orderId: text("order_id").primaryKey().references(() => orders.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  actorEmail: text("actor_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const coupons = sqliteTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    kind: text("kind").notNull(),
    value: integer("value").notNull(),
    minimumSubtotal: integer("minimum_subtotal").notNull().default(0),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    expiresAt: text("expires_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("coupons_code_unique").on(table.code)],
);

export const loyaltyLedger = sqliteTable(
  "loyalty_ledger",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    points: integer("points").notNull(),
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("loyalty_customer_idx").on(table.customerId)],
);

export const referralLinks = sqliteTable(
  "referral_links",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    visits: integer("visits").notNull().default(0),
    conversions: integer("conversions").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("referral_links_code_unique").on(table.code)],
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: text("session_id").notNull(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    properties: text("properties").notNull().default("{}"),
    userEmail: text("user_email"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("analytics_created_idx").on(table.createdAt)],
);

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  email: text("email"),
  keys: text("keys").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const abandonedCarts = sqliteTable(
  "abandoned_carts",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id").notNull(),
    email: text("email"),
    lines: text("lines").notNull(),
    subtotal: integer("subtotal").notNull(),
    recovered: integer("recovered", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("abandoned_carts_cart_id_unique").on(table.cartId)],
);

export const productReviews = sqliteTable(
  "product_reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => catalogProducts.id, { onDelete: "cascade" }),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("product_reviews_customer_product_unique").on(table.customerId, table.productId),
    index("product_reviews_product_status_idx").on(table.productId, table.status),
  ],
);

export const rateLimitBuckets = sqliteTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  hits: integer("hits").notNull().default(0),
  windowStartedAt: integer("window_started_at").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
