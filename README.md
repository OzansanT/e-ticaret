# Brandless E‑Commerce Template

Responsive, brand-neutral storefront template using Lorem Ipsum placeholder content throughout the customer-facing interface.

## Included

- Responsive navbar, left category rail, main catalog, right summary rail and footer
- Lorem Ipsum product, campaign, navigation and footer placeholders
- Product search and category filtering
- Locally persisted cart with quantity controls
- Best-offer comparison engine
- Installable PWA shell and offline navigation fallback
- Central CSS entry point and feature-based modules
- Automated source, structure, campaign and rendered-output tests

Checkout remains disabled until a real payment, inventory and order service is selected.

## Structure

```text
e-ticaret/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css             # Global CSS entry
├── features/
│   ├── index.ts                # Feature entry
│   ├── storefront/
│   ├── catalog/
│   ├── cart/
│   └── pwa/
├── styles/
│   ├── main.css                # CSS distribution entry
│   └── features/
├── public/
└── tests/
```

## Run

Requires Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Checks:

```bash
npm run lint
npm test
```
