import { HttpError } from './validation.ts';
interface MailConfig { RESEND_API_KEY?: string; ADMIN_EMAIL_FROM?: string; SITE_ORIGIN?: string }
export function resetMailer(env: MailConfig) {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL_FROM || !env.SITE_ORIGIN)
    throw new HttpError(503, 'email_unavailable', 'Восстановление по email ещё не настроено. Обратитесь к владельцу сайта.');
  const origin = new URL(env.SITE_ORIGIN);
  if (origin.protocol !== 'https:' || origin.username || origin.password)
    throw new HttpError(503, 'email_unavailable', 'Восстановление по email временно недоступно.');
  const key = env.RESEND_API_KEY;
  const from = env.ADMIN_EMAIL_FROM;
  return async (email: string, token: string) => {
    const link = new URL('/admin/reset', origin.origin);
    link.hash = new URLSearchParams({reset: token, email}).toString();
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({from, to: [email], subject: 'Petal & Stem — восстановление пароля',
        text: `Чтобы задать новый пароль администратора, откройте ссылку:\n\n${link.href}\n\nСсылка действует 15 минут и может быть использована один раз. Если вы не запрашивали сброс, просто проигнорируйте письмо. Ваш пароль не изменится.`,
      }),
    });
    if (!response.ok) throw new Error('Email delivery rejected');
  };
}
