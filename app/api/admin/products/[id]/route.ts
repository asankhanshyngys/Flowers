import { database } from '@/server/db';
import { updateProduct } from '@/server/catalog-service';
import { identifier, productInput } from '@/server/validation';
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
    return updateProduct(
      database(),
      identifier(id),
      productInput(await jsonBody(request), false),
    );
  });
}
