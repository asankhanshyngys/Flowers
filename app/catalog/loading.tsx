import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
  return (
    <main className="route-state" aria-busy="true">
      <output>Собираем ваши цветы…</output>
      <Skeleton className="h-12 w-64" />
      <div className="product-grid">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-80 w-full" />
        ))}
      </div>
    </main>
  );
}
