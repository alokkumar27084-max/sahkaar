import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { useGeolocation } from "../../hooks/useGeolocation";

export default function LocationPromptModal() {
  const { user, refreshUser } = useAuth();
  const { lat, lng, accuracy, request, loading, error } = useGeolocation();
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const hasStoredLocation = useMemo(() => {
    return user?.location_lat !== null && user?.location_lat !== undefined &&
      user?.location_lng !== null && user?.location_lng !== undefined;
  }, [user]);

  const shouldShow = user?.role === "customer" && !hasStoredLocation && !dismissed;

  useEffect(() => {
    if (lat === null || lng === null || !shouldShow) return;
    async function persistLocation() {
      setSaving(true);
      try {
        await authAPI.updateLocation({
          lat: Number(lat),
          lng: Number(lng),
          accuracy_m: accuracy !== null ? Number(accuracy) : null,
          source: "browser_gps",
        });
        await refreshUser();
        setDismissed(true);
      } finally {
        setSaving(false);
      }
    }
    persistLocation();
  }, [lat, lng, accuracy, refreshUser, shouldShow]);

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="font-['Poppins'] text-xl font-semibold text-slate-900 mb-2">Share your current location</h2>
        <p className="text-sm text-slate-600 mb-4">
          We use your precise location to show nearest contractors within 2-5 km.
        </p>

        <button
          onClick={() => request({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })}
          disabled={loading || saving}
          className="btn-primary w-full"
        >
          {loading || saving ? "Capturing location..." : "Use current location"}
        </button>

        {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}

        <button onClick={() => setDismissed(true)} className="w-full text-xs text-slate-500 mt-3 underline">
          Ask me later
        </button>
      </div>
    </div>
  );
}
