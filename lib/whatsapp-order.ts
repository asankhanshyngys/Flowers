import { money, type Product } from './catalog';

export type OrderQuote = {
  items: { product: Product; quantity: number; lineTotal: number }[];
  total: number;
  currency: string;
};

export function whatsappOrderUrl(phone: string, quote: OrderQuote) {
  const digits = phone.replace(/[\s()+-]/g, '');
  if (!/^[1-9]\d{6,14}$/.test(digits))
    throw new Error('Укажите номер WhatsApp с кодом страны.');
  if (!quote.items.length) throw new Error('Корзина пуста.');
  const message = [
    'Здравствуйте! Хочу заказать букеты в Petal & Stem:',
    '',
    ...quote.items.map(({ product, quantity, lineTotal }, index) =>
      `${index + 1}. ${product.name} (${product.id}) — ${quantity} шт. × ${money(product.price)} = ${money(lineTotal)}`,
    ),
    '',
    `Итого за букеты: ${money(quote.total)}`,
    'Подтвердите, пожалуйста, наличие, стоимость доставки и способ оплаты.',
  ].join('\n');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
