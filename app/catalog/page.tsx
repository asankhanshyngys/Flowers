import Catalog from '@/components/catalog';
import { database } from '@/server/db';
import { listCatalog } from '@/server/catalog-service';
import { catalogQuery } from '@/server/validation';
import { filterParams, readFilters, type CatalogResult } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Каталог цветов | Petal & Stem' };
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (value !== undefined)
      params.set(key, Array.isArray(value) ? value[0] : value);
  }
  const query = filterParams(readFilters(params));
  let initialCatalog: { url: string; data: CatalogResult } | undefined;
  try {
    initialCatalog = {
      url: `/api/catalog?${query}`,
      data: await listCatalog(database(), catalogQuery(query)),
    };
  } catch (error) {
    console.error('Initial catalog unavailable', error);
    // The client shows a recoverable API error instead of a broken page.
  }
  return <Catalog key={query.toString()} initialCatalog={initialCatalog} />;
}
