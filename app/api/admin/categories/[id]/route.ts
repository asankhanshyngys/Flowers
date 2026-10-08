import { database } from '@/server/db';
import { saveCategory } from '@/server/catalog-service';
import { identifier, categoryInput } from '@/server/validation';
import { requireAdmin, requireMutationOrigin } from '@/server/auth';
import { respond, jsonBody } from '@/server/http';
export function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return respond(async () => {
    await requireAdmin();
    requireMutationOrigin(request);
    const { id } = await params;
    return saveCategory(
      database(),
      categoryInput(await jsonBody(request), false),
      identifier(id),
    );
  });
}
