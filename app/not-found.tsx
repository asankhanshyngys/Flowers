import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="route-state">
      <h1>Букет не найден.</h1>
      <p>Не удалось найти этот букет.</p>
      <Link href="/catalog">Вернуться в каталог →</Link>
    </main>
  );
}
