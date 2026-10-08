import { randomBytes } from 'node:crypto';
import { allowedEmail, digest, hashPassword } from './admin-password.ts';
import { HttpError } from './validation.ts';

export const recoveryMessage = 'Если этот email зарегистрирован, письмо со ссылкой придёт в ближайшие минуты. Проверьте папку «Спам».';
export function recoveryEmail(value: unknown) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    throw new HttpError(400, 'invalid_input', 'Введите корректный email.');
  return value.trim().toLowerCase();
}
export async function requestReset(
  db: D1Database, email: string, allowed: string | undefined,
  send: (email: string, token: string) => Promise<void>,
) {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare('DELETE FROM admin_password_resets WHERE expires_at<=?').bind(now).run();
  const account = await db.prepare('SELECT version FROM admin_accounts WHERE email=?').bind(email).first<{version: number}>();
  if (!account || !allowedEmail(email, allowed)) return;
  const token = randomBytes(32).toString('hex');
  await db.prepare('INSERT INTO admin_password_resets(token_hash,email,version,expires_at) VALUES (?,?,?,?)')
    .bind(digest(token), email, account.version, now + 900).run();
  try { await send(email, token); }
  catch {
    await db.prepare('DELETE FROM admin_password_resets WHERE token_hash=?').bind(digest(token)).run();
    // Never log the link, email, provider response, or credential.
    console.error('Admin recovery email delivery failed');
  }
}
export async function resetPassword(db: D1Database, email: string, password: string, token: string, allowed?: string) {
  const invalid = () => new HttpError(400, 'invalid_reset', 'Ссылка недействительна или истекла. Запросите новое письмо.');
  if (!/^[a-f0-9]{64}$/.test(token) || !allowedEmail(email, allowed)) throw invalid();
  const hash = await hashPassword(password);
  // One atomic conditional update consumes the token by changing the account version.
  // Simultaneous uses, older links and every old session become invalid together.
  const account = await db.prepare(`UPDATE admin_accounts SET password_hash=?, version=version+1
    WHERE email=? AND version=(SELECT version FROM admin_password_resets
      WHERE token_hash=? AND email=? AND expires_at>?) RETURNING version`)
    .bind(hash, email, digest(token), email, Math.floor(Date.now()/1000)).first();
  if (!account) throw invalid();
}
