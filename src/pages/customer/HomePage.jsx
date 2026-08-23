import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import { contractorAPI } from "../../services/api";
import ContractorCard from "../../components/common/ContractorCard";
import { useAuth } from "../../context/AuthContext";
import {
  FiSearch,
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiStar,
  FiChevronRight,
  FiZap,
  FiHeart,
  FiMapPin,
  FiLayers,
  FiUsers,
  FiAward
} from "react-icons/fi";
import SEOHead from "../../components/common/SEOHead";

export default function HomePage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const { lat, lng } = useGeolocation();

  const trendingSearches = isHi
    ? ["इलेक्ट्रीशियन", "प्लंबर", "बढ़ई", "पेंटर", "घरेलू सहायिका", "एसी तकनीशियन"]
    : ["Electrician", "Plumber", "Carpenter", "Painter", "Domestic Helper", "AC Technician"];

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (user?.role === "federation_admin") navigate("/federation/dashboard", { replace: true });
    else if (user?.role === "society_admin") navigate("/society/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    contractorAPI.getFeatured()
      .then((res) => setFeatured(res.data.contractors || []))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({ q: query });
    if (lat && lng) { params.set("lat", lat); params.set("lng", lng); }
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/search?category=${encodeURIComponent(categoryId)}`);
  };

  return (
    <main className="bg-[#F4F6F9] min-h-screen text-slate-800">
      <SEOHead
        title="सहकारी — राष्ट्रीय श्रम सहकारी सेवा मंच | SahKaari"
        description="Connecting verified skilled workers from Labour Cooperative Federations and Societies with households and institutions. 100% verified, welfare protected, zero exploitation."
      />

      {/* ═══════ SECTION 1: OFFICIAL GOVERNMENT PORTAL HERO ═══════ */}
      <section className="relative bg-[#0B3C5D] text-white py-16 md:py-24 border-b-4 border-[#FF9933] overflow-hidden">
        {/* Subtle Ashoka Chakra / Geometric Background Texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#082B42] border border-[#138808]/60 text-amber-300 text-xs font-extrabold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#138808] animate-pulse"></span>
            <span>{isHi ? "सहकारिता मंत्रालय (भारत सरकार) मान्यता प्राप्त मंच" : "Ministry of Cooperation Verified Platform"}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            {isHi ? (
              <>
                सहकारी श्रम शक्ति से <span className="text-[#FF9933]">समृद्धि और विश्वास</span>
              </>
            ) : (
              <>
                Empowering Cooperative Artisans, <br className="hidden sm:inline" />
                <span className="text-[#FF9933]">Serving Every Indian Household</span>
              </>
            )}
          </h1>

          <p className="max-w-3xl mx-auto text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
            {isHi
              ? "इलेक्ट्रीशियन, प्लंबर, बढ़ई, पेंटर, घरेलू सहायिका व तकनीशियन — प्राथमिक श्रम सहकारी समितियों द्वारा प्रमाणित, ₹5 लाख प्रधानमंत्री सुरक्षा बीमा व कल्याण कोष से सुरक्षित।"
              : "Connecting households directly with verified electricians, plumbers, carpenters, painters, domestic helpers & technicians from registered Labour Cooperative Societies. Fair wages, full social security & trusted digital escrow."}
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-4">
            <div className="flex items-center bg-white rounded-xl shadow-xl overflow-hidden p-1.5 border-2 border-[#CBD5E1] focus-within:border-[#FF9933] transition-all">
              <FiSearch className="ml-3 text-[#0B3C5D] w-5 h-5 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isHi ? "इलेक्ट्रीशियन, प्लंबर, बढ़ई, पेंटर या घरेलू सहायिका खोजें..." : "Search for certified electricians, plumbers, painters, maids..."}
                className="flex-1 h-12 px-3 text-slate-900 text-sm font-semibold outline-none placeholder:text-slate-400 bg-transparent"
              />
              <button
                type="submit"
                className="h-12 px-6 sm:px-8 rounded-lg bg-[#0B3C5D] hover:bg-[#082B42] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>{isHi ? "खोजें" : "Search"}</span>
                <FiArrowRight />
              </button>
            </div>
          </form>

          {/* Trending Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              {isHi ? "लोकप्रिय सेवाएं:" : "Popular Trades:"}
            </span>
            {trendingSearches.map((term, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(term);
                  navigate(`/search?q=${encodeURIComponent(term)}`);
                }}
                className="px-3 py-1 rounded-md bg-[#082B42]/80 hover:bg-[#0E4A73] text-amber-200 border border-slate-600 font-semibold transition-colors text-[11px]"
              >
                {term}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════ SECTION 2: NATIONAL COOPERATIVE IMPACT STRIP ═══════ */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B3C5D] font-mono">34+</div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              {isHi ? "संबद्ध प्राथमिक समितियाँ" : "Primary Labour Societies"}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#138808] font-mono">4,850+</div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              {isHi ? "प्रमाणित कारीगर सदस्य" : "NCCT Certified Artisans"}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#D35400] font-mono">₹1.58 Cr</div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              {isHi ? "श्रमिक कल्याण कोष कॉर्पस" : "Worker Welfare Pool"}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B3C5D] font-mono">100%</div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              {isHi ? "₹5 लाख सुरक्षा बीमा कवर्ड" : "PMSBY ₹5L Insured"}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 3: 11 AUTHENTIC HOUSEHOLD & COMMUNITY TRADES ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#0B3C5D] pb-4">
          <div>
            <span className="text-[11px] font-extrabold text-[#138808] uppercase tracking-wider">
              {isHi ? "मान्यता प्राप्त श्रम श्रेणियाँ" : "Accredited Household Trades"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3C5D] mt-0.5">
              {isHi ? "प्रमाणित सहकारी सेवाएं चुनें" : "Select a Certified Cooperative Service"}
            </h2>
          </div>
          <Link
            to="/search"
            className="text-xs font-extrabold text-[#0B3C5D] hover:underline flex items-center gap-1"
          >
            <span>{isHi ? "सभी कारीगर देखें" : "View All Certified Artisans"}</span>
            <FiChevronRight />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="text-left bg-white rounded-xl border border-slate-200 hover:border-[#0B3C5D] p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[10px] font-extrabold text-[#138808] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {isHi ? "प्रमाणित" : "Verified"}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0B3C5D] transition-colors">
                {isHi ? cat.hindiName : cat.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {isHi ? "सहकारी समिति द्वारा सत्यापित कारीगर" : "Affiliated with Primary Society"}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════ SECTION 4: HOW THE COOPERATIVE MODEL WORKS ═══════ */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-extrabold text-[#D35400] uppercase tracking-wider">
              {isHi ? "पारदर्शी व शोषण-मुक्त व्यवस्था" : "Transparent & Exploitation-Free Architecture"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B3C5D]">
              {isHi ? "सहकारी मॉडल कैसे कार्य करता है?" : "How the Cooperative Platform Protects You & Workers"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#F4F6F9] border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#EDF4F9] text-[#0B3C5D] flex items-center justify-center font-extrabold text-lg border border-[#D6E6F0]">
                1
              </div>
              <h3 className="font-extrabold text-[#0B3C5D] text-base">
                {isHi ? "कौशल प्रमाणन व सत्यापन" : "Institutional Verification"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHi
                  ? "प्रत्येक कारीगर राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) व प्राथमिक समिति द्वारा पृष्ठभूमि जांच व आधार लिंक के बाद ही पंजीकृत होता है।"
                  : "Every artisan is verified by their Primary Cooperative Society under Ministry of Cooperation / NCCT guidelines with Aadhaar linkage."}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F4F6F9] border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D35400] flex items-center justify-center font-extrabold text-lg border border-amber-200">
                2
              </div>
              <h3 className="font-extrabold text-[#0B3C5D] text-base">
                {isHi ? "उचित मजदूरी व तत्काल आपातकालीन सेवा" : "Fair Wages & 45-Min Emergency"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHi
                  ? "निजी कंपनियों की तरह अत्यधिक कमीशन नहीं काटा जाता। आपातकालीन ब्रेकडाउन के लिए 45 मिनट में तत्काल सेवा उपलब्ध।"
                  : "Zero middleman exploitation. Transparent daily & job rates with 45-min on-demand priority emergency dispatch for urgent electrical or plumbing faults."}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F4F6F9] border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#138808] flex items-center justify-center font-extrabold text-lg border border-emerald-200">
                3
              </div>
              <h3 className="font-extrabold text-[#0B3C5D] text-base">
                {isHi ? "कल्याण कोष व डिजिटल एस्क्रो" : "Welfare Pool & Secure Escrow"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHi
                  ? "हर बुकिंग से ₹25 सीधे समिति कल्याण कोष (पेंशन, टूल अनुदान, चिकित्सा) में जाते हैं। ग्राहक भुगतान काम पूरा होने तक सुरक्षित रहता है।"
                  : "Every booking contributes ₹25 into the Society Welfare Corpus for artisan pensions & tool grants. Payments held in digital escrow until quality verified."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 5: FEATURED ARTISANS ROSTER ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B3C5D]">
              {isHi ? "निकटतम सत्यापित सहकारी कारीगर" : "Featured Verified Cooperative Artisans"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHi ? "उच्चतम रेटिंग व पृष्ठभूमि सत्यापित कारीगर" : "Top rated professionals backed by Primary Labour Societies"}
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-[#0B3C5D] hover:underline"
          >
            {isHi ? "सभी देखें →" : "View all →"}
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.slice(0, 6).map((worker) => (
              <ContractorCard key={worker.id} contractor={worker} />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
