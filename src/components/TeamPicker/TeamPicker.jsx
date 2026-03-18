// src/components/TeamPicker/TeamPicker.jsx  (updated)
//
// Changes from previous version:
//   - Renders a colored initials circle when logo is null (MiLB fallback)
//   - Shows level badge (Triple-A, Double-A, etc.) for MiLB teams
//   - Affiliate tag shown in dropdown for MiLB teams

import { useState, useRef, useEffect } from "react";
import styles from "./TeamPicker.module.css";
import { getTeamsForSport } from "@/data/teams";

// ── Initials avatar — shown when no logo URL is available ────────
function InitialsAvatar({ name, size = 36 }) {
  const initials = name
    ? name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "?";

  // Deterministic color from name so the same team always gets the same color
  const colors = ["#6366f1","#0f6e56","#854f0b","#a32d2d","#185fa5","#993556","#3b6d11"];
  const idx    = name
    ? name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
    : 0;

  return (
    <div
      className={styles.initialsAvatar}
      style={{ width: size, height: size, background: colors[idx] }}
    >
      <span style={{ fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
}

// ── Level pill for MiLB teams ────────────────────────────────────
function LevelPill({ level }) {
  const colors = {
    "Triple-A": "#6366f1",
    "Double-A": "#0f6e56",
    "High-A":   "#854f0b",
    "Single-A": "#185fa5",
  };
  return (
    <span
      className={styles.levelPill}
      style={{ background: colors[level] ?? "#888" }}
    >
      {level}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function TeamPicker({ sport, value, logo, onChange, label, placeholder }) {
  const [query,    setQuery]    = useState(value || "");
  const [open,     setOpen]     = useState(false);
  const [imgError, setImgError] = useState(false);
  const containerRef            = useRef(null);
  const inputRef                = useRef(null);

  const teams    = getTeamsForSport(sport);
  const hasTeams = teams.length > 0;

  useEffect(() => { setQuery(value || ""); setImgError(false); }, [value]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = hasTeams && query.trim().length > 0
    ? teams.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
    : teams;

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    const exact = teams.find(t => t.name.toLowerCase() === val.toLowerCase());
    if (exact) {
      onChange({ name: exact.name, logo: exact.logo });
      setImgError(false);
    } else {
      onChange({ name: val, logo: null });
    }
  }

  function handleSelect(team) {
    setQuery(team.name);
    setOpen(false);
    setImgError(false);
    onChange({ name: team.name, logo: team.logo });
    inputRef.current?.blur();
  }

  function handleClearLogo() {
    onChange({ name: value, logo: null });
    setImgError(false);
  }

  const showDropdown  = open && hasTeams && filtered.length > 0;
  const showLogo      = logo && !imgError;
  const showInitials  = !showLogo && value;

  return (
    <div className={styles.wrap} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={styles.inputRow}>
        {/* Logo / initials / placeholder */}
        <div className={styles.logoWrap}>
          {showLogo ? (
            <div className={styles.logoThumb}>
              <img
                src={logo}
                alt=""
                className={styles.logoImg}
                onError={() => setImgError(true)}
              />
              <button
                className={styles.logoClear}
                onClick={handleClearLogo}
                title="Remove logo"
                type="button"
              >✕</button>
            </div>
          ) : showInitials ? (
            <InitialsAvatar name={value} size={36} />
          ) : (
            <div className={styles.logoPlaceholder}>
              <span>🏟️</span>
            </div>
          )}
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={hasTeams ? `${placeholder} (or search…)` : placeholder}
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.list}>
            {filtered.map(team => (
              <button
                key={team.name}
                className={`${styles.option} ${value === team.name ? styles.optionActive : ""}`}
                onMouseDown={e => { e.preventDefault(); handleSelect(team); }}
                type="button"
              >
                {/* Logo or initials */}
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt=""
                    className={styles.optionLogo}
                    onError={e => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={styles.optionInitials}
                  style={{ display: team.logo ? "none" : "flex" }}
                >
                  <InitialsAvatar name={team.name} size={28} />
                </div>

                <div className={styles.optionInfo}>
                  <span className={styles.optionName}>{team.name}</span>
                  <div className={styles.optionMeta}>
                    {team.level   && <LevelPill level={team.level} />}
                    {team.affiliate && (
                      <span className={styles.affiliateTag}>
                        {team.affiliate}
                      </span>
                    )}
                  </div>
                </div>

                {value === team.name && <span className={styles.optionCheck}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasTeams && (
        <p className={styles.noTeamsHint}>
          No preset teams for this sport — type any team name above.
        </p>
      )}
    </div>
  );
}