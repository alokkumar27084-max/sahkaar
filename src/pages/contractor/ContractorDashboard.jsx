import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import StarRating from "../../components/common/StarRating";
import Icon from "../../components/common/Icon";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";

export default function ContractorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    contractorAPI
      .getMyProfile()
      .then((res) => setProfile(res.data.contractor))
      .catch(() => toast.error(t("app.error")))
      .finally(() => setLoading(false));
  }, [t]);

  async function toggleAvailability() {
    if (!profile) return;
    setToggling(true);
    try {
      await contractorAPI.setAvail(!profile.is_available);
      setProfile((p) => ({ ...p, is_available: !p.is_available }));
      toast.success(!profile.is_available ? "You are now available" : "You are now busy");
    } catch {
      toast.error(t("app.error"));
    } finally {
      setToggling(false);
    }
  }

  async function handleShareProfile() {
    if (!profile?.id) return;
    const url = `${window.location.origin}/contractor/${profile.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: user?.name || "Contractor Profile", url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied");
      } else {
        toast.error("Sharing is not supported on this device");
      }
    } catch {
      // user may cancel native share dialog
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const ratingValue = Number(profile?.rating || 0);
  const reviewCountValue = Number(profile?.review_count ?? profile?.reviews_count ?? 0);

  const stats = [
    { label: "Profile Views", value: profile?.views_count || 0, icon: "view" },
    { label: "WhatsApp Leads", value: profile?.leads_count || 0, icon: "message" },
    { label: "Rating", value: Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "-", icon: "rating" },
    { label: "Reviews", value: reviewCountValue, icon: "review" },
  ];

  return (
    <main id="main-content" className="max-w-[1200px] mx-auto px-4 py-6 md:px-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="font-['Poppins'] text-3xl text-[#111827] font-semibold">
              Hello, {user?.name?.split(" ")[0] || "Contractor"}
            </h1>
            <p className="text-sm text-slate-600 mt-1">Manage your profile, availability, and lead performance.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 bg-slate-50">
            <span className={`w-2.5 h-2.5 rounded-full ${profile?.is_available ? "bg-emerald-500" : "bg-amber-500"}`} />
            {profile?.is_available ? "Visible to customers" : "Marked unavailable"}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-[#111827] text-sm">Availability</p>
            <p className="text-xs text-slate-600 mt-0.5">Customers can see your current status in search results.</p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`relative w-14 h-7 rounded-full transition-colors ${profile?.is_available ? "bg-emerald-500" : "bg-slate-400"}`}
          >
            {toggling ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </span>
            ) : (
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${profile?.is_available ? "right-1" : "left-1"}`} />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <div className="mb-1 flex justify-center text-[#1E3A8A]">
                <Icon name={s.icon} className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-[#1E3A8A]">{s.value}</div>
              <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {profile ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[#111827] text-sm">Your Profile</h2>
              <Link to="/contractor/edit" className="text-[#1E3A8A] text-xs font-semibold hover:underline">
                Edit
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={getImageUrl(profile.photo_url || profile.image_url)}
                alt={user?.name || "Contractor"}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                onError={(e) => {
                  e.currentTarget.src = "/default-contractor.png";
                }}
              />
              <div>
                <p className="font-medium text-[#111827]">{user?.name || "Contractor"}</p>
                <p className="text-xs text-slate-600 capitalize">{profile.category?.replace("_", " ") || "General"}</p>
                <StarRating value={Math.round(ratingValue || 0)} readonly size="text-sm" />
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
              {profile.is_verified && <Badge type="verified" lang="en" />}
              {profile.is_featured && <Badge type="featured" lang="en" />}
              {profile.is_labour_group && <Badge type="labour_group" lang="en" />}
              {profile.is_responsibility_model && <Badge type="responsibility" lang="en" />}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-800">Your contractor profile is incomplete. Update your profile to appear in search.</p>
            <Link to="/contractor/edit" className="inline-flex mt-2 text-sm font-semibold text-[#1E3A8A] hover:underline">
              Complete Profile
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link to={`/contractor/${profile?.id}`} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-[#06B6D4] transition-colors">
            <Icon name="user" className="w-6 h-6 text-[#1E3A8A]" />
            <span className="text-sm font-medium text-[#111827]">View My Public Profile</span>
          </Link>
          <button
            type="button"
            onClick={handleShareProfile}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-[#06B6D4] transition-colors text-left"
          >
            <Icon name="link" className="w-6 h-6 text-[#1E3A8A]" />
            <span className="text-sm font-medium text-[#111827]">Share Profile</span>
          </button>
        </div>
      </section>
    </main>
  );
}
