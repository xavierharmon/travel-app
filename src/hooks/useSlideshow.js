// src/hooks/useSlideshow.js
//
// One slide per trip / game / memory — no duplicates.
// Each slide randomly selects up to 3 photos from ALL photos
// associated with that entity (trip-level + all stop-level).

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

// Pick up to `max` items randomly from an array
function pickRandom(arr, max) {
  return shuffle(arr).slice(0, max);
}

function buildTripItems(trips) {
  return trips.map(trip => {
    const mileage    = computeTripMileage(trip);
    const routeStops = [trip.origin, ...(trip.stops || []), trip.destination]
      .filter(s => s?.name);
    const route      = routeStops.map(s => s.name.split(",")[0]).join(" → ");

    // Gather ALL photos across trip-level and every stop
    const allPhotos = [
      ...(trip.photos || []).filter(p => p?.id).map(p => ({
        id:              p.id,
        caption:         p.caption || "",
        stopName:        null,
        stopDescription: null,
      })),
      ...(trip.stops || []).flatMap(stop =>
        (stop.photos || []).filter(p => p?.id).map(p => ({
          id:              p.id,
          caption:         p.caption || "",
          stopName:        stop.name?.split(",")[0] || null,
          stopDescription: stop.description || null,
        }))
      ),
    ];

    // Pick up to 3 at random — hero is index 0
    const selected = pickRandom(allPhotos, 3);
    const hero     = selected[0] || null;
    const siblings = selected.slice(1).map(p => ({ id: p.id, caption: p.caption }));

    const hasFallback = allPhotos.length === 0;

    return {
      kind:             hasFallback ? "trip_fallback" : "photo",
      id:               `trip-${trip.id}`,
      source:           "trip",
      tripName:         trip.name || "Untitled Trip",
      tripDescription:  (trip.description || "").split("\n")[0],
      date:             trip.date || null,
      mileage,
      route,

      // Photo fields (null for fallback)
      photoId:          hero?.id              || null,
      caption:          hero?.caption         || "",
      stopName:         hero?.stopName        || null,
      stopDescription:  hero?.stopDescription || null,
      siblingPhotos:    siblings,
    };
  });
}

function buildGameItems(games) {
  return games.map(game => {
    const allPhotos = (game.photos || []).filter(p => p?.id).map(p => ({
      id:      p.id,
      caption: p.caption || "",
    }));

    const selected = pickRandom(allPhotos, 3);
    const hero     = selected[0] || null;
    const siblings = selected.slice(1).map(p => ({ id: p.id, caption: p.caption }));

    const hasFallback = allPhotos.length === 0;

    return {
      kind:             hasFallback ? "game_fallback" : "photo",
      id:               `game-${game.id}`,
      source:           "game",
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

      photoId:       hero?.id      || null,
      caption:       hero?.caption || "",
      siblingPhotos: siblings,
    };
  });
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