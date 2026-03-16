// src/components/SyncToast/SyncToast.jsx
//
// A slim, non-intrusive banner that slides in from the top when:
//   - A newer backup was found on Drive ("Drive has newer data")
//   - A restore just completed ("Restored from Drive")
//   - An auto-backup just ran ("Backed up to Drive")
//
// Props:
//   type:      "newer" | "restored" | "backed_up" | "error"
//   driveDate: ISO string of the Drive backup's timestamp (for "newer")
//   onRestore: callback to trigger restore (for "newer")
//   onDismiss: callback to hide the toast

import styles from "./SyncToast.module.css";

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return ""; }
}

export default function SyncToast({ type, driveDate, message, onRestore, onDismiss }) {
  if (type === "newer") {
    return (
      <div className={`${styles.toast} ${styles.toastInfo}`}>
        <span className={styles.icon}>☁️</span>
        <div className={styles.body}>
          <span className={styles.msg}>
            Google Drive has a newer backup from <strong>{fmtDate(driveDate)}</strong>.
          </span>
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={onRestore}>
              Restore now
            </button>
            <button className={styles.dismissBtn} onClick={onDismiss}>
              Keep local data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "restored") {
    return (
      <div className={`${styles.toast} ${styles.toastSuccess}`}>
        <span className={styles.icon}>✓</span>
        <span className={styles.msg}>Restored from Drive — page will refresh shortly.</span>
        <button className={styles.dismissBtn} onClick={onDismiss}>✕</button>
      </div>
    );
  }

  if (type === "backed_up") {
    return (
      <div className={`${styles.toast} ${styles.toastSuccess}`}>
        <span className={styles.icon}>✓</span>
        <span className={styles.msg}>Backed up to Google Drive</span>
        <button className={styles.dismissBtn} onClick={onDismiss}>✕</button>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className={`${styles.toast} ${styles.toastError}`}>
        <span className={styles.icon}>⚠</span>
        <span className={styles.msg}>{message || "Drive sync failed."}</span>
        <button className={styles.dismissBtn} onClick={onDismiss}>✕</button>
      </div>
    );
  }

  return null;
}