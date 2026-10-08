import { database } from '@/server/db';
import { respond } from '@/server/http';
export const dynamic = 'force-dynamic';
export function GET() {
  return respond(async () => {
    const r = await database()
      .prepare(
        "SELECT c.id,c.name FROM categories c WHERE c.active=1 AND EXISTS (SELECT 1 FROM products p WHERE p.category_id=c.id AND p.status='published') ORDER BY c.display_order,c.id LIMIT 200",
      )
      .all();
    return { categories: r.results };
  });
}
