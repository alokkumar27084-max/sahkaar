import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES } from "../../utils/constants";
import { useLocationContext } from "../../context/LocationContext";
import { contractorAPI } from "../../services/api";
import ContractorCard from "../../components/common/ContractorCard";
import { useAuth } from "../../context/AuthContext";
import {
  FiSearch,
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiStar,
  FiZap,
  FiMapPin,
  FiLayers,
  FiUsers,
  FiAward,
  FiTool,
  FiHeart
} from "react-icons/fi";
import SEOHead from "../../components/common/SEOHead";

const HERO_VIDEOS = [
  "/videos/hero_1.mp4",
  "/videos/hero_2.mp4",
  "/videos/hero_3.mp4",
  "/videos/hero_4.mp4",
  "/videos/hero_5.mp4",
  "/videos/hero_6.mp4",
];

export default function HomePage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { location, openLocationModal } = useLocationContext();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const videoRefs = React.useRef([]);

  const handleVideoEnded = () => {
    setCurrentVideoIdx((prev) => (prev + 1) % HERO_VIDEOS.length);
  };

  useEffect(() => {
    const activeVideo = videoRefs.current[currentVideoIdx];
    if (activeVideo) {
      activeVideo.playbackRate = 0.65; // Cinematic slow motion
      activeVideo.currentTime = 0;
      activeVideo.play().catch(() => {});
    }
  }, [currentVideoIdx]);

  const trendingSearches = isHi
    ? ["मास्टर इलेक्ट्रीशियन", "मास्टर प्लंबर", "बढ़ई", "पेंटर", "एसी तकनीशियन", "सफाई कर्मी"]
    : ["Master Electrician", "Master Plumber", "Carpenter", "Painter", "AC Technician", "Deep Cleaning"];

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (user?.role === "federation_admin") navigate("/federation/dashboard", { replace: true });
    else if (user?.role === "society_admin") navigate("/society/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    setFeaturedLoading(true);
    // Hyper-local query: fetch masters closest to selected location
    const params = {
      lat: location.lat,
      lng: location.lng,
      radius_km: location.radius_km || 15,
      limit: 8,
    };

    contractorAPI
      .search(params)
      .then((res) => {
        const list = res.data?.contractors || res.data?.data || [];
        if (list.length > 0) {
          setFeatured(list);
        } else {
          // Fallback to featured if area has sparse density
          contractorAPI.getFeatured().then((fRes) => setFeatured(fRes.data?.contractors || []));
        }
      })
      .catch(() => {
        contractorAPI.getFeatured().then((fRes) => setFeatured(fRes.data?.contractors || []));
      })
      .finally(() => setFeaturedLoading(false));
  }, [location.lat, location.lng, location.radius_km]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.lat && location.lng) {
      params.set("lat", location.lat);
      params.set("lng", location.lng);
      params.set("radius_km", location.radius_km || 10);
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId) => {
    const params = new URLSearchParams({ category: categoryId });
    if (location.lat && location.lng) {
      params.set("lat", location.lat);
      params.set("lng", location.lng);
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <main className="bg-slate-50 min-h-screen text-slate-800">
      <SEOHead
        title="सहकार — Verified Masters for Home Services | SahKaar"
        description="Book verified Master Electricians, Plumbers, Carpenters, Painters & Technicians directly from Labour Cooperative Societies. 100% verified documents, fair pricing, zero middlemen."
      />

      {/* ═══════ HERO SECTION: CINEMATIC SEAMLESS INFINITE VIDEO BACKGROUND ═══════ */}
      <section className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center text-white pt-16 pb-28 px-4 sm:px-6 overflow-hidden bg-black">
        
        {/* Infinite Looping Multi-Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
          {HERO_VIDEOS.map((src, index) => {
            const isActive = index === currentVideoIdx;
            const isNext = index === (currentVideoIdx + 1) % HERO_VIDEOS.length;
            if (!isActive && !isNext) return null;
            return (
              <video
                key={src}
                ref={(el) => (videoRefs.current[index] = el)}
                src={src}
                autoPlay={isActive}
                muted
                playsInline
                preload={isActive ? "auto" : "metadata"}
                onCanPlay={(e) => {
                  if (isActive) e.currentTarget.play().catch(() => {});
                }}
                onLoadedMetadata={(e) => {
                  e.currentTarget.playbackRate = 0.65;
                }}
                onEnded={isActive ? handleVideoEnded : undefined}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                  isActive ? "opacity-85 scale-100" : "opacity-0 scale-105 pointer-events-none"
                }`}
                style={{ filter: "brightness(1.05) contrast(1.02)" }}
              />
            );
          })}

          {/* Lighter, Crisp Neutral Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-black/75" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/20 to-black/65" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/20 text-emerald-400 text-xs font-extrabold shadow-lg backdrop-blur-md">
            <FiShield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isHi ? "100% सहकारी सत्यापित मास्टर कारीगर" : "100% Cooperative Verified Masters"}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg">
            {isHi ? (
              <>
                घर की हर सेवा के लिए <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400">
                  विश्वसनीय सहकारी मास्टर
                </span>
              </>
            ) : (
              <>
                Home Services by <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400">
                  Cooperative Verified Masters
                </span>
              </>
            )}
          </h1>

          <p className="max-w-2xl mx-auto text-slate-100 text-sm sm:text-base font-normal leading-relaxed drop-shadow-md">
            {isHi
              ? "बिजली, नल, बढ़ई, पेंटिंग व घरेलू उपकरण मरम्मत — जिला सहकारी समितियों द्वारा सीधे सत्यापित कुशल मास्टर कारीगर।"
              : "Connecting households directly with verified Master Electricians, Plumbers, Carpenters & Technicians from Primary Labour Cooperative Federations."}
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-6">
            <div className="flex items-center bg-white rounded-2xl shadow-2xl p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-amber-500 transition-all">
              <button
                type="button"
                onClick={openLocationModal}
                className="items-center gap-1.5 px-3 py-1.5 my-auto border-r border-slate-200 text-slate-700 hover:text-slate-950 text-xs font-bold shrink-0 hidden sm:flex cursor-pointer transition-colors"
                title="Change location"
              >
                <FiMapPin className="w-3.5 h-3.5 text-rose-500" />
                <span className="truncate max-w-[120px]">{location.shortName || location.name}</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              <FiSearch className="ml-3 text-slate-400 w-5 h-5 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isHi ? "मास्टर इलेक्ट्रीशियन, प्लंबर, कारपेंटर खोजें..." : "Search 'Master Electrician', 'Plumber', 'Carpenter'..."}
                className="flex-1 h-12 px-3 text-slate-900 text-sm font-semibold outline-none placeholder:text-slate-400 bg-transparent"
              />
              <button
                type="submit"
                className="h-12 px-6 sm:px-8 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{isHi ? "खोजें" : "Find Master"}</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Trending Searches */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-slate-300 pt-1">
            <span className="font-bold text-slate-400">{isHi ? "लोकप्रिय:" : "Popular:"}</span>
            {trendingSearches.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(item);
                  navigate(`/search?q=${encodeURIComponent(item)}`);
                }}
                className="px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition-all text-[11px] font-semibold backdrop-blur-sm cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Video Carousel Dots / Clip Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-3">
            {HERO_VIDEOS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentVideoIdx(idx)}
                className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${
                  idx === currentVideoIdx
                    ? "w-7 bg-amber-400 shadow-xs"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
                title={`Play video clip ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CATEGORIES GRID (URBAN COMPANY STYLE) ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {isHi ? "मास्टर कारीगर सेवाएं चुनें" : "Select a Master Service"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHi ? "कुशल व प्रमाणित मास्टर आपके घर पर" : "Skilled, cooperative-certified professionals at your doorstep"}
              </p>
            </div>

            <Link
              to="/categories"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>{isHi ? "सभी देखें" : "View All"}</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Categories 4 or 8 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORIES.slice(0, 8).map((cat) => (
              <motion.div
                key={cat.id}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => handleCategoryClick(cat.id)}
                className="group cursor-pointer rounded-2xl p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 mb-3">
                  {cat.emoji || "🔧"}
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Master {isHi ? cat.hindiName.split("/")[0] : cat.name.split("/")[0]}
                </h3>

                <p className="text-[11px] text-slate-500 mt-0.5 font-medium line-clamp-1">
                  {isHi ? "सत्यापित मास्टर उपलब्ध" : "Cooperative verified"}
                </p>

                <div className="mt-2 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Starting ₹399
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED MASTERS NEAR YOU ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-600 mb-1">
              <FiZap className="w-3.5 h-3.5" /> Top Rated Masters
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isHi ? "आपके नजदीकी अनुशंसित मास्टर" : "Recommended Masters Near You"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isHi ? "रेटिंग, समीक्षा व त्वरित सेवा के आधार पर शीर्ष मास्टर" : "Highest rated artisans with cooperative verification badges"}
            </p>
          </div>

          <Link
            to="/search"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-sm"
          >
            <span>{isHi ? "सभी मास्टर देखें" : "Explore All"}</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.slice(0, 6).map((worker) => (
              <ContractorCard key={worker.id} contractor={worker} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <FiTool className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Explore all verified masters in your area</p>
            <Link to="/search" className="btn-primary mt-3 inline-block text-xs py-2 px-5">
              Browse Masters
            </Link>
          </div>
        )}
      </section>

      {/* ═══════ THE SAHKAAR COOPERATIVE GUARANTEE ═══════ */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {isHi ? "सहकार सुरक्षा भरोसा" : "The SahKaar Trust Guarantee"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              {isHi ? "सहकार मंच से मास्टर बुक क्यों करें?" : "Why Book a SahKaar Master?"}
            </h2>
            <p className="text-sm text-slate-300">
              {isHi
                ? "निजी कंपनियों के भारी कमीशन और अस्पष्टता से मुक्त — सीधे श्रम सहकारी समितियों द्वारा संचालित।"
                : "Zero high middleman commissions. 100% transparent pricing and guaranteed worker social security."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-extrabold">
                <FiShield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isHi ? "100% दस्तावेज़ सत्यापन" : "100% Document Verification"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isHi
                  ? "हर मास्टर का आधार, राष्ट्रीय कौशल प्रमाणपत्र (NCCT/Skill Mission) व सहकारी समिति सदस्यता प्रमाण फेडरेशन एडमिन द्वारा सत्यापित।"
                  : "Every Master is rigorously vetted by Federation Admins with Government ID, Skill Certification, and Cooperative Membership records."}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-extrabold">
                <FiZap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isHi ? "उचित व पारदर्शी मूल्य" : "Fair & Transparent Pricing"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isHi
                  ? "निजी एग्रीगेटर्स का 25-30% कमीशन नहीं। आपकी पूरी राशि सीधे काम करने वाले मास्टर को मिलती है।"
                  : "Zero exploitative commissions. Artisans keep their earnings, resulting in honest pricing and high-quality workmanship."}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-extrabold">
                <FiHeart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isHi ? "कारीगर कल्याण व बीमा" : "Artisan Social Security"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isHi
                  ? "हर बुकिंग से मास्टर को ₹5 लाख दुर्घटना बीमा व सहकारी पेंशन कोष का संरक्षण मिलता है।"
                  : "Every booking supports the Cooperative Welfare Pool and ₹5 Lakh Pradhan Mantri Suraksha Bima for the artisan's family."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MASTER ONBOARDING BANNER ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-extrabold backdrop-blur-md">
              <FiAward className="w-3.5 h-3.5" />
              <span>{isHi ? "मास्टर कारीगरों के लिए विशेष" : "For Skilled Artisans & Pros"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
              {isHi ? "सहकार मास्टर बनें और अपनी कमाई बढ़ाएं" : "Join as a SahKaar Master & Grow Your Business"}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              {isHi
                ? "अपनी सहकारी समिति से रजिस्टर करें, सत्यापित बैज पाएं और अपने क्षेत्र में ग्राहकों के सीधे बुकिंग ऑर्डर्स प्राप्त करें।"
                : "Register with your Cooperative Federation, get your Verified Master Badge, and receive direct customer booking requests."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/register/contractor"
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span>{isHi ? "मास्टर रजिस्ट्रेशन शुरू करें" : "Register as Master"}</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
