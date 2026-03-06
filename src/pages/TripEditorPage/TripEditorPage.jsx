// src/pages/TripEditorPage/TripEditorPage.jsx
import { useState, useCallback } from "react";
import styles from "./TripEditorPage.module.css";
import { useTrips } from "@/hooks/useTrips";
import { generateId } from "@/utils/imageHelpers";
import TripEditor from "@/components/trips/TripEditor";
import Button from "@/components/common/Button";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

export default function TripEditorPage({ trip, onBack, onViewMap }) {
  const { isReady, error: mapsError } = useGoogleMaps();
  const { addTrip, updateTrip } = useTrips();

  // isNew is based on whether the trip coming in has an id
  const isNew = !trip?.id;

  const [form, setForm] = useState(() =>
    trip ? { ...trip } : {
      id:          null,
      name:        "",
      date:        new Date().toISOString().slice(0, 10),
      description: "",
      photos:      [],
      origin:      null,
      destination: null,
      stops:       [],
    }
  );

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

        {/* Maps loading */}
        {!isReady && !mapsError && (
          <p style={{
            color: "var(--color-text-muted)",
            fontSize: 13,
            marginBottom: 12
          }}>
            Loading location search…
          </p>
        )}

        {/* Maps error */}
        {mapsError && (
          <p style={{
            color: "var(--color-danger)",
            fontSize: 13,
            marginBottom: 12
          }}>
            {mapsError}
          </p>
        )}

        {/* Validation errors */}
        {errors.name && (
          <div style={{
            background:   "rgba(239,68,68,0.1)",
            border:       "1px solid var(--color-danger)",
            borderRadius: "var(--radius-md)",
            padding:      "10px 14px",
            marginBottom: 12,
            fontSize:     13,
            color:        "var(--color-danger)"
          }}>
            ⚠ {errors.name}
          </div>
        )}

        {/* Form */}
        {isReady && (
          <TripEditor
            form={form}
            errors={errors}
            onChange={handleFormChange}
          />
        )}

        {/* Bottom save */}
        <div className={styles.bottomActions}>
          <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
            {isNew ? "Save Trip" : "Update Trip"}
          </Button>
        </div>

      </div>
    </div>
  );
}