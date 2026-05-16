import React, { useEffect, useState } from "react";
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
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI, reviewAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { getImageUrl } from "../../utils/imageUtils";
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

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--color-heading)]">{value}</p>
      {sub && <p className="mt-1 text-xs font-semibold text-[var(--color-primary)]">{sub}</p>}
    </div>
  );
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
  const portfolioItems = contractor.portfolio_items || [];
  const portfolioPhotos = contractor.portfolio_photos || contractor.portfolio_urls || [];
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
    <main className="min-h-screen bg-[var(--color-bg)] pb-16 pt-20">
      <SEOHead
        title={`${name} — ${String(category).replace(/_/g, " ")} Contractor in ${contractor.location_text || "India"}`}
        description={contractor.description ? contractor.description.slice(0, 155) : `${name} is a verified ${String(category).replace(/_/g, " ")} contractor on Thekedaar. ★ ${rating.toFixed(1)} · ${reviewCount} reviews.`}
        ogImage={contractor.photo_url ? getImageUrl(contractor.photo_url) : undefined}
        canonical={`https://thekedaar.com/contractor/${id}`}
        structuredData={businessSchema}
      />
      <section className="relative border-b border-[var(--color-border)]">
        <div className="absolute inset-0 overflow-hidden">
          {heroImage ? (
            <img src={getImageUrl(heroImage)} alt="" className="h-full w-full object-cover opacity-25" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 opacity-95" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-[var(--color-bg)]/20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-4 py-2 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-black/35"
          >
            <FiArrowLeft /> Back
          </button>

          <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
            <div className="flex flex-col gap-6 md:flex-row md:items-end">
              <img
                src={getImageUrl(contractor.photo_url)}
                alt={name}
                className="h-32 w-32 rounded-2xl border-4 border-[var(--color-surface)] object-cover shadow-xl"
                onError={(event) => {
                  event.currentTarget.src = "/default-contractor.png";
                }}
              />
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {contractor.is_verified && <Badge type="verified" />}
                  {contractor.is_featured && <Badge type="featured" />}
                  {contractor.is_labour_group && <Badge type="labour_group" />}
                  {contractor.is_responsibility_model && <Badge type="responsibility" />}
                </div>
                <h1 className="font-display text-4xl font-black tracking-tight text-[var(--color-heading)] md:text-6xl">
                  {name}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-[var(--color-body)]">
                  <span className="inline-flex items-center gap-2 text-[var(--color-primary)]">
                    <FiBriefcase /> {formatCategory(category)}
                  </span>
                  {contractor.location_text && (
                    <span className="inline-flex items-center gap-2">
                      <FiMapPin /> {contractor.location_text}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-2 ${contractor.is_available ? "text-emerald-600" : "text-amber-600"}`}>
                    <span className={`h-2 w-2 rounded-full ${contractor.is_available ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {contractor.is_available ? "Available" : "Limited availability"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
              <button
                type="button"
                onClick={() => navigate(`/checkout/${id}`, { state: { contractor } })}
                className="btn-primary mb-3 h-13 w-full justify-center"
              >
                <FiCreditCard /> Book with escrow
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await contractorAPI.recordLead(id);
                  } catch {
                    // no-op
                  }
                  trackEvent("in_app_message_tap", { contractor_id: id, source: "profile" });
                  navigate("/chat", { state: { initChatWith: id } });
                }}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-bold text-white transition-colors hover:bg-emerald-700"
              >
                <FiMessageCircle /> Message contractor
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigator.share?.({ title: name, url: window.location.href })}
                  className="btn-secondary justify-center"
                >
                  <FiShare2 /> Share
                </button>
                <button
                  type="button"
                  onClick={() => (user ? setShowReportBox((prev) => !prev) : navigate("/login"))}
                  className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-500/10"
                >
                  <FiAlertTriangle /> Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <AnimatePresence>
          {showReportBox && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={submitReport}
              className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5"
            >
              <p className="mb-3 font-bold text-rose-700">Report this profile</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  className="input-field flex-1"
                  placeholder="Reason for report"
                  maxLength={140}
                />
                <button type="submit" disabled={reporting} className="rounded-xl bg-rose-600 px-5 py-3 font-bold text-white">
                  {reporting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <section className="grid gap-4 md:grid-cols-4">
          <Stat label="Rating" value={rating.toFixed(1)} sub={`${reviewCount} reviews`} />
          <Stat label="Starting rate" value={contractor.daily_rate ? `Rs ${Number(contractor.daily_rate).toLocaleString("en-IN")}` : "Ask"} sub="per day/job" />
          <Stat label="Experience" value={contractor.experience_years ? `${contractor.experience_years}` : "New"} sub="years" />
          <Stat label="Team" value={contractor.is_labour_group ? contractor.team_size || 1 : "Solo"} sub={contractor.is_labour_group ? "workers" : "professional"} />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-5 flex gap-2 overflow-x-auto rounded-2xl bg-[var(--color-border)] p-1.5">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-xl px-5 py-3 text-sm font-black transition-colors ${
                    activeTab === tab.id ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-[var(--color-muted)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  {tab.id === "reviews" ? `${tab.label} (${reviewCount})` : tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "about" && (
                <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
                  <h2 className="font-display text-2xl font-black text-[var(--color-heading)]">About this contractor</h2>
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed text-[var(--color-body)]">
                    {contractor.description || "This contractor has not added a detailed description yet."}
                  </p>
                  {services.length > 0 && (
                    <div className="mt-6">
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Services offered</p>
                      <div className="flex flex-wrap gap-2">
                        {services.map((service) => (
                          <span key={service} className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-bold capitalize text-[var(--color-primary)]">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "portfolio" && (
                <motion.div key="portfolio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {portfolioItems.length > 0 || portfolioPhotos.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {portfolioItems.map((item) => (
                        <div key={item.id} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                          <img src={getImageUrl(item.image_url)} alt={item.title || "Work photo"} className="h-56 w-full object-cover" />
                          {(item.title || item.description) && (
                            <div className="p-4">
                              {item.title && <p className="font-bold text-[var(--color-heading)]">{item.title}</p>}
                              {item.description && <p className="mt-1 text-sm text-[var(--color-muted)]">{item.description}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                      {portfolioItems.length === 0 &&
                        portfolioPhotos.map((url, index) => (
                          <img key={url || index} src={getImageUrl(url)} alt={`Work ${index + 1}`} className="h-56 w-full rounded-2xl border border-[var(--color-border)] object-cover" />
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
                      <FiImage className="mx-auto mb-3 text-3xl text-[var(--color-muted)]" />
                      <p className="font-bold text-[var(--color-heading)]">No work photos yet</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">Ask the contractor for recent work photos before booking.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-6 lg:grid-cols-[320px_1fr]">
                  <form onSubmit={submitReview} className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                    <p className="font-display text-xl font-black text-[var(--color-heading)]">Write a review</p>
                    <div className="mt-4">
                      <StarRating value={myRating} onChange={setMyRating} readonly={false} size="text-3xl" />
                    </div>
                    <textarea
                      value={myComment}
                      onChange={(event) => setMyComment(event.target.value)}
                      className="input-field mt-4 min-h-[110px] resize-y"
                      placeholder="Share your experience"
                      maxLength={500}
                    />
                    <button type="submit" disabled={submitting || !myRating} className="btn-primary mt-4 w-full justify-center">
                      {submitting ? <LoadingSpinner size="sm" /> : "Submit review"}
                    </button>
                  </form>

                  <div className="space-y-4">
                    {reviews.length ? (
                      reviews.map((review) => (
                        <div key={review.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-[var(--color-heading)]">{review.reviewer_name || "Customer"}</p>
                                {review.is_verified && (
                                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    <FiCheckCircle size={10} /> Verified Project
                                  </span>
                                )}
                              </div>
                              <div className="mt-1">
                                <StarRating value={Number(review.rating || 0)} readonly size="text-sm" />
                              </div>
                            </div>
                            {review.created_at && <span className="text-xs font-semibold text-[var(--color-muted)]">{new Date(review.created_at).toLocaleDateString("en-IN")}</span>}
                          </div>
                          {review.comment && <p className="mt-4 text-sm leading-relaxed text-[var(--color-body)]">{review.comment}</p>}
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

          <aside className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
              <p className="mb-2 flex items-center gap-2 font-bold text-[var(--color-heading)]">
                <FiShield className="text-emerald-600" /> Booking protection
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-body)]">
                Book through Thekedaar to use escrow payment, booking history, chat, and dispute support.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="mb-3 font-bold text-[var(--color-heading)]">Profile signals</p>
              <div className="space-y-3 text-sm text-[var(--color-body)]">
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="text-emerald-600" /> Identity details submitted
                </div>
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-cyan-600" /> Location enabled for nearby discovery
                </div>
                <div className="flex items-center gap-3">
                  <FiUsers className="text-indigo-600" /> {contractor.is_labour_group ? "Team contractor" : "Individual or business"}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
