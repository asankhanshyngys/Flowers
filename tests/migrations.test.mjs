import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { applyMigrations } from '../scripts/migrations.mjs';
import { SqlDatabase } from '../server/sqlite.ts';

test('all migrations create demo catalog and auth tables; rerun preserves prices and merchant edits', async () => {
  const client = createClient({url:'file::memory:'});
  try {
    await applyMigrations(client);
    const before = await client.execute('SELECT id,price FROM products ORDER BY id');
    assert.equal(before.rows.length,4);
    assert.equal((await client.execute('SELECT count(*) AS n FROM __flowers_migrations')).rows[0].n,8);
    await client.execute("UPDATE products SET price=12345,version=version+1 WHERE id='garden-party'");
    await applyMigrations(client);
    assert.equal((await client.execute("SELECT price FROM products WHERE id='garden-party'")).rows[0].price,12345);
    for (const name of ['admin_accounts','admin_sessions','admin_login_limits','admin_password_resets'])
      assert.ok((await client.execute({sql:"SELECT name FROM sqlite_master WHERE name=?",args:[name]})).rows.length);
  } finally { client.close(); }
});

test('SQL batch rolls back earlier writes when a later statement fails', async () => {
  const client = createClient({url:'file::memory:'});
  const db = new SqlDatabase(client);
  try {
    await db.prepare('CREATE TABLE test_items (id TEXT PRIMARY KEY)').run();
    await assert.rejects(db.batch([db.prepare("INSERT INTO test_items VALUES ('same')"),db.prepare("INSERT INTO test_items VALUES ('same')")]));
    assert.equal((await db.prepare('SELECT count(*) AS n FROM test_items').first()).n,0);
  } finally { client.close(); }
});

test('untracked preexisting database is rejected rather than converted again', async () => {
  const client=createClient({url:'file::memory:'});
  try {
    await client.execute('CREATE TABLE products (id TEXT PRIMARY KEY)');
    await assert.rejects(applyMigrations(client),/unmanaged database/);
  } finally { client.close(); }
});
