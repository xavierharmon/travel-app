// src/components/Memories/MemoriesEditor/MemoriesEditor.jsx
//
// Pure controlled form — receives form/errors/onChange from MemoryEditorPage.
// Does NOT call addMemory/updateMemory itself (that's the page's job).

import styles from "./MemoriesEditor.module.css";
import PhotoGrid from "@/components/common/PhotoGrid";

export default function MemoriesEditor({ form, errors, onChange }) {
  if (!form) return null;

  function set(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <div className={styles.editor}>

      {/* Memory Name */}
      <div className={styles.nameRow}>
        <input
          className={`${styles.nameInput} ${errors?.name ? styles.nameInputError : ""}`}
          value={form.name || ""}
          onChange={e => set("name", e.target.value)}
          placeholder="Memory Name"
        />
        {errors?.name && <p className={styles.errorText}>{errors.name}</p>}
      </div>

      {/* Date + Description */}
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
            placeholder="What made this memory special?"
            rows={4}
          />
        </div>
      </section>

      {/* Photos */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Memory Photos</h3>
        <PhotoGrid
          photos={form.photos || []}
          onChange={photos => set("photos", photos)}
        />
      </section>

    </div>
  );
}