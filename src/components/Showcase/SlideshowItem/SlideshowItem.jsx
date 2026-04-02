// src/components/Showcase/SlideshowItem/SlideshowItem.jsx
import { useEffect, useState } from "react";
import styles from "./SlideshowItem.module.css";
import TripFallbackCard from "@/components/Showcase/TripFallbackCard";
import GameFallbackCard from "@/components/Showcase/GameFallbackCard";
import { getPhotos } from "@/utils/photoStorage";
import { formatMiles } from "@/utils/haversine";

// ── Scatter layout helpers ───────────────────────────────────────
//
// Each slot gets a deliberate position within the polaroidStage so
// cards are always visibly separated. Tilt is seeded-deterministic
// so the same item always lands at the same angle.

function getSlotTransform(slotIndex, totalCount, tiltDeg) {
  const offsets = {
    1: [{ x: 0,    y: 0   }],
    2: [{ x: -170, y: -15 }, { x: 170,  y: 15  }],
    3: [{ x: -230, y: 10  }, { x: 0,    y: -25 }, { x: 230, y: 12 }],
  };
  const pos = (offsets[totalCount] || offsets[1])[slotIndex] || { x: 0, y: 0 };
  return `translate(${pos.x}px, ${pos.y}px) rotate(${tiltDeg}deg)`;
}

function seedTilt(id, index) {
  let hash = 0;
  const str = `${id}-slot-${index}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const norm = ((hash >>> 0) % 1000) / 1000;
  return ((norm * 14) - 7).toFixed(2); // -7deg to +7deg
}

// ── Scrapbook header — trip/stop ────────────────────────────────
function TripScrapbookHeader({ item }) {
  const isStop = item.source === "stop" && item.stopName;
  const title    = isStop ? item.stopName : item.tripName;
  const subtitle = isStop ? item.tripName : null;

  return (
    <div className={styles.scrapbookHeader}>
      <div className={styles.scrapbookInner}>
        <h2 className={styles.scrapbookTitle}>{title}</h2>
        {subtitle && (
          <p className={styles.scrapbookSubtitle}>{subtitle}</p>
        )}
        <div className={styles.scrapbookStats}>
          {item.date && (
            <span className={styles.statItem}>📅 {item.date}</span>
          )}
          {item.mileage?.total > 0 && (
            <span className={styles.statItem}>
              📏 {formatMiles(item.mileage.total)}
              {item.mileage.hasUncachedDrive ? "~" : ""}
            </span>
          )}
          {item.mileage?.drive > 0 && (
            <span className={styles.statItem}>
              🚗 {formatMiles(item.mileage.drive)}
              {item.mileage.hasUncachedDrive ? "~" : ""}
            </span>
          )}
          {item.mileage?.flight > 0 && (
            <span className={styles.statItem}>
              ✈️ {formatMiles(item.mileage.flight)}
            </span>
          )}
          {item.mileage?.boat > 0 && (
            <span className={styles.statItem}>
              ⛵ {formatMiles(item.mileage.boat)}
            </span>
          )}
          {item.mileage?.train > 0 && (
            <span className={styles.statItem}>
              🚞 {formatMiles(item.mileage.train)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Scrapbook header — game ─────────────────────────────────────
function GameScrapbookHeader({ item }) {
  const OUTCOME_COLORS = {
    win:  { bg: "#d1fae5", border: "#6ee7b7", color: "#065f46" },
    loss: { bg: "#fee2e2", border: "#fca5a5", color: "#7f1d1d" },
    tie:  { bg: "#dbeafe", border: "#93c5fd", color: "#1e3a5f" },
  };
  const outcomeStyle = OUTCOME_COLORS[item.outcome] || null;

  const hasScore = item.homeScore != null && item.visitingScore != null;

  const sportLabel = item.sport === "College" && item.collegeSport
    ? `College ${item.collegeSport}`
    : item.sport;

  return (
    <div className={styles.scrapbookHeader}>
      <div className={styles.scrapbookInner}>
        <h2 className={styles.scrapbookTitle}>
          {item.homeTeam} vs {item.visitingTeam}
        </h2>
        <div className={styles.scrapbookStats}>
          {outcomeStyle && item.outcome && (
            <span
              className={styles.outcomeBadge}
              style={{
                background:  outcomeStyle.bg,
                border:      `1px solid ${outcomeStyle.border}`,
                color:       outcomeStyle.color,
              }}
            >
              {item.outcome.toUpperCase()}
            </span>
          )}
          {hasScore && (
            <span className={styles.statItem}>
              {item.homeScore} – {item.visitingScore}
            </span>
          )}
          {sportLabel && (
            <span className={styles.statItem}>🏆 {sportLabel}</span>
          )}
          {item.date && (
            <span className={styles.statItem}>📅 {item.date}</span>
          )}
          {item.venue && (
            <span className={styles.statItem}>🏟️ {item.venue}</span>
          )}
          {!item.venue && item.city && (
            <span className={styles.statItem}>📍 {item.city}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Polaroid pile (shared render) ───────────────────────────────
function PolaroidPile({ item, dataUrls, animationKey, header }) {
  const validUrls = dataUrls.filter(Boolean);
  if (!validUrls.length) return null;

  return (
    <div className={styles.polaroidScene}>
      {/* Stats header — kraft paper panel at the bottom */}
      {header}

      {/* Polaroids floating in the upper stage */}
      <div className={styles.polaroidStage}>
        {validUrls.map((src, i) => {
          const tilt      = seedTilt(item.id, i);
          const transform = getSlotTransform(i, validUrls.length, tilt);
          const label     = item.caption || "";

          return (
            <div
              key={`${animationKey}-${i}`}
              className={styles.polaroid}
              style={{
                zIndex:              i + 1,
                "--final-transform": transform,
              }}
            >
              <img
                src={src}
                alt={item.tripName || item.homeTeam || "Memory"}
                className={styles.polaroidImg}
              />
              {/* Caption strip — empty until caption editing is built,
                  shows caption text if one exists */}
              <div className={styles.polaroidCaption}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function SlideshowItem({ item, animationKey }) {
  const [dataUrls, setDataUrls] = useState([]);

  useEffect(() => {
    if (!item?.photoId) { setDataUrls([]); return; }
    let cancelled = false;

    const ids = item.siblingPhotoIds?.length
      ? [item.photoId, ...item.siblingPhotoIds].slice(0, 3)
      : [item.photoId];

    getPhotos(ids).then(map => {
      if (!cancelled) setDataUrls(ids.map(id => map.get(id) || null));
    });

    return () => { cancelled = true; };
  }, [item?.photoId, item?.siblingPhotoIds]);

  if (!item) return null;

  if (item.kind === "trip_fallback") {
    return <div className={styles.fallbackWrap}><TripFallbackCard item={item} /></div>;
  }

  if (item.kind === "game_fallback") {
    return <div className={styles.fallbackWrap}><GameFallbackCard item={item} /></div>;
  }

  // Still loading from IDB
  if (!dataUrls.length || dataUrls.every(u => !u)) {
    return <div className={styles.polaroidScene} />;
  }

  const header = item.source === "game"
    ? <GameScrapbookHeader item={item} />
    : <TripScrapbookHeader item={item} />;

  return (
    <PolaroidPile
      item={item}
      dataUrls={dataUrls}
      animationKey={animationKey}
      header={header}
    />
  );
}