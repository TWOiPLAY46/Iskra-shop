/**
 * Helper utility for optimizing and converting uploaded image files from local PC
 * into compressed Data URLs suitable for Firestore, RTDB and LocalStorage storage.
 */
export async function optimizeImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.85
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Будь ласка, оберіть дійсний файл зображення (PNG, JPG, WEBP, тощо).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не вдалося прочитати обраний файл'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        return reject(new Error('Помилка завантаження вмісту файлу'));
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Помилка декодування зображення'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const approxKb = Math.round((src.length * 3) / 4 / 1024);
          return resolve({ dataUrl: src, sizeKb: approxKb, width: img.width, height: img.height });
        }

        // Draw image
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = '';
        try {
          // Prefer WebP for high quality and small payload
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({
          dataUrl,
          sizeKb,
          width,
          height
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
