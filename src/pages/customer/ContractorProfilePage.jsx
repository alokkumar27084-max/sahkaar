import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiCreditCard,
  FiImage,
  FiMapPin,
  FiMessageCircle,
  FiShare2,
  FiShield,
  FiUsers,
  FiStar,
  FiGlobe
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI, reviewAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { getImageUrl, getAvatarUrl, getSafeImageUrl } from "../../utils/imageUtils";
import StarRating from "../../components/common/StarRating";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SEOHead from "../../components/common/SEOHead";

const tabItems = [
  { id: "about", label: "About" },
  { id: "portfolio", label: "Portfolio" },
  { id: "reviews", label: "Reviews" },
];

function formatCategory(value) {
  return String(value || "general service").replace(/_/g, " ");
}

export default function ContractorProfilePage() {
  const { id } = useParams();
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
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // Crew quantity selection for Labour Chowk
  const [selectedWorkers, setSelectedWorkers] = useState({});

  useEffect(() => {
    if (contractor?.labour_crew) {
      const init = {};
      contractor.labour_crew.forEach((c) => {
        init[c.role] = c.count || 0;
      });
      setSelectedWorkers(init);
    }
  }, [contractor]);

  const totalDailyCost = Object.entries(selectedWorkers).reduce((acc, [role, qty]) => {
    const crewItem = contractor?.labour_crew?.find((c) => c.role === role);
    return acc + (qty * (crewItem?.rate || 0));
  }, 0);

  const portfolioItems = contractor?.portfolio_items || [];
  const portfolioPhotos = contractor?.portfolio_photos || contractor?.portfolio_urls || [];
  
  const allPhotos = useMemo(() => {
    if (portfolioItems.length > 0) {
      return portfolioItems.map(item => ({
        url: getImageUrl(item.image_url),
        title: item.title || "Work Snapshot",
        description: item.description || ""
      }));
    }
    return portfolioPhotos.map((url, i) => ({
      url: getImageUrl(url),
      title: `Project Photo ${i + 1}`,
      description: ""
    }));
  }, [portfolioItems, portfolioPhotos]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const cRes = await contractorAPI.getById(id);
        if (!active) return;
        setContractor(cRes.data.contractor);
        trackEvent("profile_view", { contractor_id: id });
        try {
          const rRes = await reviewAPI.getForContractor(id);
          if (active) setReviews(rRes.data.reviews || []);
        } catch {
          if (active) setReviews([]);
        }
      } catch {
        toast.error("Could not load contractor profile.");
        navigate("/search");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, navigate]);

  async function submitReview(event) {
    event.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!myRating) {
      toast.error("Please choose a rating.");
      return;
    }
    setSubmitting(true);
    try {
      await reviewAPI.submit(id, { rating: myRating, comment: myComment.trim() });
      toast.success("Review submitted.");
      setMyRating(0);
      setMyComment("");
      const res = await reviewAPI.getForContractor(id);
      setReviews(res.data.reviews || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!reportReason.trim()) {
      toast.error("Add a short reason for the report.");
      return;
    }
    setReporting(true);
    try {
      await contractorAPI.report(id, reportReason.trim());
      toast.success("Report submitted for admin review.");
      setReportReason("");
      setShowReportBox(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit report.");
    } finally {
      setReporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] pt-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!contractor) return null;

  const name = contractor.name || contractor.business_name || contractor.user_name || "Contractor";
  const category = contractor.category || contractor.categories?.[0] || "general";
  const heroImage = portfolioItems[0]?.image_url || portfolioPhotos[0] || contractor.photo_url;
  const rating = Number(contractor.rating || 0);
  const reviewCount = contractor.review_count ?? contractor.reviews_count ?? reviews.length;
  const services = contractor.services || [];

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: name,
    description: contractor.description || `${name} is a verified contractor on Thekedaar.`,
    image: contractor.photo_url ? getImageUrl(contractor.photo_url) : undefined,
    aggregateRating: rating > 0 ? { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount: reviewCount } : undefined,
    address: { "@type": "PostalAddress", addressLocality: contractor.location_text || "India", addressCountry: "IN" },
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-28 lg:pb-16 pt-16">
      <SEOHead
        title={`${name} — ${String(category).replace(/_/g, " ")} Contractor in ${contractor.location_text || "India"}`}
        description={contractor.description ? contractor.description.slice(0, 155) : `${name} is a verified ${String(category).replace(/_/g, " ")} contractor on Thekedaar. ★ ${rating.toFixed(1)} · ${reviewCount} reviews.`}
        ogImage={contractor.photo_url ? getImageUrl(contractor.photo_url) : undefined}
        canonical={`https://thekedaar.com/contractor/${id}`}
        structuredData={businessSchema}
      />

      {/* 1. Profile Header / Cover Section */}
      <section className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] py-10">
        <div className="max-w-[var(--max-width)] mx-auto px-4 md:px-8">
          
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-bold text-[var(--color-heading)] flex items-center gap-1.5 hover:bg-[var(--color-bg-elevated)] transition-colors shadow-sm"
          >
            <FiArrowLeft size={16} /> 
            <span>Back</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            
            {/* Left Column: Avatar + Name + Tags */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              <img
                src={getAvatarUrl(contractor.photo_url)}
                alt={name}
                className="h-28 w-28 rounded-2xl border-4 border-[var(--color-surface)] object-cover shadow-md shrink-0 bg-[var(--color-bg-elevated)]"
                onError={(event) => {
                  event.target.onerror = null;
                  event.target.src = getAvatarUrl("");
                }}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                  {contractor.is_verified && <Badge type="verified" />}
                  {contractor.is_featured && <Badge type="featured" />}
                  {contractor.is_labour_group && <Badge type="labour_group" />}
                  {contractor.is_responsibility_model && <Badge type="responsibility" />}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-heading)] tracking-tight">
                  {name}
                </h1>

                <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm font-semibold text-[var(--color-body)]">
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-primary)]">
                    <FiBriefcase size={14} /> 
                    <span>{formatCategory(category)}</span>
                  </span>
                  {contractor.location_text && (
                    <span className="inline-flex items-center gap-1.5 text-[var(--color-muted)]">
                      <FiMapPin size={14} /> 
                      <span>{contractor.location_text}</span>
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 ${contractor.is_available ? "text-emerald-600" : "text-amber-600"}`}>
                    <span className={`h-2 w-2 rounded-full ${contractor.is_available ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span>{contractor.is_available ? "Available" : "Limited Availability"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: CTA Quick Box */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm max-w-sm w-full lg:w-80 shrink-0 self-center lg:self-auto">
              <button
                type="button"
                onClick={() => navigate(`/checkout/${id}`, { state: { contractor } })}
                className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-2 mb-2.5 transition-colors"
              >
                <FiCreditCard size={15} /> 
                <span>Book Contractor</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try { await contractorAPI.recordLead(id); } catch { /* ignore */ }
                  trackEvent("in_app_message_tap", { contractor_id: id, source: "profile" });
                  navigate("/chat", { state: { initChatWith: id } });
                }}
                className="w-full h-11 border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 mb-3 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors"
              >
                <FiMessageCircle size={15} /> 
                <span>Chat Now</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigator.share?.({ title: name, url: window.location.href })}
                  className="h-9 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] text-xs font-bold text-[var(--color-heading)] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FiShare2 size={13} /> 
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => (user ? setShowReportBox((prev) => !prev) : navigate("/login"))}
                  className="h-9 rounded-lg border border-rose-200 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FiAlertTriangle size={13} /> 
                  <span>Report</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Main Page Grid */}
      <div className="max-w-[var(--max-width)] mx-auto px-4 md:px-8 py-10">
        
        {/* Report form dropdown */}
        <AnimatePresence>
          {showReportBox && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={submitReport}
              className="mb-8 rounded-2xl border border-rose-200 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/10 p-5 flex flex-col sm:flex-row gap-3"
            >
              <input
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-heading)] focus:outline-none focus:border-rose-500 transition-colors flex-1"
                placeholder="Reason for reporting this contractor profile..."
                maxLength={140}
              />
              <button
                type="submit"
                disabled={reporting}
                className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shrink-0 transition-colors"
              >
                {reporting ? "Reporting..." : "Submit Report"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Highlight Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm text-center">
            <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-1">Rating</span>
            <span className="text-2xl font-bold text-[var(--color-heading)] block">{rating.toFixed(1)}</span>
            <span className="text-xs text-[var(--color-muted)] font-medium mt-0.5 block">{reviewCount} reviews</span>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm text-center">
            <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-1">Starting Rate</span>
            <span className="text-2xl font-bold text-[var(--color-heading)] block">
              {contractor.daily_rate ? `₹${Number(contractor.daily_rate).toLocaleString("en-IN")}` : "Custom"}
            </span>
            <span className="text-xs text-[var(--color-muted)] font-medium mt-0.5 block">per day / job</span>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm text-center">
            <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-1">Experience</span>
            <span className="text-2xl font-bold text-[var(--color-heading)] block">
              {contractor.experience_years ? `${contractor.experience_years} yrs` : "New"}
            </span>
            <span className="text-xs text-[var(--color-muted)] font-medium mt-0.5 block">field experience</span>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm text-center">
            <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-1">Work Crew</span>
            <span className="text-2xl font-bold text-[var(--color-heading)] block">
              {contractor.is_labour_group ? `${contractor.team_size || 1} workers` : "Solo"}
            </span>
            <span className="text-xs text-[var(--color-muted)] font-medium mt-0.5 block">organization type</span>
          </div>
        </section>

        {/* Bottom Split layout */}
        <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
          
          {/* Main content pane */}
          <div>
            {/* Tabs */}
            <div className="mb-6 flex gap-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-1 w-full max-w-md">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm border border-[var(--color-border)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                  }`}
                >
                  {tab.id === "reviews" ? `${tab.label} (${reviewCount})` : tab.label}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <AnimatePresence mode="wait">
              
              {/* ABOUT TAB */}
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 md:p-8"
                >
                  <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4">About this professional</h2>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm text-[var(--color-body)] mb-6">
                    {contractor.description || "This contractor has not added a detailed description yet."}
                  </p>

                  {services.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Services Offered</h3>
                      <div className="flex flex-wrap gap-2">
                        {services.map((service) => (
                          <span
                            key={service}
                            className="rounded-full bg-indigo-50 dark:bg-indigo-950/20 px-3.5 py-1.5 text-xs font-bold capitalize text-[var(--color-primary)] border border-indigo-100 dark:border-indigo-950"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily wage Crew Composer (Labour Chowk) */}
                  {contractor.is_labour_group && contractor.labour_crew && contractor.labour_crew.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-[var(--color-border)] space-y-6">
                      <div>
                        <span className="block text-sm font-bold text-[var(--color-heading)]">Labour Crew Composer</span>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">Customize the workforce crew size and categories you wish to hire from this provider group.</p>
                      </div>

                      <div className="space-y-4">
                        {contractor.labour_crew.map((crew) => (
                          <div
                            key={crew.role}
                            className="flex items-center justify-between bg-[var(--color-bg-elevated)] p-4 rounded-xl border border-[var(--color-border)]"
                          >
                            <div className="min-w-0">
                              <span className="block text-sm font-bold text-[var(--color-heading)] capitalize truncate">{crew.role}</span>
                              <span className="block text-xs text-[var(--color-muted)] mt-0.5">₹{crew.rate}/day per worker (Max {crew.count} available)</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWorkers(prev => ({
                                    ...prev,
                                    [crew.role]: Math.max(0, (prev[crew.role] || 0) - 1)
                                  }));
                                }}
                                className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-heading)] font-black flex items-center justify-center transition-all text-base"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-[var(--color-heading)]">
                                {selectedWorkers[crew.role] ?? 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWorkers(prev => ({
                                    ...prev,
                                    [crew.role]: Math.min(crew.count, (prev[crew.role] || 0) + 1)
                                  }));
                                }}
                                className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-heading)] font-black flex items-center justify-center transition-all text-base"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Estimated Daily Crew Rate</span>
                          <span className="block text-2xl font-bold text-[var(--color-heading)] mt-0.5">₹{totalDailyCost.toLocaleString("en-IN")}</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (totalDailyCost === 0) {
                              toast.error("Please select at least 1 worker to hire.");
                              return;
                            }
                            navigate(`/checkout/${id}`, {
                              state: {
                                contractor: {
                                  ...contractor,
                                  daily_rate: totalDailyCost, 
                                  selected_crew: selectedWorkers
                                }
                              }
                            });
                          }}
                          className="h-11 px-6 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center"
                        >
                          Book Selected Crew
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

              {/* PORTFOLIO TAB */}
              {activeTab === "portfolio" && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {portfolioItems.length > 0 || portfolioPhotos.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {portfolioItems.map((item, index) => (
                        <div
                          key={item.id}
                          onClick={() => setActivePhotoIndex(index)}
                          className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm group hover:shadow-md cursor-pointer transition-shadow"
                        >
                          <img
                            src={getSafeImageUrl(item.image_url)}
                            alt={item.title || "Work snapshot"}
                            className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-103"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getSafeImageUrl("");
                            }}
                          />
                          {(item.title || item.description) && (
                            <div className="p-4 border-t border-[var(--color-border)]">
                              {item.title && <p className="font-bold text-sm text-[var(--color-heading)]">{item.title}</p>}
                              {item.description && <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">{item.description}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                      {portfolioItems.length === 0 &&
                        portfolioPhotos.map((url, index) => (
                          <div
                            key={url || index}
                            onClick={() => setActivePhotoIndex(index)}
                            className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <img
                              src={getSafeImageUrl(url)}
                              alt={`Portfolio project ${index + 1}`}
                              className="h-52 w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getSafeImageUrl("");
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
                      <FiImage className="mx-auto mb-4 text-3xl text-[var(--color-muted)]" />
                      <p className="font-bold text-[var(--color-heading)]">No portfolio uploads yet</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)] max-w-xs mx-auto">This contractor has not uploaded recent portfolio photos yet.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 lg:grid-cols-[280px_1fr]"
                >
                  {/* Write a review box */}
                  <form onSubmit={submitReview} className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                    <p className="font-bold text-base text-[var(--color-heading)]">Write a review</p>
                    <div className="mt-3.5">
                      <StarRating value={myRating} onChange={setMyRating} readonly={false} size="text-2xl" />
                    </div>
                    <textarea
                      value={myComment}
                      onChange={(event) => setMyComment(event.target.value)}
                      className="w-full min-h-[100px] mt-4 p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-y"
                      placeholder="Share details of your experience with this contractor..."
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={submitting || !myRating}
                      className="w-full h-10 mt-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-colors shadow-sm"
                    >
                      {submitting ? <LoadingSpinner size="sm" /> : "Submit Review"}
                    </button>
                  </form>

                  {/* Reviews list */}
                  <div className="space-y-4">
                    {reviews.length ? (
                      reviews.map((review) => (
                        <div key={review.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-[var(--color-heading)]">
                                  {review.reviewer_name || "Verified Client"}
                                </p>
                                {review.is_verified && (
                                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950 px-2 py-0.5 rounded-lg shrink-0">
                                    <FiCheckCircle size={10} /> 
                                    <span>Verified</span>
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex gap-0.5">
                                <StarRating value={Number(review.rating || 0)} readonly size="text-xs" />
                              </div>
                            </div>
                            {review.created_at && (
                              <span className="text-[10px] font-semibold text-[var(--color-muted)]">
                                {new Date(review.created_at).toLocaleDateString("en-IN")}
                              </span>
                            )}
                          </div>
                          {review.comment && (
                            <p className="mt-3.5 text-xs md:text-sm leading-relaxed text-[var(--color-body)]">
                              "{review.comment}"
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
                        <p className="font-bold text-[var(--color-heading)]">No reviews yet</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">This contractor is ready for their first review.</p>
                      </div>
                    )}
                  </div>

                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right sidebar details */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 p-5">
              <p className="mb-2 flex items-center gap-2 font-bold text-sm text-[var(--color-heading)]">
                <FiShield className="text-emerald-600" /> 
                <span>Milestone protection</span>
              </p>
              <p className="text-xs leading-relaxed text-[var(--color-body)]">
                Payments are held securely in a milestone-based escrow account. Funds are only disbursed once you sign off on completed work segments.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <p className="mb-3 font-bold text-sm text-[var(--color-heading)]">Profile signals</p>
              <div className="space-y-3.5 text-xs text-[var(--color-body)]">
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="text-emerald-600 shrink-0" size={15} /> 
                  <span>Official business KYC verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-cyan-600 shrink-0" size={15} /> 
                  <span>Active coverage area configured</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiUsers className="text-indigo-600 shrink-0" size={15} /> 
                  <span>{contractor.is_labour_group ? "Organized Labor Squad leader" : "Verified Independent Partner"}</span>
                </div>
              </div>
            </div>
          </aside>

        </section>

      </div>

      {/* Mobile Sticky Booking CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-lg lg:hidden flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-[var(--color-heading)]">
              {contractor.daily_rate ? `₹${Number(contractor.daily_rate).toLocaleString("en-IN")}` : "Custom Price"}
            </span>
            {contractor.daily_rate && <span className="text-[10px] text-[var(--color-muted)] font-bold">/ day</span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <FiStar className="text-amber-500 fill-amber-500" size={11} />
            <span className="text-xs font-bold text-[var(--color-heading)]">{rating.toFixed(1)}</span>
            <span className="text-[10px] text-[var(--color-muted)] font-semibold">({reviewCount})</span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => navigate(`/checkout/${id}`, { state: { contractor } })}
          className="btn-primary"
        >
          <FiCreditCard size={14} />
          <span>Book Now</span>
        </button>
      </div>

      {/* Lightbox Carousel Popup */}
      <AnimatePresence>
        {activePhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md"
            onClick={() => setActivePhotoIndex(null)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActivePhotoIndex(null)}
              className="absolute right-6 top-6 text-white hover:text-gray-300 transition-colors p-2 text-3xl font-light z-50"
            >
              ✕
            </button>

            {/* Carousel Wrapper */}
            <div className="relative max-w-4xl w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
              {/* Prev Button */}
              {allPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                  className="absolute left-2 md:left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-xl font-bold"
                >
                  ‹
                </button>
              )}

              {/* Active Image */}
              <div className="flex flex-col items-center max-h-[85vh] px-12">
                <motion.img
                  key={activePhotoIndex}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  src={allPhotos[activePhotoIndex]?.url}
                  alt={allPhotos[activePhotoIndex]?.title || "Work"}
                  className="max-h-[65vh] object-contain rounded-lg shadow-2xl border border-white/10"
                />
                
                {/* Caption */}
                <div className="mt-4 text-center text-white max-w-lg">
                  <h4 className="text-lg font-bold">{allPhotos[activePhotoIndex]?.title}</h4>
                  {allPhotos[activePhotoIndex]?.description && (
                    <p className="mt-1.5 text-xs text-gray-300 font-medium leading-relaxed">{allPhotos[activePhotoIndex]?.description}</p>
                  )}
                </div>
              </div>

              {/* Next Button */}
              {allPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex(prev => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 md:right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-xl font-bold"
                >
                  ›
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
