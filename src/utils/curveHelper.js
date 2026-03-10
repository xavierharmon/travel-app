// src/utils/curveHelper.js

// Generates a bezier curve between two lat/lng points
// The height parameter controls how much the arc bows outward
export function buildCurvedPath(from, to, numPoints = 100, heightFactor = 0.3) {
  const points = [];

  const lat1 = (from.lat * Math.PI) / 180;
  const lng1 = (from.lng * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const lng2 = (to.lng * Math.PI) / 180;

  // Midpoint between the two stops
  const midLat = (from.lat + to.lat) / 2;
  const midLng = (from.lng + to.lng) / 2;

  // Calculate the distance to determine arc height
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;
  const distance = Math.sqrt(dLat * dLat + dLng * dLng);

  // Control point — offset perpendicular to the line between the two points
  // This creates the outward bow of the arc
  const controlLat = midLat - (dLng * heightFactor);
  const controlLng = midLng + (dLat * heightFactor);

  // Generate points along the quadratic bezier curve
  for (let i = 0; i <= numPoints; i++) {
    const t   = i / numPoints;
    const t1  = 1 - t;

    // Quadratic bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    const lat = t1 * t1 * from.lat + 2 * t1 * t * controlLat + t * t * to.lat;
    const lng = t1 * t1 * from.lng + 2 * t1 * t * controlLng + t * t * to.lng;

    points.push({ lat, lng });
  }

  return points;
}

// Draws a flight arc on the map — solid curved amber line
export function drawFlightArc(map, from, to, color = "#f59e0b") {
  if (!window.google || !from?.lat || !to?.lat) return null;

  const path = buildCurvedPath(from, to, 100, 0.25);

  const polyline = new window.google.maps.Polyline({
    path,
    geodesic:      false,  // false so our curve isn't overridden
    strokeColor:   color,
    strokeOpacity: 0,      // hide the main line
    strokeWeight:  0,
    map,
    icons: [{
      // Dashed pattern with solid line segments
      icon: {
        path:          "M 0,-1 0,1",
        strokeOpacity: 0,
        strokeColor:   color,
        scale:         3,
      },
      offset: "0",
      repeat: "12px",
    }],
  });

  // Draw the actual curved line on top
  const arcLine = new window.google.maps.Polyline({
    path,
    geodesic:      false,
    strokeColor:   color,
    strokeOpacity: 0.35,
    strokeWeight:  2.5,
    map,
  });

  return [polyline, arcLine];
}

// Draws a boat route on the map — dashed curved cyan line
export function drawBoatRoute(map, from, to, color = "#06b6d4") {
  if (!window.google || !from?.lat || !to?.lat) return null;

  // Boats arc less dramatically than flights
  const path = buildCurvedPath(from, to, 100, 0.15);

  const polyline = new window.google.maps.Polyline({
    path,
    geodesic:      false,
    strokeColor:   color,
    strokeOpacity: 0.8,
    strokeWeight:  2.5,
    strokeDashArray: "8 6",
    map,
    icons: [{
      icon: {
        path:          "M 0,-1 0,1",
        strokeOpacity: 0.3,
        strokeColor:   color,
        scale:         3,
      },
      offset: "0",
      repeat: "18px",
    }],
  });

  return [polyline];
}

// Draws a boat route on the map — dashed curved cyan line
export function drawTrainRoute(map, from, to, color = "#5F8575") {
  if (!window.google || !from?.lat || !to?.lat) return null;

  // Boats arc less dramatically than flights
  const path = buildCurvedPath(from, to, 100, 0.10);

  const polyline = new window.google.maps.Polyline({
    path,
    geodesic:      false,
    strokeColor:   color,
    strokeOpacity: 0.8,
    strokeWeight:  2.5,
    strokeDashArray: "8 6",
    map,
    icons: [{
      icon: {
        path:          "M 0,-1 0,1",
        strokeOpacity: 0.3,
        strokeColor:   color,
        scale:         3,
      },
      offset: "0",
      repeat: "18px",
    }],
  });

  return [polyline];
}