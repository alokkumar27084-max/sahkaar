import React from "react";
import { Link } from "react-router-dom";
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
    try {
      await contractorAPI.recordLead(id);
    } catch {
      // no-op
    }
    trackEvent("whatsapp_tap", {
      contractor_id: id,
      category: resolvedCategory,
      source: "card",
    });
  }

  return (
    <article className={`bg-white border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(30,58,138,0.12)] ${is_featured ? "border-[#06B6D4]" : "border-[#E5E7EB]"}`}>
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={getImageUrl(photo_url)}
            alt={resolvedName}
            className="w-20 h-20 rounded-full object-cover border-[3px] border-[#06B6D4]"
            loading="lazy"
            onError={(e) => {
              e.target.src = "/default-contractor.png";
            }}
          />
          <span className={`absolute -bottom-1 -right-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${is_available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {is_available ? (lang === "hi" ? "??????" : "Available") : lang === "hi" ? "??????" : "Busy"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-['Poppins'] text-base md:text-lg text-[#111827] font-semibold leading-tight truncate">{resolvedName}</h3>
              <p className="text-xs text-[#374151] capitalize mt-0.5">{resolvedCategory?.replace("_", " ")}</p>
            </div>
            {daily_rate && (
              <span className="text-xs font-semibold text-[#1E3A8A] bg-slate-100 rounded-full px-2 py-1 whitespace-nowrap">
                ?{Number(daily_rate || 0).toLocaleString("en-IN")}
                {t("profile.per_day")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <StarRating value={Math.round(Number(rating) || 0)} readonly size="text-sm" />
            <span className="text-xs text-[#6B7280]">
              {(Number(rating) || 0).toFixed(1)} ({resolvedReviewCount})
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-[#374151]">
            {distance_km != null && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2 py-1">
                <Icon name="location" className="w-3.5 h-3.5 text-[#06B6D4]" />
                {(Number(distance_km) || 0).toFixed(1)} {t("search.km_away")}
              </span>
            )}
            {experience_years > 0 && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2 py-1">
                <Icon name="trophy" className="w-3.5 h-3.5 text-[#06B6D4]" />
                {experience_years} {t("profile.years")}
              </span>
            )}
            {is_labour_group && team_size > 0 && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full px-2 py-1">
                <Icon name="worker" className="w-3.5 h-3.5 text-[#06B6D4]" />
                {team_size} {t("profile.workers")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2.5">
            {is_verified && <Badge type="verified" lang={lang} />}
            {is_featured && <Badge type="featured" lang={lang} />}
            {is_labour_group && <Badge type="labour_group" lang={lang} />}
            {is_responsibility_model && <Badge type="responsibility" lang={lang} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200">
        <a
          href={WHATSAPP_URL(resolvedPhone, resolvedName)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline-cyan text-sm !py-2.5 !px-3"
          onClick={handleWhatsAppTap}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="message" className="w-4 h-4" />
            {t("search.contact")}
          </span>
        </a>
        <Link to={`/contractor/${id}`} className="btn-primary text-sm !py-2.5 !px-3 text-center">
          {t("search.view_profile")}
        </Link>
      </div>
    </article>
  );
}

