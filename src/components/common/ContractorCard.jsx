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

export default function ContractorCard({ contractor }) {
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

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`glass-card p-5 group ${is_featured ? "ring-1 ring-[var(--color-accent)]" : ""}`}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] opacity-60 blur-sm group-hover:opacity-100 transition-opacity" />
            <img
              src={getImageUrl(photo_url)}
              alt={resolvedName}
              className="relative w-[72px] h-[72px] rounded-full object-cover border-2 border-[var(--color-surface)]"
              loading="lazy"
              onError={(e) => { e.target.src = "/default-contractor.png"; }}
            />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--color-surface)] ${is_available
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            }`}>
            {is_available ? "●" : "◐"}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display text-base md:text-lg text-[var(--color-heading)] font-semibold leading-tight truncate">
                {resolvedName}
              </h3>
              <p className="text-xs text-[var(--color-muted)] capitalize mt-0.5 font-medium">
                {resolvedCategory?.replace("_", " ")}
              </p>
            </div>
            {daily_rate && (
              <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/5 rounded-full px-2.5 py-1 whitespace-nowrap border border-[var(--color-primary)]/10">
                ₹{Number(daily_rate || 0).toLocaleString("en-IN")}
                <span className="text-[var(--color-muted)] font-normal">{t("profile.per_day")}</span>
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <StarRating value={Math.round(Number(rating) || 0)} readonly size="text-sm" />
            <span className="text-xs text-[var(--color-muted)] font-medium">
              {(Number(rating) || 0).toFixed(1)} ({resolvedReviewCount})
            </span>
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {distance_km != null && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-body)] bg-[var(--color-border)] rounded-full px-2.5 py-1">
                <Icon name="location" className="w-3 h-3 text-[var(--color-accent)]" />
                {(Number(distance_km) || 0).toFixed(1)} {t("search.km_away")}
              </span>
            )}
            {experience_years > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-body)] bg-[var(--color-border)] rounded-full px-2.5 py-1">
                <Icon name="trophy" className="w-3 h-3 text-[var(--color-accent)]" />
                {experience_years} {t("profile.years")}
              </span>
            )}
            {is_labour_group && team_size > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-body)] bg-[var(--color-border)] rounded-full px-2.5 py-1">
                <Icon name="worker" className="w-3 h-3 text-[var(--color-accent)]" />
                {team_size} {t("profile.workers")}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {is_verified && <Badge type="verified" lang={lang} />}
            {is_featured && <Badge type="featured" lang={lang} />}
            {is_labour_group && <Badge type="labour_group" lang={lang} />}
            {is_responsibility_model && <Badge type="responsibility" lang={lang} />}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--color-border)]">
        <a
          href={WHATSAPP_URL(resolvedPhone, resolvedName)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline-cyan text-sm !py-2.5 !min-h-0 text-center"
          onClick={handleWhatsAppTap}
        >
          <Icon name="message" className="w-4 h-4" />
          {t("search.contact")}
        </a>
        <Link to={`/contractor/${id}`} className="btn-primary text-sm !py-2.5 !min-h-0 text-center btn-shimmer">
          {t("search.view_profile")}
        </Link>
      </div>
    </motion.article>
  );
}
