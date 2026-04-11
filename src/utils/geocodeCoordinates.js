/**
 * Reverse geocode coordinates using Google Maps Geocoding API
 * Returns an object with extracted state and country information
 * Results are cached in memory to avoid duplicate API calls
 */

// Simple in-memory cache for geocoding results
const geocodeCache = new Map();

export function clearGeocodeCache() {
  geocodeCache.clear();
}

// Wait for Google Maps to be available
async function waitForGoogleMaps(maxWait = 5000) {
  const startTime = Date.now();
  while (!window.google?.maps?.Geocoder) {
    if (Date.now() - startTime > maxWait) {
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return true;
}

export async function geocodeCoordinates(lat, lng) {
  try {
    // Check cache first
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey);
    }

    // Wait for Google Maps to be available
    const isReady = await waitForGoogleMaps();
    if (!isReady || !window.google?.maps?.Geocoder) {
      console.warn("[geocodeCoordinates] Google Maps not available after waiting");
      return { state: null, country: null };
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          let state = null;
          let country = null;

          // Check all results for state and country components
          // Usually the most detailed result (first one) has the most info
          for (const result of results) {
            if (!state || !country) {
              for (const component of result.address_components || []) {
                if (component.types.includes("administrative_area_level_1") && !state) {
                  state = component.short_name;
                }
                if (component.types.includes("country") && !country) {
                  country = component.short_name;
                }
              }
            }
          }

          const result_obj = { state, country };
          geocodeCache.set(cacheKey, result_obj);
          console.log("[geocodeCoordinates] Geocoded", cacheKey, "→", result_obj);
          resolve(result_obj);
        } else {
          console.warn("[geocodeCoordinates] Geocoding failed for", cacheKey, "status:", status);
          const result_obj = { state: null, country: null };
          geocodeCache.set(cacheKey, result_obj);
          resolve(result_obj);
        }
      });
    });
  } catch (err) {
    console.error("[geocodeCoordinates] Error:", err);
    return { state: null, country: null };
  }
}
