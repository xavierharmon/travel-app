// src/utils/mileageStorage.js
// Stores and retrieves per-segment mileage in localStorage.
// Keyed by the same coordinate-based key used by routeStorage
// so drive mileage is always stored alongside its polyline.

const MILEAGE_CACHE_KEY = "road_trip_mileage_v1";

function loadMileageCache() {
  try {
    const raw = localStorage.getItem(MILEAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMileageCache(cache) {
  try {
    localStorage.setItem(MILEAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.error("[mileageStorage] Failed to save:", err);
  }
}

// Build a cache key from two stops
export function buildMileageKey(from, to) {
  if (!from?.lat || !to?.lat) return null;
  return [from, to]
    .map(s => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`)
    .join("|");
}

export function getStoredMileage(from, to) {
  const key = buildMileageKey(from, to);
  if (!key) return null;
  const cache = loadMileageCache();
  return cache[key] ?? null;
}

export function storeMileage(from, to, miles) {
  const key = buildMileageKey(from, to);
  if (!key) return;
  const cache = loadMileageCache();
  cache[key]  = { miles, savedAt: new Date().toISOString() };
  saveMileageCache(cache);
}

export function clearAllMileage() {
  try {
    localStorage.removeItem(MILEAGE_CACHE_KEY);
  } catch (err) {
    console.error("[mileageStorage] Failed to clear:", err);
  }
}

export function getMileageCacheStats() {
  const cache = loadMileageCache();
  const keys  = Object.keys(cache);
  const raw   = localStorage.getItem(MILEAGE_CACHE_KEY) || "";
  return {
    count:  keys.length,
    sizeKb: (raw.length / 1024).toFixed(1),
  };
}