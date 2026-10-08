import 'server-only';
import { createClient } from '@libsql/client';
import { SqlDatabase } from './sqlite';
export function bindings() {
  return {
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    ADMIN_SETUP_TOKEN_HASH: process.env.ADMIN_SETUP_TOKEN_HASH,
    SITE_ORIGIN: process.env.SITE_ORIGIN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_EMAIL_FROM: process.env.ADMIN_EMAIL_FROM,
  };
}
let db: SqlDatabase | undefined;
export function database(): SqlDatabase {
  if (db) return db;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL is not configured');
  if (process.env.VERCEL && url.startsWith('file:')) throw new Error('A hosted database is required on Vercel');
  db = new SqlDatabase(createClient({url, authToken: process.env.TURSO_AUTH_TOKEN}));
  return db;
}
