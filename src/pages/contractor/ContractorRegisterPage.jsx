// ContractorRegisterPage.jsx — 4-step registration for contractors
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI, contractorAPI } from "../../services/api";
import { useGeolocation } from "../../hooks/useGeolocation";
import { isValidPhone, isValidPassword, isValidImageFile, sanitize, sanitizeForm } from "../../utils/validators";
import { CATEGORIES } from "../../utils/constants";
import Icon from "../../components/common/Icon";
import toast from "react-hot-toast";
import { FiUser, FiPhone, FiLock, FiCheckCircle, FiCamera, FiUpload, FiMapPin, FiArrowRight, FiArrowLeft, FiShield } from "react-icons/fi";

const TOTAL_STEPS = 4;

const stepAnim = {
  initial: { opacity: 0, x: 30, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -30, filter: "blur(4px)" },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
};

export default function ContractorRegisterPage() {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "", phone: "", password: "", category: "",
    is_labour_group: false, is_responsibility_model: false,
    description: "", daily_rate: "", experience_years: "", team_size: "",
    services: "",
    profile_photo_file: null, photo_url: null, portfolio_files: [],
    id_proof_file: null, location_text: "",
  });

  const { lat, lng, request: getLocation, error: geoError, loading: geoLoading } = useGeolocation();

  useEffect(() => {
    if (step === 4 && (lat === null || lng === null)) {
      getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    }
  }, [step, lat, lng, getLocation]);

  const update = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    setErrors(err => ({ ...err, [field]: undefined }));
  };

  function validateStep(s) {
    const errs = {};
    if (s === 1) {
      if (!form.name.trim()) errs.name = t("err.required");
      if (!isValidPhone(form.phone)) errs.phone = t("err.invalid_phone");
      if (!isValidPassword(form.password)) errs.password = t("err.weak_password");
      if (!form.category) errs.category = t("err.required");
    }
    if (s === 2) {
      if (!form.description.trim()) errs.description = t("err.required");
      if (form.daily_rate && isNaN(form.daily_rate)) errs.daily_rate = "Enter a valid number";
    }
    if (s === 4) {
      if (!form.location_text.trim()) errs.location_text = t("err.required");
      if (lat === null || lng === null) errs.gps = lang === "hi" ? "GPS लोकेशन आवश्यक है" : "GPS location is required";
    }
    return errs;
  }

  function nextStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  }

  function handlePortfolioSelect(e) {
    const files = Array.from(e.target.files).slice(0, 5);
    const invalid = files.find(f => !isValidImageFile(f).ok);
    if (invalid) { toast.error(t("err.invalid_file_type")); return; }
    setForm(f => ({ ...f, portfolio_files: files }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateStep(4);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const regRes = await authAPI.register({
        name: sanitize(form.name), phone: sanitize(form.phone),
        password: form.password, role: "contractor",
      });
      login(regRes.data.user);
      const profileData = sanitizeForm({
        category: form.category, description: form.description,
        daily_rate: form.daily_rate ? Number(form.daily_rate) : null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        team_size: form.team_size ? Number(form.team_size) : null,
        is_labour_group: form.is_labour_group,
        is_responsibility_model: form.is_responsibility_model,
        services: form.services.split(",").map(s => s.trim()).filter(Boolean),
        location_text: form.location_text,
        latitude: lat !== null ? Number(lat) : undefined,
        longitude: lng !== null ? Number(lng) : undefined,
      });
      const createRes = await contractorAPI.create(profileData);
      const contractorId = createRes.data.contractor?.id;
      if (form.profile_photo_file && contractorId) {
        const fd = new FormData(); fd.append("image", form.profile_photo_file);
        await contractorAPI.uploadPhoto(contractorId, fd);
      }
      if (form.portfolio_files.length > 0 && contractorId) {
        const fd = new FormData();
        form.portfolio_files.forEach(f => fd.append("photos", f));
        await contractorAPI.uploadWork(contractorId, fd);
      }
      if (form.id_proof_file && contractorId) {
        const fd = new FormData(); fd.append("id_proof", form.id_proof_file);
        await contractorAPI.uploadIdProof(contractorId, fd);
      }
      toast.success(t("creg.success"));
      navigate("/contractor/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally { setLoading(false); }
  }

  const stepLabels = [
    { label: t("creg.step1"), icon: <FiUser size={14} /> },
    { label: t("creg.step2"), icon: <FiCheckCircle size={14} /> },
    { label: t("creg.step3"), icon: <FiCamera size={14} /> },
    { label: t("creg.step4"), icon: <FiShield size={14} /> },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-[#030712] items-center justify-center p-12">
        <div className="absolute top-[15%] left-[15%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-indigo-600/25 to-purple-600/10 blur-[80px] animate-[float_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-cyan-500/15 to-blue-500/8 blur-[100px] animate-[float_22s_ease-in-out_infinite_reverse]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px"
        }} />
        <div className="relative z-10 text-center">
          <h1 className="font-display text-4xl text-white font-extrabold uppercase tracking-[-0.03em] mb-3">
            JOIN AS <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">PARTNER</span>
          </h1>
          <p className="text-white/40 text-base max-w-sm mx-auto">
            {lang === "hi" ? "अपनी डिजिटल पहचान बनाएं और हजारों ग्राहकों से जुड़ें" : "Build your digital identity and connect with thousands of customers"}
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-white/25 text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2"><FiShield size={13} /> Verified</span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span>Free to Join</span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span>10k+ Projects</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 md:py-12 bg-[var(--color-bg)]">
        <div className="max-w-lg mx-auto w-full">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="font-display text-2xl font-extrabold text-[var(--color-heading)] uppercase tracking-tight">
              JOIN AS <span className="gradient-text">PARTNER</span>
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-1 uppercase tracking-wider">
              {lang === "hi" ? "अपनी डिजिटल पहचान बनाएं" : "Build your digital identity"}
            </p>
          </div>

          {/* Step progress */}
          <div className="flex items-center justify-between mb-6 px-2">
            {stepLabels.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 < step ? "bg-emerald-500 text-white shadow-sm"
                    : i + 1 === step ? "bg-[var(--color-primary)] text-white shadow-btn"
                      : "bg-[var(--color-border)] text-[var(--color-muted)]"
                    }`}>
                    {i + 1 < step ? <FiCheckCircle size={16} /> : s.icon}
                  </div>
                  <span className="text-[10px] text-[var(--color-muted)] mt-1.5 hidden sm:block text-center font-medium">{s.label}</span>
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${i + 1 < step ? "bg-emerald-500" : "bg-[var(--color-border)]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form card */}
          <div className="glass-card p-6 md:p-8">
            <AnimatePresence mode="wait">

              {/* STEP 1 */}
              {step === 1 && (
                <motion.div key="s1" {...stepAnim} className="space-y-4">
                  <h2 className="font-display text-lg font-extrabold text-[var(--color-heading)] uppercase tracking-tight">{t("creg.step1")}</h2>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.name")}</label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                      <input type="text" value={form.name} onChange={update("name")}
                        placeholder={t("auth.name_placeholder")}
                        className={`input-field !pl-10 ${errors.name ? "error" : ""}`} />
                    </div>
                    {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.phone")}</label>
                    <div className="flex gap-2">
                      <span className="input-field !w-16 !px-0 text-center text-[var(--color-muted)] font-medium flex items-center justify-center">+91</span>
                      <div className="relative flex-1">
                        <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                        <input type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={update("phone")}
                          placeholder={t("auth.phone_placeholder")}
                          className={`input-field !pl-10 ${errors.phone ? "error" : ""}`} />
                      </div>
                    </div>
                    {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.password")}</label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                      <input type="password" value={form.password} onChange={update("password")}
                        placeholder={t("auth.password_placeholder")}
                        className={`input-field !pl-10 ${errors.password ? "error" : ""}`} />
                    </div>
                    {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("creg.category")}</label>
                    <select value={form.category} onChange={update("category")}
                      className={`input-field ${errors.category ? "error" : ""}`}>
                      <option value="">{lang === "hi" ? "श्रेणी चुनें" : "Select category"}</option>
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{t(c.key)}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-danger text-xs mt-1">{errors.category}</p>}
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      { field: "is_labour_group", title: t("creg.is_labour_group"), desc: lang === "hi" ? "आप 5-200 कामगारों की एक टीम के लीडर हैं" : "You lead a team of 5-200 workers" },
                      { field: "is_responsibility_model", title: lang === "hi" ? "मैं पूरी जिम्मेदारी लेता हूं" : "Full Responsibility Model", desc: lang === "hi" ? "मटेरियल + लेबर + डिलीवरी — सब आप संभालते हैं" : "Materials + labour + delivery — you own it all" }
                    ].map(item => (
                      <label key={item.field} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
                        <input type="checkbox" checked={form[item.field]} onChange={update(item.field)}
                          className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-heading)]">{item.title}</p>
                          <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <motion.div key="s2" {...stepAnim} className="space-y-4">
                  <h2 className="font-display text-lg font-extrabold text-[var(--color-heading)] uppercase tracking-tight">{t("creg.step2")}</h2>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("creg.description")}</label>
                    <textarea value={form.description} onChange={update("description")}
                      placeholder={lang === "hi" ? "जैसे: मैं 15 साल से निर्माण कार्य करता हूं..." : "e.g. I have 15 years of construction experience..."}
                      rows={4} maxLength={500}
                      className={`input-field resize-none ${errors.description ? "error" : ""}`} />
                    {errors.description && <p className="text-danger text-xs mt-1">{errors.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("creg.daily_rate")}</label>
                      <input type="number" min="0" value={form.daily_rate} onChange={update("daily_rate")}
                        placeholder="e.g. 800" className={`input-field ${errors.daily_rate ? "error" : ""}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("profile.experience")}</label>
                      <input type="number" min="0" max="50" value={form.experience_years} onChange={update("experience_years")}
                        placeholder={lang === "hi" ? "वर्षों में" : "in years"} className="input-field" />
                    </div>
                  </div>
                  {form.is_labour_group && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("creg.team_size")}</label>
                      <input type="number" min="2" max="500" value={form.team_size} onChange={update("team_size")}
                        placeholder="e.g. 20" className="input-field" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("profile.services")}</label>
                    <input type="text" value={form.services} onChange={update("services")}
                      placeholder={lang === "hi" ? "जैसे: सीमेंट प्लास्टर, टाइल वर्क" : "e.g. Cement plaster, Tile work, Roofing"}
                      className="input-field" />
                    <p className="text-xs text-[var(--color-muted)] mt-1">{lang === "hi" ? "कॉमा से अलग करें" : "Separate with commas"}</p>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <motion.div key="s3" {...stepAnim} className="space-y-4">
                  <h2 className="font-display text-lg font-extrabold text-[var(--color-heading)] uppercase tracking-tight">{t("creg.step3")}</h2>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-body)] mb-2">
                      {lang === "hi" ? "प्रोफाइल फोटो" : "Profile Photo"}
                    </label>
                    <label className="block border-2 border-dashed border-[var(--color-border)] rounded-2xl p-5 text-center cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors group">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FiUser size={20} />
                      </div>
                      <p className="text-sm text-[var(--color-body)] font-medium">
                        {form.profile_photo_file ? form.profile_photo_file.name : (lang === "hi" ? "अपना चेहरा/लोगो अपलोड करें" : "Upload face/logo photo")}
                      </p>
                      <p className="text-xs text-[var(--color-muted)] mt-1">JPG or PNG</p>
                      <input type="file" accept="image/jpeg,image/png" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (!f) return;
                          if (!isValidImageFile(f).ok) return toast.error(t("err.invalid_file_type"));
                          setForm((fr) => ({ ...fr, profile_photo_file: f }));
                        }} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-body)] mb-2">{t("creg.upload_work")}</label>
                    <label className="block border-2 border-dashed border-[var(--color-border)] rounded-2xl p-6 text-center cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors group">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FiCamera size={20} />
                      </div>
                      <p className="text-sm text-[var(--color-body)] font-medium">
                        {form.portfolio_files.length > 0
                          ? `${form.portfolio_files.length} ${lang === "hi" ? "फोटो चुनी गई" : "photos selected"}`
                          : (lang === "hi" ? "अपने काम की फोटो अपलोड करें" : "Upload photos of your work")}
                      </p>
                      <p className="text-xs text-[var(--color-muted)] mt-1">{lang === "hi" ? "JPG/PNG, अधिकतम 5MB" : "JPG/PNG, max 5MB each"}</p>
                      <input type="file" accept="image/jpeg,image/png" multiple onChange={handlePortfolioSelect} className="hidden" />
                    </label>
                  </div>
                  {form.portfolio_files.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {form.portfolio_files.map((f, i) => (
                        <div key={i} className="relative">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-20 object-cover rounded-xl" />
                          <button type="button"
                            onClick={() => setForm(fr => ({ ...fr, portfolio_files: fr.portfolio_files.filter((_, j) => j !== i) }))}
                            className="absolute top-1 right-1 bg-danger text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:scale-110 transition-transform">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-[var(--color-body)] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
                    <Icon name="bulb" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {lang === "hi"
                      ? "अच्छी फोटो = ज़्यादा ग्राहक। अपने सबसे अच्छे काम की फोटो अपलोड करें।"
                      : "Better photos = more customers. Upload your best work to stand out."}
                  </div>
                </motion.div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <motion.div key="s4" {...stepAnim}>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="font-display text-lg font-extrabold text-[var(--color-heading)] uppercase tracking-tight">{t("creg.step4")}</h2>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("creg.location")}</label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                        <input type="text" value={form.location_text} onChange={update("location_text")}
                          placeholder={lang === "hi" ? "जैसे: अयोध्या नगर, भोपाल" : "e.g. Ayodhya Nagar, Bhopal"}
                          className={`input-field !pl-10 ${errors.location_text ? "error" : ""}`} />
                      </div>
                      {errors.location_text && <p className="text-danger text-xs mt-1">{errors.location_text}</p>}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <button type="button"
                          onClick={() => getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })}
                          className="btn-secondary !py-2 !px-3 text-xs">
                          <FiMapPin size={12} /> {lang === "hi" ? "GPS लोकेशन लें" : "Use GPS location"}
                        </button>
                        {lat !== null && lng !== null && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ GPS: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
                          </p>
                        )}
                      </div>
                      {errors.gps && <p className="text-danger text-xs mt-1">{errors.gps}</p>}
                      {geoError && <p className="text-warning text-xs mt-1">{geoError}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-body)] mb-2">{t("creg.id_proof")}</label>
                      <label className="block border-2 border-dashed border-[var(--color-border)] rounded-2xl p-5 text-center cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors group">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FiUpload size={20} />
                        </div>
                        <p className="text-sm text-[var(--color-body)] font-medium">
                          {form.id_proof_file ? form.id_proof_file.name : (lang === "hi" ? "आधार / पैन कार्ड" : "Aadhaar / PAN card")}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-1">JPG or PNG</p>
                        <input type="file" accept="image/jpeg,image/png"
                          onChange={e => { const f = e.target.files[0]; if (f && isValidImageFile(f).ok) setForm(fr => ({ ...fr, id_proof_file: f })); else toast.error(t("err.invalid_file_type")); }}
                          className="hidden" />
                      </label>
                    </div>
                    <div className="text-xs text-[var(--color-body)] bg-blue-50 dark:bg-primary/5 border border-blue-200 dark:border-primary/20 rounded-xl p-3 flex items-start gap-2">
                      <FiShield className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                      {lang === "hi"
                        ? "आपकी ID की जानकारी केवल वेरिफिकेशन के लिए उपयोग होगी।"
                        : "Your ID is used only for verification. It will NOT be shown to customers."}
                    </div>
                    <button type="submit" disabled={loading || geoLoading} className="btn-primary w-full btn-shimmer">
                      {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t("creg.submit")} <FiArrowRight size={16} /></>}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons (steps 1-3) */}
            {step < 4 && (
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="btn-ghost !border-[var(--color-border)] !border flex-1">
                    <FiArrowLeft size={16} /> {t("app.back")}
                  </button>
                )}
                <button type="button" onClick={nextStep} className="btn-primary flex-1 btn-shimmer">
                  {t("app.next")} <FiArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
