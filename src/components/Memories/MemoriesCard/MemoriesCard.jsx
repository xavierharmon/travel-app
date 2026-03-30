import styles from "./MemoriesCard.module.css";
import Button from "@/components/common/Button";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";

export default function MemoriesCard({ memory, onView, onEdit, onDelete }) {

    const allPhotos = [
        ...(memory.photos || []),
    ];

    previewPhotos = allPhotos.slice(0, 5);
    const extraCount = allPhotos.length - previewPhotos.length;

    const photoUrls = usePhotoUrls(previewPhotos);

    return (
        <div className={styles.card}>

            {/*Top Row */}
            <div className={styles.header}>
                <div className={styles.titleBlock}>
                    <div className={styles.titleRow}>
                        <h2 className={styles.name}>{memory.name}</h2>
                    </div>
                </div>
            </div>

            <div className={styles.metaRow}>
                {memory.date && <span className={styles.date}>{memory.date}</span>}
            </div>
        </div>
    )
}