// src/utils/directionsCache.js
// In-memory cache for directions results.
// Persists for the lifetime of the browser session.

const cache = new Map();

function buildCacheKey(stops) {
  // Key is a string of all lat/lng pairs joined together
  return stops
    .map(s => `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`)
    .join("|");
}

export function getCachedRoute(stops) {
  const key = buildCacheKey(stops);
  const entry = cache.get(key);

  if (!entry) return null;

  // Expire cache after 24 hours
  const AGE_LIMIT = 24 * 60 * 60 * 1000;
  if (Date.now() - entry.timestamp > AGE_LIMIT) {
    cache.delete(key);
    return null;
  }

  console.log("[directionsCache] Cache hit for route:", key);
  return entry.result;
}

export function setCachedRoute(stops, result) {
  const key = buildCacheKey(stops);
  cache.set(key, { result, timestamp: Date.now() });
  console.log("[directionsCache] Cached route:", key);
}

export function clearDirectionsCache() {
  cache.clear();
}