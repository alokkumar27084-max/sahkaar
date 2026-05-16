import React, { useEffect, useMemo, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { geocodePlaceSelection, hasGoogleMapsKey, loadGoogleMaps } from "../../utils/googleMaps";

export default function LocationSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Search your area, landmark, or address",
  disabled = false,
  className = "",
}) {
  const [predictions, setPredictions] = useState([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const canUseGoogleMaps = useMemo(() => hasGoogleMapsKey(), []);

  useEffect(() => {
    let mounted = true;
    if (!canUseGoogleMaps) return undefined;

    loadGoogleMaps(["places"])
      .then(() => {
        if (mounted) setMapsReady(true);
      })
      .catch(() => {
        if (mounted) setMapsReady(false);
      });

    return () => {
      mounted = false;
    };
  }, [canUseGoogleMaps]);

  useEffect(() => {
    let active = true;
    if (!mapsReady || !value || value.trim().length < 3) {
      setPredictions([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoadingPredictions(true);
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: value,
            componentRestrictions: { country: "in" },
            types: ["geocode"],
          },
          (results, status) => {
            if (!active) return;
            if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
              setPredictions([]);
              setLoadingPredictions(false);
              return;
            }
            setPredictions(results.slice(0, 5));
            setLoadingPredictions(false);
          }
        );
      } catch {
        if (active) {
          setPredictions([]);
          setLoadingPredictions(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mapsReady, value]);

  async function handlePredictionClick(prediction) {
    const result = await geocodePlaceSelection({
      placeId: prediction.place_id,
      address: prediction.description,
    });
    if (!result) return;
    onChange?.(result.address);
    setPredictions([]);
    onSelect?.(result);
  }

  return (
    <div className="relative">
      <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`input-field !pl-10 ${className}`}
      />

      {canUseGoogleMaps && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handlePredictionClick(prediction)}
              className="flex w-full items-start gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left text-sm text-[var(--color-body)] transition-colors last:border-b-0 hover:bg-[var(--color-primary)]/5"
            >
              <FiMapPin className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
              <span>{prediction.description}</span>
            </button>
          ))}
        </div>
      )}

      {!canUseGoogleMaps && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Add `REACT_APP_GOOGLE_MAPS_KEY` to enable live address suggestions.
        </p>
      )}

      {loadingPredictions && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">Searching nearby places...</p>
      )}
    </div>
  );
}
