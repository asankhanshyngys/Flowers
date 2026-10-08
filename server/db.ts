import 'server-only';
import { env } from 'cloudflare:workers';
interface Bindings {
  DB?: D1Database;
  ADMIN_EMAILS?: string;
  ADMIN_SETUP_TOKEN_HASH?: string;
  SITE_ORIGIN?: string;
  RESEND_API_KEY?: string;
  ADMIN_EMAIL_FROM?: string;
}
export function bindings(): Bindings {
  return env;
}
export function database(): D1Database {
  const db = bindings().DB;
  if (!db) throw new Error('Catalog database binding is missing');
  return db;
}
