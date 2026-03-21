// src/components/TeamPicker/TeamPicker.jsx
//
// Updated logo handling:
//   - On select: logo is fetched from ESPN CDN, converted to base64,
//     saved to IndexedDB via saveLogo(teamName, dataUrl), then
//     onChange is called with logo: null (no base64 on game object).
//   - On render: logo is loaded from IndexedDB via getLogo(teamName)
//     and held in local state for display only.
//
// The game object stored in context/localStorage now has:
//   homeTeamLogo: null     ← always null, IDB is the source of truth
//   visitingTeamLogo: null
//
// Display components (GameCard, GameEditorPage, GameFallbackCard)
// load logos from IDB via the useLogoUrls hook.

import { useState, useRef, useEffect } from "react";
import styles from "./TeamPicker.module.css";
import { getTeamsForSport } from "@/data/teams";
import { saveLogo, getLogo } from "@/utils/photoStorage";

function InitialsAvatar({ name, size = 36 }) {
  const initials = name
    ? name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "?";
  const colors = ["#6366f1","#0f6e56","#854f0b","#a32d2d","#185fa5","#993556","#3b6d11"];
  const idx    = name
    ? name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
    : 0;
  return (
    <div className={styles.initialsAvatar} style={{ width: size, height: size, background: colors[idx] }}>
      <span style={{ fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
}

function LevelPill({ level }) {
  const colors = {
    "MLB":      "#a32d2d",
    "Triple-A": "#6366f1",
    "Double-A": "#0f6e56",
    "High-A":   "#854f0b",
    "Single-A": "#185fa5",
  };
  return (
    <span className={styles.levelPill} style={{ background: colors[level] ?? "#888" }}>
      {level}
    </span>
  );
}

// Fetch logo from CDN and convert to base64, then save to IDB
async function fetchAndStoreLogo(teamName, cdnUrl) {
  if (!cdnUrl || !teamName) return null;
  try {
    const res  = await fetch(cdnUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise(resolve => {
      const reader   = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (dataUrl) await saveLogo(teamName, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

export default function TeamPicker({ sport, value, onChange, label, placeholder }) {
  const [query,        setQuery]        = useState(value || "");
  const [open,         setOpen]         = useState(false);
  const [displayLogo,  setDisplayLogo]  = useState(null); // dataUrl for display only
  const [embedding,    setEmbedding]    = useState(false);
  const containerRef                    = useRef(null);
  const inputRef                        = useRef(null);

  const teams    = getTeamsForSport(sport);
  const hasTeams = teams.length > 0;

  // Load logo from IDB whenever the team name (value) changes
  useEffect(() => {
    setQuery(value || "");
    if (!value) { setDisplayLogo(null); return; }
    getLogo(value).then(url => setDisplayLogo(url || null));
  }, [value]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
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
      onChange({ name: exact.name, logo: null }); // logo: null — stored in IDB
    } else {
      onChange({ name: val, logo: null });
    }
  }

  async function handleSelect(team) {
    setQuery(team.name);
    setOpen(false);
    inputRef.current?.blur();

    // Tell parent immediately — no logo on the object
    onChange({ name: team.name, logo: null });

    if (team.logo) {
      // Check IDB first — might already be stored from a previous selection
      const cached = await getLogo(team.name);
      if (cached) {
        setDisplayLogo(cached);
        return;
      }

      // Not cached — fetch from CDN and store
      setEmbedding(true);
      const dataUrl = await fetchAndStoreLogo(team.name, team.logo);
      setEmbedding(false);
      if (dataUrl) setDisplayLogo(dataUrl);
    } else {
      setDisplayLogo(null);
    }
  }

  function handleClearLogo() {
    setDisplayLogo(null);
    onChange({ name: value, logo: null });
  }

  const showDropdown = open && hasTeams && filtered.length > 0;
  const showLogo     = !!displayLogo;
  const showInitials = !showLogo && !!value;

  return (
    <div className={styles.wrap} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={styles.inputRow}>
        <div className={styles.logoWrap}>
          {showLogo ? (
            <div className={styles.logoThumb}>
              <img
                src={displayLogo}
                alt=""
                className={`${styles.logoImg} ${embedding ? styles.logoEmbedding : ""}`}
              />
              {embedding && <div className={styles.embeddingSpinner} title="Saving logo…" />}
              <button className={styles.logoClear} onClick={handleClearLogo} title="Remove logo" type="button">
                x
              </button>
            </div>
          ) : showInitials ? (
            <InitialsAvatar name={value} size={36} />
          ) : (
            <div className={styles.logoPlaceholder}><span>H</span></div>
          )}
        </div>

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
                {team.logo
                  ? <img src={team.logo} alt="" className={styles.optionLogo}
                      onError={e => { e.target.style.display = "none"; }} />
                  : null
                }
                <div className={styles.optionInitials} style={{ display: team.logo ? "none" : "flex" }}>
                  <InitialsAvatar name={team.name} size={28} />
                </div>
                <div className={styles.optionInfo}>
                  <span className={styles.optionName}>{team.name}</span>
                  <div className={styles.optionMeta}>
                    {team.level     && <LevelPill level={team.level} />}
                    {team.affiliate && <span className={styles.affiliateTag}>{team.affiliate}</span>}
                  </div>
                </div>
                {value === team.name && <span className={styles.optionCheck}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasTeams && (
        <p className={styles.noTeamsHint}>No preset teams for this sport — type any team name above.</p>
      )}
    </div>
  );
}