// src/components/Showcase/SlideshowItem/SlideshowItem.jsx
//
// Renders one slideshow item. Four cases:
//   1. Photo from a trip or stop  → full-bleed image + Ken Burns + overlay
//   2. Photo from a game          → full-bleed image + Ken Burns + overlay
//   3. Trip fallback (no photos)  → TripFallbackCard
//   4. Game fallback (no photos)  → GameFallbackCard

import styles from "./SlideshowItem.module.css";
import TripFallbackCard from "@/components/Showcase/TripFallbackCard";
import GameFallbackCard from "@/components/Showcase/GameFallbackCard";
import { TRAVEL_MODES, TRAVEL_MODE_COLORS } from "@/constants";
import { formatMiles } from "@/utils/haversine";

// ── Photo overlay for trip/stop photos ──────────────────────────
function TripPhotoOverlay({ item }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayContent}>
        <p className={styles.overlayCategory}>
          {item.source === "stop" ? "📍 Stop" : "🗺️ Trip"}
        </p>
        <h2 className={styles.overlayTitle}>
          {item.source === "stop" && item.stopName
            ? item.stopName
            : item.tripName}
        </h2>
        {item.source === "stop" && item.stopName && (
          <p className={styles.overlaySubtitle}>{item.tripName}</p>
        )}
        {item.date && (
          <p className={styles.overlayMeta}>{item.date}</p>
        )}
        {item.mileage && item.mileage.total > 0 && (
          <p className={styles.overlayMeta}>
            📏 {formatMiles(item.mileage.total)} total
            {item.mileage.hasUncachedDrive ? "~" : ""}
          </p>
        )}
        {item.caption && (
          <p className={styles.overlayCaption}>"{item.caption}"</p>
        )}
      </div>
    </div>
  );
}

// ── Photo overlay for game photos ────────────────────────────────
function GamePhotoOverlay({ item }) {
  const OUTCOME_COLORS = {
    win:  "#86efac",
    loss: "#fca5a5",
    tie:  "#93c5fd",
  };
  const outcomeColor = OUTCOME_COLORS[item.outcome] || "var(--color-text-muted)";

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayContent}>
        <p className={styles.overlayCategory}>🏆 Game</p>
        <h2 className={styles.overlayTitle}>
          {item.homeTeam} vs {item.visitingTeam}
        </h2>
        {(item.homeScore !== null && item.visitingScore !== null) && (
          <p className={styles.overlaySubtitle}>
            {item.homeScore} – {item.visitingScore}
            {item.outcome && (
              <span style={{ color: outcomeColor, marginLeft: 10, fontWeight: 700 }}>
                {item.outcome.toUpperCase()}
              </span>
            )}
          </p>
        )}
        {item.venue && <p className={styles.overlayMeta}>🏟️ {item.venue}</p>}
        {item.date  && <p className={styles.overlayMeta}>{item.date}</p>}
        {item.caption && (
          <p className={styles.overlayCaption}>"{item.caption}"</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function SlideshowItem({ item, animationKey }) {
  if (!item) return null;

  // Fallback cards
  if (item.kind === "trip_fallback") {
    return (
      <div className={styles.fallbackWrap}>
        <TripFallbackCard item={item} />
      </div>
    );
  }

  if (item.kind === "game_fallback") {
    return (
      <div className={styles.fallbackWrap}>
        <GameFallbackCard item={item} />
      </div>
    );
  }

  // Photo item
  return (
    <div className={styles.photoWrap}>
      {/* Ken Burns image — keyed on animationKey so animation restarts per item */}
      <img
        key={animationKey}
        src={item.dataUrl}
        alt={item.caption || "Memory"}
        className={styles.photo}
      />

      {/* Gradient scrim so overlay text is always readable */}
      <div className={styles.scrim} />

      {/* Contextual overlay */}
      {item.source === "game"
        ? <GamePhotoOverlay item={item} />
        : <TripPhotoOverlay item={item} />
      }
    </div>
  );
}