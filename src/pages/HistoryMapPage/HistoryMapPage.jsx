// src/pages/HistoryMapPage/HistoryMapPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./HistoryMapPage.module.css";
import { useTrips } from "@/hooks/useTrips";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useRouteDrawer } from "@/hooks/useRouteDrawer";
import {
  STOP_COLORS,
  TRAVEL_MODES,
  TRAVEL_MODE_COLORS,
  TRAVEL_MODE_LABELS,
} from "@/constants";
import { drawFlightArc, drawBoatRoute } from "@/utils/curveHelper";
import { computeAggregateMileage, computeTripMileage } from "@/utils/tripMileage";
import { formatMiles } from "@/utils/haversine";
import MileageBadge from "@/components/common/MileageBadge";
import Button from "@/components/common/Button";

const TRIP_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ec4899",
  "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4",
  "#ef4444", "#84cc16",
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
  { featureType: "poi",                stylers: [{ visibility: "off"  }] },
  { featureType: "transit",            stylers: [{ visibility: "off"  }] },
  { featureType: "administrative",     elementType: "geometry.stroke",  stylers: [{ color: "#334155" }] },
];

export default function HistoryMapPage({ onBack }) {
  const { trips }                     = useTrips();
  const { isReady, error: mapsError } = useGoogleMaps();
  const { fetchAndDrawRoute }         = useRouteDrawer();

  const mapRef      = useRef(null);
  const gmapRef     = useRef(null);
  const overlaysRef = useRef([]);

  const [activeTripId,    setActiveTripId]    = useState(null);
  const [stats,           setStats]           = useState(null);
  const [aggregateMileage, setAggregateMileage] = useState(null);
  const [mapMode,         setMapMode]         = useState("lines");
  const [drawing,         setDrawing]         = useState(false);
  const [activeModes,     setActiveModes]     = useState(
    new Set([TRAVEL_MODES.DRIVE, TRAVEL_MODES.FLIGHT, TRAVEL_MODES.BOAT])
  );

  // Compute summary stats and aggregate mileage whenever trips change
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
    setAggregateMileage(computeAggregateMileage(trips));
  }, [trips]);

  // Initialize map when Google Maps is ready
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

  // Draw trips once map AND trips are both ready
  useEffect(() => {
    if (!isReady || !gmapRef.current || !trips.length) return;
    drawAllTrips(activeTripId);
  }, [isReady, trips, activeTripId, mapMode, activeModes]);

  function clearOverlays() {
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
  }

  function toggleMode(mode) {
    setActiveModes(prev => {
      const next = new Set(prev);
      if (next.has(mode)) {
        if (next.size === 1) return prev;
        next.delete(mode);
      } else {
        next.add(mode);
      }
      return next;
    });
  }

  const drawAllTrips = useCallback(async (filterTripId) => {
    if (!gmapRef.current) return;
    clearOverlays();
    setDrawing(true);

    const tripsToShow = filterTripId
      ? trips.filter(t => t.id === filterTripId)
      : trips;

    if (!tripsToShow.length) {
      setDrawing(false);
      return;
    }

    const allBounds = new window.google.maps.LatLngBounds();
    let hasPoints   = false;

    for (const [tripIndex, trip] of tripsToShow.entries()) {

      // Attach destinationTravelMode to destination stop
      const rawStops = [
        trip.origin,
        ...(trip.stops || []),
        trip.destination
          ? {
              ...trip.destination,
              travelMode: trip.destinationTravelMode || TRAVEL_MODES.DRIVE,
            }
          : null,
      ].filter(s => s?.lat);

      if (rawStops.length === 0) continue;

      const color = TRIP_COLORS[tripIndex % TRIP_COLORS.length];

      // Place markers or glow circles
      rawStops.forEach((stop, stopIndex) => {
        const isOrigin = stopIndex === 0;
        const isDest   = stopIndex === rawStops.length - 1;

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
              fillOpacity:  0.9,
              strokeColor:  "#ffffff",
              strokeWeight: 1,
            },
          });

          const travelMode = stopIndex > 0
            ? (stop.travelMode || TRAVEL_MODES.DRIVE)
            : null;

          // Compute mileage for this individual trip for info window
          const tripMileage = computeTripMileage(trip);

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="font-family:system-ui,sans-serif;padding:6px 10px;
                          color:#1e293b;max-width:220px">
                <div style="font-size:11px;color:#6366f1;font-weight:600;
                            text-transform:uppercase;letter-spacing:0.05em;
                            margin-bottom:3px">
                  ${trip.name}
                </div>
                <strong style="font-size:13px">
                  ${stop.name.split(",")[0]}
                </strong>
                ${travelMode ? `
                  <div style="font-size:11px;margin-top:4px;
                              color:${TRAVEL_MODE_COLORS[travelMode]};
                              font-weight:600">
                    ${TRAVEL_MODE_LABELS[travelMode]}
                  </div>` : ""}
                ${stop.description
                  ? `<p style="font-size:12px;color:#475569;margin-top:4px;
                               line-height:1.4">
                     ${stop.description}</p>`
                  : ""}
                ${tripMileage ? `
                  <div style="margin-top:6px;padding-top:6px;
                              border-top:1px solid #e2e8f0;
                              font-size:11px;color:#64748b">
                    ${tripMileage.drive  > 0 ? `🚗 ${formatMiles(tripMileage.drive)}<br>` : ""}
                    ${tripMileage.flight > 0 ? `✈️ ${formatMiles(tripMileage.flight)}<br>` : ""}
                    ${tripMileage.boat   > 0 ? `⛵ ${formatMiles(tripMileage.boat)}<br>` : ""}
                    <strong>📏 ${formatMiles(tripMileage.total)} total</strong>
                  </div>` : ""}
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

      // Draw each segment respecting travel mode
      if (rawStops.length >= 2) {
        for (let i = 1; i < rawStops.length; i++) {
          const from = rawStops[i - 1];
          const to   = rawStops[i];
          const mode = to.travelMode || TRAVEL_MODES.DRIVE;

          if (!activeModes.has(mode)) continue;

          if (mode === TRAVEL_MODES.FLIGHT) {
            const lines = drawFlightArc(
              gmapRef.current, from, to, TRAVEL_MODE_COLORS.FLIGHT
            );
            if (lines) {
              lines.filter(Boolean).forEach(l => {
                if (mapMode === "heatmap") {
                  l.setOptions({ strokeOpacity: 0.2, strokeWeight: 1 });
                }
                overlaysRef.current.push(l);
              });
            }

          } else if (mode === TRAVEL_MODES.BOAT) {
            const lines = drawBoatRoute(
              gmapRef.current, from, to, TRAVEL_MODE_COLORS.BOAT
            );
            if (lines) {
              lines.filter(Boolean).forEach(l => {
                if (mapMode === "heatmap") {
                  l.setOptions({ strokeOpacity: 0.2, strokeWeight: 1 });
                }
                overlaysRef.current.push(l);
              });
            }

          } else {
            try {
              const result = await fetchAndDrawRoute(
                gmapRef.current,
                [from, to],
                color,
                new Set([TRAVEL_MODES.DRIVE])
              );
              const polylines = result?.polylines
                || (result?.polyline ? [result.polyline] : []);
              polylines.filter(Boolean).forEach(p => {
                if (mapMode === "heatmap") {
                  p.setOptions({ strokeOpacity: 0.3, strokeWeight: 2 });
                }
                overlaysRef.current.push(p);
              });
            } catch (err) {
              console.warn(`[HistoryMap] Drive failed:`, err.message);
              const fallback = new window.google.maps.Polyline({
                path: [
                  { lat: from.lat, lng: from.lng },
                  { lat: to.lat,   lng: to.lng   },
                ],
                geodesic:      true,
                strokeColor:   color,
                strokeOpacity: mapMode === "heatmap" ? 0.15 : 0.4,
                strokeWeight:  mapMode === "heatmap" ? 1    : 2,
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
                map: gmapRef.current,
              });
              overlaysRef.current.push(fallback);
            }
          }
        }
      }
    }

    if (hasPoints) gmapRef.current.fitBounds(allBounds, 60);

    // Refresh aggregate mileage after drive routes are fetched and cached
    setAggregateMileage(computeAggregateMileage(trips));
    setDrawing(false);
  }, [trips, mapMode, activeModes, fetchAndDrawRoute]);

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
              {aggregateMileage && aggregateMileage.total > 0 && (
                <>
                  <span className={styles.statDivider}>·</span>
                  <span className={styles.stat}>
                    📏 {formatMiles(aggregateMileage.total)} total
                    {aggregateMileage.hasUncachedDrive && (
                      <span
                        title="Some drive distances are estimated until routes are viewed"
                        style={{ opacity: 0.6, marginLeft: 2 }}
                      >~</span>
                    )}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Travel mode filter toggles */}
        <div className={styles.modeFilters}>
          {Object.values(TRAVEL_MODES).map(mode => (
            <button
              key={mode}
              className={styles.modeFilterBtn}
              onClick={() => toggleMode(mode)}
              style={{
                background:  activeModes.has(mode)
                  ? TRAVEL_MODE_COLORS[mode]
                  : "var(--color-surface-2)",
                borderColor: activeModes.has(mode)
                  ? TRAVEL_MODE_COLORS[mode]
                  : "var(--color-border)",
                color:       activeModes.has(mode)
                  ? "#fff"
                  : "var(--color-text-muted)",
              }}
            >
              {TRAVEL_MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* Lines / Glow display mode toggle */}
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

          {/* All trips */}
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

          {/* One per trip with mileage */}
          {tripsWithCoords.map((trip, i) => {
            const tripMileage = computeTripMileage(trip);
            return (
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
                <div className={styles.tripBtnInfo}>
                  <span className={styles.tripBtnName}>
                    {trip.name || "Untitled"}
                  </span>
                  {tripMileage && tripMileage.total > 0 && (
                    <span className={styles.tripBtnMileage}>
                      {formatMiles(tripMileage.total)}
                      {tripMileage.hasUncachedDrive && "~"}
                    </span>
                  )}
                </div>
                {trip.date && (
                  <span className={styles.tripBtnDate}>
                    {trip.date.slice(0, 7)}
                  </span>
                )}
              </button>
            );
          })}

          {tripsWithCoords.length === 0 && (
            <p className={styles.emptyState}>
              No trips with locations yet. Add an origin and destination
              to a trip to see it here.
            </p>
          )}

          {/* Aggregate mileage breakdown */}
          {aggregateMileage && aggregateMileage.total > 0 && (
            <div className={styles.mileageSection}>
              <p className={styles.sidebarLabel}>
                {activeTripId ? "Trip mileage" : "All trips mileage"}
              </p>
              <MileageBadge
                mileage={
                  activeTripId
                    ? computeTripMileage(trips.find(t => t.id === activeTripId))
                    : aggregateMileage
                }
              />
            </div>
          )}

          {/* Travel mode legend */}
          <div className={styles.legendSection}>
            <p className={styles.sidebarLabel}>Travel modes</p>
            {Object.values(TRAVEL_MODES).map(mode => (
              <div key={mode} className={styles.legendItem}>
                <span
                  className={styles.legendLine}
                  style={{ background: TRAVEL_MODE_COLORS[mode] }}
                />
                <span className={styles.legendLabel}>
                  {TRAVEL_MODE_LABELS[mode]}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Map area */}
        <div className={styles.mapWrap}>
          {mapsError && (
            <div className={styles.errorOverlay}>{mapsError}</div>
          )}
          {!isReady && !mapsError && (
            <div className={styles.loadingOverlay}>Loading map…</div>
          )}
          {isReady && drawing && (
            <div className={styles.drawingIndicator}>
              Drawing routes…
            </div>
          )}
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
