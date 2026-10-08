'use client';
import { apiError } from '@/lib/api-error';
import { requestJson } from '@/lib/request-json';
import { useEffect, useState, useCallback } from 'react';
export function useResource<T>(
  url: string | null,
  body?: string,
  initial?: { url: string; data: T },
) {
  const [revision, setRevision] = useState(0);
  const key = `${url || ''}:${body || ''}:${revision}`;
  const [state, setState] = useState<{
    key: string;
    data: T | null;
    error: string;
    previousData?: T | null;
  }>(() =>
    initial && initial.url === url
      ? { key, data: initial.data, error: '' }
      : { key: '', data: null, error: '' },
  );
  const retry = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { response, result } = await requestJson(url, {
          signal: controller.signal,
          cache: 'no-store',
          ...(body
            ? {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
              }
            : {}),
        });
        if (!response.ok)
          throw new Error(apiError(result, 'Не удалось загрузить данные.'));
        if (!controller.signal.aborted)
          setState({ key, data: result as T, error: '' });
      } catch (error) {
        if (!controller.signal.aborted)
          setState((previous) => ({
            key,
            data: null,
            previousData: previous.data || previous.previousData,
            error:
              error instanceof Error
                ? error.message
                : 'Не удалось загрузить данные.',
          }));
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, body, key]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') retry();
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [retry]);
  return {
    data: state.key === key ? state.data : null,
    previousData: state.data || state.previousData || null,
    error: state.key === key ? state.error : '',
    loading: !!url && (state.key !== key || (!state.data && !state.error)),
    retry,
  };
}
