import { apiJson } from './api-error.ts';

// Bound the entire response, including reading a stalled response body.
export async function requestJson(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000,
) {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  if (init.signal?.aborted) cancel();
  init.signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const result = await apiJson(response);
    return { response, result };
  } catch (error) {
    if (timedOut)
      throw new Error(
        'Сервер не ответил вовремя. Проверьте соединение и попробуйте снова.',
      );
    if (error instanceof TypeError)
      throw new Error(
        'Не удалось связаться с магазином. Проверьте интернет и попробуйте снова.',
      );
    throw error;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', cancel);
  }
}
