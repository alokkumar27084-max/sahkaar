import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiFileText,
  FiMail,
  FiPhone,
  FiShield,
  FiUpload,
  FiUser,
  FiAward,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle
} from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { authAPI, cooperativeAPI } from "../../services/api";
import { CATEGORIES } from "../../utils/constants";
import CategoryIcon from "../../components/common/CategoryIcon";
import SEOHead from "../../components/common/SEOHead";

const STEPS = [
  { id: 1, label: "Trade & Identity" },
  { id: 2, label: "Cooperative Affiliation" },
  { id: 3, label: "Document Uploads" },
  { id: 4, label: "Review & Submit" },
];

export default function ContractorRegisterPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isHi = lang === "hi";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [societies, setSocieties] = useState([]);
  const { lat: gpsLat, lng: gpsLng, address: gpsAddress, loading: locating, error: locationError, request: requestLocation } = useGeolocation();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    category: "electrical",
    daily_rate: 450,
    experience_years: 3,
    location_text: "",
    lat: null,
    lng: null,
    service_radius_km: 15,
    society_id: "",
    member_registration_no: "",
    skill_certification_body: "",
    id_document_type: "Aadhaar / National ID",
    id_proof_url: "",
    certificate_url: "",
    cooperative_card_url: "",
    certificate_issued_at: "",
    certificate_expires_at: "",
    photo_url: "",
  });

  useEffect(() => {
    if (gpsLat == null || gpsLng == null) return;
    const resolvedAddress = typeof gpsAddress === "string" ? gpsAddress : gpsAddress?.formatted_address || gpsAddress?.short_name || "";
    setFormData((prev) => ({
      ...prev,
      lat: gpsLat,
      lng: gpsLng,
      location_text: resolvedAddress || (typeof prev.location_text === "string" ? prev.location_text : ""),
    }));
  }, [gpsLat, gpsLng, gpsAddress]);

  useEffect(() => {
    cooperativeAPI
      .getSocieties()
      .then((res) => {
        if (res.data?.ok) {
          setSocieties(res.data.data || []);
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [field]: reader.result }));
      toast.success(`${field.replace(/_/g, " ")} uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (step === 1) {
      const name = String(formData.name || "").trim();
      const phone = String(formData.phone || "").trim();
      const password = String(formData.password || "");
      const locationText = String(formData.location_text || "").trim();

      if (!name) return toast.error("Please enter your full name");
      if (!phone || phone.length < 10) return toast.error("Please enter a valid 10-digit phone number");
      if (!password || password.length < 4) return toast.error("Password must be at least 4 characters");
      if (!locationText || formData.lat == null || formData.lng == null) return toast.error("Set your service area and share a location pin for distance matching");
    } else if (step === 2) {
      if (!formData.society_id) return toast.error("Please select your Primary Society");
      if (!String(formData.member_registration_no || "").trim()) return toast.error("Enter your existing cooperative member registration number");
    } else if (step === 3) {
      if (!formData.id_proof_url) return toast.error("Upload a government identity document before continuing");
      if (!formData.cooperative_card_url) return toast.error("Upload your cooperative membership card before continuing");
      if (!formData.photo_url) return toast.error("Upload a worker profile photo before continuing");
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.id_proof_url || !formData.cooperative_card_url || !formData.photo_url) {
      toast.error("Government ID, cooperative membership card, and profile photo are required.");
      setStep(3);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        password: formData.password,
        role: "worker",
        business_name: `${formData.name.trim()} (${formData.category.replace(/_/g, " ")})`,
        category: formData.category,
        categories: [formData.category],
        daily_rate: Number(formData.daily_rate) || 450,
        experience_years: Number(formData.experience_years) || 3,
        location_text: formData.location_text,
        lat: formData.lat ? Number(formData.lat) : null,
        lng: formData.lng ? Number(formData.lng) : null,
        latitude: formData.lat ? Number(formData.lat) : null,
        longitude: formData.lng ? Number(formData.lng) : null,
        society_id: formData.society_id || undefined,
        member_registration_no: formData.member_registration_no.trim(),
        service_radius_km: Number(formData.service_radius_km) || 15,
        certificate_issued_at: formData.certificate_issued_at || null,
        certificate_expires_at: formData.certificate_expires_at || null,
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
          "Worker registration submitted. Federation admins will review your documents."
        );
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
        title="सहकार worker registration — Join as a Verified Cooperative Worker | SahKaar"
        description="Register as a skilled worker with your Cooperative Federation. Submit documents for official verification and fair-wage bookings."
      />

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold">
            <FiAward className="w-3.5 h-3.5" />
            <span>{isHi ? "सहकार श्रमिक सेवा मंच" : "SahKaar Worker Partner Portal"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {isHi ? "सहकारी श्रमिक के रूप में रजिस्टर करें" : "Register as a SahKaar Cooperative Worker"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            {isHi
              ? "अपनी सहकारी समिति से जुड़ें, अपने दस्तावेज़ जमा करें और सत्यापित श्रमिक प्रोफाइल प्राप्त करें।"
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
                1. Personal Details & Service Skill
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
                      placeholder="worker@example.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Password *</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 4 characters"
                      minLength={4}
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600"
                    />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Service Skill Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Your Service Skill *</label>
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
                      <CategoryIcon categoryId={cat.id} size={22} className="w-6 h-6" />
                      <span className="text-xs">{cat.name.split("/")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate & Experience */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Service area / locality *</label>
                <input name="location_text" value={formData.location_text} onChange={handleChange} placeholder="District or locality where you accept cooperative work" className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold" />
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => requestLocation()} disabled={locating} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-60">{locating ? "Getting location…" : formData.lat != null ? "Refresh location pin" : "Share device location for matching"}</button>
                  <span className="text-[10px] text-slate-500">Exact coordinates are used for distance matching; the worker profile shows approximate distance.</span>
                </div>
                {locationError && <p className="text-xs text-rose-600">{locationError}</p>}
                {formData.lat != null && formData.lng != null && (
                  <p className="text-xs text-emerald-700 font-semibold">
                    Location pin set{gpsAddress ? ` · ${typeof gpsAddress === "string" ? gpsAddress : gpsAddress?.formatted_address || gpsAddress?.short_name || ""}` : ""}
                  </p>
                )}
                <label className="block text-xs font-bold text-slate-700">Service radius: {formData.service_radius_km} km</label>
                <input type="range" min="1" max="100" step="1" name="service_radius_km" value={formData.service_radius_km} onChange={handleChange} className="w-full" />
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
                  SahKaar is designed as a cooperative-owned marketplace. Your society affiliation and documents go to federation admins for verification before you receive customer bookings. Welfare contributions and claims are shown only when recorded in the cooperative ledger; insurance is not currently provided through this platform.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Primary Cooperative Society *</label>
                <select
                  name="society_id"
                  value={formData.society_id}
                  required
                  onChange={handleChange}
                  className="w-full h-12 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="">Select your registered Primary Society</option>
                  {societies.map((soc) => (
                    <option key={soc.id} value={soc.id}>
                      {soc.name} ({soc.district} • Reg: {soc.registration_no || "State Federation"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cooperative Member Registration No *
                </label>
                <input
                  type="text"
                  name="member_registration_no"
                  value={formData.member_registration_no}
                  onChange={handleChange}
                  placeholder="Enter the number issued by your Primary Society"
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
                  placeholder="Enter the certificate's actual issuing organization"
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
                  3. Upload Documents for Society / Federation Review
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  An authorized cooperative reviewer checks these documents before your profile can receive bookings.
                </p>
              </div>

              {/* Upload Item: ID Proof */}
              <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FiFileText className="text-indigo-600" />
                    <span>Aadhaar Card / National ID Proof *</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Required for reviewer identity checks.</p>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-sm flex items-center justify-center gap-1.5 shrink-0">
                  {formData.id_proof_url ? <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <FiUpload className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{formData.id_proof_url ? "Document Selected" : "Upload ID"}</span>
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
                  {formData.certificate_url ? <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <FiUpload className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{formData.certificate_url ? "Certificate Selected" : "Upload Certificate"}</span>
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
                  <p className="text-[11px] text-slate-500">Required to verify current cooperative membership.</p>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-sm flex items-center justify-center gap-1.5 shrink-0">
                  {formData.cooperative_card_url ? <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <FiUpload className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{formData.cooperative_card_url ? "Card Selected" : "Upload Card"}</span>
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
                    <span>Worker Profile Photo *</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Clear frontal photo shown to customers on search</p>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-sm flex items-center justify-center gap-1.5 shrink-0">
                  {formData.photo_url ? <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <FiUpload className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{formData.photo_url ? "Photo Selected" : "Upload Photo"}</span>
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

          {/* ═══════ STEP 4: REVIEW & SUBMIT ═══════ */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  4. Review Verification Request
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Federation admins verify identity, skill proof, and society membership before activating customer bookings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Applicant</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{formData.name || "Worker name pending"}</p>
                  <p className="text-xs text-slate-500">{formData.phone || "Phone required"}</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Service Skill</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{formData.category.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500">Visit fee: ₹{formData.daily_rate || 0}</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Society</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    {societies.find((soc) => soc.id === formData.society_id)?.name || "Society selection pending"}
                  </p>
                  <p className="text-xs text-slate-500">{formData.member_registration_no || "Membership is not confirmed"}</p>
                </div>
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Submission Status</p>
                  <p className="mt-1 text-sm font-extrabold text-emerald-950">Pending federation verification</p>
                  <p className="text-xs text-emerald-800">No paid ranking tier is required for cooperative workers.</p>
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
                    <span>Submit Worker Registration</span>
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
