// src/pages/MemoryEditorPage/MemoryEditorPage.jsx
import { useState, useCallback } from "react";
import styles from "./MemoryEditorPage.module.css";
import { useMemories } from "@/hooks/useMemories";
import { generateId } from "@/utils/imageHelpers";
import MemoriesEditor from "@/components/Memories/MemoriesEditor";
import Button from "@/components/common/Button";

export default function MemoryEditorPage({ memory, onBack }) {
  const { addMemory, updateMemory } = useMemories();
  const isNew = !memory?.id;

  const [form, setForm] = useState(() => {
    if (!memory) {
      return {
        id:          null,
        date:        new Date().toISOString().slice(0, 10),
        name:        "",
        description: "",
        photos:      [],
        memorytag:   "",
        location:    "",
      };
    }
    return { ...memory };
  });

  const [errors, setErrors] = useState({});

  const handleFormChange = useCallback((updated) => {
    setForm(updated);
  }, []);

  function validate() {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Memory name is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (isNew) {
      addMemory({ ...form, id: generateId() });
    } else {
      updateMemory({ ...form });
    }
    onBack();
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <div className={styles.topActions}>
            <Button variant="primary" onClick={handleSave}>
              {isNew ? "Save Memory" : "Update Memory"}
            </Button>
          </div>
        </div>

        {/* Validation error */}
        {errors.name && (
          <div style={{
            background:   "rgba(239,68,68,0.1)",
            border:       "1px solid var(--color-danger)",
            borderRadius: "var(--radius-md)",
            padding:      "10px 14px",
            marginBottom: 12,
            fontSize:     13,
            color:        "var(--color-danger)",
          }}>
            ⚠ {errors.name}
          </div>
        )}

        <MemoriesEditor
          form={form}
          errors={errors}
          onChange={handleFormChange}
        />

        {/* Bottom save button */}
        <div className={styles.bottomActions}>
          <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
            {isNew ? "Save Memory" : "Update Memory"}
          </Button>
        </div>

      </div>
    </div>
  );
}