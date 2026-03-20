// src/hooks/useSlideshow.js
//
// Builds a unified item pool from all trips and games, shuffles it,
// and advances through it on a timer.
//
// Item shapes:
//   Photo item:
//     { kind: "photo", id, dataUrl, caption,
//       source: "trip" | "stop" | "game",
//       tripName?, stopName?, date?, mileage?,
//       homeTeam?, visitingTeam?, homeTeamLogo?, visitingTeamLogo?,
//       homeScore?, visitingScore?, outcome?, venue?, city? }
//
//   Fallback item (no photos):
//     { kind: "trip_fallback",  id, tripName, date, mileage, route }
//     { kind: "game_fallback",  id, homeTeam, visitingTeam, homeTeamLogo,
//       visitingTeamLogo, homeScore, visitingScore, outcome, date, venue, city }

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { computeTripMileage } from "@/utils/tripMileage";
import { SLIDESHOW_INTERVAL_MS } from "@/constants";

// ── Fisher-Yates shuffle (returns a new array) ───────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Build pool from trips ────────────────────────────────────────
function buildTripItems(trips) {
  const items = [];

  for (const trip of trips) {
    const mileage = computeTripMileage(trip);

    // Collect all stops including origin and destination for route summary
    const routeStops = [
      trip.origin,
      ...(trip.stops || []),
      trip.destination,
    ].filter(s => s?.name);

    const route = routeStops.map(s => s.name.split(",")[0]).join(" → ");

    const baseCtx = {
      tripName: trip.name || "Untitled Trip",
      date:     trip.date || null,
      mileage,
      route,
    };

    let photoCount = 0;

    // Trip-level photos
    for (const photo of trip.photos || []) {
      if (!photo?.dataUrl) continue;
      items.push({
        kind:    "photo",
        id:      `trip-${trip.id}-photo-${photo.id}`,
        dataUrl: photo.dataUrl,
        caption: photo.caption || null,
        source:  "trip",
        ...baseCtx,
      });
      photoCount++;
    }

    // Stop-level photos
    for (const stop of trip.stops || []) {
      for (const photo of stop.photos || []) {
        if (!photo?.dataUrl) continue;
        items.push({
          kind:     "photo",
          id:       `trip-${trip.id}-stop-${stop.id}-photo-${photo.id}`,
          dataUrl:  photo.dataUrl,
          caption:  photo.caption || null,
          source:   "stop",
          stopName: stop.name?.split(",")[0] || null,
          ...baseCtx,
        });
        photoCount++;
      }
    }

    // Fallback if no photos at all
    if (photoCount === 0) {
      items.push({
        kind:     "trip_fallback",
        id:       `trip-${trip.id}-fallback`,
        ...baseCtx,
      });
    }
  }

  return items;
}

// ── Build pool from games ────────────────────────────────────────
function buildGameItems(games) {
  const items = [];

  for (const game of games) {
    const baseCtx = {
      homeTeam:         game.homeTeam         || "Home",
      visitingTeam:     game.visitingTeam     || "Visitor",
      homeTeamLogo:     game.homeTeamLogo     || null,
      visitingTeamLogo: game.visitingTeamLogo || null,
      homeScore:        game.homeScore        ?? null,
      visitingScore:    game.visitingScore    ?? null,
      outcome:          game.outcome          || null,
      date:             game.date             || null,
      venue:            game.venue            || null,
      city:             game.city             || null,
      sport:            game.sport            || null,
    };

    const photos = game.photos || [];

    for (const photo of photos) {
      if (!photo?.dataUrl) continue;
      items.push({
        kind:    "photo",
        id:      `game-${game.id}-photo-${photo.id}`,
        dataUrl: photo.dataUrl,
        caption: photo.caption || null,
        source:  "game",
        ...baseCtx,
      });
    }

    if (photos.length === 0) {
      items.push({
        kind: "game_fallback",
        id:   `game-${game.id}-fallback`,
        ...baseCtx,
      });
    }
  }

  return items;
}

// ── Hook ─────────────────────────────────────────────────────────
export function useSlideshow(trips, games) {
  // Build and shuffle the pool whenever source data changes
  const pool = useMemo(() => {
    const tripItems = buildTripItems(trips);
    const gameItems = buildGameItems(games);
    return shuffle([...tripItems, ...gameItems]);
  }, [trips, games]);

  const [index,    setIndex]    = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef             = useRef(null);

  // Clamp index if pool shrinks
  const safeIndex = pool.length > 0 ? index % pool.length : 0;

  const advance = useCallback(() => {
    setIndex(prev => (prev + 1) % Math.max(pool.length, 1));
  }, [pool.length]);

  const goBack = useCallback(() => {
    setIndex(prev => (prev - 1 + pool.length) % Math.max(pool.length, 1));
  }, [pool.length]);

  // Start / stop the interval based on paused state
  useEffect(() => {
    if (isPaused || pool.length === 0) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(advance, SLIDESHOW_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, advance, pool.length]);

  // Reset to 0 when pool is rebuilt (new data)
  useEffect(() => {
    setIndex(0);
  }, [pool]);

  const pause  = useCallback(() => setIsPaused(true),  []);
  const resume = useCallback(() => setIsPaused(false), []);
  const toggle = useCallback(() => setIsPaused(p => !p), []);

  return {
    pool,
    currentItem: pool[safeIndex] ?? null,
    index:       safeIndex,
    total:       pool.length,
    isPaused,
    pause,
    resume,
    toggle,
    next: advance,
    prev: goBack,
  };
}