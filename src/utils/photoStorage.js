// src/utils/photoStorage.js
//
// IndexedDB-backed storage for both photos and team logos.
//
// Schema:
//   DB name:    "adventures_photos"
//   Version:    2  (bumped from 1 to add logos store)
//   Stores:
//     "photos"  — key: photo.id
//     "logos"   — key: "logo_TeamName"
//
// Google Drive migration path:
//   Replace individual get/save/delete functions with Drive API calls.
//   All calling code goes through this module only — nothing else
//   touches IndexedDB directly.

const DB_NAME     = "adventures_photos";
const DB_VERSION  = 2;
const PHOTO_STORE = "photos";
const LOGO_STORE  = "logos";

// ── Internal: open (or reuse) the DB ────────────────────────────
let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db     = e.target.result;
      const oldVer = e.oldVersion;

      // v1 → photos store (may already exist on first install)
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }

      // v2 → logos store
      if (oldVer < 2 && !db.objectStoreNames.contains(LOGO_STORE)) {
        db.createObjectStore(LOGO_STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror   = (e) => reject(new Error(`IndexedDB open failed: ${e.target.error}`));
  });
}

// ── Internal: single-request transaction helper ──────────────────
async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req   = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(new Error(`IDB ${mode} on ${storeName} failed: ${req.error}`));
  });
}

// ── Internal: cursor over an entire store ────────────────────────
async function exportStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const result = {};
    const tx     = db.transaction(storeName, "readonly");
    const store  = tx.objectStore(storeName);
    const cursor = store.openCursor();
    cursor.onsuccess = (e) => {
      const c = e.target.result;
      if (c) { result[c.value.id] = c.value.dataUrl; c.continue(); }
      else   { resolve(result); }
    };
    cursor.onerror = () => reject(new Error(`Export cursor on ${storeName} failed`));
  });
}

// ── Internal: bulk import into a store ──────────────────────────
async function importStore(storeName, obj, buildRecord) {
  if (!obj || typeof obj !== "object") return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    Object.entries(obj).forEach(([id, dataUrl]) => {
      if (id && dataUrl) store.put(buildRecord(id, dataUrl));
    });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(new Error(`Import into ${storeName} failed: ${tx.error}`));
  });
}

// ════════════════════════════════════════════════════════════════
// PHOTOS
// ════════════════════════════════════════════════════════════════

export async function savePhoto(id, dataUrl) {
  if (!id || !dataUrl) return;
  await withStore(PHOTO_STORE, "readwrite", store =>
    store.put({ id, dataUrl, savedAt: new Date().toISOString() })
  );
}

export async function getPhoto(id) {
  if (!id) return null;
  try {
    const result = await withStore(PHOTO_STORE, "readonly", store => store.get(id));
    return result?.dataUrl ?? null;
  } catch { return null; }
}

export async function getPhotos(ids) {
  if (!ids?.length) return new Map();
  const db = await openDB();
  return new Promise((resolve) => {
    const map     = new Map();
    const tx      = db.transaction(PHOTO_STORE, "readonly");
    const store   = tx.objectStore(PHOTO_STORE);
    let   pending = ids.length;
    if (pending === 0) { resolve(map); return; }
    ids.forEach(id => {
      const req     = store.get(id);
      req.onsuccess = () => {
        if (req.result?.dataUrl) map.set(id, req.result.dataUrl);
        if (--pending === 0) resolve(map);
      };
      req.onerror = () => { if (--pending === 0) resolve(map); };
    });
  });
}

export async function deletePhoto(id) {
  if (!id) return;
  await withStore(PHOTO_STORE, "readwrite", store => store.delete(id));
}

export async function deletePhotos(ids) {
  if (!ids?.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(PHOTO_STORE, "readwrite");
    const store = tx.objectStore(PHOTO_STORE);
    ids.forEach(id => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(new Error(`Bulk photo delete failed: ${tx.error}`));
  });
}

export async function exportAllPhotos() {
  return exportStore(PHOTO_STORE);
}

export async function importAllPhotos(photosObj) {
  return importStore(
    PHOTO_STORE,
    photosObj,
    (id, dataUrl) => ({ id, dataUrl, savedAt: new Date().toISOString() })
  );
}

// ════════════════════════════════════════════════════════════════
// LOGOS
// ════════════════════════════════════════════════════════════════

/** Stable key for a team logo: "logo_Chicago Cubs" */
export function buildLogoId(teamName) {
  if (!teamName) return null;
  return `logo_${teamName}`;
}

export async function saveLogo(teamName, dataUrl) {
  const id = buildLogoId(teamName);
  if (!id || !dataUrl) return;
  await withStore(LOGO_STORE, "readwrite", store =>
    store.put({ id, teamName, dataUrl, savedAt: new Date().toISOString() })
  );
}

export async function getLogo(teamName) {
  const id = buildLogoId(teamName);
  if (!id) return null;
  try {
    const result = await withStore(LOGO_STORE, "readonly", store => store.get(id));
    return result?.dataUrl ?? null;
  } catch { return null; }
}

/**
 * Retrieve multiple logos at once.
 * Returns Map<teamName, dataUrl>.
 */
export async function getLogos(teamNames) {
  if (!teamNames?.length) return new Map();
  const db = await openDB();
  return new Promise((resolve) => {
    const map     = new Map();
    const tx      = db.transaction(LOGO_STORE, "readonly");
    const store   = tx.objectStore(LOGO_STORE);
    let   pending = teamNames.length;
    if (pending === 0) { resolve(map); return; }
    teamNames.forEach(name => {
      const id      = buildLogoId(name);
      const req     = store.get(id);
      req.onsuccess = () => {
        if (req.result?.dataUrl) map.set(name, req.result.dataUrl);
        if (--pending === 0) resolve(map);
      };
      req.onerror = () => { if (--pending === 0) resolve(map); };
    });
  });
}

export async function deleteLogo(teamName) {
  const id = buildLogoId(teamName);
  if (!id) return;
  await withStore(LOGO_STORE, "readwrite", store => store.delete(id));
}

export async function exportAllLogos() {
  return exportStore(LOGO_STORE);
}

export async function importAllLogos(logosObj) {
  return importStore(
    LOGO_STORE,
    logosObj,
    (id, dataUrl) => ({
      id,
      teamName: id.startsWith("logo_") ? id.slice(5) : id,
      dataUrl,
      savedAt: new Date().toISOString(),
    })
  );
}

// ════════════════════════════════════════════════════════════════
// STATS (photos + logos combined)
// ════════════════════════════════════════════════════════════════

export async function getPhotoStorageStats() {
  const db = await openDB();

  async function scanStore(storeName) {
    return new Promise((resolve) => {
      let count = 0; let totalSize = 0;
      const tx     = db.transaction(storeName, "readonly");
      const store  = tx.objectStore(storeName);
      const cursor = store.openCursor();
      cursor.onsuccess = (e) => {
        const c = e.target.result;
        if (c) {
          count++;
          totalSize += (c.value.dataUrl?.length || 0);
          c.continue();
        } else {
          resolve({ count, totalSize });
        }
      };
      cursor.onerror = () => resolve({ count: 0, totalSize: 0 });
    });
  }

  const [photos, logos] = await Promise.all([
    scanStore(PHOTO_STORE),
    scanStore(LOGO_STORE),
  ]);

  const totalSize = photos.totalSize + logos.totalSize;

  return {
    photoCount:  photos.count,
    logoCount:   logos.count,
    count:       photos.count,   // backward compat
    estimatedMb: (totalSize / 1024 / 1024).toFixed(1),
    photosMb:    (photos.totalSize / 1024 / 1024).toFixed(1),
    logosMb:     (logos.totalSize  / 1024 / 1024).toFixed(1),
  };
}

// ════════════════════════════════════════════════════════════════
// MIGRATION
// ════════════════════════════════════════════════════════════════

/**
 * One-time migration:
 *   - Photos embedded in localStorage trip/game objects → IDB photos store
 *   - Logo dataUrls embedded in localStorage game objects → IDB logos store
 *
 * Safe to call on every app load — already-migrated entries are no-ops.
 */
export async function migratePhotosFromLocalStorage() {
  const TRIP_KEY  = "road_trip_memories_v1";
  const GAMES_KEY = "sports_games_v1";
  let migratedPhotos = 0;
  let migratedLogos  = 0;

  async function processPhotos(photos) {
    if (!photos?.length) return photos;
    const updated = [];
    for (const photo of photos) {
      if (photo.dataUrl && !photo._migratedToIDB) {
        await savePhoto(photo.id, photo.dataUrl);
        migratedPhotos++;
        updated.push({ ...photo, dataUrl: null, _migratedToIDB: true });
      } else {
        updated.push(photo);
      }
    }
    return updated;
  }

  async function processLogo(teamName, logoValue) {
    if (!logoValue || !teamName) return null;
    // Already stripped (null) — nothing to do
    if (logoValue === null) return null;
    // CDN URL — not embedded yet, leave as-is (TeamPicker will embed on next select)
    if (!logoValue.startsWith("data:")) return logoValue;
    // Base64 still in localStorage — move it
    await saveLogo(teamName, logoValue);
    migratedLogos++;
    return null; // strip from game object
  }

  // ── Trips ──────────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(TRIP_KEY);
    if (raw) {
      const trips   = JSON.parse(raw);
      let   changed = false;
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

  // ── Games (photos + logos) ─────────────────────────────────────
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (raw) {
      const games   = JSON.parse(raw);
      let   changed = false;
      const updated = await Promise.all(
        games.map(async game => {
          const gamePhotos  = await processPhotos(game.photos);
          const newHomeLogo = await processLogo(game.homeTeam,     game.homeTeamLogo);
          const newVisLogo  = await processLogo(game.visitingTeam, game.visitingTeamLogo);

          if (
            gamePhotos !== game.photos ||
            newHomeLogo !== game.homeTeamLogo ||
            newVisLogo  !== game.visitingTeamLogo
          ) changed = true;

          return {
            ...game,
            photos:           gamePhotos,
            homeTeamLogo:     newHomeLogo,
            visitingTeamLogo: newVisLogo,
          };
        })
      );
      if (changed) localStorage.setItem(GAMES_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn("[photoStorage] Games migration failed:", err.message);
  }

  if (migratedPhotos > 0 || migratedLogos > 0) {
    console.log(`[photoStorage] Migrated ${migratedPhotos} photos + ${migratedLogos} logos → IndexedDB`);
  } else {
    console.log("[photoStorage] Nothing needed migration");
  }

  return { migratedPhotos, migratedLogos };
}