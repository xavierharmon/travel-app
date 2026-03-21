// src/hooks/usePhotoUrls.js
//
// Shared hook for any component that needs to DISPLAY photos.
// Accepts an array of photo objects (without dataUrl) and returns
// a Map<photoId, dataUrl> populated from IndexedDB.
//
// Usage:
//   const photoUrls = usePhotoUrls(trip.photos);
//   const src = photoUrls.get(photo.id); // string | undefined
//
// Used by: TripCard, GameCard (photo strip), SlideshowItem,
//          and any other read-only display component.

import { useState, useEffect } from "react";
import { getPhotos } from "@/utils/photoStorage";

/**
 * @param {Array<{id: string}>} photos  - array of photo objects (no dataUrl needed)
 * @returns {Map<string, string>}        - id → dataUrl
 */
export function usePhotoUrls(photos) {
  const [urlMap, setUrlMap] = useState(new Map());

  useEffect(() => {
    if (!photos?.length) { setUrlMap(new Map()); return; }

    const ids = photos.map(p => p.id).filter(Boolean);
    if (!ids.length) return;

    let cancelled = false;

    getPhotos(ids).then(map => {
      if (!cancelled) setUrlMap(map);
    });

    return () => { cancelled = true; };
  }, [
    // Re-run only when the actual photo IDs change, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    photos?.map(p => p.id).join(","),
  ]);

  return urlMap;
}

/**
 * Convenience: given an array of photo objects, returns a new array
 * with dataUrl fields populated from IndexedDB.
 * Useful when you need the full photo objects (e.g. for backup).
 *
 * @param {Array<{id: string}>} photos
 * @returns {{ photos: Array, loading: boolean }}
 */
export function usePhotosWithUrls(photos) {
  const urlMap  = usePhotoUrls(photos);
  const loading = photos?.length > 0 && urlMap.size === 0;

  const hydrated = (photos || []).map(p => ({
    ...p,
    dataUrl: urlMap.get(p.id) ?? null,
  }));

  return { photos: hydrated, loading };
}