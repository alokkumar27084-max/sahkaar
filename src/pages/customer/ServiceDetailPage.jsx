import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { servicesAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
    FiArrowLeft, FiArrowRight, FiStar, FiShield,
    FiCheckCircle, FiClock, FiGrid, FiZap, FiDroplet,
    FiTool, FiScissors, FiHome, FiWind, FiTarget
} from "react-icons/fi";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

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
function getIcon(name) { return ICON_MAP[name] || FiGrid; }

export default function ServiceDetailPage() {
    const { slug } = useParams();
    const { lang } = useLanguage();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_address: "", preferred_date: "", preferred_time: "", notes: "" });
    const [submitting, setSubmitting] = useState(false);
    const [booked, setBooked] = useState(false);

    useEffect(() => {
        setLoading(true);
        setBooked(false);
        servicesAPI.getService(slug)
            .then(res => {
                setService(res.data.service);
                setRelated(res.data.related || []);
            })
            .catch(() => navigate("/quick-services"))
            .finally(() => setLoading(false));
    }, [slug, navigate]);

    async function handleBook(e) {
        e.preventDefault();
        if (!form.customer_name || !form.customer_phone) {
            toast.error(lang === "hi" ? "नाम और फोन नंबर ज़रूरी है" : "Name and phone are required");
            return;
        }
        setSubmitting(true);
        try {
            await servicesAPI.submitRequest({
                ...form,
                service_id: service.id,
                category_id: service.category_id,
                type: service.category_type || "chhota",
            });
            toast.success(lang === "hi" ? "बुकिंग रिक्वेस्ट भेज दी गई!" : "Booking request submitted!");
            setBooked(true);
            setForm({ customer_name: "", customer_phone: "", customer_address: "", preferred_date: "", preferred_time: "", notes: "" });
        } catch {
            toast.error(lang === "hi" ? "कुछ गलत हो गया" : "Something went wrong");
        } finally { setSubmitting(false); }
    }

    if (loading) {
        return (
            <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
                <div className="glass-card p-8">
                    <div className="skeleton w-20 h-20 rounded-2xl mb-6" />
                    <div className="skeleton h-8 w-1/2 rounded-md mb-4" />
                    <div className="skeleton h-5 w-3/4 rounded-md mb-3" />
                    <div className="skeleton h-5 w-2/3 rounded-md mb-6" />
                    <div className="skeleton h-40 w-full rounded-xl" />
                </div>
            </main>
        );
    }

    if (!service) return null;

    const SvcIcon = getIcon(service.icon);

    return (
        <main className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-20">
            {/* Back button */}
            <motion.button
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-heading)] text-sm font-medium mb-6 transition-colors"
            >
                <FiArrowLeft size={16} /> {lang === "hi" ? "वापस जाएं" : "Go Back"}
            </motion.button>

            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                {/* ── LEFT: Service details ── */}
                <motion.div initial="hidden" animate="show" variants={stagger}>
                    {/* Header card */}
                    <motion.div variants={fadeUp} className="glass-card p-8 mb-6">
                        <div className="flex items-start gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/5 flex items-center justify-center shrink-0">
                                <SvcIcon size={36} className="text-[var(--color-primary)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {/* Category badge */}
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold mb-2">
                                    {lang === "hi" && service.category_name_hi ? service.category_name_hi : service.category_name}
                                </span>
                                <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-heading)] mb-2">
                                    {lang === "hi" && service.name_hi ? service.name_hi : service.name}
                                </h1>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {service.price_starts_at && (
                                        <span className="text-3xl font-bold text-[var(--color-heading)]">
                                            ₹{service.price_starts_at.toLocaleString()}
                                            <span className="text-sm font-normal text-[var(--color-muted)] ml-2">{lang === "hi" ? "से शुरू" : "onwards"}</span>
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-amber-500 font-semibold text-sm">
                                        <FiStar size={14} fill="currentColor" /> {Number(service.rating).toFixed(1)}
                                    </span>
                                    {service.bookings_count > 0 && (
                                        <span className="text-[var(--color-muted)] text-sm">
                                            {service.bookings_count.toLocaleString()} {lang === "hi" ? "बुकिंग्स" : "bookings"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Description */}
                    <motion.div variants={fadeUp} className="glass-card p-8 mb-6">
                        <h2 className="font-display text-lg font-bold text-[var(--color-heading)] mb-3">
                            {lang === "hi" ? "सर्विस डिटेल्स" : "Service Details"}
                        </h2>
                        <p className="text-[var(--color-body)] leading-relaxed">
                            {lang === "hi" && service.description_hi ? service.description_hi : service.description}
                        </p>
                    </motion.div>

                    {/* Trust signals */}
                    <motion.div variants={fadeUp} className="glass-card p-8 mb-6">
                        <h2 className="font-display text-lg font-bold text-[var(--color-heading)] mb-4">
                            {lang === "hi" ? "क्यों चुनें Thekedaar?" : "Why Choose Thekedaar?"}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { icon: FiShield, text: lang === "hi" ? "आधार वेरिफाइड प्रोफेशनल" : "Aadhaar Verified Professional", color: "text-green-500" },
                                { icon: FiStar, text: lang === "hi" ? "रेटिंग और रिव्यू" : "Ratings & Reviews", color: "text-amber-500" },
                                { icon: FiCheckCircle, text: lang === "hi" ? "संतुष्टि की गारंटी" : "Satisfaction Guarantee", color: "text-blue-500" },
                            ].map(t => (
                                <div key={t.text} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                                    <t.icon size={20} className={`${t.color} shrink-0 mt-0.5`} />
                                    <span className="text-sm text-[var(--color-body)] font-medium">{t.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Related services */}
                    {related.length > 0 && (
                        <motion.div variants={fadeUp}>
                            <h2 className="font-display text-lg font-bold text-[var(--color-heading)] mb-4">
                                {lang === "hi" ? "इसी कैटेगरी की और सर्विसेज" : "More in This Category"}
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {related.map(r => {
                                    const RIcon = getIcon(r.icon);
                                    return (
                                        <button key={r.id} onClick={() => navigate(`/services/${r.slug}`)}
                                            className="glass-card p-5 text-left group hover:-translate-y-1 transition-all flex items-center gap-4"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/8 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)]/15 transition-colors">
                                                <RIcon size={20} className="text-[var(--color-primary)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[var(--color-heading)] text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                                                    {lang === "hi" && r.name_hi ? r.name_hi : r.name}
                                                </p>
                                                {r.price_starts_at && (
                                                    <p className="text-xs text-[var(--color-muted)]">₹{r.price_starts_at.toLocaleString()} onwards</p>
                                                )}
                                            </div>
                                            <FiArrowRight size={14} className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* ── RIGHT: Booking form ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:sticky lg:top-6 self-start">
                    <div className="glass-card p-8">
                        {booked ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <FiCheckCircle size={32} className="text-green-500" />
                                </div>
                                <h3 className="font-display text-xl font-bold text-[var(--color-heading)] mb-2">
                                    {lang === "hi" ? "रिक्वेस्ट भेज दी गई!" : "Request Submitted!"}
                                </h3>
                                <p className="text-[var(--color-muted)] text-sm mb-6">
                                    {lang === "hi" ? "हम जल्द ही आपसे संपर्क करेंगे।" : "We'll contact you shortly to confirm."}
                                </p>
                                <button onClick={() => setBooked(false)} className="btn-primary">
                                    {lang === "hi" ? "और बुक करें" : "Book Another"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="font-display text-xl font-bold text-[var(--color-heading)] mb-1">
                                    {lang === "hi" ? "अभी बुक करें" : "Book This Service"}
                                </h3>
                                <p className="text-[var(--color-muted)] text-sm mb-6">
                                    {lang === "hi" ? "अपनी डिटेल्स भरें, हम कन्फर्म करेंगे" : "Fill your details and we'll confirm"}
                                </p>
                                <form onSubmit={handleBook} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5 block">
                                            {lang === "hi" ? "नाम *" : "Name *"}
                                        </label>
                                        <input type="text" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
                                            className="input-field" placeholder={lang === "hi" ? "आपका नाम" : "Your name"} required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5 block">
                                            {lang === "hi" ? "फोन *" : "Phone *"}
                                        </label>
                                        <input type="tel" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                                            className="input-field" placeholder="+91 98765 43210" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5 block">
                                            {lang === "hi" ? "पता" : "Address"}
                                        </label>
                                        <input type="text" value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })}
                                            className="input-field" placeholder={lang === "hi" ? "आपका पता" : "Your address"} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5 block">
                                                {lang === "hi" ? "तारीख" : "Date"}
                                            </label>
                                            <input type="date" value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })}
                                                className="input-field" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5 block">
                                                {lang === "hi" ? "समय" : "Time"}
                                            </label>
                                            <select value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })} className="input-field">
                                                <option value="">{lang === "hi" ? "चुनें" : "Select"}</option>
                                                <option value="morning">{lang === "hi" ? "सुबह (9-12)" : "Morning (9-12)"}</option>
                                                <option value="afternoon">{lang === "hi" ? "दोपहर (12-4)" : "Afternoon (12-4)"}</option>
                                                <option value="evening">{lang === "hi" ? "शाम (4-7)" : "Evening (4-7)"}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5 block">
                                            {lang === "hi" ? "अतिरिक्त नोट्स" : "Additional Notes"}
                                        </label>
                                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                            rows={2} className="input-field !h-auto resize-none" placeholder={lang === "hi" ? "कोई विशेष ज़रूरत..." : "Any special requirements..."} />
                                    </div>
                                    <button type="submit" disabled={submitting}
                                        className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold flex items-center justify-center gap-2 shadow-btn btn-shimmer hover:shadow-btn-hover hover:-translate-y-0.5 transition-all"
                                    >
                                        {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                        {lang === "hi" ? "बुकिंग रिक्वेस्ट भेजें" : "Submit Booking Request"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
