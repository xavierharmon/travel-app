// src/components/trips/TripCard/TripCard.jsx
import styles from "./TripCard.module.css";
import { computeTripMileage } from "@/utils/tripMileage";
import { formatMiles } from "@/utils/haversine";
import { TRAVEL_MODE_LABELS, TRAVEL_MODE_COLORS, TRAVEL_MODES } from "@/constants";
import Button from "@/components/common/Button";

export default function TripCard({ trip, onView, onEdit, onDelete }) {
  const mileage = computeTripMileage(trip);

  const allStops = [
    trip.origin,
    ...(trip.stops || []),
    trip.destination,
  ].filter(s => s?.name);

  const allPhotos = [
    ...(trip.photos || []),
    ...(trip.stops || []).flatMap(s => s.photos || []),
  ];

  const previewPhotos = allPhotos.slice(0, 4);
  const extraCount    = allPhotos.length - previewPhotos.length;

  const modesUsed = new Set();
  (trip.stops || []).forEach(s =>
    modesUsed.add(s.travelMode || TRAVEL_MODES.DRIVE)
  );
  if (trip.destination) {
    modesUsed.add(trip.destinationTravelMode || TRAVEL_MODES.DRIVE);
  }

  return (
    <div className={styles.card}>

      {/* ── Top row: title + mileage + actions ─── */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>

          {/* Name + inline mileage pills */}
          <div className={styles.titleRow}>
            <h2 className={styles.name}>{trip.name}</h2>

            {mileage && mileage.total > 0 && (
              <div className={styles.inlineMileage}>
                {mileage.drive > 0 && (
                  <span
                    className={styles.mileagePill}
                    style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.DRIVE] }}
                  >
                    🚗 {formatMiles(mileage.drive)}{mileage.hasUncachedDrive ? "~" : ""}
                  </span>
                )}
                {mileage.flight > 0 && (
                  <span
                    className={styles.mileagePill}
                    style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.FLIGHT] }}
                  >
                    ✈️ {formatMiles(mileage.flight)}
                  </span>
                )}
                {mileage.boat > 0 && (
                  <span
                    className={styles.mileagePill}
                    style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.BOAT] }}
                  >
                    ⛵ {formatMiles(mileage.boat)}
                  </span>
                )}
                <span className={styles.mileageTotal}>
                  📏 {formatMiles(mileage.total)}
                </span>
              </div>
            )}
          </div>

          {/* Date + travel mode pills */}
          <div className={styles.metaRow}>
            {trip.date && (
              <span className={styles.date}>{trip.date}</span>
            )}
            {[...modesUsed].map(mode => (
              <span key={mode} className={styles.modePill}>
                {TRAVEL_MODE_LABELS[mode]}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <Button variant="ghost"     size="sm" onClick={() => onView(trip)}>Map</Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(trip)}>Edit</Button>
          <Button variant="danger"    size="sm" onClick={() => onDelete(trip.id)}>Delete</Button>
        </div>
      </div>

      {/* ── Route summary ─────────────────────── */}
      {allStops.length >= 2 && (
        <div className={styles.route}>
          {allStops.map((s, i) => (
            <span key={i} className={styles.routeStop}>
              {i > 0 && <span className={styles.routeArrow}>→</span>}
              {s.name?.split(",")[0]}
            </span>
          ))}
        </div>
      )}

      {/* ── Thumbnail photo strip ──────────────── */}
      {previewPhotos.length > 0 && (
        <div className={styles.photoStrip}>
          {previewPhotos.map((photo, i) => (
            <div key={photo.id} className={styles.photoThumb}>
              <img
                src={photo.dataUrl}
                alt={photo.caption || `Photo ${i + 1}`}
                className={styles.photoImg}
                onError={e => {
                  e.target.closest(`.${styles.photoThumb}`).style.display = "none";
                }}
              />
              {i === previewPhotos.length - 1 && extraCount > 0 && (
                <div className={styles.photoOverlay}>+{extraCount}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Description ───────────────────────── */}
      {trip.description && (
        <p className={styles.description}>{trip.description}</p>
      )}

      {/* ── Footer stat line ──────────────────── */}
      <div className={styles.footer}>
        <span className={styles.footerStat}>
          📍 {allStops.length} stop{allStops.length !== 1 ? "s" : ""}
        </span>
        {allPhotos.length > 0 && (
          <span className={styles.footerStat}>
            📷 {allPhotos.length} photo{allPhotos.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

    </div>
  );
}