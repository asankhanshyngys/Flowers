import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';
import { SqlDatabase } from '../server/sqlite.ts';
import {
  catalogQuery,
  productInput,
  categoryInput,
  selectionInput,
  HttpError,
  identifier,
} from '../server/validation.ts';
import {
  listCatalog,
  productDetail,
  createProduct,
  updateProduct,
  saveCategory,
  quoteSelection,
} from '../server/catalog-service.ts';
import { authorizeAdmin } from '../server/authorization.ts';
let mf, db;
const query = (value = '') => catalogQuery(new URLSearchParams(value));
const input = (id, rest = {}) =>
  productInput(
    {
      id,
      name: id,
      categoryId: 'roses',
      price: 6800,
      color: 'Pink',
      description: 'Soft pink roses',
      image: '',
      available: true,
      status: 'published',
      displayOrder: 0,
      ...rest,
    },
    true,
  );
before(async () => {
  mf = createClient({url: 'file::memory:'});
  db = new SqlDatabase(mf);
  const sql = readFileSync(
    new URL('../drizzle/0000_lumpy_betty_brant.sql', import.meta.url),
    'utf8',
  );
  for (const statement of sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean))
    await db.prepare(statement).run();
});
after(async () => {
  mf?.close();
});
test('empty database returns an empty catalog', async () => {
  const r = await listCatalog(db, query());
  assert.equal(r.total, 0);
  assert.equal(r.catalogTotal, 0);
  assert.equal(r.priceRange, null);
  assert.deepEqual(r.categories, []);
});
test('published records share one public source; drafts and archives stay private', async () => {
  await saveCategory(
    db,
    categoryInput({ id: 'roses', name: 'Roses', active: true }, true),
  );
  await saveCategory(
    db,
    categoryInput({ id: 'hidden', name: 'Hidden', active: false }, true),
  );
  for (const p of [
    input('pink-roses'),
    input('budget-roses', { price: 3000 }),
    input('white-roses', { price: 9000, color: 'White', description: '' }),
    input('unavailable', { available: false }),
    input('draft', { status: 'draft' }),
    input('archived', { status: 'archived' }),
    input('inactive-category', { categoryId: 'hidden' }),
  ])
    await createProduct(db, p);
  const r = await listCatalog(db, query());
  assert.equal(r.total, 4);
  assert.equal(r.catalogTotal, 4);
  assert.deepEqual(r.categories, [{ id: 'roses', name: 'Roses' }]);
  assert.equal(await productDetail(db, 'draft'), null);
  assert.equal(await productDetail(db, 'archived'), null);
  assert.equal(await productDetail(db, 'inactive-category'), null);
  assert.equal(await productDetail(db, 'not-found'), null);
  assert.equal((await productDetail(db, 'white-roses')).description, '');
  assert.ok(!('description' in r.products[0]));
});
test('price slider bounds cover published products independently of filters', async () => {
  const full = await listCatalog(db, query());
  const narrowed = await listCatalog(db, query('min=30.01&max=89.99'));
  assert.deepEqual(narrowed.priceRange, full.priceRange);
  assert.ok(narrowed.products.every((p) => p.price >= 3001 && p.price <= 8999));
  assert.ok(full.priceRange.min <= full.priceRange.max);
});

test('search, price, color, category and availability compose', async () => {
  const r = await listCatalog(
    db,
    query('q=++PiNk++&category=Roses&color=Pink&max=50&available=1'),
  );
  assert.deepEqual(
    r.products.map((p) => p.id),
    ['budget-roses'],
  );
  assert.equal(
    (await listCatalog(db, query('q=%25_%27%20OR%201%3D1'))).total,
    0,
  );
  assert.equal((await listCatalog(db, query('category=missing'))).total, 0);
});
test('numeric sorting and stable pagination', async () => {
  const first = await listCatalog(db, query('sort=price-asc&limit=2'));
  const second = await listCatalog(db, query('sort=price-asc&limit=2&page=2'));
  assert.deepEqual(
    first.products.map((p) => p.price),
    [3000, 6800],
  );
  assert.equal(first.hasMore, true);
  assert.equal(second.hasMore, false);
  assert.equal(
    new Set([...first.products, ...second.products].map((p) => p.id)).size,
    4,
  );
  assert.equal(
    (await listCatalog(db, query('sort=price-desc'))).products[0].price,
    9000,
  );
});
test('invalid query boundaries fail predictably', () => {
  for (const q of [
    'limit=61',
    'page=0',
    'page=-1',
    'sort=popular',
    'min=99&max=1',
    'available=yes',
    'max=-1',
    'max=1.001',
    'q=' + 'x'.repeat(201),
    'q=' + 'a+'.repeat(30),
    'sort=collection&sort=price-asc',
    'unknown=1',
  ])
    assert.throws(() => query(q), HttpError);
  assert.equal(query('q=%20%20').q, '');
});
test('admin guard rejects missing identity, wrong role and missing configuration', () => {
  assert.throws(
    () => authorizeAdmin(new Headers(), 'owner@example.test'),
    (e) => e.status === 401,
  );
  const h = new Headers({
    'oai-authenticated-user-id': 'site-user',
    'oai-authenticated-user-email': 'owner@example.test',
  });
  assert.throws(
    () => authorizeAdmin(h, ''),
    (e) => e.status === 403,
  );
  assert.throws(
    () => authorizeAdmin(h, 'other@example.test'),
    (e) => e.status === 403,
  );
  assert.equal(authorizeAdmin(h, 'owner@example.test'), 'site-user');
});
test('validation and constraints reject invalid commercial values', async () => {
  for (const change of [
    { price: -1 },
    { price: 1.5 },
    { available: 'true' },
    { status: 'invisible' },
    { id: 'UPPER' },
    { image: 'javascript:alert(1)' },
    { image: '/images/../secret' },
    { admin: true },
  ])
    assert.throws(() => input('invalid', change), HttpError);
  await assert.rejects(() => createProduct(db, input('pink-roses')), /UNIQUE/);
  await assert.rejects(
    () => createProduct(db, input('wrong-category', { categoryId: 'missing' })),
    (e) => e.status === 400,
  );
  await assert.rejects(
    () =>
      db.prepare("UPDATE products SET price=-1 WHERE id='pink-roses'").run(),
    /CHECK/,
  );
});
test('price changes propagate to details, catalog and quotes without cache', async () => {
  await updateProduct(
    db,
    'pink-roses',
    productInput(
      { ...input('pink-roses'), id: undefined, price: 7200, version: 1 },
      false,
    ),
  );
  assert.equal((await productDetail(db, 'pink-roses')).price, 7200);
  assert.equal(
    (await listCatalog(db, query('q=pink-roses'))).products[0].price,
    7200,
  );
  const quote = await quoteSelection(
    db,
    selectionInput({ items: [{ id: 'pink-roses', quantity: 2 }] }),
  );
  assert.equal(quote.total, 14400);
  assert.equal(quote.items[0].lineTotal, 14400);
});
test('optimistic versioning rejects stale updates', async () => {
  await assert.rejects(
    () =>
      updateProduct(
        db,
        'pink-roses',
        productInput(
          { ...input('pink-roses'), id: undefined, version: 1 },
          false,
        ),
      ),
    (e) => e.status === 409,
  );
  assert.equal((await productDetail(db, 'pink-roses')).price, 7200);
});
test('selection rejects prices, duplicates, invalid quantities and hidden or unavailable products', async () => {
  for (const value of [
    { items: [{ id: 'pink-roses', quantity: 1, price: 1 }] },
    { items: [{ id: 'pink-roses', quantity: 0 }] },
    { items: [{ id: 'pink-roses', quantity: -1 }] },
    { items: [{ id: 'pink-roses', quantity: 21 }] },
    {
      items: [
        { id: 'pink-roses', quantity: 1 },
        { id: 'pink-roses', quantity: 1 },
      ],
    },
  ])
    assert.throws(() => selectionInput(value), HttpError);
  for (const id of ['unavailable', 'draft', 'missing'])
    await assert.rejects(
      () => quoteSelection(db, [{ id, quantity: 1 }]),
      (e) => e.status === 409,
    );
  assert.equal((await quoteSelection(db, [])).total, 0);
});
test('availability and category changes apply immediately', async () => {
  await updateProduct(
    db,
    'pink-roses',
    productInput(
      {
        ...input('pink-roses'),
        id: undefined,
        price: 7200,
        available: false,
        version: 2,
      },
      false,
    ),
  );
  await assert.rejects(
    () => quoteSelection(db, [{ id: 'pink-roses', quantity: 1 }]),
    (e) => e.code === 'product_unavailable',
  );
  assert.equal((await productDetail(db, 'pink-roses')).available, false);
  await saveCategory(
    db,
    categoryInput({ name: 'Roses', active: false, version: 1 }, false),
    'roses',
  );
  assert.equal((await listCatalog(db, query())).total, 0);
  assert.equal(await productDetail(db, 'budget-roses'), null);
});

test('body parsing bounds requests and normalizes failures', async () => {
  const { jsonBody, respond } = await import('../server/http.ts');
  await assert.rejects(
    () =>
      jsonBody(
        new Request('https://test/', {
          method: 'POST',
          headers: { 'content-type': 'text/plain' },
          body: '{}',
        }),
      ),
    (e) => e.status === 415,
  );
  await assert.rejects(
    () =>
      jsonBody(
        new Request('https://test/', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: 'not-json',
        }),
      ),
    (e) => e.status === 400,
  );
  await assert.rejects(
    () =>
      jsonBody(
        new Request('https://test/', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: 'x'.repeat(33000),
        }),
      ),
    (e) => e.status === 413,
  );
  const original = console.error;
  console.error = () => {};
  try {
    const r = await respond(async () => {
      throw new Error('private database failure details');
    });
    assert.equal(r.status, 503);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.ok(!(await r.text()).includes('private database'));
  } finally {
    console.error = original;
  }
});

test('Russian KZT migration converts prices once and enables Cyrillic search', async () => {
  const before = await db
    .prepare("SELECT price FROM products WHERE id='pink-roses'")
    .first();
  const sql = readFileSync(
    new URL('../drizzle/0001_russian_tenge.sql', import.meta.url),
    'utf8',
  );
  for (const statement of sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean))
    await db.prepare(statement).run();
  const after = await db
    .prepare("SELECT price FROM products WHERE id='pink-roses'")
    .first();
  assert.equal(after.price, Math.floor((before.price * 45656 + 50) / 100));
  await db.prepare("UPDATE categories SET active=1 WHERE id='roses'").run();
  const result = await listCatalog(
    db,
    query('q=' + encodeURIComponent('розы')),
  );
  assert.ok(result.products.length > 0);
  assert.ok(result.categories.some((c) => c.name === 'Розы'));
  assert.equal((await quoteSelection(db, [])).currency, 'KZT');
});

test('fresh Russian development seed uses KZT and preserves links and images', async () => {
  await db.prepare('DELETE FROM products').run();
  await db.prepare('DELETE FROM categories').run();
  const seed = readFileSync(
    new URL('../scripts/seed-local.sql', import.meta.url),
    'utf8',
  );
  for (const statement of seed
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean))
    await db.prepare(statement).run();
  const r = await listCatalog(db, query('q=' + encodeURIComponent('розы')));
  assert.equal(r.products[0].id, 'rose-reverie');
  assert.equal(r.products[0].price, 3104608);
  assert.equal(r.products[0].image, '/images/roses.jpg');
  assert.equal(r.products[0].name, 'Розовая мечта');
});
