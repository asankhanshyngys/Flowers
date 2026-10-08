# Flowers / Petal & Stem

Flower catalog with product pages, a cart and WhatsApp checkout, plus an authenticated admin catalog.

## Development
Requires Node.js 22.13 or later.

```sh
npm ci
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Create an ignored `.dev.vars` from `.env.example`, using your admin email and the local site origin. Admin activation requires a private activation token; see BACKEND.md. Never commit secrets or real customer data.

## Verification
```sh
npm run typecheck
node --experimental-transform-types --test tests/admin-auth.test.mjs tests/backend.test.mjs tests/catalog.test.mjs tests/request-json.test.mjs
npm run build
```

## Hosting and data
The app uses Vinext, React and Cloudflare D1. GitHub stores the source; GitHub Pages cannot run this server-backed app. Production data, passwords, runtime secrets and hosting access are not included. Database migrations and demo fixtures are included. `.openai/hosting.json` references the existing Sites deployment; copying this source does not transfer that deployment.

## Current admin recovery
See docs/admin-recovery.md for the current reset flow and attempt limits; it supersedes the older recovery notes in BACKEND.md. Automatic email reset needs a Resend secret and a verified sender before emails can be sent.

## Demo content
Example products and the Flowers world map/reviews remain demonstration content. Image credits are in public/images/CREDITS.md.
