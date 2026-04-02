// src/components/common/PhotoGrid/PhotoGrid.jsx
//
// Local upload only — Google Photos integration removed.
// Photos are saved to IndexedDB via photoStorage.js.
// Caption editing: pencil icon on hover → inline input below thumbnail.

import { useRef, useState, useEffect } from "react";
import styles from "./PhotoGrid.module.css";
import { savePhoto, getPhotos, deletePhoto } from "@/utils/photoStorage";

export default function PhotoGrid({ photos = [], onChange, maxPreview = 5 }) {
  const fileInputRef              = useRef(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState(null);
  const [photoUrls,    setPhotoUrls]    = useState({});
  const [editingId,    setEditingId]    = useState(null); // which photo caption is open
  const [draftCaption, setDraftCaption] = useState("");

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
    // Close caption editor if this photo was being edited
    if (editingId === id) setEditingId(null);
    await deletePhoto(id);
    setPhotoUrls(prev => { const n = { ...prev }; delete n[id]; return n; });
    onChange(photos.filter(p => p.id !== id));
  }

  function openCaption(photo) {
    setEditingId(photo.id);
    setDraftCaption(photo.caption || "");
  }

  function saveCaption(id) {
    onChange(photos.map(p =>
      p.id === id ? { ...p, caption: draftCaption.trim() } : p
    ));
    setEditingId(null);
  }

  function handleCaptionKeyDown(e, id) {
    if (e.key === "Enter")  { e.preventDefault(); saveCaption(id); }
    if (e.key === "Escape") { setEditingId(null); }
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
          const src       = photoUrls[photo.id];
          const isEditing = editingId === photo.id;
          const hasCaption = photo.caption && photo.caption.trim().length > 0;

          return (
            <div key={photo.id} className={styles.thumbWrap}>
              {/* Thumbnail */}
              <div className={styles.thumb}>
                {src ? (
                  <img
                    src={src}
                    alt={photo.caption || photo.name || "Photo"}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className={styles.thumbPlaceholder}>…</div>
                )}

                {/* Hover overlay — remove + pencil */}
                <div className={styles.thumbOverlay}>
                  {/* Pencil / caption button */}
                  <button
                    className={`${styles.captionBtn} ${isEditing ? styles.captionBtnActive : ""}`}
                    onClick={() => isEditing ? saveCaption(photo.id) : openCaption(photo)}
                    title={isEditing ? "Save caption" : "Add caption"}
                  >
                    ✏
                  </button>

                  {/* Remove button */}
                  <button
                    className={styles.removeBtn}
                    onClick={() => removePhoto(photo.id)}
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>

                {/* Caption indicator dot — visible when caption exists and not editing */}
                {hasCaption && !isEditing && (
                  <div className={styles.captionDot} title={photo.caption} />
                )}
              </div>

              {/* Inline caption editor — slides open below thumbnail */}
              {isEditing && (
                <div className={styles.captionEditor}>
                  <input
                    autoFocus
                    className={styles.captionInput}
                    value={draftCaption}
                    onChange={e => setDraftCaption(e.target.value)}
                    onKeyDown={e => handleCaptionKeyDown(e, photo.id)}
                    onBlur={() => saveCaption(photo.id)}
                    placeholder="Add a caption…"
                    maxLength={120}
                  />
                </div>
              )}

              {/* Caption preview below thumb when not editing */}
              {hasCaption && !isEditing && (
                <p className={styles.captionPreview}>{photo.caption}</p>
              )}
            </div>
          );
        })}

        {/* Add button */}
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