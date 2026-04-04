// src/hooks/useSlideshow.js
//
// Updated: stop-level items now carry stopDescription so the
// SlideshowItem can render the floating journal note.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { computeTripMileage } from "@/utils/tripMileage";
import { SLIDESHOW_INTERVAL_MS } from "@/constants";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTripItems(trips) {
  const items = [];

  for (const trip of trips) {
    const mileage    = computeTripMileage(trip);
    const routeStops = [trip.origin, ...(trip.stops || []), trip.destination]
      .filter(s => s?.name);
    const route      = routeStops.map(s => s.name.split(",")[0]).join(" → ");

    const baseCtx = {
      tripName: trip.name || "Untitled Trip",
      tripDescription: (trip.description || "").split('\n')[0],
      date:     trip.date || null,
      mileage,
      route,
    };

    let photoCount = 0;

    // ── Trip-level photos ──────────────────────────────────────
    const tripPhotos = (trip.photos || []).filter(p => p?.id);

    for (const photo of tripPhotos) {
      const siblings = tripPhotos
        .filter(p => p.id !== photo.id)
        .slice(0, 2)
        .map(p => ({ id: p.id, caption: p.caption || "" }));

      items.push({
        kind:             "photo",
        id:               `trip-${trip.id}-photo-${photo.id}`,
        photoId:          photo.id,
        caption:          photo.caption || "",
        siblingPhotos:    siblings,
        source:           "trip",
        stopDescription:  null, // trip-level — no stop note
        ...baseCtx,
      });
      photoCount++;
    }

    // ── Stop-level photos ──────────────────────────────────────
    for (const stop of trip.stops || []) {
      const stopPhotos = (stop.photos || []).filter(p => p?.id);

      for (const photo of stopPhotos) {
        const siblings = stopPhotos
          .filter(p => p.id !== photo.id)
          .slice(0, 2)
          .map(p => ({ id: p.id, caption: p.caption || "" }));

        items.push({
          kind:             "photo",
          id:               `trip-${trip.id}-stop-${stop.id}-photo-${photo.id}`,
          photoId:          photo.id,
          caption:          photo.caption || "",
          siblingPhotos:    siblings,
          source:           "stop",
          stopName:         stop.name?.split(",")[0] || null,
          stopDescription:  stop.description || null, // ← NEW: powers the journal note
          ...baseCtx,
        });
        photoCount++;
      }
    }

    // ── Fallback if no photos at all ───────────────────────────
    if (photoCount === 0) {
      items.push({
        kind:             "trip_fallback",
        id:               `trip-${trip.id}-fallback`,
        siblingPhotos:    [],
        stopDescription:  null,
        ...baseCtx,
      });
    }
  }

  return items;
}

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
      collegeSport:     game.collegeSport     || null,
    };

    const gamePhotos = (game.photos || []).filter(p => p?.id);

    for (const photo of gamePhotos) {
      const siblings = gamePhotos
        .filter(p => p.id !== photo.id)
        .slice(0, 2)
        .map(p => ({ id: p.id, caption: p.caption || "" }));

      items.push({
        kind:          "photo",
        id:            `game-${game.id}-photo-${photo.id}`,
        photoId:       photo.id,
        caption:       photo.caption || "",
        siblingPhotos: siblings,
        source:        "game",
        ...baseCtx,
      });
    }

    if (gamePhotos.length === 0) {
      items.push({
        kind:          "game_fallback",
        id:            `game-${game.id}-fallback`,
        siblingPhotos: [],
        ...baseCtx,
      });
    }
  }

  return items;
}

export function useSlideshow(trips, games) {
  const pool = useMemo(() => {
    const tripItems = buildTripItems(trips);
    const gameItems = buildGameItems(games);
    return shuffle([...tripItems, ...gameItems]);
  }, [trips, games]);

  const [index,    setIndex]    = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef             = useRef(null);

  const safeIndex = pool.length > 0 ? index % pool.length : 0;

  const advance = useCallback(() => {
    setIndex(prev => (prev + 1) % Math.max(pool.length, 1));
  }, [pool.length]);

  const goBack = useCallback(() => {
    setIndex(prev => (prev - 1 + pool.length) % Math.max(pool.length, 1));
  }, [pool.length]);

  useEffect(() => {
    if (isPaused || pool.length === 0) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(advance, SLIDESHOW_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, advance, pool.length]);

  useEffect(() => { setIndex(0); }, [pool]);

  const toggle = useCallback(() => setIsPaused(p => !p), []);

  return {
    pool,
    currentItem: pool[safeIndex] ?? null,
    index:       safeIndex,
    total:       pool.length,
    isPaused,
    pause:       useCallback(() => setIsPaused(true),  []),
    resume:      useCallback(() => setIsPaused(false), []),
    toggle,
    next: advance,
    prev: goBack,
  };
}