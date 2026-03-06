// src/hooks/useRouteDrawer.js
import { useCallback } from "react";
import { getStoredRoute, storeRoute } from "@/utils/routeStorage";
import {
  STOP_COLORS,
  TRAVEL_MODES,
  TRAVEL_MODE_COLORS,
} from "@/constants";
import { drawFlightArc, drawBoatRoute } from "@/utils/curveHelper";

export function useRouteDrawer() {

  // Decodes a stored encoded polyline and draws it on the map
  const drawStoredRoute = useCallback((map, encodedPolyline, color = STOP_COLORS.STOP) => {
    if (!window.google?.maps?.geometry) {
      console.error("[drawStoredRoute] geometry library not loaded");
      return null;
    }
    if (!encodedPolyline || !map) return null;

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

  // Fetches a single drive segment from Routes API and caches it
  const fetchDriveSegment = useCallback(async (map, stops, color) => {
    const validStops = stops.filter(s => s?.lat && s?.lng);
    if (validStops.length < 2) return null;

    // Check cache first
    const stored = getStoredRoute(validStops);
    if (stored) {
      console.log("[fetchDriveSegment] drawing from cache ✓");
      const polyline = drawStoredRoute(map, stored, color);
      return { polyline, fromCache: true };
    }

    // Not cached — call Routes API
    console.log("[fetchDriveSegment] calling Routes API for", validStops.length, "stops");

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
      intermediates: validStops.slice(1, -1).map(s => ({
        location: {
          latLng: {
            latitude:  s.lat,
            longitude: s.lng,
          },
        },
      })),
      travelMode:               "DRIVE",
      routingPreference:        "TRAFFIC_UNAWARE",
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls:    false,
        avoidHighways: false,
        avoidFerries:  false,
      },
    };

    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method:  "POST",
        headers: {
          "Content-Type":     "application/json",
          "X-Goog-Api-Key":   apiKey,
          "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Routes API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const encodedPolyline = data.routes[0]?.polyline?.encodedPolyline;

    if (!encodedPolyline) {
      throw new Error("No polyline in Routes API response");
    }

    storeRoute(validStops, encodedPolyline);
    const polyline = drawStoredRoute(map, encodedPolyline, color);
    console.log("[fetchDriveSegment] polyline drawn ✓");

    return { polyline, fromCache: false };
  }, [drawStoredRoute]);

  // Main entry point — handles all travel modes segment by segment
  // activeModes is a Set of TRAVEL_MODES values to show
  const fetchAndDrawRoute = useCallback((
    map,
    stops,
    color = STOP_COLORS.STOP,
    activeModes = new Set([TRAVEL_MODES.DRIVE, TRAVEL_MODES.FLIGHT, TRAVEL_MODES.BOAT])
  ) => {
    return new Promise(async (resolve, reject) => {
      if (!window.google) return reject(new Error("Google Maps not loaded"));

      const validStops = stops.filter(s => s?.lat && s?.lng);
      if (validStops.length < 2) return resolve({ polylines: [], fromCache: true });

      const allPolylines = [];
      let   anyFromApi   = false;

      // Process each segment between consecutive stops
      for (let i = 1; i < validStops.length; i++) {
        const from = validStops[i - 1];
        const to   = validStops[i];
        const mode = to.travelMode || TRAVEL_MODES.DRIVE;

        // Skip if this travel mode is filtered out
        if (!activeModes.has(mode)) continue;

        if (mode === TRAVEL_MODES.FLIGHT) {
          // Curved amber arc — no API call needed
          console.log(`[fetchAndDrawRoute] drawing flight arc: ${from.name} → ${to.name}`);
          const lines = drawFlightArc(
            map,
            from,
            to,
            TRAVEL_MODE_COLORS.FLIGHT
          );
          if (lines) allPolylines.push(...lines.filter(Boolean));

        } else if (mode === TRAVEL_MODES.BOAT) {
          // Dashed cyan arc — no API call needed
          console.log(`[fetchAndDrawRoute] drawing boat route: ${from.name} → ${to.name}`);
          const lines = drawBoatRoute(
            map,
            from,
            to,
            TRAVEL_MODE_COLORS.BOAT
          );
          if (lines) allPolylines.push(...lines.filter(Boolean));

        } else {
          // DRIVE — road following route via cache or Routes API
          console.log(`[fetchAndDrawRoute] drawing drive segment: ${from.name} → ${to.name}`);
          try {
            const result = await fetchDriveSegment(map, [from, to], color);
            if (result?.polyline) {
              allPolylines.push(result.polyline);
              if (!result.fromCache) anyFromApi = true;
            }
          } catch (err) {
            console.warn(`[fetchAndDrawRoute] drive segment failed:`, err.message);
            // Fall back to a dashed straight line for this segment
            const fallback = new window.google.maps.Polyline({
              path: [
                { lat: from.lat, lng: from.lng },
                { lat: to.lat,   lng: to.lng   },
              ],
              geodesic:      true,
              strokeColor:   color,
              strokeOpacity: 0.4,
              strokeWeight:  2,
              icons: [{
                icon: {
                  path:          "M 0,-1 0,1",
                  strokeOpacity: 1,
                  strokeColor:   color,
                  scale:         2,
                },
                offset: "0",
                repeat: "16px",
              }],
              map,
            });
            allPolylines.push(fallback);
          }
        }
      }

      resolve({
        polylines:  allPolylines,
        polyline:   allPolylines[0] || null,
        fromCache:  !anyFromApi,
      });
    });
  }, [fetchDriveSegment]);

  return { fetchAndDrawRoute, drawStoredRoute };
}