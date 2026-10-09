'use client';
import { useRef, useState } from 'react';
import AdminLocations from './admin-locations';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Pencil, Plus, X } from 'lucide-react';
import { preparePhoto } from '@/lib/prepare-photo';
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const returnFocus = useRef<HTMLElement | null>(null);
  const locked = busy || uploading;
  function rememberFocus() {
    returnFocus.current = document.activeElement as HTMLElement;
    setUploadError('');
  }
  async function uploadPhoto(file: File) {
    setUploading(true);
    setUploadError('');
    try {
      const photo = await preparePhoto(file);
      const response = await fetch('/api/admin/images', {method: 'POST', headers: {'Content-Type': 'image/webp'}, body: photo, signal: AbortSignal.timeout(60000)});
      const data = await apiJson(response);
      if (!response.ok) throw new Error(apiError(data, 'Не удалось загрузить фото. Попробуйте снова.'));
      setEditing(current => current ? {...current, image: (data as {url: string}).url} : current);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Не удалось загрузить фото.');
    } finally { setUploading(false); }
  }
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
            rememberFocus();
            setEditing({
              ...blank,
              categoryId: categories.data?.categories[0]?.id || '',
            });
            setCategory(null);
            setMessage('');
          }}
        >
          <Plus aria-hidden="true" /> Новый товар
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            rememberFocus();
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
      {message && !editing && !category && <output className="admin-message">{message}</output>}
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
      <Dialog open={!!editing || !!category} onOpenChange={(open) => {
        if (!open && !locked) { setEditing(null); setCategory(null); }
      }}>
      {(editing || category) && <DialogContent className="admin-editor" showCloseButton={false} finalFocus={returnFocus}>
        <div className="admin-editor-heading">
          <div>
            <DialogTitle>{editing ? (editing.version ? 'Редактировать товар' : 'Новый товар') : (category?.version ? 'Редактировать категорию' : 'Новая категория')}</DialogTitle>
            <DialogDescription>Внесите изменения и нажмите «Сохранить».</DialogDescription>
          </div>
          <Button type="button" variant="ghost" disabled={locked} aria-label="Закрыть редактор" onClick={() => {setEditing(null); setCategory(null);}}><X aria-hidden="true" /></Button>
        </div>
        {message && <div role="alert" className="admin-message">{message}</div>}
      {editing && (
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (locked) return;
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
          <div className="admin-photo-field">
            <div className="admin-photo-preview">
              {editing.image ? <img src={editing.image} alt="Фото товара" /> : <Camera aria-hidden="true" />}
            </div>
            <div>
              <label className="admin-upload-button" aria-disabled={locked}>
                <Camera aria-hidden="true" /> {uploading ? 'Загружаем фото…' : 'Загрузить фото'}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={locked} onChange={e => {
                  const file = e.currentTarget.files?.[0];
                  e.currentTarget.value = '';
                  if (file) void uploadPhoto(file);
                }} />
              </label>
              <p className="admin-photo-help">С телефона или компьютера · JPG, PNG, WebP до 20 МБ</p>
              <p role="status">{uploading ? 'Подготавливаем и сохраняем фото…' : ''}</p>
              {uploadError && <p role="alert" className="admin-upload-error">{uploadError}</p>}
            </div>
          </div>
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
          <details className="admin-image-link">
            <summary>Или использовать ссылку на фото</summary>
            <label htmlFor="admin-field-5">Ссылка на фото
              <Input id="admin-field-5" maxLength={2048} disabled={locked} value={editing.image}
                onChange={e => setEditing({...editing, image: e.target.value})} />
            </label>
          </details>
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
          <label className="check-label">
            <Checkbox
              aria-label="Доступен для подбора"
              checked={!!editing.available}
              onCheckedChange={(value) =>
                setEditing({ ...editing, available: Number(value) })
              }
            />
            Доступен для подбора
          </label>
          <div className="admin-actions">
            <Button type="submit" disabled={locked}>
              {busy ? 'Сохраняем…' : 'Сохранить товар'}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={locked}
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
            if (locked) return;
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
          <label className="check-label">
            <Checkbox
              aria-label="Категория активна"
              checked={!!category.active}
              onCheckedChange={(value) =>
                setCategory({ ...category, active: Number(value) })
              }
            />
            Категория активна
          </label>
          <div className="admin-actions">
            <Button type="submit" disabled={locked}>
              Сохранить категорию
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={locked}
              onClick={() => setCategory(null)}
            >
              Отмена
            </Button>
          </div>
        </form>
      )}
      </DialogContent>}
      </Dialog>
      <section className="admin-section">
        <h2>Товары ({products.data?.total || 0})</h2>
        {products.loading && <output>Загрузка товаров…</output>}
        {products.data?.products.length === 0 && (
          <p>Товаров пока нет. Создайте категорию и добавьте первый букет.</p>
        )}
        <div className="admin-list">
          {products.data?.products.map((p) => (
            <div className="admin-row admin-product-row" key={p.id}>
              <div className="admin-product-thumb">{p.image ? <img src={p.image} alt="" loading="lazy" /> : <Camera aria-hidden="true" />}</div>
              <div className="admin-product-copy">
                <strong>{p.name}</strong>
                <p>
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
              <span className="admin-product-price">{money(p.price)}</span>
              <Button
                variant="outline"
                aria-label={`Изменить ${p.name}`}
                onClick={() => {
                  rememberFocus();
                  setEditing(p);
                  setCategory(null);
                  setMessage('');
                }}
              >
                <Pencil aria-hidden="true" /> Изменить
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
              aria-label={`Изменить ${c.name}`}
              onClick={() => {
                rememberFocus();
                setCategory(c);
                setEditing(null);
                setMessage('');
              }}
            >
              <Pencil aria-hidden="true" /> Изменить
            </Button>
          </div>
        ))}
      </section>
      <AdminLocations />
    </main>
  );
}
