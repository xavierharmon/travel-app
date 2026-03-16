// src/utils/localBackup.js
// Handles manual JSON export and import of all app data.

const BACKUP_KEYS = [
  "road_trip_memories_v1",
  "road_trip_routes_v1",
  "road_trip_mileage_v1",
  "sports_games_v1",
];

export function exportToFile() {
  const data = {};
  BACKUP_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try { data[key] = JSON.parse(val); } catch { /* skip corrupt keys */ }
    }
  });

  const payload = JSON.stringify({
    version:    1,
    exportedAt: new Date().toISOString(),
    appName:    "Xavier & Kylie's Adventures",
    data,
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
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload  = (e) => {
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

        resolve({ success: true, exportedAt: backup.exportedAt, restored });
      } catch (err) {
        reject(new Error(err.message || "Invalid backup file."));
      }
    };
    reader.readAsText(file);
  });
}

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