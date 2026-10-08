import 'server-only';
import Link from 'next/link';
import AdminCatalog from '@/components/admin-catalog';
import AdminLogin, { AdminLogout } from '@/components/admin-login';
import { requireAdmin } from '@/server/auth';
import { HttpError } from '@/server/validation';
export const metadata = { referrer: 'no-referrer', robots: {index: false, follow: false} };
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    return (
      <main className="admin-login-page">
        <AdminLogin />
        <Link href="/" target="_top">
          ← На главную
        </Link>
      </main>
    );
  }
  return (
    <>
      <div className="admin-session">
        <AdminLogout />
      </div>
      <AdminCatalog />
    </>
  );
}
