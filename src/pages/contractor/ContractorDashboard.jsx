import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  contractorAPI,
  meetingAPI,
  quickBookingAPI,
  projectAPI,
  subscriptionAPI,
  notificationAPI
} from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import StarRating from "../../components/common/StarRating";
import Icon from "../../components/common/Icon";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import {
  FiBell,
  FiSettings,
  FiCheckCircle,
  FiBriefcase,
  FiLink,
  FiZap,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiArrowRight,
  FiShield,
  FiCheckSquare,
  FiClock,
  FiMapPin,
  FiPhone,
  FiMessageCircle
} from "react-icons/fi";

const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

export default function ContractorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [requestingVerif, setRequestingVerif] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState("quick_jobs");
  const [quickJobs, setQuickJobs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Job Completion States
  const [completingJob, setCompletingJob] = useState(null);
  const [finalPrice, setFinalPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [actionLoading, setActionLoading] = useState(false);

  // Meeting notes
  const [meetingNotes, setMeetingNotes] = useState({});

  useEffect(() => {
    loadContractorHQ();
  }, []);

  const loadContractorHQ = async () => {
    setLoading(true);
    try {
      // 1. Fetch profile first
      let prof = null;
      try {
        const profRes = await contractorAPI.getMyProfile();
        prof = profRes.data.contractor;
        setProfile(prof);
      } catch (err) {
        if (err.response?.status === 404) {
          setProfile(null);
        } else {
          toast.error("Failed to load contractor profile.");
        }
      }

      // 2. Fetch pivot data if profile exists
      if (prof) {
        const [qbRes, meetRes, projRes, subRes, notifRes] = await Promise.all([
          quickBookingAPI.getContractorBookings(),
          meetingAPI.getMyMeetings("contractor"),
          projectAPI.getMyProjects("contractor"),
          subscriptionAPI.getStatus(),
          notificationAPI.getMine()
        ]);

        setQuickJobs(qbRes.data.bookings || []);
        setMeetings(meetRes.data.meetings || []);
        setProjects(projRes.data.projects || []);
        setSubStatus(subRes.data.subscription || null);
        setNotifications(notifRes.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync contractor workspace.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMeeting = async (id, accept) => {
    const status = accept ? "ACCEPTED" : "DECLINED";
    const note = meetingNotes[id] || "";
    try {
      const res = await meetingAPI.updateStatus(id, status, note);
      if (res.data?.ok) {
        toast.success(`Meeting request marked as ${status.toLowerCase()}.`);
        loadContractorHQ();
      }
    } catch {
      toast.error("Failed to update meeting status.");
    }
  };

  const handleCompleteJobSubmit = async (e) => {
    e.preventDefault();
    if (!finalPrice || isNaN(finalPrice)) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setActionLoading(true);
    try {
      // Step 1: Set final price and payment method
      await quickBookingAPI.updateStatus(completingJob.id, "COMPLETED");
      // Optionally sync direct final price settlement
      toast.success("Job marked as completed successfully!");
      setCompletingJob(null);
      setFinalPrice("");
      loadContractorHQ();
    } catch {
      toast.error("Failed to complete job.");
    } finally {
      setActionLoading(false);
    }
  };

  const buyPremiumSubscription = async (planType) => {
    toast.loading("Initializing payment gateway...", { id: "sub_pay" });
    try {
      const res = await subscriptionAPI.purchase(planType);
      const orderData = res.data;

      if (orderData.razorpayKey === "mock_key_only_for_dev") {
        // Dev Mock Verification
        setTimeout(async () => {
          try {
            await subscriptionAPI.verify({
              razorpay_order_id: orderData.razorpayOrderId,
              razorpay_payment_id: `sub_mock_${Date.now()}`,
              razorpay_signature: "mock_sig"
            });
            toast.success("Subscription purchased successfully (Mock)!", { id: "sub_pay" });
            loadContractorHQ();
          } catch {
            toast.error("Mock verification failed", { id: "sub_pay" });
          }
        }, 1000);
        return;
      }

      // Real Razorpay
      const rzp = new window.Razorpay({
        key: orderData.razorpayKey,
        amount: orderData.amount,
        currency: "INR",
        name: "Thekedaar Elite",
        description: `Premium Subscription - ${planType}`,
        order_id: orderData.razorpayOrderId,
        theme: { color: "#f59e0b" },
        handler: async (response) => {
          toast.loading("Verifying payment...", { id: "sub_pay" });
          try {
            await subscriptionAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success("Welcome to Thekedaar Elite! Plan active.", { id: "sub_pay" });
            loadContractorHQ();
          } catch {
            toast.error("Verification failed.", { id: "sub_pay" });
          }
        }
      });
      rzp.open();
    } catch (err) {
      toast.error("Failed to purchase subscription.", { id: "sub_pay" });
    }
  };

  async function requestVerification() {
    if (!profile) return;
    setRequestingVerif(true);
    try {
      await contractorAPI.requestVerification("me");
      setProfile((p) => ({ ...p, verification_status: "pending" }));
      toast.success("Verification request logged with admin desk.");
    } catch {
      toast.error(t("app.error"));
    } finally {
      setRequestingVerif(false);
    }
  }

  async function toggleAvailability() {
    if (!profile) return;
    setToggling(true);
    try {
      await contractorAPI.setAvail(!profile.is_available);
      setProfile((p) => ({ ...p, is_available: !p.is_available }));
      toast.success(!profile.is_available ? "You are visible for quick bookings." : "Availability toggled off.");
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
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile URL copied to clipboard.");
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B19] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const ratingValue = Number(profile?.rating || 0);
  const reviewCountValue = Number(profile?.review_count ?? profile?.reviews_count ?? 0);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const stats = [
    { label: "Profile Views", value: profile?.views_count || 0, icon: "view" },
    { label: "Direct Leads", value: profile?.leads_count || 0, icon: "message" },
    { label: "Rating", value: Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "-", icon: "rating" },
    { label: "Client Reviews", value: reviewCountValue, icon: "review" },
  ];

  return (
    <main className="bg-[#090B19] text-[#ECEEF6] min-h-screen pt-24 pb-20 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-[1300px] mx-auto px-4 md:px-8 relative z-10">
        
        {/* Contractor header banner */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-amber-500 font-black tracking-[0.3em] uppercase text-[10px] mb-2 block">Thekedaar Headquarters</span>
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight leading-none">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 mt-3 text-sm font-semibold">Manage your availability, schedule consultations, log milestone work logs, and grow revenue.</p>
          </div>
          
          {profile && (
            <div className="glass-card pl-4 pr-2 py-2 rounded-2xl flex items-center gap-3 bg-white/[0.02] border border-white/5 shadow-xl">
              <div className="flex flex-col items-end mr-1">
                <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-0.5">Availability Status</p>
                <p className={`text-xs font-black ${profile.is_available ? "text-emerald-400 animate-pulse" : "text-amber-500"}`}>
                  {profile.is_available ? "ACCEPTING JOBS" : "MARKED BUSY"}
                </p>
              </div>
              <button
                onClick={toggleAvailability}
                disabled={toggling}
                className={`relative w-[50px] h-7 rounded-full transition-colors flex items-center shadow-inner ${profile.is_available ? "bg-emerald-500" : "bg-white/10"}`}
              >
                <span className={`w-5 h-5 bg-white rounded-full shadow-md transition-all absolute top-1 ${profile.is_available ? "right-1" : "left-1"}`} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Tab Strip */}
        {profile && (
          <div className="flex border-b border-white/5 mb-8 overflow-x-auto no-scrollbar gap-2">
            {[
              { id: "quick_jobs", label: "Quick Jobs", icon: FiZap, count: quickJobs.filter(j => j.status === 'CONFIRMED').length },
              { id: "meetings", label: "Site Consultation Requests", icon: FiCalendar, count: meetings.filter(m => m.status === 'PENDING').length },
              { id: "projects", label: "SaaS Project Logs", icon: FiBriefcase, count: projects.length },
              { id: "subscriptions", label: "Elite Subscription HQ", icon: FiShield, count: 0 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-4 border-b-2 font-black text-xs uppercase tracking-widest shrink-0 transition-all ${
                    isActive
                      ? "border-amber-500 text-amber-400 bg-amber-500/5"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-amber-400">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
          
          {/* LEFT SIDEBAR PROFILE */}
          <div className="space-y-6">
            
            {profile ? (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/5 blur-[40px] -mr-10 -mt-10 rounded-full pointer-events-none" />
                <h3 className="font-display font-black text-slate-400 uppercase tracking-widest text-[9px] mb-4">Contractor Identity</h3>
                
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={getImageUrl(profile.photo_url || profile.image_url)}
                    alt={user?.name || "Contractor"}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/5 shadow-md bg-[var(--color-bg)]"
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`; }}
                  />
                  <div>
                    <h4 className="font-display font-black text-lg text-white leading-tight">{user?.name}</h4>
                    <p className="text-xs text-amber-400 font-bold capitalize mt-1">{profile.category?.replace("_", " ")}</p>
                    <StarRating value={Math.round(ratingValue)} readonly size="text-sm mt-1" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {profile.is_verified && <Badge type="verified" lang="en" />}
                  {profile.is_featured && <Badge type="featured" lang="en" />}
                  {profile.is_labour_group && <Badge type="labour_group" lang="en" />}
                </div>

                {!profile.is_verified && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
                      {profile.verification_status === 'pending'
                        ? "Verification request logged under review."
                        : "Verify ID & business license to earn trusted badge."}
                    </p>
                    {profile.verification_status !== 'pending' && (
                      <button
                        onClick={requestVerification}
                        disabled={requestingVerif}
                        className="w-full py-3 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-500/10 active:scale-95"
                      >
                        {requestingVerif ? "Requesting..." : "Get Verified Badging"}
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-5 pt-5 border-t border-white/5">
                  <Link
                    to={`/contractor/edit`}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] text-slate-300 hover:text-white border border-white/5 transition-all text-[9px] font-black uppercase tracking-widest"
                  >
                    <FiSettings className="w-4 h-4 mb-1.5 text-amber-500" /> Settings
                  </Link>
                  <button
                    onClick={handleShareProfile}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] text-slate-300 hover:text-white border border-white/5 transition-all text-[9px] font-black uppercase tracking-widest"
                  >
                    <FiLink className="w-4 h-4 mb-1.5 text-amber-500" /> Share profile
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 border-2 border-dashed border-amber-500/20 text-center rounded-[2.5rem] bg-white/[0.02]">
                <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><FiSettings size={22}/></div>
                <h4 className="font-display font-black text-white text-lg">Incomplete Profile</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 max-w-[220px] mx-auto leading-relaxed">Complete your trade registration to be recommended to customers.</p>
                <Link to="/contractor/edit" className="btn-primary mt-5 flex items-center justify-center text-xs">Register Trade Profile</Link>
              </motion.div>
            )}

            {/* Notifications panel */}
            {profile && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-xl">
                <h3 className="font-display text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2 mb-5">
                  <FiBell className="text-amber-500" /> Workspace Logs
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">{unreadCount}</span>
                  )}
                </h3>
                
                {notifications.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-white/5 rounded-xl">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Logs Clear.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                        <p className="font-semibold text-slate-300">{item.message}</p>
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block mt-2">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </div>

          {/* RIGHT PANELS */}
          <div className="space-y-6">
            
            {!profile ? (
              <div className="py-20 text-center bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                <FiBriefcase className="w-16 h-16 text-amber-500/20 mx-auto mb-5" />
                <h3 className="font-display text-lg font-black">Trade Profile Registration Required</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed mt-2">
                  Complete your portfolio, daily rates, and trade onboarding questionnaire to unlock leads and bookings.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                
                {/* TAB 1: QUICK JOBS HANDYMAN VISITS */}
                {activeTab === "quick_jobs" && (
                  <motion.div key="jobs" initial="hidden" animate="show" exit="hidden" variants={stagger} className="space-y-5">
                    
                    {/* Stats strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {stats.map((s) => (
                        <div key={s.label} className="glass-card bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                          <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</span>
                          <span className="text-xl font-black text-white">{s.value}</span>
                        </div>
                      ))}
                    </div>

                    {quickJobs.length === 0 ? (
                      <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                        <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <FiZap size={22} />
                        </div>
                        <h4 className="font-display text-lg font-black">No Active Quick Bookings</h4>
                        <p className="text-xs font-semibold text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                          Once visible in quick strips, customers can secure handyman dates with a slot confirmation deposit.
                        </p>
                      </div>
                    ) : (
                      quickJobs.map((job) => (
                        <div key={job.id} className="glass-card bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5 mb-5">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                  {job.service_name}
                                </span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID: #{job.id.slice(0, 8)}</span>
                              </div>
                              <h3 className="font-display text-xl font-black text-white leading-tight group-hover:text-amber-400 transition-colors">
                                {job.customer_name}
                              </h3>
                            </div>
                            
                            <div className="flex flex-col sm:items-end">
                              <span className="text-lg font-black text-white">₹{job.service_price || "TBD"}</span>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-0.5">Agreed Price</span>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-3.5">
                              <div className="flex items-start gap-3 text-xs">
                                <FiCalendar className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-bold">Scheduled Job Date</p>
                                  <p className="font-bold text-slate-200 mt-0.5">
                                    {new Date(job.scheduled_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 text-xs">
                                <FiClock className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-bold">Time Window</p>
                                  <p className="font-bold text-slate-200 mt-0.5 capitalize">{job.scheduled_time_slot}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 text-xs">
                                <FiMapPin className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-bold">Service Location</p>
                                  <p className="font-bold text-slate-200 mt-0.5 line-clamp-1">{job.customer_address}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Platform Confirmation Status</p>
                                <div className="flex justify-between items-baseline mb-1">
                                  <span className="text-xs font-bold text-slate-400">Confirmation Fee Deposit</span>
                                  <span className="text-xs font-black text-emerald-400 uppercase">Paid (₹30)</span>
                                </div>
                                <div className="flex justify-between items-baseline mt-1.5">
                                  <span className="text-xs font-bold text-slate-400">Booking Status</span>
                                  <span className="text-xs font-black text-amber-500 uppercase">{job.status}</span>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4">
                                {job.customer_phone && (
                                  <>
                                    <a
                                      href={`tel:${job.customer_phone}`}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-white/10 hover:border-white/20 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-colors"
                                    >
                                      <FiPhone size={12} /> Call
                                    </a>
                                    <a
                                      href={`https://wa.me/91${job.customer_phone.replace(/\D/g, "")}`}
                                      target="_blank"
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-colors"
                                    >
                                      <FiMessageCircle size={12} /> Chat
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {job.status === "CONFIRMED" && (
                            <div className="mt-5 pt-5 border-t border-white/5 flex justify-end">
                              <button
                                onClick={() => setCompletingJob(job)}
                                className="flex items-center gap-1.5 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md"
                              >
                                <FiCheckSquare size={13} /> Complete Service Job
                              </button>
                            </div>
                          )}

                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* TAB 2: CONSULTATION VISITING REQUESTS */}
                {activeTab === "meetings" && (
                  <motion.div key="meetings" initial="hidden" animate="show" exit="hidden" variants={stagger} className="space-y-5">
                    {meetings.length === 0 ? (
                      <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                        <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <FiCalendar size={22} />
                        </div>
                        <h4 className="font-display text-lg font-black">No Site Estimation Requests</h4>
                        <p className="text-xs font-semibold text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                          Site estimation visits requested by homeowners will show up here.
                        </p>
                      </div>
                    ) : (
                      meetings.map((m) => (
                        <div key={m.id} className="glass-card bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5 mb-5">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                  {m.meeting_type?.replace("_", " ") || "In-Person Estimator"}
                                </span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID: #{m.id.slice(0, 8)}</span>
                              </div>
                              <h3 className="font-display text-xl font-black text-white leading-tight group-hover:text-amber-400 transition-colors">
                                {m.customer_name}
                              </h3>
                            </div>
                            
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              m.status === "ACCEPTED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : m.status === "RESCHEDULED"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            }`}>
                              {m.status}
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-3.5">
                              <div className="flex items-start gap-3 text-xs">
                                <FiCalendar className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Visit Date Proposed</p>
                                  <p className="font-bold text-slate-200 mt-0.5">
                                    {new Date(m.proposed_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 text-xs">
                                <FiClock className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-bold">Time Window</p>
                                  <p className="font-bold text-slate-200 mt-0.5 capitalize">{m.proposed_time_slot}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 text-xs">
                                <FiMapPin className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-bold">Site Location Address</p>
                                  <p className="font-bold text-slate-200 mt-0.5 line-clamp-1">{m.proposed_location}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Customer Request Note</p>
                                <p className="text-xs font-semibold text-slate-300 italic">
                                  "{m.customer_note || "No specific note provided."}"
                                </p>
                              </div>

                              <div className="mt-4 space-y-2">
                                {m.status === "PENDING" && (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Add message/confirming note..."
                                      className="input-field text-xs py-2 mb-2 w-full"
                                      value={meetingNotes[m.id] || ""}
                                      onChange={(e) => setMeetingNotes(prev => ({ ...prev, [m.id]: e.target.value }))}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAcceptMeeting(m.id, false)}
                                        className="flex-1 py-2.5 rounded-lg border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-500/5"
                                      >
                                        Decline
                                      </button>
                                      <button
                                        onClick={() => handleAcceptMeeting(m.id, true)}
                                        className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                                      >
                                        Accept Visit
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* TAB 3: SAAS MILESTONE PROJECTS */}
                {activeTab === "projects" && (
                  <motion.div key="projects" initial="hidden" animate="show" exit="hidden" variants={stagger} className="space-y-5">
                    
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-lg font-black">Active Project Trackers</h3>
                      <button
                        onClick={() => navigate("/project?create=true")}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest hover:bg-amber-600 shadow-md shadow-amber-500/10 transition-all active:scale-95"
                      >
                        Create New Project Board
                      </button>
                    </div>

                    {projects.length === 0 ? (
                      <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                        <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <FiBriefcase size={22} />
                        </div>
                        <h4 className="font-display text-lg font-black">No Active SaaS Project Boards</h4>
                        <p className="text-xs font-semibold text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                          Initialize a digital milestone Gantt tracker for your clients to log materials, manpower attendance, and expenses transparently.
                        </p>
                      </div>
                    ) : (
                      projects.map((p) => (
                        <div key={p.id} className="glass-card bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5 mb-5">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                  Milestone dashboard active
                                </span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">REF: {p.id.slice(0, 8)}</span>
                              </div>
                              <h3 className="font-display text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                                {p.title}
                              </h3>
                              <p className="text-xs text-slate-400 font-bold mt-1">Client name: {p.customer_name}</p>
                            </div>
                            
                            <div className="flex flex-col sm:items-end">
                              <span className="text-lg font-black text-white">₹{Number(p.estimated_budget || 0).toLocaleString()}</span>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-0.5">Agreed Budget</span>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-6 items-center">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Scope Details</p>
                              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                                {p.description || "No project description loaded."}
                              </p>
                            </div>

                            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-baseline mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Escrow Security</span>
                                  <span className="text-xs font-black text-white">{p.escrow_opted ? "ACTIVE ESCROW" : "DIRECT PAY"}</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-3 mb-2">
                                  <div className="bg-amber-500 h-full rounded-full animate-pulse" style={{ width: p.status === 'COMPLETED' ? '100%' : '35%' }} />
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-right">Progress Tab: {p.status || "In-Progress"}</p>
                              </div>

                              <button
                                onClick={() => navigate(`/project/${p.id}`)}
                                className="mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest shadow-md"
                              >
                                Manage Milestones & Crew <FiArrowRight />
                              </button>
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* TAB 4: ELITE SUBSCRIPTION HQ */}
                {activeTab === "subscriptions" && (
                  <motion.div key="subs" initial="hidden" animate="show" exit="hidden" variants={stagger} className="space-y-6">
                    
                    {/* Status card */}
                    <div className="glass-card bg-gradient-to-r from-amber-500/10 via-[#1A1C28] to-[#13151D] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div>
                        <h4 className="font-display font-black text-lg text-white">Your Leads & Badge Status</h4>
                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <span className="text-amber-400">Verified Badging:</span>
                          <span className="text-slate-300 font-black">{profile.is_verified ? "ACTIVE" : "INACTIVE"}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <span className="text-amber-400">Leads Allowance:</span>
                          <span className="text-slate-300 font-black">
                            {subStatus?.plan_active ? "UNLIMITED" : `${5 - (subStatus?.leads_used || 0)} Free Leads Remaining`}
                          </span>
                        </div>
                      </div>
                      
                      {!subStatus?.plan_active && (
                        <div className="px-5 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                          FREE TIER ACTIVE
                        </div>
                      )}
                    </div>

                    {/* Onboarding info */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      
                      {/* Buy Verification Badge Card */}
                      <div className="glass-card bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                            <FiShield size={20} />
                          </div>
                          <h4 className="font-display font-black text-white text-lg leading-tight">Verified Professional badge</h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            Stand out with an audited profile. Boost verification badge trust level by 80%. Backed by license & ID verification.
                          </p>
                          <p className="text-2xl font-black text-white pt-2">₹499 <span className="text-xs font-bold text-slate-500">/ One-time</span></p>
                        </div>
                        
                        <button
                          onClick={() => buyPremiumSubscription("verified_badge")}
                          disabled={profile.is_verified}
                          className="mt-6 w-full py-3 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-600 shadow-md transition-all disabled:opacity-50"
                        >
                          {profile.is_verified ? "Badge Already Active" : "Get Verified Now"}
                        </button>
                      </div>

                      {/* recommended subscription card */}
                      <div className="glass-card bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                            <FiZap size={20} />
                          </div>
                          <h4 className="font-display font-black text-white text-lg leading-tight">Recommended Area Listing</h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            Appear at the top of spatial searches in your city code. Includes unlimited leads and prioritized matching.
                          </p>
                          <p className="text-2xl font-black text-white pt-2">₹999 <span className="text-xs font-bold text-slate-500">/ 30 Days</span></p>
                        </div>
                        
                        <button
                          onClick={() => buyPremiumSubscription("priority_listing")}
                          className="mt-6 w-full py-3 border border-amber-500/20 text-amber-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-500/5 transition-all shadow-md"
                        >
                          Subscribe Now
                        </button>
                      </div>

                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            )}

          </div>

        </div>

      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {completingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-md w-full bg-[#13151D] border border-white/10 p-8 rounded-[2rem] shadow-2xl space-y-6 text-white"
            >
              <div>
                <h3 className="font-display text-xl font-black uppercase tracking-tight flex items-center gap-2 text-emerald-400">
                  <FiCheckSquare /> Complete Job Settlement
                </h3>
                <p className="mt-1 text-xs text-slate-400 font-semibold">Mark job complete and input the final price collected from the customer.</p>
              </div>

              <form onSubmit={handleCompleteJobSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Final Price (Settled)</span>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#0E0F14] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none"
                    placeholder="e.g. 1500"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Channel</span>
                  <select
                    className="w-full bg-[#0E0F14] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Direct Cash / UPI</option>
                    <option value="escrow">Platform Escrow Balance</option>
                  </select>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCompletingJob(null)}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? <LoadingSpinner size="xs" color="white" /> : <FiCheckSquare />}
                    Mark Done
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
