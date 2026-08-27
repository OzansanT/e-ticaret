# Brandless E‑Commerce Platform

A responsive, brand-neutral commerce application that keeps customer-facing placeholder copy in Lorem Ipsum while the merchant catalog and commercial integrations are being prepared.

## Included

- Responsive storefront with search, category filters and a persistent cart
- Product-detail routes with canonical metadata, Open Graph/X metadata and Product JSON-LD
- SKU, product-image URL, product variants and size-level inventory model
- One optimized, brandless generated shoe example with selectable sizes 39–44
- D1-backed customers, saved addresses, orders, order items and payment sessions
- Server-authoritative pricing and inventory deduction with negative-stock database guards
- Configurable shipping methods, free-shipping thresholds and country tax rates
- Idempotent checkout writes and D1-backed rate limits for sensitive customer actions
- Customer cancellation with atomic stock restoration and payment-failure recovery
- Printable order invoices, order event history and manual refund-request tracking
- Verified-purchase product reviews with an admin moderation queue
- Crawlable category pages with canonical metadata, ItemList JSON-LD and sitemap entries
- Coupon rules, campaign rules, loyalty points and referral links
- Consent-gated first-party analytics and abandoned-cart snapshots
- PWA install/offline shell, push-subscription storage and notification handling
- ChatGPT sign-in for account/order-history pages
- Admin product, variant, image upload, inventory, campaign, coupon and order-status management
- R2-backed product-image uploads with content-type, size and path validation
- Signed provider-neutral payment webhook foundation
- Automated structure, promotion, security, migration and rendered-output tests

## Routes

```text
/
/products/:slug
/categories/:slug
/checkout
/orders/:token
/orders/:token/invoice
/account
/admin
```

## Persistence

The Sites manifest requests a D1 `DB` binding and an R2 `BUCKET` binding. Schema changes live in `db/schema.ts`; generated migrations are kept in `drizzle/`.

The first catalog, checkout or authorized admin request seeds the bounded Lorem Ipsum catalog and default promotion records. The catalog includes one optimized brandless shoe example; remaining products intentionally use a neutral placeholder until a merchant uploads catalog assets from `/admin`.

## Runtime configuration

Copy `.env.example` to `.env` for local work. Hosted values must be configured through the deployment environment.

- `ADMIN_EMAILS`: comma-separated admin allowlist
- `PAYMENT_PROVIDER`: provider identifier; defaults to `manual`
- `PAYMENT_WEBHOOK_SECRET`: HMAC SHA-256 secret for payment callbacks
- `VAPID_PUBLIC_KEY`: public Web Push application-server key

The current `manual` payment adapter records a pending order and payment session; it never charges a customer or moves money for a refund. Refund actions create auditable requests that a future provider adapter can execute and complete through the signed webhook. A selected payment provider, merchant credentials, provider session creation and webhook mapping are required before accepting real payments. Push subscriptions can be stored after a VAPID public key is configured; sending notifications still requires the matching private key and a scheduled sender.

## Run and verify

Requires Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

```bash
npm run lint
npm test
```
