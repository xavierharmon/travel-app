import { useState } from "react";
import styles from "./StopCard.module.css";
import PlaceInput from "@/components/trips/PlaceInput";
import PhotoGrid from "@/components/common/PhotoGrid";
import Button from "@/components/common/Button";

export default function StopCard({ stop, index, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.dot} />
        <div className={styles.inputWrap}>
          <PlaceInput
            label={`Stop ${index + 1}`}
            value={stop}
            onSelect={place => onChange({ ...stop, ...place })}
            placeholder="City, park, landmark…"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setExpanded(e => !e)}
          className={styles.expandBtn}
        >
          {expanded ? "▲" : "▼"}
        </Button>
        <Button variant="danger" size="sm" onClick={onRemove}>✕</Button>
      </div>

      {expanded && (
        <div className={styles.details}>
          <label className={styles.detailLabel}>Notes</label>
          <textarea
            className={styles.textarea}
            value={stop.description || ""}
            onChange={e => onChange({ ...stop, description: e.target.value })}
            placeholder="What did you see or experience here?"
            rows={3}
          />

          <label className={styles.detailLabel}>Photos</label>
          <PhotoGrid
            photos={stop.photos || []}
            onChange={photos => onChange({ ...stop, photos })}
          />
        </div>
      )}
    </div>
  );
}