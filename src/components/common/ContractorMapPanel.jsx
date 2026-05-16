import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { hasGoogleMapsKey, loadGoogleMaps } from "../../utils/googleMaps";

const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#090B19" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

export default function ContractorMapPanel({
  center,
  currentLocationLabel,
  contractors = [],
  highlightedId = null,
}) {
  const mapRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);
  const markersRef = useRef({});
  const mapInstanceRef = useRef(null);

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
      zoom: 13,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    const bounds = new google.maps.LatLngBounds();

    // User Location Marker
    const currentMarker = new google.maps.Marker({
      map,
      position: { lat: Number(center.lat), lng: Number(center.lng) },
      title: "Your location",
      zIndex: 1000,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#6366f1",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 8,
      },
    });
    bounds.extend(currentMarker.getPosition());

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.setMap(null));
    markersRef.current = {};

    usableContractors.forEach((contractor) => {
      const position = {
        lat: Number(contractor.lat ?? contractor.latitude),
        lng: Number(contractor.lng ?? contractor.longitude),
      };

      const marker = new google.maps.Marker({
        map,
        position,
        title: contractor.name || contractor.business_name || "Contractor",
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="22" r="20" fill="#0D1021" stroke="#991b1b" stroke-width="2.5"/>
              <path d="M24 44L18 36H30L24 44Z" fill="#991b1b"/>
              {/* Head & Face */}
              <circle cx="24" cy="19" r="7" fill="#FFDBAC"/>
              <circle cx="22" cy="18" r="1" fill="#000"/>
              <circle cx="26" cy="18" r="1" fill="#000"/>
              <path d="M22 21C22 21 23 22 24 22C25 22 26 21 26 21" stroke="#000" stroke-width="0.5" stroke-linecap="round"/>
              {/* Helmet */}
              <path d="M17 18C17 14 20 12 24 12C28 12 31 14 31 18H17Z" fill="#F59E0B"/>
              <rect x="22" y="10" width="4" height="3" rx="1" fill="#F59E0B"/>
              {/* Body & Overalls */}
              <path d="M16 32C16 28 18 26 24 26C30 26 32 28 32 32V34H16V32Z" fill="#1E293B"/>
              <rect x="19" y="26" width="2" height="6" fill="#F59E0B" fill-opacity="0.6"/>
              <rect x="27" y="26" width="2" height="6" fill="#F59E0B" fill-opacity="0.6"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 44),
        }
      });

      markersRef.current[contractor.id] = marker;

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding:12px;background:#0D1021;color:white;border-radius:12px;font-family:sans-serif;">
            <div style="font-weight:900;font-size:14px;margin-bottom:4px;">${contractor.name || contractor.business_name}</div>
            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">${(contractor.category || "General").replace("_", " ")}</div>
            <div style="margin-top:8px;font-size:12px;color:#818cf8;font-weight:bold;">${Number(contractor.distance_km || 0).toFixed(1)} km away</div>
          </div>
        `,
      });

      marker.addListener("click", () => infoWindow.open({ anchor: marker, map }));
      bounds.extend(position);
    });

    if (usableContractors.length > 0) {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    } else {
      map.setCenter({ lat: Number(center.lat), lng: Number(center.lng) });
      map.setZoom(14);
    }

    return () => {
      currentMarker.setMap(null);
      Object.values(markersRef.current).forEach(m => m.setMap(null));
    };
  }, [mapsReady, usableContractors, center.lat, center.lng]);

  // Sync center when it changes externally
  useEffect(() => {
    if (mapsReady && mapInstanceRef.current && center?.lat && center?.lng) {
      const google = window.google;
      const newPos = new google.maps.LatLng(Number(center.lat), Number(center.lng));
      mapInstanceRef.current.setCenter(newPos);
      mapInstanceRef.current.panTo(newPos);
    }
  }, [center.lat, center.lng, mapsReady]);

  // Handle Highlighting
  useEffect(() => {
    if (!mapsReady || !markersRef.current) return;
    const google = window.google;
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const isHighlighted = String(id) === String(highlightedId);
      marker.setOptions({
        zIndex: isHighlighted ? 2000 : 1,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="22" r="20" fill="${isHighlighted ? '#111425' : '#0D1021'}" stroke="${isHighlighted ? '#ef4444' : '#991b1b'}" stroke-width="${isHighlighted ? 3.5 : 2.5}"/>
              <path d="M24 44L16 34H32L24 44Z" fill="${isHighlighted ? '#ef4444' : '#991b1b'}"/>
              <circle cx="24" cy="19" r="7" fill="#FFDBAC"/>
              <circle cx="22" cy="18" r="1" fill="#000"/>
              <circle cx="26" cy="18" r="1" fill="#000"/>
              <path d="M22 21C22 21 23 22 24 22C25 22 26 21 26 21" stroke="#000" stroke-width="0.5" stroke-linecap="round"/>
              <path d="M17 18C17 14 20 12 24 12C28 12 31 14 31 18H17Z" fill="#F59E0B"/>
              <rect x="22" y="10" width="4" height="3" rx="1" fill="#F59E0B"/>
              <path d="M16 32C16 28 18 26 24 26C30 26 32 28 32 32V34H16V32Z" fill="#1E293B"/>
              <rect x="19" y="26" width="2" height="6" fill="#F59E0B" fill-opacity="0.6"/>
              <rect x="27" y="26" width="2" height="6" fill="#F59E0B" fill-opacity="0.6"/>
            </svg>
          `)}`,
          scaledSize: isHighlighted ? new google.maps.Size(60, 60) : new google.maps.Size(44, 44),
          anchor: isHighlighted ? new google.maps.Point(30, 60) : new google.maps.Point(22, 44),
        }
      });

      if (isHighlighted && mapInstanceRef.current) {
        mapInstanceRef.current.panTo(marker.getPosition());
      }
    });
  }, [highlightedId, mapsReady]);

  if (!center?.lat || !center?.lng) return null;

  return (
    <div className="w-full h-full relative">
      {!hasGoogleMapsKey() ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-xl text-slate-500 text-xs font-bold uppercase tracking-widest text-center px-10">
          Google Maps Key Required for Live Preview
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full" />
      )}
    </div>
  );
}
