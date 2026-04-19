import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { servicesAPI } from "../../services/api";
import { buildContractorSearchPath } from "../../utils/serviceToContractorSearch";
import toast from "react-hot-toast";
import {
    FiArrowLeft, FiArrowRight, FiStar, FiShield,
    FiCheckCircle, FiClock, FiGrid, FiZap, FiDroplet,
    FiTool, FiScissors, FiHome, FiWind, FiTarget, FiMapPin, FiCalendar
} from "react-icons/fi";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const ICON_MAP = {
    snowflake: FiWind, sparkles: FiStar, zap: FiZap, droplets: FiDroplet,
    hammer: FiTool, scissors: FiScissors, bug: FiTarget, paintbrush: FiGrid,
    wind: FiWind, thermometer: FiClock, droplet: FiDroplet, home: FiHome,
    fan: FiWind, toggleRight: FiZap, battery: FiZap, door: FiHome,
    armchair: FiHome, trees: FiGrid, star: FiStar, shield: FiShield,
    target: FiTarget, umbrella: FiShield, layers: FiGrid, loader: FiTool,
    chefHat: FiHome, sofa: FiHome, bath: FiDroplet, pipette: FiDroplet,
    container: FiHome, mapPin: FiMapPin, calendar: FiCalendar
};
function getIcon(name) { return ICON_MAP[name] || FiGrid; }

export default function ServiceDetailPage() {
    const { slug } = useParams();
    const { lang } = useLanguage();
    const { user } = useAuth();
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

    useEffect(() => {
        if (!user) return;
        setForm((prev) => ({
            ...prev,
            customer_name: prev.customer_name || user.name || "",
            customer_phone: prev.customer_phone || user.phone || "",
        }));
    }, [user]);

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
            <main className="bg-[var(--color-bg)] min-h-screen pt-24 pb-20">
                <div className="max-w-[1200px] mx-auto px-4 md:px-8">
                    <div className="flex gap-8">
                        <div className="flex-1 space-y-6">
                            <div className="skeleton w-24 h-24 rounded-3xl" />
                            <div className="skeleton h-12 w-3/4 rounded-xl" />
                            <div className="skeleton h-6 w-full rounded-md" />
                            <div className="skeleton h-6 w-5/6 rounded-md" />
                        </div>
                        <div className="w-[400px] hidden lg:block">
                            <div className="skeleton h-[500px] rounded-3xl" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (!service) return null;

    const SvcIcon = getIcon(service.icon);
    const nearbyPath = service.category_slug
        ? buildContractorSearchPath(service.category_slug, {
            serviceName: service.name,
            serviceSlug: service.slug,
        })
        : `/search?sort=distance&radius_km=5&q=${encodeURIComponent(service.name || "")}`;
    
    // Parse related tasks if stored as JSON string
    let tasksList = [];
    if (typeof service.related_tasks === 'string') {
        try {
            tasksList = JSON.parse(service.related_tasks);
        } catch (e) {
            tasksList = service.related_tasks.split(',').filter(Boolean);
        }
    } else if (Array.isArray(service.related_tasks)) {
        tasksList = service.related_tasks;
    }

    return (
        <main className="bg-[var(--color-bg)] min-h-screen pt-24 pb-20 relative">
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative z-10">
                
                {/* Back Link */}
                <button
                    onClick={() => navigate(service.category_type === "bada" ? "/macro-services" : "/quick-services")}
                    className="mb-8 text-sm font-bold tracking-widest text-[var(--color-muted)] hover:text-[var(--color-heading)] flex items-center gap-2 uppercase transition-colors"
                >
                    <FiArrowLeft size={16} /> All Services
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 rounded-2xl border border-[var(--color-primary)]/25 bg-gradient-to-r from-[var(--color-primary)]/10 to-cyan-500/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-primary)] mb-2">
                            {lang === "hi" ? "पास के प्रोफेशनल" : "Nearby on Thekedaar"}
                        </p>
                        <p className="text-[var(--color-heading)] font-bold text-lg md:text-xl">
                            {lang === "hi"
                                ? "पहले अपने एरिया में वेरिफाइड प्रोफेशनल देखें, फिर बुक करें।"
                                : "Browse verified professionals near you, then book the one you trust."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(nearbyPath)}
                        className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-bold shadow-glow hover:opacity-95 transition-opacity"
                    >
                        {lang === "hi" ? "पास के खोजें" : "Find nearby"} <FiArrowRight />
                    </button>
                </motion.div>

                <div className="grid lg:grid-cols-[1fr_minmax(400px,450px)] gap-12 lg:gap-16">
                    
                    {/* LEFT COLUMN: Read Content */}
                    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-12">
                        
                        <motion.section variants={fadeUp}>
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
                                <SvcIcon className="w-10 h-10 drop-shadow-md" />
                            </div>
                            
                            <h1 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--color-heading)] tracking-tight mb-4 leading-tight">
                                {service.name}
                            </h1>
                            
                            <p className="text-lg md:text-xl text-[var(--color-muted)] font-medium leading-relaxed max-w-2xl">
                                {service.description || "Professional service delivered to your doorstep within 60 minutes."}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-[var(--color-border)]">
                                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-heading)] bg-[var(--color-surface)] px-4 py-2 rounded-xl border border-[var(--color-border)] shadow-sm">
                                    <FiStar className="text-amber-500 text-lg fill-amber-500" />
                                    <span>4.8</span>
                                    <span className="text-[var(--color-muted)] font-medium ml-1">(120+ reviews)</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-heading)] bg-[var(--color-surface)] px-4 py-2 rounded-xl border border-[var(--color-border)] shadow-sm">
                                    <FiShield className="text-emerald-500 text-lg" />
                                    <span>Thekedaar Assured</span>
                                </div>
                            </div>
                        </motion.section>

                        <motion.section variants={fadeUp}>
                            <h2 className="font-display text-2xl font-bold text-[var(--color-heading)] mb-6 tracking-tight">What's included</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {(tasksList.length ? tasksList : ["Standard inspection", "Professional servicing", "Safety check", "Post-service cleanup"]).map((task, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 hover:bg-[var(--color-surface)] transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                            <FiCheckCircle />
                                        </div>
                                        <p className="text-sm font-semibold text-[var(--color-heading)] mt-1.5 leading-snug">{task}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        <motion.section variants={fadeUp} className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-8 lg:p-10">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                                    <FiZap size={32} />
                                </div>
                                <div>
                                    <h3 className="font-display text-2xl text-amber-900 dark:text-amber-500 font-bold mb-3 tracking-tight">Instant Service Guarantee</h3>
                                    <p className="text-amber-800 dark:text-amber-200/80 leading-relaxed font-medium">When you book this quick service, our algorithm dispatches the nearest verified professional within 5 kilometers. Most professionals arrive within 60 minutes.</p>
                                </div>
                            </div>
                        </motion.section>

                        {related.length > 0 && (
                            <motion.section variants={fadeUp} className="pt-6 border-t border-[var(--color-border)]">
                                <h2 className="font-display text-2xl font-bold text-[var(--color-heading)] mb-6 tracking-tight">Frequently booked together</h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {related.map(r => {
                                        const RIcon = getIcon(r.icon);
                                        return (
                                            <div key={r.slug} onClick={() => navigate(`/services/${r.slug}`)} className="group cursor-pointer glass-card p-5 hover:border-[var(--color-primary)]/50 transition-colors flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg)] flex items-center justify-center border border-[var(--color-border)] group-hover:scale-110 transition-transform">
                                                    <RIcon className="w-6 h-6 text-[var(--color-primary)]" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[var(--color-heading)] text-base group-hover:text-[var(--color-primary)] transition-colors">{r.name}</h4>
                                                    <p className="text-xs text-[var(--color-muted)] font-medium mt-0.5">Quick Service</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.section>
                        )}
                    </motion.div>

                    {/* RIGHT COLUMN: Sticky Booking Form */}
                    <div className="relative">
                        <div className="sticky top-28 lg:top-32">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-0 overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/40 border-[var(--color-border)] border">
                                <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] p-6 md:p-8">
                                    <h3 className="font-display text-2xl font-bold text-[var(--color-heading)] tracking-tight">Request Service</h3>
                                    <p className="text-sm font-medium text-[var(--color-muted)] mt-1">Book instantly. No hidden charges.</p>
                                </div>

                                {booked ? (
                                    <div className="p-8 md:p-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-6">
                                            <FiCheckCircle className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-display font-bold text-[var(--color-heading)] mb-2 tracking-tight">Request Sent</h3>
                                        <p className="text-sm text-[var(--color-muted)] mb-8 font-medium">A verified contractor has been notified and will call you shortly to confirm the appointment.</p>
                                        <button onClick={() => navigate("/customer/dashboard")} className="btn-primary w-full shadow-glow py-3.5">
                                            Go to Dashboard
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-6 md:p-8">
                                        <form onSubmit={handleBook} className="space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Your Name</label>
                                                    <input required type="text" placeholder="John Doe" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="input-field shadow-inner bg-[var(--color-bg)] w-full font-medium" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Phone Number</label>
                                                    <input required type="tel" placeholder="10-digit number" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="input-field shadow-inner bg-[var(--color-bg)] w-full font-medium" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-1.5"><FiMapPin /> Precise Address</label>
                                                <textarea required placeholder="House/Flat No, Building, Landmark..." value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} className="input-field shadow-inner bg-[var(--color-bg)] resize-none w-full font-medium" rows={2} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5 border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-3 rounded-xl">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5"><FiCalendar /> Preferred Date</label>
                                                    <input type="date" value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} className="w-full bg-transparent text-sm font-bold text-[var(--color-heading)] outline-none" min={new Date().toISOString().split('T')[0]} />
                                                </div>
                                                <div className="space-y-1.5 border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-3 rounded-xl">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5"><FiClock /> Preferred Time</label>
                                                    <input type="time" value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })} className="w-full bg-transparent text-sm font-bold text-[var(--color-heading)] outline-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 pt-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Additional Notes (Optional)</label>
                                                <textarea placeholder="Specific problem details..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field shadow-inner bg-[var(--color-bg)] resize-none w-full font-medium" rows={2} />
                                            </div>

                                            <div className="pt-4">
                                                <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base shadow-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                                                    {submitting ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Request Now <FiArrowRight /></>}
                                                </button>
                                                <p className="text-center text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-4">No commitment until the contractor accepts</p>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Background design elements */}
            <div className="absolute top-[20%] left-0 w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        </main>
    );
}
