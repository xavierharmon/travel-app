// src/hooks/useGoogleDriveBackup.js  (updated — replaces previous version)
//
// Added in this version:
//   - checkForNewerBackup()  — silently checks Drive on app load, returns
//     { hasNewer, driveDate, localDate } without touching any local data.
//   - autoBackup()           — backs up silently with no UI state changes,
//     called after every save when connected.
//
// Setup required (one-time, in Google Cloud Console):
//   1. Create a project → Enable "Google Drive API"
//   2. OAuth consent screen → External → add scope: .../auth/drive.appdata
//   3. Credentials → OAuth 2.0 Client ID → Web application
//      → Authorised JS origins: your app's URL (e.g. http://localhost:5173)
//   4. Copy the Client ID into VITE_GOOGLE_CLIENT_ID in your .env file

import { useState, useEffect, useCallback } from "react";

const CLIENT_ID     = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SCOPE         = "https://www.googleapis.com/auth/drive.appdata";
const BACKUP_FILE   = "adventures_backup.json";
const TOKEN_KEY     = "gdrive_token_v1";
const LAST_SYNC_KEY = "gdrive_last_sync_v1";

const BACKUP_KEYS = [
  "road_trip_memories_v1",
  "road_trip_routes_v1",
  "road_trip_mileage_v1",
  "sports_games_v1",
];

// ── Token helpers ────────────────────────────────────────────────
function loadToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (Date.now() - t.savedAt > 55 * 60 * 1000) return null;
    return t.access_token;
  } catch {
    return null;
  }
}

function saveToken(access_token) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token, savedAt: Date.now() }));
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Drive API helpers ────────────────────────────────────────────
async function findBackupFile(token) {
  const res  = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILE}'&fields=files(id,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.files?.[0] ?? null;
}

async function downloadBackup(token, fileId) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
}

async function uploadBackup(token, payload, existingId) {
  const metadata = {
    name:    BACKUP_FILE,
    parents: existingId ? undefined : ["appDataFolder"],
  };
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  const method = existingId ? "PATCH" : "POST";
  const url    = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

function collectLocalData() {
  const data = {};
  BACKUP_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try { data[key] = JSON.parse(val); } catch { /* skip */ }
    }
  });
  return data;
}

function applyBackupToLocalStorage(backupData) {
  Object.entries(backupData).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
}

// ── Hook ─────────────────────────────────────────────────────────
export function useGoogleDriveBackup() {
  const [status,      setStatus]      = useState("idle");
  const [error,       setError]       = useState(null);
  const [lastSync,    setLastSync]    = useState(() => localStorage.getItem(LAST_SYNC_KEY));
  const [userEmail,   setUserEmail]   = useState(() => localStorage.getItem("gdrive_email_v1"));
  const [tokenClient, setTokenClient] = useState(null);

  useEffect(() => {
    if (loadToken()) setStatus("connected");
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (window.google?.accounts?.oauth2) { initTokenClient(); return; }
    const script    = document.createElement("script");
    script.src      = "https://accounts.google.com/gsi/client";
    script.async    = true;
    script.defer    = true;
    script.onload   = initTokenClient;
    document.head.appendChild(script);
  }, []);

  function initTokenClient() {
    if (!window.google?.accounts?.oauth2 || !CLIENT_ID) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope:     SCOPE,
      callback:  handleTokenResponse,
    });
    setTokenClient(client);
  }

  function handleTokenResponse(response) {
    if (response.error) {
      setError("Google sign-in was cancelled or failed. Please try again.");
      setStatus("idle");
      return;
    }
    saveToken(response.access_token);
    fetchUserEmail(response.access_token);
    setStatus("connected");
    setError(null);
  }

  async function fetchUserEmail(token) {
    try {
      const res  = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.email) {
        setUserEmail(data.email);
        localStorage.setItem("gdrive_email_v1", data.email);
      }
    } catch { /* non-fatal */ }
  }

  // ── Connect ────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!CLIENT_ID) {
      setError("Google Client ID is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.");
      return;
    }
    if (!tokenClient) {
      setError("Google Identity Services not loaded yet. Please try again.");
      return;
    }
    setStatus("connecting");
    setError(null);
    tokenClient.requestAccessToken({ prompt: "consent" });
  }, [tokenClient]);

  // ── Disconnect ─────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    const token = loadToken();
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token);
    }
    clearToken();
    localStorage.removeItem("gdrive_email_v1");
    localStorage.removeItem(LAST_SYNC_KEY);
    setUserEmail(null);
    setLastSync(null);
    setStatus("idle");
    setError(null);
  }, []);

  // ── Manual backup (with UI feedback) ──────────────────────────
  const backupToDrive = useCallback(async () => {
    const token = loadToken();
    if (!token) { setStatus("idle"); return; }
    setStatus("syncing");
    setError(null);
    try {
      const existing = await findBackupFile(token);
      const payload  = { version: 1, exportedAt: new Date().toISOString(), data: collectLocalData() };
      await uploadBackup(token, payload, existing?.id);
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem(LAST_SYNC_KEY, now);
      setStatus("connected");
    } catch (err) {
      setError(`Backup failed: ${err.message}`);
      setStatus("connected");
    }
  }, []);

  // ── Silent auto-backup (no UI state change) ────────────────────
  // Called automatically after saves when connected.
  const autoBackup = useCallback(async () => {
    const token = loadToken();
    if (!token) return;
    try {
      const existing = await findBackupFile(token);
      const payload  = { version: 1, exportedAt: new Date().toISOString(), data: collectLocalData() };
      await uploadBackup(token, payload, existing?.id);
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem(LAST_SYNC_KEY, now);
      console.log("[autoBackup] silent backup complete ✓");
    } catch (err) {
      // Silent — don't surface errors for background backups
      console.warn("[autoBackup] silent backup failed:", err.message);
    }
  }, []);

  // ── Check for newer backup on Drive (non-destructive) ─────────
  // Returns { hasNewer: bool, driveDate: string|null, localDate: string|null }
  // Does NOT modify local data. Used by AutoSyncProvider on app load.
  const checkForNewerBackup = useCallback(async () => {
    const token = loadToken();
    if (!token) return { hasNewer: false, driveDate: null, localDate: null };

    try {
      const file = await findBackupFile(token);
      if (!file) return { hasNewer: false, driveDate: null, localDate: null };

      // Download just enough to compare dates — we need exportedAt from the file body
      const backup    = await downloadBackup(token, file.id);
      const driveDate = backup?.exportedAt ?? null;
      const localDate = localStorage.getItem(LAST_SYNC_KEY);

      if (!driveDate) return { hasNewer: false, driveDate: null, localDate };

      // Drive is newer if we've never synced locally, or if Drive's timestamp is later
      const hasNewer = !localDate || new Date(driveDate) > new Date(localDate);

      return { hasNewer, driveDate, localDate, backup };
    } catch (err) {
      console.warn("[checkForNewerBackup] check failed:", err.message);
      return { hasNewer: false, driveDate: null, localDate: null };
    }
  }, []);

  // ── Restore from Drive (with UI feedback) ─────────────────────
  const restoreFromDrive = useCallback(async (preloadedBackup = null) => {
    const token = loadToken();
    if (!token) { setStatus("idle"); return { success: false }; }
    setStatus("syncing");
    setError(null);
    try {
      let backup = preloadedBackup;
      if (!backup) {
        const file = await findBackupFile(token);
        if (!file) throw new Error("No backup found in your Google Drive.");
        backup = await downloadBackup(token, file.id);
      }
      if (!backup?.data) throw new Error("Backup file is empty or corrupted.");
      applyBackupToLocalStorage(backup.data);

      // Update last-sync to match the Drive backup's timestamp
      if (backup.exportedAt) {
        setLastSync(backup.exportedAt);
        localStorage.setItem(LAST_SYNC_KEY, backup.exportedAt);
      }

      setStatus("connected");
      return { success: true, exportedAt: backup.exportedAt };
    } catch (err) {
      setError(`Restore failed: ${err.message}`);
      setStatus("connected");
      return { success: false };
    }
  }, []);

  return {
    status,
    error,
    lastSync,
    userEmail,
    isConnected:  status === "connected" || status === "syncing",
    isSyncing:    status === "syncing",
    connect,
    disconnect,
    backupToDrive,
    autoBackup,
    checkForNewerBackup,
    restoreFromDrive,
  };
}