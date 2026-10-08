# Flowers / Petal & Stem

Russian flower catalog with product pages, a cart, WhatsApp checkout and a password-protected admin catalog. Built with Next.js and Turso/libSQL. Prices are in KZT.

## Local development

Requires Node.js 22.13 or later.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`. Set your admin email and keep the local SQLite URL.
3. Run `npm run db:migrate:local`, then `npm run dev`.
4. Run `node scripts/admin-invite.mjs http://localhost:3000`, set the generated hash in `.env.local`, restart the server and privately open the generated activation link.

Migrations include demo bouquets. Never commit environment files, database files or private activation links.

## Deploy to Vercel

1. Import this GitHub repository into Vercel as a Next.js project. `vercel.json` supplies the build command.
2. Connect a Turso database to the **production** environment. It supplies `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
3. Add production variables `ADMIN_EMAILS` (your admin email) and `SITE_ORIGIN` (the exact HTTPS site address, without a trailing slash).
4. Run `node scripts/admin-invite.mjs https://YOUR-SITE.vercel.app`. Add its hash as `ADMIN_SETUP_TOKEN_HASH` in Vercel. Keep the activation link private.
5. Deploy. Migrations run before the Next.js build. Open the private link to create your admin password.
6. Connect a public Vercel Blob store to production to enable device photo uploads. This adds `BLOB_READ_WRITE_TOKEN`. Admin uploads accept JPG, PNG and WebP up to 20 MB and resize before transfer.
7. For automatic password-reset emails, add `RESEND_API_KEY` and a verified sender in `ADMIN_EMAIL_FROM`, redeploy and verify inbox delivery. See [recovery instructions](docs/admin-recovery.md).

Once Vercel has GitHub repository access, pushes to the production branch trigger deployments. You can also redeploy through the Vercel dashboard. Environment changes require a new deployment.

Preview deployments require a **separate** database and `ALLOW_PREVIEW_DATABASE=true`. Do not connect previews to production data. Local SQLite files are rejected on Vercel because its filesystem is not persistent storage.

This export does not include the old site's database, passwords or secrets. A new database starts with demonstration products. Manage your catalog through `/admin`. WhatsApp checkout opens a message draft that the customer must send.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

Before publishing, test catalog → product → cart → WhatsApp, including quantities and totals. Verify admin sign-in and password-reset delivery separately.

Example products and the Flowers world map/reviews are demonstration content. Image credits are in `public/images/CREDITS.md`.
