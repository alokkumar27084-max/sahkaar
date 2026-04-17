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

export async function reverseGeocodeCoords(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  try {
    const google = await loadGoogleMaps(["places"]);
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
    return result.results?.[0]?.formatted_address || null;
  } catch {
    const key = getGoogleMapsKey();
    if (!key) return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`
      );
      const data = await response.json();
      return data.results?.[0]?.formatted_address || null;
    } catch {
      return null;
    }
  }
}

export async function geocodePlaceSelection(selection) {
  if (!selection) return null;

  const google = await loadGoogleMaps(["places"]);
  const geocoder = new google.maps.Geocoder();

  if (selection.placeId) {
    const result = await geocoder.geocode({ placeId: selection.placeId });
    const first = result.results?.[0];
    if (!first) return null;
    return {
      address: first.formatted_address,
      lat: first.geometry?.location?.lat?.() ?? null,
      lng: first.geometry?.location?.lng?.() ?? null,
    };
  }

  if (selection.address) {
    const result = await geocoder.geocode({ address: selection.address });
    const first = result.results?.[0];
    if (!first) return null;
    return {
      address: first.formatted_address,
      lat: first.geometry?.location?.lat?.() ?? null,
      lng: first.geometry?.location?.lng?.() ?? null,
    };
  }

  return null;
}

export function formatDistance(distanceKm) {
  const value = Number(distanceKm);
  if (!Number.isFinite(value)) return null;
  return `${value.toFixed(1)} km`;
}
