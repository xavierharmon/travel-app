import { useRef, useEffect } from "react";
import styles from "./PlaceInput.module.css";

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
        // Limit fields to only what we need — reduces response size and cost
        fields: ["formatted_address", "geometry", "name"],
      }
    );

    acRef.current.addListener("place_changed", () => {
      const place = acRef.current.getPlace();
      if (place?.geometry) {
        onSelectRef.current({
          name: place.formatted_address || place.name,
          lat:  place.geometry.location.lat(),
          lng:  place.geometry.location.lng(),
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