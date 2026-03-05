import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI, bookingAPI } from "../../services/api";
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
  const [requestingVerif, setRequestingVerif] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDesc, setPortfolioDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    loadProfile();
    loadBookings();
  }, [t]);

  function loadBookings() {
    bookingAPI.getMyBookings()
      .then((res) => setBookings(res.data.data.bookings || []))
      .catch(() => { })
      .finally(() => setLoadingBookings(false));
  }

  function loadProfile() {
    contractorAPI
      .getMyProfile()
      .then((res) => setProfile(res.data.contractor))
      .catch(() => toast.error(t("app.error")))
      .finally(() => setLoading(false));
  }

  async function requestVerification() {
    if (!profile) return;
    setRequestingVerif(true);
    try {
      await contractorAPI.requestVerification("me");
      setProfile((p) => ({ ...p, verification_status: "pending" }));
      toast.success("Verification requested successfully");
    } catch {
      toast.error(t("app.error"));
    } finally {
      setRequestingVerif(false);
    }
  }

  async function handlePortfolioUpload(e) {
    e.preventDefault();
    if (!selectedFile) return toast.error("Please select an image");
    setUploadingPortfolio(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    if (portfolioTitle) formData.append("title", portfolioTitle);
    if (portfolioDesc) formData.append("description", portfolioDesc);

    try {
      await contractorAPI.addPortfolioItem("me", formData);
      toast.success("Portfolio item added");
      setPortfolioTitle("");
      setPortfolioDesc("");
      setSelectedFile(null);
      loadProfile();
    } catch {
      toast.error("Failed to upload portfolio item");
    } finally {
      setUploadingPortfolio(false);
    }
  }

  async function handleDeletePortfolio(itemId) {
    if (!window.confirm("Delete this portfolio item?")) return;
    try {
      await contractorAPI.removePortfolioItem("me", itemId);
      setProfile((p) => ({
        ...p,
        portfolio_items: p.portfolio_items.filter((i) => i.id !== itemId),
      }));
      toast.success("Portfolio item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  }

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
              {profile.tier && profile.tier !== 'standard' && <Badge type={`tier_${profile.tier}`} lang="en" />}
            </div>

            {!profile.is_verified && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111827]">Get Verified</p>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] sm:max-w-xs">
                    {profile.verification_status === 'pending'
                      ? "Your verification is under review by our team."
                      : profile.verification_status === 'rejected'
                        ? "Your last request was rejected. Please update your profile and try again."
                        : "Request verification to build trust with customers."}
                  </p>
                </div>
                {profile.verification_status !== 'pending' && (
                  <button
                    onClick={requestVerification}
                    disabled={requestingVerif}
                    className="btn-primary text-xs py-1.5 px-3 min-h-0 whitespace-nowrap"
                  >
                    {requestingVerif ? "Requesting..." : "Request"}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-800">Your contractor profile is incomplete. Update your profile to appear in search.</p>
            <Link to="/contractor/edit" className="inline-flex mt-2 text-sm font-semibold text-[#1E3A8A] hover:underline">
              Complete Profile
            </Link>
          </div>
        )}

        {profile && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-[#111827] text-sm mb-3">Incoming Jobs & Bookings</h2>
            {loadingBookings ? (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed mb-4">Loading bookings...</p>
            ) : bookings.length > 0 ? (
              <div className="space-y-3 mb-4 mt-2">
                {bookings.map(b => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-[#111827]">{b.service_category} - ₹{b.amount}</p>
                      <p className="text-xs text-slate-600 mt-1">Customer: {b.customer_name} ({b.customer_phone})</p>
                      <p className="text-xs text-slate-600 mt-0.5 max-w-xs truncate" title={b.location_address}>Location: {b.location_address}</p>
                    </div>
                    <div className="text-right flex flex-col items-start sm:items-end">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {b.status}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">{new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed mb-4">No incoming bookings yet.</p>
            )}

            <div className="border-t border-slate-100 my-4"></div>

            <h2 className="font-semibold text-[#111827] text-sm mb-3">Portfolio & Past Work</h2>

            <form onSubmit={handlePortfolioUpload} className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-700">Add New Work</h3>
              <div className="flex flex-col gap-2">
                <input type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[#E0F2FE] file:text-[#0284C7] hover:file:bg-blue-100 transition-colors cursor-pointer w-full" />
                <input type="text" placeholder="Title (e.g., Kitchen Remodel)" value={portfolioTitle} onChange={(e) => setPortfolioTitle(e.target.value)} className="input-field text-sm" />
                <textarea placeholder="Short description..." value={portfolioDesc} onChange={(e) => setPortfolioDesc(e.target.value)} className="input-field text-sm resize-none" rows={2} />
              </div>
              <button type="submit" disabled={uploadingPortfolio || !selectedFile} className="btn-primary text-sm w-full py-2">
                {uploadingPortfolio ? "Uploading..." : "Add Portfolio Item"}
              </button>
            </form>

            {profile.portfolio_items?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profile.portfolio_items.map((item) => (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-200">
                    <img src={getImageUrl(item.image_url)} alt={item.title || "Portfolio"} className="w-full h-32 object-cover" />
                    <button onClick={() => handleDeletePortfolio(item.id)} className="absolute top-2 right-2 bg-white/90 text-red-600 w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                    {(item.title || item.description) && (
                      <div className="absolute bottom-0 inset-x-0 bg-white/95 p-2 backdrop-blur-sm border-t border-slate-200">
                        {item.title && <p className="text-xs font-semibold text-[#111827] truncate">{item.title}</p>}
                        {item.description && <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">No portfolio items yet.</p>
            )}
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
