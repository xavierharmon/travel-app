// src/App.jsx
import { useState } from "react";
import { VIEWS } from "@/constants";
import DashboardPage   from "@/pages/DashboardPage";
import TripListPage    from "@/pages/TripListPage";
import TripEditorPage  from "@/pages/TripEditorPage";
import MapPage         from "@/pages/MapPage";
import HistoryMapPage  from "@/pages/HistoryMapPage";
import GamesListPage   from "@/pages/GamesListPage";
import GameEditorPage  from "@/pages/GameEditorPage";
import ShowcasePage    from "@/pages/ShowcasePage";
import AutoSyncProvider from "@/components/AutoSyncProvider";
import MemoryListPage  from "@/pages/MemoryListPage";
import MemoriesEditorPage from "@/pages/MemoryEditorPage";

// Add this function above the App component, before the export
function isTVDevice() {
  const hasLargeScreen =
    window.screen.width  >= 1280 &&
    window.screen.height >= 720;

  const hasNoFinePointer = window.matchMedia(
    "(pointer: coarse) or (pointer: none)"
  ).matches;

  return hasLargeScreen && hasNoFinePointer;
}

export default function App() {
  const [view,         setView]         = useState(isTVDevice() ? VIEWS.SHOWCASE : VIEWS.DASHBOARD);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);

  function openDashboard()                { setSelectedTrip(null); setSelectedGame(null); setSelectedMemory(null); setView(VIEWS.DASHBOARD); }
  function openEditor(trip = null)         { setSelectedTrip(trip); setView(VIEWS.EDIT); }
  function openMap(trip)                   { setSelectedTrip(trip); setView(VIEWS.MAP); }
  function openGames()                     { setView(VIEWS.GAMES); }
  function openGameEditor(game = null)     { setSelectedGame(game); setView(VIEWS.GAME_EDIT); }
  function openShowcase()                  { setView(VIEWS.SHOWCASE); }
  function openMemories()                  { setView(VIEWS.MEMORIES); }
  function openMemoriesEditor(memory = null) { setSelectedMemory(memory); setView(VIEWS.MEMORIES_EDIT); }

  function goToList() {
    setSelectedTrip(null);
    setSelectedGame(null);
    setSelectedMemory(null);
    setView(VIEWS.LIST);
  }

  return (
    <>
      {/* AutoSyncProvider sits outside page routing so it persists across all views */}
      <AutoSyncProvider />

      {view === VIEWS.DASHBOARD && (
        <DashboardPage
          onNewTrip={() => openEditor(null)}
          onViewTrips={goToList}
          onViewGames={openGames}
          onViewMemories={openMemories}
          onViewShowcase={openShowcase}
          onViewHistory={() => setView(VIEWS.HISTORY)}
        />
      )}
      {view === VIEWS.EDIT && (
        <TripEditorPage trip={selectedTrip} onBack={openDashboard} onViewMap={openMap} />
      )}
      {view === VIEWS.MAP && (
        <MapPage trip={selectedTrip} onBack={openDashboard} onEdit={() => openEditor(selectedTrip)} />
      )}
      {view === VIEWS.HISTORY && (
        <HistoryMapPage onBack={openDashboard} />
      )}
      {view === VIEWS.GAMES && (
        <GamesListPage onNewGame={() => openGameEditor(null)} onEditGame={openGameEditor} onBack={openDashboard} />
      )}
      {view === VIEWS.GAME_EDIT && (
        <GameEditorPage game={selectedGame} onBack={openGames} />
      )}
      {view === VIEWS.SHOWCASE && (
        <ShowcasePage onBack={openDashboard} />
      )}
      {view === VIEWS.MEMORIES && (
        <MemoryListPage onNewMemory={() => openMemoriesEditor(null)} onEditMemory={openMemoriesEditor} onBack={openDashboard}/>
      )}
      {view === VIEWS.MEMORIES_EDIT && (
        <MemoriesEditorPage memory={selectedMemory} onBack={openMemories} />
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
          onViewDashboard={openDashboard}
        />
      )}
    </>
  );
}