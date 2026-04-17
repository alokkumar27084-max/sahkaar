import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { contractorAPI, bookingAPI, notificationAPI } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import StarRating from "../../components/common/StarRating";
import Icon from "../../components/common/Icon";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import { FiBell, FiSettings, FiCheckCircle, FiBriefcase, FiLink } from "react-icons/fi";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

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
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadProfile();
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  function loadBookings() {
    Promise.all([bookingAPI.getMyBookings(), notificationAPI.getMine()])
      .then(([bookingsRes, notificationsRes]) => {
        setBookings(bookingsRes.data.data.bookings || []);
        setNotifications(notificationsRes.data.notifications || []);
      })
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
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const ratingValue = Number(profile?.rating || 0);
  const reviewCountValue = Number(profile?.review_count ?? profile?.reviews_count ?? 0);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const stats = [
    { label: "Profile Views", value: profile?.views_count || 0, icon: "view" },
    { label: "WhatsApp Leads", value: profile?.leads_count || 0, icon: "message" },
    { label: "Rating", value: Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "-", icon: "rating" },
    { label: "Reviews", value: reviewCountValue, icon: "review" },
  ];

  return (
    <main className="bg-[var(--color-bg)] min-h-screen pt-24 pb-20 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        {/* Premium Header Area */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
                <span className="text-[var(--color-primary)] font-bold tracking-[0.2em] uppercase text-xs mb-2 block">Contractor HQ</span>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--color-heading)] tracking-tight">
                    Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{user?.name?.split(' ')[0]}</span>
                </h1>
                <p className="text-[var(--color-muted)] mt-2 font-medium">Manage your availability, jobs, and digital presence.</p>
            </div>
            
            <div className="glass-card pl-4 pr-1 py-1 rounded-full flex items-center gap-3">
                <div className="flex flex-col items-end mr-2">
                    <p className="text-[10px] font-bold text-[var(--color-muted)] tracking-wider uppercase mb-0.5">Availability</p>
                    <p className={`text-xs font-bold ${profile?.is_available ? "text-emerald-500" : "text-amber-500"}`}>
                        {profile?.is_available ? "Visible to customers" : "Marked unavailable"}
                    </p>
                </div>
                <button
                    onClick={toggleAvailability}
                    disabled={toggling}
                    className={`relative w-[60px] h-8 rounded-full transition-colors flex items-center shadow-inner ${profile?.is_available ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                >
                    {toggling ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                    </span>
                    ) : (
                    <span className={`w-6 h-6 bg-white rounded-full shadow-md transition-all absolute top-1 ${profile?.is_available ? "right-1" : "left-1"}`} />
                    )}
                </button>
            </div>
        </motion.div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-8 relative z-10">
            {/* LEFT COLUMN: Profile & Notifications */}
            <div className="space-y-6">
                
                {/* Profile Identity Card */}
                {profile ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-[40px] -mr-10 -mt-10 rounded-full"></div>
                        
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h2 className="font-semibold text-[var(--color-heading)] text-sm tracking-wide uppercase">Your Profile</h2>
                            <Link to="/contractor/edit" className="text-[var(--color-primary)] text-xs font-bold flex items-center gap-1 hover:underline">
                                <FiSettings /> Edit
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <img
                                src={getImageUrl(profile.photo_url || profile.image_url)}
                                alt={user?.name || "Contractor"}
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--color-surface)] shadow-sm"
                                onError={(e) => { e.currentTarget.src = "/default-contractor.png"; }}
                            />
                            <div>
                                <p className="font-display font-bold text-lg text-[var(--color-heading)] leading-tight">{user?.name || "Contractor"}</p>
                                <p className="text-xs text-[var(--color-primary)] font-medium capitalize mt-0.5">{profile.category?.replace("_", " ") || "General"}</p>
                                <StarRating value={Math.round(ratingValue || 0)} readonly size="text-sm shadow-sm opacity-90 mt-1 block" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                            {profile.is_verified && <Badge type="verified" lang="en" />}
                            {profile.is_featured && <Badge type="featured" lang="en" />}
                            {profile.is_labour_group && <Badge type="labour_group" lang="en" />}
                            {profile.tier && profile.tier !== 'standard' && <Badge type={`tier_${profile.tier}`} lang="en" />}
                        </div>

                        {!profile.is_verified && (
                            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col gap-2 relative z-10">
                                <p className="text-[11px] text-[var(--color-muted)] font-medium leading-relaxed">
                                    {profile.verification_status === 'pending'
                                    ? "Your verification is under review by our team."
                                    : profile.verification_status === 'rejected'
                                        ? "Your last request was rejected. Update profile and try again."
                                        : "Request verification to get the trusted badge."}
                                </p>
                                {profile.verification_status !== 'pending' && (
                                    <button onClick={requestVerification} disabled={requestingVerif} className="btn-secondary text-xs w-full py-2">
                                        {requestingVerif ? "Requesting..." : "Get Verified"}
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[var(--color-border)] relative z-10">
                            <Link to={`/contractor/${profile.id}`} className="flex flex-col items-center justify-center p-2 rounded-xl bg-[var(--color-bg)] text-[var(--color-heading)] text-[11px] font-bold tracking-wide hover:border-[var(--color-primary)] transition-colors border border-[var(--color-border)]">
                                <Icon name="user" className="w-4 h-4 text-[var(--color-primary)] mb-1" />
                                View Profile
                            </Link>
                            <button onClick={handleShareProfile} className="flex flex-col items-center justify-center p-2 rounded-xl bg-[var(--color-bg)] text-[var(--color-heading)] text-[11px] font-bold tracking-wide hover:border-[var(--color-primary)] transition-colors border border-[var(--color-border)]">
                                <FiLink className="w-4 h-4 text-[var(--color-primary)] mb-1" />
                                Share Link
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 border-dashed border-amber-500/30">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 text-amber-500"><FiSettings size={20}/></div>
                        <p className="text-sm text-[var(--color-heading)] font-semibold mb-1">Incomplete Profile</p>
                        <p className="text-xs text-[var(--color-muted)] mb-4">Complete your setup to be fully visible to customers.</p>
                        <Link to="/contractor/edit" className="btn-primary flex items-center justify-center text-xs">Complete Setup</Link>
                    </motion.div>
                )}

                {/* Notifications Module */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-display text-base font-bold text-[var(--color-heading)] uppercase tracking-wide flex items-center gap-2">
                            <FiBell className="text-[var(--color-primary)]" /> Updates
                            {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{unreadCount}</span>}
                        </h3>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="py-6 text-center border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-bg)]/50">
                            <p className="text-[var(--color-muted)] text-xs font-medium">No new updates.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {notifications.slice(0, 4).map((item) => (
                                    <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className={`p-3 rounded-lg border-l-2 transition-colors ${item.is_read ? "border-transparent bg-[var(--color-surface)]/30" : "border-indigo-500 bg-indigo-500/5 shadow-sm"}`}
                                    >
                                        <p className="text-[13px] font-medium text-[var(--color-heading)] leading-snug">{item.message}</p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)] opacity-70">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            {!item.is_read && (
                                                <button onClick={async () => {
                                                    await notificationAPI.markRead(item.id);
                                                    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                                                }} className="text-[10px] font-bold text-[var(--color-primary)] uppercase">
                                                    Mark Read
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {notifications.some((n) => !n.is_read) && (
                                <button onClick={async () => {
                                    await notificationAPI.markAllRead();
                                    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
                                }} className="text-xs font-semibold text-[var(--color-primary)] hover:underline mt-2 block w-full text-center">
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* RIGHT COLUMN: Stats, Bookings & Portfolio */}
            <div className="space-y-8">
                
                {/* Stats Grid */}
                <motion.div initial={"hidden"} animate={"show"} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((s) => (
                        <motion.div variants={fadeUp} key={s.label} className="glass-card p-4 text-center rounded-2xl flex flex-col justify-center items-center">
                            <div className="mb-2 w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                <Icon name={s.icon} className="w-5 h-5" />
                            </div>
                            <div className="text-2xl font-black text-[var(--color-heading)]">{s.value}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-muted)] mt-1">{s.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Incoming Jobs */}
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-display text-2xl font-bold text-[var(--color-heading)] tracking-tight">Active Jobs</h2>
                    </div>

                    {loadingBookings ? (
                        <div className="space-y-4">
                            {[1].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="glass-card p-10 text-center flex flex-col items-center justify-center border-dashed">
                            <div className="w-14 h-14 rounded-full bg-[var(--color-border)] flex items-center justify-center mb-4"><FiBriefcase className="text-[var(--color-muted)]" size={24} /></div>
                            <p className="text-[var(--color-heading)] font-semibold mb-1">No active bookings</p>
                            <p className="text-[var(--color-muted)] text-sm mb-4">You have not received any new jobs yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map(book => (
                                <div key={book.id} className="glass-card p-0 overflow-hidden">
                                    <div className="bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-bg)] p-5 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">
                                                    {book.service_tier === "macro" ? "BADA KAAM" : "CHHOTA KAAM"}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-[var(--color-heading)]">{book.service_category}</h3>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-xl font-black text-[var(--color-heading)]">₹{Number(book.amount).toLocaleString()}</p>
                                            <div className="flex gap-2 justify-start sm:justify-end mt-1">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${book.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                                    {book.status}
                                                </span>
                                                {book.payment_status && (
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        book.payment_status === 'IN_ESCROW' ? 'bg-amber-500/10 text-amber-600' :
                                                        book.payment_status === 'RELEASED' ? 'bg-emerald-500/10 text-emerald-600' :
                                                        'bg-slate-500/10 text-slate-600'
                                                    }`}>
                                                        {book.payment_status.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-[var(--color-bg)]/50">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] mb-1">Customer</p>
                                                <p className="text-sm font-semibold text-[var(--color-heading)]">{book.customer_name}</p>
                                                <p className="text-xs text-[var(--color-muted)] mt-0.5">{book.customer_phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] mb-1">Location Details</p>
                                                <p className="text-xs text-[var(--color-body)] line-clamp-2 leading-relaxed">{book.location_address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Portfolio Management */}
                {profile && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-6 md:p-8">
                        <h2 className="font-display text-xl font-bold text-[var(--color-heading)] tracking-tight mb-6">Portfolio Gallery</h2>
                        
                        <form onSubmit={handlePortfolioUpload} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-heading)] mb-4">Add New Showcase</h3>
                            <div className="flex flex-col gap-3">
                                <label className="flex items-center justify-center w-full border-2 border-dashed border-[var(--color-primary)]/40 rounded-xl p-4 hover:border-[var(--color-primary)] transition-colors cursor-pointer bg-[var(--color-bg)]">
                                    <span className="text-sm font-medium text-[var(--color-primary)] flex items-center gap-2">
                                        <FiCheckCircle /> {selectedFile ? selectedFile.name : "Select High-Quality Image"}
                                    </span>
                                    <input type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" />
                                </label>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <input type="text" placeholder="Project Title (e.g., Luxury Kitchen)" value={portfolioTitle} onChange={(e) => setPortfolioTitle(e.target.value)} className="input-field" />
                                    <button type="submit" disabled={uploadingPortfolio || !selectedFile} className="btn-primary w-full h-auto">
                                        {uploadingPortfolio ? "Uploading..." : "Upload Showcase"}
                                    </button>
                                </div>
                                <textarea placeholder="Add a short description about this work..." value={portfolioDesc} onChange={(e) => setPortfolioDesc(e.target.value)} className="input-field resize-none" rows={2} />
                            </div>
                        </form>

                        {profile.portfolio_items?.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {profile.portfolio_items.map((item) => (
                                <div key={item.id} className="relative group rounded-xl overflow-hidden shadow-sm aspect-square bg-slate-100 dark:bg-slate-800">
                                    <img src={getImageUrl(item.image_url)} alt={item.title || "Portfolio"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <button onClick={() => handleDeletePortfolio(item.id)} className="absolute top-2 right-2 bg-rose-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-600">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                    {(item.title || item.description) && (
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                                        {item.title && <p className="text-sm font-bold text-white truncate">{item.title}</p>}
                                        {item.description && <p className="text-[11px] text-white/80 line-clamp-2 mt-1 leading-snug">{item.description}</p>}
                                    </div>
                                    )}
                                </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center bg-[var(--color-surface)]/50">
                                <span className="w-12 h-12 rounded-full bg-[var(--color-bg)] flex items-center justify-center mb-3">
                                    <Icon name="image" className="w-5 h-5 text-[var(--color-muted)]" />
                                </span>
                                <p className="text-center text-[var(--color-heading)] font-bold text-sm">Empty Gallery</p>
                                <p className="text-center text-[var(--color-muted)] font-medium text-xs mt-1 max-w-[200px]">Upload past work to build trust with customers.</p>
                            </div>
                        )}
                    </motion.section>
                )}
            </div>
        </div>
      </div>
    </main>
  );
}
