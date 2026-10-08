import { database } from '@/server/db';
import { productDetail } from '@/server/catalog-service';
import { identifier, HttpError } from '@/server/validation';
import { respond } from '@/server/http';
export const dynamic = 'force-dynamic';
export function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return respond(async () => {
    const { id } = await params;
    let valid: string;
    try {
      valid = identifier(id);
    } catch {
      throw new HttpError(404, 'not_found', 'Букет не найден.');
    }
    const p = await productDetail(database(), valid);
    if (!p) throw new HttpError(404, 'not_found', 'Букет не найден.');
    return p;
  });
}
