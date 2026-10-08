export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function normalize(text: string) {
  return text.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');
}
export function object(
  value: unknown,
  keys: string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new HttpError(400, 'invalid_input', 'Ожидается объект JSON.');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !keys.includes(key)))
    throw new HttpError(400, 'invalid_input', 'Неизвестное поле.');
  return record;
}
export function text(
  value: unknown,
  name: string,
  max: number,
  optional = false,
) {
  if (optional && value === undefined) return '';
  if (
    typeof value !== 'string' ||
    value.trim().normalize('NFKC').length > max ||
    (!optional && !value.trim())
  )
    throw new HttpError(
      400,
      'invalid_input',
      `${name}: допустимо ${optional ? '0' : '1'}–${max} символов.`,
    );
  return value.trim().normalize('NFKC');
}
export function integer(value: unknown, name: string, max: number, min = 0) {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new HttpError(
      400,
      'invalid_input',
      `${name}: требуется целое число от ${min} до ${max}.`,
    );
  return value;
}
export function boolean(value: unknown, name: string) {
  if (typeof value !== 'boolean')
    throw new HttpError(
      400,
      'invalid_input',
      `${name}: требуется логическое значение.`,
    );
  return value;
}
export function identifier(value: unknown) {
  const id = text(value, 'Идентификатор', 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new HttpError(
      400,
      'invalid_identifier',
      'Используйте строчные латинские буквы, цифры и одиночные дефисы.',
    );
  return id;
}
export function imagePath(value: unknown) {
  const path = text(value, 'Фото', 2048, true);
  if (!path) return '';
  if (
    /^\/images\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(path) &&
    !path.includes('..')
  )
    return path;
  try {
    const url = new URL(path);
    if (url.protocol === 'https:' && !url.username && !url.password)
      return url.href;
  } catch {}
  throw new HttpError(
    400,
    'invalid_image',
    'Укажите общедоступный HTTPS-адрес фото или путь в /images/.',
  );
}
export function productInput(value: unknown, creating: boolean) {
  const r = object(value, [
    'id',
    'name',
    'description',
    'categoryId',
    'color',
    'price',
    'image',
    'available',
    'status',
    'displayOrder',
    'version',
  ]);
  const status = text(r.status, 'Статус', 10);
  if (!['draft', 'published', 'archived'].includes(status))
    throw new HttpError(400, 'invalid_status', 'Неверный статус публикации.');
  return {
    id: creating ? identifier(r.id) : undefined,
    name: text(r.name, 'Название', 160),
    description: text(r.description, 'Описание', 6000, true),
    categoryId: identifier(r.categoryId),
    color: text(r.color, 'Цвет', 50, true),
    price: integer(r.price, 'Цена в тиынах', 100000000),
    image: imagePath(r.image),
    available: boolean(r.available, 'Наличие'),
    status,
    displayOrder: integer(r.displayOrder ?? 0, 'Порядок отображения', 1000000),
    version: creating ? undefined : integer(r.version, 'Версия', 2147483647, 1),
  };
}
export function categoryInput(value: unknown, creating: boolean) {
  const r = object(value, ['id', 'name', 'active', 'displayOrder', 'version']);
  return {
    id: creating ? identifier(r.id) : undefined,
    name: text(r.name, 'Название', 80),
    active: boolean(r.active, 'Активность'),
    displayOrder: integer(r.displayOrder ?? 0, 'Порядок отображения', 1000000),
    version: creating ? undefined : integer(r.version, 'Версия', 2147483647, 1),
  };
}
const sorts = ['collection', 'price-asc', 'price-desc'];
function paramInt(
  raw: string | null,
  name: string,
  fallback: number,
  max: number,
  min = 1,
) {
  if (raw === null) return fallback;
  if (!/^\d+$/.test(raw))
    throw new HttpError(400, 'invalid_query', `Неверное значение: ${name}.`);
  return integer(Number(raw), name, max, min);
}
function priceParam(raw: string | null) {
  if (raw === null || raw === '') return undefined;
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(raw))
    throw new HttpError(400, 'invalid_query', 'Неверный диапазон цен.');
  const [whole, fraction = ''] = raw.split('.');
  return integer(
    Number(whole) * 100 + Number(fraction.padEnd(2, '0')),
    'Цена',
    100000000,
  );
}
export function catalogQuery(p: URLSearchParams) {
  const allowed = [
    'q',
    'category',
    'color',
    'min',
    'max',
    'available',
    'sort',
    'page',
    'limit',
  ];
  for (const key of p.keys())
    if (!allowed.includes(key) || p.getAll(key).length !== 1)
      throw new HttpError(
        400,
        'invalid_query',
        'Неизвестный или повторяющийся параметр запроса.',
      );
  const q = normalize(text(p.get('q') ?? '', 'Поиск', 200, true));
  if (q.split(' ').filter(Boolean).length > 20)
    throw new HttpError(
      400,
      'invalid_query',
      'В поисковом запросе допускается не более 20 слов.',
    );
  const category = text(p.get('category') ?? '', 'Категория', 80, true);
  const color = text(p.get('color') ?? '', 'Цвет', 50, true);
  const sort = p.get('sort') || 'collection';
  if (!sorts.includes(sort))
    throw new HttpError(400, 'invalid_query', 'Неизвестный способ сортировки.');
  const available = p.get('available');
  if (available !== null && !['0', '1'].includes(available))
    throw new HttpError(400, 'invalid_query', 'Неверный фильтр наличия.');
  const min = priceParam(p.get('min'));
  const max = priceParam(p.get('max'));
  if (min !== undefined && max !== undefined && min > max)
    throw new HttpError(
      400,
      'invalid_query',
      'Минимальная цена превышает максимальную.',
    );
  return {
    q,
    category: ['Все цветы', 'All flowers'].includes(category) ? '' : category,
    color: ['Все цвета', 'All colors'].includes(color) ? '' : color,
    min,
    max,
    available: available === '1',
    sort,
    page: paramInt(p.get('page'), 'page', 1, 10000),
    limit: paramInt(p.get('limit'), 'limit', 24, 60),
  };
}
export function selectionInput(value: unknown) {
  const r = object(value, ['items']);
  if (!Array.isArray(r.items) || r.items.length > 50)
    throw new HttpError(
      400,
      'invalid_selection',
      'В подборке может быть не более 50 товаров.',
    );
  const ids = new Set<string>();
  return r.items.map((item) => {
    const row = object(item, ['id', 'quantity']);
    const id = identifier(row.id);
    if (ids.has(id))
      throw new HttpError(
        400,
        'invalid_selection',
        'Объедините повторяющиеся позиции товара.',
      );
    ids.add(id);
    return { id, quantity: integer(row.quantity, 'Количество', 20, 1) };
  });
}
