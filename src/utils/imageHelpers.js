import imageCompression from "browser-image-compression";
import { MAX_IMAGE_SIZE_MB, MAX_IMAGE_DIMENSION } from "@/constants";

export async function processImage(file) {
  const options = {
    maxSizeMB:       MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: MAX_IMAGE_DIMENSION,
    useWebWorker:    true,
  };

  try {
    const compressed = await imageCompression(file, options);
    return await fileToDataUrl(compressed);
  } catch (err) {
    console.warn("[imageHelpers] Compression failed, using original:", err);
    return await fileToDataUrl(file);
  }
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function generatePhotoId() {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}