// src/components/AutoSyncProvider/AutoSyncProvider.jsx
//
// Drop this anywhere inside your component tree (just inside App is ideal).
// It does three things automatically:
//
//  1. ON APP LOAD — if the user is connected to Drive, silently checks whether
//     Drive has a newer backup than local data. If it does, shows a toast
//     asking the user if they want to restore. Non-destructive — does nothing
//     without user confirmation.
//
//  2. ON RESTORE — restores data from Drive, then reloads the page so all
//     React context re-initializes from the freshly written localStorage.
//
//  3. AUTO-BACKUP AFTER SAVES — listens for a custom "app:datasaved" event
//     that you dispatch after any write, then silently pushes to Drive in the
//     background. Shows a brief "Backed up" toast on success.
//
// Dispatching the save event from your context:
//   window.dispatchEvent(new CustomEvent("app:datasaved"));
//
// Usage in App.jsx:
//   import AutoSyncProvider from "@/components/AutoSyncProvider";
//   ...
//   return (
//     <>
//       <AutoSyncProvider />
//       {/* rest of your app */}
//     </>
//   );

import { useEffect, useState, useCallback, useRef } from "react";
import { useGoogleDriveBackup } from "@/hooks/useGoogleDriveBackup";
import SyncToast from "@/components/SyncToast";

// Minimum gap between auto-backups to avoid hammering Drive on rapid saves
const AUTO_BACKUP_THROTTLE_MS = 30_000; // 30 seconds

export default function AutoSyncProvider() {
  const {
    isConnected,
    checkForNewerBackup,
    restoreFromDrive,
    autoBackup,
  } = useGoogleDriveBackup();

  const [toast,       setToast]       = useState(null); // null | { type, driveDate?, message?, backup? }
  const [isRestoring, setIsRestoring] = useState(false);
  const lastAutoBackupRef             = useRef(0);
  const checkRanRef                   = useRef(false);

  // ── 1. On-load Drive check ───────────────────────────────────
  useEffect(() => {
    if (!isConnected || checkRanRef.current) return;
    checkRanRef.current = true;

    // Small delay so the app finishes rendering before we hit the network
    const timer = setTimeout(async () => {
      try {
        const result = await checkForNewerBackup();
        if (result.hasNewer) {
          setToast({
            type:      "newer",
            driveDate: result.driveDate,
            backup:    result.backup,
          });
        }
      } catch (err) {
        console.warn("[AutoSyncProvider] on-load check failed:", err.message);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isConnected, checkForNewerBackup]);

  // ── 2. Restore handler ───────────────────────────────────────
  const handleRestore = useCallback(async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    setToast(null);

    try {
      // Pass the already-downloaded backup to avoid re-fetching
      const preloaded = toast?.backup ?? null;
      const result    = await restoreFromDrive(preloaded);

      if (result.success) {
        setToast({ type: "restored" });
        // Give the user 2 seconds to read the toast, then reload
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setToast({ type: "error", message: "Restore failed. Try again from Backup settings." });
      }
    } catch {
      setToast({ type: "error", message: "Restore failed. Try again from Backup settings." });
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, toast, restoreFromDrive]);

  // ── 3. Auto-backup after saves ───────────────────────────────
  useEffect(() => {
    if (!isConnected) return;

    async function handleDataSaved() {
      const now = Date.now();
      if (now - lastAutoBackupRef.current < AUTO_BACKUP_THROTTLE_MS) return;
      lastAutoBackupRef.current = now;

      await autoBackup();

      // Show a brief "backed up" toast that auto-dismisses after 3s
      setToast({ type: "backed_up" });
      setTimeout(() => setToast(prev => prev?.type === "backed_up" ? null : prev), 3000);
    }

    window.addEventListener("app:datasaved", handleDataSaved);
    return () => window.removeEventListener("app:datasaved", handleDataSaved);
  }, [isConnected, autoBackup]);

  // ── Render toast ─────────────────────────────────────────────
  if (!toast) return null;

  return (
    <SyncToast
      type={toast.type}
      driveDate={toast.driveDate}
      message={toast.message}
      onRestore={handleRestore}
      onDismiss={() => setToast(null)}
    />
  );
}