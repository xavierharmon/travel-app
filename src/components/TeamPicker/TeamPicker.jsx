// src/components/TeamPicker/TeamPicker.jsx
//
// Searchable team picker with logo thumbnails.
// Falls back gracefully to free-text entry for unlisted teams.
//
// Props:
//   sport:      string  — current sport (e.g. "Baseball"), used to filter team list
//   value:      string  — current team name
//   logo:       string  — current logo URL
//   onChange:   fn({ name, logo }) — called when user picks or clears a team
//   label:      string  — field label (e.g. "Home Team")
//   placeholder string  — input placeholder

import { useState, useRef, useEffect } from "react";
import styles from "./TeamPicker.module.css";
import { getTeamsForSport } from "@/data/teams";

export default function TeamPicker({ sport, value, logo, onChange, label, placeholder }) {
  const [query,    setQuery]    = useState(value || "");
  const [open,     setOpen]     = useState(false);
  const [imgError, setImgError] = useState(false);
  const containerRef            = useRef(null);
  const inputRef                = useRef(null);

  const teams = getTeamsForSport(sport);
  const hasTeams = teams.length > 0;

  // Keep input text in sync if parent changes value
  useEffect(() => { setQuery(value || ""); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter teams by query
  const filtered = hasTeams && query.trim().length > 0
    ? teams.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
    : teams;

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    // If user is typing freely (not matching a team), clear the logo
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

  const showDropdown = open && hasTeams && filtered.length > 0;

  return (
    <div className={styles.wrap} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={styles.inputRow}>
        {/* Logo preview / placeholder */}
        <div className={styles.logoWrap}>
          {logo && !imgError
            ? (
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
            )
            : (
              <div className={styles.logoPlaceholder}>
                <span>🏟️</span>
              </div>
            )
          }
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={hasTeams ? `${placeholder} (or search teams…)` : placeholder}
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className={styles.dropdown}>
          {filtered.length === 0 ? (
            <div className={styles.noResults}>No teams found — type to use custom name</div>
          ) : (
            <div className={styles.list}>
              {filtered.map(team => (
                <button
                  key={team.name}
                  className={`${styles.option} ${value === team.name ? styles.optionActive : ""}`}
                  onMouseDown={e => { e.preventDefault(); handleSelect(team); }}
                  type="button"
                >
                  <img
                    src={team.logo}
                    alt=""
                    className={styles.optionLogo}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <span className={styles.optionName}>{team.name}</span>
                  {value === team.name && <span className={styles.optionCheck}>✓</span>}
                </button>
              ))}
            </div>
          )}
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