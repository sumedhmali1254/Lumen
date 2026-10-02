// ═══════════════════════════════════════════════════════════════════════════
// LUMEN — Seamless Thermal Hotspot Isolator
// Preserves the authentic Grad-CAM thermal colors (Red -> Orange -> Yellow -> Green -> Cyan)
// while making the cold blue/purple background and mask boundary completely transparent.
// Only truly affected (hot) regions remain visible.
// ═══════════════════════════════════════════════════════════════════════════

const processedCache = new Map();

export async function createCleanThermalOverlay(imageSrc) {
  if (!imageSrc) return "";
  if (processedCache.has(imageSrc)) {
    return processedCache.get(imageSrc);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = img.naturalWidth || img.width || 512;
        const h = img.naturalHeight || img.height || 512;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Already transparent — skip
          if (a === 0) continue;

          // Measure how "warm" the pixel is:
          // Warm thermal colors have R or G significantly above B
          const redWarmth = r - b;
          const greenWarmth = g - b;
          const warmthSignal = Math.max(redWarmth, greenWarmth);

          // Kill any pixel that is blue-dominant or has negligible warmth
          // This removes all the blush/purple/blue wash
          if (warmthSignal < 30) {
            // Cold pixel — make fully transparent
            data[i + 3] = 0;
          } else {
            // Scale alpha by warmth intensity — hotter = more opaque
            const normalized = Math.min(1.0, (warmthSignal - 30) / 80);
            // Steep power curve so only strong activations show
            const alpha = Math.min(a, Math.round(Math.pow(normalized, 1.5) * 230));
            data[i + 3] = alpha;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const cleanDataUri = canvas.toDataURL("image/png");
        processedCache.set(imageSrc, cleanDataUri);
        resolve(cleanDataUri);
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
