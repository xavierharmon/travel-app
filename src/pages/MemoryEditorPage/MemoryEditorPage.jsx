import { useState, useCallback } from "react";
import styles from "./MemoryEditorPage.module.css";
import { useMemories } from "@/hooks/useMemories";
import { generateId } from "@/utils/imageHelpers";
import MemoryEditor from "@/components/Memories/MemoriesEditor";
import Button from "@/components/common/Button";

export default function MemoryEditorPage({ memory, onBack }) {
    const { addMemory, updateMemory } = useMemories();
    const isNew = !memory?.id;

    const [form, setForm] = useState(() => {
        if (!memory) {
            return {
                id: null, 
                date: new Date().toISOString().slice(0,10),
                name: "",
                description: "",
                photos: "",

            };
        }
        return {...memory };
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
            addMemory({ ...memory, id: generateId() });

        } else {
            updateMemory({ ...memory });
        }
        onBack();
    }

    return (
        <div className={styles.page}>
            <div className={styles.inner}>

                {/* top bar */}
                <div className={styles.topBar}>
                    <Button variant="ghost" onClick={onBack}>← Back</Button>
                    <Button variant="primary" onClick={handleSave}>
                        {isNew ? "Save Memory" : "Update Memory"}
                    </Button>
                </div>
            </div>

        {/*render form*/}
        <MemoryEditor
            form={form}
            errors={errors}
            onChange={handleFormChange}
        />

        </div>
    );

}