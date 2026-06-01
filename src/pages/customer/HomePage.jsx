import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES, QUICK_SERVICE_CATEGORIES } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import { contractorAPI } from "../../services/api";
import ContractorCard from "../../components/common/ContractorCard";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import {
  FiSearch,
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiStar,
  FiChevronRight,
  FiPlay,
} from "react-icons/fi";
import SEOHead from "../../components/common/SEOHead";

export default function HomePage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [showTrending, setShowTrending] = useState(false);
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [realStats, setRealStats] = useState(null);
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

    contractorAPI.getPublicStats()
      .then(res => setRealStats(res.data.stats))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({ q: query, mode: "project" });
    if (lat && lng) { params.set("lat", lat); params.set("lng", lng); }
    navigate(`/search?${params}`);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/search?category=${categoryId}&mode=project`);
  };

  const handleQuickServiceClick = (categoryId) => {
    navigate(`/search?category=${categoryId}&mode=quick`);
  };

  const displayStats = [
    { val: realStats?.contractors || "500+", label: "Verified Pros" },
    { val: realStats?.projects || "10k+", label: "Projects Done" },
    { val: (realStats?.satisfaction || 98) + "%", label: "Satisfaction" },
    { val: realStats?.cities || "50+", label: "Cities" }
  ];

  const testimonials = useMemo(() => [
    {
      quote: lang === "hi"
        ? "24 ghante mein verified contractor mil gaya. Quality aur response dono laajawab the."
        : "We hired a verified contractor in under 24 hours. Quality and response were outstanding.",
      name: "Shivang Singh", role: "Homeowner", rating: 5
    },
    {
      quote: lang === "hi"
        ? "Milestone billing system bahut achha hai. Paisa tab nikalta hai jab kaam quality check ho jaaye."
        : "The milestone billing system is excellent. Payments only release after quality is verified.",
      name: "Priya Mehta", role: "Business Owner", rating: 5
    },
    {
      quote: lang === "hi"
        ? "Labour group booking se construction project 3 weeks pehle khatam ho gaya."
        : "Labour group booking finished our construction project 3 weeks ahead of schedule.",
      name: "Rajesh Kumar", role: "Property Developer", rating: 5
    }
  ], [lang]);

  // Category images — using placeholder Unsplash images
  const categoryImages = {
    construction: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop",
    electrical: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
    plumbing: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop",
    painting: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&h=400&fit=crop",
    events: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop",
    carpentry: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
    farming: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&h=400&fit=crop",
    transport: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop",
    cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop",
    labour_group: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop",
    property: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop",
    other: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&h=400&fit=crop",
  };

  return (
    <main className="bg-[var(--color-bg)]">
      <SEOHead
        title="Thekedaar — Home Services, Delivered"
        description="Find verified contractors, plumbers, electricians and home service professionals near you."
      />

      {/* ═══════ SECTION 1: HERO ═══════ */}
      <section className="relative min-h-[90vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
        {/* Video / Image Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&h=1080&fit=crop"
            className="w-full h-full object-cover"
          >
            {/* User can add: <source src="/hero-bg.mp4" type="video/mp4" /> */}
          </video>
          <img
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&h=1080&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[var(--max-width)] mx-auto px-5 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
              <FiCheckCircle className="text-green-400" size={14} />
              <span className="text-white/80 text-xs font-medium">
                Trusted by {realStats?.customers || "10,000"}+ homeowners
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Home services,<br />
              <span className="text-indigo-400">delivered.</span>
            </h1>

            <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Connect with verified contractors and home service professionals in your area.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSearch}
            className="relative max-w-2xl mx-auto"
          >
            <div className="flex items-center bg-white rounded-2xl shadow-xl overflow-hidden">
              <FiSearch className="ml-5 text-gray-400 shrink-0" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowTrending(true)}
                onBlur={() => setTimeout(() => setShowTrending(false), 200)}
                placeholder="Search for plumbers, electricians, painters..."
                className="flex-1 h-14 md:h-16 bg-transparent border-none outline-none px-4 text-gray-900 text-sm md:text-base placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="h-10 md:h-12 px-6 md:px-8 mr-2 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-semibold transition-colors shrink-0"
              >
                Search
              </button>
            </div>

            {/* Trending dropdown */}
            {showTrending && !query && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Trending</p>
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={() => { setQuery(term); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <FiSearch size={14} className="text-gray-400" />
                    {term}
                  </button>
                ))}
              </div>
            )}
          </motion.form>

          {/* Quick category chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-6"
          >
            <span className="text-white/40 text-xs mr-1">Popular:</span>
            {trendingSearches.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  const params = new URLSearchParams({ q: term, mode: "project" });
                  navigate(`/search?${params}`);
                }}
                className="px-3 py-1.5 rounded-full border border-white/15 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors"
              >
                {term}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ SECTION 2: CORE SERVICE CATEGORIES (Image Grid) ═══════ */}
      <section className="max-w-[var(--max-width)] mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-heading)] tracking-tight">
            What are you looking for?
          </h2>
          <p className="mt-3 text-[var(--color-muted)] text-base">
            Browse our most popular service categories
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src={categoryImages[cat.id]}
                alt={t(cat.key)}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-sm md:text-base">
                  {t(cat.key)}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════ SECTION 3: HOW IT WORKS ═══════ */}
      <section className="bg-[var(--color-bg-elevated)]">
        <div className="max-w-[var(--max-width)] mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-heading)] tracking-tight">
              How Thekedaar works
            </h2>
            <p className="mt-3 text-[var(--color-muted)] text-base">
              Get the job done in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Tell us what you need",
                desc: "Choose a service category and describe your requirements. It takes less than a minute.",
                icon: <FiSearch size={24} />,
              },
              {
                step: "02",
                title: "Get matched with pros",
                desc: "We connect you with verified, nearby professionals. Compare ratings, prices, and reviews.",
                icon: <FiCheckCircle size={24} />,
              },
              {
                step: "03",
                title: "Get it done",
                desc: "Book, track progress, and pay securely through the platform. Quality guaranteed.",
                icon: <FiShield size={24} />,
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-5">
                  {item.icon}
                </div>
                <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-[var(--color-heading)] mb-2">{item.title}</h3>
                <p className="text-[var(--color-muted)] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 4: QUICK SERVICES HORIZONTAL SCROLL ═══════ */}
      <section className="max-w-[var(--max-width)] mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-heading)] tracking-tight">
              Popular quick services
            </h2>
            <p className="mt-1 text-[var(--color-muted)] text-sm">Book instantly, starting from ₹199</p>
          </div>
          <button
            onClick={() => navigate("/select-service")}
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            See all <FiChevronRight size={16} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
          {QUICK_SERVICE_CATEGORIES.slice(0, 12).map((service) => (
            <button
              key={service.id}
              onClick={() => handleQuickServiceClick(service.id)}
              className="flex-shrink-0 w-[160px] md:w-[180px] snap-start group"
            >
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
                  <Icon name={service.icon} className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-semibold text-[var(--color-heading)] mb-1 line-clamp-2 min-h-[32px]">
                  {service.label}
                </h4>
                <p className="text-xs text-[var(--color-primary)] font-semibold">
                  From ₹{service.price}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile see all */}
        <button
          onClick={() => navigate("/select-service")}
          className="md:hidden mt-4 w-full py-3 rounded-lg border border-[var(--color-border)] text-sm font-semibold text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          See all services →
        </button>
      </section>

      {/* ═══════ SECTION 5: FEATURED CONTRACTORS ═══════ */}
      <section className="max-w-[var(--max-width)] mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-heading)] tracking-tight">
              Top-rated professionals
            </h2>
            <p className="mt-1 text-[var(--color-muted)] text-sm">Verified and reviewed by real customers</p>
          </div>
          <button
            onClick={() => navigate("/search?mode=project")}
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            View all <FiChevronRight size={16} />
          </button>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-[var(--color-bg-elevated)] animate-pulse" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.slice(0, 6).map((c) => (
              <ContractorCard key={c.id} contractor={c} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[var(--color-muted)]">No featured professionals available yet.</p>
          </div>
        )}
      </section>

      {/* ═══════ SECTION 6: TRUST & SAFETY ═══════ */}
      <section className="bg-[var(--color-bg-elevated)]">
        <div className="max-w-[var(--max-width)] mx-auto px-5 md:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: <FiCheckCircle size={28} className="text-green-600 dark:text-green-400" />,
                title: "Verified Professionals",
                desc: "Every contractor goes through ID verification, background checks, and skill assessment."
              },
              {
                icon: <FiShield size={28} className="text-indigo-600 dark:text-indigo-400" />,
                title: "Secure Payments",
                desc: "Milestone-based escrow ensures you only pay for completed, quality-checked work."
              },
              {
                icon: <FiStar size={28} className="text-amber-500" />,
                title: "Quality Guaranteed",
                desc: "Transparent reviews, ratings, and a dedicated support team to resolve any issues."
              }
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-heading)] mb-1">{item.title}</h3>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 7: STATS ═══════ */}
      <section className="max-w-[var(--max-width)] mx-auto px-5 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {displayStats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-bold text-[var(--color-heading)] tracking-tight">
                {stat.val}
              </div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ SECTION 8: TESTIMONIALS ═══════ */}
      <section className="bg-[var(--color-bg-elevated)]">
        <div className="max-w-[var(--max-width)] mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-heading)] tracking-tight">
              What our customers say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 md:p-8"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <FiStar key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[var(--color-body)] text-sm leading-relaxed mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-heading)]">{t.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 9: CTA BANNER ═══════ */}
      <section className="max-w-[var(--max-width)] mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="bg-[var(--color-heading)] rounded-2xl p-10 md:p-16 text-center md:text-left">
          <div className="md:flex md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Are you a professional?
              </h2>
              <p className="mt-2 text-white/60 text-base max-w-md">
                Join thousands of verified contractors and grow your business with Thekedaar.
              </p>
            </div>
            <button
              onClick={() => navigate("/register/contractor")}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#222222] text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Register as Partner <FiArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

    </main>
  );
}
