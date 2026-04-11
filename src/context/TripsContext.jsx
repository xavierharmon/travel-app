// src/context/TripsContext.jsx  (updated — adds app:datasaved dispatch)
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loadTrips, saveTrips } from "@/utils/storage";
import { generateId } from "@/utils/imageHelpers";
import { geocodeAllTrips } from "@/utils/geocodeTripData";

const TripsContext = createContext(null);

function notifyDataSaved() {
  window.dispatchEvent(new CustomEvent("app:datasaved"));
}

export function TripsProvider({ children }) {
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    try {
      const saved = loadTrips();
      setTrips(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTrip = useCallback((tripData) => {
    const trip = { ...tripData, id: tripData.id || generateId() };
    setTrips(prev => {
      const updated = [...prev, trip];
      saveTrips(updated);
      notifyDataSaved();
      return updated;
    });
    return trip;
  }, []);

  const updateTrip = useCallback((updatedTrip) => {
    if (!updatedTrip.id) return;
    setTrips(prev => {
      const exists = prev.find(t => t.id === updatedTrip.id);
      if (!exists) return prev;
      const updated = prev.map(t => t.id === updatedTrip.id ? { ...t, ...updatedTrip } : t);
      saveTrips(updated);
      notifyDataSaved();
      return updated;
    });
  }, []);

  const deleteTrip = useCallback((id) => {
    setTrips(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTrips(updated);
      notifyDataSaved();
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

  const geocodeAndUpdateTrips = useCallback(async () => {
    try {
      const geocodedTrips = await geocodeAllTrips(trips);
      setTrips(geocodedTrips);
      saveTrips(geocodedTrips);
      notifyDataSaved();
      return geocodedTrips;
    } catch (err) {
      console.error("Error geocoding trips:", err);
      throw err;
    }
  }, [trips]);

  return (
    <TripsContext.Provider value={{
      trips, loading, error,
      addTrip, updateTrip, deleteTrip, createBlankTrip, geocodeAndUpdateTrips,
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