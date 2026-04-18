import React, { useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import StarRating from "./StarRating";
import Badge from "./Badge";
import Icon from "./Icon";
import { contractorAPI } from "../../services/api";
import { trackEvent } from "../../utils/analytics";
import { getImageUrl } from "../../utils/imageUtils";
import { FiArrowRight, FiMessageCircle } from "react-icons/fi";

/* ── Physics-based tilt handler (GSAP-enhanced) ── */
function useTilt(maxTilt = 6) {
  const ref = useRef(null);

  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * maxTilt * 2;
    const rotateY = (x - 0.5) * maxTilt * 2;

    if (window.gsap) {
      window.gsap.to(ref.current, {
        rotateX, rotateY, scale: 1.02,
        duration: 0.3, ease: "power2.out",
        transformPerspective: 800,
      });
    } else {
      ref.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    }
    ref.current.style.setProperty('--mouse-x', `${x * 100}%`);
    ref.current.style.setProperty('--mouse-y', `${y * 100}%`);
  }, [maxTilt]);

  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    if (window.gsap) {
      window.gsap.to(ref.current, {
        rotateX: 0, rotateY: 0, scale: 1,
        duration: 0.7, ease: "elastic.out(1, 0.5)",
        transformPerspective: 800,
      });
    } else {
      ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  }, []);

  return { ref, handleMove, handleLeave };
}

export default function ContractorCard({ contractor, showCompare = false, isCompared = false, onCompare }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const tilt = useTilt(6);

  const resolvedName = contractor?.name || contractor?.business_name || contractor?.user_name || "Contractor";
  const resolvedCategory = contractor?.category || contractor?.categories?.[0] || "general";
  const resolvedReviewCount = contractor?.review_count ?? contractor?.reviews_count ?? 0;

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

  async function handleMessageTap(e) {
    e.stopPropagation();
    try { await contractorAPI.recordLead(id); } catch { /* no-op */ }
    trackEvent("in_app_message_tap", { contractor_id: id, category: resolvedCategory, source: "card" });
    navigate("/chat", { state: { initChatWith: id } });
  }

  function handleCompareToggle(e) {
    e.stopPropagation();
    onCompare?.(contractor, !isCompared);
  }

  return (
    <article
      ref={tilt.ref}
      onMouseMove={tilt.handleMove}
      onMouseLeave={tilt.handleLeave}
      className={`tilt-card glass-card overflow-hidden group ${is_featured ? "ring-1 ring-amber-400/20" : ""} ${isCompared ? "ring-2 ring-primary/50" : ""}`}
    >
      {/* Tilt shine overlay */}
      <div className="tilt-shine" />

      <div className="p-5 md:p-6">
        {/* Top row: badges + compare */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 text-indigo-400 dark:text-indigo-300 border border-indigo-500/10">
              {resolvedCategory?.replace("_", " ")}
            </span>
            {is_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                ✓ Verified
              </span>
            )}
          </div>
          {showCompare && (
            <button
              type="button"
              onClick={handleCompareToggle}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                isCompared
                  ? "border-primary bg-primary/10 text-primary dark:text-primary-light"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-primary/30 hover:text-primary"
              }`}
            >
              <span className={`h-2 w-2 rounded-full transition-colors ${isCompared ? "bg-primary" : "bg-[var(--color-border)]"}`} />
              {lang === "hi" ? "तुलना" : "Compare"}
            </button>
          )}
        </div>

        {/* Main — Avatar + Info */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {photo_url ? (
              <img
                src={getImageUrl(photo_url)}
                alt={resolvedName}
                className="relative w-16 h-16 rounded-xl object-cover ring-2 ring-[var(--color-border)] group-hover:ring-primary/40 transition-all duration-500"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 ring-2 ring-[var(--color-border)] items-center justify-center text-white text-lg font-bold"
              style={{ display: photo_url ? 'none' : 'flex' }}
            >
              {resolvedName.charAt(0).toUpperCase()}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-surface)] ${is_available ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-[var(--color-muted)]"}`} />
          </div>

          {/* Name + Rating */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base text-[var(--color-heading)] leading-tight truncate font-bold">
              {resolvedName}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={Math.round(Number(rating) || 0)} readonly size="text-sm" />
              <span className="text-[11px] text-[var(--color-muted)] font-medium">
                {(Number(rating) || 0).toFixed(1)} ({resolvedReviewCount})
              </span>
            </div>
          </div>

          {/* Price */}
          {daily_rate && (
            <div className="text-right flex-shrink-0 pl-2 self-center">
              <p className="font-display text-xl text-[var(--color-heading)] leading-none font-bold">
                ₹{Number(daily_rate || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[9px] text-[var(--color-muted)] uppercase tracking-wider mt-0.5 font-semibold">
                {t("profile.per_day")}
              </p>
            </div>
          )}
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {distance_km != null && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-body)] bg-[var(--color-bg-elevated)] rounded-lg px-2.5 py-1.5 border border-[var(--color-border)]">
              <Icon name="location" className="w-3 h-3 text-primary" />
              {(Number(distance_km) || 0).toFixed(1)} {t("search.km_away")}
            </span>
          )}
          {experience_years > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-body)] bg-[var(--color-bg-elevated)] rounded-lg px-2.5 py-1.5 border border-[var(--color-border)]">
              <Icon name="trophy" className="w-3 h-3 text-amber-500" />
              {experience_years} {t("profile.years")}
            </span>
          )}
          {is_labour_group && team_size > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-body)] bg-[var(--color-bg-elevated)] rounded-lg px-2.5 py-1.5 border border-[var(--color-border)]">
              <Icon name="worker" className="w-3 h-3 text-accent" />
              {team_size} {t("profile.workers")}
            </span>
          )}
        </div>

        {/* Extra Badges */}
        {(is_labour_group || is_responsibility_model) && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {is_labour_group && <Badge type="labour_group" lang={lang} />}
            {is_responsibility_model && <Badge type="responsibility" lang={lang} />}
          </div>
        )}
      </div>

      {/* Action bar with gradient border top */}
      <div className="grid grid-cols-2 border-t border-[var(--color-border)]">
        <button
          className="inline-flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-emerald-400 bg-transparent hover:bg-emerald-500/5 transition-colors border-r border-[var(--color-border)]"
          onClick={handleMessageTap}
        >
          <FiMessageCircle size={15} className="shrink-0" />
          <span>{lang === "hi" ? "मेसेज" : "Message"}</span>
        </button>
        <Link
          to={`/contractor/${id}`}
          className="inline-flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transition-all group/link"
        >
          <span>{t("search.view_profile")}</span>
          <FiArrowRight size={14} className="shrink-0 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
