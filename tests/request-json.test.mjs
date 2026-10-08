import assert from 'node:assert/strict';
import test from 'node:test';
import { requestJson } from '../lib/request-json.ts';

test('request returns parsed data and preserves HTTP error status', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'stock changed' }, { status: 409 }));
  const { response, result } = await requestJson('/quote');
  assert.equal(response.status, 409);
  assert.deepEqual(result, { error: 'stock changed' });
});
test('stalled fetch times out with a recoverable message', async (t) => {
  t.mock.method(globalThis, 'fetch', (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  await assert.rejects(requestJson('/quote', {}, 20), /не ответил вовремя/);
});
test('timeout includes reading a stalled response body', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => ({
    json: () => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })),
  }));
  await assert.rejects(requestJson('/quote', {}, 20), /не ответил вовремя/);
});
test('offline failure explains how to recover', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(requestJson('/quote'), /Проверьте интернет/);
});
test('caller cancellation aborts the in-flight request', async (t) => {
  t.mock.method(globalThis, 'fetch', (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const controller = new AbortController();
  const request = requestJson('/quote', { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
});
