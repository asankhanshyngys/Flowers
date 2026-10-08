import { HttpError } from './validation.ts';
export async function jsonBody(request: Request) {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    throw new HttpError(
      415,
      'unsupported_media',
      'Отправьте данные в формате application/json.',
    );
  if (Number(request.headers.get('content-length')) > 32768)
    throw new HttpError(413, 'too_large', 'Слишком большой запрос.');
  const reader = request.body?.getReader();
  if (!reader)
    throw new HttpError(400, 'invalid_json', 'Необходимо тело запроса JSON.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 32768) {
      await reader.cancel();
      throw new HttpError(413, 'too_large', 'Слишком большой запрос.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new HttpError(400, 'invalid_json', 'Некорректный JSON.');
  }
}
export async function respond(action: () => Promise<unknown>, status = 200) {
  try {
    return Response.json(await action(), {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof HttpError)
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status, headers: { 'Cache-Control': 'no-store' } },
      );
    const message = error instanceof Error ? error.message : '';
    if (/UNIQUE constraint/.test(message))
      return Response.json(
        {
          error: {
            code: 'conflict',
            message: 'Этот идентификатор уже занят.',
          },
        },
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      );
    console.error('Catalog operation failed', error);
    return Response.json(
      {
        error: {
          code: 'unavailable',
          message: 'Каталог временно недоступен. Попробуйте снова.',
        },
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
