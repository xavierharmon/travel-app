// src/hooks/useGoogleDriveBackup.js
//
// Updated to include IndexedDB photos in Drive backups.
//
// IMPORTANT — Drive file size:
//   Photos are base64 strings. Hundreds of photos can easily be
//   10-50MB. Google Drive's multipart upload supports up to 5MB
//   before requiring a resumable upload. This implementation
//   automatically uses a resumable upload when the payload exceeds
//   4MB, keeping it reliable at any scale.
//
// Backup file structure (version 2):
//   {
//     version:    2,
//     exportedAt: "...",
//     data:       { ...localStorage keys... },
//     photos:     { [photoId]: dataUrl, ... }   ← from IndexedDB
//   }

import { useState, useEffect, useCallback } from "react";
import { exportAllPhotos, importAllPhotos } from "@/utils/photoStorage";

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
  } catch { return null; }
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

// ── Smart upload: multipart for small payloads, resumable for large ──
const MULTIPART_THRESHOLD = 4 * 1024 * 1024; // 4 MB

async function uploadBackup(token, payload, existingId) {
  const jsonString = JSON.stringify(payload);
  const byteSize   = new Blob([jsonString]).size;

  if (byteSize <= MULTIPART_THRESHOLD) {
    return _multipartUpload(token, jsonString, existingId);
  } else {
    console.log(`[DriveBackup] Payload is ${(byteSize / 1024 / 1024).toFixed(1)}MB — using resumable upload`);
    return _resumableUpload(token, jsonString, existingId);
  }
}

async function _multipartUpload(token, jsonString, existingId) {
  const metadata = {
    name:    BACKUP_FILE,
    parents: existingId ? undefined : ["appDataFolder"],
  };
  const blob = new Blob([jsonString], { type: "application/json" });
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
  if (!res.ok) throw new Error(`Multipart upload failed: ${res.status}`);
  return res.json();
}

async function _resumableUpload(token, jsonString, existingId) {
  const metadata = {
    name:    BACKUP_FILE,
    parents: existingId ? undefined : ["appDataFolder"],
  };

  const method  = existingId ? "PATCH" : "POST";
  const initUrl = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=resumable`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`;

  // Step 1: initiate — get upload URL
  const initRes = await fetch(initUrl, {
    method,
    headers: {
      Authorization:   `Bearer ${token}`,
      "Content-Type":  "application/json",
      "X-Upload-Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!initRes.ok) throw new Error(`Resumable init failed: ${initRes.status}`);

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("No upload URL returned from Drive");

  // Step 2: upload the full payload
  const uploadRes = await fetch(uploadUrl, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    jsonString,
  });

  if (!uploadRes.ok) throw new Error(`Resumable upload failed: ${uploadRes.status}`);
  return uploadRes.json();
}

// ── Collect all data for backup ──────────────────────────────────
async function collectAllData() {
  // Metadata from localStorage
  const data = {};
  BACKUP_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try { data[key] = JSON.parse(val); } catch { /* skip */ }
    }
  });

  // Photos from IndexedDB
  const photos = await exportAllPhotos();

  return { data, photos };
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
      const existing       = await findBackupFile(token);
      const { data, photos } = await collectAllData();
      const payload        = {
        version:    2,
        exportedAt: new Date().toISOString(),
        data,
        photos,
      };
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

  // ── Silent auto-backup ─────────────────────────────────────────
  const autoBackup = useCallback(async () => {
    const token = loadToken();
    if (!token) return;
    try {
      const existing       = await findBackupFile(token);
      const { data, photos } = await collectAllData();
      const payload        = {
        version:    2,
        exportedAt: new Date().toISOString(),
        data,
        photos,
      };
      await uploadBackup(token, payload, existing?.id);
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem(LAST_SYNC_KEY, now);
      console.log("[autoBackup] silent backup complete ✓");
    } catch (err) {
      console.warn("[autoBackup] silent backup failed:", err.message);
    }
  }, []);

  // ── Check for newer backup (non-destructive) ───────────────────
  const checkForNewerBackup = useCallback(async () => {
    const token = loadToken();
    if (!token) return { hasNewer: false, driveDate: null, localDate: null };
    try {
      const file = await findBackupFile(token);
      if (!file) return { hasNewer: false, driveDate: null, localDate: null };

      const backup    = await downloadBackup(token, file.id);
      const driveDate = backup?.exportedAt ?? null;
      const localDate = localStorage.getItem(LAST_SYNC_KEY);

      if (!driveDate) return { hasNewer: false, driveDate: null, localDate };

      const hasNewer = !localDate || new Date(driveDate) > new Date(localDate);
      return { hasNewer, driveDate, localDate, backup };
    } catch (err) {
      console.warn("[checkForNewerBackup] check failed:", err.message);
      return { hasNewer: false, driveDate: null, localDate: null };
    }
  }, []);

  // ── Restore from Drive ─────────────────────────────────────────
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

      // Restore metadata to localStorage
      applyBackupToLocalStorage(backup.data);

      // Restore photos to IndexedDB
      if (backup.photos && typeof backup.photos === "object") {
        await importAllPhotos(backup.photos);
        console.log(`[restoreFromDrive] Restored ${Object.keys(backup.photos).length} photos to IndexedDB`);
      }

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