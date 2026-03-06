// src/utils/haversine.js
// Calculates the great-circle distance between two lat/lng points
// using the Haversine formula. Returns miles.

const EARTH_RADIUS_MILES = 3958.8;

export function haversineDistance(from, to) {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return 0;

  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
    Math.cos(toRad(to.lat))   *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

export function metersToMiles(meters) {
  return meters / 1609.344;
}

export function formatMiles(miles) {
  if (!miles || miles === 0) return "0 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles).toLocaleString()} mi`;
}