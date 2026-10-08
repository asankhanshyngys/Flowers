import { createClient } from '@libsql/client';
import { readFile } from 'node:fs/promises';
const url = process.env.TURSO_DATABASE_URL;
if (process.argv.length > 2 || !url?.startsWith('file:') || process.env.VERCEL) throw new Error('Seed is restricted to a local SQLite file.');
const db = createClient({url});
try {
  const sql = await readFile(new URL('./seed-local.sql', import.meta.url),'utf8');
  await db.executeMultiple(sql);
  console.log('Local demo data seeded.');
} finally { db.close(); }
