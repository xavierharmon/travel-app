// src/pages/MapPage/MapPage.jsx
import { useEffect, useRef, useState } from "react";
import styles from "./MapPage.module.css";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useRouteDrawer } from "@/hooks/useRouteDrawer";
import {
  STOP_COLORS,
  MAP_DEFAULTS,
  TRAVEL_MODES,
  TRAVEL_MODE_COLORS,
  TRAVEL_MODE_LABELS,
} from "@/constants";
import { computeTripMileage } from "@/utils/tripMileage";
import MileageBadge from "@/components/common/MileageBadge";
import Button from "@/components/common/Button";

export default function MapPage({ trip, onBack, onEdit }) {
  const mapRef      = useRef(null);
  const gmapRef     = useRef(null);
  const overlaysRef = useRef([]);

  const { isReady, error: mapsError } = useGoogleMaps();
  const { fetchAndDrawRoute }         = useRouteDrawer();

  const [routeError,  setRouteError]  = useState(null);
  const [fromCache,   setFromCache]   = useState(null);
  const [mileage,     setMileage]     = useState(null);
  const [activeModes, setActiveModes] = useState(
    new Set([TRAVEL_MODES.DRIVE, TRAVEL_MODES.FLIGHT, TRAVEL_MODES.BOAT])
  );

  // Build full stops array with destinationTravelMode attached
  const allStops = trip
    ? [
        trip.origin,
        ...(trip.stops || []),
        trip.destination
          ? {
              ...trip.destination,
              travelMode: trip.destinationTravelMode || TRAVEL_MODES.DRIVE,
            }
          : null,
      ].filter(s => s?.lat)
    : [];

  // Compute mileage whenever trip or cache changes
  useEffect(() => {
    if (trip) setMileage(computeTripMileage(trip));
  }, [trip]);

  useEffect(() => {
    if (!isReady || !mapRef.current) return;
    if (!gmapRef.current) {
      gmapRef.current = new window.google.maps.Map(mapRef.current, {
        center:            allStops[0]
          ? { lat: allStops[0].lat, lng: allStops[0].lng }
          : MAP_DEFAULTS.CENTER,
        zoom:              MAP_DEFAULTS.ZOOM,
        mapTypeId:         "roadmap",
        styles:            darkMapStyles,
        mapTypeControl:    false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }
    renderTrip();
  }, [isReady, trip, activeModes]);

  // Recompute mileage after routes are drawn so drive miles are road-accurate
  useEffect(() => {
    if (trip) setMileage(computeTripMileage(trip));
  }, [fromCache]);

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

  async function renderTrip() {
    clearOverlays();
    if (!allStops.length) return;

    allStops.forEach((stop, i) => {
      const isFirst = i === 0;
      const isLast  = i === allStops.length - 1;
      const color   = isFirst
        ? STOP_COLORS.ORIGIN
        : isLast
        ? STOP_COLORS.DESTINATION
        : STOP_COLORS.STOP;

      const marker = new window.google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map:      gmapRef.current,
        title:    stop.name,
        icon: {
          path:         window.google.maps.SymbolPath.CIRCLE,
          scale:        isFirst || isLast ? 7 : 5,
          fillColor:    color,
          fillOpacity:  0.9,
          strokeColor:  "#ffffff",
          strokeWeight: 1.5,
        },
        label: {
          text:       String(i + 1),
          color:      "#ffffff",
          fontSize:   "9px",
          fontWeight: "bold",
        },
      });

      const travelMode = i > 0
        ? (stop.travelMode || TRAVEL_MODES.DRIVE)
        : null;

      const stopData = [
        trip.origin,
        ...(trip.stops || []),
        trip.destination,
      ].filter(Boolean)[i];

      const infoContent = `
        <div style="font-family:system-ui,sans-serif;padding:6px 10px;
                    color:#1e293b;max-width:220px">
          <strong style="font-size:14px">${stop.name}</strong>
          ${travelMode ? `
            <div style="font-size:11px;margin-top:4px;
                        color:${TRAVEL_MODE_COLORS[travelMode]};
                        font-weight:600">
              ${TRAVEL_MODE_LABELS[travelMode]} from previous stop
            </div>` : ""}
          ${stopData?.description
            ? `<p style="font-size:12px;color:#475569;margin-top:4px;line-height:1.4">
               ${stopData.description}</p>`
            : ""}
        </div>`;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
      });
      marker.addListener("click", () =>
        infoWindow.open(gmapRef.current, marker)
      );
      overlaysRef.current.push(marker);
    });

    if (allStops.length >= 2) {
      const bounds = new window.google.maps.LatLngBounds();
      allStops.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
      gmapRef.current.fitBounds(bounds, 80);

      try {
        const result = await fetchAndDrawRoute(
          gmapRef.current,
          allStops,
          STOP_COLORS.STOP,
          activeModes
        );
        if (result?.polylines) {
          overlaysRef.current.push(...result.polylines.filter(Boolean));
        }
        setFromCache(result?.fromCache ?? null);
        setRouteError(null);

        // Recompute mileage now that drive distances are cached
        setMileage(computeTripMileage(trip));
      } catch (err) {
        setRouteError("Could not load route. " + err.message);
      }
    }
  }

  const stopList = [
    trip?.origin,
    ...(trip?.stops || []),
    trip?.destination,
  ].filter(s => s?.name);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={onBack}>←</Button>

        <div className={styles.tripInfo}>
          <h2 className={styles.tripName}>{trip?.name || "Trip Map"}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {trip?.date && (
              <span className={styles.tripDate}>{trip.date}</span>
            )}
            {fromCache !== null && (
              <span style={{
                fontSize:      10,
                color:         fromCache ? "#22c55e" : "#f59e0b",
                background:    fromCache
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(245,158,11,0.1)",
                borderRadius:  4,
                padding:       "2px 6px",
                fontWeight:    600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
                {fromCache ? "✓ Cached" : "⚡ Fetched"}
              </span>
            )}
          </div>
        </div>

        {/* Travel mode filter toggles */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.values(TRAVEL_MODES).map(mode => (
            <button
              key={mode}
              onClick={() => toggleMode(mode)}
              style={{
                padding:      "5px 10px",
                borderRadius: 6,
                fontSize:     12,
                fontWeight:   600,
                cursor:       "pointer",
                border:       "1px solid",
                transition:   "all 0.2s",
                background:   activeModes.has(mode)
                  ? TRAVEL_MODE_COLORS[mode]
                  : "var(--color-surface-2)",
                borderColor:  activeModes.has(mode)
                  ? TRAVEL_MODE_COLORS[mode]
                  : "var(--color-border)",
                color:        activeModes.has(mode)
                  ? "#fff"
                  : "var(--color-text-muted)",
              }}
            >
              {TRAVEL_MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={onEdit}>Edit</Button>
      </header>

      <div className={styles.mapWrap}>
        {(mapsError || routeError) && (
          <div className={styles.errorOverlay}>
            {mapsError || routeError}
          </div>
        )}
        <div ref={mapRef} className={styles.map} />
      </div>

      {/* Legend + mileage footer */}
      {stopList.length > 0 && (
        <footer className={styles.legend}>
          <div className={styles.legendStops}>
            {stopList.map((s, i) => {
              const color = i === 0
                ? STOP_COLORS.ORIGIN
                : i === stopList.length - 1
                ? STOP_COLORS.DESTINATION
                : STOP_COLORS.STOP;

              const travelMode = i === stopList.length - 1
                ? (trip?.destinationTravelMode || TRAVEL_MODES.DRIVE)
                : i > 0
                ? (trip?.stops?.[i - 1]?.travelMode || TRAVEL_MODES.DRIVE)
                : null;

              return (
                <div key={i} className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: color }}
                  >
                    {i + 1}
                  </span>
                  <span className={styles.legendName}>
                    {s.name?.split(",")[0]}
                  </span>
                  {travelMode && (
                    <span style={{
                      fontSize:   10,
                      color:      TRAVEL_MODE_COLORS[travelMode],
                      fontWeight: 600,
                    }}>
                      {TRAVEL_MODE_LABELS[travelMode]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mileage breakdown */}
          {mileage && (
            <div className={styles.legendMileage}>
              <MileageBadge mileage={mileage} />
            </div>
          )}
        </footer>
      )}
    </div>
  );
}

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