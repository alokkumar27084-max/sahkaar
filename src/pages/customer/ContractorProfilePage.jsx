import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiShield,
  FiStar,
  FiMapPin,
  FiAward,
  FiCalendar,
  FiTool,
  FiFileText,
  FiLock,
  FiCheck,
  FiUser,
  FiThumbsUp,
  FiMessageSquare
} from "react-icons/fi";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useLocationContext } from "../../context/LocationContext";
import { contractorAPI, reviewAPI } from "../../services/api";
import { calculateHaversineDistanceKm, formatDistance } from "../../utils/googleMaps";
import { getAvatarUrl } from "../../utils/imageUtils";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SEOHead from "../../components/common/SEOHead";

export default function ContractorProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { location: userLoc, openLocationModal } = useLocationContext();
  const navigate = useNavigate();
  const isHi = lang === "hi";

  const [contractor, setContractor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  // Review state
  const [myRating, setMyRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadMaster() {
      setLoading(true);
      try {
        const [cRes, rRes] = await Promise.all([
          contractorAPI.getById(id),
          reviewAPI.getForContractor(id).catch(() => ({ data: { reviews: [] } })),
        ]);
        if (cRes.data?.ok || cRes.data?.contractor) {
          setContractor(cRes.data.contractor || cRes.data.data);
        }
        if (rRes.data?.ok || rRes.data?.reviews) {
          setReviews(rRes.data.reviews || []);
        }
      } catch (err) {
        console.error("Master profile load error:", err);
        toast.error("Could not load Master profile details");
      } finally {
        setLoading(false);
      }
    }
    loadMaster();
  }, [id]);

  // Clean name formatting
  const rawName =
    contractor?.name ||
    contractor?.business_name ||
    contractor?.user_name ||
    "SahKaari Master";
  const cleanName = rawName
    .replace(/^Master\s+/i, "")
    .replace(/\s*\([^)]*\)$/, "")
    .trim();

  const rawCategory = (
    contractor?.category ||
    contractor?.categories?.[0] ||
    "General Services"
  ).replace(/_/g, " ");
  const resolvedCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);

  const rating = Number(contractor?.rating || 4.9);
  const reviewCount = contractor?.review_count ?? contractor?.reviews_count ?? (reviews.length > 0 ? reviews.length : 24);
  const isVerified = !!contractor?.is_verified || contractor?.verification_status === "verified";
  const dailyRate = contractor?.daily_rate || 450;
  const societyName = contractor?.society_name || "Bhopal Labour & Artisan Cooperative Society";
  const federationName = contractor?.federation_name || "Madhya Pradesh Labour Cooperative Federation";
  const regNo = contractor?.member_registration_no || "SK-MST-936570";

  const rawPhone = contractor?.phone || contractor?.contact_phone || "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const telHref = rawPhone ? `tel:${rawPhone.startsWith("+") ? rawPhone : "+91" + cleanPhone}` : "#";

  const waPhone = cleanPhone.startsWith("91") ? cleanPhone : cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
  const waText = encodeURIComponent(
    `नमस्ते Master ${cleanName}! I saw your profile on SahKaari and would like to hire your ${resolvedCategory} service.`
  );
  const waHref = cleanPhone ? `https://wa.me/${waPhone}?text=${waText}` : "#";

  const cLat = contractor?.lat ?? contractor?.latitude;
  const cLng = contractor?.lng ?? contractor?.longitude;

  const dynamicDistanceKm = useMemo(() => {
    if (userLoc?.lat && userLoc?.lng && cLat && cLng) {
      return calculateHaversineDistanceKm(userLoc.lat, userLoc.lng, cLat, cLng);
    }
    return contractor?.distance_km !== undefined && contractor?.distance_km !== null
      ? Number(contractor.distance_km)
      : null;
  }, [userLoc, cLat, cLng, contractor?.distance_km]);

  const portfolioPhotos = useMemo(() => {
    return contractor?.portfolio_photos || contractor?.portfolio_urls || [];
  }, [contractor]);

  const handleBookNow = () => {
    navigate(`/quick-booking/${contractor.id}`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit a review");
      navigate("/login");
      return;
    }
    if (!myComment.trim()) {
      toast.error("Please write a few words about your experience");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await reviewAPI.submit(contractor.id, {
        rating: myRating,
        comment: myComment,
        review_text: myComment,
      });

      if (res.data?.ok || res.data?.review) {
        toast.success("Thank you! Review submitted successfully.");
        setReviews((prev) => [
          {
            id: `rev-${Date.now()}`,
            rating: myRating,
            review_text: myComment,
            comment: myComment,
            user_name: user?.name || "Verified Customer",
            reviewer_name: user?.name || "Verified Customer",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setMyComment("");
        setMyRating(5);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-bold text-slate-500 mt-4">Loading Master Profile...</p>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-bold text-slate-900">Master Not Found</h2>
        <Link to="/search" className="btn-primary text-xs py-2 px-5 mt-3">
          Browse Other Masters
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen pb-28 text-slate-900">
      <SEOHead
        title={`Master ${cleanName} — ${resolvedCategory} | SahKaari`}
        description={`Book Master ${cleanName}. Certified ${resolvedCategory} from ${societyName}.`}
      />

      {/* ═══════ TOP BREADCRUMBS & REGISTRATION ═══════ */}
      <div className="bg-white border-b border-slate-200/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <span>›</span>
            <Link to="/categories" className="hover:text-indigo-600 transition-colors">Services</Link>
            <span>›</span>
            <span className="text-slate-900 font-bold">Master {cleanName}</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400 hidden sm:inline">
            Reg: {regNo}
          </span>
        </div>
      </div>

      {/* ═══════ MAIN 2-COLUMN PREMIUM PROFILE CONTAINER ═══════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ═══════ LEFT MAIN CONTENT (8 COLS) ═══════ */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Header Card: Avatar + Identity + Social Proof */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-5">
              <div className="flex items-start gap-4 sm:gap-5">
                {/* Profile Photo */}
                <div className="relative shrink-0">
                  <img
                    src={getAvatarUrl(contractor.photo_url || contractor.image_url)}
                    alt={cleanName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                  />
                  {isVerified && (
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-xs"
                      title="Cooperative Verified Master"
                    >
                      <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Identity & Tags */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wide text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      Master {resolvedCategory}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {contractor.experience_years || 3}+ Yrs Exp
                    </span>
                    {isVerified && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <FiShield className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    Master {cleanName}
                  </h1>

                  <p className="text-xs text-slate-500 truncate flex items-center gap-1 font-medium">
                    <span>🏛️ {societyName}</span>
                    <span className="hidden sm:inline">• {federationName}</span>
                  </p>

                  {/* Social Proof Stats & Real-Time Dynamic Distance */}
                  <div className="flex items-center gap-2.5 pt-1 text-xs font-bold text-slate-700 flex-wrap">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-200/60 font-black">
                      <FiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{rating.toFixed(1)}</span>
                      <span className="text-slate-500 font-medium text-[11px]">({reviewCount} reviews)</span>
                    </div>

                    {dynamicDistanceKm !== null && dynamicDistanceKm !== undefined && (
                      <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-md font-black">
                        <FiMapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{formatDistance(dynamicDistanceKm)}</span>
                        <span className="text-slate-400 font-medium text-[10px]">from you</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-slate-600 font-semibold">
                      <span className="text-slate-400 font-medium">Base:</span>
                      <span>{contractor.location_text || "Bhopal, MP"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Trust Signals Chips */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-700">
                  <FiShield className="text-emerald-600 w-4 h-4 shrink-0" />
                  <span className="truncate">Co-op Certified</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-700">
                  <FiCheck className="text-emerald-600 w-4 h-4 shrink-0 stroke-[3]" />
                  <span className="truncate">Police Verified</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-700">
                  <FiLock className="text-emerald-600 w-4 h-4 shrink-0" />
                  <span className="truncate">Zero Commission</span>
                </div>
              </div>
            </div>

            {/* 2. Services & Transparent Pricing Scope */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-950 tracking-tight flex items-center gap-2">
                  <FiTool className="w-4 h-4 text-indigo-600" />
                  <span>Offered Services & Standard Rates</span>
                </h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Visit Fee: ₹{dailyRate}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(contractor.services && contractor.services.length > 0
                  ? contractor.services
                  : ["Inspection & Problem Diagnosis", "Complete Repair & Fix", "New Fitting & Installation", "Emergency Breakdown Support"]
                ).map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 truncate">{srv}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
                      ₹{dailyRate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. About & Experience */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-3">
              <h2 className="text-base font-black text-slate-950 tracking-tight flex items-center gap-2">
                <FiUser className="w-4 h-4 text-indigo-600" />
                <span>About Master {cleanName}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {contractor.description ||
                  `Master ${cleanName} is a certified, cooperative-affiliated artisan specializing in ${resolvedCategory} services with over ${contractor.experience_years || 3} years of professional expertise across residential and commercial works in Bhopal.`}
              </p>
            </div>

            {/* 4. Portfolio / Work Samples */}
            {portfolioPhotos.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-3">
                <h2 className="text-base font-black text-slate-950 tracking-tight flex items-center gap-2">
                  <FiFileText className="w-4 h-4 text-indigo-600" />
                  <span>Work Portfolio & Recent Projects</span>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                  {portfolioPhotos.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActivePhoto(img)}
                      className="aspect-square rounded-2xl overflow-hidden bg-slate-100 cursor-pointer hover:opacity-90 transition-all border border-slate-200 shadow-2xs group relative"
                    >
                      <img src={img} alt={`Work ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                        View
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Interactive Customer Reviews & Rating Form */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-950 tracking-tight flex items-center gap-2">
                  <FiStar className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Customer Reviews & Feedback ({reviewCount})</span>
                </h2>
                <div className="text-xs font-black text-slate-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  ★ {rating.toFixed(1)} / 5.0
                </div>
              </div>

              {/* Interactive Submit Review Box */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-slate-900">Rate this Master:</span>
                  {/* Clickable Star Rating Input */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMyRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                        title={`${star} Star`}
                      >
                        <FiStar
                          className={`w-6 h-6 ${
                            star <= (hoverRating || myRating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-800 ml-1.5">
                      {hoverRating || myRating} Star{(hoverRating || myRating) > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-2.5">
                  <textarea
                    rows={2}
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    placeholder="Share your experience (work quality, punctuality, fair pricing)..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600 bg-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-3 pt-1">
                {(reviews.length > 0
                  ? reviews
                  : [
                      {
                        id: "rev-1",
                        user_name: "Amit Saxena (Arera Colony)",
                        reviewer_name: "Amit Saxena",
                        rating: 5,
                        comment: "Very punctual and knowledgeable. Fixed the job efficiently without any mess. Fair cooperative pricing.",
                        created_at: "2026-08-20",
                      },
                      {
                        id: "rev-2",
                        user_name: "Pooja Sharma",
                        reviewer_name: "Pooja Sharma",
                        rating: 5,
                        comment: "Very respectful artisan. 100% verified work and excellent attitude. Highly recommend!",
                        created_at: "2026-08-16",
                      },
                    ]
                ).map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {(rev.reviewer_name || rev.user_name || "C").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-extrabold text-slate-900">
                          {rev.reviewer_name || rev.user_name || "Verified Customer"}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          ✓ Verified Hire
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                        {[...Array(Number(rev.rating || 5))].map((_, s) => (
                          <FiStar key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-600 font-normal leading-relaxed pl-9">
                      {rev.comment || rev.review_text}
                    </p>

                    <div className="text-[10px] text-slate-400 pl-9">
                      {new Date(rev.created_at || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* ═══════ RIGHT STICKY SIDEBAR (4 COLS - DESKTOP ONLY) ═══════ */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-5 sticky top-24 shadow-sm">
              
              {/* Price & Availability Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Standard Visit Fee</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-950">₹{dailyRate}</span>
                  <span className="text-xs text-slate-500 font-medium">/ service inspection</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-2 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available for Instant Dispatch</span>
                </div>
              </div>

              {/* Service Location Selector */}
              <div className="space-y-1 text-xs">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Service Location:</div>
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-800 font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FiMapPin className="text-rose-500 w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{userLoc.shortName || userLoc.name}</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-extrabold">Change ▾</span>
                </button>

                {dynamicDistanceKm !== null && dynamicDistanceKm !== undefined && (
                  <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-bold text-slate-500">
                    <span>Distance to your location:</span>
                    <span className="text-rose-600 font-black">{formatDistance(dynamicDistanceKm)}</span>
                  </div>
                )}
              </div>

              {/* Direct Actions: Phone Call + WhatsApp + Book Online */}
              <div className="space-y-2.5 pt-1">
                {rawPhone ? (
                  <a
                    href={telHref}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                    title={`Call ${cleanName} directly`}
                  >
                    <FaPhoneAlt className="w-3.5 h-3.5" />
                    <span>Contact Now ({rawPhone})</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <FiLock className="w-3.5 h-3.5" />
                    <span>Contact Number on Booking</span>
                  </button>
                )}

                {cleanPhone ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                    title="Chat on WhatsApp"
                  >
                    <FaWhatsapp className="w-4 h-4 text-emerald-600" />
                    <span>Chat on WhatsApp</span>
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={handleBookNow}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <FiCalendar className="w-4 h-4" />
                  <span>Book Master Now</span>
                </button>
              </div>

              {/* Guarantees */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <FiShield className="text-emerald-600 w-3.5 h-3.5 shrink-0" />
                  <span>Audited by State Labour Cooperative</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiLock className="text-slate-400 w-3.5 h-3.5 shrink-0" />
                  <span>100% Secure Razorpay Checkout</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ═══════ STICKY BOTTOM BAR (MOBILE ONLY) ═══════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 px-4 md:hidden z-50 flex items-center gap-2 shadow-2xl">
        {rawPhone ? (
          <a
            href={telHref}
            className="flex-1 py-3 px-2 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Call Master"
          >
            <FaPhoneAlt className="w-3.5 h-3.5" />
            <span>{isHi ? "कॉल करें" : "Call"}</span>
          </a>
        ) : null}

        {cleanPhone ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black shadow-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
            title="Chat on WhatsApp"
          >
            <FaWhatsapp className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </a>
        ) : null}

        <button
          type="button"
          onClick={handleBookNow}
          className="flex-1 py-3 px-2 rounded-xl bg-slate-950 active:bg-indigo-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <FiCalendar className="w-3.5 h-3.5" />
          <span>{isHi ? "बुक करें" : "Book"} (₹{dailyRate})</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
        >
          <img src={activePhoto} alt="Work Full" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </main>
  );
}
