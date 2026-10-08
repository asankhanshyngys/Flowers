'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="route-state">
      <h1>Что-то пошло не так.</h1>
      <p>Не удалось загрузить коллекцию. Попробуйте снова.</p>
      <button onClick={reset}>Попробовать снова</button>
      <Link href="/catalog">Вернуться в каталог</Link>
    </main>
  );
}
