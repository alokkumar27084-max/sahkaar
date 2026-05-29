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
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-16 px-4 md:px-8 transition-colors duration-500">
      <div className="max-w-[1300px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 text-center md:text-left relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-r from-indigo-500/5 via-cyan-500/5 to-transparent border border-[var(--color-border)] shadow-sm">
          <div className="absolute -right-32 -top-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-3 block">Digital Labour Chowk</span>
              <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-[var(--color-heading)] leading-none">
                Hire Verified Labour Groups
              </h1>
              <p className="mt-4 text-sm text-[var(--color-muted)] max-w-xl font-medium leading-relaxed">
                Connect directly with experienced daily wage group leaders (Thekedaars). Filter by location, squad size, daily rate, and client reviews.
              </p>
            </div>
            <button
              onClick={triggerGpsDetect}
              className="self-center md:self-auto flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              {gpsLoading ? <LoadingSpinner size="xs" color="white" /> : <FiNavigation size={16} />}
              Detect Location
            </button>
          </div>
        </div>

        {/* Location strip */}
        <div className="mb-8 flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] px-6 py-4 rounded-2xl shadow-sm">
          <span className="text-indigo-500 shrink-0"><FiMapPin size={18} /></span>
          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Active Area:</span>
          <span className="text-sm font-bold text-[var(--color-heading)] truncate">{locationName}</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          
          {/* Desktop Filters Panel */}
          <aside className="hidden lg:block space-y-6">
            <div className="glass-card p-6 border border-[var(--color-border)] bg-[var(--color-card)] rounded-[2rem] shadow-sm space-y-8">
              <h3 className="font-display text-lg font-black text-[var(--color-heading)] uppercase tracking-tight flex items-center gap-2">
                <FiSliders className="text-indigo-500" /> Filter Criteria
              </h3>
              
              {/* Radius slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">
                  <span>Search Radius</span>
                  <span className="text-indigo-500 font-black">{filters.radius_km} km</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  value={filters.radius_km}
                  onChange={(e) => setFilters(p => ({ ...p, radius_km: parseInt(e.target.value) }))}
                  onMouseUp={() => fetchLabour()}
                />
              </div>

              {/* Sorting options */}
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">Sort Results By</span>
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
                      className={`w-full text-left px-5 py-3.5 rounded-xl border text-xs font-bold transition-all ${
                        filters.sort === opt.value
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                          : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-indigo-500/30 text-[var(--color-body)]"
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
            <form onSubmit={handleSearchSubmit} className="flex gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                <input
                  type="text"
                  placeholder="Search crew leaders by role, masonry, painter, helpers..."
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl px-12 py-4 text-[var(--color-heading)] font-bold text-sm focus:border-indigo-500 transition-all outline-none shadow-sm"
                  value={filters.q}
                  onChange={(e) => setFilters(p => ({ ...p, q: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
              >
                Search
              </button>
            </form>

            {/* Results Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[2.5rem] shadow-sm">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Scanning for nearest squads...</p>
              </div>
            ) : labours.length === 0 ? (
              <div className="text-center py-20 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[2.5rem] p-8">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FiUsers size={24} />
                </div>
                <h3 className="font-display text-xl font-black text-[var(--color-heading)]">No Labour Squads Found</h3>
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
                  Try expanding your search radius slider or using simpler keywords.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <AnimatePresence>
                  {labours.map((crew, idx) => (
                    <motion.div
                      key={crew.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass-card flex flex-col border border-[var(--color-border)] bg-[var(--color-card)] p-6 rounded-[2rem] hover:border-indigo-500/40 hover:scale-[1.01] transition-all duration-500 shadow-sm relative group overflow-hidden"
                    >
                      {crew.is_verified && (
                        <div className="absolute top-6 right-6 text-indigo-500 bg-indigo-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest shadow-sm">
                          <FiCheckCircle size={10} /> Verified
                        </div>
                      )}

                      {/* Header info */}
                      <div className="flex gap-4 items-center mb-5">
                        <img
                          src={crew.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${crew.id}`}
                          alt={crew.name}
                          className="w-16 h-16 rounded-2xl object-cover bg-[var(--color-bg)] border border-[var(--color-border)]"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${crew.id}`;
                          }}
                        />
                        <div>
                          <h4 className="font-display text-lg font-black text-[var(--color-heading)] tracking-tight leading-snug group-hover:text-indigo-400 transition-colors">
                            {crew.name}
                          </h4>
                          <span className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">
                            <FiAward className="text-indigo-500 shrink-0" /> {crew.experience_years} Years Exp
                          </span>
                        </div>
                      </div>

                      {/* Meta stats */}
                      <div className="grid grid-cols-3 border-t border-b border-[var(--color-border)] py-4 my-2 gap-2 text-center">
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Squad Force</span>
                          <span className="text-sm font-black text-[var(--color-heading)] flex items-center justify-center gap-1">
                            <FiUsers className="text-indigo-500" size={13} /> {crew.team_size}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Base Price</span>
                          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                            ₹{crew.daily_rate || 400} <span className="text-[10px] font-bold text-[var(--color-muted)]">/d</span>
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Distance</span>
                          <span className="text-sm font-black text-[var(--color-heading)]">
                            {crew.distance_km ? `${Number(crew.distance_km).toFixed(1)} km` : "Nearby"}
                          </span>
                        </div>
                      </div>

                      {/* Crew Breakdown Strip */}
                      {crew.labour_crew && Array.isArray(crew.labour_crew) && crew.labour_crew.length > 0 && (
                        <div className="my-3 space-y-1.5 flex-1">
                          <span className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] opacity-85">Available Manpower</span>
                          <div className="flex flex-wrap gap-1.5">
                            {crew.labour_crew.map((item, cidx) => (
                              <span key={cidx} className="px-3 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-heading)] flex items-center gap-1 shadow-inner">
                                {item.count} &times; {item.role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rating + CTA */}
                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-1.5">
                          <FiStar className="text-amber-500 fill-amber-500" size={14} />
                          <span className="text-xs font-black text-[var(--color-heading)]">{Number(crew.rating || 5.0).toFixed(1)}</span>
                          <span className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-wider">({crew.review_count || 1} Reviews)</span>
                        </div>
                        
                        <Link
                          to={`/labour/${crew.id}`}
                          className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm"
                        >
                          Details <FiChevronRight />
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
