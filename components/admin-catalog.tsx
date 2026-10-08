'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';
import { useResource } from '@/hooks/use-resource';
import { apiError, apiJson } from '@/lib/api-error';
import { money } from '@/lib/catalog';
type Category = {
  id: string;
  name: string;
  active: number;
  displayOrder: number;
  version: number;
};
type RecordProduct = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  color: string;
  price: number;
  image: string;
  available: number;
  status: string;
  displayOrder: number;
  version: number;
};
const blank = {
  id: '',
  name: '',
  description: '',
  categoryId: '',
  color: '',
  price: 0,
  image: '',
  available: 0,
  status: 'draft',
  displayOrder: 0,
  version: 0,
};
export default function AdminCatalog() {
  const [page, setPage] = useState(1);
  const products = useResource<{
    products: RecordProduct[];
    total: number;
    page: number;
    limit: number;
  }>(`/api/admin/products?page=${page}`);
  const categories = useResource<{ categories: Category[] }>(
    '/api/admin/categories',
  );
  const [editing, setEditing] = useState<RecordProduct | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function request(path: string, method: string, body: unknown) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await apiJson(r);
      if (!r.ok) throw new Error(apiError(result, 'Не удалось сохранить.'));
      setEditing(null);
      setCategory(null);
      products.retry();
      categories.retry();
      setMessage(
        'Сохранено. Изменения появятся при следующей загрузке каталога.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Не удалось сохранить.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-page">
      <Link href="/">← На главную</Link>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">УПРАВЛЕНИЕ КАТАЛОГОМ</p>
          <h1>Ваша коллекция цветов</h1>
        </div>
        <Button
          onClick={() => {
            setEditing({
              ...blank,
              categoryId: categories.data?.categories[0]?.id || '',
            });
            setCategory(null);
            setMessage('');
          }}
        >
          Новый товар
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCategory({
              id: '',
              name: '',
              active: 1,
              displayOrder: 0,
              version: 0,
            });
            setEditing(null);
            setMessage('');
          }}
        >
          Новая категория
        </Button>
      </div>
      <p>
        Цены указаны в тенге. Черновики и архивные товары скрыты. Отключение
        категории скрывает её товары.
      </p>
      {message && <output className="admin-message">{message}</output>}
      {(products.error || categories.error) && (
        <div role="alert">
          <p>{products.error || categories.error}</p>
          <Button
            onClick={() => {
              products.retry();
              categories.retry();
            }}
          >
            Попробовать снова
          </Button>
        </div>
      )}
      {editing && (
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            const { version, id, ...rest } = editing;
            void request(
              `/api/admin/products${version ? '/' + id : ''}`,
              version ? 'PUT' : 'POST',
              {
                ...rest,
                available: !!rest.available,
                ...(version ? { version } : { id }),
              },
            );
          }}
        >
          <h2>{editing.version ? 'Редактировать товар' : 'Новый товар'}</h2>
          <label htmlFor="admin-field-0">
            Идентификатор для ссылки
            <Input
              id="admin-field-0"
              required
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              disabled={!!editing.version}
              value={editing.id}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
            />
          </label>
          <label htmlFor="admin-field-1">
            Название
            <Input
              id="admin-field-1"
              required
              maxLength={160}
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </label>
          <label htmlFor="admin-field-2">
            Категория
            <NativeSelect
              id="admin-field-2"
              required
              value={editing.categoryId}
              onChange={(e) =>
                setEditing({ ...editing, categoryId: e.target.value })
              }
            >
              <NativeSelectOption value="">
                Выберите категорию
              </NativeSelectOption>
              {categories.data?.categories.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.name}
                  {c.active ? '' : ' (отключена)'}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label htmlFor="admin-field-3">
            Цена в тенге (₸)
            <Input
              id="admin-field-3"
              type="number"
              required
              min={0}
              max={1000000}
              step={0.01}
              value={editing.price / 100}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  price: Math.round(e.target.valueAsNumber * 100),
                })
              }
            />
            <small>Можно указать до двух знаков после запятой.</small>
          </label>
          <label htmlFor="admin-field-4">
            Цвет
            <Input
              id="admin-field-4"
              maxLength={50}
              value={editing.color}
              onChange={(e) =>
                setEditing({ ...editing, color: e.target.value })
              }
            />
          </label>
          <label htmlFor="admin-field-5">
            Путь к фото или общедоступный HTTPS-адрес
            <Input
              id="admin-field-5"
              maxLength={2048}
              value={editing.image}
              onChange={(e) =>
                setEditing({ ...editing, image: e.target.value })
              }
            />
            <small>
              Необязательно. Доступные фото: /images/roses.jpg,
              /images/white.jpg, /images/tulips.jpg, /images/mixed.jpg
            </small>
          </label>
          <label htmlFor="admin-field-6">
            Описание
            <Textarea
              id="admin-field-6"
              maxLength={6000}
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
          </label>
          <label htmlFor="admin-field-7">
            Статус публикации
            <NativeSelect
              id="admin-field-7"
              value={editing.status}
              onChange={(e) =>
                setEditing({ ...editing, status: e.target.value })
              }
            >
              {['draft', 'published', 'archived'].map((v) => (
                <NativeSelectOption key={v} value={v}>
                  {
                    {
                      draft: 'Черновик',
                      published: 'Опубликован',
                      archived: 'В архиве',
                    }[v]
                  }
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label htmlFor="admin-field-8">
            Порядок отображения
            <Input
              id="admin-field-8"
              type="number"
              min={0}
              max={1000000}
              step={1}
              value={editing.displayOrder}
              onChange={(e) =>
                setEditing({ ...editing, displayOrder: e.target.valueAsNumber })
              }
            />
          </label>
          <div className="check-label">
            <Checkbox
              aria-label="Доступен для подбора"
              checked={!!editing.available}
              onCheckedChange={(value) =>
                setEditing({ ...editing, available: Number(value) })
              }
            />
            Доступен для подбора
          </div>
          <div className="admin-actions">
            <Button type="submit" disabled={busy}>
              {busy ? 'Сохраняем…' : 'Сохранить товар'}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Отмена
            </Button>
          </div>
        </form>
      )}
      {category && (
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            const { version, id, ...rest } = category;
            void request(
              `/api/admin/categories${version ? '/' + id : ''}`,
              version ? 'PUT' : 'POST',
              {
                ...rest,
                active: !!rest.active,
                ...(version ? { version } : { id }),
              },
            );
          }}
        >
          <h2>
            {category.version ? 'Редактировать категорию' : 'Новая категория'}
          </h2>
          <label htmlFor="admin-field-9">
            Идентификатор
            <Input
              id="admin-field-9"
              required
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              disabled={!!category.version}
              value={category.id}
              onChange={(e) => setCategory({ ...category, id: e.target.value })}
            />
          </label>
          <label htmlFor="admin-field-10">
            Название
            <Input
              id="admin-field-10"
              required
              maxLength={80}
              value={category.name}
              onChange={(e) =>
                setCategory({ ...category, name: e.target.value })
              }
            />
          </label>
          <label htmlFor="admin-field-11">
            Порядок отображения
            <Input
              id="admin-field-11"
              type="number"
              min={0}
              max={1000000}
              value={category.displayOrder}
              onChange={(e) =>
                setCategory({
                  ...category,
                  displayOrder: e.target.valueAsNumber,
                })
              }
            />
          </label>
          <div className="check-label">
            <Checkbox
              aria-label="Категория активна"
              checked={!!category.active}
              onCheckedChange={(value) =>
                setCategory({ ...category, active: Number(value) })
              }
            />
            Категория активна
          </div>
          <div className="admin-actions">
            <Button type="submit" disabled={busy}>
              Сохранить категорию
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategory(null)}
            >
              Отмена
            </Button>
          </div>
        </form>
      )}
      <section className="admin-section">
        <h2>Товары ({products.data?.total || 0})</h2>
        {products.loading && <output>Загрузка товаров…</output>}
        {products.data?.products.length === 0 && (
          <p>Товаров пока нет. Создайте категорию и добавьте первый букет.</p>
        )}
        <div className="admin-list">
          {products.data?.products.map((p) => (
            <div className="admin-row" key={p.id}>
              <div>
                <strong>{p.name}</strong>
                <p>
                  {p.id} ·{' '}
                  {
                    {
                      draft: 'Черновик',
                      published: 'Опубликован',
                      archived: 'В архиве',
                    }[p.status]
                  }{' '}
                  · {p.available ? 'в наличии' : 'нет в наличии'}
                </p>
              </div>
              <span>{money(p.price)}</span>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(p);
                  setCategory(null);
                  setMessage('');
                }}
              >
                Изменить {p.name}
              </Button>
            </div>
          ))}
        </div>
        {products.data && products.data.total > 50 && (
          <div className="catalog-pagination">
            <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Назад
            </Button>
            <span>Страница {page}</span>
            <Button
              disabled={page * 50 >= products.data.total}
              onClick={() => setPage(page + 1)}
            >
              Далее
            </Button>
          </div>
        )}
      </section>
      <section className="admin-section">
        <h2>Категории</h2>
        {categories.data?.categories.map((c) => (
          <div className="admin-row" key={c.id}>
            <span>
              {c.name} · {c.active ? 'активна' : 'отключена'}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                setCategory(c);
                setEditing(null);
                setMessage('');
              }}
            >
              Изменить {c.name}
            </Button>
          </div>
        ))}
      </section>
    </main>
  );
}
