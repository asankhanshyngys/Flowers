export function apiError(value: unknown, fallback: string) {
  if (value && typeof value === 'object' && 'error' in value) {
    const error = value.error;
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    )
      return error.message;
  }
  return fallback;
}

export async function apiJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(
      'Не удалось прочитать ответ сервера. Обновите страницу и попробуйте снова.',
    );
  }
}
