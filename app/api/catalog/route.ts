import { database } from '@/server/db';
import { listCatalog } from '@/server/catalog-service';
import { catalogQuery } from '@/server/validation';
import { respond } from '@/server/http';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return respond(() =>
    listCatalog(database(), catalogQuery(new URL(request.url).searchParams)),
  );
}
