// src/components/Memories/MemoriesCard/MemoriesCard.jsx
import styles from "./MemoriesCard.module.css";
import Button from "@/components/common/Button";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";

export default function MemoriesCard({ memory, onEdit, onDelete }) {
  const allPhotos    = [...(memory.photos || [])];
  const previewPhotos = allPhotos.slice(0, 5);   // ← was missing "const"
  const extraCount   = allPhotos.length - previewPhotos.length;

  const photoUrls = usePhotoUrls(previewPhotos);

  return (
    <div className={styles.card}>

      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <h2 className={styles.name}>{memory.name}</h2>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={() => onEdit(memory)}>Edit</Button>
          <Button variant="danger"    size="sm" onClick={() => onDelete(memory.id)}>✕</Button>
        </div>
      </div>

      {/* Meta */}
      <div className={styles.metaRow}>
        {memory.date && <span className={styles.date}>{memory.date}</span>}
      </div>

      {/* Photo strip */}
      {previewPhotos.length > 0 && (
        <div className={styles.photoStrip}>
          {previewPhotos.map((photo, i) => {
            const src = photoUrls.get(photo.id);
            if (!src) return null;
            return (
              <div key={photo.id} className={styles.photoThumb}>
                <img
                  src={src}
                  alt={photo.caption || `Photo ${i + 1}`}
                  className={styles.photoImg}
                />
                {i === previewPhotos.length - 1 && extraCount > 0 && (
                  <div className={styles.photoOverlay}>+{extraCount}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Description */}
      {memory.description && (
        <p className={styles.description}>{memory.description}</p>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        {allPhotos.length > 0 && (
          <span className={styles.footerStat}>
            📷 {allPhotos.length} photo{allPhotos.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

    </div>
  );
}