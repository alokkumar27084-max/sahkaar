import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { hasGoogleMapsKey, loadGoogleMaps } from "../../utils/googleMaps";

export default function ContractorMapPanel({
  center,
  currentLocationLabel,
  contractors = [],
  heightClass = "h-[320px]",
}) {
  const mapRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);

  const usableContractors = useMemo(
    () => contractors.filter((item) => Number.isFinite(Number(item.lat ?? item.latitude)) && Number.isFinite(Number(item.lng ?? item.longitude))),
    [contractors]
  );

  useEffect(() => {
    let mounted = true;
    if (!hasGoogleMapsKey()) return undefined;

    loadGoogleMaps(["places"])
      .then(() => {
        if (mounted) setMapsReady(true);
      })
      .catch(() => {
        if (mounted) setMapsReady(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !center?.lat || !center?.lng) return;

    const google = window.google;
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: Number(center.lat), lng: Number(center.lng) },
      zoom: usableContractors.length ? 13 : 15,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const bounds = new google.maps.LatLngBounds();
    const currentMarker = new google.maps.Marker({
      map,
      position: { lat: Number(center.lat), lng: Number(center.lng) },
      title: "Your location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#06b6d4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 8,
      },
    });
    bounds.extend(currentMarker.getPosition());

    usableContractors.forEach((contractor) => {
      const position = {
        lat: Number(contractor.lat ?? contractor.latitude),
        lng: Number(contractor.lng ?? contractor.longitude),
      };
      const marker = new google.maps.Marker({
        map,
        position,
        title: contractor.name || contractor.business_name || contractor.user_name || "Contractor",
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="min-width:180px;padding:4px 2px;">
            <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">
              ${contractor.name || contractor.business_name || contractor.user_name || "Contractor"}
            </div>
            <div style="font-size:12px;color:#475569;">
              ${(contractor.category || contractor.categories?.[0] || "General").replaceAll("_", " ")}
            </div>
            ${contractor.distance_km != null ? `<div style="margin-top:6px;font-size:12px;color:#0891b2;">${Number(contractor.distance_km).toFixed(1)} km away</div>` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => infoWindow.open({ anchor: marker, map }));
      bounds.extend(position);
    });

    if (usableContractors.length > 0) {
      map.fitBounds(bounds, 60);
    }

    return () => {
      currentMarker.setMap(null);
    };
  }, [mapsReady, usableContractors, center]);

  if (!center?.lat || !center?.lng) return null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="font-semibold text-[var(--color-heading)]">Hyperlocal Coverage Map</h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {currentLocationLabel || "Showing contractors nearest to your selected location."}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
          <FiMapPin />
          {usableContractors.length} nearby
        </div>
      </div>

      {hasGoogleMapsKey() ? (
        <div ref={mapRef} className={`w-full ${heightClass}`} />
      ) : (
        <div className={`flex items-center justify-center px-6 text-center text-sm text-[var(--color-muted)] ${heightClass}`}>
          Add `REACT_APP_GOOGLE_MAPS_KEY` to render the live map preview for nearby contractors.
        </div>
      )}
    </div>
  );
}
