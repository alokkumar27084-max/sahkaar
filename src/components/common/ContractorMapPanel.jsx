import React, { useEffect, useMemo, useRef, useState } from "react";
import { hasGoogleMapsKey, loadGoogleMaps, calculateHaversineDistanceKm, formatDistance } from "../../utils/googleMaps";
import { getAvatarUrl } from "../../utils/imageUtils";

const MAP_STYLES = [
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "simplified" }] },
  { "featureType": "road", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
];

const DEFAULT_LAT = 23.2599; // Bhopal, MP
const DEFAULT_LNG = 77.4126;

export default function ContractorMapPanel({
  center = { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
  currentLocationLabel = "Your Location",
  contractors = [],
  highlightedId = null,
  selectedId = null,
  onSelectContractor = null,
}) {
  const mapContainerRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);
  const markersRef = useRef({});
  const mapInstanceRef = useRef(null);
  const activeInfoWindowRef = useRef(null);

  const centerLat = Number(center?.lat ?? DEFAULT_LAT);
  const centerLng = Number(center?.lng ?? DEFAULT_LNG);
  const activeHighlightId = highlightedId || selectedId;

  const usableContractors = useMemo(
    () =>
      (contractors || []).filter(
        (item) =>
          item &&
          Number.isFinite(Number(item.lat ?? item.latitude)) &&
          Number.isFinite(Number(item.lng ?? item.longitude))
      ),
    [contractors]
  );

  useEffect(() => {
    let mounted = true;
    loadGoogleMaps(["places", "geometry"])
      .then(() => {
        if (mounted) setMapsReady(true);
      })
      .catch((err) => {
        console.warn("Google Maps panel load warning:", err);
        if (mounted) setMapsReady(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current || !window.google?.maps) return;

    const google = window.google;
    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 13,
      styles: MAP_STYLES,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    mapInstanceRef.current = map;

    const bounds = new google.maps.LatLngBounds();

    // 1. User Location Pin (Blue Glowing Dot)
    const userMarker = new google.maps.Marker({
      map,
      position: { lat: centerLat, lng: centerLng },
      title: currentLocationLabel || "Your Current Location",
      zIndex: 999,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#4f46e5",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
        scale: 9,
      },
    });
    bounds.extend(userMarker.getPosition());

    // 2. Clear old master markers
    Object.values(markersRef.current).forEach((m) => m && m.setMap(null));
    markersRef.current = {};

    // 3. Render Master Pins
    usableContractors.forEach((c) => {
      const cLat = Number(c.lat ?? c.latitude);
      const cLng = Number(c.lng ?? c.longitude);
      const position = { lat: cLat, lng: cLng };

      const cName = c.name || c.business_name || "SahKaar Master";
      const cCat = (c.category || "Service").replace(/_/g, " ");
      const dist = calculateHaversineDistanceKm(centerLat, centerLng, cLat, cLng) ?? c.distance_km;
      const distFormatted = formatDistance(dist) || "Nearby";

      const marker = new google.maps.Marker({
        map,
        position,
        title: cName,
        zIndex: 100,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 0C9.85 0 0 9.85 0 22C0 35.5 22 52 22 52C22 52 44 35.5 44 22C44 9.85 34.15 0 22 0Z" fill="#0f172a"/>
              <circle cx="22" cy="20" r="16" fill="#4f46e5"/>
              <circle cx="22" cy="20" r="13" fill="#ffffff"/>
              <text x="22" y="25" font-family="sans-serif" font-size="14" font-weight="900" fill="#4f46e5" text-anchor="middle">★</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(36, 42),
          anchor: new google.maps.Point(18, 42),
        },
      });

      const infoContent = document.createElement("div");
      infoContent.className = "p-3 bg-white text-slate-900 rounded-xl font-sans min-w-[200px]";
      infoContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="font-size:13px;font-weight:900;color:#0f172a;">${cName}</div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.5px;">
          Master ${cCat}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:11px;font-weight:800;">
          <span style="color:#e11d48;">📍 ${distFormatted}</span>
          <span style="color:#0f172a;">₹${c.daily_rate || 450} / visit</span>
        </div>
        <a href="/contractor/${c.id}" style="display:block;margin-top:8px;padding:6px;background:#0f172a;color:#ffffff;text-align:center;border-radius:8px;font-size:11px;font-weight:800;text-decoration:none;">
          View Master Profile →
        </a>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener("click", () => {
        if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();
        infoWindow.open(map, marker);
        activeInfoWindowRef.current = infoWindow;
        if (onSelectContractor) onSelectContractor(c);
      });

      markersRef.current[c.id] = marker;
      bounds.extend(marker.getPosition());
    });

    // Fit bounds so all pins are visible
    if (usableContractors.length > 0) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else {
      map.setCenter({ lat: centerLat, lng: centerLng });
      map.setZoom(13);
    }
  }, [mapsReady, centerLat, centerLng, usableContractors, currentLocationLabel, onSelectContractor]);

  // Handle active highlight trigger
  useEffect(() => {
    if (!activeHighlightId || !markersRef.current[activeHighlightId] || !mapInstanceRef.current) return;
    const marker = markersRef.current[activeHighlightId];
    mapInstanceRef.current.panTo(marker.getPosition());
    marker.setAnimation(window.google?.maps?.Animation?.BOUNCE);
    setTimeout(() => {
      if (marker) marker.setAnimation(null);
    }, 1400);
  }, [activeHighlightId]);

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-xs border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
}
