import sharp from 'sharp';
import { HttpError } from './validation.ts';
export const maxImageBytes = 3 * 1024 * 1024;
export async function readImage(request: Request) {
  const type = request.headers.get('content-type')?.split(';')[0].trim();
  if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type))
    throw new HttpError(415, 'invalid_image', 'Выберите фото JPG, PNG или WebP.');
  if (Number(request.headers.get('content-length')) > maxImageBytes)
    throw new HttpError(413, 'too_large', 'Фото слишком большое. Выберите другое.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'empty_image', 'Выберите фото.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxImageBytes) { await reader.cancel(); throw new HttpError(413, 'too_large', 'Фото слишком большое.'); }
    chunks.push(value);
  }
  try {
    const photo = sharp(Buffer.concat(chunks), {limitInputPixels: 36_000_000});
    const metadata = await photo.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) throw new Error('Invalid format');
    // Re-encode actual pixels; discard metadata and any appended payload.
    return await photo.rotate().resize(1800, 1800, {fit: 'inside', withoutEnlargement: true}).webp({quality: 85}).toBuffer();
  } catch {
    throw new HttpError(400, 'invalid_image', 'Файл повреждён или не является фото JPG, PNG или WebP.');
  }
}
