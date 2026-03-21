// src/components/common/PhotoGrid/PhotoGrid.jsx
//
// Updated to use IndexedDB via photoStorage.js.
// The photo objects stored in React state / context NO LONGER contain
// a dataUrl field. Instead:
//   - On upload: dataUrl is written to IndexedDB keyed by photo.id,
//     then the photo object (without dataUrl) is passed to onChange.
//   - On render: dataUrl is read from IndexedDB and held in local
//     component state (photoUrls map).
//   - On delete: the IndexedDB record is deleted, then onChange fires.
//
// The public shape of a photo object remains:
//   { id, caption, name, _migratedToIDB }
// dataUrl is intentionally absent from the persisted object.

import { useRef, useState, useEffect } from "react";
import styles from "./PhotoGrid.module.css";
import { savePhoto, getPhotos, deletePhoto } from "@/utils/photoStorage";

export default function PhotoGrid({ photos = [], onChange, maxPreview = 5 }) {
  const fileInputRef = useRef(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Local map of id → dataUrl, populated from IndexedDB
  const [photoUrls, setPhotoUrls] = useState({});

  // Whenever the photos list changes, fetch any missing dataUrls from IDB
  useEffect(() => {
    if (!photos.length) { setPhotoUrls({}); return; }

    const ids = photos.map(p => p.id).filter(Boolean);
    getPhotos(ids).then(map => {
      const obj = {};
      map.forEach((url, id) => { obj[id] = url; });
      setPhotoUrls(obj);
    });
  }, [photos]);

  async function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setUploadError(null);
    const newPhotos = [];

    for (const file of files) {
      try {
        const dataUrl = await readAndCompress(file);

        if (!dataUrl || !dataUrl.startsWith("data:image")) {
          console.error("[PhotoGrid] Invalid dataUrl for file:", file.name);
          continue;
        }

        const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        // Save to IndexedDB — NOT to the photo object
        await savePhoto(id, dataUrl);

        // Update local preview map immediately (no round-trip needed)
        setPhotoUrls(prev => ({ ...prev, [id]: dataUrl }));

        // Photo object stored in context has no dataUrl
        newPhotos.push({
          id,
          caption: "",
          name:    file.name,
          _migratedToIDB: true,
        });
      } catch (err) {
        console.error("[PhotoGrid] Failed to process file:", file.name, err);
        setUploadError(`Failed to load ${file.name}`);
      }
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }

    setUploading(false);
    e.target.value = "";
  }

  async function removePhoto(id) {
    // Remove from IndexedDB
    await deletePhoto(id);
    // Remove from local preview map
    setPhotoUrls(prev => { const n = { ...prev }; delete n[id]; return n; });
    // Remove from parent state
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
        {photos.map(photo => {
          const src = photoUrls[photo.id];
          return (
            <div key={photo.id} className={styles.thumb}>
              {src ? (
                <img
                  src={src}
                  alt={photo.caption || photo.name || "Photo"}
                  onError={e => e.target.style.display = "none"}
                />
              ) : (
                // Placeholder while IDB fetch is in flight
                <div style={{
                  width: "100%", height: "100%",
                  background: "var(--color-surface-2)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10, color: "var(--color-text-subtle)",
                }}>
                  …
                </div>
              )}
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
          );
        })}

        <button
          className={styles.addBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Add photos"
        >
          {uploading ? <span style={{ fontSize: 12 }}>…</span> : "+"}
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

// ── Compress + base64 encode via Canvas ──────────────────────────
function readAndCompress(file) {
  return new Promise((resolve, reject) => {
    const reader    = new FileReader();
    reader.onerror  = () => reject(new Error("FileReader failed"));
    reader.onload   = (e) => {
      const original = e.target.result;
      if (!original || typeof original !== "string") {
        return reject(new Error("FileReader returned empty result"));
      }

      const img      = new Image();
      img.onerror    = () => resolve(original);
      img.onload     = () => {
        try {
          const MAX    = 1200;
          let { width, height } = img;

          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
            else                { width  = Math.round((width  * MAX) / height); height = MAX; }
          }

          const canvas  = document.createElement("canvas");
          canvas.width  = width;
          canvas.height = height;
          const ctx     = canvas.getContext("2d");
          if (!ctx) return resolve(original);

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);

          if (!compressed || compressed === "data:,") return resolve(original);
          resolve(compressed);
        } catch (err) {
          resolve(original);
        }
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
  });
}