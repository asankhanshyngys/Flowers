'use client';
import { useState } from 'react';
import { StoreHeader, StoreFooter } from './store-chrome';
import PriceFilter from './price-filter';
import { useResource } from '@/hooks/use-resource';
import SelectionSheet from './selection-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalogTool } from '@/hooks/use-catalog-tool';
import { useCatalogFilters, useSelection } from '@/hooks/use-catalog';
import {
  Flower2,
  Search,
  ArrowUpRight,
  SlidersHorizontal,
  ShoppingBag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import ProductImage from './product-image';
import {
  defaults,
  filterParams,
  money,
  type Filters,
  type Product,
  type CatalogResult,
} from '@/lib/catalog';
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="choice">
      <span>{label}</span>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger aria-label={label}>
          <SelectValue>
            {options.find((o) => o.value === value)?.label || value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export default function Catalog({
  selected,
  initialCatalog,
}: {
  selected?: Product;
  initialCatalog?: { url: string; data: CatalogResult };
}) {
  const filters = useCatalogFilters();
  const selection = useSelection();
  const { bag, quantity, pending } = selection;
  const [mobile, setMobile] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  function update(next: Partial<Filters>) {
    const f = { ...filters, ...next, page: next.page || '1' };
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v !== defaults[k as keyof Filters] && v !== '')
        p.set(k, typeof v === 'boolean' ? '1' : String(v));
    });
    history.pushState(null, '', `${location.pathname}${p.size ? '?' + p : ''}`);
    window.dispatchEvent(new Event('catalog-change'));
  }
  const catalog = useResource<CatalogResult>(
    selected ? null : `/api/catalog?${filterParams(filters)}`,
    undefined,
    initialCatalog,
  );
  const facets = catalog.data || catalog.previousData;
  const products = catalog.data?.products || [];
  const items = products;
  const categories = [
    { id: 'Все цветы', name: 'Все цветы' },
    ...(facets?.categories || []),
  ];
  useCatalogTool(
    selected ? [selected] : products,
    filters,
    !!selected || !!catalog.data,
  );
  const active = Object.keys(defaults).some(
    (k) => filters[k as keyof Filters] !== defaults[k as keyof Filters],
  );
  const count = Object.values(bag).reduce((a, b) => a + b, 0);
  const query = new URLSearchParams(
    Object.entries(filters)
      .filter(([k, v]) => v !== defaults[k as keyof Filters])
      .map(([k, v]) => [k, v === true ? '1' : String(v)]),
  ).toString();
  const filterControls = (
    <>
      <Choice
        label="Цветовая гамма"
        value={filters.color}
        onChange={(color) => update({ color })}
        options={['Все цвета', ...(facets?.colors || [])].map((v) => ({
          value: v,
          label: v,
        }))}
      />
      <PriceFilter
        key={`${filters.min}:${filters.max}:${facets?.priceRange?.min}:${facets?.priceRange?.max}`}
        bounds={facets?.priceRange}
        min={filters.min}
        max={filters.max}
        onChange={update}
      />
      <div className="check-label">
        <Checkbox
          aria-label="Только букеты в наличии"
          checked={filters.available}
          onCheckedChange={(available) => update({ available: !!available })}
        />
        Только букеты в наличии
      </div>
      {active && (
        <Button variant="ghost" onClick={() => update(defaults)}>
          Сбросить фильтры <X size={14} />
        </Button>
      )}
    </>
  );
  return (
    <>
      <StoreHeader
        active="catalog"
        count={count}
        onOpenSelection={() => setBagOpen(true)}
      />
      <main id="main">
        {selected ? (
          <>
            <a
              target="_top"
              className="back-link"
              href={`/catalog${query ? '?' + query : ''}`}
            >
              ← Назад в каталог
            </a>
            <section className="detail">
              <div className="detail-image">
                <ProductImage
                  src={selected.image}
                  alt={selected.name}
                  priority
                />
              </div>
              <div className="detail-copy">
                <p className="eyebrow">{selected.category}</p>
                <h1>{selected.name}</h1>
                <p className="detail-price">{money(selected.price)}</p>
                <p>{selected.description}</p>
                <p className="availability">
                  {selected.available ? 'В наличии' : 'Сейчас нет в наличии'}
                </p>
                <dl>
                  <dt>Палитра</dt>
                  <dd>{selected.color}</dd>
                  <dt>Коллекция</dt>
                  <dd>{selected.category}</dd>
                </dl>
                <Button
                  className="primary-action"
                  disabled={
                    !selected.available ||
                    pending ||
                    (bag[selected.id] || 0) >= 20
                  }
                  aria-busy={pending}
                  onClick={() => {
                    void quantity(selected.id, 1);
                    setBagOpen(true);
                  }}
                >
                  <ShoppingBag />
                  {pending
                    ? 'Добавляем…'
                    : selected.available
                      ? 'Добавить в корзину'
                      : 'Сейчас нет в наличии'}
                </Button>
                <p className="sample-note">
                  Добавьте букеты в корзину и отправьте заказ в WhatsApp.
                  Наличие, доставку и оплату подтвердит магазин.
                </p>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="intro">
              <div>
                <p className="eyebrow">КОЛЛЕКЦИЯ</p>
                <h1>
                  Цветы для <em>любого чувства.</em>
                </h1>
                <p>
                  Знак внимания. Маленькая радость. Найдите букет, который
                  скажет всё за вас.
                </p>
              </div>
              <div className="intro-stamp">
                <Flower2 size={26} />
                <span>
                  Немного свободы.
                  <br />
                  Всегда красиво.
                </span>
              </div>
            </section>
            <div className="category-bar" aria-label="Категории цветов">
              {categories.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={
                    filters.category === c.id || filters.category === c.name
                  }
                  className={
                    filters.category === c.id || filters.category === c.name
                      ? 'selected'
                      : ''
                  }
                  onClick={() => update({ category: c.id })}
                >
                  {c.name}
                  {c.id === 'Все цветы' && (
                    <span>{facets?.catalogTotal ?? '…'}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="catalog-layout">
              <aside className="desktop-filters">
                <h2>Найдите свой букет</h2>
                {filterControls}
                <div className="aside-note">
                  <Flower2 />
                  <h3>
                    Просто так
                    <br />
                    тоже хороший повод.
                  </h3>
                  <p>Пусть цветы говорят за вас.</p>
                </div>
              </aside>
              <section className="results" aria-label="Товары">
                <div className="toolbar">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      aria-label="Поиск цветов"
                      placeholder="Поиск цветов, оттенков…"
                      value={filters.q}
                      onChange={(e) => update({ q: e.target.value })}
                    />
                    {filters.q && (
                      <button
                        aria-label="Очистить поиск"
                        onClick={() => update({ q: '' })}
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="mobile-filter"
                    onClick={() => setMobile(true)}
                  >
                    <SlidersHorizontal />
                    Фильтры
                  </Button>
                  <Choice
                    label="Сортировка"
                    value={filters.sort}
                    onChange={(sort) => update({ sort })}
                    options={[
                      { value: 'collection', label: 'Порядок коллекции' },
                      { value: 'price-asc', label: 'Сначала дешевле' },
                      { value: 'price-desc', label: 'Сначала дороже' },
                    ]}
                  />
                </div>
                <div className="results-meta">
                  <output aria-live="polite">
                    {catalog.loading
                      ? 'Ищем букеты…'
                      : catalog.error
                        ? 'Коллекция недоступна'
                        : `Найдено букетов: ${catalog.data?.total ?? 0}`}
                  </output>
                  <span>Цены в тенге</span>
                </div>
                {catalog.loading ? (
                  <div className="product-grid" aria-busy="true">
                    <output>Собираем ваши цветы…</output>
                    {[1, 2, 3].map((n) => (
                      <Skeleton key={n} className="h-80 w-full" />
                    ))}
                  </div>
                ) : catalog.error ? (
                  <Empty>
                    <EmptyTitle>Не удалось загрузить коллекцию</EmptyTitle>
                    <EmptyDescription>{catalog.error}</EmptyDescription>
                    <Button onClick={catalog.retry}>Попробовать снова</Button>
                    <Button variant="outline" onClick={() => update(defaults)}>
                      Сбросить фильтры
                    </Button>
                  </Empty>
                ) : items.length ? (
                  <div className="product-grid">
                    {items.map((p, i) => (
                      <article className="product-card" key={p.id}>
                        <a
                          target="_top"
                          className="product-photo"
                          href={`/flowers/${p.id}${query ? '?' + query : ''}`}
                        >
                          <ProductImage
                            src={p.image}
                            alt={`${p.name} — ${p.color.toLowerCase()} ${p.category.toLowerCase()}`}
                            priority={i < 2}
                          />
                          {!p.available && (
                            <span className="stock-badge">Нет в наличии</span>
                          )}
                          <span className="view-product">
                            Посмотреть букет <ArrowUpRight size={18} />
                          </span>
                        </a>
                        <div className="card-meta">
                          <span>{p.category}</span>
                          <span>{p.color}</span>
                        </div>
                        <div className="card-title">
                          <h2>
                            <a
                              target="_top"
                              href={`/flowers/${p.id}${query ? '?' + query : ''}`}
                            >
                              {p.name}
                            </a>
                          </h2>
                          <span>{money(p.price)}</span>
                        </div>
                        <Button
                          className="catalog-add"
                          variant="outline"
                          disabled={
                            !p.available || pending || (bag[p.id] || 0) >= 20
                          }
                          aria-label={`Добавить в корзину: ${p.name}`}
                          onClick={() => {
                            void quantity(p.id, 1);
                            setBagOpen(true);
                          }}
                        >
                          <ShoppingBag aria-hidden="true" />
                          {!p.available
                            ? 'Нет в наличии'
                            : (bag[p.id] || 0) >= 20
                              ? 'В корзине 20 шт.'
                              : 'Добавить в корзину'}
                        </Button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty className="empty-state">
                    <EmptyHeader>
                      <Flower2 />
                      <EmptyTitle>
                        {catalog.data?.catalogTotal
                          ? 'Букеты не найдены'
                          : 'Коллекция скоро появится'}
                      </EmptyTitle>
                      <EmptyDescription>
                        {catalog.data?.catalogTotal
                          ? 'Измените запрос или сбросьте фильтры.'
                          : 'Загляните позже — здесь появятся первые букеты.'}
                      </EmptyDescription>
                    </EmptyHeader>
                    {!!catalog.data?.catalogTotal && (
                      <Button onClick={() => update(defaults)}>
                        Сбросить поиск и фильтры
                      </Button>
                    )}
                  </Empty>
                )}
                {catalog.data && catalog.data.total > catalog.data.limit && (
                  <nav
                    className="catalog-pagination"
                    aria-label="Страницы каталога"
                  >
                    <Button
                      variant="outline"
                      disabled={catalog.data.page <= 1}
                      onClick={() =>
                        update({ page: String(catalog.data!.page - 1) })
                      }
                    >
                      Назад
                    </Button>
                    <span>
                      Страница {catalog.data.page} из{' '}
                      {Math.ceil(catalog.data.total / catalog.data.limit)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!catalog.data.hasMore}
                      onClick={() =>
                        update({ page: String(catalog.data!.page + 1) })
                      }
                    >
                      Далее
                    </Button>
                  </nav>
                )}
              </section>
            </div>
          </>
        )}
      </main>
      <StoreFooter />
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent className="filter-sheet">
          <SheetHeader>
            <SheetTitle>Найдите свой букет</SheetTitle>
            <SheetDescription>
              Сочетайте фильтры, чтобы найти свой букет.
            </SheetDescription>
          </SheetHeader>
          {filterControls}
          <Button onClick={() => setMobile(false)}>
            Показать букеты: {catalog.data?.total || 0}
          </Button>
        </SheetContent>
      </Sheet>
      <SelectionSheet
        open={bagOpen}
        onOpenChange={setBagOpen}
        selection={selection}
      />
    </>
  );
}
