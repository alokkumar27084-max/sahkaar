import React, { useState, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "100%" };

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#0e1117" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0e1117" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1e2e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212740" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#090d1a" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111525" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d1320" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#111525" }] },
  ],
};

/**
 * Map with hooks isolated so parent can render without REACT_APP_GOOGLE_MAPS_KEY.
 */
export default function DirectoryMapView({
  apiKey,
  listings,
  lat,
  lng,
  mapCenter,
  selectedMarker,
  onSelectMarker,
  onCloseInfo,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "thekedaar-directory-map",
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true,
  });

  const [mapInstance, setMapInstance] = useState(null);

  const markerIcons = useMemo(() => {
    if (!isLoaded || typeof window === "undefined" || !window.google?.maps) {
      return { user: undefined, listing: undefined };
    }
    const g = window.google.maps;
    return {
      user: {
        path: g.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#6366F1",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      listing: {
        path: g.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: "#F59E0B",
        fillOpacity: 1,
        strokeColor: "#92400E",
        strokeWeight: 2,
      },
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !mapInstance || !window.google?.maps) return;
    const pts = [];
    if (lat && lng) pts.push({ lat: Number(lat), lng: Number(lng) });
    listings.filter((l) => l.lat && l.lng).forEach((l) => pts.push({ lat: Number(l.lat), lng: Number(l.lng) }));
    if (pts.length === 0) return;
    if (pts.length === 1) {
      mapInstance.setCenter(pts[0]);
      mapInstance.setZoom(14);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    pts.forEach((p) => bounds.extend(p));
    mapInstance.fitBounds(bounds, 56);
  }, [isLoaded, mapInstance, listings, lat, lng]);

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-[var(--color-bg-elevated)] p-8">
        <p className="text-sm text-rose-500 text-center max-w-sm">
          Could not load Google Maps. Verify <code className="text-xs">REACT_APP_GOOGLE_MAPS_KEY</code>, billing, and Maps JavaScript API.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-elevated)] min-h-[400px]">
        <div className="text-center p-8">
          <div className="w-10 h-10 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-muted)] text-sm">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={13}
      options={mapOptions}
      onLoad={setMapInstance}
    >
      {lat && lng && (
        <MarkerF
          position={{ lat: Number(lat), lng: Number(lng) }}
          icon={markerIcons.user}
          title="Your location"
        />
      )}

      {listings
        .filter((l) => l.lat && l.lng)
        .map((listing) => (
          <MarkerF
            key={listing.id}
            position={{ lat: Number(listing.lat), lng: Number(listing.lng) }}
            onClick={() => onSelectMarker(listing)}
            icon={markerIcons.listing}
          />
        ))}

      {selectedMarker && (
        <InfoWindowF
          position={{ lat: Number(selectedMarker.lat), lng: Number(selectedMarker.lng) }}
          onCloseClick={onCloseInfo}
        >
          <div style={{ padding: "4px 2px", maxWidth: "220px", fontFamily: "Inter, sans-serif" }}>
            <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px", color: "#0C0F1D" }}>
              {selectedMarker.business_name}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "#6366F1",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              {selectedMarker.category}
            </p>
            {selectedMarker.address && (
              <p style={{ fontSize: "12px", color: "#6B7094", marginBottom: "4px" }}>{selectedMarker.address}</p>
            )}
            {selectedMarker.phone && (
              <a href={`tel:${selectedMarker.phone}`} style={{ fontSize: "12px", color: "#6366F1", fontWeight: 600 }}>
                {selectedMarker.phone}
              </a>
            )}
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
