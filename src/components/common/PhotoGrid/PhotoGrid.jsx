import { useRef, useState } from "react";
import styles from "./PhotoGrid.module.css";

export default function PhotoGrid({ photos = [], onChange, maxPreview = 5 }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  async function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setUploadError(null);
    const newPhotos = [];

    for (const file of files) {
      try {
        const dataUrl = await readAndCompress(file);

        // Validate the result before saving
        if (!dataUrl || !dataUrl.startsWith("data:image")) {
          console.error("[PhotoGrid] Invalid dataUrl for file:", file.name);
          continue;
        }

        newPhotos.push({
          id:      `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          dataUrl,
          caption: "",
          name:    file.name,
        });
      } catch (err) {
        console.error("[PhotoGrid] Failed to process file:", file.name, err);
        setUploadError(`Failed to load ${file.name}`);
      }
    }

    if (newPhotos.length > 0) {
      const updated = [...photos, ...newPhotos];
      console.log("[PhotoGrid] Saving", newPhotos.length, "new photos, total:", updated.length);
      onChange(updated);
    }

    setUploading(false);
    // Reset input so the same file can be re-added
    e.target.value = "";
  }

  function removePhoto(id) {
    onChange(photos.filter(p => p.id !== id));
  }

  return (
    <div className={styles.container}>
      {uploadError && (
        <p style={{ color: "var(--color-danger)", fontSize: 12, margin: "0 0 8px" }}>
          {uploadError}
        </p>
      )}

      <div className={styles.grid}>
        {photos.map(photo => (
          <div key={photo.id} className={styles.thumb}>
            <img
              src={photo.dataUrl}
              alt={photo.caption || photo.name || "Trip photo"}
              onError={e => {
                // This fires if the dataUrl is corrupted
                console.error("[PhotoGrid] Image failed to render, id:", photo.id);
                e.target.style.display = "none";
              }}
            />
            <div className={styles.thumbOverlay}>
              <button
                className={styles.removeBtn}
                onClick={() => removePhoto(photo.id)}
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {/* Add button */}
        <button
          className={styles.addBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Add photos"
        >
          {uploading ? (
            <span style={{ fontSize: 12 }}>…</span>
          ) : (
            "+"
          )}
        </button>
      </div>

      {photos.length > maxPreview && (
        <p className={styles.count}>{photos.length} photos total</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

// Compress and convert to base64 using Canvas
// No external library needed
function readAndCompress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("FileReader failed"));

    reader.onload = (e) => {
      const originalDataUrl = e.target.result;

      // Validate the raw read result
      if (!originalDataUrl || typeof originalDataUrl !== "string") {
        return reject(new Error("FileReader returned empty result"));
      }

      const img = new Image();

      img.onerror = () => {
        // If image fails to load just use the original uncompressed
        console.warn("[PhotoGrid] Image load failed, using original");
        resolve(originalDataUrl);
      };

      img.onload = () => {
        try {
          // Resize to max 1200px on longest side
          const MAX = 1200;
          let { width, height } = img;

          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width);
              width  = MAX;
            } else {
              width  = Math.round((width * MAX) / height);
              height = MAX;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width  = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Canvas not supported — fall back to original
            return resolve(originalDataUrl);
          }

          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.82);

          // Final validation
          if (!compressed || compressed === "data:,") {
            console.warn("[PhotoGrid] Canvas compression failed, using original");
            return resolve(originalDataUrl);
          }

          console.log(
            "[PhotoGrid] Compressed",
            file.name,
            `${(originalDataUrl.length / 1024).toFixed(0)}KB →`,
            `${(compressed.length / 1024).toFixed(0)}KB`
          );

          resolve(compressed);
        } catch (err) {
          console.warn("[PhotoGrid] Compression error, using original:", err);
          resolve(originalDataUrl);
        }
      };

      img.src = originalDataUrl;
    };

    reader.readAsDataURL(file);
  });
}