// src/context/GamesContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { generateId } from "@/utils/imageHelpers";

const GAMES_STORAGE_KEY = "sports_games_v1";

function loadGames() {
  try {
    const raw = localStorage.getItem(GAMES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGames(games) {
  try {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    if (err.name === "QuotaExceededError") {
      throw new Error("Storage is full. Try removing some game photos to free up space.");
    }
    throw err;
  }
}

const GamesContext = createContext(null);

export function GamesProvider({ children }) {
  const [games,   setGames]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    try {
      setGames(loadGames());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addGame = useCallback((gameData) => {
    const game = { ...gameData, id: gameData.id || generateId() };
    setGames(prev => {
      const updated = [...prev, game];
      saveGames(updated);
      return updated;
    });
    return game;
  }, []);

  const updateGame = useCallback((updatedGame) => {
    if (!updatedGame.id) return;
    setGames(prev => {
      const updated = prev.map(g => g.id === updatedGame.id ? { ...g, ...updatedGame } : g);
      saveGames(updated);
      return updated;
    });
  }, []);

  const deleteGame = useCallback((id) => {
    setGames(prev => {
      const updated = prev.filter(g => g.id !== id);
      saveGames(updated);
      return updated;
    });
  }, []);

  return (
    <GamesContext.Provider value={{ games, loading, error, addGame, updateGame, deleteGame }}>
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error("useGames must be used inside <GamesProvider>");
  return ctx;
}