// src/pages/MapPage/MapPage.jsx
import { useEffect, useRef, useState } from "react";
import styles from "./MapPage.module.css";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useRouteDrawer } from "@/hooks/useRouteDrawer";
import { STOP_COLORS, MAP_DEFAULTS } from "@/constants";
import Button from "@/components/common/Button";

export default function MapPage({ trip, onBack, onEdit }) {
  const mapRef     = useRef(null);
  const gmapRef    = useRef(null);
  const overlaysRef = useRef([]);
  const { isReady, error: mapsError } = useGoogleMaps();
  const { fetchAndDrawRoute }         = useRouteDrawer();
  const [routeError,  setRouteError]  = useState(null);
  const [fromCache,   setFromCache]   = useState(null);

  const allStops = trip
    ? [trip.origin, ...(trip.stops || []), trip.destination].filter(s => s?.lat)
    : [];

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
  }, [isReady, trip]);

  function clearOverlays() {
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
  }

  async function renderTrip() {
    clearOverlays();
    if (!allStops.length) return;

    // Place markers
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
          scale:        9,
          fillColor:    color,
          fillOpacity:  1,
          strokeColor:  "#ffffff",
          strokeWeight: 2,
        },
        label: {
          text:       String(i + 1),
          color:      "#ffffff",
          fontSize:   "11px",
          fontWeight: "bold",
        },
      });

      const stopData = [trip.origin, ...(trip.stops || []), trip.destination]
        .filter(Boolean)[i];

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family:system-ui,sans-serif;padding:4px 8px;
                      color:#1e293b;max-width:220px">
            <strong style="font-size:14px">${stop.name}</strong>
            ${stopData?.description
              ? `<p style="font-size:12px;color:#475569;margin-top:4px">
                 ${stopData.description}</p>`
              : ""}
          </div>`,
      });

      marker.addListener("click", () =>
        infoWindow.open(gmapRef.current, marker)
      );
      overlaysRef.current.push(marker);
    });

    // Fit bounds to all stops
    if (allStops.length >= 2) {
      const bounds = new window.google.maps.LatLngBounds();
      allStops.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
      gmapRef.current.fitBounds(bounds, 80);

      // Draw the route — uses cache if available, API if not
      try {
        const result = await fetchAndDrawRoute(
          gmapRef.current,
          allStops,
          STOP_COLORS.STOP
        );
        if (result) {
          overlaysRef.current.push(result.polyline);
          setFromCache(result.fromCache);
          setRouteError(null);
        }
      } catch (err) {
        setRouteError("Could not load route. " + err.message);
      }
    }
  }

  const stopList = [trip?.origin, ...(trip?.stops || []), trip?.destination]
    .filter(s => s?.name);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={onBack}>←</Button>
        <div className={styles.tripInfo}>
          <h2 className={styles.tripName}>{trip?.name || "Trip Map"}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {trip?.date && (
              <span className={styles.tripDate}>{trip.date}</span>
            )}
            {/* Show whether route came from cache or API */}
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

      {stopList.length > 0 && (
        <footer className={styles.legend}>
          {stopList.map((s, i) => {
            const color = i === 0
              ? STOP_COLORS.ORIGIN
              : i === stopList.length - 1
              ? STOP_COLORS.DESTINATION
              : STOP_COLORS.STOP;
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
              </div>
            );
          })}
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