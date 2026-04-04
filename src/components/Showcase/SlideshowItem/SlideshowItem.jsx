// src/components/Showcase/SlideshowItem/SlideshowItem.jsx
//
// Updated: adds a floating journal note card (off to the side)
// showing the stop/trip description when one exists.
// The polaroid pile and scrapbook header are unchanged.

import { useEffect, useState } from "react";
import styles from "./SlideshowItem.module.css";
import TripFallbackCard from "@/components/Showcase/TripFallbackCard";
import GameFallbackCard from "@/components/Showcase/GameFallbackCard";
import { getPhotos } from "@/utils/photoStorage";
import { formatMiles } from "@/utils/haversine";

// ── Scatter layout helpers ───────────────────────────────────────

function getSlotTransform(slotIndex, totalCount, tiltDeg) {
  const offsets = {
    1: [{ x: 0,    y: 0   }],
    2: [{ x: -220, y: -15 }, { x: 220,  y: 15  }],
    3: [{ x: -375, y: 10  }, { x: 0,    y: -25 }, { x: 375, y: 12 }],
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
  return ((norm * 14) - 7).toFixed(2);
}

// Deterministic side (left or right) based on item id
function journalSide(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0) % 2 === 0 ? "right" : "right";
}

// Slight tilt for the journal note
function journalTilt(id) {
  let hash = 0;
  const str = `${id}-journal`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const norm = ((hash >>> 0) % 1000) / 1000;
  return ((norm * 6) - 3).toFixed(2); // -3deg to +3deg
}

// ── Build ordered photo list for a slide ────────────────────────
function buildSlotPhotos(item) {
  const hero     = { id: item.photoId, caption: item.caption || "" };
  const siblings = (item.siblingPhotos || []).slice(0, 2);
  return [hero, ...siblings];
}

// ── Floating journal note ────────────────────────────────────────
function JournalNote({ item, animationKey }) {
  const text    = item.tripDescription; // trip-level photos don't show a note (header covers it)

  if (!text) return null;

  const side = journalSide(item.id);
  const tilt = journalTilt(item.id);

  return (
    <div
      key={`note-${animationKey}`}
      className={`${styles.journalNote} ${side === "left" ? styles.journalNoteLeft : styles.journalNoteRight}`}
      style={{ "--note-tilt": `${tilt}deg` }}
    >
      {/* Tape strip decoration */}
      <div className={styles.noteTape} />

      {/* Stop name as note header */}
      {item.stopName && (
        <p className={styles.noteLocation}>📍 {item.stopName}</p>
      )}

      {/* The story text */}
      <p className={styles.noteText}>{text}</p>
    </div>
  );
}

// ── Scrapbook header — trip/stop ─────────────────────────────────
function TripScrapbookHeader({ item }) {
  const isStop   = item.source === "stop" && item.stopName;
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
            <span className={styles.statItem}>✈️ {formatMiles(item.mileage.flight)}</span>
          )}
          {item.mileage?.boat > 0 && (
            <span className={styles.statItem}>⛵ {formatMiles(item.mileage.boat)}</span>
          )}
          {item.mileage?.train > 0 && (
            <span className={styles.statItem}>🚞 {formatMiles(item.mileage.train)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Scrapbook header — game ──────────────────────────────────────
function GameScrapbookHeader({ item }) {
  const OUTCOME_COLORS = {
    win:  { bg: "#d1fae5", border: "#6ee7b7", color: "#065f46" },
    loss: { bg: "#fee2e2", border: "#fca5a5", color: "#7f1d1d" },
    tie:  { bg: "#dbeafe", border: "#93c5fd", color: "#1e3a5f" },
  };
  const outcomeStyle = OUTCOME_COLORS[item.outcome] || null;
  const hasScore     = item.homeScore != null && item.visitingScore != null;
  const sportLabel   = item.sport === "College" && item.collegeSport
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
                background: outcomeStyle.bg,
                border:     `1px solid ${outcomeStyle.border}`,
                color:      outcomeStyle.color,
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

// ── Polaroid pile ────────────────────────────────────────────────
function PolaroidPile({ item, slotPhotos, dataUrls, animationKey, header }) {
  const slots = slotPhotos
    .map((photo, i) => ({ photo, url: dataUrls[i] || null }))
    .filter(slot => slot.url);

  if (!slots.length) return null;

  const altText = item.tripName || item.homeTeam || "Memory";

  return (
    <div className={styles.polaroidScene}>
      {header}

      {/* Floating journal note for stops with descriptions */}
      {item.source !== "game" && (
        <JournalNote item={item} animationKey={animationKey} />
      )}

      <div className={styles.polaroidStage}>
        {slots.map(({ photo, url }, i) => {
          const tilt      = seedTilt(item.id, i);
          const transform = getSlotTransform(i, slots.length, tilt);

          return (
            <div
              key={`${animationKey}-${i}`}
              className={styles.polaroid}
              style={{
                zIndex:              i + 1,
                "--final-transform": transform,
              }}
            >
              <img src={url} alt={altText} className={styles.polaroidImg} />

              {/* Each polaroid shows its own photo's caption */}
              <div className={styles.polaroidCaption}>
                {photo.caption || ""}
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
  const [dataUrls,   setDataUrls]   = useState([]);
  const [slotPhotos, setSlotPhotos] = useState([]);

  useEffect(() => {
    if (!item?.photoId) { setDataUrls([]); setSlotPhotos([]); return; }
    let cancelled = false;

    const slots = buildSlotPhotos(item);
    const ids   = slots.map(p => p.id);

    getPhotos(ids).then(map => {
      if (!cancelled) {
        setSlotPhotos(slots);
        setDataUrls(ids.map(id => map.get(id) || null));
      }
    });

    return () => { cancelled = true; };
  }, [item?.photoId, item?.caption, item?.siblingPhotos]);

  if (!item) return null;

  if (item.kind === "trip_fallback") {
    return <div className={styles.fallbackWrap}><TripFallbackCard item={item} /></div>;
  }

  if (item.kind === "game_fallback") {
    return <div className={styles.fallbackWrap}><GameFallbackCard item={item} /></div>;
  }

  if (!dataUrls.length || dataUrls.every(u => !u)) {
    return <div className={styles.polaroidScene} />;
  }

  const header = item.source === "game"
    ? <GameScrapbookHeader item={item} />
    : <TripScrapbookHeader item={item} />;

  return (
    <PolaroidPile
      item={item}
      slotPhotos={slotPhotos}
      dataUrls={dataUrls}
      animationKey={animationKey}
      header={header}
    />
  );
}