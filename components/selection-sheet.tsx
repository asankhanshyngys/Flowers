'use client';
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
    preview,
    clear,
    remove,
    retryMutation,
  } = selection;
  const count = Object.values(bag).reduce((a, b) => a + b, 0);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="selection-sheet">
        <SheetHeader>
          <SheetTitle>Корзина ({count})</SheetTitle>
          <SheetDescription>
            Ваши букеты. Измените количество и отправьте заказ в WhatsApp.
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

            {quote.error && (
              <div role="alert">
                <p>{quote.error}</p>
                <p>Можно удалить отдельный букет и сохранить остальные.</p>
                <Button variant="outline" onClick={quote.retry}>
                  Попробовать снова
                </Button>
                <Button variant="outline" disabled={pending} onClick={clear}>
                  Очистить корзину
                </Button>
              </div>
            )}
            <>
                {preview.map(({id, product: p, quantity: qty}) => (
                  <div className="bag-item" key={id}>
                    <ProductImage src={p?.image || ''} alt={p?.name || 'Букет'} />
                    <div>
                      <h3><a target="_top" href={`/flowers/${id}`}>{p?.name || `Букет ${id}`}</a></h3>
                      <p>{p ? money(p.price) : 'Уточняем цену…'}</p>
                      <div className="quantity">
                        <Button variant="outline" disabled={pending} aria-label={`Уменьшить количество: ${p?.name || id}`} onClick={() => quantity(id, -1)}><Minus /></Button>
                        <span>{qty}</span>
                        <Button variant="outline" disabled={pending || qty >= 20} aria-label={`Увеличить количество: ${p?.name || id}`} onClick={() => quantity(id, 1)}><Plus /></Button>
                        <Button variant="ghost" disabled={pending} aria-label={`Удалить: ${p?.name || id}`} onClick={() => remove(id)}>Удалить</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {quote.data ? (
                <div className="bag-total">
                  <span>Итого</span>
                  <strong>{money(quote.data.total)}</strong>
                </div>
                ) : preview.every(item => item.product) && !quote.error ? (
                  <div className="bag-total"><span>Предварительно</span><strong>{money(preview.reduce((total, item) => total + item.product!.price * item.quantity, 0))}</strong></div>
                ) : null}
                {quote.loading && !quote.data && <small role="status">Уточняем итоговую сумму…</small>}
              </>
          </>
        )}
        {!!count && (
          <>
            {quote.data && !pending && !quote.error ? (
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
                  ? 'Уточняем сумму…'
                  : 'Заказать в WhatsApp'}
              </Button>
            )}
            <p id="whatsapp-order-note" className="sample-note">
              Нажмите «Отправить» в WhatsApp. Магазин подтвердит заказ и доставку в чате.
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
