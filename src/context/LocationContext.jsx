import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { loadGoogleMaps } from "../utils/googleMapsLoader";
import { reverseGeocodeCoords } from "../utils/googleMaps";

const LOCATION_STORAGE_KEY = "sahkaar:user-location";

export const POPULAR_LOCALITIES = [
  { id: "arera_colony", name: "Arera Colony, Bhopal", shortName: "Arera Colony", lat: 23.2156, lng: 77.4305, district: "Bhopal" },
  { id: "mp_nagar", name: "MP Nagar, Bhopal", shortName: "MP Nagar", lat: 23.2332, lng: 77.4343, district: "Bhopal" },
  { id: "kolar_road", name: "Kolar Road, Bhopal", shortName: "Kolar Road", lat: 23.1765, lng: 77.4182, district: "Bhopal" },
  { id: "tt_nagar", name: "TT Nagar / New Market", shortName: "TT Nagar", lat: 23.2386, lng: 77.3996, district: "Bhopal" },
  { id: "hoshangabad_rd", name: "Hoshangabad Road, Bhopal", shortName: "Hoshangabad Rd", lat: 23.1923, lng: 77.4485, district: "Bhopal" },
  { id: "shahpura", name: "Shahpura, Bhopal", shortName: "Shahpura", lat: 23.1950, lng: 77.4250, district: "Bhopal" },
  { id: "indrapuri_bhel", name: "Indrapuri / BHEL, Bhopal", shortName: "Indrapuri BHEL", lat: 23.2514, lng: 77.4721, district: "Bhopal" },
  { id: "ayodhya_bypass", name: "Ayodhya Bypass, Bhopal", shortName: "Ayodhya Bypass", lat: 23.2785, lng: 77.4623, district: "Bhopal" },
  { id: "vijay_nagar_indore", name: "Vijay Nagar, Indore", shortName: "Vijay Nagar", lat: 22.7533, lng: 75.8937, district: "Indore" },
  { id: "palasia_indore", name: "Palasia, Indore", shortName: "Palasia", lat: 22.7244, lng: 75.8839, district: "Indore" },
  { id: "city_center_gwalior", name: "City Center, Gwalior", shortName: "City Center", lat: 26.2037, lng: 78.1942, district: "Gwalior" },
  { id: "civil_lines_jabalpur", name: "Civil Lines, Jabalpur", shortName: "Civil Lines", lat: 23.1645, lng: 79.9442, district: "Jabalpur" },
];

const DEFAULT_LOCATION = {
  name: "Bhopal, Madhya Pradesh",
  shortName: "Bhopal",
  lat: 23.2599,
  lng: 77.4126,
  radius_km: 15,
  isGPS: false,
};

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [placePredictions, setPlacePredictions] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);

  // Initialize Google Maps SDK
  useEffect(() => {
    loadGoogleMaps()
      .then((google) => {
        setMapsLoaded(true);
        if (google.maps.places) {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
        geocoderRef.current = new google.maps.Geocoder();
      })
      .catch((err) => {
        console.warn("Google Maps load warning:", err);
      });
  }, []);

  const saveLocation = useCallback((newLoc) => {
    setLocationState(newLoc);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLoc));
    } catch (e) {
      /* ignore storage quota */
    }
  }, []);

  const selectLocality = useCallback((locality) => {
    const next = {
      name: locality.name,
      shortName: locality.shortName || locality.name.split(",")[0],
      lat: Number(locality.lat),
      lng: Number(locality.lng),
      radius_km: locality.radius_km || 15,
      isGPS: false,
    };
    saveLocation(next);
    setIsModalOpen(false);
    toast.success(`Location set to ${next.shortName}`);
  }, [saveLocation]);

  // Google Places Autocomplete Query
  const searchGooglePlaces = useCallback((query) => {
    if (!query || query.trim().length < 2) {
      setPlacePredictions([]);
      return;
    }

    if (!autocompleteServiceRef.current) {
      setPlacePredictions([]);
      return;
    }

    setSearchingPlaces(true);
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "in" },
      },
      (predictions, status) => {
        setSearchingPlaces(false);
        if (status === window.google?.maps?.places?.PlacesServiceStatus?.OK && predictions) {
          setPlacePredictions(predictions);
        } else {
          setPlacePredictions([]);
        }
      }
    );
  }, []);

  // Geocode Google Place Prediction
  const selectGooglePlace = useCallback((prediction) => {
    if (!geocoderRef.current) {
      // Fallback
      selectLocality({ name: prediction.description });
      return;
    }

    geocoderRef.current.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const place = results[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        const sublocality = place.address_components?.find((c) =>
          c.types.includes("sublocality_level_1") || c.types.includes("sublocality") || c.types.includes("neighborhood")
        )?.long_name;

        const city = place.address_components?.find((c) =>
          c.types.includes("locality") || c.types.includes("administrative_area_level_2")
        )?.long_name;

        const short = sublocality || city || prediction.structured_formatting?.main_text || prediction.description.split(",")[0];

        const next = {
          name: place.formatted_address || prediction.description,
          shortName: short,
          lat,
          lng,
          radius_km: 15,
          isGPS: false,
          place_id: prediction.place_id,
        };

        saveLocation(next);
        setPlacePredictions([]);
        setIsModalOpen(false);
        toast.success(`Location set to ${short}`);
      } else {
        toast.error("Could not fetch location coordinates. Please try again.");
      }
    });
  }, [saveLocation, selectLocality]);

  // High Precision GPS Detection with Google Reverse Geocoding
  const detectGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your device");
      return;
    }

    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const geo = await reverseGeocodeCoords(lat, lng);

        const next = {
          name: geo?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          shortName: geo?.short_name || "Current Location",
          lat,
          lng,
          radius_km: 15,
          isGPS: true,
        };

        saveLocation(next);
        setDetectingGPS(false);
        setIsModalOpen(false);
        toast.success(`Detected: ${next.shortName}`);
      },
      (err) => {
        setDetectingGPS(false);
        console.error("GPS error:", err);
        if (err.code === 1) {
          toast.error("Location permission denied. Please allow location access or choose an area manually.");
        } else {
          toast.error("Could not fetch GPS location. Please select an area manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [saveLocation]);

  const openLocationModal = () => setIsModalOpen(true);
  const closeLocationModal = () => setIsModalOpen(false);

  return (
    <LocationContext.Provider
      value={{
        location,
        isModalOpen,
        openLocationModal,
        closeLocationModal,
        selectLocality,
        detectGPSLocation,
        detectingGPS,
        popularLocalities: POPULAR_LOCALITIES,
        searchGooglePlaces,
        selectGooglePlace,
        placePredictions,
        searchingPlaces,
        mapsLoaded,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return ctx;
}
