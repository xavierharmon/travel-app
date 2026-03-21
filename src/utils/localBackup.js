// src/utils/localBackup.js
//
// Updated to include IndexedDB photos in exports and restore them on import.
// The backup file format is unchanged except for an added "photos" key:
//
//   {
//     version:    2,
//     exportedAt: "...",
//     appName:    "...",
//     data: {
//       road_trip_memories_v1: [...],   // metadata only, no dataUrls
//       sports_games_v1:       [...],
//       ...
//     },
//     photos: {                          // NEW — from IndexedDB
//       "photo_abc123": "data:image/jpeg;base64,...",
//       ...
//     }
//   }
//
// Version 1 backups (with dataUrls embedded in data) are still importable
// — the import function detects them and routes photos correctly.

import { exportAllPhotos, importAllPhotos } from "@/utils/photoStorage";

const BACKUP_KEYS = [
  "road_trip_memories_v1",
  "road_trip_routes_v1",
  "road_trip_mileage_v1",
  "sports_games_v1",
];

// ── Export ───────────────────────────────────────────────────────
export async function exportToFile() {
  // Collect localStorage metadata
  const data = {};
  BACKUP_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try { data[key] = JSON.parse(val); } catch { /* skip */ }
    }
  });

  // Collect ALL photos from IndexedDB
  const photos = await exportAllPhotos();

  const payload = JSON.stringify({
    version:    2,
    exportedAt: new Date().toISOString(),
    appName:    "Xavier & Kylie's Adventures",
    data,
    photos,     // { [photoId]: dataUrl }
  }, null, 2);

  const blob = new Blob([payload], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `adventures-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import ───────────────────────────────────────────────────────
export function importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader   = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload  = async (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup?.data) throw new Error("This doesn't look like a valid backup file.");

        // ── Restore localStorage keys ──────────────────────────
        let restored = 0;
        Object.entries(backup.data).forEach(([key, value]) => {
          if (BACKUP_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(value));
            restored++;
          }
        });

        // ── Restore photos ─────────────────────────────────────
        if (backup.photos && typeof backup.photos === "object") {
          // Version 2: photos are in the top-level "photos" key
          await importAllPhotos(backup.photos);
        } else if (backup.version === 1 || !backup.version) {
          // Version 1: dataUrls were embedded inside trip/game objects
          // Extract and migrate them into IndexedDB
          await _extractAndImportLegacyPhotos(backup.data);
        }

        resolve({ success: true, exportedAt: backup.exportedAt, restored });
      } catch (err) {
        reject(new Error(err.message || "Invalid backup file."));
      }
    };
    reader.readAsText(file);
  });
}

// ── Legacy v1 photo extractor ────────────────────────────────────
// Walks the old data format, pulls out any dataUrl fields,
// saves them to IndexedDB, and strips them from the stored objects.
async function _extractAndImportLegacyPhotos(data) {
  const photosToImport = {};

  function extractFromArray(items) {
    return (items || []).map(item => {
      const updated = { ...item };
      if (item.photos) {
        updated.photos = (item.photos || []).map(photo => {
          if (photo.dataUrl) {
            photosToImport[photo.id] = photo.dataUrl;
            return { ...photo, dataUrl: null, _migratedToIDB: true };
          }
          return photo;
        });
      }
      return updated;
    });
  }

  // Extract from trips (including stop photos)
  if (data["road_trip_memories_v1"]) {
    const trips = extractFromArray(data["road_trip_memories_v1"]).map(trip => ({
      ...trip,
      stops: extractFromArray(trip.stops || []),
    }));
    localStorage.setItem("road_trip_memories_v1", JSON.stringify(trips));
  }

  // Extract from games
  if (data["sports_games_v1"]) {
    const games = extractFromArray(data["sports_games_v1"]);
    localStorage.setItem("sports_games_v1", JSON.stringify(games));
  }

  if (Object.keys(photosToImport).length > 0) {
    await importAllPhotos(photosToImport);
    console.log(`[localBackup] Imported ${Object.keys(photosToImport).length} legacy photos into IndexedDB`);
  }
}

// ── Summary (unchanged) ──────────────────────────────────────────
export function getBackupSummary() {
  let trips  = 0;
  let games  = 0;
  let photos = 0;

  try {
    const tripsRaw = localStorage.getItem("road_trip_memories_v1");
    if (tripsRaw) {
      const arr = JSON.parse(tripsRaw);
      trips  = arr.length;
      photos = arr.reduce((sum, t) => {
        const tripPhotos = (t.photos || []).length;
        const stopPhotos = (t.stops || []).reduce((s, stop) => s + (stop.photos || []).length, 0);
        return sum + tripPhotos + stopPhotos;
      }, 0);
    }
  } catch { /* ignore */ }

  try {
    const gamesRaw = localStorage.getItem("sports_games_v1");
    if (gamesRaw) {
      const arr = JSON.parse(gamesRaw);
      games   = arr.length;
      photos += arr.reduce((sum, g) => sum + (g.photos || []).length, 0);
    }
  } catch { /* ignore */ }

  const totalBytes = BACKUP_KEYS.reduce((sum, key) => {
    return sum + (localStorage.getItem(key) || "").length;
  }, 0);

  return {
    trips,
    games,
    photos,
    sizeMb: (totalBytes / 1024 / 1024).toFixed(2),
  };
}