// src/utils/tripMileage.js
// Computes the full mileage breakdown for a trip.
// Drive miles come from the mileage cache (stored when route is fetched).
// Flight and boat miles are calculated instantly via Haversine.

import { TRAVEL_MODES } from "@/constants";
import { haversineDistance } from "@/utils/haversine";
import { getStoredMileage } from "@/utils/mileageStorage";

export function computeTripMileage(trip) {
  if (!trip) return null;

  const stops = [
    trip.origin,
    ...(trip.stops || []),
    trip.destination
      ? {
          ...trip.destination,
          travelMode: trip.destinationTravelMode || TRAVEL_MODES.DRIVE,
        }
      : null,
  ].filter(s => s?.lat);

  if (stops.length < 2) return null;

  let driveMiles  = 0;
  let flightMiles = 0;
  let boatMiles   = 0;
  let hasUncachedDrive = false;

  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1];
    const to   = stops[i];
    const mode = to.travelMode || TRAVEL_MODES.DRIVE;
    const dist = haversineDistance(from, to);

    if (mode === TRAVEL_MODES.FLIGHT) {
      flightMiles += dist;

    } else if (mode === TRAVEL_MODES.BOAT) {
      boatMiles += dist;

    } else {
      // Drive — prefer cached road distance over straight-line estimate
      const cached = getStoredMileage(from, to);
      if (cached !== null) {
        driveMiles += cached.miles;
      } else {
        // Fall back to Haversine estimate until the route is fetched
        // and marks this as an estimate
        driveMiles += dist;
        hasUncachedDrive = true;
      }
    }
  }

  const totalMiles = driveMiles + flightMiles + boatMiles;

  return {
    drive:           driveMiles,
    flight:          flightMiles,
    boat:            boatMiles,
    total:           totalMiles,
    hasUncachedDrive, // true = drive miles are estimated, not road-accurate yet
  };
}

// Compute aggregate mileage across an array of trips
export function computeAggregateMileage(trips) {
  let drive  = 0;
  let flight = 0;
  let boat   = 0;
  let hasUncachedDrive = false;

  trips.forEach(trip => {
    const m = computeTripMileage(trip);
    if (!m) return;
    drive  += m.drive;
    flight += m.flight;
    boat   += m.boat;
    if (m.hasUncachedDrive) hasUncachedDrive = true;
  });

  return {
    drive,
    flight,
    boat,
    total: drive + flight + boat,
    hasUncachedDrive,
  };
}