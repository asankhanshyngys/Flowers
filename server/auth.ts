import 'server-only';
import { cookies } from 'next/headers';
import { bindings, database } from './db';
import { sessionAdmin } from './admin-password';
import { HttpError } from './validation';
export async function requireAdmin() {
  const token = (await cookies()).get(adminCookieName())?.value;
  if (token) {
    const email = await sessionAdmin(
      database(),
      token,
      bindings().ADMIN_EMAILS,
    );
    if (email) return email;
  }
  throw new HttpError(
    401,
    'unauthorized',
    'Войдите, чтобы управлять каталогом.',
  );
}
export function requireMutationOrigin(request: Request) {
  const configured = bindings().SITE_ORIGIN;
  const origin = request.headers.get('origin');
  if (!configured || !origin || origin !== configured)
    throw new HttpError(
      403,
      'invalid_origin',
      'Запрос отправлен не со страницы магазина.',
    );
}

export function adminCookieName() {
  return bindings().SITE_ORIGIN?.startsWith('https://')
    ? '__Host-petal-admin'
    : 'petal-admin-local';
}
