// src/utils/photoStorage.js
//
// IndexedDB-backed photo storage. Replaces the dataUrl field that was
// previously embedded inside localStorage trip/game objects.
//
// Schema:
//   DB name:    "adventures_photos"
//   Version:    1
//   Store name: "photos"
//   Key:        photo.id  (string, e.g. "photo_1234567890_abc12")
//   Value:      { id, dataUrl, savedAt }
//
// All functions are async and return Promises.
// The DB opens lazily on first call and is reused for the session.
//
// Google Drive migration path:
//   When Drive photo sync is added, replace getPhoto / savePhoto /
//   deletePhoto with Drive API calls. The calling code (PhotoGrid,
//   contexts, backup) never touches IndexedDB directly — they all go
//   through this module, so the swap is a single-file change.

const DB_NAME    = "adventures_photos";
const DB_VERSION = 1;
const STORE_NAME = "photos";

// ── Internal: open (or reuse) the DB ────────────────────────────
let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = (e) => {
      reject(new Error(`IndexedDB open failed: ${e.target.error}`));
    };
  });
}

// ── Internal: run a transaction ──────────────────────────────────
async function withStore(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req   = fn(store);

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(new Error(`IndexedDB ${mode} failed: ${req.error}`));
  });
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Save a single photo.
 * @param {string} id      - photo.id
 * @param {string} dataUrl - base64 data URL
 */
export async function savePhoto(id, dataUrl) {
  if (!id || !dataUrl) return;
  await withStore("readwrite", store =>
    store.put({ id, dataUrl, savedAt: new Date().toISOString() })
  );
}

/**
 * Retrieve a single photo's dataUrl, or null if not found.
 * @param {string} id
 * @returns {Promise<string|null>}
 */
export async function getPhoto(id) {
  if (!id) return null;
  try {
    const result = await withStore("readonly", store => store.get(id));
    return result?.dataUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Retrieve many photos at once. Returns a Map<id, dataUrl>.
 * Missing IDs are simply absent from the map.
 * @param {string[]} ids
 * @returns {Promise<Map<string, string>>}
 */
export async function getPhotos(ids) {
  if (!ids?.length) return new Map();
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const map   = new Map();
    const tx    = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    let pending = ids.length;

    if (pending === 0) { resolve(map); return; }

    ids.forEach(id => {
      const req      = store.get(id);
      req.onsuccess  = () => {
        if (req.result?.dataUrl) map.set(id, req.result.dataUrl);
        if (--pending === 0) resolve(map);
      };
      req.onerror = () => {
        if (--pending === 0) resolve(map); // non-fatal
      };
    });
  });
}

/**
 * Delete a single photo.
 * @param {string} id
 */
export async function deletePhoto(id) {
  if (!id) return;
  await withStore("readwrite", store => store.delete(id));
}

/**
 * Delete many photos at once.
 * @param {string[]} ids
 */
export async function deletePhotos(ids) {
  if (!ids?.length) return;
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    ids.forEach(id => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(new Error(`Bulk delete failed: ${tx.error}`));
  });
}

/**
 * Export ALL photos as a plain object { [id]: dataUrl }.
 * Used by the backup system to include photos in exports.
 * @returns {Promise<Object>}
 */
export async function exportAllPhotos() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const result = {};
    const tx     = db.transaction(STORE_NAME, "readonly");
    const store  = tx.objectStore(STORE_NAME);
    const cursor = store.openCursor();

    cursor.onsuccess = (e) => {
      const c = e.target.result;
      if (c) {
        result[c.value.id] = c.value.dataUrl;
        c.continue();
      } else {
        resolve(result);
      }
    };

    cursor.onerror = () => reject(new Error(`Export cursor failed: ${cursor.error}`));
  });
}

/**
 * Import photos from a backup object { [id]: dataUrl }.
 * Existing photos with the same ID are overwritten.
 * @param {Object} photosObj
 */
export async function importAllPhotos(photosObj) {
  if (!photosObj || typeof photosObj !== "object") return;
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    Object.entries(photosObj).forEach(([id, dataUrl]) => {
      if (id && dataUrl) {
        store.put({ id, dataUrl, savedAt: new Date().toISOString() });
      }
    });

    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(new Error(`Import failed: ${tx.error}`));
  });
}

/**
 * Get storage stats for the photos store.
 * @returns {Promise<{ count: number, estimatedMb: string }>}
 */
export async function getPhotoStorageStats() {
  const db = await openDB();

  return new Promise((resolve) => {
    let count     = 0;
    let totalSize = 0;
    const tx      = db.transaction(STORE_NAME, "readonly");
    const store   = tx.objectStore(STORE_NAME);
    const cursor  = store.openCursor();

    cursor.onsuccess = (e) => {
      const c = e.target.result;
      if (c) {
        count++;
        totalSize += (c.value.dataUrl?.length || 0);
        c.continue();
      } else {
        resolve({
          count,
          estimatedMb: (totalSize / 1024 / 1024).toFixed(1),
        });
      }
    };

    cursor.onerror = () => resolve({ count: 0, estimatedMb: "0" });
  });
}

/**
 * Migrate photos OUT of localStorage trip/game objects INTO IndexedDB.
 * Safe to call on every app load — already-migrated photos are no-ops.
 *
 * After migration, the dataUrl fields are removed from the localStorage
 * objects and replaced with a flag: { ..., dataUrl: null, _migratedToIDB: true }
 *
 * @returns {Promise<{ migrated: number }>}
 */
export async function migratePhotosFromLocalStorage() {
  const TRIP_KEY  = "road_trip_memories_v1";
  const GAMES_KEY = "sports_games_v1";
  let migrated    = 0;

  // ── Helper: process a photo array ─────────────────────────────
  async function processPhotos(photos) {
    if (!photos?.length) return photos;
    const updated = [];
    for (const photo of photos) {
      if (photo.dataUrl && !photo._migratedToIDB) {
        await savePhoto(photo.id, photo.dataUrl);
        migrated++;
        updated.push({ ...photo, dataUrl: null, _migratedToIDB: true });
      } else {
        updated.push(photo);
      }
    }
    return updated;
  }

  // ── Migrate trips ──────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(TRIP_KEY);
    if (raw) {
      const trips   = JSON.parse(raw);
      let changed   = false;
      const updated = await Promise.all(
        trips.map(async trip => {
          const tripPhotos = await processPhotos(trip.photos);
          const stops      = await Promise.all(
            (trip.stops || []).map(async stop => ({
              ...stop,
              photos: await processPhotos(stop.photos),
            }))
          );
          if (
            tripPhotos !== trip.photos ||
            stops.some((s, i) => s.photos !== trip.stops?.[i]?.photos)
          ) changed = true;
          return { ...trip, photos: tripPhotos, stops };
        })
      );
      if (changed) localStorage.setItem(TRIP_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn("[photoStorage] Trip migration failed:", err.message);
  }

  // ── Migrate games ──────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (raw) {
      const games   = JSON.parse(raw);
      let changed   = false;
      const updated = await Promise.all(
        games.map(async game => {
          const gamePhotos = await processPhotos(game.photos);
          if (gamePhotos !== game.photos) changed = true;
          return { ...game, photos: gamePhotos };
        })
      );
      if (changed) localStorage.setItem(GAMES_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn("[photoStorage] Games migration failed:", err.message);
  }

  if (migrated > 0) {
    console.log(`[photoStorage] Migrated ${migrated} photos from localStorage → IndexedDB`);
  } else {
    console.log("[photoStorage] No photos needed migration");
  }

  return { migrated };
}