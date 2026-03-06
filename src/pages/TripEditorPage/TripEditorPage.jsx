// src/pages/TripEditorPage/TripEditorPage.jsx
import { useState, useCallback } from "react";
import styles from "./TripEditorPage.module.css";
import { useTrips } from "@/hooks/useTrips";
import { generateId } from "@/utils/imageHelpers";
import TripEditor from "@/components/trips/TripEditor";
import Button from "@/components/common/Button";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { TRAVEL_MODES } from "@/constants";

export default function TripEditorPage({ trip, onBack, onViewMap }) {
  const { isReady, error: mapsError } = useGoogleMaps();
  const { addTrip, updateTrip }       = useTrips();
  const isNew                         = !trip?.id;

  const [form, setForm] = useState(() => {
    if (!trip) {
      // Brand new trip — blank slate
      return {
        id:                   null,
        name:                 "",
        date:                 new Date().toISOString().slice(0, 10),
        description:          "",
        photos:               [],
        origin:               null,
        destination:          null,
        destinationTravelMode: TRAVEL_MODES.DRIVE,
        stops:                [],
      };
    }
    // Editing existing trip — spread to avoid mutating original
    return {
      ...trip,
      // Make sure newer fields exist even on older saved trips
      destinationTravelMode: trip.destinationTravelMode || TRAVEL_MODES.DRIVE,
      stops: (trip.stops || []).map(s => ({
        ...s,
        travelMode: s.travelMode || TRAVEL_MODES.DRIVE,
      })),
    };
  });

  const [errors, setErrors] = useState({});

  const handleFormChange = useCallback((updated) => {
    setForm(updated);
  }, []);

  function validate() {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Trip name is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (isNew) {
      addTrip({ ...form, id: generateId() });
    } else {
      updateTrip({ ...form });
    }
    onBack();
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <div className={styles.topActions}>
            <Button variant="secondary" onClick={() => onViewMap(form)}>
              Preview Map
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {isNew ? "Save Trip" : "Update Trip"}
            </Button>
          </div>
        </div>

        {/* Maps loading state */}
        {!isReady && !mapsError && (
          <p style={{
            color:        "var(--color-text-muted)",
            fontSize:     13,
            marginBottom: 12,
          }}>
            Loading location search…
          </p>
        )}

        {/* Maps error state */}
        {mapsError && (
          <div style={{
            background:   "rgba(239,68,68,0.1)",
            border:       "1px solid var(--color-danger)",
            borderRadius: "var(--radius-md)",
            padding:      "10px 14px",
            marginBottom: 12,
            fontSize:     13,
            color:        "var(--color-danger)",
          }}>
            ⚠ {mapsError}
            <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              Location search is unavailable but you can still edit other
              trip details and save.
            </p>
          </div>
        )}

        {/* Validation error */}
        {errors.name && (
          <div style={{
            background:   "rgba(239,68,68,0.1)",
            border:       "1px solid var(--color-danger)",
            borderRadius: "var(--radius-md)",
            padding:      "10px 14px",
            marginBottom: 12,
            fontSize:     13,
            color:        "var(--color-danger)",
          }}>
            ⚠ {errors.name}
          </div>
        )}

        {/*
          Render the form in two cases:
          1. Maps is ready — full form with working autocomplete
          2. Maps errored — still show form so user can edit non-location fields
          Only hide while Maps is actively loading
        */}
        {(isReady || mapsError) && (
          <TripEditor
            form={form}
            errors={errors}
            onChange={handleFormChange}
          />
        )}

        {/* Bottom save button */}
        <div className={styles.bottomActions}>
          <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
            {isNew ? "Save Trip" : "Update Trip"}
          </Button>
        </div>

      </div>
    </div>
  );
}