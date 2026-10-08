import type { Product } from './catalog';
type CartQuote = {items: {product: Product; quantity: number; lineTotal: number}[]; total: number; currency: string};
export function matchingQuote(bag: Record<string, number>, quote: CartQuote) {
  return quote.items.length === Object.keys(bag).length && quote.items.every(item => bag[item.product.id] === item.quantity);
}
// Device-cached prices are display estimates, never checkout authority.
export function cartPreview(bag: Record<string, number>, cached: unknown) {
  const source = cached && typeof cached === 'object' && 'items' in cached && Array.isArray(cached.items) ? cached.items : [];
  return Object.entries(bag).map(([id, quantity]) => {
    const item = source.find(item => item?.product?.id === id);
    const p = item?.product;
    const valid = p && typeof p.name === 'string' && typeof p.image === 'string' && Number.isSafeInteger(p.price) && p.price >= 0;
    return {id, quantity, product: valid ? p as Product : null};
  });
}
