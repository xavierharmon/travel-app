// src/App.jsx
import { useState } from "react";
import { VIEWS } from "@/constants";
import TripListPage    from "@/pages/TripListPage";
import TripEditorPage  from "@/pages/TripEditorPage";
import MapPage         from "@/pages/MapPage";
import HistoryMapPage  from "@/pages/HistoryMapPage";
import GamesListPage   from "@/pages/GamesListPage";
import GameEditorPage  from "@/pages/GameEditorPage";
import ShowcasePage    from "@/pages/ShowcasePage";
import AutoSyncProvider from "@/components/AutoSyncProvider";
import MemoryListPage  from "@/pages/MemoryListPage";

export default function App() {
  const [view,         setView]         = useState(VIEWS.LIST);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);

  function openEditor(trip = null)         { setSelectedTrip(trip); setView(VIEWS.EDIT); }
  function openMap(trip)                   { setSelectedTrip(trip); setView(VIEWS.MAP); }
  function openGames()                     { setView(VIEWS.GAMES); }
  function openGameEditor(game = null)     { setSelectedGame(game); setView(VIEWS.GAME_EDIT); }
  function openShowcase()                  { setView(VIEWS.SHOWCASE); }
  function openMemories(memory = null)     { setSelectedMemory(memory); setView(VIEWS.MEMORIES); }

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
      {view === VIEWS.SHOWCASE && (
        <ShowcasePage onBack={goToList} />
      )}
      {view === VIEWS.MEMORIES && (
        <MemoryListPage  onBack={goToList}/>
      )}
      {view === VIEWS.LIST && (
        <TripListPage
          onNewTrip={() => openEditor(null)}
          onEditTrip={openEditor}
          onViewMap={openMap}
          onViewHistory={() => setView(VIEWS.HISTORY)}
          onViewGames={openGames}
          onViewShowcase={openShowcase}
          onViewMemories={openMemories}
        />
      )}
    </>
  );
}