import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI, reviewAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { WHATSAPP_URL } from "../../utils/constants";
import StarRating from "../../components/common/StarRating";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Icon from "../../components/common/Icon";
import toast from "react-hot-toast";

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

  useEffect(() => {
    async function load() {
      try {
        const cRes = await contractorAPI.getById(id);
        setContractor(cRes.data.contractor);
        trackEvent("profile_view", { contractor_id: id });
        try {
          const rRes = await reviewAPI.getForContractor(id);
          setReviews(rRes.data.reviews || []);
        } catch {
          setReviews([]);
        }
      } catch {
        toast.error(t("app.error"));
        navigate("/search");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate, t]);

  async function submitReview(e) {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (myRating === 0) {
      toast.error(lang === "hi" ? "कृपया रेटिंग दें" : "Please give a rating");
      return;
    }

    setSubmitting(true);
    try {
      await reviewAPI.submit(id, { rating: myRating, comment: myComment });
      toast.success(lang === "hi" ? "समीक्षा सबमिट हो गई!" : "Review submitted!");
      setMyRating(0);
      setMyComment("");
      const res = await reviewAPI.getForContractor(id);
      setReviews(res.data.reviews || []);
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!contractor) {
    return null;
  }

  const name = contractor?.name || contractor?.business_name || contractor?.user_name || "Contractor";
  const category = contractor?.category || contractor?.categories?.[0] || "general";
  const photo_url = contractor?.photo_url;
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
  const services = contractor?.services || [];
  const location_text = contractor?.location_text;

  const tabs = [
    { id: "about", label: t("profile.about") },
    { id: "portfolio", label: t("profile.portfolio") },
    { id: "reviews", label: `${t("profile.reviews")} (${review_count})` },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pb-10 md:px-6">
      <section className="glass-card mt-4 overflow-hidden p-0">
        <div className="relative h-56 md:h-72 bg-slate-950/60">
          {portfolio_photos[0] ? (
            <img src={portfolio_photos[0]} alt="work" className="w-full h-full object-cover opacity-65" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-300/30 via-indigo-400/25 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 btn-secondary !py-2 !px-4">
            ← {t("app.back")}
          </button>
        </div>

        <div className="px-4 md:px-8 pb-7 -mt-14 relative z-10">
          <div className="surface-panel p-4 md:p-6 mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-5">
              <img
                src={photo_url || "/default-contractor.png"}
                alt={name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-white/30"
              />

              <div className="flex-1">
                <h1 className="font-['Space_Grotesk'] text-2xl md:text-3xl text-white font-semibold mb-1">{name}</h1>
                <p className="text-slate-300 text-sm capitalize">{category?.replace("_", " ")}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StarRating value={Math.round(rating)} readonly size="text-base" />
                  <span className="text-xs text-slate-300">{rating.toFixed(1)} ({review_count})</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {is_verified && <Badge type="verified" lang={lang} />}
                  {is_featured && <Badge type="featured" lang={lang} />}
                  {is_labour_group && <Badge type="labour_group" lang={lang} />}
                  {is_responsibility_model && <Badge type="responsibility" lang={lang} />}
                </div>
              </div>

              <div className="text-right">
                <p className={`text-sm font-semibold ${is_available ? "text-emerald-300" : "text-amber-300"}`}>
                  {is_available ? t("profile.available") : t("profile.unavailable")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t glass-divider">
              {[
                {
                  label: t("profile.rate"),
                  value: daily_rate ? `₹${daily_rate.toLocaleString("en-IN")}${t("profile.per_day")}` : "—",
                },
                {
                  label: t("profile.experience"),
                  value: experience_years ? `${experience_years} ${t("profile.years")}` : "—",
                },
                {
                  label: t("profile.team_size"),
                  value: is_labour_group ? `${team_size || 0} ${t("profile.workers")}` : "—",
                },
                {
                  label: lang === "hi" ? "रेटिंग" : "Rating",
                  value: rating.toFixed(1),
                },
              ].map((s) => (
                <div key={s.label} className="glass-card p-3 text-center rounded-xl">
                  <p className="text-xs text-slate-300">{s.label}</p>
                  <p className="text-sm md:text-base text-slate-100 font-semibold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {location_text && (
              <p className="text-xs text-slate-300 mt-4 inline-flex items-center gap-1.5">
                <Icon name="location" className="w-3.5 h-3.5" />
                {location_text}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <a
              href={WHATSAPP_URL(phone, name)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary !text-slate-900"
              onClick={async () => {
                try {
                  await contractorAPI.recordLead(id);
                } catch {
                  // no-op
                }
                trackEvent("whatsapp_tap", { contractor_id: id, source: "profile" });
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="message" className="w-4 h-4" />
                {t("profile.contact_whatsapp")}
              </span>
            </a>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: name, url: window.location.href });
                }
              }}
              className="btn-secondary"
            >
              {t("profile.share")}
            </button>
          </div>

          <div className="surface-panel p-2 rounded-2xl mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  activeTab === tab.id ? "bg-cyan-200 text-slate-950" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "about" && (
            <div className="grid md:grid-cols-2 gap-3 animate-fade-in">
              {description && (
                <div className="card">
                  <h3 className="font-semibold text-slate-100 mb-2">{t("profile.about")}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
                </div>
              )}
              {services.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-slate-100 mb-3">{t("profile.services")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s, i) => (
                      <span key={i} className="pill-chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="animate-fade-in">
              {portfolio_photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {portfolio_photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Work ${i + 1}`}
                      className="w-full h-36 md:h-44 object-cover rounded-xl border border-white/15"
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-300 text-sm py-8">{lang === "hi" ? "अभी कोई फोटो नहीं" : "No photos yet"}</p>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="animate-fade-in space-y-4">
              <div className="card">
                <h3 className="font-semibold text-slate-100 mb-3">{t("profile.write_review")}</h3>
                <form onSubmit={submitReview} className="space-y-3">
                  <StarRating value={myRating} onChange={setMyRating} readonly={false} size="text-3xl" />
                  <textarea
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    placeholder={lang === "hi" ? "अपना अनुभव लिखें..." : "Write your experience..."}
                    rows={3}
                    maxLength={500}
                    className="input-field resize-none"
                  />
                  <button type="submit" disabled={submitting || myRating === 0} className="btn-primary w-full !text-slate-900">
                    {submitting ? <LoadingSpinner size="sm" /> : t("app.submit")}
                  </button>
                </form>
              </div>

              {reviews.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{r.reviewer_name}</p>
                      <StarRating value={r.rating} readonly size="text-sm" />
                    </div>
                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-300 mt-2">{r.comment}</p>}
                </div>
              ))}

              {reviews.length === 0 && (
                <p className="text-center text-slate-300 text-sm py-3">
                  {lang === "hi" ? "अभी कोई समीक्षा नहीं" : "No reviews yet - be the first!"}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
