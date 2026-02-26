import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import StarRating from "../../components/common/StarRating";
import Icon from "../../components/common/Icon";
import toast from "react-hot-toast";

export default function ContractorDashboard() {
  const { t, lang } = useLanguage();
  const { user, logout } = useAuth();
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
      toast.success(
        lang === "hi"
          ? !profile.is_available
            ? "आप अब उपलब्ध हैं"
            : "आप अब व्यस्त हैं"
          : !profile.is_available
          ? "You are now available"
          : "You are now busy"
      );
    } catch {
      toast.error(t("app.error"));
    } finally {
      setToggling(false);
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
    { label: lang === "hi" ? "प्रोफ़ाइल व्यू" : "Profile Views", value: profile?.views_count || 0, icon: "view" },
    { label: lang === "hi" ? "WhatsApp क्लिक" : "WhatsApp Taps", value: profile?.leads_count || 0, icon: "message" },
    { label: lang === "hi" ? "रेटिंग" : "Rating", value: Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "—", icon: "rating" },
    { label: lang === "hi" ? "समीक्षाएं" : "Reviews", value: reviewCountValue, icon: "review" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-6">
      <section className="glass-card p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="font-['Space_Grotesk'] text-3xl text-slate-100 font-semibold">
              {lang === "hi" ? `नमस्ते, ${user?.name?.split(" ")[0]}!` : `Hello, ${user?.name?.split(" ")[0]}!`}
            </h1>
            <p className="text-sm text-slate-300 mt-1">{lang === "hi" ? "आपका प्रीमियम डैशबोर्ड" : "Your premium dashboard"}</p>
          </div>
          <button onClick={logout} className="btn-secondary !py-2 !px-4">
            {t("nav.logout")}
          </button>
        </div>

        <div className="surface-panel p-4 rounded-2xl mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-100 text-sm">
              {profile?.is_available ? t("profile.available") : t("profile.unavailable")}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              {lang === "hi" ? "ग्राहक आपकी लाइव उपलब्धता देखेंगे" : "Customers can see your live availability"}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`relative w-14 h-7 rounded-full transition-colors ${profile?.is_available ? "bg-emerald-300" : "bg-slate-500"}`}
          >
            {toggling ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </span>
            ) : (
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  profile?.is_available ? "right-1" : "left-1"
                }`}
              />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="card text-center">
              <div className="mb-1 flex justify-center text-cyan-100">
                <Icon name={s.icon} className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-cyan-200">{s.value}</div>
              <div className="text-xs text-slate-300 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {profile && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-100 text-sm">{lang === "hi" ? "आपकी प्रोफ़ाइल" : "Your Profile"}</h2>
              <Link to="/contractor/edit" className="text-cyan-200 text-xs hover:underline">
                {lang === "hi" ? "संपादित करें" : "Edit"}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <img src={profile.photo_url || "/default-contractor.png"} alt={user?.name} className="w-14 h-14 rounded-xl object-cover border border-white/20" />
              <div>
                <p className="font-medium text-slate-100">{user?.name}</p>
                <p className="text-xs text-slate-300 capitalize">{profile.category?.replace("_", " ")}</p>
                <StarRating value={Math.round(ratingValue || 0)} readonly size="text-sm" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {profile.is_verified && <Badge type="verified" lang={lang} />}
              {profile.is_featured && <Badge type="featured" lang={lang} />}
              {profile.is_labour_group && <Badge type="labour_group" lang={lang} />}
              {profile.is_responsibility_model && <Badge type="responsibility" lang={lang} />}
              {!profile.is_verified && (
                <span className="inline-flex text-xs font-medium px-2 py-1 rounded-full bg-amber-300/20 text-amber-100 border border-amber-200/40">
                  <Icon name="pending" className="w-3.5 h-3.5 mr-1" />
                  {lang === "hi" ? "वेरिफिकेशन पेंडिंग" : "Verification Pending"}
                </span>
              )}
            </div>
            {!profile.is_verified && (
              <div className="mt-3 rounded-xl border border-amber-200/40 bg-amber-300/12 px-3 py-2">
                <p className="text-xs text-amber-100">
                  {lang === "hi"
                    ? "वेरिफिकेशन पेंडिंग है। सामान्यतः 24 घंटे में प्रोफाइल सत्यापित कर दी जाती है।"
                    : "Verification is pending. Profiles are usually reviewed within 24 hours."}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: lang === "hi" ? "प्रोफ़ाइल देखें" : "View My Profile", to: `/contractor/${profile?.id}`, icon: "user" },
            {
              label: lang === "hi" ? "प्रोफ़ाइल शेयर करें" : "Share Profile",
              to: "",
              icon: "link",
              onClick: () =>
                navigator.share?.({ title: user?.name, url: `${window.location.origin}/contractor/${profile?.id}` }),
            },
          ].map((a) => (
            a.onClick ? (
              <button key={a.label} type="button" onClick={a.onClick} className="card flex items-center gap-3 hover:border-cyan-200/70 transition-colors text-left">
                <Icon name={a.icon} className="w-6 h-6 text-cyan-100" />
                <span className="text-sm font-medium text-slate-100">{a.label}</span>
              </button>
            ) : (
              <Link key={a.label} to={a.to} className="card flex items-center gap-3 hover:border-cyan-200/70 transition-colors">
                <Icon name={a.icon} className="w-6 h-6 text-cyan-100" />
                <span className="text-sm font-medium text-slate-100">{a.label}</span>
              </Link>
            )
          ))}
        </div>
      </section>
    </div>
  );
}
