// src/components/common/PhotoGrid/PhotoGrid.jsx
//
// Updated to use the Google Picker API via useGooglePicker.
// Clicking 🖼️ opens Google's own hosted picker UI.
// Selected files are downloaded via Drive API, compressed,
// and saved to IndexedDB exactly like local uploads.

import { useRef, useState, useEffect } from "react";
import styles from "./PhotoGrid.module.css";
import { savePhoto, getPhotos, deletePhoto } from "@/utils/photoStorage";
import { useGooglePicker, downloadAndCompressPickerPhoto } from "@/hooks/useGooglePicker";

export default function PhotoGrid({ photos = [], onChange, maxPreview = 5 }) {
  const fileInputRef                = useRef(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState(null);
  const [importing,    setImporting]    = useState(false);
  const [importStatus, setImportStatus] = useState(""); // progress text
  const [photoUrls,    setPhotoUrls]    = useState({});

  const { isReady, openPicker, getValidToken, error: pickerError } = useGooglePicker();

  // Load dataUrls for all photos from IndexedDB
  useEffect(() => {
    if (!photos.length) { setPhotoUrls({}); return; }
    const ids = photos.map(p => p.id).filter(Boolean);
    getPhotos(ids).then(map => {
      const obj = {};
      map.forEach((url, id) => { obj[id] = url; });
      setPhotoUrls(obj);
    });
  }, [photos]);

  // ── Local file upload ────────────────────────────────────────
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
        newPhotos.push({ id, caption: "", name: file.name, _migratedToIDB: true });
      } catch (err) {
        console.error("[PhotoGrid] Failed to process file:", file.name, err);
        setUploadError(`Failed to load ${file.name}`);
      }
    }

    if (newPhotos.length > 0) onChange([...photos, ...newPhotos]);
    setUploading(false);
    e.target.value = "";
  }

  // ── Google Photos import via Picker API ──────────────────────
  async function handleGooglePhotos() {
    if (!isReady) {
      setUploadError("Google APIs are still loading. Please try again.");
      return;
    }

    try {
      // Open Google's hosted picker — returns selected files or []
      const selectedFiles = await openPicker();
      if (!selectedFiles.length) return; // user cancelled

      setImporting(true);
      setImportStatus(`Importing 0 / ${selectedFiles.length}…`);

      const token     = await getValidToken();
      const newPhotos = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setImportStatus(`Importing ${i + 1} / ${selectedFiles.length}…`);

        try {
          const dataUrl = await downloadAndCompressPickerPhoto(file.url, token);
          const id      = `photo_gp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

          await savePhoto(id, dataUrl);
          setPhotoUrls(prev => ({ ...prev, [id]: dataUrl }));

          newPhotos.push({
            id,
            caption:        "",
            name:           file.name || "Google Photos import",
            _migratedToIDB: true,
            _source:        "google_photos",
          });
        } catch (err) {
          console.warn(`[PhotoGrid] Failed to import ${file.name}:`, err.message);
        }
      }

      if (newPhotos.length > 0) onChange([...photos, ...newPhotos]);

    } catch (err) {
      setUploadError(`Google Photos import failed: ${err.message}`);
    } finally {
      setImporting(false);
      setImportStatus("");
    }
  }

  // ── Remove ───────────────────────────────────────────────────
  async function removePhoto(id) {
    await deletePhoto(id);
    setPhotoUrls(prev => { const n = { ...prev }; delete n[id]; return n; });
    onChange(photos.filter(p => p.id !== id));
  }

  return (
    <div className={styles.container}>
      {(uploadError || pickerError) && (
        <p style={{ color: "var(--color-danger)", fontSize: 12, margin: "0 0 8px" }}>
          {uploadError || pickerError}
        </p>
      )}

      {importing && (
        <p style={{
          color:        "var(--color-primary-light)",
          fontSize:     12,
          margin:       "0 0 8px",
          fontWeight:   600,
        }}>
          {importStatus}
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
                  width: "100%", height: "100%",
                  background: "var(--color-surface-2)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10, color: "var(--color-text-subtle)",
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

        {/* Local upload */}
        <button
          className={styles.addBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || importing}
          title="Upload from device"
        >
          {uploading ? <span style={{ fontSize: 12 }}>…</span> : "+"}
        </button>

        {/* Google Photos via Picker API */}
        <button
          className={styles.addBtn}
          onClick={handleGooglePhotos}
          disabled={importing || uploading || !isReady}
          title={isReady ? "Import from Google Photos" : "Loading Google APIs…"}
          style={{ fontSize: 18, opacity: isReady ? 1 : 0.5 }}
        >
          {importing ? <span style={{ fontSize: 10 }}>…</span> : "🖼️"}
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
          const MAX    = 1200;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
            else                { width  = Math.round((width  * MAX) / height); height = MAX; }
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