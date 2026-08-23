import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCreditCard,
  FiMessageCircle,
  FiShield,
  FiStar,
  FiMapPin,
  FiClock,
  FiDollarSign,
} from "react-icons/fi";
import { contractorAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { getAvatarUrl } from "../../utils/imageUtils";

export default function ContractorCard({
  contractor,
  showCompare = false,
  isCompared = false,
  onCompare,
}) {
  const navigate = useNavigate();

  const resolvedName =
    contractor?.name ||
    contractor?.business_name ||
    contractor?.user_name ||
    "Contractor";
  const resolvedCategory = (
    contractor?.category ||
    contractor?.categories?.[0] ||
    "general"
  ).replace(/_/g, " ");
  const resolvedReviewCount =
    contractor?.review_count ?? contractor?.reviews_count ?? 0;
  const rating = Number(contractor?.rating || 0);
  const distanceKm = contractor?.distance_km;
  const dailyRate = contractor?.daily_rate;

  async function handleMessageTap(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await contractorAPI.recordLead(contractor.id);
    } catch {
      /* ignore */
    }
    trackEvent("in_app_message_tap", {
      contractor_id: contractor.id,
      category: resolvedCategory,
      source: "card",
    });
    navigate("/chat", { state: { initChatWith: contractor.id } });
  }

  const handleCardClick = () => {
    navigate(`/contractor/${contractor.id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ${
        isCompared
          ? "ring-2 ring-[var(--color-primary)] ring-offset-2"
          : ""
      }`}
      style={{
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Subtle top gradient accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
        }}
      />

      <div className="flex flex-col sm:flex-row gap-0">
        {/* ── Photo Section ── */}
        <div className="relative w-full sm:w-32 shrink-0">
          <div className="relative h-44 sm:h-full min-h-[10rem] overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
            <img
              src={getAvatarUrl(contractor.photo_url)}
              alt={resolvedName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getAvatarUrl("");
              }}
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Category pill overlaid on photo */}
            <div className="absolute top-3 left-3">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
                style={{
                  background: "rgba(79,70,229,0.85)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {resolvedCategory}
              </span>
            </div>

            {/* Available dot */}
            {contractor.is_available && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span
                  className="text-[10px] font-bold text-white"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                >
                  Available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Details Section ── */}
        <div className="flex-1 flex flex-col justify-between p-3.5 min-w-0">
          {/* Header: Name + Compare */}
          <div className="flex items-start justify-between gap-2.5 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-sm font-bold text-[var(--color-heading)] truncate group-hover:text-[var(--color-primary)] transition-colors duration-200">
                {resolvedName}
              </h3>
              {contractor.is_verified && (
                <span
                  className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.3)",
                  }}
                  title="Verified Professional"
                >
                  <FiShield size={11} className="text-blue-500" />
                </span>
              )}
            </div>

            {showCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare?.(contractor, !isCompared);
                }}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  isCompared
                    ? "text-white"
                    : "text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                }`}
                style={
                  isCompared
                    ? {
                        background:
                          "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                        border: "none",
                      }
                    : {
                        background: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border)",
                        boxShadow: "var(--shadow-xs)",
                      }
                }
              >
                {isCompared ? "✓ Added" : "Compare"}
              </button>
            )}
          </div>

          {/* Cooperative Society Affiliation Seal */}
          <div className="mb-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50/90 border border-teal-200/80 text-[11px] text-teal-950 font-medium">
              <FiShield className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate font-semibold text-primary">
                {contractor.society_name || "Bhopal Shramik & Karigar Sahakari Samiti"}
              </span>
            </div>
          </div>

          {/* Rating & Verified stats row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                <FiStar className="text-amber-500 fill-amber-500" size={12} />
                <span className="text-xs font-bold text-amber-950">
                  {rating > 0 ? rating.toFixed(1) : "4.8"}
                </span>
              </div>
              <span className="text-xs text-[var(--color-muted)] font-medium">
                ({resolvedReviewCount > 0 ? resolvedReviewCount : 12} jobs)
              </span>
            </div>

            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 uppercase tracking-wider">
              Co-op Verified
            </span>
          </div>

          {/* Stats grid */}
          <div
            className="grid grid-cols-3 gap-1 rounded-xl p-2.5 mb-3"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-neumorphic-pressed)",
            }}
          >
            {/* Distance */}
            <div className="flex flex-col items-center gap-0.5">
              <FiMapPin size={11} className="text-[var(--color-primary)] mb-0.5" />
              <p className="text-[9px] font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                Distance
              </p>
              <p className="text-xs font-bold text-[var(--color-heading)]">
                {distanceKm != null
                  ? `${Number(distanceKm).toFixed(1)} km`
                  : "Local"}
              </p>
            </div>

            {/* Rate */}
            <div
              className="flex flex-col items-center gap-0.5"
              style={{
                borderLeft: "1px solid var(--color-border)",
                borderRight: "1px solid var(--color-border)",
              }}
            >
              <FiDollarSign size={11} className="text-[var(--color-accent)] mb-0.5" />
              <p className="text-[9px] font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                Rate
              </p>
              <p className="text-xs font-bold text-[var(--color-heading)] truncate">
                {dailyRate
                  ? `₹${Number(dailyRate).toLocaleString("en-IN")}`
                  : "Custom"}
              </p>
            </div>

            {/* Experience */}
            <div className="flex flex-col items-center gap-0.5">
              <FiClock size={11} className="text-emerald-500 mb-0.5" />
              <p className="text-[9px] font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                Exp.
              </p>
              <p className="text-xs font-bold text-[var(--color-heading)]">
                {contractor.experience_years
                  ? `${contractor.experience_years} yr`
                  : "New"}
              </p>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between gap-1.5">
            {/* Chat */}
            <button
              onClick={handleMessageTap}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors py-1.5 px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 shrink-0"
            >
              <FiMessageCircle size={14} />
              <span>Chat</span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Profile */}
              <Link
                to={`/contractor/${contractor.id}`}
                onClick={(e) => e.stopPropagation()}
                className="h-8 px-2.5 rounded-xl text-xs font-bold text-[var(--color-heading)] flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 shrink-0"
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                <span>Profile</span>
                <FiArrowRight size={11} />
              </Link>

              {/* Book Now — gradient CTA */}
              <Link
                to={`/checkout/${contractor.id}`}
                state={{ contractor }}
                onClick={(e) => e.stopPropagation()}
                className="h-8 px-3 rounded-xl text-xs font-bold text-white flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shrink-0 whitespace-nowrap"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                  boxShadow:
                    "0 4px 14px rgba(79,70,229,0.3)",
                }}
              >
                <FiCreditCard size={12} />
                <span>Book</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hover lift shadow */}
      <style>{`
        article:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-card-hover);
        }
        article {
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1);
        }
      `}</style>
    </article>
  );
}
