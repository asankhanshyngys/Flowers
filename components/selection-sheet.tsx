'use client';
import { useEffect } from 'react';
import { ShoppingBag, Minus, Plus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import ProductImage from './product-image';
import { money } from '@/lib/catalog';
import { whatsappOrderUrl } from '@/lib/whatsapp-order';
import type { useSelection } from '@/hooks/use-catalog';
export default function SelectionSheet({
  open,
  onOpenChange,
  selection,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  selection: ReturnType<typeof useSelection>;
}) {
  const {
    bag,
    quantity,
    notice,
    pending,
    quote,
    clear,
    remove,
    retryMutation,
  } = selection;
  const count = Object.values(bag).reduce((a, b) => a + b, 0);
  useEffect(() => {
    if (open) quote.retry();
  }, [open, quote.retry]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="selection-sheet">
        <SheetHeader>
          <SheetTitle>Корзина ({count})</SheetTitle>
          <SheetDescription>
            Корзина сохраняется на этом устройстве. Цены и наличие проверяются
            по каталогу.
          </SheetDescription>
        </SheetHeader>
        {pending && (
          <output aria-live="polite">Добавляем букет в корзину…</output>
        )}
        {!count && !pending ? (
          <Empty>
            <ShoppingBag />
            <EmptyTitle>Ваша корзина пока пуста</EmptyTitle>
            <EmptyDescription>
              Добавьте букет из каталога или со страницы букета.
            </EmptyDescription>
          </Empty>
        ) : (
          <>
            {quote.loading && <output>Проверяем цены и наличие…</output>}
            {quote.error && (
              <div role="alert">
                <p>{quote.error}</p>
                <p>Можно удалить отдельный букет и сохранить остальные.</p>
                <ul className="cart-recovery">
                  {Object.entries(bag).map(([id, qty]) => {
                    const cached = quote.previousData?.items.find(
                      (item) => item.product.id === id,
                    )?.product;
                    return (
                      <li key={id}>
                        <span>
                          {cached?.name || `Букет ${id}`} · {qty} шт.
                        </span>
                        <Button
                          variant="outline"
                          disabled={pending}
                          aria-label={`Удалить: ${cached?.name || id}`}
                          onClick={() => remove(id)}
                        >
                          Удалить
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <Button variant="outline" onClick={quote.retry}>
                  Попробовать снова
                </Button>
                <Button variant="outline" disabled={pending} onClick={clear}>
                  Очистить корзину
                </Button>
              </div>
            )}
            {quote.data && (
              <>
                {quote.data.items.map(({ product: p, quantity: qty }) => (
                  <div className="bag-item" key={p.id}>
                    <ProductImage src={p.image} alt={p.name} />
                    <div>
                      <h3>
                        <a target="_top" href={`/flowers/${p.id}`}>
                          {p.name}
                        </a>
                      </h3>
                      <p>{money(p.price)}</p>
                      <div className="quantity">
                        <Button
                          variant="outline"
                          disabled={pending}
                          aria-label={`Уменьшить количество: ${p.name}`}
                          onClick={() => quantity(p.id, -1)}
                        >
                          <Minus />
                        </Button>
                        <span>{qty}</span>
                        <Button
                          variant="outline"
                          disabled={pending || qty >= 20}
                          aria-label={`Увеличить количество: ${p.name}`}
                          onClick={() => quantity(p.id, 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bag-total">
                  <span>Итого</span>
                  <strong>{money(quote.data.total)}</strong>
                </div>
              </>
            )}
          </>
        )}
        {!!count && (
          <>
            {quote.data && !pending && !quote.loading && !quote.error ? (
              <a
                className="whatsapp-order"
                href={whatsappOrderUrl('77788472412', quote.data)}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby="whatsapp-order-note"
              >
                <MessageCircle size={20} aria-hidden="true" />
                Заказать в WhatsApp
              </a>
            ) : (
              <Button disabled className="whatsapp-order">
                <MessageCircle aria-hidden="true" />
                {pending || quote.loading
                  ? 'Проверяем корзину…'
                  : 'Заказать в WhatsApp'}
              </Button>
            )}
            <p id="whatsapp-order-note" className="sample-note">
              Откроется чат с +7 778 847 24 12. Проверьте сообщение с букетами,
              количеством и суммой и нажмите «Отправить» в WhatsApp. Магазин
              подтвердит наличие, доставку и оплату в чате.
            </p>
          </>
        )}
        {notice && <p role="alert">{notice}</p>}
        {retryMutation && (
          <Button variant="outline" disabled={pending} onClick={retryMutation}>
            Повторить добавление
          </Button>
        )}
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Продолжить просмотр
        </Button>
      </SheetContent>
    </Sheet>
  );
}
