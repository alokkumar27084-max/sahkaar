import { useState, useCallback } from "react";

export function useGeolocation() {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reverse Geocoding using Google Maps API
  const reverseGeocode = async (latitude, longitude) => {
    // If no key is configured in env, we just return a simulated mockup 
    // to allow development without keys breaking the app flow.
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      console.warn("No REACT_APP_GOOGLE_MAPS_KEY found. Using mock address.");
      return "Current GPS Location Area";
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        // Return the most specific formatted address
        return data.results[0].formatted_address;
      } else {
        console.error("Geocoding failed:", data.status);
        return "Unknown Location";
      }
    } catch (err) {
      console.error("Error fetching address:", err);
      return "Unknown Location";
    }
  };

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

        setLat(currentLat);
        setLng(currentLng);
        setAccuracy(position.coords.accuracy ?? null);

        // Fetch readable address string
        const formattedAddress = await reverseGeocode(currentLat, currentLng);
        setAddress(formattedAddress);

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
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { lat, lng, address, accuracy, error, loading, request, clearError };
}
