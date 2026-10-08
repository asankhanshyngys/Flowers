import { database } from '@/server/db';
import { adminCategories, saveCategory } from '@/server/catalog-service';
import { categoryInput } from '@/server/validation';
import { requireAdmin, requireMutationOrigin } from '@/server/auth';
import { respond, jsonBody } from '@/server/http';
export const dynamic = 'force-dynamic';
export function GET() {
  return respond(async () => {
    await requireAdmin();
    return { categories: await adminCategories(database()) };
  });
}
export function POST(request: Request) {
  return respond(async () => {
    await requireAdmin();
    requireMutationOrigin(request);
    return saveCategory(
      database(),
      categoryInput(await jsonBody(request), true),
    );
  }, 201);
}
