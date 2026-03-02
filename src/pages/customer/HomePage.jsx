import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import { contractorAPI } from "../../services/api";
import ContractorCard from "../../components/common/ContractorCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";

export default function HomePage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { request: getLocation, lat, lng } = useGeolocation();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    contractorAPI
      .getFeatured()
      .then((res) => setFeatured(res.data.contractors || []))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -30px 0px" }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams({ q: query });
    if (lat && lng) {
      params.set("lat", lat);
      params.set("lng", lng);
    }
    navigate(`/search?${params}`);
  }

  function handleCategoryClick(categoryId) {
    navigate(`/search?category=${categoryId}`);
  }

  const testimonials = useMemo(
    () => [
      {
        quote:
          lang === "hi"
            ? "Hamne 24 ghante ke andar verified contractor hire kiya. Response aur quality dono excellent the."
            : "We hired a verified contractor in less than 24 hours. Response time and work quality were excellent.",
        name: "Rohit Mehta",
        role: lang === "hi" ? "Homeowner" : "Homeowner",
      },
      {
        quote:
          lang === "hi"
            ? "Thekedaar ne meri contractor team ko serious clients dilaye. Conversion clearly improve hua."
            : "Thekedaar helped my crew connect with serious clients. Our lead conversion improved significantly.",
        name: "Anil Chauhan",
        role: lang === "hi" ? "Contractor Partner" : "Contractor Partner",
      },
      {
        quote:
          lang === "hi"
            ? "Filters aur profile comparison se sahi professional choose karna bahut easy ho gaya."
            : "Search filters and profile comparison made selecting the right professional very easy.",
        name: "Sneha Agrawal",
        role: lang === "hi" ? "Small Business Owner" : "Small Business Owner",
      },
    ],
    [lang]
  );

  return (
    <main id="main-content" className="pb-14">
      <section id="home" className="min-h-[70vh] md:min-h-[80vh] lg:min-h-screen relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Happy customers and service professionals"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/90 to-[#06B6D4]/70" />
        </div>

        <span className="hero-orb w-28 h-28 bg-cyan-300/45 left-[7%] top-[18%]" />
        <span className="hero-orb w-40 h-40 bg-blue-200/35 right-[8%] bottom-[16%]" style={{ animationDelay: "1.8s" }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 pt-16 md:pt-24 lg:pt-28 pb-16">
          <div className="max-w-3xl reveal-item is-visible" data-reveal>
            <p className="text-cyan-100 text-sm md:text-base font-medium tracking-wide mb-4">
              {lang === "hi" ? "Trust-first contractor discovery platform" : "Trust-first contractor discovery platform"}
            </p>
            <h1 className="font-['Poppins'] text-white font-extrabold leading-[1.08] text-[2.2rem] md:text-[3.4rem] lg:text-[4rem] mb-4">
              Connect. Build. Grow.
            </h1>
            <p className="text-white/85 text-base md:text-xl max-w-2xl leading-relaxed mb-7">
              Find verified contractors and business partners through powerful search, trusted ratings, and clear service profiles.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/search")}
                className="h-[52px] px-7 rounded-xl bg-[#06B6D4] text-[#1E3A8A] font-semibold hover-glow btn-shimmer"
              >
                Explore Services
              </button>
              <button
                onClick={() => navigate("/register/contractor")}
                className="h-[52px] px-7 rounded-xl border-2 border-white text-white font-semibold hover-glow"
              >
                Join as Partner
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mt-10 bg-white border border-slate-200 rounded-xl max-w-4xl shadow-[0_10px_36px_rgba(15,23,42,0.2)] overflow-hidden reveal-item"
            data-reveal
            style={{ "--reveal-delay": "80ms" }}
          >
            <div className="grid md:grid-cols-[1fr_170px_130px]">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contractors, services, or location..."
                className="input-field border-0 rounded-none h-14"
              />
              <button
                type="button"
                onClick={getLocation}
                className="h-14 px-3 border-t md:border-t-0 md:border-l border-slate-200 inline-flex items-center justify-center gap-2 text-slate-700 font-medium"
              >
                <Icon name="location" className="w-4 h-4 text-[#06B6D4]" />
                Location
              </button>
              <button type="submit" className="h-14 bg-[#06B6D4] text-white font-semibold">
                {t("app.search")}
              </button>
            </div>
          </form>

          <div className="mt-10 flex justify-center reveal-item" data-reveal style={{ "--reveal-delay": "140ms" }}>
            <a href="/#services" className="inline-flex flex-col items-center text-white/90 text-xs uppercase tracking-[0.16em]">
              Scroll
              <span className="mt-2 w-5 h-8 rounded-full border border-white/70 inline-flex items-start justify-center p-1">
                <span className="hero-scroll-dot" />
              </span>
            </a>
          </div>
        </div>
      </section>

      <section id="services" className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="mb-7">
          <h2 className="section-title">Core Services</h2>
          <p className="section-subtitle mt-2">Choose a category and connect with verified contractors in minutes.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.slice(0, 8).map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="text-left bg-white border border-[#E5E7EB] rounded-2xl p-7 transition-all duration-300 hover:-translate-y-2 hover:border-[#06B6D4] hover:shadow-[0_20px_40px_rgba(30,58,138,0.15)] reveal-item hover-glow"
              data-reveal
              style={{ "--reveal-delay": `${index * 45}ms` }}
            >
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-50 text-[#06B6D4]">
                <Icon name={cat.icon} className="w-7 h-7" />
              </div>
              <p className="font-['Poppins'] text-[1.05rem] font-semibold text-[#111827]">{t(cat.key)}</p>
              <p className="text-sm text-[#374151] mt-1 line-clamp-3">Compare ratings and contact professionals quickly.</p>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 reveal-item" data-reveal>
        <div className="mb-6">
          <h2 className="section-title">{t("home.featured")}</h2>
          <p className="section-subtitle mt-2">Curated high-trust contractor profiles.</p>
        </div>
        {featuredLoading ? (
          <div className="py-14">
            <LoadingSpinner size="lg" />
          </div>
        ) : featured.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {featured.slice(0, 4).map((c) => (
              <ContractorCard key={c.id} contractor={c} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-8 text-center">No featured contractors yet.</p>
        )}
      </section>

      <section id="about" className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-[800px] mx-auto text-center mb-8">
          <h2 className="section-title">What People Say</h2>
          <p className="section-subtitle mt-2">Trust-building testimonials from customers and contractors.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((item, index) => (
            <article
              key={item.name}
              className={`bg-white rounded-[20px] border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-6 transition-all duration-500 hover-glow ${
                activeTestimonial === index ? "md:-translate-y-1 md:shadow-[0_18px_40px_rgba(30,58,138,0.22)] border-[#06B6D4]" : ""
              }`}
            >
              <div className="text-[#06B6D4] mb-3 text-2xl">"</div>
              <p className="text-[#374151] italic leading-relaxed text-[15px]">{item.quote}</p>
              <div className="mt-5">
                <p className="font-['Poppins'] text-[#111827] font-semibold">{item.name}</p>
                <p className="text-sm text-[#6B7280]">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-4 md:px-6 pb-12 reveal-item" data-reveal>
        <div className="rounded-3xl bg-gradient-to-r from-[#1E3A8A] to-[#0E7490] p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover-glow">
          <div>
            <h3 className="font-['Poppins'] text-white text-3xl md:text-[2.25rem] font-bold">Ready to grow with us?</h3>
            <p className="text-white/80 mt-2">Connect with top contractors today.</p>
          </div>
          <button
            onClick={() => navigate("/search")}
            className="h-[52px] px-8 rounded-full bg-white text-[#1E3A8A] font-semibold self-start md:self-auto btn-shimmer hover-glow"
          >
            Contact Today
          </button>
        </div>
      </section>

      <footer id="contact" className="bg-[#0F172A] text-white/80 reveal-item" data-reveal>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="font-['Poppins'] text-white text-2xl font-bold">Thekedaar</p>
            <p className="text-sm mt-3 leading-relaxed">Trusted contractor network for businesses and customers.</p>
          </div>

          <div>
            <p className="font-['Poppins'] text-white font-semibold mb-3">Quick Links</p>
            <div className="grid gap-2 text-sm">
              <a href="/#home">Home</a>
              <a href="/#services">Services</a>
              <a href="/#about">About</a>
              <a href="/#contact">Contact</a>
            </div>
          </div>

          <div>
            <p className="font-['Poppins'] text-white font-semibold mb-3">Contact</p>
            <div className="grid gap-2 text-sm">
              <p>hello@thekedaar.com</p>
              <p>+91 90000 00000</p>
              <p>Bhopal, Madhya Pradesh</p>
              <p>Mon - Sat, 9:00 AM - 7:00 PM</p>
            </div>
          </div>

          <div>
            <p className="font-['Poppins'] text-white font-semibold mb-3">Social</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "LinkedIn", href: "https://www.linkedin.com" },
                { label: "X", href: "https://x.com" },
                { label: "Instagram", href: "https://www.instagram.com" },
                { label: "WhatsApp", href: "https://wa.me/919000000000" },
              ].map((social) => (
                <a key={social.label} href={social.href} className="px-3 py-2 rounded-lg border border-[#1E3A8A] text-xs hover:border-[#06B6D4]">
                  {social.label}
                </a>
              ))}
            </div>
            <a
              href="/login?admin=1"
              className="inline-flex items-center justify-center px-3 py-2 mt-4 rounded-lg border border-[#06B6D4] text-[#06B6D4] font-semibold hover:bg-[#06B6D4] hover:text-[#111827] transition-colors w-fit"
            >
              Admin Login
            </a>
          </div>
        </div>

        <div className="border-t border-[#1E3A8A]">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 text-xs flex flex-wrap items-center justify-between gap-3">
            <p>© 2026 Thekedaar. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="/privacy-policy">Privacy Policy</a>
              <a href="/terms">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

