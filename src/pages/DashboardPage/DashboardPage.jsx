import { useMemo, useState, useEffect } from "react";
import styles from "./DashboardPage.module.css";
import { useTrips } from "@/hooks/useTrips";
import { useGames } from "@/hooks/useGames";
import { useMemories } from "@/hooks/useMemories";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { calculateDashboardStats, getCarouselPhotos } from "@/utils/dashboardStats";
import { TRAVEL_MODE_LABELS, TRAVEL_MODES } from "@/constants";
import Button from "@/components/common/Button";
import PhotoCarousel from "@/components/PhotoCarousel";

export default function DashboardPage({
  onNewTrip,
  onViewTrips,
  onViewGames,
  onViewMemories,
  onViewShowcase,
  onViewHistory,
}) {
  const { trips, loading: tripsLoading } = useTrips();
  const { games, loading: gamesLoading } = useGames();
  const { memories, loading: memoriesLoading } = useMemories();
  
  // Initialize stats with empty defaults immediately
  const [stats, setStats] = useState({
    trips: { totalTrips: 0, totalMiles: 0, milesByMode: {}, statesVisited: [], countriesVisited: [], totalPhotos: 0 },
    games: { totalGames: 0, wins: 0, losses: 0, ties: 0, winPercentage: 0, byCategory: {} },
    memories: { total: 0 },
  });

  // Calculate statistics - simple sync calculation
  useEffect(() => {
    const computed = calculateDashboardStats(trips, games, memories);
    setStats(computed);
  }, [trips, games, memories]);

  // Get carousel photos
  const carouselPhotos = useMemo(
    () => getCarouselPhotos(trips, memories),
    [trips, memories]
  );

  // Get photo URLs - returns a Map<id, dataUrl>
  const photoDataUrls = usePhotoUrls(carouselPhotos);

  // Only show loading if data is still being fetched, not while geocoding happens in background
  const isLoading = tripsLoading || gamesLoading || memoriesLoading;

  return (
    <div className={styles.page}>
      {/* ── Header ───────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Adventures" className={styles.logoImg} />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.title}>Xavier & Kylie's Adventures</h1>
            <p className={styles.subtitle}>Your virtual travel & memories diary</p>
          </div>
        </div>
      </header>

      {/* ── Photo Carousel ───────────────────────── */}
      <section className={styles.carouselSection}>
        <PhotoCarousel photos={carouselPhotos} photoDataUrls={photoDataUrls} />
      </section>

      {/* ── Main Content ───────────────────────── */}
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>Loading your adventures...</div>
        ) : (
          <>
            {/* ── Stats Grid ───────────────────────── */}
            <section className={styles.statsGrid}>
              {/* Trips Stats */}
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🗺️</div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{stats.trips.totalTrips}</div>
                  <div className={styles.statLabel}>Trips</div>
                </div>
              </div>

              {/* Total Miles */}
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📏</div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{stats.trips.totalMiles.toLocaleString()}</div>
                  <div className={styles.statLabel}>Total Miles</div>
                </div>
              </div>
            </section>

            {/* ── Travel Modes Breakdown ───────────────────────── */}
            {stats.trips.totalMiles > 0 && (
              <section className={styles.modeBreakdown}>
                <h2 className={styles.sectionTitle}>Miles by Travel Method</h2>
                <div className={styles.modeGrid}>
                  {Object.values(TRAVEL_MODES).map(mode => {
                    const miles = stats.trips.milesByMode[mode] || 0;
                    const pct =
                      stats.trips.totalMiles > 0
                        ? Math.round((miles / stats.trips.totalMiles) * 100)
                        : 0;
                    return (
                      miles > 0 && (
                        <div key={mode} className={styles.modeCard}>
                          <div className={styles.modeLabel}>{TRAVEL_MODE_LABELS[mode]}</div>
                          <div className={styles.modeMiles}>{miles.toLocaleString()} mi</div>
                          <div className={styles.modePercent}>{pct}% of total</div>
                          <div className={styles.modeBar}>
                            <div
                              className={styles.modeBarFill}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Navigation Bar ───────────────────────── */}
      <nav className={styles.navbar}>
        <div className={styles.navElements}>
          <Button variant="primary" size="md" onClick={onNewTrip}>
            ✈️ New Trip
          </Button>
          <Button variant="secondary" size="md" onClick={onViewTrips}>
            🗺️ All Trips
          </Button>
          <Button variant="secondary" size="md" onClick={onViewHistory}>
            📍 History Map
          </Button>
          <Button variant="secondary" size="md" onClick={onViewGames}>
            🏆 Sports
          </Button>
          <Button variant="secondary" size="md" onClick={onViewMemories}>
            📸 Memories
          </Button>
          <Button variant="secondary" size="md" onClick={onViewShowcase}>
            ✨ Showcase
          </Button>
        </div>
      </nav>
    </div>
  );
}
