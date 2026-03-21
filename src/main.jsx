// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { TripsProvider } from "./context/TripsContext";
import { GamesProvider } from "./context/GamesContext";
import { migratePhotosFromLocalStorage } from "./utils/photoStorage";
import "./styles/global.css";

// ── Request persistent storage so IndexedDB isn't evicted ────────
// This is a one-time permission that the browser remembers.
// On most desktop browsers it's granted automatically for installed
// PWAs or sites the user engages with regularly.
if (navigator.storage?.persist) {
  navigator.storage.persist().then(granted => {
    console.log(`[storage] Persistent storage: ${granted ? "granted ✓" : "not granted"}`);
  });
}

// ── Migrate any photos still sitting in localStorage → IndexedDB ─
// Runs silently on every load. Already-migrated photos are no-ops.
migratePhotosFromLocalStorage().then(({ migrated }) => {
  if (migrated > 0) {
    // Notify AutoSyncProvider so Drive backup captures the migrated photos
    window.dispatchEvent(new CustomEvent("app:datasaved"));
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TripsProvider>
      <GamesProvider>
        <App />
      </GamesProvider>
    </TripsProvider>
  </React.StrictMode>
);