import styles from "./TripCard.module.css";
import Button from "@/components/common/Button";
import { MAX_PHOTOS_PREVIEW } from "@/constants";

export default function TripCard({ trip, onView, onEdit, onDelete }) {
  const allStops = [trip.origin, ...(trip.stops || []), trip.destination].filter(Boolean);

  return (
    <div className={styles.card}>
      <div className={styles.body}>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h2 className={styles.name}>{trip.name || "Untitled Trip"}</h2>
            {trip.date && <span className={styles.date}>{trip.date}</span>}
          </div>

          {allStops.length > 0 && (
            <p className={styles.route}>
              {allStops.map((s, i) => (
                <span key={i}>
                  <span
                    className={styles.dot}
                    style={{ color: i === 0 ? "var(--color-success)" : i === allStops.length - 1 ? "var(--color-danger)" : "var(--color-primary)" }}
                  >⬤ </span>
                  {s.name?.split(",")[0]}
                  {i < allStops.length - 1 && <span className={styles.arrow}> → </span>}
                </span>
              ))}
            </p>
          )}

          {trip.description && (
            <p className={styles.description}>
              {trip.description.length > 140
                ? trip.description.slice(0, 140) + "…"
                : trip.description}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={() => onView(trip)}>Map</Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(trip)}>Edit</Button>
          <Button variant="danger"    size="sm" onClick={() => onDelete(trip.id)}>Delete</Button>
        </div>
      </div>

      {trip.photos?.length > 0 && (
        <div className={styles.photoStrip}>
          {trip.photos.slice(0, MAX_PHOTOS_PREVIEW).map(p => (
            <img key={p.id} src={p.dataUrl} alt={p.caption || ""} className={styles.photo} />
          ))}
          {trip.photos.length > MAX_PHOTOS_PREVIEW && (
            <div className={styles.morePhotos}>
              +{trip.photos.length - MAX_PHOTOS_PREVIEW}
            </div>
          )}
        </div>
      )}
    </div>
  );
}