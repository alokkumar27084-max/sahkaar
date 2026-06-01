import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiMapPin,
  FiSearch,
  FiSliders,
  FiUsers,
  FiDollarSign,
  FiAward,
  FiNavigation,
  FiPhone,
  FiChevronRight,
  FiStar,
  FiCheckCircle
} from "react-icons/fi";
import { useGeolocation } from "../../hooks/useGeolocation";
import { labourAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function LabourSearchPage() {
  const { lat: gpsLat, lng: gpsLng, address: gpsAddress, request: requestGps, loading: gpsLoading } = useGeolocation();

  const [loading, setLoading] = useState(false);
  const [labours, setLabours] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    radius_km: 10,
    sort: "distance"
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Default coordinate is New Delhi (if GPS not permitted/enabled)
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [locationName, setLocationName] = useState("New Delhi, India");

  useEffect(() => {
    if (gpsLat && gpsLng) {
      setCoords({ lat: gpsLat, lng: gpsLng });
      if (gpsAddress) setLocationName(gpsAddress);
      fetchLabour({ lat: gpsLat, lng: gpsLng });
    } else {
      fetchLabour();
    }
  }, [gpsLat, gpsLng, gpsAddress]);

  const fetchLabour = async (customCoords = null) => {
    setLoading(true);
    try {
      const activeCoords = customCoords || coords;
      const res = await labourAPI.search({
        q: filters.q,
        lat: activeCoords.lat,
        lng: activeCoords.lng,
        radius_km: filters.radius_km,
        sort: filters.sort,
        limit: 50
      });
      if (res.data?.ok) {
        setLabours(res.data.contractors || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load labor groups.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLabour();
  };

  const triggerGpsDetect = () => {
    requestGps();
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg-elevated)] pt-24 pb-16 px-4 md:px-8 transition-all">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 p-6 md:p-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-card relative overflow-hidden">
          <div className="absolute -right-32 -top-32 w-80 h-80 bg-gradient-to-br from-[var(--color-primary)]/5 to-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2 block">Digital Labour Chowk</span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-heading)] leading-none">
                Hire Verified Labour Groups
              </h1>
              <p className="mt-3 text-sm text-[var(--color-muted)] max-w-xl font-semibold leading-relaxed">
                Connect directly with experienced daily wage group leaders (Thekedaars). Filter by location, squad size, daily rate, and client reviews.
              </p>
            </div>
            <button
              onClick={triggerGpsDetect}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--color-primary)]/90 transition-all shadow-sm"
            >
              {gpsLoading ? <LoadingSpinner size="sm" /> : <FiNavigation size={14} />}
              Detect Location
            </button>
          </div>
        </div>

        {/* Location strip */}
        <div className="mb-6 flex items-center gap-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] px-5 py-3 rounded-xl shadow-sm text-xs font-semibold">
          <span className="text-[var(--color-primary)] shrink-0"><FiMapPin size={16} /></span>
          <span className="text-[var(--color-primary)] uppercase tracking-wider font-extrabold">Active Base Area:</span>
          <span className="text-[var(--color-heading)] truncate font-bold">{locationName}</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          
          {/* Desktop Filters Panel */}
          <aside className="hidden lg:block space-y-6">
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 rounded-2xl shadow-card space-y-6">
              <h3 className="text-sm font-extrabold text-[var(--color-heading)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
                <FiSliders className="text-[var(--color-primary)]" size={14} /> Filters
              </h3>
              
              {/* Radius slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  <span>Search Radius</span>
                  <span className="text-[var(--color-primary)] font-extrabold">{filters.radius_km} km</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  className="w-full h-1.5 bg-[var(--color-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                  value={filters.radius_km}
                  onChange={(e) => setFilters(p => ({ ...p, radius_km: parseInt(e.target.value) }))}
                  onMouseUp={() => fetchLabour()}
                />
              </div>

              {/* Sorting options */}
              <div className="space-y-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Sort Results By</span>
                <div className="flex flex-col gap-2">
                  {[
                    { value: "distance", label: "Distance (Nearest)" },
                    { value: "price", label: "Daily Rate (Lowest)" },
                    { value: "rating", label: "Client Rating" }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilters(p => ({ ...p, sort: opt.value }));
                        setTimeout(() => fetchLabour(), 50);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                        filters.sort === opt.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-primary)]/30 text-[var(--color-body)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="space-y-6">
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
                <input
                  type="text"
                  placeholder="Search crew leaders by role, masonry, painter, helpers..."
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-[var(--color-heading)] font-semibold text-sm focus:border-[var(--color-primary)] transition-all outline-none shadow-sm placeholder:text-[var(--color-muted)]"
                  value={filters.q}
                  onChange={(e) => setFilters(p => ({ ...p, q: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
              >
                Search
              </button>
            </form>

            {/* Results Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-card">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Scanning for nearest squads...</p>
              </div>
            ) : labours.length === 0 ? (
              <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-card">
                <div className="w-12 h-12 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl flex items-center justify-center mx-auto mb-5">
                  <FiUsers size={20} />
                </div>
                <h3 className="text-base font-bold text-[var(--color-heading)]">No Labour Squads Found</h3>
                <p className="mt-2 text-xs font-semibold text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
                  Try expanding your search radius slider or using simpler keywords.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <AnimatePresence>
                  {labours.map((crew, idx) => (
                    <motion.div
                      key={crew.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-[var(--color-surface)] flex flex-col border border-[var(--color-border)] p-6 rounded-2xl hover:border-[var(--color-primary)]/40 hover:shadow-card transition-all duration-300 relative group overflow-hidden shadow-sm"
                    >
                      {crew.is_verified && (
                        <div className="absolute top-6 right-6 text-[var(--color-primary)] bg-[var(--color-primary)]/15 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                          <FiCheckCircle size={10} /> Verified
                        </div>
                      )}

                      {/* Header info */}
                      <div className="flex gap-4 items-center mb-5">
                        <img
                          src={crew.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${crew.id}`}
                          alt={crew.name}
                          className="w-14 h-14 rounded-xl object-cover bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-sm"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${crew.id}`;
                          }}
                        />
                        <div>
                          <h4 className="text-base font-extrabold text-[var(--color-heading)] tracking-tight leading-snug group-hover:text-[var(--color-primary)] transition-all">
                            {crew.name}
                          </h4>
                          <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            <FiAward className="text-[var(--color-primary)] shrink-0" size={11} /> {crew.experience_years} Years Exp
                          </span>
                        </div>
                      </div>

                      {/* Meta stats */}
                      <div className="grid grid-cols-3 border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 rounded-xl py-3 my-2 gap-2 text-center text-xs font-semibold">
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Squad Force</span>
                          <span className="text-sm font-extrabold text-[var(--color-heading)] flex items-center justify-center gap-1">
                            <FiUsers className="text-[var(--color-primary)]" size={12} /> {crew.team_size}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Base Price</span>
                          <span className="text-sm font-extrabold text-[var(--color-primary)]">
                            ₹{crew.daily_rate || 400}<span className="text-[9px] font-medium text-[var(--color-muted)]">/d</span>
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Distance</span>
                          <span className="text-sm font-extrabold text-[var(--color-heading)]">
                            {crew.distance_km ? `${Number(crew.distance_km).toFixed(1)} km` : "Nearby"}
                          </span>
                        </div>
                      </div>

                      {/* Crew Breakdown Strip */}
                      {crew.labour_crew && Array.isArray(crew.labour_crew) && crew.labour_crew.length > 0 && (
                        <div className="my-3 space-y-1.5 flex-1 font-semibold">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)] opacity-85">Available Manpower</span>
                          <div className="flex flex-wrap gap-1.5">
                            {crew.labour_crew.map((item, cidx) => (
                              <span key={cidx} className="px-2.5 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[10px] text-[var(--color-heading)] flex items-center gap-1 shadow-inner">
                                {item.count} &times; {item.role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rating + CTA */}
                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-1">
                          <FiStar className="text-amber-500 fill-amber-500 shrink-0" size={13} />
                          <span className="text-xs font-bold text-[var(--color-heading)]">{Number(crew.rating || 5.0).toFixed(1)}</span>
                          <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-wider">({crew.review_count || 1})</span>
                        </div>
                        
                        <Link
                          to={`/labour/${crew.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm"
                        >
                          Details <FiChevronRight size={12} />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}
