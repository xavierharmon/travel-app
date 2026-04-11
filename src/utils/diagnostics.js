/**
 * Diagnostic utility to inspect trip data structure
 */

export function inspectTripLocations(trips) {
  console.group("[Diagnostics] Trip Location Structure");
  
  trips.forEach((trip, tripIdx) => {
    console.log(`Trip ${tripIdx}: "${trip.name}"`);
    
    if (trip.origin) {
      console.log(`  Origin:`, {
        name: trip.origin.name,
        hasLat: trip.origin.lat !== undefined,
        hasLng: trip.origin.lng !== undefined,
        hasState: trip.origin.state !== undefined,
        hasCountry: trip.origin.country !== undefined,
      });
    }
    
    if (trip.stops && trip.stops.length > 0) {
      console.log(`  Stops (${trip.stops.length}):`);
      trip.stops.forEach((stop, stopIdx) => {
        console.log(`    Stop ${stopIdx}: "${stop.name}"`, {
          hasLat: stop.lat !== undefined,
          hasLng: stop.lng !== undefined,
          hasState: stop.state !== undefined,
          hasCountry: stop.country !== undefined,
        });
      });
    }
    
    if (trip.destination) {
      console.log(`  Destination:`, {
        name: trip.destination.name,
        hasLat: trip.destination.lat !== undefined,
        hasLng: trip.destination.lng !== undefined,
        hasState: trip.destination.state !== undefined,
        hasCountry: trip.destination.country !== undefined,
      });
    }
  });
  
  console.groupEnd();
}

export function analyzeStats(stats) {
  console.group("[Diagnostics] Stats Analysis");
  
  console.log("States visited:", stats.trips.statesVisited);
  console.log("Countries visited:", stats.trips.countriesVisited);
  console.log("Total trips:", stats.trips.totalTrips);
  console.log("Total miles:", stats.trips.totalMiles);
  console.log("Total memories:", stats.memories.total);
  console.log("Total games:", stats.games.totalGames);
  
  console.groupEnd();
}
