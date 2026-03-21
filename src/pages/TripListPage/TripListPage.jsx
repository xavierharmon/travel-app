// src/pages/TripListPage/TripListPage.jsx
import styles from "./TripListPage.module.css";
import { useTrips } from "@/hooks/useTrips";
import { getStorageUsage } from "@/utils/storage";
import { getRouteCacheStats, clearAllStoredRoutes } from "@/utils/routeStorage";
import { getPhotoStorageStats } from "@/utils/photoStorage";
import { computeTripMileage } from "@/utils/tripMileage";
import TripCard from "@/components/trips/TripCard";
import Button from "@/components/common/Button";
import { useState, useEffect, useMemo } from "react";
import BackupSettingsModal from "@/components/BackupSettingsModal";

const SORT_OPTIONS = [
  { value: "date-newest", label: "Newest" },
  { value: "date-oldest", label: "Oldest" },
  { value: "miles-most",  label: "Most Miles" },
  { value: "miles-least", label: "Least Miles" },
];

const KEY_LABELS = {
  "road_trip_memories_v1": "Trips",
  "sports_games_v1":       "Games",
  "road_trip_routes_v1":   "Routes",
  "road_trip_mileage_v1":  "Mileage",
};

function sortTrips(trips, sortBy) {
  const sorted = [...trips];
  switch (sortBy) {
    case "date-newest":
      return sorted.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });
    case "date-oldest":
      return sorted.sort((a, b) => {
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
  onViewGames,
  onViewShowcase,
}) {
  const { trips, loading, error, deleteTrip } = useTrips();
  const [showBackup,    setShowBackup]    = useState(false);
  const [sortBy,        setSortBy]        = useState("date-newest");
  const [storageUsage,  setStorageUsage]  = useState(null);
  const [cacheStats,    setCacheStats]    = useState(null);
  const [photoStats,    setPhotoStats]    = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    setStorageUsage(getStorageUsage());
    setCacheStats(getRouteCacheStats());
    getPhotoStorageStats().then(setPhotoStats);
  }, [trips]);

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
      setStorageUsage(getStorageUsage());
    }
  }

  // Bar color based on percentage
  function barColor(pct) {
    if (pct > 70) return "var(--color-danger)";
    if (pct > 40) return "var(--color-warning)";
    return "var(--color-primary)";
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

        <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => setShowBackup(true)} size="md">
            🗄️ Backup
          </Button>
          <Button variant="secondary" onClick={onViewShowcase} size="md">
            ✨ Showcase
          </Button>
          <Button variant="secondary" onClick={onViewGames} size="md">
            🏆 Sports Tracker
          </Button>
          <Button variant="secondary" onClick={onViewHistory} size="md">
            🗺️ Trip History
          </Button>
          <Button onClick={onNewTrip} size="md">
            + New Trip
          </Button>
        </div>
      </header>

      {/* ── Error banner ─────────────────────────── */}
      {error && <div className={styles.errorBanner}>{error}</div>}

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
              style={{ width: 100, height: 100, objectFit: "contain", opacity: 0.5 }}
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

      {/* ── Footer ───────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          {storageUsage && (
            <div className={styles.storageInfo}>

              {/* ── localStorage bar ────────────────── */}
              <div className={styles.storageRow}>
                <span className={styles.storageLabel}>
                  Metadata · {storageUsage.mb}MB / 5MB
                </span>
                <span
                  className={styles.storagePct}
                  style={{ color: barColor(storageUsage.pct) }}
                >
                  {storageUsage.pct}%
                </span>
                <button
                  className={styles.clearCacheBtn}
                  onClick={() => setShowBreakdown(b => !b)}
                  style={{ marginLeft: 6 }}
                >
                  {showBreakdown ? "hide" : "breakdown"}
                </button>
              </div>

              <div className={styles.storageBar}>
                <div
                  className={styles.storageBarFill}
                  style={{
                    width:      `${Math.min(storageUsage.pct, 100)}%`,
                    background: barColor(storageUsage.pct),
                  }}
                />
              </div>

              {/* ── Per-key breakdown ───────────────── */}
              {showBreakdown && storageUsage.breakdown && (
                <div style={{
                  display:       "flex",
                  flexWrap:      "wrap",
                  gap:           "var(--space-sm)",
                  marginTop:     4,
                }}>
                  {Object.entries(storageUsage.breakdown).map(([key, val]) => (
                    <span
                      key={key}
                      style={{
                        fontSize:      11,
                        color:         "var(--color-text-subtle)",
                        background:    "var(--color-surface-2)",
                        border:        "1px solid var(--color-border)",
                        borderRadius:  "var(--radius-sm)",
                        padding:       "2px 8px",
                      }}
                    >
                      {KEY_LABELS[key] || key}: {val.kb}KB
                    </span>
                  ))}
                </div>
              )}

              {/* ── IndexedDB photo storage ──────────── */}
              {photoStats && (
                <div className={styles.storageRow} style={{ marginTop: 6 }}>
                  <span className={styles.storageLabel}>
                    📷 Photos (IndexedDB) · {photoStats.count} photo{photoStats.count !== 1 ? "s" : ""} · {photoStats.estimatedMb}MB
                  </span>
                </div>
              )}

              {storageUsage.pct > 70 && (
                <p className={styles.storageWarning}>
                  ⚠ Metadata storage almost full. Clear route cache to free up space.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Route cache + clear ──────────────────── */}
        {cacheStats && (
          <div className={styles.footerRight}>
            <span className={styles.cacheLabel}>
              {cacheStats.count} route{cacheStats.count !== 1 ? "s" : ""} cached
              · {cacheStats.sizeKb}KB
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

      {showBackup && (
        <BackupSettingsModal onClose={() => setShowBackup(false)} />
      )}
    </div>
  );
}