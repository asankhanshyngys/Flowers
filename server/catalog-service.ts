import type { Product, CatalogResult } from '../lib/catalog';
import {
  HttpError,
  normalize,
  type catalogQuery,
  type productInput,
  type categoryInput,
} from './validation.ts';
type Query = ReturnType<typeof catalogQuery>;
const visible = "p.status = 'published' AND c.active = 1";
const cardColumns =
  'p.id, p.name, c.name AS category, p.color, p.price, p.image, p.available';
type Row = Omit<Product, 'available'> & { available: number };
const product = (row: Row): Product => ({
  ...row,
  available: row.available === 1,
});
export async function listCatalog(
  db: D1Database,
  q: Query,
): Promise<CatalogResult> {
  const where = [visible];
  const values: (string | number)[] = [];
  if (q.category) {
    where.push('(c.name = ? OR c.id = ?)');
    values.push(q.category, q.category);
  }
  if (q.color) {
    where.push('p.color = ?');
    values.push(q.color);
  }
  if (q.min !== undefined) {
    where.push('p.price >= ?');
    values.push(q.min);
  }
  if (q.max !== undefined) {
    where.push('p.price <= ?');
    values.push(q.max);
  }
  if (q.available) where.push('p.available = 1');
  for (const word of q.q.split(' ').filter(Boolean)) {
    where.push("instr(p.search_text || ' ' || c.search_name, ?) > 0");
    values.push(word);
  }
  const predicate = where.join(' AND ');
  const order =
    q.sort === 'price-asc'
      ? 'p.price ASC, p.id ASC'
      : q.sort === 'price-desc'
        ? 'p.price DESC, p.id ASC'
        : 'p.display_order ASC, p.id ASC';
  const [rows, total, categories, colors, overall] = await db.batch([
    db
      .prepare(
        `SELECT ${cardColumns} FROM products p JOIN categories c ON c.id=p.category_id WHERE ${predicate} ORDER BY ${order} LIMIT ? OFFSET ?`,
      )
      .bind(...values, q.limit, (q.page - 1) * q.limit),
    db
      .prepare(
        `SELECT count(*) AS total FROM products p JOIN categories c ON c.id=p.category_id WHERE ${predicate}`,
      )
      .bind(...values),
    db.prepare(
      `SELECT c.id,c.name FROM categories c WHERE c.active=1 AND EXISTS (SELECT 1 FROM products p WHERE p.category_id=c.id AND p.status='published') ORDER BY c.display_order,c.id LIMIT 200`,
    ),
    db.prepare(
      `SELECT DISTINCT p.color FROM products p JOIN categories c ON c.id=p.category_id WHERE ${visible} AND p.color <> '' ORDER BY p.color LIMIT 100`,
    ),
    db.prepare(
      `SELECT count(*) AS total, min(p.price) AS min, max(p.price) AS max FROM products p JOIN categories c ON c.id=p.category_id WHERE ${visible}`,
    ),
  ]);
  // D1 values are projected by explicit SQL; these assertions describe those projections only.
  const count = (total.results as { total: number }[])[0].total;
  const bounds = (
    overall.results as {
      total: number;
      min: number | null;
      max: number | null;
    }[]
  )[0];
  return {
    priceRange:
      bounds.min === null || bounds.max === null
        ? null
        : { min: bounds.min, max: bounds.max },
    products: (rows.results as Row[]).map(product),
    total: count,
    catalogTotal: (overall.results as { total: number }[])[0].total,
    categories: categories.results as { id: string; name: string }[],
    colors: (colors.results as { color: string }[]).map((r) => r.color),
    page: q.page,
    limit: q.limit,
    hasMore: q.page * q.limit < count,
  };
}
export async function productDetail(db: D1Database, id: string) {
  const row = await db
    .prepare(
      `SELECT ${cardColumns},p.description FROM products p JOIN categories c ON c.id=p.category_id WHERE ${visible} AND p.id=?`,
    )
    .bind(id)
    .first<Row>();
  return row ? product(row) : null;
}
export async function quoteSelection(
  db: D1Database,
  items: { id: string; quantity: number }[],
) {
  if (!items.length) return { items: [], total: 0, currency: 'KZT' };
  const rows = await db
    .prepare(
      `SELECT ${cardColumns} FROM products p JOIN categories c ON c.id=p.category_id WHERE ${visible} AND p.id IN (${items.map(() => '?').join(',')})`,
    )
    .bind(...items.map((i) => i.id))
    .all<Row>();
  const lines = items.map((item) => {
    const row = rows.results.find((p) => p.id === item.id);
    if (!row)
      throw new HttpError(
        409,
        'product_missing',
        'Товар из подборки больше не доступен в каталоге. Удалите его и попробуйте снова.',
      );
    if (!row.available)
      throw new HttpError(
        409,
        'product_unavailable',
        `${row.name}: сейчас нет в наличии. Удалите товар и попробуйте снова.`,
      );
    return {
      product: product(row),
      quantity: item.quantity,
      lineTotal: row.price * item.quantity,
    };
  });
  return {
    items: lines,
    total: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    currency: 'KZT',
  };
}
export async function createProduct(
  db: D1Database,
  input: ReturnType<typeof productInput>,
) {
  const category = await db
    .prepare('SELECT id FROM categories WHERE id=?')
    .bind(input.categoryId)
    .first();
  if (!category)
    throw new HttpError(
      400,
      'invalid_category',
      'Выберите существующую категорию.',
    );
  const now = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO products (id,name,description,category_id,color,price,image,available,status,display_order,search_text,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    )
    .bind(
      input.id!,
      input.name,
      input.description,
      input.categoryId,
      input.color,
      input.price,
      input.image,
      Number(input.available),
      input.status,
      input.displayOrder,
      normalize(`${input.name} ${input.description} ${input.color}`),
      now,
      now,
    )
    .run();
  return { id: input.id, version: 1 };
}
export async function updateProduct(
  db: D1Database,
  id: string,
  input: ReturnType<typeof productInput>,
) {
  const category = await db
    .prepare('SELECT id FROM categories WHERE id=?')
    .bind(input.categoryId)
    .first();
  if (!category)
    throw new HttpError(
      400,
      'invalid_category',
      'Выберите существующую категорию.',
    );
  const result = await db
    .prepare(
      'UPDATE products SET name=?,description=?,category_id=?,color=?,price=?,image=?,available=?,status=?,display_order=?,search_text=?,updated_at=?,version=version+1 WHERE id=? AND version=?',
    )
    .bind(
      input.name,
      input.description,
      input.categoryId,
      input.color,
      input.price,
      input.image,
      Number(input.available),
      input.status,
      input.displayOrder,
      normalize(`${input.name} ${input.description} ${input.color}`),
      new Date().toISOString(),
      id,
      input.version!,
    )
    .run();
  if (!result.meta.changes)
    throw new HttpError(
      409,
      'stale_update',
      'Товар изменён или удалён. Обновите данные перед сохранением.',
    );
  return { id, version: input.version! + 1 };
}
export async function saveCategory(
  db: D1Database,
  input: ReturnType<typeof categoryInput>,
  id?: string,
) {
  if (!id) {
    await db
      .prepare(
        'INSERT INTO categories (id,name,search_name,active,display_order,updated_at) VALUES (?,?,?,?,?,?)',
      )
      .bind(
        input.id!,
        input.name,
        normalize(input.name),
        Number(input.active),
        input.displayOrder,
        new Date().toISOString(),
      )
      .run();
    return { id: input.id, version: 1 };
  }
  const result = await db
    .prepare(
      'UPDATE categories SET name=?,search_name=?,active=?,display_order=?,updated_at=?,version=version+1 WHERE id=? AND version=?',
    )
    .bind(
      input.name,
      normalize(input.name),
      Number(input.active),
      input.displayOrder,
      new Date().toISOString(),
      id,
      input.version!,
    )
    .run();
  if (!result.meta.changes)
    throw new HttpError(
      409,
      'stale_update',
      'Категория изменена или удалена. Обновите данные перед сохранением.',
    );
  return { id, version: input.version! + 1 };
}
export async function adminProducts(db: D1Database, page: number) {
  const [rows, total] = await db.batch([
    db
      .prepare(
        'SELECT id,name,description,category_id AS categoryId,color,price,image,available,status,display_order AS displayOrder,version FROM products ORDER BY updated_at DESC,id LIMIT 50 OFFSET ?',
      )
      .bind((page - 1) * 50),
    db.prepare('SELECT count(*) AS total FROM products'),
  ]);
  return {
    products: rows.results,
    total: (total.results as { total: number }[])[0].total,
    page,
    limit: 50,
  };
}
export async function adminCategories(db: D1Database) {
  const result = await db
    .prepare(
      'SELECT id,name,active,display_order AS displayOrder,version FROM categories ORDER BY display_order,id LIMIT 200',
    )
    .all();
  return result.results;
}
