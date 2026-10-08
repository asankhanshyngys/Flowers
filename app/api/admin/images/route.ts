import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { requireAdmin, requireMutationOrigin } from '@/server/auth';
import { readImage } from '@/server/image-upload';
import { respond } from '@/server/http';
import { HttpError } from '@/server/validation';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return respond(async () => {
    await requireAdmin();
    requireMutationOrigin(request);
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, 'storage_unavailable', 'Загрузка фото пока не настроена.');
    const image = await readImage(request);
    try {
      const blob = await put(`products/${randomUUID()}.webp`, image, {access: 'public', contentType: 'image/webp', addRandomSuffix: false});
      return {url: blob.url};
    } catch {
      throw new HttpError(503, 'upload_failed', 'Не удалось сохранить фото. Попробуйте снова.');
    }
  }, 201);
}
