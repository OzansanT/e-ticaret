import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("..", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("keeps one centralized CSS import hierarchy", async () => {
  const [globals, main] = await Promise.all([
    source("app/globals.css"),
    source("styles/main.css"),
  ]);

  assert.match(globals, /@import "\.\.\/styles\/main\.css"/);
  assert.match(main, /@import "\.\/tokens\.css"/);
  assert.match(main, /@import "\.\/features\/storefront\.css"/);
  assert.match(main, /@import "\.\/features\/catalog\.css"/);
  assert.match(main, /@import "\.\/features\/cart\.css"/);
  assert.match(main, /@import "\.\/features\/commerce\.css"/);
  assert.match(main, /@import "\.\/responsive\.css"/);
});

test("connects product detail routes, structured SEO and inventory fields", async () => {
  const [catalog, productPage, sitemap] = await Promise.all([
    source("features/catalog/products.ts"),
    source("app/products/[slug]/page.tsx"),
    source("app/sitemap.ts"),
  ]);

  assert.match(catalog, /sku: "LRM-001"/);
  assert.match(catalog, /stock: 18/);
  assert.match(catalog, /imageUrl: "\/product-placeholder\.svg"/);
  assert.match(productPage, /"@type": "Product"/);
  assert.match(productPage, /https:\/\/schema\.org\/InStock/);
  assert.match(sitemap, /products\/\$\{product\.slug\}/);
});

test("adds one generated shoe example with size-level stock and SEO offers", async () => {
  const [catalog, detail, checkout, schema, migration, asset] = await Promise.all([
    source("features/catalog/products.ts"),
    source("features/catalog/product-detail.tsx"),
    source("app/api/checkout/route.ts"),
    source("db/schema.ts"),
    source("drizzle/0002_calm_ken_ellis.sql"),
    stat(new URL("public/lorem-shoe.webp", root)),
  ]);

  assert.match(catalog, /slug: "lorem-ipsum-calceus"/);
  assert.match(catalog, /\[39, 40, 41, 42, 43, 44\]/);
  assert.match(detail, /className="product-variants"/);
  assert.match(checkout, /catalog_product_variants\.stock/);
  assert.match(checkout, /variant_sku, variant_label/);
  assert.match(schema, /"catalog_product_variants"/);
  assert.match(migration, /catalog_product_variants_stock_update_guard/);
  assert.ok(asset.size > 10_000 && asset.size < 500_000);
});

test("keeps checkout prices and inventory authoritative on the server", async () => {
  const [flow, route, migration] = await Promise.all([
    source("features/checkout/checkout-flow.tsx"),
    source("app/api/checkout/route.ts"),
    source("drizzle/0000_swift_toxin.sql"),
  ]);

  assert.match(flow, /productId: product\.id, variantId: variant\?\.id, quantity/);
  assert.doesNotMatch(flow, /productId: product\.id, price:/);
  assert.match(route, /COALESCE\(catalog_product_variants\.price, catalog_products\.price\) AS price/);
  assert.match(route, /UPDATE catalog_products SET stock = stock - \?/);
  assert.match(route, /UPDATE catalog_product_variants SET stock = stock - \?/);
  assert.match(migration, /catalog_products_stock_update_guard/);
});

test("adds persistent commerce, consent, recovery, push and admin foundations", async () => {
  const [schema, consent, tracker, worker, admin] = await Promise.all([
    source("db/schema.ts"),
    source("features/engagement/consent-manager.tsx"),
    source("features/engagement/commerce-tracker.tsx"),
    source("public/sw.js"),
    source("app/api/admin/route.ts"),
  ]);

  for (const table of ["orders", "addresses", "coupons", "loyalty_ledger", "referral_links", "analytics_events", "push_subscriptions", "abandoned_carts"]) {
    assert.match(schema, new RegExp(`"${table}"`));
  }
  assert.match(consent, /analytics: false, marketing: false/);
  assert.match(tracker, /readConsent\(\)\?\.marketing/);
  assert.match(worker, /addEventListener\("push"/);
  assert.match(admin, /requireAdminApi/);
});

test("protects payment updates with a signed webhook", async () => {
  const webhook = await source("app/api/payments/webhook/route.ts");
  assert.match(webhook, /PAYMENT_WEBHOOK_SECRET/);
  assert.match(webhook, /crypto\.subtle\.sign\("HMAC"/);
  assert.match(webhook, /x-commerce-signature/);
});

test("adds server-calculated fulfillment, tax and idempotent checkout totals", async () => {
  const [checkout, validation, migration] = await Promise.all([
    source("app/api/checkout/route.ts"),
    source("lib/commerce-validation.ts"),
    source("drizzle/0001_clever_the_phantom.sql"),
  ]);
  assert.match(checkout, /shipping_total, tax_total/);
  assert.match(checkout, /idempotency_key = \?/);
  assert.match(checkout, /rate_basis_points/);
  assert.match(validation, /checkoutKey/);
  assert.match(migration, /CREATE TABLE `shipping_methods`/);
  assert.match(migration, /CREATE TABLE `tax_rates`/);
  assert.match(migration, /orders_idempotency_key_unique/);
});

test("supports safe cancellation, refund records and printable invoices", async () => {
  const [cancellation, admin, invoice, webhook] = await Promise.all([
    source("app/api/orders/[token]/route.ts"),
    source("app/api/admin/route.ts"),
    source("app/orders/[token]/invoice/page.tsx"),
    source("app/api/payments/webhook/route.ts"),
  ]);
  assert.match(cancellation, /order_cancellations/);
  assert.match(cancellation, /stock = stock \+ \?/);
  assert.match(cancellation, /catalog_product_variants SET stock = stock \+ \?/);
  assert.match(admin, /INSERT INTO refunds/);
  assert.match(invoice, /invoice-totals/);
  assert.match(webhook, /payment_failed/);
});

test("adds verified-purchase review moderation and review structured data", async () => {
  const [route, productPage, admin] = await Promise.all([
    source("app/api/products/[slug]/reviews/route.ts"),
    source("app/products/[slug]/page.tsx"),
    source("app/api/admin/route.ts"),
  ]);
  assert.match(route, /orders\.status = 'fulfilled'/);
  assert.match(route, /orders\.payment_status = 'paid'/);
  assert.match(productPage, /AggregateRating/);
  assert.match(admin, /reviewStatus/);
});

test("publishes crawlable category collections", async () => {
  const [categoryPage, sitemap, grid] = await Promise.all([
    source("app/categories/[slug]/page.tsx"),
    source("app/sitemap.ts"),
    source("features/catalog/product-grid.tsx"),
  ]);
  assert.match(categoryPage, /CollectionPage/);
  assert.match(categoryPage, /ItemList/);
  assert.match(sitemap, /categories\/\$\{category\.slug\}/);
  assert.match(grid, /categories\/\$\{categorySlug\(product\.category\)\}/);
});

test("does not place account, checkout, admin or order HTML in the offline cache", async () => {
  const worker = await source("public/sw.js");
  assert.match(worker, /const privatePath/);
  for (const path of ["/account", "/admin", "/checkout", "/orders/"]) assert.match(worker, new RegExp(path.replaceAll("/", "\\/")));
  assert.match(worker, /url\.pathname === "\/"/);
});

test("keeps the requested storefront regions connected", async () => {
  const storefront = await source("features/storefront/storefront.tsx");

  assert.match(storefront, /<header className="site-header">/);
  assert.match(storefront, /className="category-rail"/);
  assert.match(storefront, /className="catalog-section"/);
  assert.match(storefront, /className="campaign-aside"/);
  assert.match(storefront, /<footer className="site-footer">/);
  assert.match(storefront, /<CartSheet \/>/);
});

test("includes the approved five-step price ladder", async () => {
  const catalog = await source("features/catalog/products.ts");

  for (const price of [134, 170, 231, 325, 501]) {
    assert.match(catalog, new RegExp(`price: ${price}`));
  }
});

test("ships an installable offline storefront shell", async () => {
  const [manifestText, worker, registration] = await Promise.all([
    source("public/manifest.webmanifest"),
    source("public/sw.js"),
    source("features/pwa/pwa-register.tsx"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "tr");
  assert.equal(manifest.icons.length, 1);
  assert.equal(manifest.icons[0].sizes, "any");
  assert.match(worker, /const APP_SHELL/);
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(registration, /serviceWorker\.register\("\/sw\.js"/);
});

test("keeps customer-facing source brandless and free of pet copy", async () => {
  const files = await Promise.all([
    source("app/layout.tsx"),
    source("features/storefront/storefront.tsx"),
    source("features/catalog/products.ts"),
    source("features/catalog/product-grid.tsx"),
    source("features/cart/cart-sheet.tsx"),
    source("public/manifest.webmanifest"),
  ]);
  const customerSource = files.join("\n");

  assert.doesNotMatch(customerSource, /Dr\.?\s*Animal|HOCl|veteriner|kedi|köpek|pet care/i);
  assert.match(customerSource, /Lorem ipsum/i);
});
