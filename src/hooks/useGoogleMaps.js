import { useState, useEffect } from "react";
import { loadGoogleMaps } from "@/utils/loadGoogleMaps";

export function useGoogleMaps() {
  const [isReady, setIsReady] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!key) {
      setError("No Google Maps API key found. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.");
      return;
    }

    loadGoogleMaps(key)
      .then(() => setIsReady(true))
      .catch(err => setError(err.message));
  }, []);

  return { isReady, error };
}