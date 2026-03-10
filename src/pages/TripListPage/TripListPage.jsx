// src/pages/TripListPage/TripListPage.jsx
import styles from "./TripListPage.module.css";
import { useTrips } from "@/hooks/useTrips";
import { getStorageUsage } from "@/utils/storage";
import { getRouteCacheStats, clearAllStoredRoutes } from "@/utils/routeStorage";
import { computeTripMileage } from "@/utils/tripMileage";
import TripCard from "@/components/trips/TripCard";
import Button from "@/components/common/Button";
import { useState, useEffect, useMemo } from "react";

const SORT_OPTIONS = [
  { value: "date-newest", label: "Newest" },
  { value: "date-oldest", label: "Oldest" },
  { value: "miles-most",  label: "Most Miles" },
  { value: "miles-least", label: "Least Miles" },
];

function sortTrips(trips, sortBy) {
  const sorted = [...trips]; // never mutate the original array

  switch (sortBy) {
    case "date-newest":
      return sorted.sort((a, b) => {
        // Trips without a date fall to the bottom
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });

    case "date-oldest":
      return sorted.sort((a, b) => {
        // Trips without a date fall to the bottom
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      });

    case "miles-most":
      return sorted.sort((a, b) => {
        const aMiles = computeTripMileage(a)?.total || 0;
        const bMiles = computeTripMileage(b)?.total || 0;
        return bMiles - aMiles;
      });

    case "miles-least":
      return sorted.sort((a, b) => {
        const aMiles = computeTripMileage(a)?.total || 0;
        const bMiles = computeTripMileage(b)?.total || 0;
        return aMiles - bMiles;
      });

    default:
      return sorted;
  }
}

export default function TripListPage({
  onNewTrip,
  onEditTrip,
  onViewMap,
  onViewHistory,
}) {
  const { trips, loading, error, deleteTrip } = useTrips();

  const [sortBy,       setSortBy]       = useState("date-newest");
  const [storageUsage, setStorageUsage] = useState(null);
  const [cacheStats,   setCacheStats]   = useState(null);

  useEffect(() => {
    setStorageUsage(getStorageUsage());
    setCacheStats(getRouteCacheStats());
  }, [trips]);

  // Recompute sorted list only when trips or sortBy changes
  const sortedTrips = useMemo(
    () => sortTrips(trips, sortBy),
    [trips, sortBy]
  );

  function handleDelete(id) {
    if (window.confirm("Delete this trip? This cannot be undone.")) {
      deleteTrip(id);
    }
  }

  function handleClearRoutes() {
    if (window.confirm(
      "Clear all stored routes? They will be re-fetched from Google " +
      "the next time you view each trip map."
    )) {
      clearAllStoredRoutes();
      setCacheStats(getRouteCacheStats());
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Header ───────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <img
              src="/logo.png"
              alt="Xavier & Kylie's Adventures"
              className={styles.brandLogo}
            />
          </div>
          <div>
            <h1 className={styles.title}>Xavier & Kylie's Adventures</h1>
            <p className={styles.subtitle}>
              {loading
                ? "Loading…"
                : `${trips.length} trip${trips.length !== 1 ? "s" : ""} saved`}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <Button variant="secondary" onClick={onViewHistory} size="md">
            🗺️ Trip History
          </Button>
          <Button onClick={onNewTrip} size="md">
            + New Trip
          </Button>
        </div>
      </header>

      {/* ── Error banner ─────────────────────────── */}
      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      {/* ── Sort controls ────────────────────────── */}
      {!loading && trips.length > 1 && (
        <div className={styles.sortBar}>
          <span className={styles.sortLabel}>Sort by</span>
          <div className={styles.sortBtns}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.sortBtn} ${sortBy === opt.value ? styles.sortBtnActive : ""}`}
                onClick={() => setSortBy(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Trip list ────────────────────────────── */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.empty}>Loading your trips…</div>
        ) : trips.length === 0 ? (
          <div className={styles.empty}>
            <img
              src="/logo.png"
              alt="Start your adventure"
              style={{
                width:     100,
                height:    100,
                objectFit: "contain",
                opacity:   0.5,
              }}
            />
            <p>
              No trips yet. Click <strong>New Trip</strong> to start
              your adventure!
            </p>
          </div>
        ) : (
          <div className={styles.tripList}>
            {sortedTrips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onView={onViewMap}
                onEdit={onEditTrip}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer — storage info ─────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          {storageUsage && (
            <div className={styles.storageInfo}>
              <div className={styles.storageRow}>
                <span className={styles.storageLabel}>
                  Storage: {storageUsage.mb}MB / 5MB
                </span>
                <span
                  className={styles.storagePct}
                  style={{
                    color: storageUsage.pct > 70
                      ? "var(--color-danger)"
                      : "var(--color-text-subtle)",
                  }}
                >
                  {storageUsage.pct}%
                </span>
              </div>
              <div className={styles.storageBar}>
                <div
                  className={styles.storageBarFill}
                  style={{
                    width:      `${Math.min(storageUsage.pct, 100)}%`,
                    background: storageUsage.pct > 70
                      ? "var(--color-danger)"
                      : storageUsage.pct > 40
                      ? "var(--color-warning)"
                      : "var(--color-primary)",
                  }}
                />
              </div>
              {storageUsage.pct > 70 && (
                <p className={styles.storageWarning}>
                  ⚠ Storage almost full. Remove some photos to keep saving.
                </p>
              )}
            </div>
          )}
        </div>

        {cacheStats && (
          <div className={styles.footerRight}>
            <span className={styles.cacheLabel}>
              {cacheStats.count} route{cacheStats.count !== 1 ? "s" : ""} cached
              · {cacheStats.sizeKb} KB
            </span>
            {cacheStats.count > 0 && (
              <button
                className={styles.clearCacheBtn}
                onClick={handleClearRoutes}
              >
                Clear cache
              </button>
            )}
          </div>
        )}
      </footer>

    </div>
  );
}