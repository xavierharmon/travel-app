// src/utils/routeStorage.js
import { ROUTE_CACHE_KEY } from "@/constants";

function loadRouteCache() {
  try {
    const raw = localStorage.getItem(ROUTE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRouteCache(cache) {
  try {
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.error("[routeStorage] Failed to save route cache:", err);
  }
}

export function buildRouteKey(stops) {
  return stops
    .filter(s => s?.lat && s?.lng)
    .map(s => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`)
    .join("|");
}

export function getStoredRoute(stops) {
  const key = buildRouteKey(stops);
  if (!key) return null;
  const cache = loadRouteCache();
  const entry = cache[key];
  if (!entry) return null;
  return entry.encodedPolyline;
}

export function storeRoute(stops, encodedPolyline) {
  const key = buildRouteKey(stops);
  if (!key || !encodedPolyline) return;
  const cache  = loadRouteCache();
  cache[key]   = { encodedPolyline, savedAt: new Date().toISOString() };
  saveRouteCache(cache);
}

export function deleteStoredRoute(stops) {
  const key   = buildRouteKey(stops);
  const cache = loadRouteCache();
  delete cache[key];
  saveRouteCache(cache);
}

export function clearAllStoredRoutes() {
  try {
    localStorage.removeItem(ROUTE_CACHE_KEY);
  } catch (err) {
    console.error("[routeStorage] Failed to clear route cache:", err);
  }
}

export function getRouteCacheStats() {
  const cache = loadRouteCache();
  const keys  = Object.keys(cache);
  const raw   = localStorage.getItem(ROUTE_CACHE_KEY) || "";
  return {
    count:  keys.length,
    sizeKb: (raw.length / 1024).toFixed(1),
  };
}