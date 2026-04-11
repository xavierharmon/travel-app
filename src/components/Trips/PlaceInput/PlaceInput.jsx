import { useRef, useEffect } from "react";
import styles from "./PlaceInput.module.css";
import { geocodeCoordinates } from "@/utils/geocodeCoordinates";

export default function PlaceInput({ label, value, onSelect, placeholder }) {
  const inputRef    = useRef(null);
  const acRef       = useRef(null);
  const onSelectRef = useRef(onSelect);
  const debounceRef = useRef(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (inputRef.current && value?.name !== undefined) {
      inputRef.current.value = value.name;
    }
  }, [value?.name]);

  useEffect(() => {
    if (!window.google || acRef.current) return;

    acRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode", "establishment"],
        // Request all address components to extract state/country info
        fields: ["formatted_address", "geometry", "name", "address_components"],
      }
    );

    acRef.current.addListener("place_changed", async () => {
      const place = acRef.current.getPlace();
      if (place?.geometry) {
        // Extract state and country from address_components
        let state = null;
        let country = null;

        if (place.address_components && Array.isArray(place.address_components)) {
          place.address_components.forEach(component => {
            if (component.types.includes("administrative_area_level_1")) {
              state = component.short_name;
            }
            if (component.types.includes("country")) {
              country = component.short_name;
            }
          });
        }

        // If we didn't get state/country from address_components, geocode the coordinates
        if (!state || !country) {
          const geocoded = await geocodeCoordinates(
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
          if (geocoded.state && !state) state = geocoded.state;
          if (geocoded.country && !country) country = geocoded.country;
        }

        onSelectRef.current({
          name: place.formatted_address || place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          state: state,
          country: country,
          formatted_address: place.formatted_address,
          address_components: place.address_components,
        });
      }
    });
  }, []);

  // Debounce handler — only processes input after user pauses typing
  function handleInput() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Autocomplete handles its own requests, but this prevents
      // any additional processing from firing on every keystroke
    }, 300);
  }

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        ref={inputRef}
        defaultValue={value?.name || ""}
        placeholder={placeholder}
        className={styles.input}
        onInput={handleInput}
      />
    </div>
  );
}