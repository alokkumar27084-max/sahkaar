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

  // Robust OpenStreetMap Nominatim Prediction Fetcher
  const fetchNominatimPredictions = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=5`;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Accept-Language": "en,hi",
          "User-Agent": "ThekedaarWebApp/1.0 (https://thekedaar.com)",
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).map((item) => ({
        place_id: String(item.place_id),
        description: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
        source: "nominatim",
      }));
    } catch (err) {
      console.error("Nominatim suggestion fetch failed", err);
      return [];
    }
  };

  useEffect(() => {
    let active = true;
    if (!value || value.trim().length < 3) {
      setPredictions([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setLoadingPredictions(true);
      
      // 1. Try Google Autocomplete if maps ready
      if (mapsReady && typeof window !== "undefined" && window.google?.maps?.places) {
        try {
          // Check if modern AutocompleteSuggestion fetcher exists (Places API New)
          if (window.google.maps.places.Place && typeof window.google.maps.places.Place.findAutocompletePredictions === "function") {
            const { predictions: newPredictions } = await window.google.maps.places.Place.findAutocompletePredictions({
              input: value,
              includedCountries: ["in"],
            });
            if (active && newPredictions && newPredictions.length > 0) {
              setPredictions(
                newPredictions.slice(0, 5).map((pred) => ({
                  place_id: pred.placeId,
                  description: pred.text.toString(),
                  source: "google_new",
                }))
              );
              setLoadingPredictions(false);
              return;
            }
          }

          // Fallback to legacy AutocompleteService
          const service = new window.google.maps.places.AutocompleteService();
          service.getPlacePredictions(
            {
              input: value,
              componentRestrictions: { country: "in" },
              types: ["geocode"],
            },
            async (results, status) => {
              if (!active) return;
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                setPredictions(results.slice(0, 5));
                setLoadingPredictions(false);
              } else {
                // If legacy AutocompleteService fails, use Nominatim as a robust fallback
                const osmPredictions = await fetchNominatimPredictions(value);
                if (active) {
                  setPredictions(osmPredictions);
                  setLoadingPredictions(false);
                }
              }
            }
          );
          return;
        } catch (err) {
          console.error("Google maps prediction error, falling back to Nominatim", err);
        }
      }

      // 2. OpenStreetMap Nominatim fallback (if maps not ready, restricted or failed)
      const osmPredictions = await fetchNominatimPredictions(value);
      if (active) {
        setPredictions(osmPredictions);
        setLoadingPredictions(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mapsReady, value]);

  async function handlePredictionClick(prediction) {
    if (prediction.source === "nominatim") {
      onChange?.(prediction.description);
      setPredictions([]);
      onSelect?.({
        address: prediction.description,
        lat: prediction.lat,
        lng: prediction.lng,
      });
      return;
    }

    const result = await geocodePlaceSelection({
      placeId: prediction.place_id,
      address: prediction.description,
    });
    
    if (result) {
      onChange?.(result.address);
      setPredictions([]);
      onSelect?.(result);
      return;
    }

    // Geocoding fallback if Google Geocoding fails
    const osmResults = await fetchNominatimPredictions(prediction.description);
    if (osmResults.length > 0) {
      const first = osmResults[0];
      onChange?.(first.description);
      setPredictions([]);
      onSelect?.({
        address: first.description,
        lat: first.lat,
        lng: first.lng,
      });
    }
  }

  const handleKeyDown = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // If we have predictions, select the first prediction immediately
      if (predictions.length > 0) {
        handlePredictionClick(predictions[0]);
      } else if (value && value.trim().length > 0) {
        // Otherwise, geocode the exact raw text typed by the user
        setLoadingPredictions(true);
        try {
          if (mapsReady && typeof window !== "undefined" && window.google?.maps) {
            const result = await geocodePlaceSelection({ address: value });
            if (result) {
              onChange?.(result.address);
              onSelect?.(result);
              setPredictions([]);
              return;
            }
          }
          const osmResults = await fetchNominatimPredictions(value);
          if (osmResults.length > 0) {
            handlePredictionClick(osmResults[0]);
          }
        } catch (err) {
          console.error("Geocoding failed", err);
        } finally {
          setLoadingPredictions(false);
        }
      }
    }
  };

  return (
    <div className="relative w-full">
      <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`input-field !pl-10 ${className}`}
      />

      {predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[110] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl max-h-60 overflow-y-auto">
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

      {loadingPredictions && (
        <p className="mt-2 text-xs text-[var(--color-muted)]">Searching nearby places...</p>
      )}
    </div>
  );
}
