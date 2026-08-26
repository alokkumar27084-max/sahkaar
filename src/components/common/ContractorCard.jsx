import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiShield,
  FiStar,
  FiMapPin,
  FiCheckCircle,
  FiZap,
  FiClock,
  FiAward,
  FiCalendar,
  FiPhone
} from "react-icons/fi";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import { useLocationContext } from "../../context/LocationContext";
import { calculateHaversineDistanceKm, formatDistance } from "../../utils/googleMaps";
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
  const { location: userLoc } = useLocationContext();

  const resolvedName =
    contractor?.name ||
    contractor?.business_name ||
    contractor?.user_name ||
    "SahKaar Master";
  const rawCategory = (
    contractor?.category ||
    contractor?.categories?.[0] ||
    "General Services"
  ).replace(/_/g, " ");
  const resolvedCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);
  const resolvedReviewCount =
    contractor?.review_count ?? contractor?.reviews_count ?? 0;
  const rating = Number(contractor?.rating || 4.8);

  const cLat = contractor?.lat ?? contractor?.latitude;
  const cLng = contractor?.lng ?? contractor?.longitude;

  const dynamicDistanceKm = React.useMemo(() => {
    if (userLoc?.lat && userLoc?.lng && cLat && cLng) {
      return calculateHaversineDistanceKm(userLoc.lat, userLoc.lng, cLat, cLng);
    }
    return contractor?.distance_km !== undefined && contractor?.distance_km !== null
      ? Number(contractor.distance_km)
      : null;
  }, [userLoc, cLat, cLng, contractor?.distance_km]);

  const dailyRate = contractor?.daily_rate || 450;
  const isVerified = !!contractor?.is_verified || contractor?.verification_status === "verified";
  const isFeatured = !!contractor?.is_featured || !!contractor?.has_priority;
  const societyName = contractor?.society_name || "Cooperative Society Member";

  const rawPhone = contractor?.phone || contractor?.contact_phone || "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const telHref = rawPhone ? `tel:${rawPhone.startsWith("+") ? rawPhone : "+91" + cleanPhone}` : "#";

  const waPhone = cleanPhone.startsWith("91") ? cleanPhone : cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
  const waText = encodeURIComponent(
    `नमस्ते Master ${resolvedName}! I found your profile on SahKaar Cooperative Marketplace and would like to hire your ${resolvedCategory} service.`
  );
  const waHref = cleanPhone ? `https://wa.me/${waPhone}?text=${waText}` : "#";

  const handleCardClick = () => {
    navigate(`/contractor/${contractor.id}`);
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    navigate(`/quick-booking/${contractor.id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-4 sm:p-5 ${
        isCompared ? "ring-2 ring-indigo-600 ring-offset-2" : ""
      }`}
    >
      {/* Featured / Subscription Boost Ribbon */}
      {isFeatured && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-extrabold shadow-sm">
          <FiZap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Top Master</span>
        </div>
      )}

      <div>
        {/* Top Header: Avatar + Info */}
        <div className="flex items-start gap-4">
          {/* Avatar with Verified Ring */}
          <div className="relative shrink-0">
            <img
              src={getAvatarUrl(contractor.photo_url || contractor.image_url)}
              alt={resolvedName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getAvatarUrl("");
              }}
            />
            {isVerified && (
              <div
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-sm"
                title="Verified Master by Cooperative Federation"
              >
                <FiCheckCircle className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-14">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Master {resolvedCategory}
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <FiShield className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 truncate group-hover:text-indigo-600 transition-colors">
              {resolvedName}
            </h3>

            <p className="text-xs text-slate-500 truncate mt-0.5">
              🏛️ {societyName}
            </p>

            {/* Rating & Distance Row */}
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-700">
              <div className="inline-flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded-md text-[11px] font-extrabold">
                <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>{rating.toFixed(1)}</span>
                <span className="text-slate-300 text-[10px]">({resolvedReviewCount > 0 ? resolvedReviewCount : 24})</span>
              </div>

              {dynamicDistanceKm !== null && dynamicDistanceKm !== undefined && (
                <div className="inline-flex items-center gap-1 text-slate-600 text-[11px] font-bold">
                  <FiMapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>{formatDistance(dynamicDistanceKm)}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1 text-slate-500 text-[11px] hidden sm:inline-flex">
                <FiAward className="w-3 h-3 text-indigo-500" />
                <span>{contractor?.experience_years || 3}+ yrs exp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Highlighted Services / Chips */}
        {contractor?.services && contractor.services.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
            {contractor.services.slice(0, 3).map((srv, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full"
              >
                {srv}
              </span>
            ))}
            {contractor.services.length > 3 && (
              <span className="text-[11px] font-bold text-slate-400">
                +{contractor.services.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Transparent Pricing & Direct Contact & Book Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Visit Fee
          </div>
          <div className="text-base font-extrabold text-slate-900">
            ₹{dailyRate}
            <span className="text-xs font-normal text-slate-500"> / service</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Call Button */}
          {rawPhone && (
            <a
              href={telHref}
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              title={`Call ${resolvedName}`}
            >
              <FaPhoneAlt className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Quick WhatsApp Button */}
          {cleanPhone && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              title="Chat on WhatsApp"
            >
              <FaWhatsapp className="w-3.5 h-3.5 text-emerald-600" />
            </a>
          )}

          {/* Book Online CTA */}
          <button
            type="button"
            onClick={handleBookClick}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <FiCalendar className="w-3.5 h-3.5" />
            <span>Book</span>
          </button>
        </div>
      </div>
    </article>
  );
}
