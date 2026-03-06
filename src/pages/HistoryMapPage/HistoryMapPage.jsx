// src/pages/HistoryMapPage/HistoryMapPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./HistoryMapPage.module.css";
import { useTrips } from "@/hooks/useTrips";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useRouteDrawer } from "@/hooks/useRouteDrawer";
import { STOP_COLORS } from "@/constants";
import Button from "@/components/common/Button";

const TRIP_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

const darkMapStyles = [
  { elementType: "geometry",           stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill",   stylers: [{ color: "#94a3b8" }] },
  { featureType: "road",               elementType: "geometry",         stylers: [{ color: "#334155" }] },
  { featureType: "road.highway",       elementType: "geometry",         stylers: [{ color: "#475569" }] },
  { featureType: "road.highway",       elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "water",              elementType: "geometry",         stylers: [{ color: "#0f172a" }] },
  { featureType: "water",              elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "poi",                stylers: [{ visibility: "off" }] },
  { featureType: "transit",            stylers: [{ visibility: "off" }] },
  { featureType: "administrative",     elementType: "geometry.stroke",  stylers: [{ color: "#334155" }] },
];

export default function HistoryMapPage({ onBack }) {
  const { trips }                     = useTrips();
  const { isReady, error: mapsError } = useGoogleMaps();
  const { fetchAndDrawRoute }         = useRouteDrawer();

  const mapRef      = useRef(null);
  const gmapRef     = useRef(null);
  const overlaysRef = useRef([]);

  const [activeTripId, setActiveTripId] = useState(null);
  const [stats,        setStats]        = useState(null);
  const [mapMode,      setMapMode]      = useState("lines");
  const [drawing,      setDrawing]      = useState(false);

  // Compute summary stats whenever trips change
  useEffect(() => {
    if (!trips.length) return;

    const totalStops = trips.reduce((sum, t) => {
      return sum + [t.origin, ...(t.stops || []), t.destination]
        .filter(s => s?.lat).length;
    }, 0);

    const totalPhotos = trips.reduce((sum, t) => {
      const tripPhotos = (t.photos || []).length;
      const stopPhotos = (t.stops || []).reduce((s, stop) =>
        s + (stop.photos || []).length, 0
      );
      return sum + tripPhotos + stopPhotos;
    }, 0);

    setStats({ totalTrips: trips.length, totalStops, totalPhotos });
  }, [trips]);

  // Step 1: Initialize the map as soon as Google Maps is ready
  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    if (!gmapRef.current) {
      gmapRef.current = new window.google.maps.Map(mapRef.current, {
        center:            { lat: 39.5, lng: -98.35 },
        zoom:              4,
        mapTypeId:         "roadmap",
        styles:            darkMapStyles,
        mapTypeControl:    false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }
  }, [isReady]);

  // Step 2: Draw trips once BOTH the map AND trips are ready
  // Reruns whenever trips load, filter changes, or mode toggles
  useEffect(() => {
    if (!isReady || !gmapRef.current || !trips.length) return;
    drawAllTrips(activeTripId);
  }, [isReady, trips, activeTripId, mapMode]);

  function clearOverlays() {
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
  }

  const drawAllTrips = useCallback(async (filterTripId) => {
    if (!gmapRef.current) return;

    clearOverlays();
    setDrawing(true);

    const tripsToShow = filterTripId
      ? trips.filter(t => t.id === filterTripId)
      : trips;

    // Debug — log which trips have coordinates
    console.log("[HistoryMap] Drawing", tripsToShow.length, "trips");
    tripsToShow.forEach(t => {
      console.log(
        " →", t.name,
        "| origin:",      t.origin?.lat      ? "✓" : "✗",
        "| destination:", t.destination?.lat  ? "✓" : "✗",
        "| stops:",       t.stops?.length || 0
      );
    });

    if (!tripsToShow.length) {
      setDrawing(false);
      return;
    }

    const allBounds = new window.google.maps.LatLngBounds();
    let hasPoints   = false;

    for (const [tripIndex, trip] of tripsToShow.entries()) {
      const stops = [trip.origin, ...(trip.stops || []), trip.destination]
        .filter(s => s?.lat);

      if (stops.length === 0) {
        console.warn(`[HistoryMap] "${trip.name}" has no coordinates — skipping`);
        continue;
      }

      const color = TRIP_COLORS[tripIndex % TRIP_COLORS.length];

      // Place markers or glow circles depending on mode
      stops.forEach((stop, stopIndex) => {
        const isOrigin = stopIndex === 0;
        const isDest   = stopIndex === stops.length - 1;

        if (mapMode === "heatmap") {
          const circle = new window.google.maps.Circle({
            center:        { lat: stop.lat, lng: stop.lng },
            radius:        isOrigin || isDest ? 18000 : 12000,
            fillColor:     color,
            fillOpacity:   0.25,
            strokeColor:   color,
            strokeOpacity: 0.6,
            strokeWeight:  1,
            map:           gmapRef.current,
          });
          overlaysRef.current.push(circle);

        } else {
          const pinColor = isOrigin
            ? STOP_COLORS.ORIGIN
            : isDest
            ? STOP_COLORS.DESTINATION
            : color;

          const marker = new window.google.maps.Marker({
            position: { lat: stop.lat, lng: stop.lng },
            map:      gmapRef.current,
            title:    `${trip.name} — ${stop.name}`,
            icon: {
              path:         window.google.maps.SymbolPath.CIRCLE,
              scale:        isOrigin || isDest ? 5 : 4,
              fillColor:    pinColor,
              fillOpacity:  1,
              strokeColor:  "#ffffff",
              strokeWeight: 1.5,
            },
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="font-family:system-ui,sans-serif;padding:6px 10px;
                          color:#1e293b;max-width:200px">
                <div style="font-size:11px;color:#6366f1;font-weight:600;
                            text-transform:uppercase;letter-spacing:0.05em;
                            margin-bottom:3px">
                  ${trip.name}
                </div>
                <strong style="font-size:13px">
                  ${stop.name.split(",")[0]}
                </strong>
                ${stop.description
                  ? `<p style="font-size:12px;color:#475569;margin-top:4px;
                               line-height:1.4">
                     ${stop.description}</p>`
                  : ""}
                ${trip.date
                  ? `<p style="font-size:11px;color:#94a3b8;margin-top:4px">
                     ${trip.date}</p>`
                  : ""}
              </div>`,
          });

          marker.addListener("click", () =>
            infoWindow.open(gmapRef.current, marker)
          );
          overlaysRef.current.push(marker);
        }

        allBounds.extend({ lat: stop.lat, lng: stop.lng });
        hasPoints = true;
      });

      // Draw road-following route — uses cache if available, API if not
      if (stops.length >= 2) {
        try {
          const result = await fetchAndDrawRoute(
            gmapRef.current,
            stops,
            color
          );
          if (result?.polyline) {
            // Adjust line style for heatmap mode
            if (mapMode === "heatmap") {
              result.polyline.setOptions({
                strokeOpacity: 0.3,
                strokeWeight:  2,
              });
            }
            overlaysRef.current.push(result.polyline);
          }
        } catch (err) {
          console.warn(
            `[HistoryMap] Route fetch failed for "${trip.name}":`,
            err.message
          );
          // Fall back to straight geodesic line so something always shows
          const fallback = new window.google.maps.Polyline({
            path:          stops.map(s => ({ lat: s.lat, lng: s.lng })),
            geodesic:      true,
            strokeColor:   color,
            strokeOpacity: mapMode === "heatmap" ? 0.2 : 0.5,
            strokeWeight:  mapMode === "heatmap" ? 1   : 2,
            icons: [{
              icon:   { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
              offset: "0",
              repeat: "20px",
            }],
            map: gmapRef.current,
          });
          overlaysRef.current.push(fallback);
        }
      }
    }

    // Auto-fit map to show all plotted points
    if (hasPoints) {
      gmapRef.current.fitBounds(allBounds, 60);
    }

    setDrawing(false);
  }, [trips, mapMode, fetchAndDrawRoute]);

  const tripsWithCoords = trips.filter(t =>
    [t.origin, t.destination].some(s => s?.lat)
  );

  return (
    <div className={styles.page}>

      {/* ── Header ───────────────────────────────── */}
      <header className={styles.header}>
        <Button variant="ghost" onClick={onBack}>←</Button>

        <div className={styles.headerCenter}>
          <h1 className={styles.title}>Trip History</h1>
          {stats && (
            <div className={styles.statsRow}>
              <span className={styles.stat}>🗺️ {stats.totalTrips} trips</span>
              <span className={styles.statDivider}>·</span>
              <span className={styles.stat}>📍 {stats.totalStops} stops</span>
              <span className={styles.statDivider}>·</span>
              <span className={styles.stat}>📷 {stats.totalPhotos} photos</span>
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${mapMode === "lines" ? styles.modeBtnActive : ""}`}
            onClick={() => setMapMode("lines")}
          >
            Lines
          </button>
          <button
            className={`${styles.modeBtn} ${mapMode === "heatmap" ? styles.modeBtnActive : ""}`}
            onClick={() => setMapMode("heatmap")}
          >
            Glow
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────── */}
      <div className={styles.body}>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <p className={styles.sidebarLabel}>Filter by trip</p>

          {/* All trips button */}
          <button
            className={`${styles.tripBtn} ${activeTripId === null ? styles.tripBtnActive : ""}`}
            onClick={() => setActiveTripId(null)}
          >
            <span
              className={styles.tripBtnDot}
              style={{ background: "var(--color-primary)" }}
            />
            <span className={styles.tripBtnName}>All Trips</span>
            <span className={styles.tripBtnCount}>
              {tripsWithCoords.length}
            </span>
          </button>

          {/* One button per trip */}
          {tripsWithCoords.map((trip, i) => (
            <button
              key={trip.id}
              className={`${styles.tripBtn} ${activeTripId === trip.id ? styles.tripBtnActive : ""}`}
              onClick={() =>
                setActiveTripId(activeTripId === trip.id ? null : trip.id)
              }
            >
              <span
                className={styles.tripBtnDot}
                style={{ background: TRIP_COLORS[i % TRIP_COLORS.length] }}
              />
              <span className={styles.tripBtnName}>
                {trip.name || "Untitled"}
              </span>
              {trip.date && (
                <span className={styles.tripBtnDate}>
                  {trip.date.slice(0, 7)}
                </span>
              )}
            </button>
          ))}

          {tripsWithCoords.length === 0 && (
            <p className={styles.emptyState}>
              No trips with locations yet. Add an origin and destination
              to a trip to see it here.
            </p>
          )}
        </aside>

        {/* Map area */}
        <div className={styles.mapWrap}>
          {mapsError && (
            <div className={styles.errorOverlay}>{mapsError}</div>
          )}

          {!isReady && !mapsError && (
            <div className={styles.loadingOverlay}>Loading map…</div>
          )}

          {/* Drawing indicator — floats over the map while routes load */}
          {isReady && drawing && (
            <div className={styles.drawingIndicator}>
              Drawing routes…
            </div>
          )}

          {/* No trips message */}
          {isReady && !drawing && tripsWithCoords.length === 0 && (
            <div className={styles.loadingOverlay}>
              No trips to display yet.
            </div>
          )}

          <div ref={mapRef} className={styles.map} />
        </div>

      </div>
    </div>
  );
}