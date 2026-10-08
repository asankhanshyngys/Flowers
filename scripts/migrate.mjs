import { createClient } from '@libsql/client';
import { applyMigrations } from './migrations.mjs';
const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error('Connect Turso and set TURSO_DATABASE_URL before deploying.');
if (process.env.VERCEL_ENV === 'preview' && process.env.ALLOW_PREVIEW_DATABASE !== 'true') {
  throw new Error('Preview deployment requires a separate database and ALLOW_PREVIEW_DATABASE=true in Preview settings.');
}
if (process.env.VERCEL && url.startsWith('file:')) throw new Error('Local files cannot be used as a production database.');
const client = createClient({url, authToken: process.env.TURSO_AUTH_TOKEN});
try { await applyMigrations(client); console.log('Database migrations are up to date.'); }
finally { client.close(); }
