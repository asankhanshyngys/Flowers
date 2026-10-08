import { waitUntil } from 'cloudflare:workers';
import { recoveryEmail, recoveryMessage, requestReset, resetPassword } from '@/server/admin-recovery';
import { resetMailer } from '@/server/admin-email';
import { cookies } from 'next/headers';
import { bindings, database } from '@/server/db';
import { adminCookieName, requireMutationOrigin } from '@/server/auth';
import { jsonBody, respond } from '@/server/http';
import {
  activate,
  credentials,
  digest,
  limitLogin,
  login,
  sessionSeconds,
} from '@/server/admin-password';
import { HttpError } from '@/server/validation';
export async function POST(request: Request) {
  let token: string | undefined;
  let logout = false;
  const response = await respond(async () => {
    requireMutationOrigin(request);
    const body: unknown = await jsonBody(request);
    if (!body || typeof body !== 'object' || !('action' in body))
      throw new HttpError(400, 'invalid_input', 'Неизвестное действие.');
    const db = database();
    if (body.action === 'logout') {
      const current = (await cookies()).get(adminCookieName())?.value;
      if (current)
        await db
          .prepare('DELETE FROM admin_sessions WHERE token_hash=?')
          .bind(digest(current))
          .run();
      logout = true;
      return { ok: true };
    }
    if (!['login', 'activate', 'forgot', 'reset'].includes(String(body.action)))
      throw new HttpError(400, 'invalid_input', 'Неизвестное действие.');
    const env = bindings();
    const email = recoveryEmail('email' in body ? body.email : undefined);
    await limitLogin(db, request.headers.get('cf-connecting-ip') || 'unknown', email,
      body.action === 'forgot' ? 'forgot' : body.action === 'reset' ? 'reset' : 'login');
    if (body.action === 'forgot') {
      const send = resetMailer(env);
      // Account lookup and delivery run after the same generic response for all emails.
      waitUntil(requestReset(db, email, env.ADMIN_EMAILS, send).catch(() => {
        console.error('Admin recovery request failed');
      }));
      return { ok: true, message: recoveryMessage };
    }
    const { password } = credentials(body);
    if (body.action === 'reset') {
      const resetToken = 'token' in body && typeof body.token === 'string' ? body.token : '';
      await resetPassword(db, email, password, resetToken, env.ADMIN_EMAILS);
      logout = true;
      return { ok: true };
    }
    if (body.action === 'activate') {
      const invitation =
        'token' in body && typeof body.token === 'string' ? body.token : '';
      if (invitation.length > 128)
        throw new HttpError(400, 'invalid_input', 'Неверная ссылка.');
      token = await activate(
        db,
        email,
        password,
        invitation,
        env.ADMIN_SETUP_TOKEN_HASH,
        env.ADMIN_EMAILS,
      );
    } else token = await login(db, email, password, env.ADMIN_EMAILS);
    return { ok: true };
  });
  if (response.ok && (token || logout))
    response.headers.set(
      'Set-Cookie',
      `${adminCookieName()}=${token || ''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${logout ? 0 : sessionSeconds}${bindings().SITE_ORIGIN?.startsWith('https://') ? '; Secure' : ''}`,
    );
  if (response.status === 429) response.headers.set('Retry-After', '900');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
