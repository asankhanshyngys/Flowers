'use client';
import Link from 'next/link';
import { useState } from 'react';
import HomeVisit from './home-visit';
import { ArrowUpRight, Flower2 } from 'lucide-react';
import { StoreHeader, StoreFooter } from './store-chrome';
import ProductImage from './product-image';
import SelectionSheet from './selection-sheet';
import { useSelection } from '@/hooks/use-catalog';
import { useResource } from '@/hooks/use-resource';
import { money, type CatalogResult } from '@/lib/catalog';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
export default function Homepage() {
  const selection = useSelection();
  const [bagOpen, setBagOpen] = useState(false);
  const catalog = useResource<CatalogResult>('/api/catalog?limit=3');
  return (
    <>
      <StoreHeader
        active="home"
        count={Object.values(selection.bag).reduce((a, b) => a + b, 0)}
        onOpenSelection={() => setBagOpen(true)}
      />
      <main id="main" className="home-page">
        <section className="home-hero" aria-labelledby="welcome-title">
          <div className="home-hero-copy">
            <p className="eyebrow">PETAL & STEM · ЦВЕТОЧНАЯ КОЛЛЕКЦИЯ</p>
            <h1 id="welcome-title">
              О чувствах
              <br />
              лучше сказать
              <br />
              <em>цветами.</em>
            </h1>
            <p>
              Для важных событий, маленьких радостей и тёплых мгновений между
              ними.
            </p>
            <Link target="_top" className="home-cta" href="/catalog">
              Смотреть коллекцию <ArrowUpRight size={20} />
            </Link>
            <span className="home-signature">
              <Flower2 size={22} aria-hidden="true" /> Немного свободы. Много
              красоты.
            </span>
          </div>
          <div className="home-hero-photo">
            <ProductImage
              src="/images/mixed.jpg"
              alt="Яркий букет с розовыми и оранжевыми цветами"
              priority
            />
            <span className="home-photo-caption">Мгновение в цвете.</span>
          </div>
        </section>
        <section className="home-collection" aria-labelledby="collection-title">
          <div className="home-section-heading">
            <div>
              <p className="eyebrow">НАЙДИТЕ СВОЮ КРАСОТУ</p>
              <h2 id="collection-title">Знакомьтесь: наша коллекция.</h2>
            </div>
            <Link target="_top" className="home-text-link" href="/catalog">
              Все цветы <ArrowUpRight size={18} />
            </Link>
          </div>
          {!!catalog.data?.categories.length && (
            <nav className="home-categories" aria-label="Коллекции цветов">
              {catalog.data.categories.map((c) => (
                <Link
                  target="_top"
                  key={c.id}
                  href={`/catalog?category=${encodeURIComponent(c.id)}`}
                >
                  {c.name}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </nav>
          )}
          {catalog.loading ? (
            <div
              className="home-products"
              aria-busy="true"
              aria-label="Загрузка коллекции"
            >
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-80 w-full" />
              ))}
            </div>
          ) : catalog.error ? (
            <div className="home-empty">
              <h3>Не удалось загрузить коллекцию.</h3>
              <p>{catalog.error}</p>
              <Button onClick={catalog.retry}>Попробовать снова</Button>
            </div>
          ) : catalog.data?.products.length ? (
            <div className="home-products">
              {catalog.data.products.map((p) => (
                <article key={p.id} className="product-card">
                  <Link
                    target="_top"
                    className="product-photo"
                    href={`/flowers/${p.id}`}
                  >
                    <ProductImage src={p.image} alt={p.name} />
                    {!p.available && (
                      <span className="stock-badge">Нет в наличии</span>
                    )}
                    <span className="view-product">
                      Посмотреть букет <ArrowUpRight size={18} />
                    </span>
                  </Link>
                  <div className="card-meta">
                    <span>{p.category}</span>
                    <span>{p.color}</span>
                  </div>
                  <div className="card-title">
                    <h3>
                      <Link target="_top" href={`/flowers/${p.id}`}>
                        {p.name}
                      </Link>
                    </h3>
                    <span>{money(p.price)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="home-empty">
              <Flower2 aria-hidden="true" />
              <h3>Коллекция скоро появится.</h3>
              <p>
                Здесь появятся первые букеты, как только мы добавим их в
                каталог.
              </p>
            </div>
          )}
        </section>
        <section className="home-note">
          <div className="home-note-photo">
            <ProductImage
              src="/images/tulips.jpg"
              alt="Розовые тюльпаны с зелёными листьями"
            />
          </div>
          <div>
            <p className="eyebrow">ПОВОД НЕ ОБЯЗАТЕЛЕН</p>
            <h2>
              «Просто так»
              <br />
              тоже хороший повод.
            </h2>
            <p>
              Поблагодарить. Напомнить о себе. Украсить свой дом. Для цветов
              всегда найдётся место.
            </p>
            <Link target="_top" className="home-text-link" href="/catalog">
              Найдите свой букет <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
        <HomeVisit />
      </main>
      <StoreFooter />
      <SelectionSheet
        open={bagOpen}
        onOpenChange={setBagOpen}
        selection={selection}
      />
    </>
  );
}
