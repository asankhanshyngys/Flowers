import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { requestReset, resetPassword, recoveryEmail } from '../server/admin-recovery.ts';
import { resetMailer } from '../server/admin-email.ts';
import {
  activate,
  login,
  digest,
  sessionAdmin,
  limitLogin,
} from '../server/admin-password.ts';
let mf, db;
const email = 'admin@example.test',
  password = 'a long test password for admin';
before(async () => {
  mf = new Miniflare({
    modules: true,
    script: 'export default {fetch(){return new Response("ok")}}',
    compatibilityDate: '2026-05-15',
    d1Databases: ['DB'],
  });
  db = await mf.getD1Database('DB');
  for (const file of ['drizzle/0002_admin_password_login.sql', 'drizzle/0005_nasty_baron_strucker.sql'])
  for (const sql of readFileSync(file, 'utf8')
    .split('--> statement-breakpoint')
    .filter((s) => s.trim()))
    await db.prepare(sql).run();
});
after(async () => await mf?.dispose());
test('activation requires a private token and an allowed admin email', async () => {
  await assert.rejects(
    activate(db, email, password, 'wrong', digest('invite'), email),
    (e) => e.status === 403,
  );
  await assert.rejects(
    activate(
      db,
      'visitor@example.test',
      password,
      'invite',
      digest('invite'),
      email,
    ),
    (e) => e.status === 403,
  );
  await assert.rejects(
    activate(db, email, 'short', 'invite', digest('invite'), email),
    (e) => e.status === 400,
  );
  const token = await activate(
    db,
    email,
    password,
    'invite',
    digest('invite'),
    email,
  );
  assert.equal(await sessionAdmin(db, token, email), email);
  await assert.rejects(
    activate(
      db,
      email,
      'different long password',
      'invite',
      digest('invite'),
      email,
    ),
    (e) => e.status === 409,
  );
});
test('login, invalid password, fake/expired sessions and allowlist revocation', async () => {
  await assert.rejects(
    login(db, email, 'wrong', email),
    (e) => e.status === 401,
  );
  await assert.rejects(
    login(db, 'nobody@example.test', password, email),
    (e) => e.status === 401,
  );
  const token = await login(db, email, password, email);
  assert.equal(await sessionAdmin(db, token, email), email);
  assert.equal(await sessionAdmin(db, token, 'other@example.test'), null);
  assert.equal(await sessionAdmin(db, 'fake', email), null);
  await db
    .prepare('UPDATE admin_sessions SET expires_at=0 WHERE token_hash=?')
    .bind(digest(token))
    .run();
  assert.equal(await sessionAdmin(db, token, email), null);
  const row = await db
    .prepare('SELECT password_hash FROM admin_accounts WHERE email=?')
    .bind(email)
    .first();
  assert.ok(!row.password_hash.includes(password));
});
test('login rate limiting is persistent and blocks the eleventh attempt', async () => {
  for (let i = 0; i < 10; i++) await limitLogin(db, 'test-ip');
  await assert.rejects(limitLogin(db, 'test-ip'), (e) => e.status === 429);
});


test('email attempt limit survives different IPs; expiry restores access', async () => {
  for (let i = 0; i < 5; i++) await limitLogin(db, `ip-${i}`, 'Case@Example.test');
  await assert.rejects(limitLogin(db, 'new-ip', 'case@example.test'), e => e.status === 429);
  await db.prepare('UPDATE admin_login_limits SET expires_at=0 WHERE key=?').bind(`login:email:${digest('case@example.test')}`).run();
  await limitLogin(db, 'another-ip', 'case@example.test');
});

test('recovery request is limited separately from login and by email', async () => {
  for (let i = 0; i < 3; i++) await limitLogin(db, `recovery-ip-${i}`, email, 'forgot');
  await assert.rejects(limitLogin(db, 'recovery-other-ip', email, 'forgot'), e => e.status === 429);
  await limitLogin(db, 'recovery-other-ip', email, 'login');
});

test('unknown/revoked emails send nothing and have the same result', async () => {
  const send = async () => assert.fail('must not send');
  assert.equal(await requestReset(db, 'nobody@example.test', email, send), undefined);
  assert.equal(await requestReset(db, email, 'other@example.test', send), undefined);
  assert.equal(recoveryEmail(' ADMIN@Example.test '), email);
  assert.throws(() => recoveryEmail('invalid'), e => e.status === 400);
});

test('reset stores only hashes, rejects invalid/expired links and weak passwords', async () => {
  let token;
  await requestReset(db, email, email, async (to, value) => { assert.equal(to, email); token = value; });
  assert.match(token, /^[a-f0-9]{64}$/);
  const row = await db.prepare('SELECT * FROM admin_password_resets WHERE token_hash=?').bind(digest(token)).first();
  assert.equal(row.email, email);
  assert.ok(!JSON.stringify(row).includes(token));
  await assert.rejects(resetPassword(db, email, password, 'a'.repeat(64), email), e => e.status === 400);
  await assert.rejects(resetPassword(db, email, 'short', token, email), e => e.status === 400);
  await assert.rejects(resetPassword(db, email, password, token, 'other@example.test'), e => e.status === 400);
  await db.prepare('UPDATE admin_password_resets SET expires_at=0 WHERE token_hash=?').bind(digest(token)).run();
  await assert.rejects(resetPassword(db, email, password, token, email), e => e.status === 400);
});

test('single-use reset invalidates old passwords, every old session and sibling links', async () => {
  const session = await login(db, email, password, email);
  const tokens = [];
  for (let i = 0; i < 2; i++) await requestReset(db, email, email, async (_to, token) => { tokens.push(token); });
  const next = 'a completely new secure password';
  const attempts = await Promise.allSettled([
    resetPassword(db, email, next, tokens[0], email),
    resetPassword(db, email, next, tokens[0], email),
  ]);
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(await sessionAdmin(db, session, email), null);
  await assert.rejects(login(db, email, password, email), e => e.status === 401);
  assert.equal(await sessionAdmin(db, await login(db, email, next, email), email), email);
  await assert.rejects(resetPassword(db, email, password, tokens[1], email), e => e.status === 400);
});

test('delivery failure revokes undelivered token without revealing the account', async (t) => {
  t.mock.method(console, 'error', () => {});
  let token;
  assert.equal(await requestReset(db, email, email, async (_to, value) => { token=value; throw new Error('provider failed'); }), undefined);
  assert.equal(await db.prepare('SELECT * FROM admin_password_resets WHERE token_hash=?').bind(digest(token)).first(), null);
});

test('mailer requires configuration and uses fixed origin plus fragment token', async (t) => {
  assert.throws(() => resetMailer({}), e => e.status === 503);
  let sent;
  t.mock.method(globalThis, 'fetch', async (url, init) => { sent={url, ...init}; return new Response('{}'); });
  await resetMailer({RESEND_API_KEY:'test-only', ADMIN_EMAIL_FROM:'sender@example.test', SITE_ORIGIN:'https://shop.example.test'})(email, 'b'.repeat(64));
  assert.equal(sent.url, 'https://api.resend.com/emails');
  const body = JSON.parse(sent.body);
  assert.deepEqual(body.to, [email]);
  assert.ok(body.text.includes('https://shop.example.test/admin/reset#reset='));
  assert.ok(!body.text.includes('test-only'));
});
