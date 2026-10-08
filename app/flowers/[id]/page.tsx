import { notFound } from 'next/navigation';
import Catalog from '@/components/catalog';
import { getProduct } from '@/server/catalog-runtime';
import { identifier } from '@/server/validation';
export const dynamic = 'force-dynamic';
function valid(id: string) {
  try {
    return identifier(id);
  } catch {
    return null;
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = valid(id) ? await getProduct(id) : null;
  return {
    title: p ? `${p.name} | Petal & Stem` : 'Букет не найден | Petal & Stem',
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!valid(id)) notFound();
  const product = await getProduct(id);
  if (!product) notFound();
  return <Catalog selected={product} />;
}
