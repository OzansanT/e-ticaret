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
  assert.match(main, /@import "\.\/responsive\.css"/);
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
