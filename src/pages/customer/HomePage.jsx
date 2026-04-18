import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import { contractorAPI } from "../../services/api";
import ContractorCard from "../../components/common/ContractorCard";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { FiTrendingUp, FiSearch, FiArrowRight, FiStar, FiMapPin, FiMap } from "react-icons/fi";

/* ══════════════════════════════════════════════
   GSAP SCROLL-TRIGGERED ANIMATIONS
   ══════════════════════════════════════════════ */
function useGSAPAnimations() {
  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    // Fade-up sections on scroll
    document.querySelectorAll('.gsap-fade-up').forEach((el) => {
      gsap.fromTo(el,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        }
      );
    });

    // Card entrance with subtle rotation
    document.querySelectorAll('.gsap-card-enter').forEach((el, i) => {
      gsap.fromTo(el,
        { y: 60, opacity: 0, rotation: 1.5 },
        {
          y: 0, opacity: 1, rotation: 0,
          duration: 0.6,
          ease: "expo.out",
          delay: i * 0.1,
          scrollTrigger: { trigger: el, start: "top 90%", once: true }
        }
      );
    });

    // Stat counter animation
    document.querySelectorAll('.gsap-counter').forEach((el) => {
      const target = parseInt(el.dataset.target) || 0;
      gsap.fromTo(el,
        { innerText: 0 },
        {
          innerText: target,
          duration: 1.5,
          ease: "power2.out",
          snap: { innerText: 1 },
          scrollTrigger: { trigger: el, start: "top 85%", once: true }
        }
      );
    });

    return () => {
      window.ScrollTrigger?.getAll().forEach(t => t.kill());
    };
  }, []);
}

/* ── Magnetic hover for buttons (GSAP) ── */
function MagneticButton({ children, className, onClick, tag = "button" }) {
  const ref = useRef(null);
  const handleMove = useCallback((e) => {
    if (!ref.current || !window.gsap) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
    window.gsap.to(ref.current, { x, y, duration: 0.2, ease: "power2.out" });
  }, []);
  const handleLeave = useCallback(() => {
    if (!ref.current || !window.gsap) return;
    window.gsap.to(ref.current, { x: 0, y: 0, duration: 0.4, ease: "elastic.out(1, 0.5)" });
  }, []);
  const Tag = tag;
  return (
    <Tag ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={onClick} className={className} style={{ display: 'inline-flex' }}>
      {children}
    </Tag>
  );
}

/* ── Marquee Ticker — runs between sections ── */
function MarqueeTicker() {
  const text = "CONTRACTORS · PROJECTS · TRUSTED WORK · VERIFIED PROFESSIONALS · QUALITY BUILDS · EXPERT TEAMS · ";
  return (
    <div className="overflow-hidden py-6 md:py-10 border-y border-[var(--color-border)]">
      <div className="marquee-track">
        <span className="marquee-text">{text}</span>
        <span className="marquee-text">{text}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showTrending, setShowTrending] = useState(false);
  const { request: getLocation, lat, lng } = useGeolocation();

  const trendingSearches = ["Plumber", "Electrician", "Civil Contractor", "Carpenter", "Painter"];

  useGSAPAnimations();

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    contractorAPI.getFeatured()
      .then((res) => setFeatured(res.data.contractors || []))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial((prev) => (prev + 1) % 3), 5000);
    return () => clearInterval(timer);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams({ q: query });
    if (lat && lng) { params.set("lat", lat); params.set("lng", lng); }
    navigate(`/search?${params}`);
  }

  function handleCategoryClick(categoryId) {
    navigate(`/search?category=${categoryId}`);
  }

  const stats = [
    { value: 500, suffix: "+", label: "Contractors" },
    { value: 10, suffix: "k+", label: "Projects Done" },
    { value: 98, suffix: "%", label: "Satisfaction" },
    { value: 50, suffix: "+", label: "Cities" }
  ];

  const testimonials = useMemo(() => [
    {
      quote: lang === "hi"
        ? "24 ghante mein verified contractor mil gaya. Quality aur response dono laajawab the."
        : "We hired a verified contractor in under 24 hours. Response time and quality were outstanding.",
      name: "Shivang Singh", role: "Homeowner", avatar: "SS"
    },
    {
      quote: lang === "hi"
        ? "Thekedaar ne serious clients connect kiye. Lead conversion clearly improve hua."
        : "Thekedaar connected us with serious clients. Our lead conversion improved significantly.",
      name: "Alok Kumar", role: "Contractor Partner", avatar: "AK"
    },
    {
      quote: lang === "hi"
        ? "Filters aur profile comparison se right professional choose karna bahut easy ho gaya."
        : "Search filters and profile comparison made choosing the right professional incredibly easy.",
      name: "Mudit Kalya", role: "Business Owner", avatar: "MK"
    },
  ], [lang]);

  return (
    <main id="main-content" className="overflow-hidden">

      {/* ═══════ HERO — DARK PREMIUM ═══════ */}
      <section
        id="home"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at top, #141B3D 0%, #090B19 70%)',
        }}
      >
        {/* Ambient glows */}
        <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)' }} />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 hero-grid opacity-40" />


        {/* Hero Content */}
        <div className="relative z-30 w-full max-w-[1400px] mx-auto px-5 md:px-10 pt-16 md:pt-24 pb-10">
          <div className="max-w-[900px]">
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-10"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-200/60 text-[10px] font-semibold uppercase tracking-[0.3em]">
                Premium Service Network
              </span>
            </motion.div>

            {/* ✦ ELITE CONTRACTORS VERIFIED RESULTS ✦ */}
            <div className="mb-6 space-y-0">
              {["ELITE", "CONTRACTORS", "VERIFIED", "RESULTS"].map((word, i) => (
                <motion.h1
                  key={word}
                  initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display font-extrabold uppercase leading-[0.9] tracking-[-0.04em]"
                  style={{
                    fontSize: 'clamp(2.2rem, 10vw, 8rem)',
                    color: i === 1
                      ? '#818CF8'
                      : i === 2
                        ? '#22D3EE'
                        : '#ECEEF6',
                  }}
                >
                  {word}
                </motion.h1>
              ))}
            </div>

            {/* Handwritten annotation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mb-8"
            >
              <span className="script-annotation text-xl text-cyan-300">Find your perfect contractor →</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-slate-400 text-base md:text-lg max-w-xl mb-10 leading-relaxed"
            >
              Connect with trusted professionals through powerful search, verified profiles, and transparent ratings.
            </motion.p>

            {/* CTA Buttons — Magnetic */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="flex flex-wrap gap-4"
            >
              <MagneticButton
                onClick={() => navigate("/search")}
                className="h-14 px-10 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-bold uppercase tracking-[0.1em] shadow-[0_4px_30px_rgba(99,102,241,0.3)] btn-shimmer animate-pulse-glow items-center justify-center gap-2"
              >
                Explore Services
                <FiArrowRight className="inline ml-1 -mt-0.5" />
              </MagneticButton>
              <MagneticButton
                onClick={() => navigate("/register/contractor")}
                className="h-14 px-10 rounded-xl border-2 border-white/20 text-white/90 text-sm font-bold uppercase tracking-[0.1em] hover:bg-white/5 hover:border-white/30 transition-all items-center justify-center"
              >
                Become a Partner
              </MagneticButton>
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={handleSearch}
            className="mt-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl max-w-4xl relative z-50 shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
          >
            <div className="grid md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-[18px] h-[18px]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowTrending(true)}
                  onBlur={() => setTimeout(() => setShowTrending(false), 200)}
                  placeholder="Search contractors, services, or location..."
                  className="w-full h-[58px] bg-transparent text-white placeholder-slate-500 border-0 outline-none text-[15px]"
                  style={{ paddingLeft: '52px', paddingRight: '16px' }}
                />
                <AnimatePresence>
                  {showTrending && !query && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#13151D] rounded-xl shadow-xl border border-white/[0.08] z-[999] max-h-[280px] overflow-y-auto"
                    >
                      <div className="px-4 py-3 border-b border-white/[0.05]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <FiTrendingUp size={11} /> Trending Searches
                        </p>
                      </div>
                      <div className="p-1.5">
                        {trendingSearches.map(term => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => { setQuery(term); setShowTrending(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] rounded-lg transition-colors flex items-center gap-3"
                          >
                            <FiSearch className="w-3.5 h-3.5 text-slate-500" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button type="button" onClick={getLocation} className="h-[58px] px-5 border-t md:border-t-0 md:border-l border-white/[0.06] text-slate-400 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors text-sm">
                <FiMapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Location</span>
              </button>
              <button type="submit" className="h-[58px] px-8 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-r-2xl md:rounded-l-none hover:from-indigo-600 hover:to-indigo-700 transition-all text-sm uppercase tracking-wider">
                {t("app.search")}
              </button>
            </div>
          </motion.form>

          {/* Scroll indicator - Removed absolute positioning to prevent overlap */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-14 w-full flex justify-center z-50">
            <a href="/#services" className="inline-flex flex-col items-center text-slate-500 text-[10px] uppercase tracking-[0.3em] hover:text-slate-300 transition-colors">
              Scroll
              <span className="mt-2 w-5 h-8 rounded-full border border-slate-700/50 inline-flex items-start justify-center p-1">
                <span className="hero-scroll-dot bg-indigo-400" />
              </span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════ MARQUEE TICKER — NEW ═══════ */}
      <MarqueeTicker />

      {/* ═══════ STATS — GSAP animated counters ═══════ */}
      <section className="hidden md:block max-w-[1400px] mx-auto px-5 md:px-10 py-28 text-center">
        <div className="gsap-fade-up flex flex-col md:flex-row items-center justify-between gap-10 md:gap-0">
          {stats.map((stat, i) => (
            <React.Fragment key={i}>
              <div className="text-center px-8">
                <p className="font-display font-extrabold text-[var(--color-heading)] leading-none tracking-[-0.03em]" style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)' }}>
                  <span className="gsap-counter" data-target={stat.value}>{stat.value}</span>{stat.suffix}
                </p>
                <p className="text-[12px] font-semibold text-[var(--color-muted)] uppercase tracking-[0.15em] mt-3">{stat.label}</p>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden md:block w-px bg-[var(--color-border)] self-stretch" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ═══════ SERVICE PATHS ═══════ */}
      <section className="max-w-[1400px] mx-auto px-5 md:px-10 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {/* Quick Services */}
          <div onClick={() => navigate("/quick-services")} className="gsap-card-enter glass-card p-8 cursor-pointer group border-l-4 border-indigo-500/60">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--color-heading)] group-hover:text-indigo-400 transition-colors">Quick Services</h3>
            <p className="text-[var(--color-muted)] text-sm mt-2 leading-relaxed">AC repair, plumbing, electrician — instant booking for everyday needs.</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 mt-4 opacity-0 group-hover:opacity-100 group-hover:gap-2 transition-all">
              Browse Services <FiArrowRight size={12} />
            </span>
          </div>

          {/* Macro Services */}
          <div onClick={() => navigate("/macro-services")} className="gsap-card-enter glass-card p-8 cursor-pointer group border-l-4 border-cyan-500/60">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--color-heading)] group-hover:text-cyan-400 transition-colors">Macro Services</h3>
            <p className="text-[var(--color-muted)] text-sm mt-2 leading-relaxed">Construction, renovation, interior — trusted contractors for big projects.</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 mt-4 opacity-0 group-hover:opacity-100 group-hover:gap-2 transition-all">
              Find Contractors <FiArrowRight size={12} />
            </span>
          </div>

          {/* Local Directory */}
          <div onClick={() => navigate("/directory")} className="gsap-card-enter glass-card p-8 cursor-pointer group border-l-4 border-amber-500/60">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <FiMap size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-[var(--color-heading)] group-hover:text-amber-400 transition-colors">Local Directory</h3>
            <p className="text-[var(--color-muted)] text-sm mt-2 leading-relaxed">Discover nearby doctors, shops, tutors — your neighborhood at a glance.</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 mt-4 opacity-0 group-hover:opacity-100 group-hover:gap-2 transition-all">
              Explore Nearby <FiArrowRight size={12} />
            </span>
          </div>
        </div>
      </section>

      {/* ═══════ CORE SERVICES (Category Grid) ═══════ */}
      <section id="services" className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
        <div className="gsap-fade-up mb-12">
          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Categories</p>
          <h2 className="section-title">{lang === "hi" ? "कोर सर्विसेज" : "Core Services"}</h2>
          <p className="section-subtitle mt-4">Choose a category and connect with verified contractors in minutes.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.slice(0, 7).map((cat) => (
            <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="gsap-card-enter text-left glass-card p-7 group">
              <div className="mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/12 to-cyan-500/8 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                <Icon name={cat.icon} className="w-6 h-6" />
              </div>
              <p className="font-display text-base font-semibold text-[var(--color-heading)] group-hover:text-indigo-400 transition-colors">{t(cat.key)}</p>
              <p className="text-sm text-[var(--color-muted)] mt-1.5 leading-relaxed">{cat.subtitle}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-all group-hover:gap-2">
                Explore <FiArrowRight size={12} />
              </div>
            </button>
          ))}
          <button onClick={() => navigate("/search")} className="gsap-card-enter text-left glass-card p-7 group border-dashed border-indigo-500/15 hover:border-indigo-500/30">
            <div className="mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-all duration-500">
              <FiArrowRight className="w-6 h-6" />
            </div>
            <p className="font-display text-base font-semibold text-[var(--color-heading)] group-hover:text-indigo-400 transition-colors">Explore All</p>
            <p className="text-sm text-[var(--color-muted)] mt-1.5 leading-relaxed">Browse all service categories.</p>
          </button>
        </div>
      </section>

      {/* ═══════ FEATURED CONTRACTORS ═══════ */}
      <section className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
        <div className="gsap-fade-up mb-12">
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Handpicked</p>
          <h2 className="section-title">{t("home.featured")}</h2>
          <p className="section-subtitle mt-4">Curated high-trust contractor profiles.</p>
          <span className="script-annotation mt-3 text-lg">Most popular! ⭐</span>
        </div>

        {featuredLoading ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="glass-card p-5">
                <div className="flex gap-4">
                  <div className="skeleton w-[72px] h-[72px] rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="skeleton h-5 w-3/4 rounded-md" />
                    <div className="skeleton h-4 w-1/2 rounded-md" />
                    <div className="flex gap-2"><div className="skeleton h-6 w-20 rounded-md" /><div className="skeleton h-6 w-16 rounded-md" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {featured.slice(0, 4).map((c) => (
              <div key={c.id} className="gsap-card-enter">
                <ContractorCard contractor={c} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-muted)] text-sm py-12 text-center">No featured contractors yet.</p>
        )}
      </section>

      {/* ═══════ SECOND MARQUEE ═══════ */}
      <MarqueeTicker />

      {/* ═══════ TESTIMONIALS — Tilted fan layout ═══════ */}
      <section id="about" className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 md:py-28">
        <div className="gsap-fade-up text-center mb-16">
          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Trusted by thousands</p>
          <h2 className="section-title">What People Say</h2>
          <p className="section-subtitle mt-4 mx-auto">Real feedback from real customers and contractor partners.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <article
              key={item.name}
              className={`gsap-card-enter testimonial-card glass-card p-8 transition-all duration-500 cursor-default ${activeTestimonial === index ? "ring-1 ring-indigo-500/30 shadow-glow" : ""
                }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                  {item.avatar}
                </div>
                <div>
                  <p className="font-display text-[var(--color-heading)] font-semibold text-sm">{item.name}</p>
                  <p className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider">{item.role}</p>
                </div>
              </div>
              <p className="text-[var(--color-body)] leading-relaxed text-[15px]">"{item.quote}"</p>
              <div className="flex gap-0.5 mt-5 text-amber-400">
                {[...Array(5)].map((_, i) => <FiStar key={i} size={14} fill="currentColor" />)}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ═══════ CTA SECTION ═══════ */}
      <section className="max-w-[1400px] mx-auto px-5 md:px-10 pb-20">
        <div className="gsap-fade-up rounded-3xl p-10 md:p-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #13151D, #1A1C28)' }}>
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: 'rgba(99,102,241,0.12)' }} />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full blur-[80px]" style={{ background: 'rgba(6,182,212,0.08)' }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h3 className="font-display text-3xl md:text-4xl text-white font-bold leading-tight">Ready to grow<br />with us?</h3>
              <p className="mt-4 text-slate-400 text-base max-w-md leading-relaxed">Join thousands of happy customers and trusted contractors on our platform.</p>
            </div>
            <MagneticButton
              onClick={() => navigate("/search")}
              className="h-[52px] px-8 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold self-start md:self-auto btn-shimmer shadow-lg text-sm uppercase tracking-wider items-center justify-center gap-2"
            >
              Get Started <FiArrowRight className="inline ml-1.5" />
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer id="contact" className="border-t border-[var(--color-border)] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0C0F1D, #13151D)' }}>
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 font-display font-extrabold uppercase text-white/[0.02] whitespace-nowrap pointer-events-none leading-none tracking-[-0.04em]" style={{ fontSize: 'clamp(6rem, 15vw, 14rem)' }}>
          THEKEDAAR
        </div>

        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
          <div>
            <p className="font-display text-xl font-bold text-white mb-2">Thekedaar</p>
            <p className="text-sm text-slate-500 leading-relaxed">India's trusted contractor discovery platform for businesses and homeowners.</p>
          </div>
          <div>
            <p className="font-display font-semibold text-[11px] text-slate-400 mb-4 uppercase tracking-[0.2em]">Quick Links</p>
            <div className="grid gap-2.5 text-sm">
              {["Home", "Services", "About", "Contact"].map(l => (
                <a key={l} href={`/#${l.toLowerCase()}`} className="text-slate-500 hover:text-indigo-400 transition-colors">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-display font-semibold text-[11px] text-slate-400 mb-4 uppercase tracking-[0.2em]">Contact</p>
            <div className="grid gap-2.5 text-sm text-slate-500">
              <p>apkathekedaar@gmail.com</p>
              <p>+91 8303959728</p>
              <p>Manit Bhopal, Madhya Pradesh</p>
              <p>Mon – Sat, 9 AM – 7 PM</p>
            </div>
          </div>
          <div>
            <p className="font-display font-semibold text-[11px] text-slate-400 mb-4 uppercase tracking-[0.2em]">Social</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "LinkedIn", href: "https://www.linkedin.com" },
                { label: "X", href: "https://x.com" },
                { label: "Instagram", href: "https://www.instagram.com" },
                { label: "WhatsApp", href: "https://wa.me/919000000000" },
              ].map((s) => (
                <a key={s.label} href={s.href} className="px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 transition-all">{s.label}</a>
              ))}
            </div>
            <a href="/login?admin=1" className="inline-flex items-center px-3 py-2 mt-4 rounded-lg border border-indigo-500/20 text-xs text-indigo-400 font-semibold hover:bg-indigo-500 hover:text-white transition-all">
              Admin Login
            </a>
          </div>
        </div>
        <div className="border-t border-white/[0.04] relative z-10">
          <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-5 text-[11px] flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-600">© 2026 Thekedaar. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="/privacy-policy" className="text-slate-600 hover:text-indigo-400 transition-colors">Privacy</a>
              <a href="/terms" className="text-slate-600 hover:text-indigo-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
