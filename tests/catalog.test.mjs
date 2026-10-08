import assert from 'node:assert/strict';
import test from 'node:test';
import { defaults, readFilters, filterParams, money } from '../lib/catalog.ts';
test('catalog state survives URL round trip', () => {
  const f = {
    ...defaults,
    q: 'розовые розы',
    min: '25.50',
    max: '80',
    available: true,
    page: '2',
    sort: 'price-desc',
  };
  assert.deepEqual(readFilters(filterParams(f)), f);
  assert.deepEqual(readFilters(new URLSearchParams()), defaults);
});
test('money uses integer minor units', () => {
  assert.equal(money(1).replaceAll('\u00a0', ' '), '0,01 ₸');
  assert.equal(money(3104608).replaceAll('\u00a0', ' '), '31 046,08 ₸');
});
