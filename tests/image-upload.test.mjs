import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { readImage, maxImageBytes } from '../server/image-upload.ts';
const request = (body, type = 'image/jpeg', headers = {}) => new Request('https://example.test/api/admin/images', {method: 'POST', headers: {'content-type': type, ...headers}, body});
test('photo upload decodes pixels, resizes, and strips metadata', async () => {
  const input = await sharp({create: {width: 2000, height: 1000, channels: 3, background: '#ff88aa'}}).jpeg().withMetadata().toBuffer();
  const result = await readImage(request(input));
  const meta = await sharp(result).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, 1800);
  assert.equal(meta.height, 900);
  assert.equal(meta.exif, undefined);
});
test('rejects SVG, fake image bytes, empty input and oversized requests', async () => {
  await assert.rejects(readImage(request('<svg></svg>', 'image/svg+xml')), e => e.status === 415);
  await assert.rejects(readImage(request('<svg></svg>')), e => e.status === 400);
  await assert.rejects(readImage(request('')), e => e.status === 400);
  await assert.rejects(readImage(request('x', 'image/jpeg', {'content-length': String(maxImageBytes + 1)})), e => e.status === 413);
  await assert.rejects(readImage(request(new Uint8Array(maxImageBytes + 1))), e => e.status === 413);
});
