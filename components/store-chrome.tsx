'use client';
import Link from 'next/link';
import { Flower2, ShoppingBag } from 'lucide-react';
export function StoreHeader({
  active,
  count,
  onOpenSelection,
}: {
  active: 'home' | 'catalog';
  count: number;
  onOpenSelection: () => void;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <div className="announcement">Красота в каждом букете.</div>
      <header className="site-header store-header">
        <Link
          target="_top"
          className="brand"
          href="/"
          aria-label="Petal & Stem — главная"
        >
          <Flower2 aria-hidden="true" />
          <span>
            petal <i>&</i> stem<small>ЦВЕТОЧНАЯ КОЛЛЕКЦИЯ</small>
          </span>
        </Link>
        <nav aria-label="Основная навигация">
          <Link
            target="_top"
            href="/"
            className={active === 'home' ? 'current' : ''}
            aria-current={active === 'home' ? 'page' : undefined}
          >
            Главная
          </Link>
          <Link
            target="_top"
            href="/catalog"
            className={active === 'catalog' ? 'current' : ''}
            aria-current={active === 'catalog' ? 'page' : undefined}
          >
            Каталог цветов
          </Link>
        </nav>
        <button
          className="bag-button"
          aria-label={`Корзина: ${count} шт.`}
          onClick={onOpenSelection}
        >
          <ShoppingBag size={20} aria-hidden="true" />
          <span>Корзина</span>
          <b>{count}</b>
        </button>
      </header>
    </>
  );
}
export function StoreFooter() {
  return (
    <footer>
      <Link target="_top" className="footer-brand" href="/">
        petal & stem
      </Link>
      <p>Маленькие знаки внимания. Большие чувства.</p>
      <Link target="_top" href="/admin">
        Управление каталогом
      </Link>
      <a
        href="https://wa.me/77788472412"
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp: +7 778 847 24 12
      </a>
    </footer>
  );
}
