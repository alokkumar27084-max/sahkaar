import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { servicesAPI } from "../../services/api";
import Icon from "../../components/common/Icon";
import {
    FiSearch, FiArrowRight, FiStar, FiClock, FiShield,
    FiCheckCircle, FiZap, FiDroplet, FiTool, FiScissors,
    FiHome, FiGrid, FiWind, FiTarget
} from "react-icons/fi";

/* ── Animations ── */
const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardPop = { hidden: { opacity: 0, y: 20, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 18 } } };

/* ── Icon map for dynamic icons ── */
const ICON_MAP = {
    snowflake: FiWind, sparkles: FiStar, zap: FiZap, droplets: FiDroplet,
    hammer: FiTool, scissors: FiScissors, bug: FiTarget, paintbrush: FiGrid,
    wind: FiWind, thermometer: FiClock, droplet: FiDroplet, home: FiHome,
    fan: FiWind, toggleRight: FiZap, battery: FiZap, door: FiHome,
    armchair: FiHome, trees: FiGrid, star: FiStar, shield: FiShield,
    target: FiTarget, umbrella: FiShield, layers: FiGrid, loader: FiTool,
    chefHat: FiHome, sofa: FiHome, bath: FiDroplet, pipette: FiDroplet,
    container: FiHome,
};

function getIcon(name) {
    return ICON_MAP[name] || FiGrid;
}


export default function QuickServicesPage() {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Load categories
    useEffect(() => {
        servicesAPI.getCategories("chhota")
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

            {/* ═══════ HERO ═══════ */}
            <section className="relative min-h-[55vh] md:min-h-[65vh] flex items-center overflow-hidden">
                {/* Morphing gradient background */}
                <div className="absolute inset-0 bg-[#030712]" />
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{
                            x: [0, 60, -30, 40, 0], y: [0, -50, 30, -20, 0], scale: [1, 1.2, 0.9, 1.1, 1],
                            borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 30% 70% / 60% 40% 60% 40%", "30% 70% 70% 30% / 30% 30% 70% 70%"]
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-gradient-to-br from-indigo-600/20 to-violet-600/10 blur-[100px]"
                    />
                    <motion.div
                        animate={{
                            x: [0, -40, 30, 0], y: [0, 30, -40, 0], scale: [1, 0.9, 1.15, 1],
                            borderRadius: ["50% 50% 30% 70% / 60% 40% 60% 40%", "30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 30% 70% / 60% 40% 60% 40%"]
                        }}
                        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-[5%] right-[5%] w-[600px] h-[600px] bg-gradient-to-bl from-cyan-500/12 to-blue-500/8 blur-[120px]"
                    />
                    <div className="absolute inset-0 opacity-[0.015]" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    }} />
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
                        backgroundSize: "100px 100px"
                    }} />
                </div>

                <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 pt-28 pb-16 w-full">
                    <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-3xl">
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] mb-10">
                            <FiZap size={14} className="text-cyan-400" />
                            <span className="text-white/60 text-[11px] font-medium uppercase tracking-[0.2em]">
                                {lang === "hi" ? "प्रोफेशनल होम सर्विसेज" : "Fast & Reliable Home Services"}
                            </span>
                        </motion.div>

                        <div className="mb-10">
                            {(lang === "hi" ? ["क्विक", "सर्विसेज."] : ["QUICK", "SERVICES."]).map((word, i) => (
                                <motion.span
                                    key={word}
                                    initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    transition={{ delay: 0.2 + i * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className={`font-display text-6xl md:text-8xl lg:text-[7rem] leading-[0.92] tracking-[-0.04em] font-extrabold block ${i === 1
                                        ? "bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_3s_ease_infinite]"
                                        : "text-white"}`}
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </div>

                        <motion.p variants={fadeUp} className="text-white/40 text-base md:text-lg max-w-lg mb-12 leading-relaxed">
                            {lang === "hi"
                                ? "AC रिपेयर, प्लंबिंग, इलेक्ट्रीशियन, क्लीनिंग — सब कुछ एक क्लिक में।"
                                : "AC repair, plumbing, electrician, cleaning — everything at your fingertips."}
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                            {[
                                { icon: FiShield, text: lang === "hi" ? "आधार वेरिफाइड" : "Aadhaar Verified" },
                                { icon: FiStar, text: lang === "hi" ? "पड़ोसियों द्वारा रेटेड" : "Rated by Neighbours" },
                                { icon: FiCheckCircle, text: lang === "hi" ? "सुरक्षित भुगतान" : "Secure Payments" },
                            ].map(pill => (
                                <span key={pill.text} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 text-xs font-medium uppercase tracking-wider backdrop-blur-sm">
                                    <pill.icon size={13} className="text-emerald-400" /> {pill.text}
                                </span>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════ CATEGORY + SERVICES ═══════ */}
            <section className="max-w-[1400px] mx-auto px-4 md:px-6 -mt-8 relative z-20">
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
                            placeholder={lang === "hi" ? "सर्विस खोजें..." : "What are you looking for?"}
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
                                    ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white border-transparent shadow-btn"
                                    : "glass-card hover:border-[var(--color-primary)]/30 text-[var(--color-heading)]"
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
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
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
                        className="bento-grid pb-16"
                    >
                        <AnimatePresence mode="popLayout">
                            {filtered.map((svc, idx) => {
                                const SvcIcon = getIcon(svc.icon);
                                // Create a bento pattern: every 5th is wide, every 7th is tall
                                const isWide = idx % 5 === 0 && idx !== 0;
                                const isTall = (idx + 2) % 6 === 0;

                                return (
                                    <motion.div
                                        key={svc.id}
                                        variants={cardPop}
                                        layout
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                        onClick={() => navigate(`/services/${svc.slug}`)}
                                        className={`glass-card p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-glow ${isWide ? 'bento-item-wide' : ''} ${isTall ? 'bento-item-tall' : ''}`}
                                    >
                                        {/* Hover glow effect */}
                                        <div className="absolute -inset-full bg-gradient-to-br from-[var(--color-primary)]/10 via-transparent to-[var(--color-accent)]/10 rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-soft)] dark:bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:shadow-soft transition-all duration-500">
                                                    <SvcIcon size={28} className="text-[var(--color-primary)]" />
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:border-[var(--color-primary)]/30 transition-colors">
                                                    <FiStar size={14} className="text-amber-500" fill="currentColor" />
                                                    <span className="text-sm font-bold text-[var(--color-heading)]">{Number(svc.rating).toFixed(1)}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-display font-bold text-[var(--color-heading)] text-xl mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                                                    {lang === "hi" && svc.name_hi ? svc.name_hi : svc.name}
                                                </h3>
                                                <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-6 line-clamp-2 font-medium opacity-80">
                                                    {lang === "hi" && svc.description_hi ? svc.description_hi : svc.description}
                                                </p>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-0.5">Starting From</span>
                                                    <span className="text-2xl font-bold text-[var(--color-heading)]">₹{svc.price_starts_at?.toLocaleString()}</span>
                                                </div>
                                                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500 shadow-btn">
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
                <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
                        <span className="text-[var(--color-primary)] font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Process</span>
                        <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-black text-[var(--color-heading)] uppercase tracking-tighter">
                            {lang === "hi" ? "यह कैसे काम करता है?" : "Our Seamless Process"}
                        </motion.h2>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        {[
                            {
                                step: "01",
                                icon: FiSearch,
                                title: lang === "hi" ? "सर्विस चुनें" : "Select Service",
                                desc: lang === "hi" ? "अपनी ज़रूरत के हिसाब से सर्विस ब्राउज़ करें और बुक करें" : "Browse our curated bento of home services and pick what fits.",
                                color: "bg-indigo-500"
                            },
                            {
                                step: "02",
                                icon: FiClock,
                                title: lang === "hi" ? "टाइम स्लॉट चुनें" : "Pick Schedule",
                                desc: lang === "hi" ? "अपनी सुविधानुसार तारीख और समय चुनें" : "Choose a time that works for you. Our pros are always on time.",
                                color: "bg-amber-500"
                            },
                            {
                                step: "03",
                                icon: FiCheckCircle,
                                title: lang === "hi" ? "काम हो जाएगा!" : "Job Delivered",
                                desc: lang === "hi" ? "वेरिफाइड प्रोफेशनल आपके दरवाजे पर आएगा" : "A verified professional handles everything while you relax.",
                                color: "bg-emerald-500"
                            },
                        ].map((item) => (
                            <motion.div key={item.step} variants={cardPop} className="glass-card p-10 group hover:-translate-y-3 transition-all duration-500 border-slate-200/60 dark:border-white/5 shadow-soft hover:shadow-premium">
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                        <item.icon size={26} />
                                    </div>
                                    <span className="text-4xl font-black text-slate-200 dark:text-white/5 italic group-hover:text-[var(--color-primary)]/20 transition-colors duration-500">{item.step}</span>
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
