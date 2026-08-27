# Brandless E‑Commerce Platform

A responsive, brand-neutral commerce application that keeps customer-facing placeholder copy in Lorem Ipsum while the merchant catalog and commercial integrations are being prepared.

## Included

- Responsive storefront with search, category filters and a persistent cart
- Product-detail routes with canonical metadata, Open Graph/X metadata and Product JSON-LD
- SKU, inventory, product-image URL and three-feature catalog model
- D1-backed customers, saved addresses, orders, order items and payment sessions
- Server-authoritative pricing and inventory deduction with negative-stock database guards
- Coupon rules, campaign rules, loyalty points and referral links
- Consent-gated first-party analytics and abandoned-cart snapshots
- PWA install/offline shell, push-subscription storage and notification handling
- ChatGPT sign-in for account/order-history pages
- Admin product, image upload, inventory, campaign, coupon and order-status management
- R2-backed product-image uploads with content-type, size and path validation
- Signed provider-neutral payment webhook foundation
- Automated structure, promotion, security, migration and rendered-output tests

## Routes

```text
/
/products/:slug
/checkout
/orders/:token
/account
/admin
```

## Persistence

The Sites manifest requests a D1 `DB` binding and an R2 `BUCKET` binding. Schema changes live in `db/schema.ts`; generated migrations are kept in `drizzle/`.

The first checkout or authorized admin request seeds the bounded Lorem Ipsum placeholder catalog and default promotion records. Product photos are intentionally represented by a neutral placeholder until a merchant uploads actual catalog assets from `/admin`.

## Runtime configuration

Copy `.env.example` to `.env` for local work. Hosted values must be configured through the deployment environment.

- `ADMIN_EMAILS`: comma-separated admin allowlist
- `PAYMENT_PROVIDER`: provider identifier; defaults to `manual`
- `PAYMENT_WEBHOOK_SECRET`: HMAC SHA-256 secret for payment callbacks
- `VAPID_PUBLIC_KEY`: public Web Push application-server key

The current `manual` payment adapter records a pending order and payment session; it never charges a customer. A selected payment provider, merchant credentials, provider session creation and webhook mapping are required before accepting real payments. Push subscriptions can be stored after a VAPID public key is configured; sending notifications still requires the matching private key and a scheduled sender.

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
