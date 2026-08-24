// ─────────────────────────────────────────────────────────
// googleMaps.js — Unified Google Maps & Geocoding Utilities
// ─────────────────────────────────────────────────────────

let googleMapsLoaderPromise = null;

export const GOOGLE_MAPS_API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
  process.env.REACT_APP_GOOGLE_MAPS_KEY ||
  "AIzaSyD4nY3rgedgYR7EmrGE2ueuun3yZ3MGxFQ";

export function getGoogleMapsKey() {
  return GOOGLE_MAPS_API_KEY;
}

export function hasGoogleMapsKey() {
  return Boolean(getGoogleMapsKey());
}

export function loadGoogleMaps(libraries = ["places", "geometry"]) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }

  const key = getGoogleMapsKey();
  if (!key) {
    return Promise.reject(new Error("Missing Google Maps API Key"));
  }

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps-loader="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      libraries: libraries.join(","),
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.body.appendChild(script);
  });

  return googleMapsLoaderPromise;
}

/**
 * Reverse geocodes lat/lng into a full, precise formatted address string.
 */
export async function reverseGeocodeCoords(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;

  // 1. Google Maps JS SDK Geocoder (if loaded in window)
  if (window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const res = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat: nLat, lng: nLng } }, (results, status) => {
          if (status === "OK" && results?.[0]) resolve(results[0]);
          else reject(new Error(status));
        });
      });
      if (res?.formatted_address) {
        return {
          formatted_address: res.formatted_address,
          short_name: extractShortLocality(res) || res.formatted_address.split(",")[0],
          lat: nLat,
          lng: nLng,
        };
      }
    } catch (err) {
      console.warn("Google JS SDK reverse geocode fallback:", err);
    }
  }

  // 2. Direct Google Maps Geocoding API HTTP Request (Dual-Layer)
  const apiKey = getGoogleMapsKey();
  if (apiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${nLat},${nLng}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results?.[0]) {
          const first = data.results[0];
          return {
            formatted_address: first.formatted_address,
            short_name: extractShortLocality(first) || first.formatted_address.split(",")[0],
            lat: nLat,
            lng: nLng,
          };
        }
      }
    } catch (err) {
      console.warn("Google HTTP geocode fallback:", err);
    }
  }

  // 3. Robust OpenStreetMap Nominatim with proper headers & address reconstruction
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${nLat}&lon=${nLng}&format=json&addressdetails=1`
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data?.display_name) {
        const addr = data.address || {};
        const landmark = addr.amenity || addr.building || addr.shop || "";
        const road = addr.road || addr.street || "";
        const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || "";
        const city = addr.city || addr.town || addr.county || "Bhopal";
        const state = addr.state || "Madhya Pradesh";
        const pin = addr.postcode || "";

        const parts = [landmark, road, locality, city, state, pin].filter(Boolean);
        const detailedAddress = parts.length > 2 ? parts.join(", ") : data.display_name;
        const short = locality ? `${locality}, ${city}` : (city || "Current Location");

        return {
          formatted_address: detailedAddress,
          short_name: short,
          lat: nLat,
          lng: nLng,
        };
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error:", err);
  }

  // 4. BigDataCloud Reverse Geocoding Fallback
  try {
    const resp = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${nLat}&longitude=${nLng}&localityLanguage=en`
    );
    if (resp.ok) {
      const d = await resp.json();
      const locality = d.locality || d.city || "";
      const principal = d.principalSubdivision || "";
      const country = d.countryName || "India";
      if (locality) {
        return {
          formatted_address: `${locality}, ${principal}, ${country}`,
          short_name: locality,
          lat: nLat,
          lng: nLng,
        };
      }
    }
  } catch (err) {
    console.warn("BigDataCloud reverse geocode error:", err);
  }

  return {
    formatted_address: `Bhopal, Madhya Pradesh (${nLat.toFixed(4)}, ${nLng.toFixed(4)})`,
    short_name: "Bhopal",
    lat: nLat,
    lng: nLng,
  };
}

function extractShortLocality(geoResult) {
  if (!geoResult?.address_components) return null;
  const comps = geoResult.address_components;

  const sublocality = comps.find((c) =>
    c.types.includes("sublocality_level_1") || c.types.includes("sublocality") || c.types.includes("neighborhood")
  )?.long_name;

  const city = comps.find((c) =>
    c.types.includes("locality") || c.types.includes("administrative_area_level_2")
  )?.long_name;

  if (sublocality && city) return `${sublocality}, ${city}`;
  if (sublocality) return sublocality;
  if (city) return city;
  return null;
}

/**
 * Geocodes a place selection from autocomplete predictions.
 */
export async function geocodePlaceSelection(selection) {
  if (!selection) return null;

  if (selection.lat && selection.lng) {
    return {
      address: selection.description || selection.name || selection.address,
      lat: Number(selection.lat),
      lng: Number(selection.lng),
    };
  }

  if (selection.place_id && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const res = await new Promise((resolve, reject) => {
        geocoder.geocode({ placeId: selection.place_id }, (results, status) => {
          if (status === "OK" && results?.[0]) resolve(results[0]);
          else reject(new Error(status));
        });
      });

      if (res) {
        return {
          address: res.formatted_address || selection.description,
          lat: res.geometry.location.lat(),
          lng: res.geometry.location.lng(),
        };
      }
    } catch (err) {
      console.warn("Google geocode place error:", err);
    }
  }

  return {
    address: selection.description || selection.name || "Selected Location",
    lat: Number(selection.lat || 23.2599),
    lng: Number(selection.lng || 77.4126),
  };
}

/**
 * Geocodes a plain text address into lat/lng and formatted address.
 */
export async function geocodeAddressText(addressText) {
  if (!addressText || !addressText.trim()) return null;

  if (window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const res = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: addressText, componentRestrictions: { country: "in" } }, (results, status) => {
          if (status === "OK" && results?.[0]) resolve(results[0]);
          else reject(new Error(status));
        });
      });

      if (res) {
        return {
          address: res.formatted_address,
          lat: res.geometry.location.lat(),
          lng: res.geometry.location.lng(),
        };
      }
    } catch (err) {
      console.warn("Google geocode text error:", err);
    }
  }

  // Fallback to OpenStreetMap search
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressText)}&countrycodes=in&format=json&limit=1`
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data && data[0]) {
        return {
          address: data[0].display_name,
          lat: Number(data[0].lat),
          lng: Number(data[0].lon),
        };
      }
    }
  } catch (err) {
    console.warn("Nominatim geocode text error:", err);
  }

  return null;
}

/**
 * Calculate precise distance between two coordinates in Kilometers using Haversine formula
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const pLat1 = Number(lat1);
  const pLon1 = Number(lon1);
  const pLat2 = Number(lat2);
  const pLon2 = Number(lon2);

  if (!Number.isFinite(pLat1) || !Number.isFinite(pLon1) || !Number.isFinite(pLat2) || !Number.isFinite(pLon2)) {
    return null;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = ((pLat2 - pLat1) * Math.PI) / 180;
  const dLon = ((pLon2 - pLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pLat1 * Math.PI) / 180) *
      Math.cos((pLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(Number(distanceKm))) {
    return null;
  }
  const d = Number(distanceKm);
  if (d < 0.1) {
    return "< 100m away";
  }
  if (d < 1) {
    return `${Math.round(d * 1000)}m away`;
  }
  return `${d.toFixed(1)} km away`;
}
