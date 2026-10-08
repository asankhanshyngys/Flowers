import assert from 'node:assert/strict';
const origin = 'http://localhost:3000';
// Development-only credentials. This script is pinned to localhost.
const authHeaders = { Origin: origin, 'Content-Type': 'application/json' };
const credentials = {
  email: 'seedy@sites.test',
  password: 'local test password 2026 only',
};
let auth = await fetch(origin + '/api/admin/auth', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    action: 'activate',
    token: 'development-only-activation',
    ...credentials,
  }),
});
if (auth.status === 409)
  auth = await fetch(origin + '/api/admin/auth', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ action: 'login', ...credentials }),
  });
assert.equal(auth.status, 200, await auth.text());
const cookie = auth.headers.get('set-cookie');
assert.ok(cookie.includes('HttpOnly'));
const admin = { ...authHeaders, Cookie: cookie.split(';')[0] };
async function call(path, method = 'GET', body, headers = {}) {
  const response = await fetch(origin + path, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { message: raw };
  }
  console.log(method, path, response.status);
  return { status: response.status, data };
}
const id = 'verification-' + Date.now();
assert.equal((await call('/api/admin/products')).status, 401);
assert.equal(
  (
    await call('/api/admin/products', 'GET', null, {
      'oai-authenticated-user-id': 'forged',
      'oai-authenticated-user-email': 'visitor@example.test',
    })
  ).status,
  401,
);
const category = { id, name: 'Verification', active: true, displayOrder: 99 };
assert.equal(
  (
    await call('/api/admin/categories', 'POST', category, {
      ...admin,
      Origin: 'https://wrong.example',
    })
  ).status,
  403,
);
const createdCategory = await call(
  '/api/admin/categories',
  'POST',
  category,
  admin,
);
assert.equal(createdCategory.status, 201, JSON.stringify(createdCategory));
let product = {
  id,
  name: 'Verification Rose',
  categoryId: id,
  description: 'HTTP verification flower',
  price: 1234,
  color: 'Pink',
  available: true,
  status: 'draft',
  image: '',
  displayOrder: 0,
};
assert.equal(
  (await call('/api/admin/products', 'POST', product, admin)).status,
  201,
);
assert.equal((await call('/api/products/' + id)).status, 404);
let { id: unused, ...update } = product;
assert.equal(
  (
    await call(
      '/api/admin/products/' + id,
      'PUT',
      { ...update, status: 'published', version: 1 },
      admin,
    )
  ).status,
  200,
);
let catalog = await call(
  '/api/catalog?category=' + id + '&q=verification&max=20&available=1',
);
assert.equal(catalog.status, 200);
assert.equal(catalog.data.products[0].price, 1234);
assert.equal(
  (
    await call(
      '/api/selection',
      'POST',
      { items: [{ id, quantity: 2 }] },
      { 'Content-Type': 'application/json' },
    )
  ).data.total,
  2468,
);
assert.equal(
  (
    await call(
      '/api/selection',
      'POST',
      { items: [{ id, quantity: 2, price: 1 }] },
      { 'Content-Type': 'application/json' },
    )
  ).status,
  400,
);
assert.equal(
  (
    await call(
      '/api/admin/products/' + id,
      'PUT',
      { ...update, status: 'published', price: 2000, version: 2 },
      admin,
    )
  ).status,
  200,
);
assert.equal((await call('/api/products/' + id)).data.price, 2000);
assert.equal(
  (
    await call(
      '/api/selection',
      'POST',
      { items: [{ id, quantity: 2 }] },
      { 'Content-Type': 'application/json' },
    )
  ).data.total,
  4000,
);
assert.equal(
  (
    await call(
      '/api/admin/products/' + id,
      'PUT',
      {
        ...update,
        status: 'published',
        price: 2000,
        available: false,
        version: 3,
      },
      admin,
    )
  ).status,
  200,
);
assert.equal(
  (
    await call(
      '/api/selection',
      'POST',
      { items: [{ id, quantity: 1 }] },
      { 'Content-Type': 'application/json' },
    )
  ).status,
  409,
);
assert.equal(
  (
    await call(
      '/api/admin/products/' + id,
      'PUT',
      { ...update, status: 'archived', version: 4 },
      admin,
    )
  ).status,
  200,
);
assert.equal((await call('/api/products/' + id)).status, 404);
assert.equal(
  (
    await call(
      '/api/admin/categories/' + id,
      'PUT',
      { name: 'Verification', active: false, displayOrder: 99, version: 1 },
      admin,
    )
  ).status,
  200,
);
console.log(
  'PASS: HTTP admin authorization, CSRF, create/publish/archive, search/filter, price propagation, selection authority and availability. Verification records archived locally.',
);

assert.equal(
  (await call('/api/admin/auth', 'POST', { action: 'logout' }, admin)).status,
  200,
);
assert.equal(
  (await call('/api/admin/products', 'GET', null, admin)).status,
  401,
);
console.log(
  'PASS: password activation/login, HttpOnly session, logout and revoked session.',
);
