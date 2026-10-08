'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { apiError } from '@/lib/api-error';
import { requestJson } from '@/lib/request-json';
export default function AdminLogin() {
  const linkRead = useRef(false);
  const [mode, setMode] = useState<'login' | 'activate' | 'forgot' | 'reset'>('login');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    function readLink() {
      const params = new URLSearchParams(location.hash.slice(1));
      const reset = params.get('reset');
      const activate = params.get('activate');
      if (reset || activate) {
        linkRead.current = true;
        setToken(reset || activate || '');
        setMode(reset ? 'reset' : 'activate');
        setEmail(params.get('email') || '');
        // Keep the bearer token in component memory, out of history and referrers.
        history.replaceState(null, '', location.pathname);
      } else if (!linkRead.current && location.pathname.endsWith('/reset')) {
        setMode('forgot');
      }
    }
    readLink();
    window.addEventListener('hashchange', readLink);
    return () => window.removeEventListener('hashchange', readLink);
  }, []);
  const newPassword = mode === 'activate' || mode === 'reset';
  function switchMode(next: 'login' | 'forgot') {
    setMode(next); setError(''); setMessage(''); setToken(''); setComplete(false);
  }
  return (
    <section className="admin-login">
      <p className="eyebrow">PETAL &amp; STEM · АДМИНИСТРАТОР</p>
      <h1>{complete ? 'Пароль изменён' : mode === 'forgot' ? 'Восстановить пароль' : newPassword ? 'Создайте пароль' : 'Вход в админку'}</h1>
      <p>{complete ? 'Все предыдущие сеансы завершены. Войдите с новым паролем.' : mode === 'forgot' ? 'Введите email администратора. Ссылка действует 15 минут.' : newPassword ? 'Задайте новый пароль от 15 до 128 символов.' : 'Введите email администратора и пароль.'}</p>
      {!complete && <form key={mode} onSubmit={async (event) => {
        event.preventDefault(); setError(''); setMessage('');
        const form = new FormData(event.currentTarget);
        const password = form.get('password');
        if (newPassword && password !== form.get('confirm')) { setError('Пароли не совпадают.'); return; }
        setBusy(true);
        try {
          const {response, result} = await requestJson('/api/admin/auth', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: mode, email, password, token}),
          });
          if (!response.ok) throw new Error(apiError(result, 'Не удалось выполнить запрос.'));
          if (mode === 'forgot') {
            setMessage('Если этот email зарегистрирован, письмо со ссылкой придёт в ближайшие минуты. Проверьте папку «Спам».');
          } else if (mode === 'reset') {
            setToken(''); setComplete(true);
          } else location.assign('/admin');
        } catch (err) { setError(err instanceof Error ? err.message : 'Не удалось выполнить запрос.'); }
        finally { setBusy(false); }
      }}>
        <label htmlFor="login-email">Email администратора</label>
        <Input id="login-email" name="email" type="email" autoComplete="username" maxLength={254} required disabled={busy} value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== 'forgot' && <>
          <label htmlFor="login-password">{newPassword ? 'Новый пароль' : 'Пароль'}</label>
          <Input id="login-password" name="password" type="password" autoComplete={newPassword ? 'new-password' : 'current-password'} minLength={newPassword ? 15 : 1} maxLength={128} required disabled={busy} />
        </>}
        {newPassword && <>
          <label htmlFor="login-confirm">Повторите пароль</label>
          <Input id="login-confirm" name="confirm" type="password" autoComplete="new-password" minLength={15} maxLength={128} required disabled={busy} />
          <p className="login-help">Можно использовать длинную фразу.</p>
        </>}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Подождите…' : mode === 'forgot' ? 'Отправить ссылку' : mode === 'reset' ? 'Сохранить новый пароль' : mode === 'activate' ? 'Создать пароль и войти' : 'Войти'}</Button>
      </form>}
      {complete ? <a className="home-text-link" href="/admin">Войти с новым паролем</a> :
        <Button className="admin-recovery-link" type="button" variant="outline" disabled={busy} onClick={() => switchMode(mode === 'login' || mode === 'reset' ? 'forgot' : 'login')}>
          {mode === 'login' ? 'Забыли пароль?' : mode === 'reset' ? 'Запросить новую ссылку' : 'Вернуться ко входу'}
        </Button>}
      {mode === 'login' && <p className="login-help">Первый вход — по персональной ссылке активации от владельца сайта. После 5 попыток входа для одного email действует пауза до 15 минут.</p>}
    </section>
  );
}
export function AdminLogout() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const r = await fetch('/api/admin/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'logout' }),
            });
            if (!r.ok) throw new Error('Не удалось выйти.');
            location.assign('/admin');
          } catch {
            setError('Не удалось выйти. Попробуйте снова.');
            setBusy(false);
          }
        }}
      >
        Выйти
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
