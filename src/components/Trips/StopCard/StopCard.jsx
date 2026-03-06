// src/components/trips/StopCard/StopCard.jsx
import { useState } from "react";
import styles from "./StopCard.module.css";
import PlaceInput from "@/components/trips/PlaceInput";
import PhotoGrid from "@/components/common/PhotoGrid";
import Button from "@/components/common/Button";
import { TRAVEL_MODES, TRAVEL_MODE_LABELS } from "@/constants";

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

      {/* Travel mode selector — how did you get to this stop */}
      <div className={styles.travelModeRow}>
        <span className={styles.travelModeLabel}>Got here by</span>
        <div className={styles.travelModeBtns}>
          {Object.values(TRAVEL_MODES).map(mode => (
            <button
              key={mode}
              className={`${styles.travelModeBtn} ${(stop.travelMode || TRAVEL_MODES.DRIVE) === mode ? styles.travelModeBtnActive : ""}`}
              onClick={() => onChange({ ...stop, travelMode: mode })}
            >
              {TRAVEL_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
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