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
import { FiTrendingUp, FiSearch, FiArrowRight, FiCheckCircle, FiStar, FiMapPin, FiBriefcase } from "react-icons/fi";
import SEOHead from "../../components/common/SEOHead";

/* ══════════════════════════════════════════════
   GSAP SCROLL-TRIGGERED ANIMATIONS
   ══════════════════════════════════════════════ */
function useGSAPAnimations(dependency) {
  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    // Fade-up sections on scroll
    document.querySelectorAll('.gsap-fade-up').forEach((el) => {
      gsap.fromTo(el,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 95%", once: true }
        }
      );
    });

    // Card entrance
    document.querySelectorAll('.gsap-card-enter').forEach((el, i) => {
      gsap.fromTo(el,
        { y: 40, opacity: 0, rotation: 1 },
        {
          y: 0, opacity: 1, rotation: 0,
          duration: 0.5,
          ease: "expo.out",
          delay: i * 0.05,
          scrollTrigger: { trigger: el, start: "top 95%", once: true }
        }
      );
    });

    return () => {
      window.ScrollTrigger?.getAll().forEach(t => t.kill());
    };
  }, [dependency]);
}

/* ── Reactive Stat Counter ── */
function StatCounter({ target, percentage, label }) {
  const [displayValue, setDisplayValue] = useState(0);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    const gsap = window.gsap;
    
    let targetNum = parseFloat(target) || 0;
    if (typeof target === 'string' && target.toLowerCase().includes('k')) {
      targetNum = parseFloat(target) * 1000;
    }

    gsap.fromTo(nodeRef.current, 
      { innerText: 0 },
      {
        innerText: targetNum,
        duration: 2.5,
        ease: "power4.out",
        snap: { innerText: 1 },
        scrollTrigger: { trigger: nodeRef.current, start: "top 95%", once: true },
        onUpdate: function() {
          let val = Math.floor(this.targets()[0].innerText);
          if (val >= 1000 && !percentage) {
            setDisplayValue((val / 1000).toFixed(1).replace('.0', '') + 'k+');
          } else {
            setDisplayValue(val + (percentage ? '%' : '+'));
          }
        }
      }
    );
  }, [target, percentage]);

  return (
    <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3 text-center md:text-left">
      <span 
        ref={nodeRef}
        className="font-display font-bold text-white text-xl md:text-2xl tracking-tight leading-none"
      >
        {displayValue}
      </span>
      <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
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
  const [realStats, setRealStats] = useState(null);
  const { request: getLocation, lat, lng } = useGeolocation();

  const trendingSearches = ["Plumber", "Electrician", "Civil Contractor", "Carpenter", "Painter"];

  useGSAPAnimations(realStats);

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    contractorAPI.getFeatured()
      .then((res) => setFeatured(res.data.contractors || []))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));

    contractorAPI.getPublicStats()
      .then(res => setRealStats(res.data.stats))
      .catch(() => {});
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

  const displayStats = [
    { val: realStats?.contractors || "500+", label: "Verified Partners" },
    { val: realStats?.projects || "10k+", label: "Projects Done" },
    { val: (realStats?.satisfaction || 98) + "%", label: "Satisfaction" },
    { val: realStats?.cities || "50+", label: "Cities" }
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
      <SEOHead
        title="Thekedaar — Premium Verified Contractors in India"
        description="Find and hire verified contractors for construction, renovation, interior design, electrical, plumbing, and more. Secure escrow payments. Trusted by thousands across India."
        canonical="https://thekedaar.com"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Thekedaar",
          url: "https://thekedaar.com",
          potentialAction: { "@type": "SearchAction", target: "https://thekedaar.com/search?q={search_term_string}", "query-input": "required name=search_term_string" },
        }}
      />

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
        <div className="relative z-30 w-full max-w-[1400px] mx-auto px-6 pt-32 md:pt-40 pb-20">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-8 md:mb-10"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-200/60 text-[10px] font-semibold uppercase tracking-[0.3em]">
                Premium Service Network
              </span>
            </motion.div>

            {/* ✦ ELITE CONTRACTORS VERIFIED RESULTS ✦ */}
            <div className="mb-8 space-y-0">
              {["ELITE", "CONTRACTORS", "VERIFIED", "RESULTS"].map((word, i) => (
                <motion.h1
                  key={word}
                  initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display font-extrabold uppercase leading-[0.85] md:leading-[0.9] tracking-[-0.04em]"
                  style={{
                    fontSize: 'clamp(1.8rem, 10vw, 8rem)',
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
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto"
            >
              <MagneticButton
                onClick={() => navigate("/search")}
                className="w-full sm:w-auto h-14 px-10 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-bold uppercase tracking-[0.1em] shadow-[0_4px_30px_rgba(99,102,241,0.3)] btn-shimmer animate-pulse-glow items-center justify-center gap-2"
              >
                Explore Services
                <FiArrowRight className="inline ml-1 -mt-0.5" />
              </MagneticButton>
              <MagneticButton
                onClick={() => navigate("/register/contractor")}
                className="w-full sm:w-auto h-14 px-10 rounded-xl border-2 border-white/20 text-white/90 text-sm font-bold uppercase tracking-[0.1em] hover:bg-white/5 hover:border-white/30 transition-all items-center justify-center"
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
            className="mt-12 md:mt-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl w-full max-w-4xl mx-auto relative z-50 shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
          >
            <div className="grid md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowTrending(true)}
                  onBlur={() => setTimeout(() => setShowTrending(false), 200)}
                  placeholder="What are you looking for?"
                  className="w-full h-16 bg-transparent border-none outline-none pl-14 pr-6 text-white text-sm"
                />
                <AnimatePresence>
                  {showTrending && !query && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#13151D] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                    >
                      <div className="p-4 border-b border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <FiTrendingUp size={12} /> Trending Searches
                        </p>
                      </div>
                      <div className="p-2">
                        {trendingSearches.map(term => (
                          <button
                            key={term}
                            onClick={() => { setQuery(term); setShowTrending(false); }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <FiSearch size={14} className="text-slate-500" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={getLocation}
                className="h-16 px-6 border-t md:border-t-0 md:border-l border-white/5 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <FiMapPin size={16} />
                {lat && lng ? "Location Set" : "Get Location"}
              </button>
              <button
                type="submit"
                className="h-16 px-10 bg-indigo-600 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-indigo-700 transition-colors"
              >
                {t("app.search")}
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* ═══════ ELITE PROOF STRIP — Minimalist Trust Signal ═══════ */}
      <section className="relative z-40 -mt-14 md:-mt-10 mb-20 md:mb-32 px-5">
        <motion.div
          key={realStats ? "loaded" : "loading"} // Force re-render and re-animation when data arrives
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[1000px] mx-auto rounded-[32px] md:rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-3xl py-6 md:py-5 px-8 md:px-12 shadow-2xl"
        >
          <div className="grid grid-cols-2 md:flex md:flex-nowrap items-center justify-center gap-y-8 gap-x-4 md:gap-x-12">
            {displayStats.map((stat, i) => (
              <React.Fragment key={i}>
                <StatCounter 
                  target={stat.val} 
                  percentage={String(stat.val).includes('%')} 
                  label={stat.label} 
                />
                {i < displayStats.length - 1 && (
                  <div className={`hidden md:block w-1 h-1 rounded-full bg-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.6)]`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </section>


      {/* ═══════ HIGH-IMPACT FEATURE — THE THEKEDAAR PROMISE (BENTO GRID) ═══════ */}
      <section className="relative py-24 md:py-40 bg-[#0A0C16] overflow-hidden">
        {/* Background Blueprints — Thin 1px lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-indigo-500" />
          <div className="absolute top-0 left-2/4 w-px h-full bg-indigo-500" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-indigo-500" />
          <div className="absolute top-1/4 left-0 w-full h-px bg-indigo-500" />
          <div className="absolute top-2/4 left-0 w-full h-px bg-indigo-500" />
        </div>

        <div className="max-w-[1400px] mx-auto px-5 md:px-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            
            {/* ✦ BENTO CELL 1: MAIN CINEMATIC (COL 1-8) ✦ */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-8 relative group rounded-[40px] overflow-hidden border border-white/5 shadow-2xl aspect-[16/9] md:aspect-auto md:h-[600px]"
            >
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                alt="Elite Construction"
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C16] via-transparent to-transparent opacity-90" />
              
              {/* Overlay Content */}
              <div className="absolute bottom-10 left-10 right-10">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 mb-6">
                  <FiBriefcase className="text-indigo-400" size={14} />
                  <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Scale & Precision</span>
                </div>
                <h2 className="font-display text-4xl md:text-7xl font-black text-white leading-[0.9] tracking-[-0.03em] max-w-2xl">
                  EXPERTISE FOR YOUR <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">BIGGEST DREAMS.</span>
                </h2>
              </div>
            </motion.div>

            {/* ✦ BENTO CELL 2: THE PROMISE (COL 9-12) ✦ */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 bg-white/[0.02] border border-white/5 rounded-[40px] p-10 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="w-16 h-1 bg-indigo-500" />
                <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-medium">
                  Whether you're building from scratch or renovating a full floor, Thekedaar connects you with verified local contractors.
                </p>
              </div>
              
              <div className="space-y-8 pt-10">
                <div className="flex gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <FiStar size={20} />
                   </div>
                   <div>
                      <p className="text-white font-black uppercase tracking-widest text-[11px] mb-1">Milestone Billing</p>
                      <p className="text-white/40 text-xs">Pay only when work is physically done.</p>
                   </div>
                </div>
                <div className="flex gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <FiCheckCircle size={20} />
                   </div>
                   <div>
                      <p className="text-white font-black uppercase tracking-widest text-[11px] mb-1">Verified Assets</p>
                      <p className="text-white/40 text-xs">Every contractor is audited & verified.</p>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* ✦ BENTO CELL 3: CTA (COL 1-4) ✦ */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[40px] p-8 flex items-center justify-between group cursor-pointer"
              onClick={() => navigate("/search")}
            >
              <div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Verified Network</p>
                <p className="text-white text-2xl font-black uppercase leading-tight">Find Local <br/>Contractors</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:rotate-45">
                <FiArrowRight size={24} />
              </div>
            </motion.div>

            {/* ✦ BENTO CELL 4: PORTFOLIO (COL 5-12) ✦ */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-8 bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-wrap items-center justify-between gap-6"
            >
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0A0C16] bg-slate-800 flex items-center justify-center text-white text-[10px] font-black overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-[#0A0C16] bg-indigo-500 flex items-center justify-center text-white text-[10px] font-black uppercase">
                  500+
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-white/80 font-bold uppercase tracking-tight">Trusted by India's top THEKEDAARS.</p>
                <p className="text-white/40 text-xs">Join our network of elite construction partners.</p>
              </div>
              <button 
                onClick={() => navigate("/search")}
                className="px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-white/90 transition-all active:scale-95"
              >
                Find Contractors
              </button>
            </motion.div>

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
          <div className="grid sm:grid-cols-2 gap-4">
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
    </main>
  );
}
