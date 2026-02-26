import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES } from "../../utils/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import { contractorAPI } from "../../services/api";
import ContractorCard from "../../components/common/ContractorCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Icon from "../../components/common/Icon";

export default function HomePage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const { request: getLocation, lat, lng } = useGeolocation();

  useEffect(() => {
    contractorAPI
      .getFeatured()
      .then((res) => setFeatured(res.data.contractors || []))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
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

  return (
    <div className="px-4 pb-10 md:px-6">
      <section className="max-w-6xl mx-auto mt-4 md:mt-8 glass-card p-5 md:p-8 overflow-hidden relative">
        <span className="floating-orb w-24 h-24 bg-cyan-300/25 top-6 left-6" />
        <span className="floating-orb w-32 h-32 bg-cyan-200/20 right-10 bottom-5" style={{ animationDelay: "1.6s" }} />

        <div className="relative z-10 grid lg:grid-cols-[1.25fr_0.75fr] gap-5 lg:gap-6 items-stretch">
          <div className="fade-rise">
            <p className="pill-chip w-fit mb-4">{lang === "hi" ? "विश्वसनीय सेवा मार्केटप्लेस" : "Trusted local service marketplace"}</p>
            <h1 className="text-4xl md:text-6xl text-white font-semibold leading-[1.02] mb-4">
              {lang === "hi" ? "आपके शहर के श्रेष्ठ ठेकेदार, एक ही जगह" : "Hire Better Contractors, Faster"}
            </h1>
            <p className="section-subtitle max-w-2xl mb-6">
              {lang === "hi"
                ? "एक प्रीमियम अनुभव में सेवा खोजें, प्रोफाइल तुलना करें, और सीधे ठेकेदार से बात करें।"
                : "Discover, compare, and connect with verified contractors through a premium search experience."}
            </p>

            <form onSubmit={handleSearch} className="surface-panel rounded-2xl p-2.5 flex flex-wrap md:flex-nowrap gap-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("home.search_placeholder")}
                className="input-field border-0 bg-transparent focus:shadow-none min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={getLocation}
                className="btn-secondary !px-4 !py-3"
                title="Use my location"
              >
                <Icon name="location" className="w-5 h-5" />
              </button>
              <button type="submit" className="btn-primary !px-6 !py-3">
                {t("app.search")}
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-5">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="pill-chip">
                  <Icon name={cat.icon} className="w-4 h-4 inline-block mr-1.5 align-[-2px]" />
                  {t(cat.key)}
                </button>
              ))}
            </div>
          </div>

          <aside className="surface-panel rounded-2xl p-4 md:p-5 fade-rise" style={{ animationDelay: "120ms" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300/85">
                {lang === "hi" ? "आज का मार्केट पल्स" : "Today in Your Market"}
              </p>
              <span className="pill-chip !py-1">
                {lang === "hi" ? "लाइव" : "Live"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {[
                { k: lang === "hi" ? "Verified" : "Verified", v: "100+" },
                { k: lang === "hi" ? "श्रेणियां" : "Categories", v: "12" },
                { k: lang === "hi" ? "शून्य कमीशन" : "Commission", v: "0%" },
                { k: lang === "hi" ? "तेज़ संपर्क" : "Response", v: "<5m" },
              ].map((item) => (
                <div key={item.k} className="glass-card rounded-xl px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-cyan-200">{item.v}</p>
                  <p className="text-[11px] text-slate-300/85">{item.k}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary w-full justify-center"
              onClick={() => navigate("/search?verified=true")}
            >
              {lang === "hi" ? "Verified ठेकेदार देखें" : "Browse Verified Contractors"}
            </button>
          </aside>
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-8 md:mt-10">
        <div className="glass-card rounded-2xl p-3 md:p-4 flex flex-wrap gap-2 md:gap-3 justify-between">
          {[
            lang === "hi" ? "सीधा WhatsApp संपर्क" : "Direct WhatsApp connect",
            lang === "hi" ? "वेरिफाइड प्रोफाइल प्राथमिकता" : "Verified-first discovery",
            lang === "hi" ? "लेबर टीम और विशेषज्ञ" : "Labour teams and specialists",
          ].map((point, idx) => (
            <div key={point} className="surface-panel rounded-xl px-3 py-2 text-sm text-slate-200 flex-1 min-w-[190px] fade-rise" style={{ animationDelay: `${140 + idx * 70}ms` }}>
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="section-title">{t("home.categories")}</h2>
            <p className="text-sm text-slate-300/85 mt-1">
              {lang === "hi" ? "अपनी ज़रूरत के हिसाब से श्रेणी चुनें" : "Choose a category based on your exact requirement"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="glass-card p-4 text-left hover-lift fade-rise"
              style={{ animationDelay: `${120 + index * 28}ms` }}
            >
              <div className="mb-3 text-cyan-100 inline-flex rounded-lg bg-white/5 p-2.5">
                <Icon name={cat.icon} className="w-7 h-7" />
              </div>
              <p className="text-sm text-slate-100 font-semibold leading-tight">{t(cat.key)}</p>
              <p className="text-xs text-slate-300/80 mt-1">
                {lang === "hi" ? "प्रोफाइल एक्सप्लोर करें" : "Explore profiles"}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto mt-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="section-title">{t("home.featured")}</h2>
            <p className="text-sm text-slate-300/85 mt-1">
              {lang === "hi" ? "हमारी क्यूरेटेड लिस्ट से टॉप प्रोफाइल" : "Curated top profiles selected for reliability"}
            </p>
          </div>
          <button className="btn-secondary !py-2.5 !px-4" onClick={() => navigate("/search?sort=rating")}>
            {lang === "hi" ? "सब देखें" : "View All"}
          </button>
        </div>
        {featuredLoading ? (
          <div className="py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : featured.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
            {featured.slice(0, 4).map((c) => (
              <ContractorCard key={c.id} contractor={c} />
            ))}
          </div>
        ) : (
          <p className="text-slate-300 text-sm py-10 text-center">
            {lang === "hi" ? "जल्द ही फीचर्ड प्रोफाइल दिखेंगी" : "Featured contractors are coming soon"}
          </p>
        )}
      </section>

      <footer className="max-w-6xl mx-auto mt-12 pb-4 text-center">
        <p className="brand-logo text-slate-100 mb-1 text-xl">
          The<span className="text-cyan-200">kedaar</span>
        </p>
        <p className="text-xs text-slate-400">© 2026 Thekedaar • Premium contractor discovery</p>
      </footer>
    </div>
  );
}
