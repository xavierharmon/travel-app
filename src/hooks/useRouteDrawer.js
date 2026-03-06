// src/hooks/useRouteDrawer.js
import { useCallback } from "react";
import { getStoredRoute, storeRoute } from "@/utils/routeStorage";
import { STOP_COLORS } from "@/constants";

export function useRouteDrawer() {

  const drawStoredRoute = useCallback((map, encodedPolyline, color = STOP_COLORS.STOP) => {
    console.log("[drawStoredRoute] called");

    if (!window.google?.maps?.geometry) {
      console.error("[drawStoredRoute] geometry library not loaded");
      return null;
    }
    if (!encodedPolyline) {
      console.error("[drawStoredRoute] no encodedPolyline provided");
      return null;
    }
    if (!map) {
      console.error("[drawStoredRoute] no map provided");
      return null;
    }

    try {
      const path = window.google.maps.geometry.encoding.decodePath(encodedPolyline);
      console.log("[drawStoredRoute] decoded", path.length, "points");

      const polyline = new window.google.maps.Polyline({
        path,
        geodesic:      true,
        strokeColor:   color,
        strokeOpacity: 0.85,
        strokeWeight:  4,
        map,
      });

      return polyline;
    } catch (err) {
      console.error("[drawStoredRoute] failed:", err);
      return null;
    }
  }, []);

  const fetchAndDrawRoute = useCallback((map, stops, color = STOP_COLORS.STOP) => {
    return new Promise(async (resolve, reject) => {
      console.log("[fetchAndDrawRoute] called with", stops.length, "stops");

      if (!window.google) {
        return reject(new Error("Google Maps not loaded"));
      }

      const validStops = stops.filter(s => s?.lat && s?.lng);
      console.log("[fetchAndDrawRoute] valid stops:", validStops.length);

      if (validStops.length < 2) {
        console.warn("[fetchAndDrawRoute] need at least 2 stops");
        return resolve(null);
      }

      // Check cache first
      const stored = getStoredRoute(validStops);
      if (stored) {
        console.log("[fetchAndDrawRoute] drawing from cache ✓");
        const polyline = drawStoredRoute(map, stored, color);
        return resolve({ polyline, fromCache: true });
      }

      console.log("[fetchAndDrawRoute] calling Routes API...");

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      const intermediates = validStops.slice(1, -1).map(s => ({
        location: {
          latLng: {
            latitude:  s.lat,
            longitude: s.lng,
          },
        },
      }));

      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude:  validStops[0].lat,
              longitude: validStops[0].lng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude:  validStops[validStops.length - 1].lat,
              longitude: validStops[validStops.length - 1].lng,
            },
          },
        },
        intermediates,
        travelMode:               "DRIVE",
        routingPreference:        "TRAFFIC_UNAWARE",
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls:    false,
          avoidHighways: false,
          avoidFerries:  false,
        },
      };

      try {
        const response = await fetch(
          "https://routes.googleapis.com/directions/v2:computeRoutes",
          {
            method:  "POST",
            headers: {
              "Content-Type":     "application/json",
              "X-Goog-Api-Key":   apiKey,
              // FIXED: correct field mask for the new Routes API
              "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[fetchAndDrawRoute] Routes API error:", response.status, errorText);
          throw new Error(`Routes API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("[fetchAndDrawRoute] Routes API response:", data);

        if (!data.routes || data.routes.length === 0) {
          throw new Error("Routes API returned no routes");
        }

        // FIXED: correct path to encoded polyline in the new API response
        const encodedPolyline = data.routes[0]?.polyline?.encodedPolyline;

        if (!encodedPolyline) {
          console.error("[fetchAndDrawRoute] no polyline in response:", data);
          throw new Error("No polyline in Routes API response");
        }

        console.log("[fetchAndDrawRoute] polyline received, length:", encodedPolyline.length);

        storeRoute(validStops, encodedPolyline);

        const polyline = drawStoredRoute(map, encodedPolyline, color);
        console.log("[fetchAndDrawRoute] polyline drawn ✓");

        resolve({ polyline, fromCache: false });

      } catch (err) {
        console.error("[fetchAndDrawRoute] failed:", err.message);
        reject(err);
      }
    });
  }, [drawStoredRoute]);

  return { fetchAndDrawRoute, drawStoredRoute };
}