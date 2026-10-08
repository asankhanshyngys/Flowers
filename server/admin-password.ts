import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { HttpError } from './validation.ts';
export const sessionSeconds = 8 * 60 * 60;
export const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export function allowedEmail(email: string, allowed?: string) {
  return (allowed || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .includes(email);
}
export function credentials(value: unknown) {
  if (
    !value ||
    typeof value !== 'object' ||
    !('email' in value) ||
    !('password' in value)
  )
    throw new HttpError(400, 'invalid_input', 'Введите email и пароль.');
  const { email, password } = value;
  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    typeof password !== 'string' ||
    password.length > 128
  )
    throw new HttpError(400, 'invalid_input', 'Проверьте email и пароль.');
  return { email: email.trim().toLowerCase(), password };
}
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(
      password,
      salt,
      32,
      { N: 16384, r: 8, p: 5, maxmem: 32 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
export async function hashPassword(password: string) {
  if (password.length < 15 || password.length > 128)
    throw new HttpError(
      400,
      'password_length',
      'Пароль должен содержать от 15 до 128 символов.',
    );
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1:${salt}:${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [version, salt, key] = stored.split(':');
  if (
    version !== 'scrypt-v1' ||
    !/^[a-f0-9]{32}$/.test(salt || '') ||
    !/^[a-f0-9]{64}$/.test(key || '')
  )
    return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(key, 'hex'));
}
export async function limitLogin(
  db: D1Database, ip: string, email = '', purpose = 'login',
) {
  const now = Math.floor(Date.now() / 1000);
  const recovery = purpose === 'forgot';
  const limits: [string, number][] = [
    [`${purpose}:global`, recovery ? 20 : 40],
    [`${purpose}:ip:${digest(ip)}`, recovery ? 5 : 10],
    ...(email ? [[`${purpose}:email:${digest(email.trim().toLowerCase())}`, recovery ? 3 : 5] as [string, number]] : []),
  ];
  // An atomic, persistent 15-minute window per key, anchored to its first attempt.
  const rows = await db.batch(limits.map(([key]) => db.prepare(
    `INSERT INTO admin_login_limits (key,attempts,expires_at) VALUES (?,1,?)
     ON CONFLICT(key) DO UPDATE SET
       attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,
       expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END
     RETURNING attempts`,
  ).bind(key, now + 900, now, now)));
  if (rows.some((r, i) => (r.results[0] as { attempts: number }).attempts > limits[i][1]))
    throw new HttpError(429, 'rate_limited', 'Слишком много попыток. Повторите через 15 минут.');
  await db.batch([
    db.prepare('DELETE FROM admin_login_limits WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').bind(now),
  ]);
}
export async function createSession(
  db: D1Database,
  email: string,
  version: number,
) {
  const token = randomBytes(32).toString('hex');
  await db
    .prepare(
      'INSERT INTO admin_sessions (token_hash,email,version,expires_at) VALUES (?,?,?,?)',
    )
    .bind(
      digest(token),
      email,
      version,
      Math.floor(Date.now() / 1000) + sessionSeconds,
    )
    .run();
  return token;
}
export async function sessionAdmin(
  db: D1Database,
  token: string,
  allowed?: string,
) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const account = await db
    .prepare(
      'SELECT a.email FROM admin_sessions s JOIN admin_accounts a ON a.email=s.email AND a.version=s.version WHERE s.token_hash=? AND s.expires_at>?',
    )
    .bind(digest(token), Math.floor(Date.now() / 1000))
    .first<{ email: string }>();
  return account && allowedEmail(account.email, allowed) ? account.email : null;
}
export async function login(
  db: D1Database,
  email: string,
  password: string,
  allowed?: string,
) {
  const account = await db
    .prepare('SELECT password_hash,version FROM admin_accounts WHERE email=?')
    .bind(email)
    .first<{ password_hash: string; version: number }>();
  // Unknown accounts pay the same password derivation cost.
  const valid = await verifyPassword(
    password,
    account?.password_hash || `scrypt-v1:${'0'.repeat(32)}:${'0'.repeat(64)}`,
  );
  if (!account || !valid || !allowedEmail(email, allowed))
    throw new HttpError(
      401,
      'invalid_credentials',
      'Неверный email или пароль.',
    );
  return createSession(db, email, account.version);
}
export async function activate(
  db: D1Database,
  email: string,
  password: string,
  token: string,
  expectedHash?: string,
  allowed?: string,
) {
  const valid =
    !!expectedHash &&
    /^[a-f0-9]{64}$/.test(expectedHash) &&
    timingSafeEqual(
      Buffer.from(digest(token), 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  if (!valid || !allowedEmail(email, allowed))
    throw new HttpError(
      403,
      'invalid_invitation',
      'Ссылка активации недействительна.',
    );
  const hash = await hashPassword(password);
  const result = await db
    .prepare(
      'INSERT INTO admin_accounts(email,password_hash) VALUES (?,?) ON CONFLICT(email) DO NOTHING',
    )
    .bind(email, hash)
    .run();
  if (!result.meta.changes)
    throw new HttpError(
      409,
      'already_activated',
      'Пароль уже создан. Войдите в свой аккаунт.',
    );
  return createSession(db, email, 1);
}
