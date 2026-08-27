import assert from "node:assert/strict";
import test from "node:test";

test("renders the brandless Lorem Ipsum storefront metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /<html[^>]*lang=["']tr["']/i);
  assert.match(html, /<title>Lorem Ipsum \| Dolor Sit Amet<\/title>/i);
  assert.match(html, /Lorem ipsum/i);
  assert.doesNotMatch(html, /Starter Project|codex-preview|Dr\. Animal|HOCl/i);
});

test("renders a product detail page with product metadata and structured data", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("product-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/products/lorem-ipsum-dolor-sit-amet", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<title>Lorem Ipsum Dolor Sit Amet \| Lorem Ipsum<\/title>/i);
  assert.match(html, /application\/ld\+json/i);
  assert.match(html, /LRM-001/);
  assert.doesNotMatch(html, /Dr\.? Animal|HOCl/i);
});

test("renders the shoe example with size variants and variant offers", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("shoe-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/products/lorem-ipsum-calceus", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Lorem Ipsum Calceus/);
  assert.match(html, /lorem-shoe\.webp/);
  assert.match(html, /LRM-006-39/);
  assert.match(html, /LRM-006-44/);
  assert.match(html, /aria-pressed="true"/);
  assert.doesNotMatch(html, /Dr\.? Animal|HOCl|veteriner|kedi|köpek/i);
});
