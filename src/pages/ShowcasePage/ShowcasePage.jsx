// src/pages/ShowcasePage/ShowcasePage.jsx
//
// Full-screen showcase mode. Auto-starts a slideshow that mixes
// all trips and games (photos + fallback cards) and advances every
// 30 seconds. Controls fade out after 3s of inactivity.

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ShowcasePage.module.css";
import { useTrips } from "@/hooks/useTrips";
import { useGames } from "@/context/GamesContext";
import { useSlideshow } from "@/hooks/useSlideshow";
import SlideshowItem from "@/components/Showcase/SlideshowItem";
import { SLIDESHOW_INTERVAL_MS } from "@/constants";

const CONTROL_HIDE_DELAY = 3000; // ms of inactivity before controls fade

export default function ShowcasePage({ onBack }) {
  const { trips } = useTrips();
  const { games } = useGames();

  const {
    pool, currentItem, index, total,
    isPaused, toggle, next, prev,
  } = useSlideshow(trips, games);

  // ── Crossfade state ──────────────────────────────────────────
  // We keep track of the "displayed" item separately so we can
  // crossfade from old → new over 1 second.
  const [displayedItem,    setDisplayedItem]    = useState(currentItem);
  const [displayedKey,     setDisplayedKey]     = useState(0); // forces Ken Burns restart
  const [isTransitioning,  setIsTransitioning]  = useState(false);

  useEffect(() => {
    if (!currentItem) return;
    // Start fade-out
    setIsTransitioning(true);
    const t = setTimeout(() => {
      setDisplayedItem(currentItem);
      setDisplayedKey(k => k + 1);
      setIsTransitioning(false);
    }, 600); // halfway through the CSS transition
    return () => clearTimeout(t);
  }, [currentItem]);

  // ── Control auto-hide ─────────────────────────────────────────
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROL_HIDE_DELAY);
  }, []);

  useEffect(() => {
    resetHideTimer();
    const onMove = () => resetHideTimer();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchstart", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onMove);
      clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // ── Keyboard navigation ───────────────────────────────────────
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft")                   { e.preventDefault(); prev(); }
      if (e.key === "p" || e.key === "P")          { toggle(); }
      if (e.key === "Escape")                      { onBack(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev, toggle, onBack]);

  // ── Empty state ───────────────────────────────────────────────
  if (pool.length === 0) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>✨</span>
          <h2 className={styles.emptyTitle}>Nothing to showcase yet</h2>
          <p className={styles.emptyDesc}>
            Add some trips or log some games to start your showcase.
          </p>
          <button className={styles.emptyBack} onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Progress bar ────────────────────────── */}
      {/* Keyed on index so it resets every advance */}
      {!isPaused && (
        <div className={styles.progressTrack}>
          <div
            key={`progress-${index}`}
            className={styles.progressBar}
            style={{ animationDuration: `${SLIDESHOW_INTERVAL_MS}ms` }}
          />
        </div>
      )}

      {/* ── Slideshow item (crossfade) ───────────── */}
      <div
        className={`${styles.itemWrap} ${isTransitioning ? styles.itemFading : ""}`}
      >
        {displayedItem && (
          <SlideshowItem
            item={displayedItem}
            animationKey={displayedKey}
          />
        )}
      </div>

      {/* ── Controls overlay ─────────────────────── */}
      <div className={`${styles.controls} ${showControls ? styles.controlsVisible : ""}`}>

        {/* Top bar: title + exit */}
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            <span className={styles.showcaseLabel}>✨ Showcase</span>
          </div>
          <button className={styles.exitBtn} onClick={onBack} title="Exit showcase (Esc)">
            ✕
          </button>
        </div>

        {/* Bottom bar: prev / pause / next + counter */}
        <div className={styles.bottomBar}>
          <div className={styles.navGroup}>
            <button
              className={styles.navBtn}
              onClick={prev}
              title="Previous (←)"
            >
              ‹
            </button>

            <button
              className={`${styles.navBtn} ${styles.pauseBtn}`}
              onClick={toggle}
              title={isPaused ? "Resume (P)" : "Pause (P)"}
            >
              {isPaused ? "▶" : "⏸"}
            </button>

            <button
              className={styles.navBtn}
              onClick={next}
              title="Next (→)"
            >
              ›
            </button>
          </div>

          <div className={styles.counter}>
            {index + 1} / {total}
            {isPaused && <span className={styles.pausedLabel}> · Paused</span>}
          </div>
        </div>
      </div>

    </div>
  );
}