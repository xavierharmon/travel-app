// src/components/BackupSettingsModal/BackupSettingsModal.jsx
//
// A self-contained modal that manages all backup options:
//  - Google Drive connection / management
//  - Manual JSON export / import
//
// Usage:
//   <BackupSettingsModal onClose={() => setShowBackup(false)} />

import { useState, useRef } from "react";
import styles from "./BackupSettingsModal.module.css";
import { useGoogleDriveBackup } from "@/hooks/useGoogleDriveBackup";
import { exportToFile, importFromFile, getBackupSummary } from "@/utils/localBackup";

// ── Small helper: formatted date ─────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "Never";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Status dot ───────────────────────────────────────────────────
function StatusDot({ status }) {
  const colors = {
    connected: styles.dotGreen,
    syncing:   styles.dotAmber,
    error:     styles.dotRed,
    idle:      styles.dotGray,
    connecting: styles.dotAmber,
  };
  return <span className={`${styles.dot} ${colors[status] || styles.dotGray}`} />;
}

// ── Google Drive panel ───────────────────────────────────────────
function GoogleDrivePanel({ onRestored }) {
  const {
    status, error, lastSync, userEmail,
    isConnected, isSyncing,
    connect, disconnect, backupToDrive, restoreFromDrive,
  } = useGoogleDriveBackup();

  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [restoreResult,  setRestoreResult]  = useState(null);
  const [backupDone,     setBackupDone]     = useState(false);

  async function handleBackup() {
    setBackupDone(false);
    await backupToDrive();
    setBackupDone(true);
    setTimeout(() => setBackupDone(false), 3000);
  }

  async function handleRestore() {
    setRestoreConfirm(false);
    const result = await restoreFromDrive();
    if (result?.success) {
      setRestoreResult(result);
      onRestored?.();
    }
  }

  const noClientId = !import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // ── Not connected state ──────────────────────────────────────
  if (!isConnected) {
    return (
      <div className={styles.drivePanel}>
        <div className={styles.driveLogo}>
          <GoogleDriveLogo />
        </div>

        <h3 className={styles.driveTitle}>Connect Google Drive</h3>
        <p className={styles.driveDesc}>
          Automatically back up all your trips and games to a private folder in
          your Google Drive. Only this app can see the backup — it won't appear
          in your regular Drive files.
        </p>

        <div className={styles.permissionBox}>
          <p className={styles.permissionTitle}>What this app will access:</p>
          <ul className={styles.permissionList}>
            <li>✓ A hidden app-only folder in your Drive</li>
            <li>✓ One backup file named <code>adventures_backup.json</code></li>
          </ul>
          <p className={styles.permissionTitle} style={{ marginTop: 8 }}>What this app will NOT access:</p>
          <ul className={styles.permissionList}>
            <li>✗ Your existing Drive files or folders</li>
            <li>✗ Gmail, Photos, or any other Google service</li>
          </ul>
        </div>

        {noClientId && (
          <div className={styles.warningBox}>
            <strong>Developer note:</strong> Add <code>VITE_GOOGLE_CLIENT_ID=your_id</code> to
            your <code>.env</code> file to enable Google Drive sync.
          </div>
        )}

        {error && <p className={styles.errorMsg}>{error}</p>}

        <button
          className={styles.googleBtn}
          onClick={connect}
          disabled={status === "connecting" || noClientId}
        >
          <GoogleLogo />
          {status === "connecting" ? "Connecting…" : "Sign in with Google"}
        </button>
      </div>
    );
  }

  // ── Connected state ──────────────────────────────────────────
  if (restoreResult) {
    return (
      <div className={styles.drivePanel}>
        <div className={styles.successCard}>
          <span className={styles.successIcon}>✓</span>
          <h3 className={styles.successTitle}>Restore complete!</h3>
          <p className={styles.successDesc}>
            Your data has been restored from the backup saved on{" "}
            <strong>{fmtDate(restoreResult.exportedAt)}</strong>.
            Refresh the page to see your restored trips and games.
          </p>
          <button className={styles.refreshBtn} onClick={() => window.location.reload()}>
            Refresh now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.drivePanel}>
      <div className={styles.connectedHeader}>
        <div className={styles.connectedLeft}>
          <StatusDot status={isSyncing ? "syncing" : "connected"} />
          <div>
            <p className={styles.connectedLabel}>Connected</p>
            {userEmail && <p className={styles.connectedEmail}>{userEmail}</p>}
          </div>
        </div>
        <button className={styles.disconnectBtn} onClick={disconnect}>
          Disconnect
        </button>
      </div>

      <div className={styles.syncRow}>
        <span className={styles.syncLabel}>Last backup</span>
        <span className={styles.syncValue}>{fmtDate(lastSync)}</span>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.actionRow}>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={handleBackup}
          disabled={isSyncing}
        >
          {isSyncing ? "Backing up…" : backupDone ? "✓ Backed up!" : "Back up now"}
        </button>

        {!restoreConfirm ? (
          <button
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={() => setRestoreConfirm(true)}
            disabled={isSyncing}
          >
            Restore from Drive
          </button>
        ) : (
          <div className={styles.confirmBox}>
            <p className={styles.confirmMsg}>
              This will overwrite your current data with the Drive backup. Continue?
            </p>
            <div className={styles.confirmBtns}>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={handleRestore}
                disabled={isSyncing}
              >
                {isSyncing ? "Restoring…" : "Yes, restore"}
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                onClick={() => setRestoreConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <p className={styles.autoSyncNote}>
        💡 Tip: Back up after adding new trips or games to keep Drive in sync.
      </p>
    </div>
  );
}

// ── Local backup panel ───────────────────────────────────────────
function LocalBackupPanel() {
  const fileInputRef = useRef(null);
  const [importing,     setImporting]     = useState(false);
  const [importResult,  setImportResult]  = useState(null);
  const [importError,   setImportError]   = useState(null);
  const [exportDone,    setExportDone]    = useState(false);

  const summary = getBackupSummary();

  function handleExport() {
    exportToFile();
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const result = await importFromFile(file);
      setImportResult(result);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  if (importResult?.success) {
    return (
      <div className={styles.successCard}>
        <span className={styles.successIcon}>✓</span>
        <h3 className={styles.successTitle}>Import complete!</h3>
        <p className={styles.successDesc}>
          Data restored from backup saved on{" "}
          <strong>{fmtDate(importResult.exportedAt)}</strong>.
          Refresh the page to see your restored data.
        </p>
        <button className={styles.refreshBtn} onClick={() => window.location.reload()}>
          Refresh now
        </button>
      </div>
    );
  }

  return (
    <div className={styles.localPanel}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryChip}>
          <span className={styles.summaryNum}>{summary.trips}</span>
          <span className={styles.summaryLbl}>trips</span>
        </div>
        <div className={styles.summaryChip}>
          <span className={styles.summaryNum}>{summary.games}</span>
          <span className={styles.summaryLbl}>games</span>
        </div>
        <div className={styles.summaryChip}>
          <span className={styles.summaryNum}>{summary.photos}</span>
          <span className={styles.summaryLbl}>photos</span>
        </div>
        <div className={styles.summaryChip}>
          <span className={styles.summaryNum}>{summary.sizeMb}MB</span>
          <span className={styles.summaryLbl}>total size</span>
        </div>
      </div>

      <p className={styles.localDesc}>
        Download a complete backup of all your data as a single JSON file.
        Store it anywhere — your computer, a USB drive, Google Drive, iCloud,
        or email it to yourself.
      </p>

      <div className={styles.actionRow}>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={handleExport}
        >
          {exportDone ? "✓ Downloaded!" : "Download backup"}
        </button>

        <button
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? "Importing…" : "Restore from file"}
        </button>
      </div>

      {importError && <p className={styles.errorMsg}>{importError}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      <p className={styles.autoSyncNote}>
        💡 Tip: Download a backup whenever you add something important.
      </p>
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────
export default function BackupSettingsModal({ onClose }) {
  const [tab, setTab] = useState("google"); // "google" | "local"

  // Close on overlay click
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>🗄️</span>
            <div>
              <h2 className={styles.headerTitle}>Backup & Restore</h2>
              <p className={styles.headerSub}>Keep your adventures safe</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "google" ? styles.tabActive : ""}`}
            onClick={() => setTab("google")}
          >
            <GoogleDriveLogo small />
            Google Drive
          </button>
          <button
            className={`${styles.tab} ${tab === "local" ? styles.tabActive : ""}`}
            onClick={() => setTab("local")}
          >
            💾 Local file
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {tab === "google"
            ? <GoogleDrivePanel />
            : <LocalBackupPanel />
          }
        </div>

      </div>
    </div>
  );
}

// ── SVG logos ────────────────────────────────────────────────────
function GoogleDriveLogo({ small }) {
  const size = small ? 16 : 40;
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9 9 0 000 53h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.55z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 0H30.1L43.65 25z" fill="#00832d"/>
      <path d="M59.8 53H87.3L73.55 29H46.3z" fill="#2684fc"/>
      <path d="M43.65 25L29.9 53h29.9L43.65 25z" fill="#ffba00"/>
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}