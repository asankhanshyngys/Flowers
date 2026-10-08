// Resize before upload to keep phone photos below server request limits.
export async function preparePhoto(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Выберите фото в формате JPG, PNG или WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Фото слишком большое. Максимум — 20 МБ.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => { throw new Error('Не удалось открыть фото. Выберите другой файл.'); });
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Не удалось подготовить фото. Попробуйте другой браузер.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', .85));
    if (!blob || blob.size > 3 * 1024 * 1024) throw new Error('Выберите фото меньшего размера.');
    return blob;
  } finally { URL.revokeObjectURL(url); }
}
