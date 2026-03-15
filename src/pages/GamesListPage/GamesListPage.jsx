// src/pages/GamesListPage/GamesListPage.jsx
import { useState } from "react";
import styles from "./GamesListPage.module.css";
import { useGames } from "@/context/GamesContext";
import Button from "@/components/common/Button";

// ── Win/Loss record banner ───────────────────────────────────────
function RecordBanner({ games }) {
  const wins   = games.filter(g => g.outcome === "win").length;
  const losses = games.filter(g => g.outcome === "loss").length;
  const ties   = games.filter(g => g.outcome === "tie").length;
  const total  = games.length;

  const winPct = total > 0
    ? ((wins / total) * 100).toFixed(0)
    : null;

  return (
    <div className={styles.recordBanner}>
      <div className={styles.recordMain}>
        <span className={styles.recordWins}>{wins}W</span>
        <span className={styles.recordDash}>–</span>
        <span className={styles.recordLosses}>{losses}L</span>
        {ties > 0 && (
          <>
            <span className={styles.recordDash}>–</span>
            <span className={styles.recordTies}>{ties}T</span>
          </>
        )}
      </div>
      <div className={styles.recordMeta}>
        <span className={styles.recordTotal}>{total} game{total !== 1 ? "s" : ""} attended</span>
        {winPct !== null && (
          <span className={styles.recordPct}>{winPct}% win rate</span>
        )}
      </div>
      {/* Win rate bar */}
      {total > 0 && (
        <div className={styles.recordBar}>
          <div
            className={styles.recordBarWin}
            style={{ width: `${(wins / total) * 100}%` }}
          />
          <div
            className={styles.recordBarTie}
            style={{ width: `${(ties / total) * 100}%` }}
          />
          <div
            className={styles.recordBarLoss}
            style={{ width: `${(losses / total) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Individual game card ─────────────────────────────────────────
function GameCard({ game, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const outcomeColors = {
    win:  { bg: "rgba(34,197,94,0.12)",  border: "#166534", badge: "#86efac", badgeBg: "#14532d" },
    loss: { bg: "rgba(239,68,68,0.12)",  border: "#7f1d1d", badge: "#fca5a5", badgeBg: "#450a0a" },
    tie:  { bg: "rgba(96,165,250,0.12)", border: "#1e3a5f", badge: "#93c5fd", badgeBg: "#1e3a5f" },
  };
  const colors = outcomeColors[game.outcome] || outcomeColors.tie;

  const hasScore = game.homeScore !== null && game.visitingScore !== null
    && game.homeScore !== undefined && game.visitingScore !== undefined;

  const previewPhotos = (game.photos || []).slice(0, 3);

  return (
    <div className={styles.gameCard} style={{ borderColor: colors.border }}>
      {/* Header row */}
      <div className={styles.cardHeader}>
        {/* Outcome badge */}
        <span
          className={styles.outcomeBadge}
          style={{ background: colors.badgeBg, color: colors.badge }}
        >
          {game.outcome?.toUpperCase() || "?"}
        </span>

        {/* Teams + score */}
        <div className={styles.matchup}>
          {/* Home team */}
          <div className={styles.matchupTeam}>
            {game.homeTeamLogo && (
              <img src={game.homeTeamLogo} alt={game.homeTeam} className={styles.teamLogoSmall} />
            )}
            <span className={styles.teamName}>{game.homeTeam || "Home"}</span>
          </div>

          {/* Score or VS */}
          <div className={styles.scoreDisplay}>
            {hasScore
              ? <>
                  <span className={styles.scoreNum}>{game.homeScore}</span>
                  <span className={styles.scoreDash}>–</span>
                  <span className={styles.scoreNum}>{game.visitingScore}</span>
                </>
              : <span className={styles.vsSmall}>VS</span>
            }
          </div>

          {/* Visiting team */}
          <div className={`${styles.matchupTeam} ${styles.matchupTeamRight}`}>
            <span className={styles.teamName}>{game.visitingTeam || "Visitor"}</span>
            {game.visitingTeamLogo && (
              <img src={game.visitingTeamLogo} alt={game.visitingTeam} className={styles.teamLogoSmall} />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.cardActions}>
          <Button variant="secondary" size="sm" onClick={() => onEdit(game)}>Edit</Button>
          <Button variant="danger"    size="sm" onClick={() => onDelete(game.id)}>✕</Button>
        </div>
      </div>

      {/* Meta row */}
      <div className={styles.cardMeta}>
        {game.date && <span className={styles.metaChip}>📅 {game.date}</span>}
        {game.sport && <span className={styles.metaChip}>🏆 {game.sport}</span>}
        {game.venue && <span className={styles.metaChip}>🏟️ {game.venue}</span>}
        {game.city  && <span className={styles.metaChip}>📍 {game.city}</span>}
      </div>

      {/* Photos strip */}
      {previewPhotos.length > 0 && (
        <div className={styles.photoStrip}>
          {previewPhotos.map((photo, i) => (
            <div key={photo.id} className={styles.photoThumb}>
              <img
                src={photo.dataUrl}
                alt={`Game photo ${i + 1}`}
                className={styles.photoImg}
              />
              {i === previewPhotos.length - 1 && (game.photos.length > 3) && (
                <div className={styles.photoMore}>+{game.photos.length - 3}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Description (expandable) */}
      {game.description && (
        <div className={styles.descRow}>
          <p className={`${styles.desc} ${expanded ? styles.descExpanded : ""}`}>
            {game.description}
          </p>
          {game.description.length > 120 && (
            <button className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main list page ───────────────────────────────────────────────
export default function GamesListPage({ onNewGame, onEditGame, onBack }) {
  const { games, loading, deleteGame } = useGames();
  const [sortBy, setSortBy] = useState("date_desc");
  const [filterSport, setFilterSport] = useState("all");
  const [filterOutcome, setFilterOutcome] = useState("all");

  function handleDelete(id) {
    if (window.confirm("Delete this game? This cannot be undone.")) {
      deleteGame(id);
    }
  }

  // Sports for filter
  const sports = [...new Set(games.map(g => g.sport).filter(Boolean))].sort();

  // Filter
  let filtered = games.filter(g => {
    if (filterSport   !== "all" && g.sport   !== filterSport)   return false;
    if (filterOutcome !== "all" && g.outcome  !== filterOutcome) return false;
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "date_desc") return (b.date || "").localeCompare(a.date || "");
    if (sortBy === "date_asc")  return (a.date || "").localeCompare(b.date || "");
    return 0;
  });

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <div>
            <h1 className={styles.title}>🏆 Sports Tracker</h1>
            <p className={styles.subtitle}>
              {loading ? "Loading…" : `${games.length} game${games.length !== 1 ? "s" : ""} logged`}
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={onNewGame} size="md">
          + Log Game
        </Button>
      </header>

      {/* Record banner */}
      {games.length > 0 && <RecordBanner games={games} />}

      {/* Filters */}
      {games.length > 1 && (
        <div className={styles.filterBar}>
          {/* Outcome filter */}
          <div className={styles.filterGroup}>
            {["all", "win", "loss", "tie"].map(o => (
              <button
                key={o}
                className={`${styles.filterBtn} ${filterOutcome === o ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterOutcome(o)}
              >
                {o === "all" ? "All Results" : o.charAt(0).toUpperCase() + o.slice(1) + "s"}
              </button>
            ))}
          </div>

          {/* Sport filter */}
          {sports.length > 1 && (
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterBtn} ${filterSport === "all" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterSport("all")}
              >
                All Sports
              </button>
              {sports.map(s => (
                <button
                  key={s}
                  className={`${styles.filterBtn} ${filterSport === s ? styles.filterBtnActive : ""}`}
                  onClick={() => setFilterSport(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Sort */}
          <div className={styles.filterGroup} style={{ marginLeft: "auto" }}>
            <button
              className={`${styles.filterBtn} ${sortBy === "date_desc" ? styles.filterBtnActive : ""}`}
              onClick={() => setSortBy("date_desc")}
            >
              Newest
            </button>
            <button
              className={`${styles.filterBtn} ${sortBy === "date_asc" ? styles.filterBtnActive : ""}`}
              onClick={() => setSortBy("date_asc")}
            >
              Oldest
            </button>
          </div>
        </div>
      )}

      {/* Game list */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.empty}>Loading your games…</div>
        ) : games.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize: 48 }}>🏟️</span>
            <p>No games logged yet.<br />Hit <strong>Log Game</strong> to get started!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No games match your filters.</p>
          </div>
        ) : (
          <div className={styles.gameList}>
            {filtered.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onEdit={onEditGame}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}