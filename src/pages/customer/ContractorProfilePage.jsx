import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI, reviewAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { WHATSAPP_URL } from "../../utils/constants";
import { getImageUrl } from "../../utils/imageUtils";
import StarRating from "../../components/common/StarRating";
import Badge from "../../components/common/Badge";
import Icon from "../../components/common/Icon";
import toast from "react-hot-toast";
import { FiArrowLeft, FiShare2, FiMessageCircle, FiMapPin, FiBriefcase, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function ContractorProfilePage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contractor, setContractor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const cRes = await contractorAPI.getById(id);
        setContractor(cRes.data.contractor);
        trackEvent("profile_view", { contractor_id: id });
        try { const rRes = await reviewAPI.getForContractor(id); setReviews(rRes.data.reviews || []); }
        catch { setReviews([]); }
      } catch { toast.error(t("app.error")); navigate("/search"); }
      finally { setLoading(false); }
    }
    load();
  }, [id, navigate, t]);

  async function submitReview(e) {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (myRating === 0) { toast.error(lang === "hi" ? "कृपया रेटिंग दें" : "Please give a rating"); return; }
    setSubmitting(true);
    try {
      await reviewAPI.submit(id, { rating: myRating, comment: myComment });
      toast.success(lang === "hi" ? "समीक्षा सबमिट हो गई!" : "Review submitted!");
      setMyRating(0); setMyComment("");
      const res = await reviewAPI.getForContractor(id);
      setReviews(res.data.reviews || []);
    } catch (err) { toast.error(err.response?.data?.message || t("app.error")); }
    finally { setSubmitting(false); }
  }

  async function submitReport(e) {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!reportReason.trim()) {
      toast.error(lang === "hi" ? "कृपया रिपोर्ट का कारण लिखें" : "Please provide a reason for the report");
      return;
    }
    setReporting(true);
    try {
      await contractorAPI.report(id, reportReason.trim());
      toast.success(lang === "hi" ? "रिपोर्ट भेज दी गई है" : "Report submitted");
      setReportReason("");
      setShowReportBox(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setReporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }
  if (!contractor) return null;

  const name = contractor?.name || contractor?.business_name || contractor?.user_name || "Contractor";
  const category = contractor?.category || contractor?.categories?.[0] || "general";
  const photo_url = contractor?.photo_url;
  const portfolio_items = contractor?.portfolio_items || [];
  const portfolio_photos = contractor?.portfolio_photos || contractor?.portfolio_urls || [];
  const rating = Number(contractor?.rating || 0);
  const review_count = contractor?.review_count ?? contractor?.reviews_count ?? 0;
  const description = contractor?.description;
  const is_verified = contractor?.is_verified;
  const is_featured = contractor?.is_featured;
  const is_labour_group = contractor?.is_labour_group;
  const is_responsibility_model = contractor?.is_responsibility_model;
  const is_available = contractor?.is_available;
  const phone = contractor?.phone || "";
  const daily_rate = contractor?.daily_rate;
  const experience_years = contractor?.experience_years;
  const team_size = contractor?.team_size;
  const tier = contractor?.tier;
  const services = contractor?.services || [];
  const location_text = contractor?.location_text;

  const tabs = [
    { id: "about", label: t("profile.about") },
    { id: "portfolio", label: t("profile.portfolio") },
    { id: "reviews", label: `${t("profile.reviews")} (${review_count})` },
  ];

  return (
    <div className="bg-[var(--color-bg)] min-h-screen pb-20">
      
      {/* Premium Hero Banner */}
      <div className="relative w-full h-[360px] md:h-[420px] overflow-hidden">
        {portfolio_photos[0] ? (
            <img src={getImageUrl(portfolio_photos[0])} alt="work" className="w-full h-full object-cover scale-105" />
        ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-indigo-800/80 to-[var(--color-bg)] opacity-90" />
        )}
        
        {/* Deep, luxurious gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        
        <button onClick={() => navigate(-1)}
            className="absolute top-6 left-4 md:left-8 h-10 px-4 rounded-xl bg-black/20 hover:bg-black/40 backdrop-blur-md text-white text-sm font-semibold flex items-center gap-2 transition-colors border border-white/10 z-50">
            <FiArrowLeft size={16} /> {/* t("app.back") fails cleanly if translation is missing, hardcode for safety */} Back
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 -mt-32 md:-mt-40 relative z-20">
        
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
            {/* Identity & Core Actions Panel */}
            <div className="glass-card p-6 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8 justify-between shadow-glow lg:items-center">
                
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative shrink-0">
                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-cyan-400 opacity-50 blur-md" />
                        <img src={getImageUrl(photo_url)} alt={name}
                            className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-[var(--color-surface)] shadow-xl" 
                            onError={e => e.currentTarget.src = "/default-contractor.png"} />
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="font-display text-3xl md:text-5xl text-[var(--color-heading)] font-black uppercase tracking-tight">{name}</h1>
                            {is_verified && <FiCheckCircle className="text-emerald-500 w-6 h-6 md:w-8 md:h-8 shrink-0" />}
                        </div>
                        
                        <p className="text-[var(--color-primary)] text-sm md:text-base font-bold tracking-widest uppercase mb-3 block">{category?.replace("_", " ")}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                <Icon name="rating" className="w-3.5 h-3.5" />
                                {rating.toFixed(1)} ({review_count} {lang === "hi" ? "समीक्षाएं" : "reviews"})
                            </div>
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${is_available ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${is_available ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {is_available ? (lang === "hi" ? "उपलब्ध" : "Available") : (lang === "hi" ? "व्यस्त" : "Unavailable")}
                            </span>
                            {location_text && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-muted)]">
                                    <FiMapPin className="text-[var(--color-primary)]" /> {location_text}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {is_verified && <Badge type="verified" lang={lang} />}
                            {is_featured && <Badge type="featured" lang={lang} />}
                            {is_labour_group && <Badge type="labour_group" lang={lang} />}
                            {is_responsibility_model && <Badge type="responsibility" lang={lang} />}
                            {tier && tier !== 'standard' && <Badge type={`tier_${tier}`} lang={lang} />}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 shrink-0 lg:w-72">
                    <button onClick={() => navigate(`/checkout/${id}`, { state: { contractor } })} className="btn-primary w-full shadow-glow">
                        <FiBriefcase size={18} /> {lang === "hi" ? "अभी बुक करें" : "Book Contractor"}
                    </button>
                    <a href={WHATSAPP_URL(phone, name)} target="_blank" rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                        onClick={async () => { try { await contractorAPI.recordLead(id); } catch { } trackEvent("whatsapp_tap", { contractor_id: id, source: "profile" }); }}>
                        <FiMessageCircle size={18} /> {t("profile.contact_whatsapp")}
                    </a>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                        <button onClick={() => { if (navigator.share) navigator.share({ title: name, url: window.location.href }); }}
                            className="btn-secondary w-full">
                            <FiShare2 size={16} /> Share
                        </button>
                        <button onClick={() => { if (!user) { navigate("/login"); return; } setShowReportBox((prev) => !prev); }}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold transition-colors border border-rose-500/20 text-sm">
                            <FiAlertTriangle size={16} /> Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Reporting Box */}
            <AnimatePresence>
                {showReportBox && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4">
                        <div className="glass-card p-5 border-rose-500/30 bg-rose-500/5 border">
                            <h3 className="font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-2">
                                <FiAlertTriangle /> {lang === "hi" ? "इस प्रोफाइल को रिपोर्ट करें" : "Report this profile"}
                            </h3>
                            <p className="text-sm text-rose-600/80 dark:text-rose-300 mb-4">{lang === "hi" ? "यदि आपको इस प्रोफाइल को लेकर चिंता है, तो हमें बताएं।" : "If you have concerns about this profile or work quality, let us know securely."}</p>
                            <form onSubmit={submitReport} className="flex flex-col sm:flex-row gap-3">
                                <input value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                                    maxLength={100} className="input-field flex-1 !border-rose-500/30 focus:!border-rose-500" placeholder={lang === "hi" ? "रिपोर्ट का कारण..." : "Reason for report..."} />
                                <div className="flex gap-2 shrink-0">
                                    <button type="submit" disabled={reporting} className="px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold text-white transition-colors text-sm">
                                        {reporting ? "..." : (lang === "hi" ? "भेजें" : "Submit")}
                                    </button>
                                    <button type="button" onClick={() => setShowReportBox(false)} className="btn-secondary text-sm">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Data Stats Control Panel */}
            <div className="glass-card mt-6 p-0 overflow-hidden hidden sm:block">
                <div className="grid grid-cols-4 divide-x divide-[var(--color-border)]">
                    {[
                        { label: t("profile.rate"), value: daily_rate ? `₹${daily_rate.toLocaleString("en-IN")}` : "—", sub: t("profile.per_day") },
                        { label: t("profile.experience"), value: experience_years ? `${experience_years}` : "—", sub: t("profile.years") },
                        { label: t("profile.team_size"), value: is_labour_group ? `${team_size || 0}` : "—", sub: t("profile.workers") },
                        { label: lang === "hi" ? "रेटिंग" : "Rating", value: rating.toFixed(1), sub: `${review_count} Reviews` },
                    ].map((s, idx) => (
                        <div key={idx} className="p-6 text-center hover:bg-[var(--color-surface)]/50 transition-colors">
                            <p className="text-[11px] font-black tracking-widest uppercase text-[var(--color-muted)] mb-2">{s.label}</p>
                            <p className="text-3xl font-display font-bold text-[var(--color-heading)] leading-none">{s.value}</p>
                            <p className="text-[10px] uppercase font-bold text-[var(--color-primary)] mt-1.5 opacity-80">{s.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Data Stats */}
            <div className="grid grid-cols-2 gap-3 mt-6 sm:hidden">
                    {[
                        { label: t("profile.rate"), value: daily_rate ? `₹${daily_rate}` : "—", sub: "/ day" },
                        { label: "Exp.", value: experience_years ? `${experience_years}` : "—", sub: "Years" },
                        { label: "Team", value: is_labour_group ? `${team_size || 0}` : "—", sub: "Workers" },
                        { label: "Rating", value: rating.toFixed(1), sub: "Reviews" },
                    ].map((s, idx) => (
                        <div key={idx} className="glass-card p-4 text-center">
                            <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--color-muted)] mb-1">{s.label}</p>
                            <p className="text-xl font-display font-bold text-[var(--color-heading)]">{s.value}</p>
                            <p className="text-[9px] uppercase font-bold text-[var(--color-primary)] mt-1">{s.sub}</p>
                        </div>
                    ))}
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mt-8 p-1.5 bg-[var(--color-border)] rounded-2xl overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 sm:px-6 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                    ? "bg-[var(--color-primary)] text-white shadow-md transform scale-[1.02]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface)]/50"
                    }`}>
                    {tab.label}
                </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="mt-6">
                <AnimatePresence mode="wait">
                    
                    {/* ABOUT */}
                    {activeTab === "about" && (
                        <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid md:grid-cols-[2fr_1fr] gap-6">
                            <div className="glass-card p-6 md:p-8">
                                <h3 className="font-display text-2xl text-[var(--color-heading)] font-bold tracking-tight mb-4">{t("profile.about")} Contractor</h3>
                                {description ? (
                                    <p className="text-[var(--color-body)] leading-relaxed whitespace-pre-wrap">{description}</p>
                                ) : (
                                    <p className="text-[var(--color-muted)] italic">No detailed description provided by the contractor.</p>
                                )}
                            </div>
                            
                            <div className="space-y-6">
                                {services.length > 0 && (
                                    <div className="glass-card p-6 border-dashed border-[var(--color-border)] bg-[var(--color-bg)]">
                                    <h3 className="text-xs font-bold tracking-widest uppercase text-[var(--color-heading)] mb-4">{t("profile.services")} Offered</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {services.map((s, i) => (
                                        <span key={i} className="inline-flex px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold capitalize">{s}</span>
                                        ))}
                                    </div>
                                    </div>
                                )}
                                <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border-indigo-500/20">
                                    <h3 className="font-bold text-[var(--color-heading)] mb-2 flex items-center gap-2"><FiCheckCircle className="text-emerald-500"/> Trust Guarantee</h3>
                                    <p className="text-xs text-[var(--color-muted)] mb-4 leading-relaxed">Book via Thekedaar for milestone protections, dedicated dispute resolution, and guaranteed service completion.</p>
                                    <button onClick={() => navigate(`/checkout/${id}`, { state: { contractor } })} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                                        View Escrow Terms &rarr;
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* PORTFOLIO */}
                    {activeTab === "portfolio" && (
                        <motion.div key="portfolio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            {portfolio_items.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {portfolio_items.map((item) => (
                                <div key={item.id} className="glass-card p-0 rounded-2xl flex flex-col group overflow-hidden bg-[var(--color-surface)] shadow-sm hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[var(--color-primary)]/30">
                                    <div className="relative h-64 overflow-hidden">
                                        <img src={getImageUrl(item.image_url)} alt={item.title || "Portfolio"}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                                            <div>
                                                {item.title && <h4 className="font-bold text-white text-lg">{item.title}</h4>}
                                                {item.description && <p className="text-xs text-white/80 mt-1 line-clamp-2">{item.description}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                            )}

                            {portfolio_items.length === 0 && portfolio_photos.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {portfolio_photos.map((url, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm">
                                    <img src={getImageUrl(url)} alt={`Work ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" loading="lazy" />
                                </div>
                                ))}
                            </div>
                            )}

                            {portfolio_items.length === 0 && portfolio_photos.length === 0 && (
                            <div className="py-20 border-2 border-dashed border-[var(--color-border)] rounded-3xl flex flex-col items-center justify-center bg-[var(--color-bg)]/50">
                                <span className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4 shadow-sm border border-[var(--color-border)]">
                                <Icon name="image" className="w-6 h-6 text-[var(--color-muted)]" />
                                </span>
                                <h3 className="text-lg font-bold text-[var(--color-heading)]">No portfolio items yet</h3>
                                <p className="text-center text-[var(--color-muted)] font-medium text-sm mt-1">This contractor hasn't uploaded prior work images.</p>
                            </div>
                            )}
                        </motion.div>
                    )}

                    {/* REVIEWS */}
                    {activeTab === "reviews" && (
                        <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-[1fr_2fr] gap-8">
                            
                            <div className="space-y-6">
                                <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)]">
                                    <h3 className="font-display text-2xl text-[var(--color-heading)] font-bold tracking-tight mb-4">{t("profile.write_review")}</h3>
                                    <form onSubmit={submitReview} className="space-y-5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-2">Tap to rate</p>
                                            <div className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-border)] inline-block">
                                                <StarRating value={myRating} onChange={setMyRating} readonly={false} size="text-3xl drop-shadow-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-2">Your Experience</p>
                                            <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)}
                                                placeholder={lang === "hi" ? "अपना अनुभव लिखें..." : "Share details of your experience..."}
                                                rows={4} maxLength={500} className="input-field resize-none shadow-inner bg-[var(--color-bg)]" />
                                        </div>
                                        <button type="submit" disabled={submitting || myRating === 0} className="btn-primary w-full shadow-glow">
                                            {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("app.submit")}
                                        </button>
                                    </form>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                            {reviews.map((r, i) => (
                                <motion.div key={r.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-cyan-500 flex items-center justify-center text-white text-lg font-black shadow-md">
                                        {(r.reviewer_name || "U")[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-[var(--color-heading)]">{r.reviewer_name}</p>
                                        <StarRating value={r.rating} readonly size="text-sm mt-1 block" />
                                    </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                                </div>
                                {r.comment && <p className="text-sm text-[var(--color-body)] mt-4 leading-relaxed bg-[var(--color-bg)]/50 p-4 rounded-xl border border-[var(--color-border)]">{r.comment}</p>}
                                </motion.div>
                            ))}

                            {reviews.length === 0 && (
                                <div className="py-16 text-center glass-card border-dashed bg-transparent">
                                    <Icon name="review" className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3 opacity-50" />
                                    <h4 className="font-bold text-[var(--color-heading)]">No reviews yet</h4>
                                    <p className="text-[var(--color-muted)] text-sm">Be the first to share your experience with this contractor.</p>
                                </div>
                            )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </motion.div>
      </div>
    </div>
  );
}
