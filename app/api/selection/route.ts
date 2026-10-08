import { database } from '@/server/db';
import { quoteSelection } from '@/server/catalog-service';
import { selectionInput } from '@/server/validation';
import { respond, jsonBody } from '@/server/http';
export const dynamic = 'force-dynamic';
// Read-only quote: no orders, stock reservation, payments or persisted client prices.
export function POST(request: Request) {
  return respond(async () =>
    quoteSelection(database(), selectionInput(await jsonBody(request))),
  );
}
