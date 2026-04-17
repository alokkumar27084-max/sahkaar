const LOCATION_KEY = "thekedaar:last-location";

export function readSavedLocation() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocationSnapshot(payload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}
