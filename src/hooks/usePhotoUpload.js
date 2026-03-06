import { useCallback, useState } from "react";
import { processImage, generatePhotoId } from "@/utils/imageHelpers";

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);

  const processFiles = useCallback(async (files) => {
    setUploading(true);
    const results = [];

    for (const file of Array.from(files)) {
      try {
        const dataUrl = await processImage(file);
        results.push({ id: generatePhotoId(), dataUrl, caption: "" });
      } catch (err) {
        console.error("[usePhotoUpload] Failed to process file:", file.name, err);
      }
    }

    setUploading(false);
    return results;
  }, []);

  return { processFiles, uploading };
}