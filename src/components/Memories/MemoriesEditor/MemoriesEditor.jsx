import { useState } from 'react';
import styles from "./MemoriesEditor.module.css";
import { useMemories } from "@/context/MemoriesContext";
import { generateId } from "@/utils/imageHelpers";
import Button from "@/components/common/Button";
import PhotoGrid from "@/components/common/PhotoGrid";

export default function MemoriesEditor({ memory, onBack}) {
    const { addMemory, updateMemory } = useMemories();
    const isNew = !memory?.id;

    const [form, setForm] = useState(() => {
        if (!memory) {
            return {
                id: null, 
                date: new Date().toISOString().slice(0,10),
                name: "",
                description: "",
                photos: [],

            };
        }
        return {...memory };
    });

    const [errors, setErrors] = useState({});

    function handleSave() {
        if (!validate()) return;
        if (isNew) {
            addMemory({...toSave, id: generateId() });
        } else {
            updateMemory({...toSave});
        }
        onBack();
    }

    return (
        <div className={styles.editor}>
            {/*TripName*/}
            <div className={styles.nameRow}>
                <input
                    className={`${styles.nameInput} ${errors?.name ? styles.nameInputError : ""}`}
                    value={form.name || ""}
                    onChange={e => set("name", e.target.value)}
                    placeholder="MemoryName"
                />
                {errors?.name && <p className={styles.errorText}>{errors.name} </p>}
            </div>

            {/*Description*/}
            <section className={styles.section}>
                <div className={styles.field}>
                    <label className={styles.label}>Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={form.date || ""}
                        onChange={e => set("date",e.target.value)}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Description / Notes</label>
                    <textarea
                        className={styles.textarea}
                        value={form.description || ""}
                        onChange={e => set("description", e.target.valeu)}
                        placeholder="What made this memory special?"
                        rows={4}
                    />
                </div>
            </section>

            {/*Photos*/}
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