'use client';
import { apiError } from '@/lib/api-error';
import { requestJson } from '@/lib/request-json';
import { useState, useSyncExternalStore, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { readFilters, type Product } from '@/lib/catalog';
import { useResource } from './use-resource';
const listeners = new Set<() => void>();
let memory = '{}';
let storageFailed = false;
function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}
function snapshot() {
  if (storageFailed) return memory;
  try {
    return localStorage.getItem('petal-selection') || '{}';
  } catch {
    return memory;
  }
}
function parse(raw: string) {
  const bag: Record<string, number> = {};
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object' && !Array.isArray(value))
      for (const [id, n] of Object.entries(value).slice(0, 50)) {
        if (
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
          id.length <= 80 &&
          typeof n === 'number' &&
          Number.isInteger(n) &&
          n > 0 &&
          n <= 20
        )
          bag[id] = n;
      }
  } catch {
    /* Discard malformed device-only preferences. */
  }
  return bag;
}
function save(bag: Record<string, number>) {
  memory = JSON.stringify(bag);
  try {
    localStorage.setItem('petal-selection', memory);
  } catch {
    storageFailed = true;
  }
  listeners.forEach((fn) => fn());
}
export type Quote = {
  items: { product: Product; quantity: number; lineTotal: number }[];
  total: number;
  currency: string;
};
export function useSelection() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '{}');
  const bag = parse(raw);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [failedMutation, setFailedMutation] = useState<{
    id: string;
    delta: number;
  } | null>(null);
  const mutating = useRef(false);
  const quote = useResource<Quote>(
    Object.keys(bag).length ? '/api/selection' : null,
    JSON.stringify({
      items: Object.entries(bag).map(([id, quantity]) => ({ id, quantity })),
    }),
  );
  async function quantity(id: string, delta: number) {
    if (mutating.current) return;
    const next = parse(snapshot());
    next[id] = Math.max(
      0,
      Math.min(20, (Object.hasOwn(next, id) ? next[id] : 0) + delta),
    );
    if (!next[id]) delete next[id];
    if (delta < 0) {
      save(next);
      setNotice('');
      setFailedMutation(null);
      return;
    }
    mutating.current = true;
    setPending(true);
    setNotice('');
    setFailedMutation(null);
    try {
      const { response, result } = await requestJson('/api/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(next).map(([id, quantity]) => ({
            id,
            quantity,
          })),
        }),
      });
      if (!response.ok)
        throw new Error(apiError(result, 'Не удалось обновить корзину.'));
      save(next);
      setNotice('');
      setFailedMutation(null);
    } catch (error) {
      setFailedMutation({ id, delta });
      setNotice(
        error instanceof Error ? error.message : 'Не удалось обновить корзину.',
      );
    } finally {
      mutating.current = false;
      setPending(false);
    }
  }
  return {
    bag,
    quantity,
    notice:
      notice ||
      (storageFailed
        ? 'Хранилище недоступно. Корзина сохранится только до конца этого визита.'
        : ''),
    pending,
    quote,
    retryMutation: failedMutation
      ? () => quantity(failedMutation.id, failedMutation.delta)
      : undefined,
    remove: (id: string) => {
      if (mutating.current) return;
      const next = parse(snapshot());
      delete next[id];
      save(next);
      setNotice('');
      setFailedMutation(null);
    },
    clear: () => {
      if (mutating.current) return;
      save({});
      setNotice('');
      setFailedMutation(null);
    },
  };
}
function subscribeUrl(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener('catalog-change', callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener('catalog-change', callback);
  };
}
export function useCatalogFilters() {
  const params = useSearchParams();
  const query = useSyncExternalStore(
    subscribeUrl,
    () => location.search,
    () => params.toString(),
  );
  return readFilters(new URLSearchParams(query));
}
