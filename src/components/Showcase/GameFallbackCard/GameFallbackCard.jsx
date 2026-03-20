// src/components/Showcase/GameFallbackCard/GameFallbackCard.jsx
import styles from "./GameFallbackCard.module.css";

// Initials avatar — mirrors the one in TeamPicker
function InitialsAvatar({ name, size = 80 }) {
  const initials = name
    ? name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "?";
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

const OUTCOME_STYLES = {
  win:  { bg: "#14532d", border: "#22c55e", color: "#86efac", label: "WIN"  },
  loss: { bg: "#450a0a", border: "#ef4444", color: "#fca5a5", label: "LOSS" },
  tie:  { bg: "#1e3a5f", border: "#60a5fa", color: "#93c5fd", label: "TIE"  },
};

export default function GameFallbackCard({ item }) {
  const {
    homeTeam, visitingTeam, homeTeamLogo, visitingTeamLogo,
    homeScore, visitingScore, outcome, date, venue, city, sport,
  } = item;

  const outcomeStyle = OUTCOME_STYLES[outcome] || OUTCOME_STYLES.tie;
  const hasScore     = homeScore !== null && homeScore !== undefined
                    && visitingScore !== null && visitingScore !== undefined;

  return (
    <div className={styles.card}>
      {/* Decorative background glow */}
      <div
        className={styles.glowLeft}
        style={{ background: `radial-gradient(ellipse at center, ${outcomeStyle.border}18 0%, transparent 70%)` }}
      />
      <div
        className={styles.glowRight}
        style={{ background: `radial-gradient(ellipse at center, ${outcomeStyle.border}10 0%, transparent 70%)` }}
      />

      <div className={styles.content}>
        {/* Sport label */}
        {sport && (
          <p className={styles.sportLabel}>{sport}</p>
        )}

        {/* Outcome badge */}
        {outcome && (
          <div
            className={styles.outcomeBadge}
            style={{
              background:   outcomeStyle.bg,
              border:       `1px solid ${outcomeStyle.border}`,
              color:        outcomeStyle.color,
            }}
          >
            {outcomeStyle.label}
          </div>
        )}

        {/* Matchup */}
        <div className={styles.matchup}>
          {/* Home team */}
          <div className={styles.teamBlock}>
            <div className={styles.logoWrap}>
              {homeTeamLogo
                ? <img src={homeTeamLogo} alt={homeTeam} className={styles.teamLogo} />
                : <InitialsAvatar name={homeTeam} size={96} />
              }
            </div>
            <p className={styles.teamName}>{homeTeam}</p>
            <p className={styles.teamLabel}>Home</p>
          </div>

          {/* Score */}
          <div className={styles.scoreBlock}>
            {hasScore ? (
              <>
                <span className={styles.scoreNum}
                  style={{ color: homeScore > visitingScore ? outcomeStyle.color : "var(--color-text-muted)" }}
                >
                  {homeScore}
                </span>
                <span className={styles.scoreDash}>–</span>
                <span className={styles.scoreNum}
                  style={{ color: visitingScore > homeScore ? outcomeStyle.color : "var(--color-text-muted)" }}
                >
                  {visitingScore}
                </span>
              </>
            ) : (
              <span className={styles.vsText}>VS</span>
            )}
          </div>

          {/* Visiting team */}
          <div className={styles.teamBlock}>
            <div className={styles.logoWrap}>
              {visitingTeamLogo
                ? <img src={visitingTeamLogo} alt={visitingTeam} className={styles.teamLogo} />
                : <InitialsAvatar name={visitingTeam} size={96} />
              }
            </div>
            <p className={styles.teamName}>{visitingTeam}</p>
            <p className={styles.teamLabel}>Visitor</p>
          </div>
        </div>

        {/* Meta info */}
        <div className={styles.meta}>
          {date   && <span className={styles.metaChip}>📅 {date}</span>}
          {venue  && <span className={styles.metaChip}>🏟️ {venue}</span>}
          {city   && <span className={styles.metaChip}>📍 {city}</span>}
        </div>
      </div>
    </div>
  );
}