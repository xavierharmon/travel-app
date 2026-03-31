// src/utils/storage.js
import { STORAGE_KEY } from "@/constants";

const ALL_STORAGE_KEYS = [
  "road_trip_memories_v1",
  "sports_games_v1",
  "road_trip_routes_v1",
  "road_trip_mileage_v1",
  "favorite_memories_v1",
];

export function loadTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("[storage] Failed to load trips:", err);
    return [];
  }
}

export function saveTrips(trips) {
  try {
    const serialized = JSON.stringify(trips);
    const sizeKb     = serialized.length / 1024;
    const sizeMb     = sizeKb / 1024;
    if (sizeMb > 3.5) {
      console.warn(`[storage] Storage is ${sizeMb.toFixed(1)}MB — approaching 5MB limit`);
    }
    localStorage.setItem(STORAGE_KEY, serialized);
    console.log(`[storage] Saved ${trips.length} trips (${sizeKb.toFixed(0)}KB)`);
  } catch (err) {
    if (err.name === "QuotaExceededError") {
      console.error("[storage] localStorage is full!");
      throw new Error(
        "Storage is full. Try removing some photos from older trips to free up space."
      );
    }
    throw err;
  }
}

// ── Full storage usage across ALL app keys ───────────────────────
export function getStorageUsage() {
  try {
    const totalLength = ALL_STORAGE_KEYS.reduce((sum, key) => {
      return sum + (localStorage.getItem(key) || "").length;
    }, 0);

    // Per-key breakdown for detailed display
    const breakdown = ALL_STORAGE_KEYS.reduce((acc, key) => {
      const len     = (localStorage.getItem(key) || "").length;
      acc[key]      = {
        kb:  (len / 1024).toFixed(1),
        pct: ((len / totalLength) * 100).toFixed(0),
      };
      return acc;
    }, {});

    const kb  = (totalLength / 1024).toFixed(1);
    const mb  = (totalLength / 1024 / 1024).toFixed(2);
    const pct = ((totalLength / (5 * 1024 * 1024)) * 100).toFixed(0);

    return { kb, mb, pct: Math.min(Number(pct), 100), breakdown };
  } catch {
    return { kb: 0, mb: 0, pct: 0, breakdown: {} };
  }
}

export function clearTrips() {
  localStorage.removeItem(STORAGE_KEY);
}