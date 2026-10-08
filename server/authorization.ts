import { HttpError } from './validation.ts';
export function authorizeAdmin(h: Headers, allowed: string | undefined) {
  const id = h.get('oai-authenticated-user-id');
  const email = h.get('oai-authenticated-user-email');
  if (!id || !email)
    throw new HttpError(
      401,
      'unauthorized',
      'Войдите, чтобы управлять каталогом.',
    );
  const emails = (allowed || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (!emails.includes(email.toLowerCase()))
    throw new HttpError(
      403,
      'forbidden',
      'У этой учётной записи нет доступа к управлению каталогом.',
    );
  return id;
}
