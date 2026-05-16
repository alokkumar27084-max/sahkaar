import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { servicesAPI } from "../../services/api";
import { buildContractorSearchPath } from "../../utils/serviceToContractorSearch";
import SEOHead from "../../components/common/SEOHead";

import {
    FiSearch, FiArrowRight, FiStar, FiShield,
    FiCheckCircle, FiGrid, FiTool, FiHome,
    FiTarget, FiDroplet, FiZap, FiLayers
} from "react-icons/fi";

/* ── Animations ── */
const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardPop = { hidden: { opacity: 0, y: 20, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 18 } } };

/* ── Icon map ── */
const ICON_MAP = {
    building: FiHome, wrench: FiTool, palette: FiGrid, landmark: FiTarget,
    cable: FiZap, pipette: FiDroplet, layers: FiLayers, home: FiHome,
    zap: FiZap, droplets: FiDroplet, hammer: FiTool, shield: FiShield,
    star: FiStar, target: FiTarget, grid: FiGrid, tool: FiTool,
};

function getIcon(name) {
    return ICON_MAP[name] || FiGrid;
}

export default function MacroServicesPage() {
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Load bada categories
    useEffect(() => {
        servicesAPI.getCategories("bada")
            .then(res => {
                const cats = res.data.categories || [];
                setCategories(cats);
                if (cats.length > 0) setActiveCategory(cats[0].slug);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Load services for active category
    const loadServices = useCallback(async () => {
        if (!activeCategory) return;
        setLoading(true);
        try {
            const res = await servicesAPI.getCategory(activeCategory);
            setServices(res.data.services || []);
        } catch { setServices([]); }
        finally { setLoading(false); }
    }, [activeCategory]);

    useEffect(() => { loadServices(); }, [loadServices]);

    // Search filter
    const filtered = search
        ? services.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.name_hi && s.name_hi.includes(search)) ||
            (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
        )
        : services;

    const activeCat = categories.find(c => c.slug === activeCategory);

    return (
        <main className="overflow-hidden">
            <SEOHead
                title="Thekedaar Services — Construction, Renovation & Interior Design"
                description="Book verified premium contractors for construction, renovation, civil work, waterproofing, interior design, and more. Escrow payment protection on every project."
                canonical="https://thekedaar.com/macro-services"
            />

            {/* ═══════ HERO ═══════ */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#090B19]">
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-32 pb-24 text-center">
                    <motion.div initial="hidden" animate="show" variants={stagger}>
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-12 shadow-2xl backdrop-blur-xl">
                            <FiLayers size={14} className="text-indigo-400" />
                            <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">
                                {lang === "hi" ? "प्रीमियम बड़े प्रोजेक्ट्स" : "Premium Large Scale Services"}
                            </span>
                        </motion.div>

                        <div className="mb-12 flex flex-col items-center">
                            <motion.h1 
                              variants={fadeUp}
                              className="font-display text-white font-black uppercase tracking-tighter leading-[1.1] mb-2"
                              style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}
                            >
                                {lang === "hi" ? "ठेकेदार" : "Thekedaar"} <br />
                                <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                                  {lang === "hi" ? "सर्विसेज" : "Services"}
                                </span>
                            </motion.h1>
                            
                            <motion.p variants={fadeUp} className="text-indigo-200/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                                {lang === "hi"
                                    ? "घर निर्माण, रेनोवेशन और इंटीरियर डिज़ाइन के लिए भारत के सबसे भरोसेमंद ठेकेदार खोजें"
                                    : "India's most trusted ecosystem for construction, renovation, and elite interior design projects"}
                            </motion.p>
                        </div>

                        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4 mb-16">
                            <button
                                onClick={() => navigate("/search?sort=distance&radius_km=5")}
                                className="px-8 py-4 rounded-2xl bg-indigo-500 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                {lang === "hi" ? "शुरू करें" : "Start Discovering"} <FiArrowRight size={18} />
                            </button>
                        </motion.div>

                        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6">
                            {[
                                { text: lang === "hi" ? "100% सुरक्षित भुगतान" : "100% Secure Escrow" },
                                { text: lang === "hi" ? "वेरिफाइड प्रोफेशनल्स" : "Verified Professionals" },
                                { text: lang === "hi" ? "रियल-टाइम ट्रैकिंग" : "Real-time Tracking" },
                            ].map(item => (
                                <div key={item.text} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    <FiCheckCircle className="text-emerald-400" /> {item.text}
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════ CATEGORY + SERVICES ═══════ */}
            <section className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-8 relative z-20">
                {/* Search bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-card !rounded-full p-2 mb-12 shadow-premium border-white/10"
                >
                    <div className="relative flex items-center">
                        <FiSearch className="absolute left-6 text-[var(--color-primary)] w-6 h-6" />
                        <input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={lang === "hi" ? "प्रोजेक्ट सर्विस खोजें..." : "Search construction & renovation services..."}
                            className="w-full h-14 pl-16 pr-6 bg-transparent text-[var(--color-heading)] placeholder-[var(--color-muted)] border-0 outline-none text-lg font-medium"
                        />
                    </div>
                </motion.div>

                {/* Category pills */}
                <motion.div
                    initial="hidden" animate="show" variants={stagger}
                    className="flex gap-3 overflow-x-auto pb-4 scrollbar-none mb-8"
                >
                    {categories.map(cat => {
                        const IconComp = getIcon(cat.icon);
                        const isActive = activeCategory === cat.slug;
                        return (
                            <motion.button
                                key={cat.slug}
                                variants={cardPop}
                                onClick={() => { setActiveCategory(cat.slug); setSearch(""); }}
                                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl whitespace-nowrap font-semibold text-sm transition-all border shrink-0 ${isActive
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-btn"
                                    : "glass-card hover:border-amber-500/30 text-[var(--color-heading)]"
                                    }`}
                            >
                                <IconComp size={18} />
                                {lang === "hi" && cat.name_hi ? cat.name_hi : cat.name}
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Active category title */}
                <AnimatePresence mode="wait">
                    {activeCat && (
                        <motion.div
                            key={activeCat.slug}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="mb-8"
                        >
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-heading)]">
                                {lang === "hi" && activeCat.name_hi ? activeCat.name_hi : activeCat.name}
                            </h2>
                            <p className="text-[var(--color-muted)] mt-2 text-base">
                                {lang === "hi" && activeCat.description_hi ? activeCat.description_hi : activeCat.description}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Services grid */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="glass-card p-6">
                                <div className="skeleton w-14 h-14 rounded-2xl mb-4" />
                                <div className="skeleton h-5 w-3/4 rounded-md mb-3" />
                                <div className="skeleton h-4 w-full rounded-md mb-2" />
                                <div className="skeleton h-4 w-1/2 rounded-md mb-4" />
                                <div className="skeleton h-10 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial="hidden" animate="show" variants={stagger}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-16"
                    >
                        <AnimatePresence mode="popLayout">
                            {filtered.map((svc) => {
                                const SvcIcon = getIcon(svc.icon);
                                const displayName = lang === "hi" && svc.name_hi ? svc.name_hi : svc.name;
                                const searchPath = buildContractorSearchPath(activeCategory, {
                                    serviceName: displayName,
                                    serviceSlug: svc.slug,
                                });
                                return (
                                    <motion.div
                                        key={svc.id}
                                        variants={cardPop}
                                        layout
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                        onClick={() => navigate(searchPath)}
                                        className="glass-card p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-glow"
                                    >
                                        {/* Hover glow */}
                                        <div className="absolute -inset-full bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 flex items-center justify-center group-hover:scale-110 group-hover:shadow-soft transition-all duration-500">
                                                    <SvcIcon size={28} className="text-amber-500" />
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:border-amber-500/30 transition-colors">
                                                    <FiStar size={14} className="text-amber-500" fill="currentColor" />
                                                    <span className="text-sm font-bold text-[var(--color-heading)]">{Number(svc.rating).toFixed(1)}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-display font-bold text-[var(--color-heading)] text-xl mb-2 group-hover:text-amber-500 transition-colors line-clamp-1">
                                                    {lang === "hi" && svc.name_hi ? svc.name_hi : svc.name}
                                                </h3>
                                                <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-6 line-clamp-2 font-medium opacity-80">
                                                    {lang === "hi" && svc.description_hi ? svc.description_hi : svc.description}
                                                </p>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between gap-3">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-0.5">Starting From</span>
                                                    <span className="text-2xl font-bold text-[var(--color-heading)]">₹{svc.price_starts_at?.toLocaleString()}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/services/${svc.slug}`); }}
                                                        className="mt-2 text-left text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                                    >
                                                        {lang === "hi" ? "विवरण और रिक्वेस्ट फॉर्म" : "Details & request form"}
                                                    </button>
                                                </div>
                                                <div className="w-12 h-12 shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500 shadow-btn">
                                                    <FiArrowRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {filtered.length === 0 && !loading && (
                            <div className="col-span-full py-16 text-center">
                                <FiSearch size={48} className="mx-auto mb-4 text-[var(--color-muted)]" />
                                <p className="text-[var(--color-muted)] text-lg font-medium">
                                    {lang === "hi" ? "कोई सर्विस नहीं मिली" : "No services found"}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </section>

            {/* ═══════ HOW IT WORKS ═══════ */}
            <section className="bg-slate-50 dark:bg-[#020617] border-t border-[var(--color-border)] py-24">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
                        <span className="text-amber-500 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Process</span>
                        <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-black text-[var(--color-heading)] uppercase tracking-tighter">
                            {lang === "hi" ? "बड़े प्रोजेक्ट कैसे काम करते हैं?" : "How Big Projects Work"}
                        </motion.h2>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
                        className="grid md:grid-cols-4 gap-6"
                    >
                        {[
                            {
                                step: "01", icon: FiSearch, color: "bg-amber-500",
                                title: lang === "hi" ? "सर्विस चुनें" : "Select Project",
                                desc: lang === "hi" ? "निर्माण, रेनोवेशन या इंटीरियर — अपना प्रोजेक्ट चुनें" : "Choose from construction, renovation, interior design, and more.",
                            },
                            {
                                step: "02", icon: FiCheckCircle, color: "bg-indigo-500",
                                title: lang === "hi" ? "ठेकेदार मिलाएं" : "Get Matched",
                                desc: lang === "hi" ? "वेरिफाइड ठेकेदार आपके प्रोजेक्ट के लिए मैच होंगे" : "We match you with verified contractors suited for your project.",
                            },
                            {
                                step: "03", icon: FiShield, color: "bg-emerald-500",
                                title: lang === "hi" ? "एस्क्रो भुगतान" : "Secure Escrow",
                                desc: lang === "hi" ? "माइलस्टोन-बेस्ड भुगतान सुरक्षित प्लेटफॉर्म पर" : "Pay through milestone-based escrow — funds released as work progresses.",
                            },
                            {
                                step: "04", icon: FiStar, color: "bg-rose-500",
                                title: lang === "hi" ? "प्रोजेक्ट पूरा!" : "Project Complete",
                                desc: lang === "hi" ? "क्वालिटी चेक के बाद फाइनल भुगतान रिलीज़" : "Quality verified, final payment released, and you rate the experience.",
                            },
                        ].map((item) => (
                            <motion.div key={item.step} variants={cardPop} className="glass-card p-8 group hover:-translate-y-3 transition-all duration-500 border-slate-200/60 dark:border-white/5 shadow-soft hover:shadow-premium">
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                        <item.icon size={26} />
                                    </div>
                                    <span className="text-4xl font-black text-slate-200 dark:text-white/5 italic group-hover:text-amber-500/20 transition-colors duration-500">{item.step}</span>
                                </div>
                                <h3 className="font-display text-xl font-black text-[var(--color-heading)] uppercase mb-3 tracking-tight">{item.title}</h3>
                                <p className="text-[var(--color-muted)] text-base leading-relaxed opacity-80">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>
        </main >
    );
}
