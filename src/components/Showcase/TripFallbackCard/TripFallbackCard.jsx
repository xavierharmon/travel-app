// src/components/Showcase/TripFallbackCard/TripFallbackCard.jsx
import styles from "./TripFallbackCard.module.css";
import { formatMiles } from "@/utils/haversine";
import { TRAVEL_MODES, TRAVEL_MODE_COLORS } from "@/constants";

export default function TripFallbackCard({ item }) {
  const { tripName, date, mileage, route } = item;

  return (
    <div className={styles.card}>
      {/* Decorative background rings */}
      <div className={styles.ring1} />
      <div className={styles.ring2} />
      <div className={styles.ring3} />

      <div className={styles.content}>
        {/* Icon */}
        <div className={styles.iconWrap}>
          <span className={styles.icon}>🗺️</span>
        </div>

        {/* Trip name */}
        <h1 className={styles.tripName}>{tripName}</h1>

        {/* Route summary */}
        {route && (
          <p className={styles.route}>{route}</p>
        )}

        {/* Date */}
        {date && (
          <p className={styles.date}>{date}</p>
        )}

        {/* Mileage breakdown */}
        {mileage && mileage.total > 0 && (
          <div className={styles.mileage}>
            {mileage.drive > 0 && (
              <div className={styles.mileageRow}>
                <span className={styles.mileageIcon}>🚗</span>
                <span
                  className={styles.mileageValue}
                  style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.DRIVE] }}
                >
                  {formatMiles(mileage.drive)}
                  {mileage.hasUncachedDrive ? "~" : ""}
                </span>
              </div>
            )}
            {mileage.flight > 0 && (
              <div className={styles.mileageRow}>
                <span className={styles.mileageIcon}>✈️</span>
                <span
                  className={styles.mileageValue}
                  style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.FLIGHT] }}
                >
                  {formatMiles(mileage.flight)}
                </span>
              </div>
            )}
            {mileage.boat > 0 && (
              <div className={styles.mileageRow}>
                <span className={styles.mileageIcon}>⛵</span>
                <span
                  className={styles.mileageValue}
                  style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.BOAT] }}
                >
                  {formatMiles(mileage.boat)}
                </span>
              </div>
            )}
            {mileage.train > 0 && (
              <div className={styles.mileageRow}>
                <span className={styles.mileageIcon}>🚞</span>
                <span
                  className={styles.mileageValue}
                  style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.TRAIN] }}
                >
                  {formatMiles(mileage.train)}
                </span>
              </div>
            )}
            <div className={`${styles.mileageRow} ${styles.mileageTotal}`}>
              <span className={styles.mileageIcon}>📏</span>
              <span className={styles.mileageTotalValue}>
                {formatMiles(mileage.total)} total
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}