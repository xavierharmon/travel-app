// src/components/common/PhotoGrid/PhotoGrid.jsx
//
// Local upload only — Google Photos integration removed.
// Photos are saved to IndexedDB via photoStorage.js.

import { useRef, useState, useEffect } from "react";
import styles from "./PhotoGrid.module.css";
import { savePhoto, getPhotos, deletePhoto } from "@/utils/photoStorage";

export default function PhotoGrid({ photos = [], onChange, maxPreview = 5 }) {
  const fileInputRef              = useRef(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [photoUrls,   setPhotoUrls]   = useState({});

  // Load dataUrls from IndexedDB whenever the photo list changes
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
        if (!dataUrl || !dataUrl.startsWith("data:image")) continue;

        const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await savePhoto(id, dataUrl);
        setPhotoUrls(prev => ({ ...prev, [id]: dataUrl }));
        newPhotos.push({
          id,
          caption:        "",
          name:           file.name,
          _migratedToIDB: true,
        });
      } catch (err) {
        console.error("[PhotoGrid] Failed to process file:", file.name, err);
        setUploadError(`Failed to load ${file.name}`);
      }
    }

    if (newPhotos.length > 0) onChange([...photos, ...newPhotos]);
    setUploading(false);
    e.target.value = "";
  }

  async function removePhoto(id) {
    await deletePhoto(id);
    setPhotoUrls(prev => { const n = { ...prev }; delete n[id]; return n; });
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
                  onError={e => { e.target.style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width:           "100%",
                  height:          "100%",
                  background:      "var(--color-surface-2)",
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  fontSize:        10,
                  color:           "var(--color-text-subtle)",
                }}>…</div>
              )}
              <div className={styles.thumbOverlay}>
                <button
                  className={styles.removeBtn}
                  onClick={() => removePhoto(photo.id)}
                  title="Remove photo"
                >✕</button>
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
    const reader   = new FileReader();
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.onload  = (e) => {
      const original = e.target.result;
      if (!original || typeof original !== "string") {
        return reject(new Error("FileReader returned empty result"));
      }
      const img   = new Image();
      img.onerror = () => resolve(original);
      img.onload  = () => {
        try {
          const MAX = 1200;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width); width = MAX;
            } else {
              width = Math.round((width * MAX) / height); height = MAX;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width  = width;
          canvas.height = height;
          const ctx     = canvas.getContext("2d");
          if (!ctx) return resolve(original);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          if (!compressed || compressed === "data:,") return resolve(original);
          resolve(compressed);
        } catch { resolve(original); }
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
  });
}