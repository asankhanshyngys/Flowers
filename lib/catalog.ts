export type Product = {
  id: string;
  name: string;
  category: string;
  color: string;
  price: number;
  image: string;
  description?: string;
  available: boolean;
};
export type CatalogResult = {
  products: Product[];
  categories: { id: string; name: string }[];
  colors: string[];
  total: number;
  catalogTotal: number;
  priceRange: { min: number; max: number } | null;
  page: number;
  limit: number;
  hasMore: boolean;
};
export type Filters = {
  q: string;
  category: string;
  color: string;
  min: string;
  max: string;
  available: boolean;
  sort: string;
  page: string;
};
export const defaults: Filters = {
  q: '',
  category: 'Все цветы',
  color: 'Все цвета',
  min: '',
  max: '',
  available: false,
  sort: 'collection',
  page: '1',
};
export function readFilters(p: URLSearchParams): Filters {
  return {
    q: p.get('q') || '',
    category: p.get('category') || defaults.category,
    color: p.get('color') || defaults.color,
    min: p.get('min') || '',
    max: p.get('max') || '',
    available: p.get('available') === '1',
    sort: p.get('sort') || 'collection',
    page: p.get('page') || '1',
  };
}
export function filterParams(f: Filters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f))
    if (v !== defaults[k as keyof Filters] && v !== '')
      p.set(k, typeof v === 'boolean' ? '1' : String(v));
  return p;
}
export const money = (cents: number) =>
  new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
