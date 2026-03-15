// src/components/trips/TripEditor/TripEditor.jsx
import { useRef, useState } from "react";
import styles from "./TripEditor.module.css";
import PlaceInput from "@/components/trips/PlaceInput";
import StopCard from "@/components/trips/StopCard";
import PhotoGrid from "@/components/common/PhotoGrid";
import Button from "@/components/common/Button";
import { generateId } from "@/utils/imageHelpers";
import { TRAVEL_MODES, TRAVEL_MODE_LABELS, TRAVEL_MODE_COLORS } from "@/constants";

export default function TripEditor({ form, errors, onChange }) {
  // Track which stop index is being dragged
  const dragIndexRef = useRef(null);
  // Track visual drag-over index for highlight
  const [dragOverIndex, setDragOverIndex] = useState(null);

  function set(field, value) {
    onChange({ ...form, [field]: value });
  }

  // ── Stop management ──────────────────────────────────────────

  /** Append a new blank stop at the end */
  function addStop() {
    insertStopAt((form.stops || []).length);
  }

  /** Insert a blank stop at a specific index */
  function insertStopAt(index) {
    const newStop = {
      id:          generateId(),
      name:        "",
      lat:         null,
      lng:         null,
      description: "",
      photos:      [],
      travelMode:  TRAVEL_MODES.DRIVE,
    };
    const stops = [...(form.stops || [])];
    stops.splice(index, 0, newStop);
    set("stops", stops);
  }

  function updateStop(id, updated) {
    set("stops", form.stops.map(s => s.id === id ? updated : s));
  }

  function removeStop(id) {
    set("stops", form.stops.filter(s => s.id !== id));
  }

  // ── Drag-and-drop reordering ──────────────────────────────────

  function handleDragStart(e, index) {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    // Slight delay so the ghost image renders before we style the element
    requestAnimationFrame(() => {
      e.target.closest(`.${styles.stopRow}`)?.classList.add(styles.dragging);
    });
  }

  function handleDragEnd(e) {
    e.target.closest(`.${styles.stopRow}`)?.classList.remove(styles.dragging);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const stops = [...(form.stops || [])];
    const [moved] = stops.splice(fromIndex, 1);
    stops.splice(dropIndex, 0, moved);
    set("stops", stops);
    setDragOverIndex(null);
  }

  // ── Render ────────────────────────────────────────────────────

  if (!form) return null;

  const stops = form.stops || [];

  return (
    <div className={styles.editor}>

      {/* ── Trip Name ─────────────────────────── */}
      <div className={styles.nameRow}>
        <input
          className={`${styles.nameInput} ${errors?.name ? styles.nameInputError : ""}`}
          value={form.name || ""}
          onChange={e => set("name", e.target.value)}
          placeholder="Trip Name"
        />
        {errors?.name && <p className={styles.errorText}>{errors.name}</p>}
      </div>

      {/* ── Date and Description ──────────────── */}
      <section className={styles.section}>
        <div className={styles.field}>
          <label className={styles.label}>Date</label>
          <input
            type="date"
            className={styles.input}
            value={form.date || ""}
            onChange={e => set("date", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description / Notes</label>
          <textarea
            className={styles.textarea}
            value={form.description || ""}
            onChange={e => set("description", e.target.value)}
            placeholder="What made this trip special?"
            rows={4}
          />
        </div>
      </section>

      {/* ── Trip Photos ───────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Trip Photos</h3>
        <PhotoGrid
          photos={form.photos || []}
          onChange={photos => set("photos", photos)}
        />
      </section>

      {/* ── Route Builder ─────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Route</h3>

        {/* Origin */}
        <div className={styles.routeRow}>
          <span className={`${styles.routeDot} ${styles.originDot}`} />
          <div className={styles.routeField}>
            <PlaceInput
              label="Origin"
              value={form.origin}
              onSelect={v => set("origin", v)}
              placeholder="Where did you start?"
            />
          </div>
        </div>

        {/* Insert-before-first-stop button */}
        <InsertStopButton onClick={() => insertStopAt(0)} />

        {/* Intermediate stops */}
        {stops.length > 0 && (
          <div className={styles.connectorGroup}>
            {stops.map((stop, i) => (
              <div key={stop.id}>
                {/* Draggable stop row */}
                <div
                  className={`${styles.stopRow} ${dragOverIndex === i ? styles.dragOver : ""}`}
                  draggable
                  onDragStart={e => handleDragStart(e, i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={e => handleDrop(e, i)}
                >
                  {/* Drag handle + connector */}
                  <div className={styles.connectorLeft}>
                    <span className={styles.connectorLine} />
                    <span
                      className={styles.dragHandle}
                      title="Drag to reorder"
                    >
                      ⠿
                    </span>
                    <span className={`${styles.routeDot} ${styles.stopDot}`} />
                    <span className={styles.connectorLine} />
                  </div>

                  <div className={styles.stopCardWrap}>
                    <StopCard
                      stop={stop}
                      index={i}
                      onChange={updated => updateStop(stop.id, updated)}
                      onRemove={() => removeStop(stop.id)}
                    />
                  </div>
                </div>

                {/* Insert-between button after each stop */}
                <InsertStopButton onClick={() => insertStopAt(i + 1)} />
              </div>
            ))}
          </div>
        )}

        {/* Add Stop button (appends to end) */}
        <div className={styles.addStopRow}>
          <button className={styles.addStopBtn} onClick={addStop}>
            <span className={styles.addStopIcon}>+</span>
            Add Stop
          </button>
          <span className={styles.connectorLineShort} />
        </div>

        {/* Destination */}
        <div className={styles.routeRow}>
          <span className={`${styles.routeDot} ${styles.destDot}`} />
          <div className={styles.routeField}>
            <PlaceInput
              label="Destination"
              value={form.destination}
              onSelect={v => set("destination", v)}
              placeholder="Where did you end up?"
            />
          </div>
        </div>

        {/* Destination travel mode */}
        <div className={styles.travelModeRow}>
          <span className={styles.travelModeLabel}>Got there by</span>
          <div className={styles.travelModeBtns}>
            {Object.values(TRAVEL_MODES).map(mode => (
              <button
                key={mode}
                className={`${styles.travelModeBtn} ${
                  (form.destinationTravelMode || TRAVEL_MODES.DRIVE) === mode
                    ? styles.travelModeBtnActive
                    : ""
                }`}
                style={
                  (form.destinationTravelMode || TRAVEL_MODES.DRIVE) === mode
                    ? { background: TRAVEL_MODE_COLORS[mode], borderColor: TRAVEL_MODE_COLORS[mode] }
                    : {}
                }
                onClick={() => set("destinationTravelMode", mode)}
              >
                {TRAVEL_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Small inline insert-stop button rendered between stops ──────
function InsertStopButton({ onClick }) {
  return (
    <div className={styles.insertStopRow}>
      <span className={styles.connectorLineShort} />
      <button className={styles.insertStopBtn} onClick={onClick} title="Insert stop here">
        <span className={styles.insertStopIcon}>+</span>
      </button>
      <span className={styles.connectorLineShort} />
    </div>
  );
}