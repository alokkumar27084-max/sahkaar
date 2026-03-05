import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import { contractorAPI } from "../../services/api";
import ContractorCard from "../../components/common/ContractorCard";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { FiTrendingUp, FiSearch, FiArrowRight, FiStar, FiUsers, FiCheckCircle, FiMapPin } from "react-icons/fi";

/* ── Animation Variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 18, duration: 0.6 } }
};

/* ── Animated Counter ── */
function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); return; }
      setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
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
    { icon: <FiUsers />, value: 500, suffix: "+", label: "Contractors" },
    { icon: <FiStar />, value: 10, suffix: "k+", label: "Projects Done" },
    { icon: <FiCheckCircle />, value: 98, suffix: "%", label: "Satisfaction" },
    { icon: <FiMapPin />, value: 50, suffix: "+", label: "Cities" }
  ];

  const testimonials = useMemo(() => [
    {
      quote: lang === "hi"
        ? "24 ghante mein verified contractor mil gaya. Quality aur response dono laajawab the."
        : "We hired a verified contractor in under 24 hours. Response time and quality were outstanding.",
      name: "Shivang Singh", role: "Homeowner", avatar: "RM"
    },
    {
      quote: lang === "hi"
        ? "Thekedaar ne serious clients connect kiye. Lead conversion clearly improve hua."
        : "Thekedaar connected us with serious clients. Our lead conversion improved significantly.",
      name: "Alok Kumar", role: "Contractor Partner", avatar: "AC"
    },
    {
      quote: lang === "hi"
        ? "Filters aur profile comparison se right professional choose karna bahut easy ho gaya."
        : "Search filters and profile comparison made choosing the right professional incredibly easy.",
      name: "Mudit Kalya", role: "Business Owner", avatar: "SA"
    },
  ], [lang]);

  return (
    <main id="main-content" className="overflow-hidden">

      {/* ═══════ HERO ═══════ */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background — Simple gradient + 2 CSS blobs (no framer-motion = no lag) */}
        <div className="absolute inset-0 bg-[#030712]">
          <div className="absolute top-[-10%] left-[5%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px] animate-[float_20s_ease-in-out_infinite]" />
          <div className="absolute bottom-[5%] right-[5%] w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse]" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "100px 100px"
          }} />
        </div>

        {/* Hero Content — Centered like reference */}
        <div className="relative z-30 max-w-[1200px] mx-auto px-4 md:px-8 pt-28 md:pt-36 pb-20 w-full">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-14"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.25em]">
                Premium Service Network
              </span>
            </motion.div>

            {/* Oversized centered heading — ELITE CONTRACTORS style */}
            <div className="mb-12 space-y-1 md:space-y-0">
              <motion.h1
                initial={{ opacity: 0, x: -80, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] text-white font-extrabold italic leading-[0.9] tracking-[-0.04em]"
              >
                ELITE
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, x: 80, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] font-extrabold italic leading-[0.9] tracking-[-0.04em] bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent"
              >
                CONTRACTORS
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, x: -80, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] font-extrabold italic leading-[0.9] tracking-[-0.04em] bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent"
              >
                VERIFIED
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, x: 80, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.45, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] text-white font-extrabold italic leading-[0.9] tracking-[-0.04em]"
              >
                RESULTS
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="text-white/35 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            >
              Connect with trusted professionals through powerful search, verified profiles, and transparent ratings.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(99,102,241,0.4)" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/search")}
                className="h-14 px-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-bold uppercase tracking-[0.15em] shadow-[0_4px_30px_rgba(99,102,241,0.25)] transition-all animate-pulse-glow"
              >
                Explore Services
                <FiArrowRight className="inline ml-2 -mt-0.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/register/contractor")}
                className="h-14 px-10 rounded-full border border-white/15 text-white/70 text-sm font-bold uppercase tracking-[0.15em] transition-all hover:border-white/30"
              >
                Become a Partner
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={handleSearch}
            className="mt-12 glass rounded-2xl max-w-4xl shadow-glass-lg relative z-50"
          >
            <div className="grid md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowTrending(true)}
                  onBlur={() => setTimeout(() => setShowTrending(false), 200)}
                  placeholder="Search contractors, services, or location..."
                  className="w-full h-14 pl-12 pr-4 bg-transparent text-white placeholder-white/40 border-0 outline-none text-[15px]"
                />
                <AnimatePresence>
                  {showTrending && !query && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-surface)] rounded-xl shadow-glass-lg border border-[var(--color-border)] z-[999] max-h-[280px] overflow-y-auto"
                    >
                      <div className="px-4 py-3 border-b border-[var(--color-border)]">
                        <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-2">
                          <FiTrendingUp size={12} /> Trending
                        </p>
                      </div>
                      <div className="p-1.5">
                        {trendingSearches.map(term => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => { setQuery(term); setShowTrending(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm text-[var(--color-body)] hover:bg-[var(--color-border)] rounded-lg transition-colors flex items-center gap-3"
                          >
                            <FiSearch className="w-3.5 h-3.5 text-[var(--color-muted)]" />
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
                className="h-14 px-5 border-t md:border-t-0 md:border-l border-white/10 text-white/60 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <FiMapPin className="w-4 h-4" /> Location
              </button>
              <button type="submit" className="h-14 px-8 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-r-2xl md:rounded-l-none hover:opacity-90 transition-opacity">
                {t("app.search")}
              </button>
            </div>
          </motion.form>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-14 flex justify-center"
          >
            <a href="/#services" className="inline-flex flex-col items-center text-white/50 text-[11px] uppercase tracking-[0.2em] hover:text-white/80 transition-colors">
              Scroll
              <span className="mt-2 w-5 h-8 rounded-full border border-white/30 inline-flex items-start justify-center p-1">
                <span className="hero-scroll-dot" />
              </span>
            </a>
          </motion.div>
        </div>
      </section>
      {/* ═══════ STATS ═══════ */}
      <section className="relative -mt-10 z-20 max-w-[1200px] mx-auto px-4 md:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={cardVariant}
              whileHover={{ y: -6, scale: 1.03 }}
              className="glass-card p-6 text-center group cursor-default transition-shadow hover:shadow-card-hover"
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                {stat.icon}
              </div>
              <p className="font-display text-3xl md:text-4xl font-bold text-[var(--color-heading)]">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-[var(--color-muted)] mt-1 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>


      {/* ═══════ DUAL CTA — Service Paths ═══════ */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-6 pt-8 pb-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-4"
        >
          {/* Quick Services CTA */}
          <motion.div
            variants={cardVariant}
            whileHover={{ y: -4 }}
            onClick={() => navigate("/quick-services")}
            className="glass-card p-8 cursor-pointer group border-l-4 border-[var(--color-accent)]"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--color-heading)] group-hover:text-[var(--color-accent)] transition-colors">Quick Services</h3>
                <p className="text-[var(--color-muted)] text-sm mt-2 leading-relaxed">AC repair, plumbing, electrician — instant booking for everyday home needs.</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse Services <FiArrowRight size={12} />
                </span>
              </div>
            </div>
          </motion.div>

          {/* Macro Services CTA */}
          <motion.div
            variants={cardVariant}
            whileHover={{ y: -4 }}
            onClick={() => navigate("/search")}
            className="glass-card p-8 cursor-pointer group border-l-4 border-[var(--color-primary)]"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-colors">Macro Services</h3>
                <p className="text-[var(--color-muted)] text-sm mt-2 leading-relaxed">Construction, renovation, interior design — hire verified contractors for big projects.</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Find Contractors <FiArrowRight size={12} />
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ SERVICES ═══════ */}
      <section id="services" className="max-w-[1400px] mx-auto px-4 md:px-6 py-20 md:py-28">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="mb-10">
          <motion.h2 variants={fadeUp} className="section-title">Core Services</motion.h2>
          <motion.p variants={fadeUp} className="section-subtitle mt-3">Choose a category and connect with verified contractors in minutes.</motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {CATEGORIES.slice(0, 7).map((cat) => (
            <motion.button
              variants={cardVariant}
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              whileHover={{ y: -6 }}
              className="text-left glass-card p-7 group"
            >
              <div className="mb-4 w-12 h-12 rounded-xl bg-[var(--color-primary)]/8 text-[var(--color-primary)] flex items-center justify-center group-hover:scale-110 group-hover:bg-[var(--color-primary)]/15 transition-all">
                <Icon name={cat.icon} className="w-6 h-6" />
              </div>
              <p className="font-display text-base font-semibold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-colors">{t(cat.key)}</p>
              <p className="text-sm text-[var(--color-muted)] mt-1.5 leading-relaxed">{cat.subtitle}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <FiArrowRight size={12} />
              </div>
            </motion.button>
          ))}
          {/* Explore All Services card */}
          <motion.button
            variants={cardVariant}
            onClick={() => navigate("/search")}
            whileHover={{ y: -6 }}
            className="text-left glass-card p-7 group bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-accent)]/5 border-dashed border-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/40"
          >
            <div className="mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white flex items-center justify-center group-hover:scale-110 transition-all">
              <FiArrowRight className="w-6 h-6" />
            </div>
            <p className="font-display text-base font-semibold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-colors">Explore All Services</p>
            <p className="text-sm text-[var(--color-muted)] mt-1.5 leading-relaxed">Browse all categories and discover more professionals.</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] group-hover:gap-2 transition-all">
              View All <FiArrowRight size={12} />
            </div>
          </motion.button>
        </motion.div>
      </section>

      {/* ═══════ FEATURED ═══════ */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-6 pb-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="mb-8">
          <motion.h2 variants={fadeUp} className="section-title">{t("home.featured")}</motion.h2>
          <motion.p variants={fadeUp} className="section-subtitle mt-3">Curated high-trust contractor profiles.</motion.p>
        </motion.div>

        {featuredLoading ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="glass-card p-5">
                <div className="flex gap-4">
                  <div className="skeleton w-[72px] h-[72px] rounded-full shrink-0" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="skeleton h-5 w-3/4 rounded-md" />
                    <div className="skeleton h-4 w-1/2 rounded-md" />
                    <div className="flex gap-2">
                      <div className="skeleton h-6 w-20 rounded-full" />
                      <div className="skeleton h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid lg:grid-cols-2 gap-4">
            {featured.slice(0, 4).map((c) => (
              <motion.div variants={cardVariant} key={c.id}>
                <ContractorCard contractor={c} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-[var(--color-muted)] text-sm py-12 text-center">No featured contractors yet.</p>
        )}
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section id="about" className="max-w-[1400px] mx-auto px-4 md:px-6 py-20 md:py-28">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="section-title">What People Say</motion.h2>
          <motion.p variants={fadeUp} className="section-subtitle mt-3 mx-auto">Trust-building testimonials from customers and contractors.</motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-5">
          {testimonials.map((item, index) => (
            <motion.article
              variants={cardVariant}
              key={item.name}
              className={`glass-card p-7 transition-all duration-500 ${activeTestimonial === index ? "ring-2 ring-[var(--color-primary)]/30 shadow-glow" : ""
                }`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold">
                  {item.avatar}
                </div>
                <div>
                  <p className="font-display text-[var(--color-heading)] font-semibold text-sm">{item.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">{item.role}</p>
                </div>
              </div>
              <p className="text-[var(--color-body)] leading-relaxed text-[15px]">"{item.quote}"</p>
              <div className="flex gap-0.5 mt-4 text-amber-400">
                {[...Array(5)].map((_, i) => <FiStar key={i} size={14} fill="currentColor" />)}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-navy via-navy-light to-primary-dark p-10 md:p-16 relative overflow-hidden"
        >
          {/* Accent orbs */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-accent/10 blur-[80px]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h3 className="font-display text-white text-3xl md:text-4xl font-bold">Ready to grow with us?</h3>
              <p className="text-white/60 mt-3 text-lg max-w-md">Join thousands of happy customers and trusted contractors on our platform.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/search")}
              className="h-[52px] px-8 rounded-xl bg-white text-navy font-semibold self-start md:self-auto btn-shimmer hover:-translate-y-1 transition-all shadow-lg"
            >
              Get Started <FiArrowRight className="inline ml-1" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer id="contact" className="bg-navy-dark text-white/60 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <p className="font-display text-white text-xl font-bold mb-1">Thekedaar</p>
            <p className="text-sm leading-relaxed">India's trusted contractor discovery platform for businesses and homeowners.</p>
          </div>
          <div>
            <p className="font-display text-white font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</p>
            <div className="grid gap-2.5 text-sm">
              {["Home", "Services", "About", "Contact"].map(l => (
                <a key={l} href={`/#${l.toLowerCase()}`} className="hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-display text-white font-semibold text-sm mb-4 uppercase tracking-wider">Contact</p>
            <div className="grid gap-2.5 text-sm">
              <p>apkathekedaar@gmail.com</p>
              <p>+91 8303959728</p>
              <p>Manit Bhopal, Madhya Pradesh</p>
              <p>Mon – Sat, 9 AM – 7 PM</p>
            </div>
          </div>
          <div>
            <p className="font-display text-white font-semibold text-sm mb-4 uppercase tracking-wider">Social</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "LinkedIn", href: "https://www.linkedin.com" },
                { label: "X", href: "https://x.com" },
                { label: "Instagram", href: "https://www.instagram.com" },
                { label: "WhatsApp", href: "https://wa.me/919000000000" },
              ].map((s) => (
                <a key={s.label} href={s.href} className="px-3 py-2 rounded-lg border border-white/10 text-xs hover:border-[var(--color-primary)] hover:text-white transition-all">
                  {s.label}
                </a>
              ))}
            </div>
            <a
              href="/login?admin=1"
              className="inline-flex items-center px-3 py-2 mt-4 rounded-lg border border-[var(--color-accent)]/40 text-[var(--color-accent)] text-xs font-semibold hover:bg-[var(--color-accent)] hover:text-navy transition-all"
            >
              Admin Login
            </a>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-5 text-xs flex flex-wrap items-center justify-between gap-3">
            <p>© 2026 Thekedaar. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </main >
  );
}
