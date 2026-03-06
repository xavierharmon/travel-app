// src/utils/storage.js
import { STORAGE_KEY } from "@/constants";

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

    // Warn if getting close to the 5MB localStorage limit
    const sizeKb = serialized.length / 1024;
    const sizeMb = sizeKb / 1024;
    if (sizeMb > 3.5) {
      console.warn(`[storage] Storage is ${sizeMb.toFixed(1)}MB — approaching 5MB limit`);
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    console.log(`[storage] Saved ${trips.length} trips (${sizeKb.toFixed(0)}KB)`);
  } catch (err) {
    if (err.name === "QuotaExceededError") {
      console.error("[storage] localStorage is full!");
      throw new Error(
        "Storage is full. Your photos may not be saving. " +
        "Try removing some photos from older trips to free up space."
      );
    }
    throw err;
  }
}

export function getStorageUsage() {
  try {
    const raw  = localStorage.getItem(STORAGE_KEY) || "";
    const kb   = (raw.length / 1024).toFixed(1);
    const mb   = (raw.length / 1024 / 1024).toFixed(2);
    const pct  = ((raw.length / (5 * 1024 * 1024)) * 100).toFixed(0);
    return { kb, mb, pct };
  } catch {
    return { kb: 0, mb: 0, pct: 0 };
  }
}

export function clearTrips() {
  localStorage.removeItem(STORAGE_KEY);
}