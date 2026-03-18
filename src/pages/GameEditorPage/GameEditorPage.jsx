// src/pages/GameEditorPage/GameEditorPage.jsx  (updated scoreboard section)
//
// Replace the existing TeamLogoUploader + teamNameInput blocks in the
// scoreboard card with TeamPicker. Only the scoreboard section changes —
// all other sections (Details, Photos, bottom save) stay identical.

import { useState } from "react";
import styles from "./GameEditorPage.module.css";
import { useGames } from "@/context/GamesContext";
import { generateId } from "@/utils/imageHelpers";
import Button from "@/components/common/Button";
import PhotoGrid from "@/components/common/PhotoGrid";
import TeamPicker from "@/components/TeamPicker";

// ── Score input (unchanged) ──────────────────────────────────────
function ScoreInput({ value, onChange, label }) {
  return (
    <div className={styles.scoreField}>
      <label className={styles.scoreLabel}>{label}</label>
      <input
        type="number"
        min="0"
        className={styles.scoreInput}
        value={value ?? ""}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
        placeholder="0"
      />
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function GameEditorPage({ game, onBack }) {
  const { addGame, updateGame } = useGames();
  const isNew = !game?.id;

  const [form, setForm] = useState(() => {
    if (!game) {
      return {
        id:               null,
        date:             new Date().toISOString().slice(0, 10),
        sport:            "",
        homeTeam:         "",
        homeTeamLogo:     null,
        homeScore:        null,
        visitingTeam:     "",
        visitingTeamLogo: null,
        visitingScore:    null,
        venue:            "",
        city:             "",
        description:      "",
        outcome:          "win",
        photos:           [],
      };
    }
    return { ...game };
  });

  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.homeTeam?.trim())     errs.homeTeam     = "Home team is required.";
    if (!form.visitingTeam?.trim()) errs.visitingTeam = "Visiting team is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (isNew) {
      addGame({ ...form, id: generateId() });
    } else {
      updateGame({ ...form });
    }
    onBack();
  }

  function handleScoreChange(side, val) {
    const updated = { ...form, [`${side}Score`]: val };
    const h = side === "home"     ? val : form.homeScore;
    const v = side === "visiting" ? val : form.visitingScore;
    if (h !== null && v !== null && h !== "" && v !== "") {
      updated.outcome = h > v ? "win" : h < v ? "loss" : "tie";
    }
    setForm(updated);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <Button variant="primary" onClick={handleSave}>
            {isNew ? "Save Game" : "Update Game"}
          </Button>
        </div>

        <h2 className={styles.pageTitle}>
          {isNew ? "Log a Game" : "Edit Game"}
        </h2>

        {/* ── Scoreboard ────────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Scoreboard</h3>

          <div className={styles.scoreboardCard}>
            {/* Home team */}
            <div className={styles.teamCol}>
              <TeamPicker
                sport={form.sport}
                value={form.homeTeam}
                logo={form.homeTeamLogo}
                label="Home"
                placeholder="Home Team"
                onChange={({ name, logo }) => setForm(prev => ({
                  ...prev,
                  homeTeam:     name,
                  homeTeamLogo: logo ?? prev.homeTeamLogo,
                }))}
              />
              {errors.homeTeam && <p className={styles.errorText}>{errors.homeTeam}</p>}
              <ScoreInput
                value={form.homeScore}
                onChange={v => handleScoreChange("home", v)}
                label="Score"
              />
            </div>

            {/* VS divider */}
            <div className={styles.vsDivider}>
              <span className={styles.vsText}>VS</span>
              <div className={styles.outcomePicker}>
                {["win", "loss", "tie"].map(o => (
                  <button
                    key={o}
                    className={`${styles.outcomeBtn} ${form.outcome === o ? styles[`outcome_${o}`] : ""}`}
                    onClick={() => set("outcome", o)}
                    type="button"
                  >
                    {o.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Visiting team */}
            <div className={styles.teamCol}>
              <TeamPicker
                sport={form.sport}
                value={form.visitingTeam}
                logo={form.visitingTeamLogo}
                label="Visitor"
                placeholder="Visiting Team"
                onChange={({ name, logo }) => setForm(prev => ({
                  ...prev,
                  visitingTeam:     name,
                  visitingTeamLogo: logo ?? prev.visitingTeamLogo,
                }))}
              />
              {errors.visitingTeam && <p className={styles.errorText}>{errors.visitingTeam}</p>}
              <ScoreInput
                value={form.visitingScore}
                onChange={v => handleScoreChange("visiting", v)}
                label="Score"
              />
            </div>
          </div>
        </section>

        {/* ── Game Details ───────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Details</h3>

          <div className={styles.fieldsGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Date</label>
              <input
                type="date"
                className={styles.input}
                value={form.date || ""}
                onChange={e => set("date", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sport</label>
              <input
                className={styles.input}
                value={form.sport || ""}
                onChange={e => set("sport", e.target.value)}
                placeholder="e.g. Baseball, Hockey…"
                list="sports-list"
              />
              <datalist id="sports-list">
                {["Baseball", "Hockey", "College", "Basketball",
                  "Football", "Soccer", "Tennis"].map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Venue / Stadium</label>
              <input
                className={styles.input}
                value={form.venue || ""}
                onChange={e => set("venue", e.target.value)}
                placeholder="e.g. Wrigley Field"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>City</label>
              <input
                className={styles.input}
                value={form.city || ""}
                onChange={e => set("city", e.target.value)}
                placeholder="e.g. Chicago, IL"
              />
            </div>
          </div>

          <div className={styles.field} style={{ marginTop: "var(--space-md)" }}>
            <label className={styles.label}>Notes & Memories</label>
            <textarea
              className={styles.textarea}
              value={form.description || ""}
              onChange={e => set("description", e.target.value)}
              placeholder="What made this game special?"
              rows={4}
            />
          </div>
        </section>

        {/* ── Game Photos ────────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Photos</h3>
          <PhotoGrid
            photos={form.photos || []}
            onChange={photos => set("photos", photos)}
          />
        </section>

        <div className={styles.bottomActions}>
          <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
            {isNew ? "Save Game" : "Update Game"}
          </Button>
        </div>

      </div>
    </div>
  );
}