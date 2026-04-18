import { useState, useCallback } from "react";
import { reverseGeocodeCoords } from "../utils/googleMaps";

function formatCoordinateFallback(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return "Location detected";
  return `Near ${la.toFixed(5)}, ${lo.toFixed(5)}`;
}

export function useGeolocation() {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const applyLocation = useCallback(async (nextLat, nextLng, nextAccuracy = null, nextAddress = null) => {
    setLat(nextLat);
    setLng(nextLng);
    setAccuracy(nextAccuracy);

    const formattedAddress =
      nextAddress ||
      (await reverseGeocodeCoords(nextLat, nextLng)) ||
      formatCoordinateFallback(nextLat, nextLng);
    setAddress(formattedAddress);
    return formattedAddress;
  }, []);

  const request = useCallback((options = {}) => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        await applyLocation(currentLat, currentLng, position.coords.accuracy ?? null);
        setLoading(false);
      },
      (err) => {
        const messages = {
          1: "Location permission denied. Please enable in browser settings.",
          2: "Location unavailable. Try again.",
          3: "Location request timed out.",
        };
        setError(messages[err.code] || "Failed to get location");
        setLoading(false);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 15000,
        maximumAge: options.maximumAge ?? 0,
      }
    );
  }, [applyLocation]);

  const clearError = useCallback(() => setError(null), []);

  return { lat, lng, address, accuracy, error, loading, request, applyLocation, clearError };
}
