import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import { FiArrowLeft, FiShare2, FiMessageCircle, FiMapPin, FiBriefcase } from "react-icons/fi";

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
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="max-w-5xl mx-auto px-4 pb-14 md:px-6">
      {/* Hero banner */}
      <motion.section initial="hidden" animate="show" variants={fadeUp} className="glass-card mt-4 overflow-hidden p-0">
        <div className="relative h-52 md:h-64">
          {portfolio_photos[0] ? (
            <img src={getImageUrl(portfolio_photos[0])} alt="work" className="w-full h-full object-cover opacity-70" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)]/30 via-[var(--color-accent)]/20 to-[var(--color-bg)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/20 to-transparent" />
          <button onClick={() => navigate(-1)}
            className="absolute top-4 left-4 h-9 px-4 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur text-[var(--color-body)] text-sm font-medium flex items-center gap-1.5 hover:bg-[var(--color-surface)] transition-colors border border-[var(--color-border)]">
            <FiArrowLeft size={14} /> {t("app.back")}
          </button>
        </div>

        {/* Profile info */}
        <div className="px-5 md:px-8 pb-6 -mt-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-5">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] opacity-60 blur-sm" />
              <img src={getImageUrl(photo_url)} alt={name}
                className="relative w-24 h-24 rounded-2xl object-cover border-3 border-[var(--color-surface)]" />
            </div>

            <div className="flex-1">
              <h1 className="font-display text-2xl md:text-3xl text-[var(--color-heading)] font-extrabold uppercase tracking-tight">{name}</h1>
              <p className="text-[var(--color-muted)] text-sm capitalize mt-0.5">{category?.replace("_", " ")}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <StarRating value={Math.round(rating)} readonly size="text-base" />
                <span className="text-xs text-[var(--color-muted)] font-medium">{rating.toFixed(1)} ({review_count})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {is_verified && <Badge type="verified" lang={lang} />}
                {is_featured && <Badge type="featured" lang={lang} />}
                {is_labour_group && <Badge type="labour_group" lang={lang} />}
                {is_responsibility_model && <Badge type="responsibility" lang={lang} />}
                {tier && tier !== 'standard' && <Badge type={`tier_${tier}`} lang={lang} />}
              </div>
            </div>

            <div className="flex items-center gap-2 md:self-start md:pt-14">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${is_available
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                }`}>
                {is_available ? t("profile.available") : t("profile.unavailable")}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              { label: t("profile.rate"), value: daily_rate ? `₹${daily_rate.toLocaleString("en-IN")}${t("profile.per_day")}` : "—" },
              { label: t("profile.experience"), value: experience_years ? `${experience_years} ${t("profile.years")}` : "—" },
              { label: t("profile.team_size"), value: is_labour_group ? `${team_size || 0} ${t("profile.workers")}` : "—" },
              { label: lang === "hi" ? "रेटिंग" : "Rating", value: rating.toFixed(1) },
            ].map((s) => (
              <div key={s.label} className="glass-card p-3.5 text-center rounded-xl">
                <p className="text-xs text-[var(--color-muted)] font-medium">{s.label}</p>
                <p className="text-base text-[var(--color-heading)] font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {location_text && (
            <p className="text-xs text-[var(--color-muted)] mt-4 inline-flex items-center gap-1.5">
              <FiMapPin className="w-3.5 h-3.5" /> {location_text}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => navigate(`/checkout/${id}`, { state: { contractor } })}
              className="btn-primary w-full sm:w-auto"
            >
              <FiBriefcase size={16} /> {lang === "hi" ? "अभी बुक करें" : "Book Now"}
            </button>
            <button
              onClick={() => navigate("/chat", { state: { initChatWith: id } })}
              className="btn-secondary w-full sm:w-auto"
            >
              <FiMessageCircle size={16} /> {lang === "hi" ? "इन-ऐप चैट" : "Message in App"}
            </button>
            <a href={WHATSAPP_URL(phone, name)} target="_blank" rel="noopener noreferrer"
              className="btn-outline-cyan w-full sm:w-auto text-center"
              onClick={async () => { try { await contractorAPI.recordLead(id); } catch { } trackEvent("whatsapp_tap", { contractor_id: id, source: "profile" }); }}>
              <FiMessageCircle size={16} /> {t("profile.contact_whatsapp")}
            </a>
            <button onClick={() => { if (navigator.share) navigator.share({ title: name, url: window.location.href }); }}
              className="btn-secondary flex items-center gap-2">
              <FiShare2 size={16} /> {t("profile.share")}
            </button>
            <button
              onClick={() => {
                if (!user) { navigate("/login"); return; }
                setShowReportBox((prev) => !prev);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              {lang === "hi" ? "रिपोर्ट करें" : "Report"}
            </button>
          </div>

          {showReportBox && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
              <h3 className="font-semibold text-red-700 dark:text-red-300">
                {lang === "hi" ? "इस प्रोफाइल को रिपोर्ट करें" : "Report this profile"}
              </h3>
              <p className="mt-1 text-sm text-red-600/90 dark:text-red-300/80">
                {lang === "hi"
                  ? "यदि आपको इस प्रोफाइल, व्यवहार, या काम की गुणवत्ता को लेकर चिंता है, तो हमें बताएं।"
                  : "If you have concerns about this profile, behaviour, or work quality, let us know."}
              </p>
              <form onSubmit={submitReport} className="mt-3 space-y-3">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="input-field resize-none"
                  placeholder={lang === "hi" ? "रिपोर्ट का कारण लिखें..." : "Describe the issue..."}
                />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={reporting} className="btn-primary">
                    {reporting ? (lang === "hi" ? "भेजा जा रहा है..." : "Submitting...") : (lang === "hi" ? "रिपोर्ट भेजें" : "Submit Report")}
                  </button>
                  <button type="button" onClick={() => setShowReportBox(false)} className="btn-secondary">
                    {lang === "hi" ? "रद्द करें" : "Cancel"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-6 p-1 bg-[var(--color-border)] rounded-xl">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-[var(--color-muted)] hover:text-[var(--color-body)]"
                  }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "about" && (
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              {description && (
                <div className="glass-card p-5">
                  <h3 className="font-display text-[var(--color-heading)] font-semibold mb-2">{t("profile.about")}</h3>
                  <p className="text-sm text-[var(--color-body)] leading-relaxed">{description}</p>
                </div>
              )}
              {services.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="font-display text-[var(--color-heading)] font-semibold mb-3">{t("profile.services")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s, i) => (
                      <span key={i} className="pill-chip">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="mt-5 space-y-6">
              {portfolio_items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio_items.map((item) => (
                    <div key={item.id} className="glass-card p-3 rounded-2xl flex flex-col hover:border-[var(--color-primary)]/50 transition-colors bg-[var(--color-surface)] shadow-sm">
                      <img src={getImageUrl(item.image_url)} alt={item.title || "Portfolio"}
                        className="w-full h-40 object-cover rounded-xl" loading="lazy" />
                      {(item.title || item.description) && (
                        <div className="mt-3 px-1 pb-1">
                          {item.title && <h4 className="font-semibold text-[var(--color-heading)] text-sm">{item.title}</h4>}
                          {item.description && <p className="text-xs text-[var(--color-muted)] mt-1 line-clamp-2">{item.description}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {portfolio_items.length === 0 && portfolio_photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {portfolio_photos.map((url, i) => (
                    <img key={i} src={getImageUrl(url)} alt={`Work ${i + 1}`}
                      className="w-full h-36 md:h-44 object-cover rounded-xl border border-[var(--color-border)] shadow-sm" loading="lazy" />
                  ))}
                </div>
              )}

              {portfolio_items.length === 0 && portfolio_photos.length === 0 && (
                <div className="py-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center">
                  <span className="w-12 h-12 rounded-full bg-[var(--color-bg)] flex items-center justify-center mb-3">
                    <Icon name="image" className="w-5 h-5 text-[var(--color-muted)]" />
                  </span>
                  <p className="text-center text-[var(--color-muted)] font-medium text-sm">
                    {lang === "hi" ? "अभी कोई पोर्टफोलियो उपलब्ध नहीं है" : "No portfolio items yet"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="mt-5 space-y-4">
              <div className="glass-card p-5">
                <h3 className="font-display text-[var(--color-heading)] font-semibold mb-3">{t("profile.write_review")}</h3>
                <form onSubmit={submitReview} className="space-y-3">
                  <StarRating value={myRating} onChange={setMyRating} readonly={false} size="text-3xl" />
                  <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)}
                    placeholder={lang === "hi" ? "अपना अनुभव लिखें..." : "Write your experience..."}
                    rows={3} maxLength={500} className="input-field resize-none" />
                  <button type="submit" disabled={submitting || myRating === 0} className="btn-primary w-full btn-shimmer">
                    {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("app.submit")}
                  </button>
                </form>
              </div>

              {reviews.map((r) => (
                <div key={r.id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold">
                        {(r.reviewer_name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-heading)]">{r.reviewer_name}</p>
                        <StarRating value={r.rating} readonly size="text-xs" />
                      </div>
                    </div>
                    <span className="text-xs text-[var(--color-muted)]">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                  {r.comment && <p className="text-sm text-[var(--color-body)] mt-3 leading-relaxed">{r.comment}</p>}
                </div>
              ))}

              {reviews.length === 0 && (
                <p className="text-center text-[var(--color-muted)] text-sm py-4">{lang === "hi" ? "अभी कोई समीक्षा नहीं" : "No reviews yet — be the first!"}</p>
              )}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
