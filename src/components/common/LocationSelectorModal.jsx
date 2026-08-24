import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocationContext } from "../../context/LocationContext";
import { loadGoogleMaps, reverseGeocodeCoords } from "../../utils/googleMaps";
import {
  FiMapPin,
  FiCrosshair,
  FiSearch,
  FiX,
  FiCheck,
  FiNavigation,
  FiCompass,
  FiMap
} from "react-icons/fi";

export default function LocationSelectorModal() {
  const {
    location,
    isModalOpen,
    closeLocationModal,
    selectLocality,
    detectGPSLocation,
    detectingGPS,
    popularLocalities,
    searchGooglePlaces,
    selectGooglePlace,
    placePredictions,
    searchingPlaces,
    mapsLoaded,
  } = useLocationContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [showMapView, setShowMapView] = useState(false);
  const [mapPinCoords, setMapPinCoords] = useState({ lat: location.lat, lng: location.lng });
  const [mapPinAddress, setMapPinAddress] = useState(location.name);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    searchGooglePlaces(val);
  };

  // Filter fallback popular localities
  const filteredLocalities = useMemo(() => {
    if (!searchQuery.trim()) return popularLocalities;
    const q = searchQuery.toLowerCase();
    return popularLocalities.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q)
    );
  }, [searchQuery, popularLocalities]);

  // Initialize Interactive Map when Map View is toggled
  useEffect(() => {
    if (!showMapView || !isModalOpen || !mapContainerRef.current) return;

    loadGoogleMaps().then((google) => {
      const center = { lat: Number(location.lat || 23.2599), lng: Number(location.lng || 77.4126) };
      
      const map = new google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      const marker = new google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: "Drag to pin your location",
      });
      markerInstanceRef.current = marker;

      const geocoder = new google.maps.Geocoder();

      // Reverse geocode marker position
      const updateLocationFromMarker = async (latLng) => {
        const lat = latLng.lat();
        const lng = latLng.lng();
        setMapPinCoords({ lat, lng });

        const geo = await reverseGeocodeCoords(lat, lng);
        if (geo?.formatted_address) {
          setMapPinAddress(geo.formatted_address);
        } else {
          setMapPinAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      };

      marker.addListener("dragend", (e) => {
        updateLocationFromMarker(e.latLng);
      });

      map.addListener("click", (e) => {
        marker.setPosition(e.latLng);
        updateLocationFromMarker(e.latLng);
      });
    });
  }, [showMapView, isModalOpen, location]);

  const confirmMapPinLocation = async () => {
    const geo = await reverseGeocodeCoords(mapPinCoords.lat, mapPinCoords.lng);
    selectLocality({
      name: geo?.formatted_address || mapPinAddress,
      shortName: geo?.short_name || mapPinAddress.split(",")[0] || "Custom Location",
      lat: mapPinCoords.lat,
      lng: mapPinCoords.lng,
    });
    setShowMapView(false);
  };

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLocationModal}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden z-10"
        >
          {/* Modal Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-950">Select Your Location</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Google Maps verified location for hyper-local Master dispatch
              </p>
            </div>
            <button
              type="button"
              onClick={closeLocationModal}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {/* View Switcher: List vs Pin on Map */}
            <div className="flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setShowMapView(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  !showMapView ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Search & Localities
              </button>
              <button
                type="button"
                onClick={() => setShowMapView(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  showMapView ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FiMap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pin on Google Map</span>
              </button>
            </div>

            {/* MAP VIEW */}
            {showMapView ? (
              <div className="space-y-4">
                <div
                  ref={mapContainerRef}
                  className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100"
                />

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Pinned Address</div>
                  <div className="font-bold text-slate-900 line-clamp-2 mt-0.5">{mapPinAddress}</div>
                </div>

                <button
                  type="button"
                  onClick={confirmMapPinLocation}
                  className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-indigo-600 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  <span>Confirm Pinned Location</span>
                </button>
              </div>
            ) : (
              /* LIST & SEARCH VIEW */
              <div className="space-y-4">
                {/* Search Input with Google Places Autocomplete */}
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search any colony, street, landmark or city in India..."
                    className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                    autoFocus
                  />
                  {searchingPlaces && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600">
                      Searching...
                    </div>
                  )}
                </div>

                {/* Google Places Live Predictions Dropdown */}
                {placePredictions.length > 0 && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-2 space-y-1 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-800 px-2 py-1 flex items-center gap-1">
                      <FiNavigation className="w-3 h-3 text-indigo-600" />
                      <span>Google Maps Locations</span>
                    </div>

                    {placePredictions.map((pred) => (
                      <button
                        key={pred.place_id}
                        type="button"
                        onClick={() => selectGooglePlace(pred)}
                        className="w-full p-2.5 rounded-xl bg-white hover:bg-indigo-100/70 border border-indigo-100/80 text-left flex items-start gap-2.5 transition-colors cursor-pointer group"
                      >
                        <FiMapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate">
                            {pred.structured_formatting?.main_text || pred.description}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {pred.structured_formatting?.secondary_text || pred.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* High Accuracy GPS Auto-Detect Button */}
                <button
                  type="button"
                  disabled={detectingGPS}
                  onClick={detectGPSLocation}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/60 hover:from-emerald-100 hover:to-emerald-100 border border-emerald-200 text-left flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <FiCrosshair className={`w-5 h-5 ${detectingGPS ? "animate-spin" : "group-hover:scale-110 transition-transform"}`} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <span>{detectingGPS ? "Fetching Google GPS Coordinates..." : "Use Current GPS Location"}</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        High accuracy street & colony auto-detect
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-600 text-white shadow-2xs shrink-0">
                    {detectingGPS ? "Detecting..." : "Auto Detect"}
                  </span>
                </button>

                {/* Currently Active Location */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiMapPin className="text-emerald-600 w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Currently Active</div>
                      <div className="text-xs font-black text-slate-900 truncate">{location.name}</div>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                </div>

                {/* Popular Localities List */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Popular Localities</span>
                    <span className="text-[11px] text-slate-400 font-normal">{filteredLocalities.length} areas</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {filteredLocalities.map((loc) => {
                      const isSelected =
                        Math.abs(Number(location.lat) - Number(loc.lat)) < 0.001 &&
                        Math.abs(Number(location.lng) - Number(loc.lng)) < 0.001;

                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => selectLocality(loc)}
                          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                              : "bg-white border-slate-200/70 hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FiCompass className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                            <div className="truncate">
                              <span className="text-xs font-bold">{loc.name}</span>
                              <span className={`text-[11px] ml-1.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                                ({loc.district})
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="text-[11px] font-black text-emerald-400 bg-slate-900 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                              <FiCheck className="w-3 h-3 stroke-[3]" />
                              <span>Active</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
