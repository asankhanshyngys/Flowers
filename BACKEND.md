# Backend operation

The Sites/Vinext app uses the `DB` D1 binding. `db/schema.ts` and the generated Drizzle migrations define the only catalog database. Runtime queries use prepared D1 statements. No runtime DDL, production seeding, external database, payment system or persistent order/cart model is introduced.

Public endpoints: GET /api/catalog (q/category/color/min/max/available/sort/page/limit), GET /api/categories, GET /api/products/:id. Product list limits default to 24 and cap at 60. Stable ordering includes immutable product IDs. Draft/archived products and inactive-category products are excluded everywhere. Unavailable products remain browseable but selection validation rejects them. USD prices use integer cents.

POST /api/selection accepts only {items:[{id,quantity}]}; at most 50 unique items and quantities 1–20. It returns a fresh authoritative quote without creating orders or reserving stock. Browser storage contains only device-local product IDs and quantities. A quote failure hides the subtotal and offers recovery.

/admin uses app-owned password sessions, not ChatGPT identity. ADMIN_EMAILS remains a server-only allowlist. Passwords use salted scrypt (N=16384,r=8,p=5), sessions use random 256-bit tokens with only SHA-256 token hashes stored, and expire after 8 hours. Production cookies are Secure, HttpOnly, SameSite=Lax, and __Host-prefixed. Every admin API request checks session and allowlist; mutations also require JSON and exact SITE_ORIGIN. Login/activation are limited to 10 attempts per IP and 40 globally per 15-minute bucket. No public registration or customer accounts exist.

Set ADMIN_EMAILS and SITE_ORIGIN through Sites environment settings before publishing. For local development place them in ignored .dev.vars (use seedy@sites.test for the starter's development identity; origin http://localhost:3000). .env.example documents server configuration. No credentials are committed.

Admin API: GET/POST /api/admin/products, PUT /api/admin/products/:id; GET/POST /api/admin/categories, PUT /api/admin/categories/:id. POST supplies immutable id; PUT supplies current version. Version mismatch returns 409, preventing silent lost updates. Products can be archived and categories deactivated rather than destructively deleted. Category picker is capped at 200 categories for this boutique catalog.

Run npm run db:generate after schema changes; review SQL before publishing. Run npm run db:migrate:local to apply migrations to the local D1 instance (never production). npm run db:seed:local imports optional development fixtures only. Sites owns hosted migration execution. Applied migrations are immutable. The production database starts empty; create merchant-approved records through /admin.

All API responses are no-store and storefront resources refresh on navigation/filter change/window focus. Product metadata is deduplicated only within a request. No cross-request product cache exists to invalidate. List responses omit descriptions; detail responses include them. Images use existing static /images paths or merchant-supplied public HTTPS URLs; no uploads or privileged media proxy is introduced.

Verification: npm run test:backend; npm run typecheck; npm run lint:catalog; npm run build. Starter-wide lint findings are outside this backend scope.


## Russian locale and KZT
The storefront and admin use Russian (`ru-KZ`) and KZT. Integer prices and quote totals are stored in tiyn (100 = 1 tenge); admin inputs and URL min/max use tenge.
Migration `0001_russian_tenge.sql` converts existing USD cents once at the National Bank of Kazakhstan rate for 2026-09-07: 1 USD = 456.56 KZT, rounding to the nearest tiyn. Source: https://nationalbank.kz/ru/exchangerates/ezhednevnye-oficialnye-rynochnye-kursy-valyut . Apply through the tracked migration command only. Do not run the SQL manually or apply an exchange rate at rendering time. Development seeds already use KZT. Existing fixture copy is translated in the database; newly authored copy should be entered in Russian.


## Password activation and recovery
Set ADMIN_SETUP_TOKEN_HASH to SHA-256 of a securely generated 32-byte activation token. Deliver the token privately to the owner as /admin#activate=TOKEN (fragments do not enter request URLs). Activation is restricted to ADMIN_EMAILS and cannot overwrite an existing account. Never commit or log the token or password. After activation the user signs in at /admin. For lost passwords, an operator must verify ownership, revoke sessions and deliberately reset the account before issuing a fresh activation token; automatic email recovery is not configured.
Local tests use explicitly development-only credentials and token in tests/runtime-local.mjs; set the matching hash in ignored .dev.vars only. Run tests/admin-auth.test.mjs for isolated activation, credential, expiry and rate-limit tests. Never use development credentials in production.
