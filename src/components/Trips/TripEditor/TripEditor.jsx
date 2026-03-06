import styles from "./TripEditor.module.css";
import PlaceInput from "@/components/trips/PlaceInput";
import StopCard from "@/components/trips/StopCard";
import PhotoGrid from "@/components/common/PhotoGrid";
import Button from "@/components/common/Button";
import { generateId } from "@/utils/imageHelpers";

export default function TripEditor({ form, errors, onChange }) {
  function set(field, value) {
    onChange({ ...form, [field]: value });
  }

  function addStop() {
    const newStop = {
      id:          generateId(),
      name:        "",
      lat:         null,
      lng:         null,
      description: "",
      photos:      [],
    };
    set("stops", [...(form.stops || []), newStop]);
  }

  function updateStop(id, updated) {
    set("stops", form.stops.map(s => s.id === id ? updated : s));
  }

  function removeStop(id) {
    set("stops", form.stops.filter(s => s.id !== id));
  }

  // Guard — if form is undefined don't render anything
  if (!form) return null;

  return (
    <div className={styles.editor}>

      {/* Trip Name */}
      <div className={styles.nameRow}>
        <input
          className={`${styles.nameInput} ${errors?.name ? styles.nameInputError : ""}`}
          value={form.name || ""}
          onChange={e => set("name", e.target.value)}
          placeholder="Trip Name"
        />
        {errors?.name && <p className={styles.errorText}>{errors.name}</p>}
      </div>

      {/* Date and Description */}
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

      {/* Trip Photos */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Trip Photos</h3>
        <PhotoGrid
          photos={form.photos || []}
          onChange={photos => set("photos", photos)}
        />
      </section>

      {/* Route Builder */}
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

        {/* Stops */}
        {(form.stops || []).length > 0 && (
          <div className={styles.connectorGroup}>
            {form.stops.map((stop, i) => (
              <div key={stop.id} className={styles.stopRow}>
                <div className={styles.connectorLeft}>
                  <span className={styles.connectorLine} />
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
            ))}
          </div>
        )}

        {/* Add Stop Button */}
        <div className={styles.addStopRow}>
          <span className={styles.connectorLineShort} />
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
      </section>

    </div>
  );
}