import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",   // primary | secondary | danger | ghost
  size    = "md",        // sm | md | lg
  icon,
  disabled = false,
  fullWidth = false,
  onClick,
  type = "button",
  className = "",
}) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth  ? styles.fullWidth  : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}