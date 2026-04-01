// src/components/Showcase/SlideshowItem/SlideshowItem.jsx
import { useEffect, useState } from "react";
import styles from "./SlideshowItem.module.css";
import TripFallbackCard from "@/components/Showcase/TripFallbackCard";
import GameFallbackCard from "@/components/Showcase/GameFallbackCard";
import { getPhotos } from "@/utils/photoStorage";
import { formatMiles } from "@/utils/haversine";

// Deterministic rotation from a string seed so it's stable per-item
function seedRotation(str, index) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const base = ((hash >> (index * 5)) & 0xff) / 255; // 0–1
  return (base * 16 - 8).toFixed(2); // -8deg to +8deg
}

// Deterministic offset so cards don't perfectly stack
function seedOffset(str, index, axis) {
  let hash = 0;
  const salt = axis + index;
  for (let i = 0; i < str.length + salt; i++) {
    hash = (hash * 37 + (str.charCodeAt(i % str.length) || salt)) & 0xffffffff;
  }
  const base = ((hash >> 3) & 0xff) / 255;
  return ((base * 80) - 40).toFixed(1); // -40px to +40px
}

// ── Polaroid pile ────────────────────────────────────────────────
function PolaroidPile({ item, dataUrls, animationKey }) {
  const photos = dataUrls.filter(Boolean).slice(0, 3);
  if (!photos.length) return null;

  const title = item.source === "stop" && item.stopName
    ? item.stopName
    : item.tripName;
  const subtitle = item.source === "stop" && item.stopName
    ? item.tripName
    : item.date || null;

  // Z-order: last card visually on top (highest z-index)
  return (
    <div className={styles.polaroidScene}>
      {photos.map((src, i) => {
        const seed    = `${item.id}-${i}`;
        const rot     = seedRotation(seed, i);
        const ox      = seedOffset(seed, i, "x");
        const oy      = seedOffset(seed, i, "y");
        const zIndex  = i + 1;

        return (
          <div
            key={`${animationKey}-${i}`}
            className={styles.polaroid}
            style={{
              zIndex,
              "--rot1": `rotate(${rot}deg) translate(${ox}px, ${oy}px)`,
              "--rot2": `rotate(${rot}deg) translate(${ox}px, ${oy}px)`,
              "--rot3": `rotate(${rot}deg) translate(${ox}px, ${oy}px)`,
            }}
          >
            <img src={src} alt={title} className={styles.polaroidImg} />
            <div className={styles.polaroidCaption}>
              <p className={styles.polaroidTitle}>{title}</p>
              {subtitle && (
                <p className={styles.polaroidMeta}>{subtitle}</p>
              )}
              {i === 0 && item.mileage?.total > 0 && (
                <p className={styles.polaroidMeta}>
                  📏 {formatMiles(item.mileage.total)}
                </p>
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
  const photos = dataUrls.filter(Boolean).slice(0, 3);
  if (!photos.length) return null;

  const OUTCOME_COLORS = { win: "#22c55e", loss: "#ef4444", tie: "#60a5fa" };
  const outcomeColor   = OUTCOME_COLORS[item.outcome] || "#888";
  const title          = `${item.homeTeam} vs ${item.visitingTeam}`;
  const score          = item.homeScore != null && item.visitingScore != null
    ? `${item.homeScore} – ${item.visitingScore}`
    : null;

  return (
    <div className={styles.polaroidScene}>
      {photos.map((src, i) => {
        const seed   = `${item.id}-${i}`;
        const rot    = seedRotation(seed, i);
        const ox     = seedOffset(seed, i, "x");
        const oy     = seedOffset(seed, i, "y");
        const zIndex = i + 1;

        return (
          <div
            key={`${animationKey}-${i}`}
            className={styles.polaroid}
            style={{
              zIndex,
              "--rot1": `rotate(${rot}deg) translate(${ox}px, ${oy}px)`,
              "--rot2": `rotate(${rot}deg) translate(${ox}px, ${oy}px)`,
              "--rot3": `rotate(${rot}deg) translate(${ox}px, ${oy}px)`,
            }}
          >
            <img src={src} alt={title} className={styles.polaroidImg} />
            <div className={styles.polaroidCaption}>
              <p className={styles.polaroidTitle}>{title}</p>
              {score && (
                <p className={styles.polaroidMeta}>
                  {score}
                  {item.outcome && (
                    <span style={{ color: outcomeColor, marginLeft: 6, fontWeight: 700 }}>
                      {item.outcome.toUpperCase()}
                    </span>
                  )}
                </p>
              )}
              {item.date && (
                <p className={styles.polaroidMeta}>{item.date}</p>
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

    // Collect up to 3 photo IDs from the item's siblings if available,
    // otherwise just the single photoId
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
    <PolaroidPile
      item={item}
      dataUrls={dataUrls}
      animationKey={animationKey}
    />
  );
}