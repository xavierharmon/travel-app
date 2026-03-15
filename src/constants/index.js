// src/constants/index.js  (add GAMES and GAME_EDIT to the VIEWS object)
export const STORAGE_KEY     = "road_trip_memories_v1";
export const ROUTE_CACHE_KEY = "road_trip_routes_v1";

export const VIEWS = {
  LIST:      "list",
  EDIT:      "edit",
  MAP:       "map",
  HISTORY:   "history",
  GAMES:     "games",
  GAME_EDIT: "game_edit",
};

export const STOP_COLORS = {
  ORIGIN:      "#22c55e",
  STOP:        "#6366f1",
  DESTINATION: "#ef4444",
};

export const TRAVEL_MODES = {
  DRIVE:  "DRIVE",
  FLIGHT: "FLIGHT",
  BOAT:   "BOAT",
  TRAIN:  "TRAIN",
};

export const TRAVEL_MODE_COLORS = {
  DRIVE:  "#6366f1",
  FLIGHT: "#f59e0b",
  BOAT:   "#06b6d4",
  TRAIN:  "#50C878",
};

export const TRAVEL_MODE_LABELS = {
  DRIVE:  "🚗 Drive",
  FLIGHT: "✈️ Flight",
  BOAT:   "⛵ Boat",
  TRAIN:  "🚞 Train",
};

export const MAP_DEFAULTS = {
  CENTER: { lat: 39.5, lng: -98.35 },
  ZOOM:   4,
};

export const MAX_PHOTOS_PREVIEW  = 5;
export const MAX_IMAGE_SIZE_MB   = 1;
export const MAX_IMAGE_DIMENSION = 1200;