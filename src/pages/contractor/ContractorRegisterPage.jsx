// ContractorRegisterPage.jsx — 4-step registration for contractors
// Step 1: Basic details (name, phone, password, category)
// Step 2: Services & pricing (description, daily rate, experience)
// Step 3: Portfolio photos upload
// Step 4: ID proof & final submission
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI, contractorAPI } from "../../services/api";
import { useGeolocation } from "../../hooks/useGeolocation";
import { isValidPhone, isValidPassword, isValidImageFile, sanitize, sanitizeForm } from "../../utils/validators";
import { CATEGORIES } from "../../utils/constants";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Icon from "../../components/common/Icon";
import toast from "react-hot-toast";

const TOTAL_STEPS = 4;

export default function ContractorRegisterPage() {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form data across all steps
  const [form, setForm] = useState({
    // Step 1
    name: "", phone: "", password: "", category: "",
    is_labour_group: false, is_responsibility_model: false,
    // Step 2
    description: "", daily_rate: "", experience_years: "", team_size: "",
    services: "",        // comma-separated
    // Step 3
    profile_photo_file: null,
    photo_url: null,     // uploaded URL
    portfolio_files: [], // File objects
    // Step 4
    id_proof_file: null,
    location_text: "",
  });

  const { lat, lng, accuracy, request: getLocation, error: geoError, loading: geoLoading } = useGeolocation();

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

  // ── Step validation ───────────────────────────
  function validateStep(s) {
    const errs = {};
    if (s === 1) {
      if (!form.name.trim())            errs.name     = t("err.required");
      if (!isValidPhone(form.phone))    errs.phone    = t("err.invalid_phone");
      if (!isValidPassword(form.password)) errs.password = t("err.weak_password");
      if (!form.category)               errs.category = t("err.required");
    }
    if (s === 2) {
      if (!form.description.trim())     errs.description = t("err.required");
      if (form.daily_rate && isNaN(form.daily_rate)) errs.daily_rate = "Enter a valid number";
    }
    if (s === 4) {
      if (!form.location_text.trim())   errs.location_text = t("err.required");
      if (lat === null || lng === null) errs.gps = lang === "hi" ? "GPS लोकेशन आवश्यक है" : "Precise GPS location is required";
    }
    return errs;
  }

  function nextStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  }

  // ── Handle portfolio photo selection ─────────
  function handlePortfolioSelect(e) {
    const files = Array.from(e.target.files).slice(0, 5);
    const invalid = files.find(f => !isValidImageFile(f).ok);
    if (invalid) { toast.error(t("err.invalid_file_type")); return; }
    setForm(f => ({ ...f, portfolio_files: files }));
  }

  // ── Final submit ──────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateStep(4);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      // 1. Register user account
      const regRes = await authAPI.register({
        name:     sanitize(form.name),
        phone:    sanitize(form.phone),
        password: form.password,
        role:     "contractor",
      });
      login(regRes.data.user);

      // 2. Create contractor profile
      const profileData = sanitizeForm({
        category:              form.category,
        description:           form.description,
        daily_rate:            form.daily_rate ? Number(form.daily_rate) : null,
        experience_years:      form.experience_years ? Number(form.experience_years) : null,
        team_size:             form.team_size ? Number(form.team_size) : null,
        is_labour_group:       form.is_labour_group,
        is_responsibility_model: form.is_responsibility_model,
        services:              form.services.split(",").map(s => s.trim()).filter(Boolean),
        location_text:         form.location_text,
        latitude:              lat !== null ? Number(lat) : undefined,
        longitude:             lng !== null ? Number(lng) : undefined,
      });
      const createRes = await contractorAPI.create(profileData);
      const contractorId = createRes.data.contractor?.id;

      // 3. Upload profile photo first (if any)
      if (form.profile_photo_file && contractorId) {
        const fd = new FormData();
        fd.append("image", form.profile_photo_file);
        await contractorAPI.uploadPhoto(contractorId, fd);
      }

      // 4. Upload portfolio photos (if any)
      if (form.portfolio_files.length > 0 && contractorId) {
        const fd = new FormData();
        form.portfolio_files.forEach(f => fd.append("photos", f));
        await contractorAPI.uploadWork(contractorId, fd);
      }

      // 5. Upload ID proof
      if (form.id_proof_file && contractorId) {
        const fd = new FormData();
        fd.append("id_proof", form.id_proof_file);
        await contractorAPI.uploadIdProof(contractorId, fd);
      }

      toast.success(t("creg.success"));
      navigate("/contractor/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setLoading(false);
    }
  }

  // ── Step indicator ────────────────────────────
  const stepLabels = [t("creg.step1"), t("creg.step2"), t("creg.step3"), t("creg.step4")];

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-slate-100 font-bold text-2xl">
            {lang==="hi" ? "ठेकेदार के रूप में रजिस्टर करें" : "Register as Contractor"}
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            {lang==="hi" ? "अपनी डिजिटल पहचान बनाएं" : "Build your digital identity"}
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-between mb-6">
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${i+1 < step ? "bg-emerald-500 text-white" : i+1 === step ? "bg-cyan-200 text-slate-900" : "bg-white/10 text-slate-400"}`}>
                  {i + 1 < step ? <Icon name="check" className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs text-slate-300 mt-1 hidden sm:block text-center">{label}</span>
              </div>
              {i < TOTAL_STEPS-1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i + 1 < step ? "bg-emerald-500" : "bg-white/15"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="card p-5 md:p-6">

          {/* ── STEP 1: Basic Details ── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-bold text-slate-100">{t("creg.step1")}</h2>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("auth.name")}</label>
                <input type="text" value={form.name} onChange={update("name")}
                  placeholder={t("auth.name_placeholder")} className={`input-field ${errors.name ? "border-red-400":""}`} />
                {errors.name && <p className="text-red-300 text-xs mt-1">{errors.name}</p>}
              </div>
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("auth.phone")}</label>
                <input type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={update("phone")}
                  placeholder={t("auth.phone_placeholder")} className={`input-field ${errors.phone ? "border-red-400":""}`} />
                {errors.phone && <p className="text-red-300 text-xs mt-1">{errors.phone}</p>}
              </div>
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("auth.password")}</label>
                <input type="password" value={form.password} onChange={update("password")}
                  placeholder={t("auth.password_placeholder")} className={`input-field ${errors.password ? "border-red-400":""}`} />
                {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password}</p>}
              </div>
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("creg.category")}</label>
                <select value={form.category} onChange={update("category")}
                  className={`input-field ${errors.category ? "border-red-400":""}`}>
                  <option value="">{lang==="hi" ? "श्रेणी चुनें" : "Select category"}</option>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{t(c.key)}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-300 text-xs mt-1">{errors.category}</p>}
              </div>
              {/* Toggles */}
              <div className="space-y-2 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_labour_group} onChange={update("is_labour_group")}
                    className="mt-0.5 rounded border-white/20 text-cyan-DEFAULT" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">{t("creg.is_labour_group")}</p>
                    <p className="text-xs text-slate-300">
                      {lang==="hi" ? "आप 5-200 कामगारों की एक टीम के लीडर हैं" : "You lead a team of 5-200 workers"}
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_responsibility_model} onChange={update("is_responsibility_model")}
                    className="mt-0.5 rounded border-white/20 text-cyan-DEFAULT" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {lang==="hi" ? "मैं पूरी जिम्मेदारी लेता हूं" : "I take full responsibility (Responsibility Model)"}
                    </p>
                    <p className="text-xs text-slate-300">
                      {lang==="hi" ? "मटेरियल + लेबर + डिलीवरी — सब आप संभालते हैं" : "Materials + labour + delivery — you own it all"}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ── STEP 2: Services & Pricing ── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-bold text-slate-100">{t("creg.step2")}</h2>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("creg.description")}</label>
                <textarea value={form.description} onChange={update("description")}
                  placeholder={lang==="hi" ? "जैसे: मैं 15 साल से निर्माण कार्य करता हूं..." : "e.g. I have 15 years of construction experience..."}
                  rows={4} maxLength={500} className={`input-field resize-none ${errors.description ? "border-red-400":""}`} />
                {errors.description && <p className="text-red-300 text-xs mt-1">{errors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">{t("creg.daily_rate")}</label>
                  <input type="number" min="0" value={form.daily_rate} onChange={update("daily_rate")}
                    placeholder="e.g. 800" className={`input-field ${errors.daily_rate ? "border-red-400":""}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">{t("profile.experience")}</label>
                  <input type="number" min="0" max="50" value={form.experience_years} onChange={update("experience_years")}
                    placeholder={lang==="hi" ? "वर्षों में" : "in years"} className="input-field" />
                </div>
              </div>
              {form.is_labour_group && (
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">{t("creg.team_size")}</label>
                  <input type="number" min="2" max="500" value={form.team_size} onChange={update("team_size")}
                    placeholder="e.g. 20" className="input-field" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("profile.services")}</label>
                <input type="text" value={form.services} onChange={update("services")}
                  placeholder={lang==="hi" ? "जैसे: सीमेंट प्लास्टर, टाइल वर्क, छत (कॉमा से अलग करें)" : "e.g. Cement plaster, Tile work, Roofing (comma separated)"}
                  className="input-field" />
                <p className="text-xs text-slate-400 mt-1">{lang==="hi" ? "कॉमा से अलग करें" : "Separate with commas"}</p>
              </div>
            </div>
          )}

          {/* ── STEP 3: Photos ── */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-bold text-slate-100">{t("creg.step3")}</h2>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {lang === "hi" ? "प्रोफाइल फोटो" : "Profile photo"}
                </label>
                <label className="block border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-200 transition-colors">
                  <span className="inline-flex justify-center text-cyan-100">
                    <Icon name="user" className="w-6 h-6" />
                  </span>
                  <p className="text-sm text-slate-300 mt-2">
                    {form.profile_photo_file ? form.profile_photo_file.name : (lang === "hi" ? "अपना चेहरा/लोगो अपलोड करें" : "Upload face/logo photo")}
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (!f) return;
                      const check = isValidImageFile(f);
                      if (!check.ok) return toast.error(t("err.invalid_file_type"));
                      setForm((fr) => ({ ...fr, profile_photo_file: f }));
                    }}
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">{t("creg.upload_work")}</label>
                <label className="block border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-200 transition-colors">
                  <span className="inline-flex justify-center text-cyan-100">
                    <Icon name="camera" className="w-8 h-8" />
                  </span>
                  <p className="text-sm text-slate-300 mt-2">
                    {form.portfolio_files.length > 0
                      ? `${form.portfolio_files.length} ${lang==="hi" ? "फोटो चुनी गई" : "photos selected"}`
                      : (lang==="hi" ? "अपने काम की फोटो अपलोड करें" : "Upload photos of your work")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{lang==="hi" ? "JPG/PNG, अधिकतम 5MB" : "JPG/PNG, max 5MB each"}</p>
                  <input type="file" accept="image/jpeg,image/png" multiple
                    onChange={handlePortfolioSelect} className="hidden" />
                </label>
              </div>
              {form.portfolio_files.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {form.portfolio_files.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-20 object-cover rounded-xl" />
                      <button type="button"
                        onClick={() => setForm(fr => ({ ...fr, portfolio_files: fr.portfolio_files.filter((_,j)=>j!==i) }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 bg-amber-200/10 border border-amber-200/30 rounded-xl p-3">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="bulb" className="w-4 h-4 text-amber-200" />
                  {lang==="hi"
                  ? "अच्छी फोटो = ज़्यादा ग्राहक। अपने सबसे अच्छे काम की फोटो अपलोड करें।"
                  : "Better photos = more customers. Upload your best work to stand out."}
                </span>
              </p>
            </div>
          )}

          {/* ── STEP 4: Verification ── */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              <h2 className="font-bold text-slate-100">{t("creg.step4")}</h2>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("creg.location")}</label>
                <input type="text" value={form.location_text} onChange={update("location_text")}
                  placeholder={lang==="hi" ? "जैसे: अयोध्या नगर, भोपाल" : "e.g. Ayodhya Nagar, Bhopal"}
                  className={`input-field ${errors.location_text ? "border-red-400":""}`} />
                {errors.location_text && <p className="text-red-300 text-xs mt-1">{errors.location_text}</p>}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })}
                    className="btn-secondary !py-2 !px-3 text-xs"
                  >
                    {lang === "hi" ? "मेरी GPS लोकेशन लें" : "Use my GPS location"}
                  </button>
                  {lat !== null && lng !== null && (
                    <p className="text-emerald-200 text-xs mt-1">
                      GPS: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
                      {accuracy ? ` (+/-${Math.round(accuracy)}m)` : ""}
                    </p>
                  )}
                  {errors.gps && <p className="text-red-300 text-xs mt-1">{errors.gps}</p>}
                  {geoError && <p className="text-amber-200 text-xs mt-1">{geoError}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">{t("creg.id_proof")}</label>
                <label className="block border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-200 transition-colors">
                  <span className="inline-flex justify-center text-cyan-100">
                    <Icon name="id-card" className="w-6 h-6" />
                  </span>
                  <p className="text-sm text-slate-300 mt-1">
                    {form.id_proof_file ? form.id_proof_file.name : (lang==="hi" ? "आधार / पैन कार्ड" : "Aadhaar / PAN card")}
                  </p>
                  <input type="file" accept="image/jpeg,image/png"
                    onChange={e => { const f = e.target.files[0]; if (f && isValidImageFile(f).ok) setForm(fr=>({...fr,id_proof_file:f})); else toast.error(t("err.invalid_file_type")); }}
                    className="hidden" />
                </label>
              </div>
              <div className="bg-cyan-200/10 border border-cyan-200/30 rounded-xl p-3">
                <p className="text-xs text-cyan-100 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="check" className="w-4 h-4" />
                    {lang==="hi"
                    ? "आपकी ID की जानकारी केवल वेरिफिकेशन के लिए उपयोग होगी। ग्राहकों को नहीं दिखाई जाएगी।"
                    : "Your ID is used only for verification. It will NOT be shown to customers."}
                  </span>
                </p>
              </div>
              <button type="submit" disabled={loading || geoLoading} className="btn-primary w-full text-sm py-3">
                {loading ? <LoadingSpinner size="sm" /> : t("creg.submit")}
              </button>
            </form>
          )}

          {/* ── Navigation buttons (steps 1-3) ── */}
          {step < 4 && (
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s-1)} className="btn-secondary flex-1">
                  {t("app.back")}
                </button>
              )}
              <button type="button" onClick={nextStep} className="btn-primary flex-1">
                {t("app.next")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
