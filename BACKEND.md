# Backend operation

The Next.js app uses Turso/libSQL through `server/sqlite.ts`. Queries use bound parameters. `db/schema.ts` and the Drizzle migrations define the schema. See README.md for configuration and deployment.

Public endpoints: GET `/api/catalog`, `/api/categories`, `/api/products/:id`. Lists exclude draft/archived products and inactive categories. Limits default to 24 and cap at 60. Unavailable products remain browseable but cannot be ordered.

POST `/api/selection` accepts `{items:[{id,quantity}]}`, with at most 50 unique items and quantities 1–20. It returns an authoritative quote without storing orders or reserving stock. Browser storage contains cart IDs/quantities and a display-only snapshot of product details. Cached details keep items visible during refreshes; they never authorize checkout. Only a current response or a matching in-memory server quote under 30 seconds old enables checkout. Quote failures hide the subtotal and offer retry. WhatsApp opens a draft for the customer to send.

Prices use integer tiyn (100 = 1 tenge); admin inputs and URL filters use tenge. Migration 0001 contains the historical one-time currency conversion. Never manually rerun or modify applied migrations.

`npm run db:migrate` records migration names and checksums transactionally. Applied migrations are skipped, preserving merchant edits. An existing unmanaged schema is rejected. Vercel runs migrations before building; a failed build does not roll back committed migrations. Review schema changes for compatibility with the previous deployment and back up data before destructive migrations.

`npm run db:migrate:local` loads `.env.local`. Optional `db:seed:local` is restricted to local file databases. Migrations include demonstration bouquets. The old Sites database is not included.

Admin endpoints support product/category creation and versioned updates. Version conflicts return 409. Products can be archived and categories deactivated. Category choices are capped at 200.

`ADMIN_EMAILS` is a server-only allowlist. Passwords use salted scrypt; hashed session tokens expire after eight hours. Production cookies are Secure, HttpOnly, SameSite=Lax and __Host-prefixed. Admin mutations require JSON and exact `SITE_ORIGIN`. Activation cannot overwrite existing passwords. No public registration exists. See docs/admin-recovery.md for limits and recovery.

APIs use no-store. Storefront data refreshes on navigation, filters and window focus. Images use static paths, public HTTPS URLs or admin uploads to Vercel Blob. POST `/api/admin/images` requires an admin session and the exact site origin. It bounds request bytes, decodes and re-encodes raster photos, strips metadata and stores a public WebP. Uploaded photos are public assets; only upload product photography. Unsaved/replaced uploads remain in storage and can be cleaned up through the Vercel storage dashboard after checking they are not referenced by products.
