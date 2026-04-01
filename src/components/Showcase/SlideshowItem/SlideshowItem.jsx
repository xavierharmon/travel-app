// src/components/Showcase/SlideshowItem/SlideshowItem.jsx
import { useEffect, useState } from "react";
import styles from "./SlideshowItem.module.css";
import TripFallbackCard from "@/components/Showcase/TripFallbackCard";
import GameFallbackCard from "@/components/Showcase/GameFallbackCard";
import { getPhotos } from "@/utils/photoStorage";
import { formatMiles } from "@/utils/haversine";

// ── Scatter layout helpers ───────────────────────────────────────
//
// Instead of random offsets (which cause stacking), we assign each
// slot a deliberate position in a spread layout so cards are always
// visibly separated. Tilt is still seeded-random per item for personality.

function getSlotTransform(slotIndex, totalCount, tiltDeg) {
  // Horizontal spread: evenly space cards across ~60% of the viewport width
  // so they're clearly separated but still feel like a casual pile.
  const spreadFactor = totalCount === 1 ? 0 : totalCount === 2 ? 1 : 1;

  const offsets = {
    1: [{ x: 0,    y: 0  }],
    2: [{ x: -200, y: -20 }, { x: 200,  y: 20  }],
    3: [{ x: -260, y: 10  }, { x: 0,    y: -30 }, { x: 260, y: 15 }],
  };

  const pos = (offsets[totalCount] || offsets[1])[slotIndex] || { x: 0, y: 0 };
  return `translate(${pos.x}px, ${pos.y}px) rotate(${tiltDeg}deg)`;
}

// Deterministic tilt from item id + slot index — stable across re-renders
function seedTilt(id, index) {
  let hash = 0;
  const str = `${id}-slot-${index}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const norm = ((hash >>> 0) % 1000) / 1000; // 0–1
  return ((norm * 14) - 7).toFixed(2);        // -7deg to +7deg
}

// ── Trip polaroid pile ───────────────────────────────────────────
function TripPolaroidPile({ item, dataUrls, animationKey }) {
  const validUrls = dataUrls.filter(Boolean);
  if (!validUrls.length) return null;

  const title = item.source === "stop" && item.stopName
    ? item.stopName
    : item.tripName;

  const subtitle = item.source === "stop" && item.stopName
    ? item.tripName
    : null;

  return (
    <div className={styles.polaroidScene}>
      {validUrls.map((src, i) => {
        const tilt      = seedTilt(item.id, i);
        const transform = getSlotTransform(i, validUrls.length, tilt);

        return (
          <div
            key={`${animationKey}-${i}`}
            className={styles.polaroid}
            style={{
              zIndex:                i + 1,
              "--final-transform":   transform,
            }}
          >
            <img src={src} alt={title} className={styles.polaroidImg} />

            <div className={styles.polaroidCaption}>
              {/* Title: stop name or trip name */}
              <p className={styles.polaroidTitle}>{title}</p>

              {/* Subtitle: trip name when showing a stop photo */}
              {subtitle && (
                <p className={styles.polaroidMeta}>✈ {subtitle}</p>
              )}

              {/* Date */}
              {item.date && (
                <p className={styles.polaroidMeta}>📅 {item.date}</p>
              )}

              {/* Mileage — only on the first card to avoid repetition */}
              {i === 0 && item.mileage?.total > 0 && (
                <p className={styles.polaroidMeta}>
                  📏 {formatMiles(item.mileage.total)}
                  {item.mileage.hasUncachedDrive ? "~" : ""}
                </p>
              )}

              {/* Photo caption */}
              {item.caption && (
                <p className={styles.polaroidMeta}>"{item.caption}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Game polaroid pile ───────────────────────────────────────────
function GamePolaroidPile({ item, dataUrls, animationKey }) {
  const validUrls = dataUrls.filter(Boolean);
  if (!validUrls.length) return null;

  const OUTCOME_COLORS = { win: "#16a34a", loss: "#dc2626", tie: "#2563eb" };
  const outcomeColor   = OUTCOME_COLORS[item.outcome] || "#555";

  const title = `${item.homeTeam} vs ${item.visitingTeam}`;

  const hasScore = item.homeScore != null && item.visitingScore != null;

  return (
    <div className={styles.polaroidScene}>
      {validUrls.map((src, i) => {
        const tilt      = seedTilt(item.id, i);
        const transform = getSlotTransform(i, validUrls.length, tilt);

        return (
          <div
            key={`${animationKey}-${i}`}
            className={styles.polaroid}
            style={{
              zIndex:              i + 1,
              "--final-transform": transform,
            }}
          >
            <img src={src} alt={title} className={styles.polaroidImg} />

            <div className={styles.polaroidCaption}>
              {/* Teams */}
              <p className={styles.polaroidTitle}>{title}</p>

              {/* Sport */}
              {item.sport && (
                <p className={styles.polaroidMeta}>
                  🏆 {item.sport === "College" && item.collegeSport
                    ? `College ${item.collegeSport}`
                    : item.sport}
                </p>
              )}

              {/* Score */}
              {hasScore && (
                <p className={styles.polaroidMeta}>
                  {item.homeScore} – {item.visitingScore}
                </p>
              )}

              {/* Outcome */}
              {item.outcome && (
                <p
                  className={styles.polaroidOutcome}
                  style={{ color: outcomeColor }}
                >
                  {item.outcome.toUpperCase()}
                </p>
              )}

              {/* Date */}
              {item.date && (
                <p className={styles.polaroidMeta}>📅 {item.date}</p>
              )}

              {/* Venue / city */}
              {(item.venue || item.city) && (
                <p className={styles.polaroidMeta}>
                  📍 {item.venue || item.city}
                </p>
              )}
            </div>
          </div>
        );
      })}
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
    return <div className={styles.polaroidScene} style={{ background: "#0a0a0a" }} />;
  }

  if (item.source === "game") {
    return (
      <GamePolaroidPile
        item={item}
        dataUrls={dataUrls}
        animationKey={animationKey}
      />
    );
  }

  return (
    <TripPolaroidPile
      item={item}
      dataUrls={dataUrls}
      animationKey={animationKey}
    />
  );
}