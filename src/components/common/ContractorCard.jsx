import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiBriefcase, FiCreditCard, FiMapPin, FiMessageCircle, FiShield, FiUsers, FiStar } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import StarRating from "./StarRating";
import Badge from "./Badge";
import { contractorAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { getImageUrl } from "../../utils/imageUtils";

export default function ContractorCard({ contractor, showCompare = false, isCompared = false, onCompare }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const resolvedName = contractor?.name || contractor?.business_name || contractor?.user_name || "Contractor";
  const resolvedCategory = (contractor?.category || contractor?.categories?.[0] || "general").replace(/_/g, " ");
  const resolvedReviewCount = contractor?.review_count ?? contractor?.reviews_count ?? 0;
  const rating = Number(contractor?.rating || 0);
  const distanceKm = contractor?.distance_km;
  const dailyRate = contractor?.daily_rate;

  async function handleMessageTap(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await contractorAPI.recordLead(contractor.id);
    } catch { /* ignore */ }
    trackEvent("in_app_message_tap", { contractor_id: contractor.id, category: resolvedCategory, source: "card" });
    navigate("/chat", { state: { initChatWith: contractor.id } });
  }

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 ${isCompared
          ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/50"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
        }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-5">
            {/* Avatar Section */}
            <div className="relative shrink-0">
              {contractor.photo_url ? (
                <img
                  src={getImageUrl(contractor.photo_url)}
                  alt={resolvedName}
                  className="h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-2xl font-black text-indigo-300 border border-indigo-500/30">
                  {resolvedName.charAt(0).toUpperCase()}
                </div>
              )}
              {contractor.is_available && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#090B19] bg-emerald-500" title="Available Now" />
              )}
            </div>

            {/* Name & Title Section */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-display text-xl font-black text-white">{resolvedName}</h3>
                {contractor.is_verified && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" title="Verified">
                    <FiShield size={10} />
                  </div>
                )}
              </div>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                {resolvedCategory}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                  <FiStar className="text-amber-400 fill-amber-400" size={12} />
                  <span className="text-xs font-black text-white">{rating.toFixed(1)}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {resolvedReviewCount} reviews
                </span>
              </div>
            </div>
          </div>

          {showCompare && (
            <button
              type="button"
              onClick={() => onCompare?.(contractor, !isCompared)}
              className={`shrink-0 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${isCompared
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/30"
                }`}
            >
              Compare
            </button>
          )}
        </div>

        {/* Info Grid */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Proximity</p>
            <p className="text-sm font-bold text-white flex items-center gap-1">
              <FiMapPin size={12} className="text-cyan-400" />
              {distanceKm != null ? `${Number(distanceKm).toFixed(1)}km` : "Local"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Starting Rate</p>
            <p className="text-sm font-bold text-white">
              {dailyRate ? `₹${Number(dailyRate).toLocaleString("en-IN")}` : "Custom"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Exp</p>
            <p className="text-sm font-bold text-white">
              {contractor.experience_years ? `${contractor.experience_years}y` : "New Pro"}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-6 flex flex-wrap gap-2">
          {contractor.is_labour_group && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <FiUsers size={12} className="text-indigo-400" /> Team of {contractor.team_size || 'Expert'}
            </div>
          )}
          {contractor.is_featured && (
            <div className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400">
              Top Rated
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="grid grid-cols-11 border-t border-white/5">
        <button
          onClick={handleMessageTap}
          className="col-span-3 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 transition-all hover:bg-emerald-500/5"
        >
          <FiMessageCircle size={16} />
          <span className="hidden sm:inline">Chat</span>
        </button>
        <Link
          to={`/contractor/${contractor.id}`}
          className="col-span-4 flex items-center justify-center gap-2 border-x border-white/5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/5"
        >
          View Profile
          <FiArrowRight size={14} className="text-indigo-400" />
        </Link>
        <Link
          to={`/checkout/${contractor.id}`}
          state={{ contractor }}
          className="col-span-4 flex items-center justify-center gap-2 bg-indigo-600 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-indigo-700 shadow-inner"
        >
          <FiCreditCard size={14} />
          Book
        </Link>
      </div>
    </article>
  );
}
