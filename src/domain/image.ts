export const MAX_IMAGE_SIDE = 1200
const JPEG_QUALITY = 0.85

export class ImageDecodeError extends Error {
  constructor() {
    super('Не удалось прочитать файл как изображение')
    this.name = 'ImageDecodeError'
  }
}

/** Размер, при котором длинная сторона не больше max. Маленькие картинки не увеличиваются. */
export function fitSize(width: number, height: number, max = MAX_IMAGE_SIDE): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= max) return { width, height }
  const ratio = max / longest
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

/**
 * Уменьшает фото и перекодирует в JPEG. Ориентацию из EXIF применяет createImageBitmap.
 * JPEG, а не WebP: кодирование WebP через canvas в Safari ненадёжно.
 */
export async function compressImage(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ImageDecodeError()
  }

  try {
    const { width, height } = fitSize(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageDecodeError()
    ctx.drawImage(bitmap, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new ImageDecodeError())), 'image/jpeg', JPEG_QUALITY)
    })
  } finally {
    bitmap.close()
  }
}
