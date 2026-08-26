import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiGrid,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUpload,
  FiUser,
  FiZap,
  FiAward,
  FiLock,
  FiDollarSign
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { authAPI, cooperativeAPI, subscriptionAPI } from "../../services/api";
import { CATEGORIES } from "../../utils/constants";
import SEOHead from "../../components/common/SEOHead";

const STEPS = [
  { id: 1, label: "Trade & Identity" },
  { id: 2, label: "Cooperative Affiliation" },
  { id: 3, label: "Document Uploads" },
  { id: 4, label: "Membership Plan" },
];

export default function ContractorRegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isHi = lang === "hi";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [societies, setSocieties] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    category: "electrical",
    daily_rate: 450,
    experience_years: 3,
    location_text: "Bhopal, Madhya Pradesh",
    society_id: "",
    member_registration_no: "",
    skill_certification_body: "NCCT & State Skill Development Mission",
    id_document_type: "Aadhaar / National ID",
    id_proof_url: "",
    certificate_url: "",
    cooperative_card_url: "",
    photo_url: "",
    selected_plan: "free", // 'free', 'verified_badge', 'priority_listing', 'premium'
  });

  // Mock Upload Progress State
  const [uploadingDoc, setUploadingDoc] = useState(null);

  useEffect(() => {
    cooperativeAPI
      .getSocieties()
      .then((res) => {
        if (res.data?.ok) {
          setSocieties(res.data.data || []);
          if (res.data.data?.[0]) {
            setFormData((prev) => ({ ...prev, society_id: res.data.data[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Simulated Instant Document Upload for Clean UX
  const handleFileUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(field);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [field]: reader.result }));
      setUploadingDoc(null);
      toast.success(`${field.replace(/_/g, " ")} uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim()) return toast.error("Please enter your full name");
      if (!formData.phone.trim() || formData.phone.length < 10) return toast.error("Please enter a valid 10-digit phone number");
      if (!formData.password || formData.password.length < 6) return toast.error("Password must be at least 6 characters");
    } else if (step === 2) {
      if (!formData.member_registration_no.trim()) {
        // Auto generate if worker doesn't remember their cooperative ID right away
        setFormData((prev) => ({ ...prev, member_registration_no: `SK-MST-${Math.floor(100000 + Math.random() * 900000)}` }));
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        password: formData.password,
        role: "worker", // Normalized Master role
        business_name: `Master ${formData.name.trim()} (${formData.category.replace(/_/g, " ")})`,
        category: formData.category,
        categories: [formData.category],
        daily_rate: Number(formData.daily_rate) || 450,
        experience_years: Number(formData.experience_years) || 3,
        location_text: formData.location_text || "Bhopal, Madhya Pradesh",
        lat: Number(formData.lat || 23.2599),
        lng: Number(formData.lng || 77.4126),
        latitude: Number(formData.lat || 23.2599),
        longitude: Number(formData.lng || 77.4126),
        society_id: formData.society_id || undefined,
        member_registration_no: formData.member_registration_no || `SK-MST-${Math.floor(100000 + Math.random() * 900000)}`,
        skill_certification_body: formData.skill_certification_body,
        id_document_type: formData.id_document_type,
        id_proof_url: formData.id_proof_url || null,
        certificate_url: formData.certificate_url || null,
        cooperative_card_url: formData.cooperative_card_url || null,
        photo_url: formData.photo_url || null,
        service_type: "both",
      };

      const res = await authAPI.register(payload);

      if (res.data?.ok) {
        toast.success(
          "Master Registration Submitted! Federation Admins will review your documents."
        );
        // If a paid subscription was selected, trigger instant subscription purchase
        if (formData.selected_plan && formData.selected_plan !== "free") {
          try {
            await subscriptionAPI.purchase(formData.selected_plan);
          } catch (e) {
            /* non-blocking */
          }
        }
        navigate("/contractor/dashboard");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6">
      <SEOHead
        title="सहकार मास्टर रजिस्ट्रेशन — Join as a Verified Master | SahKaar"
        description="Register as a Master Artisan with your Cooperative Federation. Submit documents for official verification, get recommended to customers, and keep 100% of your earnings."
      />

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold">
            <FiAward className="w-3.5 h-3.5" />
            <span>{isHi ? "सहकार मास्टर कारीगर मंच" : "SahKaar Master Partner Portal"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {isHi ? "मास्टर कारीगर के रूप में रजिस्टर करें" : "Register as a SahKaar Master"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            {isHi
              ? "अपनी सहकारी समिति से जुड़ें, अपने दस्तावेज़ जमा करें और सत्यापित मास्टर बैज प्राप्त करें।"
              : "Affiliate with your Cooperative Society, upload credentials for Federation verification, and get direct booking leads."}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`p-2.5 rounded-xl text-center transition-all ${
                step === s.id
                  ? "bg-slate-900 text-white font-extrabold shadow-sm"
                  : step > s.id
                  ? "bg-emerald-50 text-emerald-700 font-bold"
                  : "bg-slate-50 text-slate-400 font-semibold"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider">Step {s.id}</div>
              <div className="text-xs truncate">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
          
          {/* ═══════ STEP 1: IDENTITY & TRADE ═══════ */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h2 className="text-lg font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                1. Personal Details & Master Trade
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rajesh.master@gmail.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Password *</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Master Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Your Master Trade *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CATEGORIES.slice(0, 8).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, category: cat.id }))}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        formData.category === cat.id
                          ? "bg-indigo-50 border-indigo-600 text-indigo-950 font-extrabold shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji || "🔧"}</span>
                      <span className="text-xs">{cat.name.split("/")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Standard Visit Fee (₹) *</label>
                  <input
                    type="number"
                    name="daily_rate"
                    value={formData.daily_rate}
                    onChange={handleChange}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years of Trade Experience *</label>
                  <input
                    type="number"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleChange}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 2: COOPERATIVE AFFILIATION ═══════ */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h2 className="text-lg font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                2. Cooperative Society & Federation Affiliation
              </h2>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <FiShield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                  SahKaar is 100% cooperative-owned. Affiliating with a registered Primary Labour Cooperative Society grants you the Official Verified Master Shield, legal protection, and ₹5,00,000 welfare insurance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Primary Cooperative Society *</label>
                <select
                  name="society_id"
                  value={formData.society_id}
                  onChange={handleChange}
                  className="w-full h-12 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600 bg-white"
                >
                  {societies.map((soc) => (
                    <option key={soc.id} value={soc.id}>
                      {soc.name} ({soc.district} • Reg: {soc.registration_no || "State Federation"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cooperative Member Registration No (If known)
                </label>
                <input
                  type="text"
                  name="member_registration_no"
                  value={formData.member_registration_no}
                  onChange={handleChange}
                  placeholder="e.g. MEM-BPL-2026-0412 (Leave blank to auto-generate)"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Skill Certification Body
                </label>
                <input
                  type="text"
                  name="skill_certification_body"
                  value={formData.skill_certification_body}
                  onChange={handleChange}
                  placeholder="NCCT & State Skill Development Mission"
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                />
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 3: DOCUMENT UPLOADS ═══════ */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  3. Upload Documents for Federation Verification
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Federation Admins will audit these documents to grant your Golden Cooperative Verified Shield.
                </p>
              </div>

              {/* Upload Item: ID Proof */}
              <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FiFileText className="text-indigo-600" />
                    <span>Aadhaar Card / National ID Proof *</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Front and back copy of government issued identity</p>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-sm flex items-center justify-center gap-1.5 shrink-0">
                  <FiUpload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formData.id_proof_url ? "✓ Document Selected" : "Upload ID"}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload("id_proof_url", e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Item: Skill Certificate */}
              <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FiAward className="text-indigo-600" />
                    <span>Trade & Skill Certificate</span>
                  </div>
                  <p className="text-[11px] text-slate-500">ITI / State Skill Mission / NCCT certified document</p>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-sm flex items-center justify-center gap-1.5 shrink-0">
                  <FiUpload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formData.certificate_url ? "✓ Certificate Selected" : "Upload Certificate"}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload("certificate_url", e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Item: Cooperative Member Card */}
              <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FiShield className="text-indigo-600" />
                    <span>Cooperative Society Membership Card</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Primary society passbook or ID card (if issued)</p>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-sm flex items-center justify-center gap-1.5 shrink-0">
                  <FiUpload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formData.cooperative_card_url ? "✓ Card Selected" : "Upload Card"}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload("cooperative_card_url", e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Item: Profile Photo */}
              <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FiUser className="text-indigo-600" />
                    <span>Master Profile Photo *</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Clear frontal photo shown to customers on search</p>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-sm flex items-center justify-center gap-1.5 shrink-0">
                  <FiUpload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formData.photo_url ? "✓ Photo Selected" : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload("photo_url", e)}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 4: MEMBERSHIP & GROWTH PLANS ═══════ */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  4. Choose Your Master Growth Tier
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accelerate your bookings with verified badge prominence or top customer search ranking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Plan: Verified Badge Pro */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, selected_plan: "verified_badge" }))}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    formData.selected_plan === "verified_badge"
                      ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Trust Shield
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">₹499 <span className="text-xs text-slate-400 font-normal">/yr</span></span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">Verified Master Badge Pro</h3>
                    <p className="text-xs text-slate-500">Expedited federation document verification + Golden Trust Badge on profile & search results.</p>
                  </div>
                </div>

                {/* Plan: Priority Recommendation */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, selected_plan: "priority_listing" }))}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    formData.selected_plan === "priority_listing"
                      ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Highest Leads
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">₹399 <span className="text-xs text-slate-400 font-normal">/mo</span></span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">Top Recommendation Boost</h3>
                    <p className="text-xs text-slate-500">Guaranteed top placement in customer search results for your trade & locality with Promoted ribbon.</p>
                  </div>
                </div>

                {/* Plan: Super Master All-Access */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, selected_plan: "premium" }))}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    formData.selected_plan === "premium"
                      ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Maximum Growth
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">₹899 <span className="text-xs text-slate-400 font-normal">/mo</span></span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">Super Master All-Access</h3>
                    <p className="text-xs text-slate-500">Verified Golden Shield + Top Search Ranking + Unlimited customer booking requests & welfare support.</p>
                  </div>
                </div>

                {/* Plan: Standard Free */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, selected_plan: "free" }))}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    formData.selected_plan === "free"
                      ? "bg-slate-100 border-slate-800 ring-2 ring-slate-800"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Standard
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">Free</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">Standard Cooperative Member</h3>
                    <p className="text-xs text-slate-500">Submit documents for normal queue federation verification. Zero platform registration fees.</p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <FiArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Continue</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                {loading ? (
                  <span>Submitting Registration...</span>
                ) : (
                  <>
                    <span>Complete Master Registration</span>
                    <FiCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
