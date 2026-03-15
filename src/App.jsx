// src/App.jsx
import { useState } from "react";
import { VIEWS } from "@/constants";
import TripListPage   from "@/pages/TripListPage";
import TripEditorPage from "@/pages/TripEditorPage";
import MapPage        from "@/pages/MapPage";
import HistoryMapPage from "@/pages/HistoryMapPage";
import GamesListPage  from "@/pages/GamesListPage";
import GameEditorPage from "@/pages/GameEditorPage";

export default function App() {
  const [view,          setView]          = useState(VIEWS.LIST);
  const [selectedTrip,  setSelectedTrip]  = useState(null);
  const [selectedGame,  setSelectedGame]  = useState(null);

  // ── Trip navigation ────────────────────────────────────────────
  function openEditor(trip = null) {
    setSelectedTrip(trip);
    setView(VIEWS.EDIT);
  }

  function openMap(trip) {
    setSelectedTrip(trip);
    setView(VIEWS.MAP);
  }

  function goToList() {
    setSelectedTrip(null);
    setSelectedGame(null);
    setView(VIEWS.LIST);
  }

  // ── Games navigation ───────────────────────────────────────────
  function openGames() {
    setView(VIEWS.GAMES);
  }

  function openGameEditor(game = null) {
    setSelectedGame(game);
    setView(VIEWS.GAME_EDIT);
  }

  // ── Render ─────────────────────────────────────────────────────
  if (view === VIEWS.EDIT) {
    return (
      <TripEditorPage
        trip={selectedTrip}
        onBack={goToList}
        onViewMap={openMap}
      />
    );
  }

  if (view === VIEWS.MAP) {
    return (
      <MapPage
        trip={selectedTrip}
        onBack={goToList}
        onEdit={() => openEditor(selectedTrip)}
      />
    );
  }

  if (view === VIEWS.HISTORY) {
    return (
      <HistoryMapPage onBack={goToList} />
    );
  }

  if (view === VIEWS.GAMES) {
    return (
      <GamesListPage
        onNewGame={() => openGameEditor(null)}
        onEditGame={openGameEditor}
        onBack={goToList}
      />
    );
  }

  if (view === VIEWS.GAME_EDIT) {
    return (
      <GameEditorPage
        game={selectedGame}
        onBack={openGames}
      />
    );
  }

  return (
    <TripListPage
      onNewTrip={() => openEditor(null)}
      onEditTrip={openEditor}
      onViewMap={openMap}
      onViewHistory={() => setView(VIEWS.HISTORY)}
      onViewGames={openGames}
    />
  );
}