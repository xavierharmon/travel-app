// src/utils/localBackup.js
//
// Backup format version 2:
//   {
//     version:    2,
//     exportedAt: "...",
//     data:       { ...localStorage keys (metadata only)... },
//     photos:     { [photoId]: dataUrl },   ← from IDB photos store
//     logos:      { [logoId]:  dataUrl },   ← from IDB logos store
//   }

import {
  exportAllPhotos, importAllPhotos,
  exportAllLogos,  importAllLogos,
} from "@/utils/photoStorage";

const BACKUP_KEYS = [
  "road_trip_memories_v1",
  "road_trip_routes_v1",
  "road_trip_mileage_v1",
  "sports_games_v1",
];

export async function exportToFile() {
  const data = {};
  BACKUP_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) { try { data[key] = JSON.parse(val); } catch { /* skip */ } }
  });

  const [photos, logos] = await Promise.all([
    exportAllPhotos(),
    exportAllLogos(),
  ]);

  const payload = JSON.stringify({
    version:    2,
    exportedAt: new Date().toISOString(),
    appName:    "Xavier & Kylie's Adventures",
    data,
    photos,
    logos,
  }, null, 2);

  const blob = new Blob([payload], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `adventures-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader   = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload  = async (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup?.data) throw new Error("This doesn't look like a valid backup file.");

        let restored = 0;
        Object.entries(backup.data).forEach(([key, value]) => {
          if (BACKUP_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(value));
            restored++;
          }
        });

        // Restore photos and logos to IDB in parallel
        await Promise.all([
          backup.photos ? importAllPhotos(backup.photos) : Promise.resolve(),
          backup.logos  ? importAllLogos(backup.logos)   : Promise.resolve(),
        ]);

        // Legacy v1: extract embedded dataUrls from the data objects
        if (!backup.photos && !backup.logos) {
          await _extractLegacyData(backup.data);
        }

        resolve({ success: true, exportedAt: backup.exportedAt, restored });
      } catch (err) {
        reject(new Error(err.message || "Invalid backup file."));
      }
    };
    reader.readAsText(file);
  });
}

// ── Legacy v1 extractor ──────────────────────────────────────────
async function _extractLegacyData(data) {
  const { importAllPhotos, importAllLogos, saveLogo } = await import("@/utils/photoStorage");
  const photosToImport = {};

  function extractPhotos(items) {
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

  if (data["road_trip_memories_v1"]) {
    const trips = extractPhotos(data["road_trip_memories_v1"]).map(t => ({
      ...t, stops: extractPhotos(t.stops || []),
    }));
    localStorage.setItem("road_trip_memories_v1", JSON.stringify(trips));
  }

  const logosToImport = {};
  if (data["sports_games_v1"]) {
    const games = extractPhotos(data["sports_games_v1"]).map(game => {
      const updated = { ...game };
      if (game.homeTeamLogo?.startsWith("data:")) {
        logosToImport[`logo_${game.homeTeam}`] = game.homeTeamLogo;
        updated.homeTeamLogo = null;
      }
      if (game.visitingTeamLogo?.startsWith("data:")) {
        logosToImport[`logo_${game.visitingTeam}`] = game.visitingTeamLogo;
        updated.visitingTeamLogo = null;
      }
      return updated;
    });
    localStorage.setItem("sports_games_v1", JSON.stringify(games));
  }

  await Promise.all([
    Object.keys(photosToImport).length > 0 ? importAllPhotos(photosToImport) : Promise.resolve(),
    Object.keys(logosToImport).length  > 0 ? importAllLogos(logosToImport)   : Promise.resolve(),
  ]);
}

export function getBackupSummary() {
  let trips = 0, games = 0, photos = 0;

  try {
    const arr = JSON.parse(localStorage.getItem("road_trip_memories_v1") || "[]");
    trips  = arr.length;
    photos = arr.reduce((sum, t) => {
      return sum + (t.photos || []).length +
        (t.stops || []).reduce((s, stop) => s + (stop.photos || []).length, 0);
    }, 0);
  } catch { /* ignore */ }

  try {
    const arr = JSON.parse(localStorage.getItem("sports_games_v1") || "[]");
    games   = arr.length;
    photos += arr.reduce((sum, g) => sum + (g.photos || []).length, 0);
  } catch { /* ignore */ }

  const totalBytes = BACKUP_KEYS.reduce((sum, key) =>
    sum + (localStorage.getItem(key) || "").length, 0);

  return { trips, games, photos, sizeMb: (totalBytes / 1024 / 1024).toFixed(2) };
}