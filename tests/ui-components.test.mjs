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
