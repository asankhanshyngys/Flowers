import AdminLogin from '@/components/admin-login';
export const metadata = { referrer: 'no-referrer', robots: {index: false, follow: false} };
export default function ResetPage() {
  return <main className="admin-login-page"><AdminLogin /></main>;
}
