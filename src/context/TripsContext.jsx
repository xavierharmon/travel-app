// src/context/TripsContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loadTrips, saveTrips } from "@/utils/storage";
import { generateId } from "@/utils/imageHelpers";

const TripsContext = createContext(null);

export function TripsProvider({ children }) {
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Load from storage once on mount
  useEffect(() => {
    try {
      const saved = loadTrips();
      console.log("Loaded trips from storage:", saved);
      setTrips(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTrip = useCallback((tripData) => {
    const trip = { ...tripData, id: tripData.id || generateId() };
    console.log("addTrip called with:", trip);
    setTrips(prev => {
      const updated = [...prev, trip];
      saveTrips(updated);
      return updated;
    });
    return trip;
  }, []);

  const updateTrip = useCallback((updatedTrip) => {
    console.log("updateTrip called with:", updatedTrip);
    if (!updatedTrip.id) {
      console.error("updateTrip called without an id — aborting");
      return;
    }
    setTrips(prev => {
      const exists = prev.find(t => t.id === updatedTrip.id);
      if (!exists) {
        console.error("Trip not found in state:", updatedTrip.id);
        return prev;
      }
      const updated = prev.map(t =>
        t.id === updatedTrip.id ? { ...t, ...updatedTrip } : t
      );
      saveTrips(updated);
      console.log("Trips after update:", updated);
      return updated;
    });
  }, []);

  const deleteTrip = useCallback((id) => {
    console.log("deleteTrip called with id:", id);
    setTrips(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTrips(updated);
      return updated;
    });
  }, []);

  const createBlankTrip = useCallback(() => ({
    id:          null,
    name:        "",
    date:        new Date().toISOString().slice(0, 10),
    description: "",
    photos:      [],
    origin:      null,
    destination: null,
    stops:       [],
  }), []);

  return (
    <TripsContext.Provider value={{
      trips,
      loading,
      error,
      addTrip,
      updateTrip,
      deleteTrip,
      createBlankTrip,
    }}>
      {children}
    </TripsContext.Provider>
  );
}

export function useTrips() {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error("useTrips must be used inside <TripsProvider>");
  return ctx;
}