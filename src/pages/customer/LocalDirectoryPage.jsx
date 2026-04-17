import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiMapPin, FiPhone, FiStar, FiGrid, FiMap, FiPlus, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://thekedaar-api.onrender.com/api";
const MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "";

const DIRECTORY_CATEGORIES = [
  { id: "all", label: "All", icon: "🏠" },
  { id: "doctor", label: "Doctors", icon: "🏥" },
  { id: "lawyer", label: "Lawyers", icon: "⚖️" },
  { id: "tutor", label: "Tutors", icon: "📚" },
  { id: "salon", label: "Salons", icon: "💇" },
  { id: "gym", label: "Gyms", icon: "🏋️" },
  { id: "restaurant", label: "Restaurants", icon: "🍽️" },
  { id: "shop", label: "Shops", icon: "🛒" },
  { id: "astrologer", label: "Astrologers", icon: "🔮" },
  { id: "other", label: "Other", icon: "📌" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 23.2599, lng: 77.4126 }; // Bhopal
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

export default function LocalDirectoryPage() {
  const { user } = useAuth();
  const { lat, lng, request: getLocation } = useGeolocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [formData, setFormData] = useState({
    business_name: "", category: "shop", description: "", phone: "", address: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const chipScrollRef = useRef(null);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY,
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.q = query;
      if (category !== "all") params.category = category;
      if (lat && lng) { params.lat = lat; params.lng = lng; params.radius_km = 10; }
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/directory`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setListings(res.data.listings || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, lat, lng]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  async function handleAddListing(e) {
    e.preventDefault();
    if (!user) { toast.error("Please login to add a listing"); return; }
    if (!formData.business_name.trim() || !formData.phone.trim()) {
      toast.error("Business name and phone are required");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/directory`, {
        ...formData,
        lat: lat || null,
        lng: lng || null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Listing added successfully!");
      setShowAddForm(false);
      setFormData({ business_name: "", category: "shop", description: "", phone: "", address: "" });
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add listing");
    } finally {
      setSubmitting(false);
    }
  }

  const mapCenter = (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : defaultCenter;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">

        {/* ═══ Header ═══ */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Local Directory</p>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight leading-tight">
                Discover Nearby
              </h1>
              <p className="text-[var(--color-muted)] mt-2 font-medium max-w-lg text-sm leading-relaxed">
                Find local professionals, shops, and businesses around you.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={getLocation} className="btn-ghost text-sm flex items-center gap-2">
                <FiMapPin size={14} /> Detect Location
              </button>
              <button
                onClick={() => setShowAddForm(prev => !prev)}
                className="btn-primary text-sm gap-2"
              >
                <FiPlus size={14} /> Add Business
              </button>
            </div>
          </div>
        </motion.div>

        {/* ═══ Add Listing Form ═══ */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
              exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden mb-8"
            >
              <form onSubmit={handleAddListing} className="glass-card p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-bold text-[var(--color-heading)]">Add Your Business</h3>
                  <button type="button" onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-border)] transition-colors text-[var(--color-muted)]">
                    <FiX size={16} />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-[0.15em] mb-1.5 block">Business Name *</label>
                    <input
                      value={formData.business_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                      className="input-field"
                      placeholder="e.g. Sharma Medical Store"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-[0.15em] mb-1.5 block">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input-field"
                    >
                      {DIRECTORY_CATEGORIES.filter(c => c.id !== "all").map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-[0.15em] mb-1.5 block">Phone *</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input-field"
                      placeholder="+91 9XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-[0.15em] mb-1.5 block">Address</label>
                    <input
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="input-field"
                      placeholder="Street, Area, City"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-[0.15em] mb-1.5 block">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Brief description of your business..."
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary text-sm">
                    {submitting ? "Adding..." : "Add Listing"}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost text-sm">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Search + Filters ═══ */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="glass-card p-4 md:p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-[16px] h-[16px]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search businesses..."
                className="input-field !pl-11 !h-11"
              />
            </div>
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-[var(--color-bg-elevated)] p-1 rounded-xl shrink-0 self-stretch md:self-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "grid" ? "bg-[var(--color-surface)] text-[var(--color-heading)] shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-body)]"}`}
              >
                <FiGrid size={13} /> Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "map" ? "bg-[var(--color-surface)] text-[var(--color-heading)] shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-body)]"}`}
              >
                <FiMap size={13} /> Map
              </button>
            </div>
          </div>

          {/* Category filter chips — horizontal scroll with fade */}
          <div className="relative mt-3">
            <div ref={chipScrollRef} className="flex gap-2 overflow-x-auto scrollbar-none fade-edges-x py-1">
              {DIRECTORY_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 ${
                    category === cat.id
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                      : "bg-transparent text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-body)]"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═══ Results ═══ */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="glass-card p-6 space-y-4">
                <div className="skeleton h-5 w-3/4 rounded-lg" />
                <div className="skeleton h-4 w-1/2 rounded-lg" />
                <div className="skeleton h-16 w-full rounded-xl" />
                <div className="skeleton h-4 w-2/3 rounded-lg" />
              </div>
            ))}
          </div>
        ) : viewMode === "map" ? (
          /* ══ Map View ══ */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card p-0 overflow-hidden rounded-2xl"
            style={{ height: "550px" }}
          >
            {mapsLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={13}
                options={mapOptions}
              >
                {/* User location marker */}
                {lat && lng && (
                  <MarkerF
                    position={{ lat: Number(lat), lng: Number(lng) }}
                    icon={{
                      path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                      scale: 8,
                      fillColor: "#6366F1",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 3,
                    }}
                    title="Your Location"
                  />
                )}

                {/* Listing markers */}
                {listings.filter(l => l.lat && l.lng).map(listing => (
                  <MarkerF
                    key={listing.id}
                    position={{ lat: Number(listing.lat), lng: Number(listing.lng) }}
                    onClick={() => setSelectedMarker(listing)}
                    icon={{
                      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                      fillColor: "#F59E0B",
                      fillOpacity: 1,
                      strokeColor: "#B45309",
                      strokeWeight: 1,
                      scale: 1.5,
                      anchor: new window.google.maps.Point(12, 22),
                    }}
                  />
                ))}

                {/* Info Window */}
                {selectedMarker && (
                  <InfoWindowF
                    position={{ lat: Number(selectedMarker.lat), lng: Number(selectedMarker.lng) }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div style={{ padding: "4px 2px", maxWidth: "220px", fontFamily: "Inter, sans-serif" }}>
                      <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px", color: "#0C0F1D" }}>
                        {selectedMarker.business_name}
                      </p>
                      <p style={{ fontSize: "11px", color: "#6366F1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                        {selectedMarker.category}
                      </p>
                      {selectedMarker.address && (
                        <p style={{ fontSize: "12px", color: "#6B7094", marginBottom: "4px" }}>
                          📍 {selectedMarker.address}
                        </p>
                      )}
                      {selectedMarker.phone && (
                        <a href={`tel:${selectedMarker.phone}`} style={{ fontSize: "12px", color: "#6366F1", fontWeight: 600 }}>
                          📞 {selectedMarker.phone}
                        </a>
                      )}
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-elevated)]">
                <div className="text-center p-8">
                  <div className="w-10 h-10 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[var(--color-muted)] text-sm">Loading map...</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : listings.length === 0 ? (
          /* ══ Empty state ══ */
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="glass-card p-16 text-center border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-5">
              <FiMap size={28} />
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--color-heading)] mb-2">No listings yet</h3>
            <p className="text-[var(--color-muted)] text-sm max-w-sm mx-auto mb-6">
              Be the first to add a local business or professional to the directory.
            </p>
            <button onClick={() => setShowAddForm(true)} className="btn-primary text-sm">
              <FiPlus size={14} /> Add First Listing
            </button>
          </motion.div>
        ) : (
          /* ══ Grid View ══ */
          <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <motion.div
                key={listing.id}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                className="glass-card p-6 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg font-bold shrink-0">
                      {listing.business_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3 className="font-display text-[15px] font-bold text-[var(--color-heading)] leading-tight">{listing.business_name}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-2 py-0.5 rounded inline-block mt-1">
                        {listing.category}
                      </span>
                    </div>
                  </div>
                  {listing.is_verified && (
                    <span className="text-emerald-500 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded">✓</span>
                  )}
                </div>

                {listing.description && (
                  <p className="text-sm text-[var(--color-body)] leading-relaxed line-clamp-2 mb-3">{listing.description}</p>
                )}

                <div className="space-y-2 mt-auto">
                  {listing.address && (
                    <p className="text-xs text-[var(--color-muted)] flex items-start gap-2">
                      <FiMapPin className="shrink-0 mt-0.5 text-[var(--color-primary)]" size={12} />
                      {listing.address}
                    </p>
                  )}
                  {listing.phone && (
                    <a href={`tel:${listing.phone}`} className="text-xs text-[var(--color-muted)] flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                      <FiPhone size={12} className="text-[var(--color-primary)] shrink-0" />
                      {listing.phone}
                    </a>
                  )}
                </div>

                {listing.rating > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
                    <FiStar className="text-amber-400" size={13} fill="currentColor" />
                    <span className="text-xs font-bold text-[var(--color-heading)]">{Number(listing.rating).toFixed(1)}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
}
