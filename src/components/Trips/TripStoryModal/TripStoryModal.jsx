// src/components/Trips/TripStoryModal/TripStoryModal.jsx
//
// Journal-entry style lightbox for reading a trip's full story.
// Opens when user clicks "Story" on a TripCard.
// Shows: hero photo strip → trip description → stop-by-stop notes.

import { useEffect, useState } from "react";
import styles from "./TripStoryModal.module.css";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { TRAVEL_MODE_LABELS, TRAVEL_MODE_COLORS, TRAVEL_MODES } from "@/constants";

// ── Stop entry ───────────────────────────────────────────────────
function StopEntry({ stop, index, isOrigin, isDest }) {
  const photoUrls = usePhotoUrls(stop.photos || []);
  const mode      = stop.travelMode || TRAVEL_MODES.DRIVE;
  const modeColor = TRAVEL_MODE_COLORS[mode];
  const modeLabel = TRAVEL_MODE_LABELS[mode];

  return (
    <div className={styles.stopEntry}>
      {/* Timeline dot + line */}
      <div className={styles.stopTimeline}>
        <div
          className={styles.stopDot}
          style={{
            background: isOrigin ? "#22c55e" : isDest ? "#ef4444" : "#6366f1",
          }}
        />
        {!isDest && <div className={styles.stopLine} />}
      </div>

      <div className={styles.stopBody}>
        {/* Stop name + travel mode badge */}
        <div className={styles.stopHeader}>
          <h3 className={styles.stopName}>
            {stop.name?.split(",")[0] || `Stop ${index + 1}`}
          </h3>
          {!isOrigin && (
            <span className={styles.modeBadge} style={{ color: modeColor, borderColor: modeColor }}>
              {modeLabel}
            </span>
          )}
          {isOrigin && <span className={styles.originTag}>Start</span>}
          {isDest   && <span className={styles.destTag}>End</span>}
        </div>

        {/* Stop description */}
        {stop.description && (
          <p className={styles.stopDesc}>{stop.description}</p>
        )}

        {/* Stop photos */}
        {(stop.photos || []).length > 0 && (
          <div className={styles.stopPhotos}>
            {stop.photos.map(photo => {
              const src = photoUrls.get(photo.id);
              if (!src) return null;
              return (
                <div key={photo.id} className={styles.stopPhotoWrap}>
                  <img src={src} alt={photo.caption || ""} className={styles.stopPhoto} />
                  {photo.caption && (
                    <p className={styles.stopPhotoCaption}>{photo.caption}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────
export default function TripStoryModal({ trip, onClose }) {
  const [heroIndex, setHeroIndex] = useState(0);

  // All trip-level photos for the hero strip
  const allTripPhotos = trip.photos || [];
  const heroUrls      = usePhotoUrls(allTripPhotos);

  // Build full stop list with origin + destination
  const allStops = [
    trip.origin      ? { ...trip.origin, _isOrigin: true }                                                   : null,
    ...(trip.stops   || []),
    trip.destination ? { ...trip.destination, _isDest: true, travelMode: trip.destinationTravelMode } : null,
  ].filter(Boolean);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const heroPhotos = allTripPhotos.map(p => ({ id: p.id, url: heroUrls.get(p.id) })).filter(p => p.url);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.journal}>

        {/* ── Binding spine ─────────────────────── */}
        <div className={styles.spine} />

        {/* ── Close button ──────────────────────── */}
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        {/* ── Journal header ────────────────────── */}
        <div className={styles.journalHeader}>
          <div className={styles.journalMeta}>
            {trip.date && <span className={styles.journalDate}>{trip.date}</span>}
            <span className={styles.journalRule} />
          </div>
          <h1 className={styles.journalTitle}>{trip.name}</h1>
          {trip.description && (
            <p className={styles.journalIntro}>{trip.description}</p>
          )}
        </div>

        {/* ── Hero photo strip ───────────────────── */}
        {heroPhotos.length > 0 && (
          <div className={styles.heroSection}>
            {/* Main hero photo */}
            <div className={styles.heroMain}>
              <img
                src={heroPhotos[heroIndex]?.url}
                alt=""
                className={styles.heroImg}
              />
              {/* Caption */}
              {allTripPhotos[heroIndex]?.caption && (
                <p className={styles.heroCaption}>{allTripPhotos[heroIndex].caption}</p>
              )}
            </div>

            {/* Thumbnail rail */}
            {heroPhotos.length > 1 && (
              <div className={styles.heroRail}>
                {heroPhotos.map((p, i) => (
                  <button
                    key={p.id}
                    className={`${styles.heroThumb} ${i === heroIndex ? styles.heroThumbActive : ""}`}
                    onClick={() => setHeroIndex(i)}
                  >
                    <img src={p.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Divider ───────────────────────────── */}
        {(trip.description || heroPhotos.length > 0) && allStops.length > 0 && (
          <div className={styles.sectionDivider}>
            <span>The Journey</span>
          </div>
        )}

        {/* ── Stop-by-stop narrative ─────────────── */}
        {allStops.length > 0 && (
          <div className={styles.stopsSection}>
            {allStops.map((stop, i) => (
              <StopEntry
                key={stop.id || i}
                stop={stop}
                index={i}
                isOrigin={stop._isOrigin}
                isDest={stop._isDest}
              />
            ))}
          </div>
        )}

        {/* ── Empty state ────────────────────────── */}
        {!trip.description && heroPhotos.length === 0 && allStops.length === 0 && (
          <div className={styles.emptyStory}>
            <span>📖</span>
            <p>No story written yet — edit this trip to add descriptions and photos.</p>
          </div>
        )}

        {/* ── Journal footer decoration ──────────── */}
        <div className={styles.journalFooter}>
          <span className={styles.journalFooterLine} />
        </div>

      </div>
    </div>
  );
}