// src/App.jsx  (updated — adds AutoSyncProvider)
import { useState } from "react";
import { VIEWS } from "@/constants";
import TripListPage    from "@/pages/TripListPage";
import TripEditorPage  from "@/pages/TripEditorPage";
import MapPage         from "@/pages/MapPage";
import HistoryMapPage  from "@/pages/HistoryMapPage";
import GamesListPage   from "@/pages/GamesListPage";
import GameEditorPage  from "@/pages/GameEditorPage";
import AutoSyncProvider from "@/components/AutoSyncProvider";

export default function App() {
  const [view,         setView]         = useState(VIEWS.LIST);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  function openEditor(trip = null) { setSelectedTrip(trip); setView(VIEWS.EDIT); }
  function openMap(trip)           { setSelectedTrip(trip); setView(VIEWS.MAP); }
  function openGames()             { setView(VIEWS.GAMES); }
  function openGameEditor(game = null) { setSelectedGame(game); setView(VIEWS.GAME_EDIT); }

  function goToList() {
    setSelectedTrip(null);
    setSelectedGame(null);
    setView(VIEWS.LIST);
  }

  return (
    <>
      {/* AutoSyncProvider sits outside page routing so it persists across all views */}
      <AutoSyncProvider />

      {view === VIEWS.EDIT && (
        <TripEditorPage trip={selectedTrip} onBack={goToList} onViewMap={openMap} />
      )}
      {view === VIEWS.MAP && (
        <MapPage trip={selectedTrip} onBack={goToList} onEdit={() => openEditor(selectedTrip)} />
      )}
      {view === VIEWS.HISTORY && (
        <HistoryMapPage onBack={goToList} />
      )}
      {view === VIEWS.GAMES && (
        <GamesListPage onNewGame={() => openGameEditor(null)} onEditGame={openGameEditor} onBack={goToList} />
      )}
      {view === VIEWS.GAME_EDIT && (
        <GameEditorPage game={selectedGame} onBack={openGames} />
      )}
      {view === VIEWS.LIST && (
        <TripListPage
          onNewTrip={() => openEditor(null)}
          onEditTrip={openEditor}
          onViewMap={openMap}
          onViewHistory={() => setView(VIEWS.HISTORY)}
          onViewGames={openGames}
        />
      )}
    </>
  );
}