let googleMapsLoaderPromise = null;

function getGoogleMapsKey() {
  return process.env.REACT_APP_GOOGLE_MAPS_KEY || "";
}

export function hasGoogleMapsKey() {
  return Boolean(getGoogleMapsKey());
}

export function loadGoogleMaps(libraries = ["places"]) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }

  const key = getGoogleMapsKey();
  if (!key) {
    return Promise.reject(new Error("Missing REACT_APP_GOOGLE_MAPS_KEY"));
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
 * Google Maps Geocoder is callback-based; awaiting it returns undefined, so we wrap it.
 */
function geocodeLatLngGoogle(geocoder, lat, lng) {
  return new Promise((resolve) => {
    const g = typeof window !== "undefined" ? window.google : null;
    if (!g?.maps) {
      resolve(null);
      return;
    }
    const location = { lat: Number(lat), lng: Number(lng) };
    geocoder.geocode({ location }, (results, status) => {
      if (status === g.maps.GeocoderStatus.OK && results?.[0]?.formatted_address) {
        resolve(results[0].formatted_address);
        return;
      }
      resolve(null);
    });
  });
}

/**
 * Free reverse geocoding when Google is unavailable or fails.
 * Nominatim policy: identify the app; use modest request rate.
 */
async function reverseGeocodeNominatim(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&format=json`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en,hi",
        // Required by Nominatim usage policy — must identify the application
        "User-Agent": "ThekedaarWebApp/1.0 (https://thekedaar.com)",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

export async function reverseGeocodeCoords(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const key = getGoogleMapsKey();
  if (key) {
    try {
      const google = await loadGoogleMaps(["places"]);
      const geocoder = new google.maps.Geocoder();
      const googleAddress = await geocodeLatLngGoogle(geocoder, latitude, longitude);
      if (googleAddress) return googleAddress;
    } catch {
      // fall through to Nominatim
    }
  }

  const osm = await reverseGeocodeNominatim(latitude, longitude);
  if (osm) return osm;

  return null;
}

function geocodePlaceIdPromise(geocoder, placeId) {
  return new Promise((resolve) => {
    const g = typeof window !== "undefined" ? window.google?.maps : null;
    if (!g) {
      resolve(null);
      return;
    }
    geocoder.geocode({ placeId }, (results, status) => {
      if (status !== g.GeocoderStatus.OK || !results?.[0]) {
        resolve(null);
        return;
      }
      const first = results[0];
      resolve({
        address: first.formatted_address,
        lat: first.geometry?.location?.lat?.() ?? null,
        lng: first.geometry?.location?.lng?.() ?? null,
      });
    });
  });
}

function geocodeAddressPromise(geocoder, address) {
  return new Promise((resolve) => {
    const g = typeof window !== "undefined" ? window.google?.maps : null;
    if (!g) {
      resolve(null);
      return;
    }
    geocoder.geocode({ address }, (results, status) => {
      if (status !== g.GeocoderStatus.OK || !results?.[0]) {
        resolve(null);
        return;
      }
      const first = results[0];
      resolve({
        address: first.formatted_address,
        lat: first.geometry?.location?.lat?.() ?? null,
        lng: first.geometry?.location?.lng?.() ?? null,
      });
    });
  });
}

export async function geocodePlaceSelection(selection) {
  if (!selection) return null;

  const google = await loadGoogleMaps(["places"]);
  const geocoder = new google.maps.Geocoder();

  if (selection.placeId) {
    return geocodePlaceIdPromise(geocoder, selection.placeId);
  }

  if (selection.address) {
    return geocodeAddressPromise(geocoder, selection.address);
  }

  return null;
}

export function formatDistance(distanceKm) {
  const value = Number(distanceKm);
  if (!Number.isFinite(value)) return null;
  return `${value.toFixed(1)} km`;
}
