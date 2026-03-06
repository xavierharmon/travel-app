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

  // Fetches a single drive segment from Routes API and caches the result
  const fetchDriveSegment = useCallback(async (map, from, to, color) => {
    const validStops = [from, to].filter(s => s?.lat && s?.lng);
    if (validStops.length < 2) return null;

    // Check localStorage cache first — zero API calls if found
    const stored = getStoredRoute(validStops);
    if (stored) {
      console.log("[fetchDriveSegment] cache hit ✓");
      const polyline = drawStoredRoute(map, stored, color);
      return { polyline, fromCache: true };
    }

    // Not in cache — call Routes API once and store the result
    console.log("[fetchDriveSegment] calling Routes API");

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude:  from.lat,
            longitude: from.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude:  to.lat,
            longitude: to.lng,
          },
        },
      },
      intermediates:            [],
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
    console.log("[fetchDriveSegment] polyline drawn and cached ✓");

    return { polyline, fromCache: false };
  }, [drawStoredRoute]);

  // Main entry point — processes every segment between consecutive stops
  // Each segment reads its own travelMode from the destination stop object
  // activeModes is a Set controlling which modes are visible
  const fetchAndDrawRoute = useCallback((
    map,
    stops,
    color = STOP_COLORS.STOP,
    activeModes = new Set([TRAVEL_MODES.DRIVE, TRAVEL_MODES.FLIGHT, TRAVEL_MODES.BOAT])
  ) => {
    return new Promise(async (resolve, reject) => {
      if (!window.google) {
        return reject(new Error("Google Maps not loaded"));
      }

      const validStops = stops.filter(s => s?.lat && s?.lng);
      if (validStops.length < 2) {
        return resolve({ polylines: [], fromCache: true });
      }

      const allPolylines = [];
      let   anyFromApi   = false;

      // Walk every consecutive pair of stops and draw the correct segment type
      for (let i = 1; i < validStops.length; i++) {
        const from = validStops[i - 1];
        const to   = validStops[i];

        // travelMode lives on the destination end of each segment
        const mode = to.travelMode || TRAVEL_MODES.DRIVE;

        console.log(
          `[fetchAndDrawRoute] segment ${i}:`,
          `${from.name?.split(",")[0]} → ${to.name?.split(",")[0]}`,
          `| mode: ${mode}`
        );

        // Skip if this mode is not in the active filter set
        if (!activeModes.has(mode)) {
          console.log(`[fetchAndDrawRoute] skipping — ${mode} is filtered out`);
          continue;
        }

        if (mode === TRAVEL_MODES.FLIGHT) {
          // Curved animated arc — amber color, no API call
          console.log("[fetchAndDrawRoute] drawing flight arc");
          const lines = drawFlightArc(
            map,
            from,
            to,
            TRAVEL_MODE_COLORS.FLIGHT
          );
          if (lines) allPolylines.push(...lines.filter(Boolean));

        } else if (mode === TRAVEL_MODES.BOAT) {
          // Dashed curved arc — cyan color, no API call
          console.log("[fetchAndDrawRoute] drawing boat route");
          const lines = drawBoatRoute(
            map,
            from,
            to,
            TRAVEL_MODE_COLORS.BOAT
          );
          if (lines) allPolylines.push(...lines.filter(Boolean));

        } else {
          // DRIVE — road following polyline, cached after first call
          try {
            const result = await fetchDriveSegment(map, from, to, color);
            if (result?.polyline) {
              allPolylines.push(result.polyline);
              if (!result.fromCache) anyFromApi = true;
            }
          } catch (err) {
            console.warn("[fetchAndDrawRoute] drive segment failed:", err.message);
            // Fall back to a dashed straight geodesic line
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
        polylines: allPolylines,
        polyline:  allPolylines[0] || null,
        fromCache: !anyFromApi,
      });
    });
  }, [fetchDriveSegment]);

  return { fetchAndDrawRoute, drawStoredRoute };
}