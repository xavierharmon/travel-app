// src/components/common/MileageBadge/MileageBadge.jsx
import { TRAVEL_MODES, TRAVEL_MODE_COLORS } from "@/constants";
import { formatMiles } from "@/utils/haversine";
import styles from "./MileageBadge.module.css";

export default function MileageBadge({ mileage, compact = false }) {
  if (!mileage) return null;

  const { drive, flight, boat, total, hasUncachedDrive } = mileage;
  const hasAny = total > 0;
  if (!hasAny) return null;

  if (compact) {
    return (
      <span className={styles.compact}>
        {formatMiles(total)} total
        {hasUncachedDrive && (
          <span className={styles.estimate} title="Drive miles are estimated until route is viewed">
            ~
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={styles.badge}>
      {drive > 0 && (
        <div className={styles.row}>
          <span className={styles.icon}>🚗</span>
          <span className={styles.label}>Drive</span>
          <span
            className={styles.value}
            style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.DRIVE] }}
          >
            {formatMiles(drive)}
            {hasUncachedDrive && (
              <span
                className={styles.estimate}
                title="Estimated — view trip map for road-accurate distance"
              >
                ~
              </span>
            )}
          </span>
        </div>
      )}

      {flight > 0 && (
        <div className={styles.row}>
          <span className={styles.icon}>✈️</span>
          <span className={styles.label}>Flight</span>
          <span
            className={styles.value}
            style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.FLIGHT] }}
          >
            {formatMiles(flight)}
          </span>
        </div>
      )}

      {boat > 0 && (
        <div className={styles.row}>
          <span className={styles.icon}>⛵</span>
          <span className={styles.label}>Boat</span>
          <span
            className={styles.value}
            style={{ color: TRAVEL_MODE_COLORS[TRAVEL_MODES.BOAT] }}
          >
            {formatMiles(boat)}
          </span>
        </div>
      )}

      <div className={`${styles.row} ${styles.totalRow}`}>
        <span className={styles.icon}>📏</span>
        <span className={styles.label}>Total</span>
        <span className={styles.totalValue}>
          {formatMiles(total)}
        </span>
      </div>
    </div>
  );
}