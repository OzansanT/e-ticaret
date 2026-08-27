import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("keeps checkout prices and inventory authoritative on the server", async () => {
  const [flow, route, migration] = await Promise.all([
    source("features/checkout/checkout-flow.tsx"),
    source("app/api/checkout/route.ts"),
    source("drizzle/0000_swift_toxin.sql"),
  ]);

  assert.match(flow, /productId: product\.id, quantity/);
  assert.doesNotMatch(flow, /productId: product\.id, price:/);
  assert.match(route, /SELECT id, sku, name, price, stock/);
  assert.match(route, /UPDATE catalog_products SET stock = stock - \?/);
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
