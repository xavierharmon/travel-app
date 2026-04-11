/**
 * Geocode all locations in trips to extract canonical state/country data
 * This can be used to migrate existing trips to have proper geocoded state/country
 */
import { geocodeCoordinates } from "./geocodeCoordinates";

export async function geocodeAllTrips(trips) {
  if (!trips || trips.length === 0) return trips;

  const geocodedTrips = [];

  for (const trip of trips) {
    const geocodedTrip = { ...trip };

    // Geocode origin
    if (trip.origin && trip.origin.lat && trip.origin.lng && !trip.origin.state) {
      const { state, country } = await geocodeCoordinates(trip.origin.lat, trip.origin.lng);
      if (state || country) {
        geocodedTrip.origin = { ...trip.origin, state, country };
      }
    }

    // Geocode destination
    if (trip.destination && trip.destination.lat && trip.destination.lng && !trip.destination.state) {
      const { state, country } = await geocodeCoordinates(trip.destination.lat, trip.destination.lng);
      if (state || country) {
        geocodedTrip.destination = { ...trip.destination, state, country };
      }
    }

    // Geocode stops
    if (trip.stops && Array.isArray(trip.stops)) {
      geocodedTrip.stops = await Promise.all(
        trip.stops.map(async (stop) => {
          if (stop.lat && stop.lng && !stop.state) {
            const { state, country } = await geocodeCoordinates(stop.lat, stop.lng);
            if (state || country) {
              return { ...stop, state, country };
            }
          }
          return stop;
        })
      );
    }

    geocodedTrips.push(geocodedTrip);
  }

  return geocodedTrips;
}

/**
 * Geocode a single trip's locations
 */
export async function geocodeSingleTrip(trip) {
  const geocodedTrip = { ...trip };

  // Geocode origin
  if (trip.origin && trip.origin.lat && trip.origin.lng && !trip.origin.state) {
    const { state, country } = await geocodeCoordinates(trip.origin.lat, trip.origin.lng);
    if (state || country) {
      geocodedTrip.origin = { ...trip.origin, state, country };
    }
  }

  // Geocode destination
  if (trip.destination && trip.destination.lat && trip.destination.lng && !trip.destination.state) {
    const { state, country } = await geocodeCoordinates(trip.destination.lat, trip.destination.lng);
    if (state || country) {
      geocodedTrip.destination = { ...trip.destination, state, country };
    }
  }

  // Geocode stops
  if (trip.stops && Array.isArray(trip.stops)) {
    geocodedTrip.stops = await Promise.all(
      trip.stops.map(async (stop) => {
        if (stop.lat && stop.lng && !stop.state) {
          const { state, country } = await geocodeCoordinates(stop.lat, stop.lng);
          if (state || country) {
            return { ...stop, state, country };
          }
        }
        return stop;
      })
    );
  }

  return geocodedTrip;
}
