// src/utils/migrateLogoEmbeds.js
//
// One-time migration that runs on app load.
// Finds any saved games with ESPN CDN URL logos and converts them
// to base64 so they are stored locally — identical to what happens
// when a team is newly selected from the picker.
//
// Safe to run every time: already-embedded logos (data: URLs) are
// skipped instantly. Once all logos are embedded it becomes a no-op.

const GAMES_KEY   = "sports_games_v1";
const ESPN_ORIGIN = "a.espncdn.com";

function isCdnUrl(str) {
  return typeof str === "string" && str.startsWith("http") && str.includes(ESPN_ORIGIN);
}

async function fetchAsBase64(url) {
  try {
    const res  = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader   = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url; // offline or fetch failed — leave as URL for now
  }
}

export async function migrateLogoEmbeds() {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return; // no games saved yet

    const games = JSON.parse(raw);
    let changed = false;

    const migrated = await Promise.all(
      games.map(async game => {
        let updated = { ...game };

        if (isCdnUrl(game.homeTeamLogo)) {
          const embedded = await fetchAsBase64(game.homeTeamLogo);
          if (embedded !== game.homeTeamLogo) {
            updated.homeTeamLogo = embedded;
            changed = true;
          }
        }

        if (isCdnUrl(game.visitingTeamLogo)) {
          const embedded = await fetchAsBase64(game.visitingTeamLogo);
          if (embedded !== game.visitingTeamLogo) {
            updated.visitingTeamLogo = embedded;
            changed = true;
          }
        }

        return updated;
      })
    );

    if (changed) {
      localStorage.setItem(GAMES_KEY, JSON.stringify(migrated));
      console.log("[migrateLogoEmbeds] Logo migration complete — resaved games with embedded logos.");
      // Notify auto-sync that data changed so Drive backup stays current
      window.dispatchEvent(new CustomEvent("app:datasaved"));
    } else {
      console.log("[migrateLogoEmbeds] No CDN logos found — nothing to migrate.");
    }
  } catch (err) {
    console.warn("[migrateLogoEmbeds] Migration failed:", err.message);
  }
}