import styles from "./MemoryListPage.module.css";
import { useMemories } from "@/hooks/useMemories";
import MemoriesCard from "@/components/memories/MemoriesCard";
import Button from "@/components/common/Button";
import { useState, useMemo } from "react";
import BackupSettingsModal from "@/components/BackupSettingsModal";

const SORT_OPTIONS = [
    { value: "date-newest", label: "Newest" },
    { value: "date-oldest", label: "Oldest" },
];

const KEY_LABELS = {
    "favorite_memories_v1": "Memories",
};

function sortMemories(memories, sortBy) {
    const sorted = [...memories];
    switch (sortBy) {
        case "date-newest":
            return sorted.sort((a,b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return b.date.localeCompare(a.date);
            });
        case "date-oldest":
            return sorted.sort((a,b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return a.date.localeCompare(b.date);
            });
    }
}

export default function MemoryListPage({onNewMemory,onEditMemory,}) {
    const { memories, loading, error, deleteMemory } = useMemories();
    const [sortBy,        setSortBy]       = useState("date-newest");

    const sortedTrips = useMemo(
        () => sortMemories(memories, sortBy),
        [memories, sortBy]
    );

    function handleDelete(id) {
        if (window.confirm("Delete this memory? This cannont be undone.")) {
            deleteMemory(id);
        }
    }
    return(
        <div className={styles.page}>
            {/*Header*/}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>
                        <img 
                            src="/memorieslogo.png"
                            alt="Xavier & Kylie's Memories"
                            className={styles.brandLogo}
                        />
                    </div>
                    <div>
                        <h1 className={styles.title}>Xavier & Kylie's Memories</h1>
                        <p className={styles.subtitle}>
                            "test"
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                    <Button onClick={onNewMemory} size="md">
                        + New Memory
                    </Button>
                </div>
            </header>

            {/*error Banner*/}
            {error && <div className={styles.errorBanner}>{error}</div>}

            {/*sort controls*/}
            {!loading && memories.length > 1 && (
                <div className={styles.sortBar}>
                    <span className={styles.sortLabel}>Sort by</span>
                    <div className={styles.sortBtns}>
                        {SORT_OPTIONS.map(opt => (
                            <Button
                                key={opt.value}
                                className={`${styles.sortBtn} ${sortBy === opt.value ? styles.sortBtnActive : ""}`}
                                onClick={() => setSortBy(opt.value)}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

        {/*memory list*/}
        <main className={styles.main}>
            {loading ? (
                <div className={styles.empty}>Loading Memories....</div>
                
            ) : memories.length === 0 ? (
                <div className={styles.empty}>
                    <img
                        src="/memorieslogo.png"
                        alt="Start a Memory"
                        style={{ width: 100, height: 100, objectFit: "contain", opacity: 0.5 }}
                    />
                    <p>
                        No memoires yet. Click <strong>New Memory</strong> to start
                        your memories!
                    </p>
                </div>
            ) : (
                <div className={styles.memoryList}>
                    {sortedMemories.map(memory => (
                        <MemoriesCard
                            key={memory.id}
                            memory={memory}
                            onEdit={onEditMemory}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </main>
        </div>
    )
}
