import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCreditCard, FiMapPin, FiMessageCircle, FiShield, FiUsers, FiStar } from "react-icons/fi";
import { contractorAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { getImageUrl } from "../../utils/imageUtils";

export default function ContractorCard({ contractor, showCompare = false, isCompared = false, onCompare }) {
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

  const handleCardClick = () => {
    navigate(`/contractor/${contractor.id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group bg-[var(--color-surface)] border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:border-[var(--color-primary)]/30 flex flex-col sm:flex-row gap-5 relative cursor-pointer ${
        isCompared
          ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20"
          : "border-[var(--color-border)]"
      }`}
    >
      
      {/* 1. Photo Section (Airbnb style) */}
      <div className="relative w-full sm:w-36 h-40 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-[var(--color-bg-elevated)]">
        {contractor.photo_url ? (
          <img
            src={getImageUrl(contractor.photo_url)}
            alt={resolvedName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 text-3xl font-black text-indigo-500 dark:text-indigo-400">
            {resolvedName.charAt(0).toUpperCase()}
          </div>
        )}
        {contractor.is_available && (
          <span className="absolute bottom-2.5 left-2.5 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1A1A1A]" title="Available Now" />
        )}
      </div>

      {/* 2. Details Section */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Header row: Name + Verified + Compare */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-base font-bold text-[var(--color-heading)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                {resolvedName}
              </h3>
              {contractor.is_verified && (
                <FiShield
                  size={15}
                  className="text-blue-500 fill-blue-500/20 shrink-0"
                  title="Verified Professional"
                />
              )}
            </div>
            {showCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare?.(contractor, !isCompared);
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors shrink-0 ${
                  isCompared
                    ? "bg-[var(--color-primary)] text-white border-transparent"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:border-[var(--color-heading)]"
                }`}
              >
                {isCompared ? "Compared" : "Compare"}
              </button>
            )}
          </div>

          {/* Subheader: Category */}
          <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2.5">
            {resolvedCategory}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <FiStar className="text-amber-400 fill-amber-400" size={14} />
              <span className="text-xs font-bold text-[var(--color-heading)]">
                {rating > 0 ? rating.toFixed(1) : "New"}
              </span>
            </div>
            <span className="text-[var(--color-muted)]">•</span>
            <span className="text-xs text-[var(--color-muted)] font-medium">
              {resolvedReviewCount} reviews
            </span>
          </div>

          {/* Inline Info Grid */}
          <div className="grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-3 mb-4">
            <div>
              <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Distance</p>
              <p className="text-xs font-bold text-[var(--color-heading)]">
                {distanceKm != null ? `${Number(distanceKm).toFixed(1)} km` : "Local"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Rate</p>
              <p className="text-xs font-bold text-[var(--color-heading)] truncate">
                {dailyRate ? `₹${Number(dailyRate).toLocaleString("en-IN")}` : "Custom"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Experience</p>
              <p className="text-xs font-bold text-[var(--color-heading)]">
                {contractor.experience_years ? `${contractor.experience_years} years` : "New Pro"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3.5 gap-2">
          {/* Chat Link */}
          <button
            onClick={handleMessageTap}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors py-1 px-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 rounded-lg"
          >
            <FiMessageCircle size={15} />
            <span>Chat</span>
          </button>

          <div className="flex gap-2">
            {/* View Profile */}
            <Link
              to={`/contractor/${contractor.id}`}
              onClick={(e) => e.stopPropagation()}
              className="h-8 px-3 rounded-lg border border-[var(--color-border)] text-xs font-bold text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors flex items-center justify-center gap-1"
            >
              <span>Profile</span>
              <FiArrowRight size={12} />
            </Link>

            {/* Book Now */}
            <Link
              to={`/checkout/${contractor.id}`}
              state={{ contractor }}
              onClick={(e) => e.stopPropagation()}
              className="h-8 px-4 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FiCreditCard size={13} />
              <span>Book</span>
            </Link>
          </div>
        </div>

      </div>
    </article>
  );
}
