import { database } from '@/server/db';
import { adminProducts, createProduct } from '@/server/catalog-service';
import { catalogQuery, productInput } from '@/server/validation';
import { requireAdmin, requireMutationOrigin } from '@/server/auth';
import { respond, jsonBody } from '@/server/http';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return respond(async () => {
    await requireAdmin();
    const q = catalogQuery(new URL(request.url).searchParams);
    return adminProducts(database(), q.page);
  });
}
export function POST(request: Request) {
  return respond(async () => {
    await requireAdmin();
    requireMutationOrigin(request);
    return createProduct(
      database(),
      productInput(await jsonBody(request), true),
    );
  }, 201);
}
