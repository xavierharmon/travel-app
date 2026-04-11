import { computeTripMileage } from "@/utils/tripMileage";
import { TRAVEL_MODES } from "@/constants";

/**
 * Calculate dashboard statistics - simple metrics only
 * Shows: trip count, total miles, mileage breakdown by travel mode
 */
export function calculateDashboardStats(trips, games, memories) {
  return {
    trips: calculateTripStats(trips),
    games: calculateGameStats(games),
    memories: {
      total: memories.length,
    },
  };
}

function calculateTripStats(trips) {
  let totalMiles = 0;
  const milesByMode = {
    [TRAVEL_MODES.DRIVE]: 0,
    [TRAVEL_MODES.FLIGHT]: 0,
    [TRAVEL_MODES.BOAT]: 0,
    [TRAVEL_MODES.TRAIN]: 0,
  };

  // Calculate total miles and breakdown by travel mode
  for (const trip of trips) {
    const mileage = computeTripMileage(trip);
    if (mileage) {
      totalMiles += mileage.total || 0;
      // Map lowercase keys from computeTripMileage to uppercase TRAVEL_MODES constants
      if (mileage.drive) milesByMode[TRAVEL_MODES.DRIVE] += mileage.drive;
      if (mileage.flight) milesByMode[TRAVEL_MODES.FLIGHT] += mileage.flight;
      if (mileage.boat) milesByMode[TRAVEL_MODES.BOAT] += mileage.boat;
      if (mileage.train) milesByMode[TRAVEL_MODES.TRAIN] += mileage.train;
    }
  }

  return {
    totalTrips: trips.length,
    totalMiles: Math.round(totalMiles),
    milesByMode: {
      [TRAVEL_MODES.DRIVE]: Math.round(milesByMode[TRAVEL_MODES.DRIVE]),
      [TRAVEL_MODES.FLIGHT]: Math.round(milesByMode[TRAVEL_MODES.FLIGHT]),
      [TRAVEL_MODES.BOAT]: Math.round(milesByMode[TRAVEL_MODES.BOAT]),
      [TRAVEL_MODES.TRAIN]: Math.round(milesByMode[TRAVEL_MODES.TRAIN]),
    },
  };
}

function calculateGameStats(games) {
  const stats = {
    totalGames: games.length,
    wins: 0,
    losses: 0,
    ties: 0,
    winPercentage: 0,
    byCategory: {},
  };

  games.forEach(game => {
    if (game.outcome === "win") stats.wins++;
    if (game.outcome === "loss") stats.losses++;
    if (game.outcome === "tie") stats.ties++;

    // Group by sport/category
    const sport = game.sport || "Other";
    if (!stats.byCategory[sport]) {
      stats.byCategory[sport] = { wins: 0, losses: 0, ties: 0, total: 0 };
    }
    stats.byCategory[sport].total++;
    if (game.outcome === "win") stats.byCategory[sport].wins++;
    if (game.outcome === "loss") stats.byCategory[sport].losses++;
    if (game.outcome === "tie") stats.byCategory[sport].ties++;
  });

  if (stats.totalGames > 0) {
    stats.winPercentage = Math.round((stats.wins / stats.totalGames) * 100);
  }

  return stats;
}

/**
 * Get random photos from trips and memories for carousel
 */
export function getCarouselPhotos(trips, memories) {
  const allPhotos = [];

  // Extract from trips - both trip level and stop level photos
  trips.forEach(trip => {
    // Trip-level photos
    if (trip.photos && Array.isArray(trip.photos)) {
      trip.photos.forEach(photo => {
        allPhotos.push({
          ...photo,
          id: photo.id || photo, // Handle both objects and string IDs
          type: "trip",
          tripId: trip.id,
          tripName: trip.name,
        });
      });
    }

    // Stop-level photos
    if (trip.stops && Array.isArray(trip.stops)) {
      trip.stops.forEach(stop => {
        if (stop.photos && Array.isArray(stop.photos)) {
          stop.photos.forEach(photo => {
            allPhotos.push({
              ...photo,
              id: photo.id || photo, // Handle both objects and string IDs
              type: "trip",
              tripId: trip.id,
              tripName: trip.name,
            });
          });
        }
      });
    }
  });

  // Extract from memories
  memories.forEach(memory => {
    if (memory.photos && Array.isArray(memory.photos)) {
      memory.photos.forEach(photo => {
        allPhotos.push({
          ...photo,
          id: photo.id || photo, // Handle both objects and string IDs
          type: "memory",
          memoryId: memory.id,
          memoryTitle: memory.title,
        });
      });
    }
  });

  return allPhotos;
}
