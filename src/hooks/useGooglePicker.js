// src/hooks/useGooglePicker.js
//
// Google Picker API integration for importing photos from Google Photos
// (and Google Drive). Uses only non-sensitive scopes so no app
// verification is required.
//
// Scopes used:
//   https://www.googleapis.com/auth/drive.appdata     ← Drive backup (existing)
//   https://www.googleapis.com/auth/drive.readonly    ← Picker file access (NOT sensitive)
//
// How it works:
//   1. User clicks "Import from Google Photos"
//   2. We get an OAuth access token with drive.readonly scope
//   3. We load the Google Picker API script
//   4. We open a Google-hosted Picker UI showing the user's Photos
//   5. User selects photos — we get back file metadata + download URLs
//   6. We download, compress, save to IndexedDB — identical to local upload
//
// One-time Google Cloud Console setup:
//   1. APIs & Services → Library → search "Google Picker API" → Enable
//   2. That's it. No new scopes on the consent screen needed beyond
//      drive.readonly which is already non-sensitive.
//   3. Make sure your API key (VITE_GOOGLE_MAPS_API_KEY) has the
//      Picker API enabled, OR create a separate unrestricted key
//      and set VITE_GOOGLE_PICKER_API_KEY in your .env

import { useState, useEffect, useCallback, useRef } from "react";

const CLIENT_ID  = import.meta.env.VITE_GOOGLE_CLIENT_ID      || "";
const API_KEY    = import.meta.env.VITE_GOOGLE_PICKER_API_KEY
               || import.meta.env.VITE_GOOGLE_MAPS_API_KEY    || "";
const TOKEN_KEY  = "gdrive_token_v1"; // shared with Drive backup hook

// Combined scope — Drive backup + Picker file access
export const COMBINED_SCOPE = [
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/drive.readonly",
].join(" ");

// ── Token helpers ────────────────────────────────────────────────
function loadToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    // Tokens expire after 55 minutes (Google issues 60-min tokens)
    if (Date.now() - t.savedAt > 55 * 60 * 1000) return null;
    return t.access_token;
  } catch { return null; }
}

export function saveToken(access_token) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    access_token,
    savedAt: Date.now(),
  }));
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Load Google API scripts ──────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script  = document.createElement("script");
    script.src    = src;
    script.async  = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

function loadGapi() {
  return loadScript("https://apis.google.com/js/api.js").then(() =>
    new Promise((resolve, reject) => {
      window.gapi.load("picker", { callback: resolve, onerror: reject });
    })
  );
}

function loadGis() {
  return loadScript("https://accounts.google.com/gsi/client");
}

// ── Download and compress a Google Drive file ────────────────────
export async function downloadAndCompressPickerPhoto(url, token) {
  // Drive download URL — requires auth header
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const img    = new Image();
    const objUrl = URL.createObjectURL(blob);

    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error("Image load failed"));
    };

    img.onload = () => {
      try {
        const MAX    = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else                { width  = Math.round((width  * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        URL.revokeObjectURL(objUrl);
        compressed && compressed !== "data:,"
          ? resolve(compressed)
          : reject(new Error("Compression failed"));
      } catch (err) {
        URL.revokeObjectURL(objUrl);
        reject(err);
      }
    };

    img.src = objUrl;
  });
}

// ── Hook ─────────────────────────────────────────────────────────
export function useGooglePicker() {
  const [isReady,      setIsReady]      = useState(false);
  const [isConnected,  setIsConnected]  = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState(null);
  const tokenClientRef                  = useRef(null);
  const pendingPickerRef                = useRef(null); // callback waiting for token

  // Load both Google scripts on mount
  useEffect(() => {
    Promise.all([loadGapi(), loadGis()])
      .then(() => {
        setIsReady(true);
        // Check if we already have a valid token
        if (loadToken()) setIsConnected(true);
        // Init token client
        if (window.google?.accounts?.oauth2 && CLIENT_ID) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope:     COMBINED_SCOPE,
            callback:  handleTokenResponse,
          });
        }
      })
      .catch(err => setError(`Failed to load Google APIs: ${err.message}`));
  }, []);

  function handleTokenResponse(response) {
    setIsConnecting(false);
    if (response.error) {
      setError("Sign-in cancelled or failed. Please try again.");
      pendingPickerRef.current = null;
      return;
    }
    saveToken(response.access_token);
    setIsConnected(true);
    setError(null);

    // If a picker was waiting for a token, open it now
    if (pendingPickerRef.current) {
      pendingPickerRef.current(response.access_token);
      pendingPickerRef.current = null;
    }
  }

  // Get a valid token, requesting one if needed
  const getValidToken = useCallback(() => {
    return new Promise((resolve, reject) => {
      const existing = loadToken();
      if (existing) { resolve(existing); return; }

      if (!tokenClientRef.current) {
        reject(new Error("Google Identity Services not loaded yet."));
        return;
      }

      // Store callback — will be called in handleTokenResponse
      pendingPickerRef.current = resolve;
      setIsConnecting(true);
      setError(null);
      tokenClientRef.current.requestAccessToken({ prompt: "" });
    });
  }, []);

  /**
   * Open the Google Picker and return selected files.
   * Resolves with an array of { id, name, url, mimeType }
   * or resolves with [] if the user cancels.
   */
  const openPicker = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      if (!isReady) { reject(new Error("Google APIs not loaded yet.")); return; }
      if (!API_KEY)  { reject(new Error("No Google API key configured. Set VITE_GOOGLE_PICKER_API_KEY in .env")); return; }

      try {
        const token = await getValidToken();

        const picker = new window.google.picker.PickerBuilder()
          // Google Photos view
          .addView(
            new window.google.picker.PhotosView()
              .setType(window.google.picker.PhotosView.Type.PHOTO_ALBUMS)
          )
          // Also add a "recent photos" view for quick access
          .addView(
            new window.google.picker.PhotosView()
          )
          // Allow multi-select
          .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
          // Limit to images only
          .addView(
            new window.google.picker.DocsView()
              .setIncludeFolders(false)
              .setMimeTypes("image/jpeg,image/png,image/webp,image/heic,image/gif")
          )
          .setOAuthToken(token)
          .setDeveloperKey(API_KEY)
          .setTitle("Select photos to import")
          .setCallback((data) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const files = data.docs.map(doc => ({
                id:       doc.id,
                name:     doc.name,
                // Drive download URL — needs auth header
                url:      `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                mimeType: doc.mimeType,
              }));
              resolve(files);
            } else if (data.action === window.google.picker.Action.CANCEL) {
              resolve([]); // User cancelled — not an error
            }
          })
          .build();

        picker.setVisible(true);
      } catch (err) {
        reject(err);
      }
    });
  }, [isReady, getValidToken]);

  const connect = useCallback(() => {
    if (!tokenClientRef.current) {
      setError("Google Identity Services not loaded yet.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  }, []);

  return {
    isReady,
    isConnected,
    isConnecting,
    error,
    connect,
    openPicker,
    getValidToken,
  };
}