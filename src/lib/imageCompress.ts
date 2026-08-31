/**
 * Compress an image file in the browser and return a small JPEG/WebP data URL.
 * Used for chat attachments so uploads stay fast on rural connections.
 */
export async function compressToDataUrl(
  file: File,
  maxDim = 900,
  quality = 0.7,
): Promise<string> {
  const sourceUrl = URL.createObjectURL(file);

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas-unavailable'));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('image-decode-failed'));
      img.src = sourceUrl;
    });
    return dataUrl;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
