// ─────────────────────────────────────────────
// useGeolocation.js — Custom hook for GPS location
//
// Usage:
//   const { lat, lng, error, loading, request } = useGeolocation();
//
// Call request() to ask user for location permission.
// lat/lng update automatically once permission granted.
// ─────────────────────────────────────────────
import { useState, useCallback } from "react";

export function useGeolocation() {
  const [lat,     setLat]     = useState(null);
  const [lng,     setLng]     = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(() => {
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      // Success: user allowed location
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLoading(false);
      },
      // Error: user denied or something went wrong
      (err) => {
        const messages = {
          1: "Location permission denied. Please enable in browser settings.",
          2: "Location unavailable. Try again.",
          3: "Location request timed out.",
        };
        setError(messages[err.code] || "Failed to get location");
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }   // 10s timeout, cache 1 min
    );
  }, []);

  return { lat, lng, error, loading, request };
}
