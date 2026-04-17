import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import StarRating from "./StarRating";
import Badge from "./Badge";
import Icon from "./Icon";
import { WHATSAPP_URL } from "../../utils/constants";
import { contractorAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { getImageUrl } from "../../utils/imageUtils";

export default function ContractorCard({ contractor, showCompare = false, isCompared = false, onCompare }) {
  const { t, lang } = useLanguage();

  const resolvedName = contractor?.name || contractor?.business_name || contractor?.user_name || "Contractor";
  const resolvedCategory = contractor?.category || contractor?.categories?.[0] || "general";
  const resolvedReviewCount = contractor?.review_count ?? contractor?.reviews_count ?? 0;
  const resolvedPhone = contractor?.phone || "";

  const {
    id,
    photo_url,
    rating = 0,
    distance_km,
    daily_rate,
    is_verified,
    is_featured,
    is_labour_group,
    is_responsibility_model,
    is_available,
    team_size,
    experience_years,
  } = contractor;

  async function handleWhatsAppTap(e) {
    e.stopPropagation();
    try { await contractorAPI.recordLead(id); } catch { /* no-op */ }
    trackEvent("whatsapp_tap", { contractor_id: id, category: resolvedCategory, source: "card" });
  }

  function handleCompareToggle(e) {
    e.stopPropagation();
    onCompare?.(contractor, !isCompared);
  }

  return (
    <motion.article
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`glass-card overflow-hidden group ${is_featured ? "ring-1 ring-[var(--color-accent)]/40" : ""} ${isCompared ? "ring-2 ring-[var(--color-primary)]/40" : ""}`}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-primary)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-5">
        {showCompare && (
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={handleCompareToggle}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                isCompared
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${isCompared ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`} />
              {lang === "hi" ? "तुलना करें" : "Compare"}
            </button>
          </div>
        )}

        {/* Header: Avatar + Name + Price */}
        <div className="flex items-start gap-4">
          {/* Avatar with gradient ring */}
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] opacity-0 group-hover:opacity-70 blur-[4px] transition-opacity duration-500" />
            <img
              src={getImageUrl(photo_url)}
              alt={resolvedName}
              className="relative w-16 h-16 rounded-full object-cover border-2 border-[var(--color-surface)]"
              loading="lazy"
              onError={(e) => { e.target.src = "/default-contractor.png"; }}
            />
            <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[var(--color-surface)] ${is_available ? "bg-emerald-400" : "bg-amber-400"}`} />
          </div>

          {/* Name + Category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg text-[var(--color-heading)] leading-tight truncate">
              {resolvedName}
            </h3>
            <p className="text-xs text-[var(--color-muted)] capitalize mt-0.5 font-medium tracking-wide">
              {resolvedCategory?.replace("_", " ")}
            </p>
            {/* Rating inline */}
            <div className="flex items-center gap-2 mt-1.5">
              <StarRating value={Math.round(Number(rating) || 0)} readonly size="text-sm" />
              <span className="text-xs text-[var(--color-muted)] font-medium">
                {(Number(rating) || 0).toFixed(1)} ({resolvedReviewCount})
              </span>
            </div>
          </div>

          {/* Price — Top Right */}
          {daily_rate && (
            <div className="text-right flex-shrink-0 pl-2">
              <p className="font-display text-2xl text-[var(--color-primary)] leading-none">
                ₹{Number(daily_rate || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider mt-0.5 font-medium">
                {t("profile.per_day")}
              </p>
            </div>
          )}
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {distance_km != null && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-body)] bg-[var(--color-border)]/60 rounded-full px-2.5 py-1">
              <Icon name="location" className="w-3 h-3 text-[var(--color-accent)]" />
              {(Number(distance_km) || 0).toFixed(1)} {t("search.km_away")}
            </span>
          )}
          {experience_years > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-body)] bg-[var(--color-border)]/60 rounded-full px-2.5 py-1">
              <Icon name="trophy" className="w-3 h-3 text-[var(--color-accent)]" />
              {experience_years} {t("profile.years")}
            </span>
          )}
          {is_labour_group && team_size > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-body)] bg-[var(--color-border)]/60 rounded-full px-2.5 py-1">
              <Icon name="worker" className="w-3 h-3 text-[var(--color-accent)]" />
              {team_size} {t("profile.workers")}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {is_verified && <Badge type="verified" lang={lang} />}
          {is_featured && <Badge type="featured" lang={lang} />}
          {is_labour_group && <Badge type="labour_group" lang={lang} />}
          {is_responsibility_model && <Badge type="responsibility" lang={lang} />}
        </div>
      </div>

      {/* Actions — Clean bottom bar */}
      <div className="grid grid-cols-2 gap-px bg-[var(--color-border)]/50">
        <a
          href={WHATSAPP_URL(resolvedPhone, resolvedName)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-[var(--color-accent)] bg-[var(--color-surface)] hover:bg-[var(--color-accent)]/5 transition-colors"
          onClick={handleWhatsAppTap}
        >
          <Icon name="message" className="w-4 h-4" />
          {t("search.contact")}
        </a>
        <Link
          to={`/contractor/${id}`}
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          {t("search.view_profile")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </motion.article>
  );
}
