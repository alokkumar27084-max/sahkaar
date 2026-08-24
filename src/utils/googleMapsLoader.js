// ─────────────────────────────────────────────
// googleMapsLoader.js — Dynamic Google Maps SDK Loader
// ─────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
  "AIzaSyD4nY3rgedgYR7EmrGE2ueuun3yZ3MGxFQ";

let loadPromise = null;

export function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("Window not available"));

  // If already loaded
  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve(window.google);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.querySelector('script[data-google-maps="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry,drawing&loading=async`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps", "true");

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps SDK loaded but window.google is not defined"));
      }
    };

    script.onerror = (err) => {
      loadPromise = null;
      reject(err);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
