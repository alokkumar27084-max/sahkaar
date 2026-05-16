import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiTool,
  FiUpload,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { authAPI, contractorAPI } from "../../services/api";
import LocationSearchInput from "../../components/common/LocationSearchInput";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { CATEGORIES } from "../../utils/constants";
import {
  isValidEmail,
  isValidImageFile,
  isValidPassword,
  isValidPhone,
  sanitize,
  sanitizeForm,
} from "../../utils/validators";
import { getQuestionnaireForCategory } from "../../utils/questionnaires";

const TOTAL_STEPS = 4;

const stepAnim = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: "easeOut" },
};

const PARTNER_TYPES = [
  {
    id: "project",
    title: "Enterprise Contractor",
    short: "Full-Scale Projects",
    icon: FiBriefcase,
    examples: "Construction, full renovations, large-scale civil projects",
    flags: { is_labour_group: false, is_responsibility_model: true },
  },
  {
    id: "team",
    title: "Labour Group Leader",
    short: "On-Site Work Teams",
    icon: FiUsers,
    examples: "Masonry teams, painting crews, structural labor",
    flags: { is_labour_group: true, is_responsibility_model: false },
  },
  {
    id: "business",
    title: "Solo Expert / Specialist",
    short: "Dedicated Services",
    icon: FiTool,
    examples: "Electricians, plumbers, smart-home installers, cleaning",
    flags: { is_labour_group: false, is_responsibility_model: false },
  },
];

const CATEGORY_GROUPS = [
  { title: "Home and site work", ids: ["construction", "electrical", "plumbing", "painting", "carpentry"] },
  { title: "Teams and projects", ids: ["labour_group", "events", "transport"] },
  { title: "Local services", ids: ["cleaning", "property", "farming", "other"] },
];

function asNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function CategoryButton({ category, selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-[20px] border px-6 py-6 text-left transition-all duration-500 group ${
        selected
          ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.05)] scale-[1.02]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-indigo-500/30 hover:bg-[var(--color-surface-hover)] shadow-sm"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-all ${selected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-[var(--color-bg-elevated)] text-[var(--color-muted)] group-hover:bg-indigo-500 group-hover:text-white'}`}>
        <FiCheck size={20} className={selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} />
      </div>
      <span className={`block text-[15px] font-black uppercase tracking-tight ${selected ? "text-indigo-600 dark:text-indigo-300" : "text-[var(--color-heading)]"}`}>{label}</span>
      <span className="mt-2 block text-[10px] leading-relaxed text-[var(--color-muted)] font-black uppercase tracking-widest opacity-80">
        {category.subtitle}
      </span>
      {selected && <div className="absolute top-0 right-0 p-3"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" /></div>}
    </button>
  );
}

export default function ContractorRegisterPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { lat, lng, address, accuracy, request: requestGps, loading: gpsLoading } = useGeolocation();

  const [step, setStep] = useState(1);
  const [subStepIndex, setSubStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [form, setForm] = useState({
    partner_type: "",
    category: "",
    business_name: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    description: "",
    services: "",
    daily_rate: "",
    min_project_value: "",
    experience_years: "",
    team_size: "",
    location_text: "",
    profile_photo_file: null,
    portfolio_files: [],
    id_proof_file: null,
    onboarding_data: {},
  });

  const selectedPartnerType = useMemo(
    () => PARTNER_TYPES.find((item) => item.id === form.partner_type),
    [form.partner_type]
  );

  const activeQuestionnaire = useMemo(
    () => form.category ? getQuestionnaireForCategory(form.category) : [],
    [form.category]
  );

  useEffect(() => {
    if (lat === null || lng === null) return;
    const snapshot = {
      lat: Number(lat),
      lng: Number(lng),
      accuracy_m: accuracy ?? null,
      address: address || `Near ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`,
    };
    setSelectedLocation(snapshot);
    setLocationQuery(snapshot.address);
    setForm((prev) => ({ ...prev, location_text: snapshot.address }));
    setErrors((prev) => ({ ...prev, location: undefined }));
  }, [lat, lng, address, accuracy]);

  function update(field) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function choosePartnerType(type) {
    setForm((prev) => ({
      ...prev,
      partner_type: type.id,
      category: type.id === "team" ? "labour_group" : prev.category,
      team_size: type.id === "team" && !prev.team_size ? "5" : prev.team_size,
    }));
    setErrors((prev) => ({ ...prev, partner_type: undefined, category: undefined }));
  }

  function handleQuestionnaireAnswer(questionId, value, type) {
    setForm((prev) => {
      const currentAnswers = prev.onboarding_data[questionId] || [];
      let newAnswers;

      if (type === "single") {
        newAnswers = [value];
      } else {
        if (currentAnswers.includes(value)) {
          newAnswers = currentAnswers.filter((v) => v !== value);
        } else {
          newAnswers = [...currentAnswers, value];
        }
      }

      return {
        ...prev,
        onboarding_data: {
          ...prev.onboarding_data,
          [questionId]: newAnswers,
        },
      };
    });
  }

  function validateStep(nextStep = step) {
    const nextErrors = {};
    if (nextStep === 1) {
      if (!form.partner_type) nextErrors.partner_type = "Choose the way you work.";
      if (!form.category) nextErrors.category = "Choose your main service category.";
    }
    if (nextStep === 2) {
      if (!form.name.trim()) nextErrors.name = "Enter the owner's full name.";
      if (!isValidPhone(form.phone)) nextErrors.phone = "Enter a valid 10-digit mobile number.";
      if (!isValidEmail(form.email)) nextErrors.email = "Enter a valid email address.";
      if (!isValidPassword(form.password)) nextErrors.password = "Use at least 8 characters.";
    }
    if (nextStep === 3) {
      if (subStepIndex === activeQuestionnaire.length) {
        if (!form.description.trim() || form.description.trim().length < 40) {
          nextErrors.description = "Write at least 40 characters about your work.";
        }
        if (form.partner_type === "team" && Number(form.team_size || 0) < 2) {
          nextErrors.team_size = "Team leaders should enter at least 2 workers.";
        }
        if (form.daily_rate && Number(form.daily_rate) < 0) nextErrors.daily_rate = "Enter a valid rate.";
      } else {
        const currentQ = activeQuestionnaire[subStepIndex];
        const answers = form.onboarding_data[currentQ.id];
        if (!answers || answers.length === 0) {
          nextErrors.questionnaire = "Please select an option to proceed.";
        }
      }
    }
    if (nextStep === 4) {
      if (!form.location_text.trim()) nextErrors.location_text = "Enter your service area.";
      if (!selectedLocation?.lat || !selectedLocation?.lng) {
        nextErrors.location = "Pin a GPS or map location so customers nearby can discover you.";
      }
    }
    return nextErrors;
  }

  function goNext() {
    const nextErrors = validateStep(step);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    
    if (step === 3 && subStepIndex < activeQuestionnaire.length) {
      setSubStepIndex((prev) => prev + 1);
    } else {
      setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
      if (step === 2) setSubStepIndex(0); // Reset substep when entering step 3
    }
  }

  function goBack() {
    if (step === 3 && subStepIndex > 0) {
      setSubStepIndex((prev) => prev - 1);
    } else {
      setStep((prev) => prev - 1);
    }
  }

  function handleLocationSelect(selection) {
    setSelectedLocation(selection);
    setLocationQuery(selection.address || "");
    setForm((prev) => ({ ...prev, location_text: selection.address || prev.location_text }));
    setErrors((prev) => ({ ...prev, location: undefined, location_text: undefined }));
  }

  function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file).ok) {
      toast.error("Upload a JPG or PNG image under 5MB.");
      return;
    }
    setForm((prev) => ({ ...prev, profile_photo_file: file }));
  }

  function handlePortfolio(event) {
    const files = Array.from(event.target.files || []).slice(0, 6);
    if (!files.length) return;
    if (files.some((file) => !isValidImageFile(file).ok)) {
      toast.error("Portfolio images must be JPG or PNG under 5MB.");
      return;
    }
    setForm((prev) => ({ ...prev, portfolio_files: files }));
  }

  function handleIdProof(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file).ok) {
      toast.error("ID proof must be a JPG or PNG under 5MB.");
      return;
    }
    setForm((prev) => ({ ...prev, id_proof_file: file }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateStep(4);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const regRes = await authAPI.register({
        name: sanitize(form.name),
        email: sanitize(form.email),
        phone: sanitize(form.phone),
        password: form.password,
        role: "contractor",
      });
      login(regRes.data.user, regRes.data.token);

      const flags = selectedPartnerType?.flags || {};
      const services = form.services
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const profileData = sanitizeForm({
        business_name: form.business_name || form.name,
        category: form.category,
        categories: [form.category],
        description: form.description,
        daily_rate: asNumberOrNull(form.daily_rate),
        estimated_project_value: asNumberOrNull(form.min_project_value),
        experience_years: asNumberOrNull(form.experience_years) || 0,
        team_size: asNumberOrNull(form.team_size) || (form.partner_type === "team" ? 5 : 1),
        is_labour_group: !!flags.is_labour_group,
        is_responsibility_model: !!flags.is_responsibility_model || form.partner_type === "project",
        services,
        location_text: form.location_text,
        latitude: Number(selectedLocation.lat),
        longitude: Number(selectedLocation.lng),
        lat: Number(selectedLocation.lat),
        lng: Number(selectedLocation.lng),
        onboarding_data: form.onboarding_data,
      });

      const createRes = await contractorAPI.create(profileData);
      const contractorId = createRes.data.contractor?.id;

      if (contractorId && form.profile_photo_file) {
        const fd = new FormData();
        fd.append("image", form.profile_photo_file);
        await contractorAPI.uploadPhoto(contractorId, fd);
      }
      if (contractorId && form.portfolio_files.length) {
        const fd = new FormData();
        form.portfolio_files.forEach((file) => fd.append("photos", file));
        await contractorAPI.uploadWork(contractorId, fd);
      }
      if (contractorId && form.id_proof_file) {
        const fd = new FormData();
        fd.append("id_proof", form.id_proof_file);
        await contractorAPI.uploadIdProof(contractorId, fd);
      }

      toast.success("Your contractor profile is ready for review.");
      navigate("/contractor/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not complete registration.");
    } finally {
      setLoading(false);
    }
  }

  const totalSubSteps = step === 3 ? activeQuestionnaire.length + 1 : 1;
  const currentSubStep = step === 3 ? subStepIndex : 0;
  const progressBase = ((step - 1) / TOTAL_STEPS);
  const subProgress = (currentSubStep / totalSubSteps) * (1 / TOTAL_STEPS);
  const progress = Math.min(100, Math.round((progressBase + subProgress) * 100));

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-14 px-4 md:px-8 font-sans transition-colors duration-500">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-140px)]">
          <div className="relative flex h-full flex-col rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-10 text-[var(--color-heading)] shadow-xl overflow-hidden">
            {/* Cinematic Background Elements */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6">Partner Ecosystem</p>
              <h1 className="font-display text-4xl font-black leading-tight bg-gradient-to-br from-[var(--color-heading)] to-[var(--color-muted)] bg-clip-text text-transparent tracking-tighter">
                Register as an Elite Partner.
              </h1>
              <p className="mt-6 text-[13px] leading-relaxed text-[var(--color-body)] font-bold uppercase tracking-widest opacity-80">
                Join a global network of verified experts and win higher-value projects.
              </p>
            </div>

            {/* Progress Bar moved to Top */}
            <div className="relative z-10 mb-12">
              <div className="mb-3 flex items-center justify-between text-[10px] font-black text-[var(--color-muted)] uppercase tracking-widest">
                <span>Application Phase</span>
                <span className="text-indigo-500">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden p-[1px]">
                <div className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.3)]" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="relative z-10 space-y-6">
              {[
                [FiShield, "Verified Pro Shield", "Showcase expertise with a verified profile."],
                [FiMapPin, "Hyper-Local Matching", "Appear directly for local searches."],
                [FiCheckCircle, "Secure Escrow Logic", "Milestone-based escrow payment system."],
              ].map(([Icon, title, copy]) => (
                <div key={title} className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:bg-[var(--color-surface-hover)] hover:border-indigo-500/30 transition-all duration-500 shadow-sm">
                  <div className="flex items-start gap-5">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-md">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-black text-[var(--color-heading)] uppercase tracking-tight">{title}</p>
                      <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)] font-bold uppercase tracking-widest">{copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex flex-col justify-center py-8">
          <div className="mb-12">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500">
              Onboarding Process // Step {step} of {TOTAL_STEPS}
            </p>
            <h2 className="mt-4 font-display text-4xl font-black text-[var(--color-heading)] md:text-6xl tracking-tighter">
              {step === 1 && "Define your expertise"}
              {step === 2 && "Identity Setup"}
              {step === 3 && subStepIndex < activeQuestionnaire.length && activeQuestionnaire[subStepIndex].question}
              {step === 3 && subStepIndex === activeQuestionnaire.length && "Portfolio & Bio"}
              {step === 4 && "Operational Domain"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step-1" {...stepAnim} className="space-y-12">
                  <div className="grid gap-6 md:grid-cols-3">
                    {PARTNER_TYPES.map((type) => {
                      const Icon = type.icon;
                      const selected = form.partner_type === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => choosePartnerType(type)}
                          className={`group relative overflow-hidden rounded-[2rem] border p-8 text-left transition-all duration-500 shadow-xl ${
                            selected
                              ? "border-indigo-500 bg-indigo-500/10 scale-[1.05]"
                              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-indigo-500/30 hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500 ${
                            selected ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/40" : "bg-[var(--color-bg-elevated)] text-[var(--color-muted)] group-hover:bg-indigo-500 group-hover:text-white"
                          }`}>
                            <Icon size={28} />
                          </div>
                          <span className={`block text-xl font-black tracking-tighter mb-2 leading-tight ${selected ? "text-indigo-600 dark:text-indigo-300" : "text-[var(--color-heading)]"}`}>{type.title}</span>
                          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-6">{type.short}</span>
                          <p className="text-[12px] leading-relaxed text-[var(--color-muted)] font-bold uppercase tracking-widest opacity-80 line-clamp-3">{type.examples}</p>
                          
                          {selected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-6 right-6 text-indigo-500">
                              <FiCheckCircle size={24} />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {form.partner_type && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="pt-12 border-t border-[var(--color-border)]"
                      >
                        <p className="mb-8 text-[11px] font-black uppercase tracking-[0.3em] text-[var(--color-muted)]">Select Primary Domain</p>
                        <div className="space-y-10">
                          {CATEGORY_GROUPS.map((group) => (
                            <div key={group.title}>
                              <p className="mb-4 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500/80">
                                {group.title}
                              </p>
                              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {CATEGORIES.filter((category) => group.ids.includes(category.id)).map((category) => (
                                  <CategoryButton
                                    key={category.id}
                                    category={category}
                                    selected={form.category === category.id}
                                    label={t(category.key)}
                                    onClick={() => {
                                      setForm((prev) => ({ ...prev, category: category.id }));
                                      setErrors((prev) => ({ ...prev, category: undefined }));
                                      setTimeout(goNext, 500);
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step-2" {...stepAnim} className="grid gap-8 md:grid-cols-2 bg-[var(--color-surface)] p-10 rounded-[2rem] border border-[var(--color-border)] shadow-xl">
                  <label className="block">
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Partner Full Name</span>
                    <div className="relative">
                      <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                      <input className={`w-full bg-[var(--color-bg)] border ${errors.name ? 'border-rose-500/50' : 'border-[var(--color-border)]'} rounded-2xl px-12 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none`} value={form.name} onChange={update("name")} placeholder="Your full name" />
                    </div>
                    {errors.name && <p className="mt-2 text-xs font-black uppercase text-rose-500 tracking-widest">{errors.name}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Business Display Name</span>
                    <div className="relative">
                      <FiBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                      <input className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-12 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none" value={form.business_name} onChange={update("business_name")} placeholder="e.g. Sharma Pro Solutions" />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Contact Number</span>
                    <div className="relative">
                      <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                      <input className={`w-full bg-[var(--color-bg)] border ${errors.phone ? 'border-rose-500/50' : 'border-[var(--color-border)]'} rounded-2xl px-12 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none`} inputMode="numeric" maxLength={10} value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value.replace(/\D/g, "") }))} placeholder="10-digit mobile" />
                    </div>
                    {errors.phone && <p className="mt-2 text-xs font-black uppercase text-rose-500 tracking-widest">{errors.phone}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Email Address</span>
                    <div className="relative">
                      <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                      <input className={`w-full bg-[var(--color-bg)] border ${errors.email ? 'border-rose-500/50' : 'border-[var(--color-border)]'} rounded-2xl px-12 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none`} value={form.email} onChange={update("email")} placeholder="name@domain.com" />
                    </div>
                    {errors.email && <p className="mt-2 text-xs font-black uppercase text-rose-500 tracking-widest">{errors.email}</p>}
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Access Password</span>
                    <div className="relative">
                      <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                      <input className={`w-full bg-[var(--color-bg)] border ${errors.password ? 'border-rose-500/50' : 'border-[var(--color-border)]'} rounded-2xl px-12 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none`} type="password" value={form.password} onChange={update("password")} placeholder="Create a secure password" />
                    </div>
                    {errors.password && <p className="mt-2 text-xs font-black uppercase text-rose-500 tracking-widest">{errors.password}</p>}
                  </label>
                </motion.div>
              )}

              {step === 3 && subStepIndex < activeQuestionnaire.length && (
                <motion.div key={`step-3-sub-${subStepIndex}`} {...stepAnim} className="max-w-2xl space-y-8">
                  {(() => {
                    const currentQ = activeQuestionnaire[subStepIndex];
                    const answers = form.onboarding_data[currentQ.id] || [];
                    
                    return (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-muted)] mb-8">Select {currentQ.type === 'single' ? 'One Choice' : 'Multiple Options'}</p>
                        
                        <div className="grid gap-4">
                          {currentQ.options.map((opt) => {
                            const isSelected = answers.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  handleQuestionnaireAnswer(currentQ.id, opt.value, currentQ.type);
                                  setErrors((prev) => ({ ...prev, questionnaire: undefined }));
                                  if (currentQ.type === 'single') setTimeout(goNext, 400);
                                }}
                                className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all duration-500 text-left ${
                                  isSelected 
                                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg scale-[1.02]" 
                                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-indigo-500/30 hover:bg-[var(--color-surface-hover)] shadow-sm"
                                }`}
                              >
                                <span className={`text-lg font-black tracking-tight ${isSelected ? "text-indigo-600 dark:text-indigo-300" : "text-[var(--color-heading)]"}`}>
                                  {opt.label}
                                </span>
                                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                                  isSelected ? "border-indigo-500 bg-indigo-500 shadow-md shadow-indigo-500/40" : "border-[var(--color-border)]"
                                }`}>
                                  {isSelected && <FiCheck size={18} className="text-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {errors.questionnaire && <p className="mt-6 text-xs font-black uppercase text-rose-500 tracking-widest">{errors.questionnaire}</p>}
                        
                        {currentQ.type === 'multi' && (
                          <button type="button" onClick={goNext} className="mt-12 w-full py-5 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all">
                            Validate & Continue <FiArrowRight className="inline ml-2" />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {step === 3 && subStepIndex === activeQuestionnaire.length && (
                <motion.div key="step-3-final" {...stepAnim} className="space-y-10 bg-[var(--color-surface)] p-10 rounded-[2rem] border border-[var(--color-border)] shadow-xl">
                  <label className="block">
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Professional Bio</span>
                    <textarea
                      className={`w-full bg-[var(--color-bg)] border ${errors.description ? 'border-rose-500/50' : 'border-[var(--color-border)]'} rounded-2xl px-6 py-5 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none min-h-[160px] resize-none shadow-inner`}
                      value={form.description}
                      onChange={update("description")}
                      placeholder="E.g. We provide end-to-end civil construction services with a focus on sustainable building practices..."
                      maxLength={700}
                    />
                    <div className="mt-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] opacity-60">
                      <span className={errors.description ? "text-rose-500" : ""}>{errors.description || "Minimum 40 characters required."}</span>
                      <span>{form.description.length} / 700</span>
                    </div>
                  </label>

                  <div className="grid gap-6 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Base Rate (₹)</span>
                      <input className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-6 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none shadow-inner" type="number" min="0" value={form.daily_rate} onChange={update("daily_rate")} placeholder="Per day/job" />
                    </label>
                    <label className="block">
                      <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Experience</span>
                      <input className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-6 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none shadow-inner" type="number" min="0" max="60" value={form.experience_years} onChange={update("experience_years")} placeholder="Years" />
                    </label>
                    <label className="block">
                      <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Team Force</span>
                      <input className={`w-full bg-[var(--color-bg)] border ${errors.team_size ? 'border-rose-500/50' : 'border-[var(--color-border)]'} rounded-2xl px-6 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none shadow-inner`} type="number" min="1" max="500" value={form.team_size} onChange={update("team_size")} placeholder="Solo = 1" />
                    </label>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 pt-10 border-t border-[var(--color-border)]">
                    <label className="block group relative rounded-[2rem] border-2 border-dashed border-[var(--color-border)] hover:border-indigo-500/50 bg-[var(--color-bg)] p-10 transition-all duration-500 text-center cursor-pointer shadow-inner">
                      <div className="mx-auto w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                        <FiCamera size={24} />
                      </div>
                      <span className="block text-sm font-black text-[var(--color-heading)] uppercase tracking-tight">Identity Photo</span>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] leading-relaxed">Clear portrait or brand logo</p>
                      <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePhoto} />
                      {form.profile_photo_file && <p className="mt-4 text-xs font-black text-emerald-500 flex items-center justify-center gap-2 uppercase tracking-widest animate-in fade-in"><FiCheckCircle/> {form.profile_photo_file.name}</p>}
                    </label>

                    <label className="block group relative rounded-[2rem] border-2 border-dashed border-[var(--color-border)] hover:border-indigo-500/50 bg-[var(--color-bg)] p-10 transition-all duration-500 text-center cursor-pointer shadow-inner">
                      <div className="mx-auto w-16 h-16 bg-cyan-500/10 text-cyan-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                        <FiUpload size={24} />
                      </div>
                      <span className="block text-sm font-black text-[var(--color-heading)] uppercase tracking-tight">Showcase Assets</span>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] leading-relaxed">Select up to 6 portfolio shots</p>
                      <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePortfolio} />
                      {form.portfolio_files.length > 0 && <p className="mt-4 text-xs font-black text-cyan-500 flex items-center justify-center gap-2 uppercase tracking-widest animate-in fade-in"><FiCheckCircle/> {form.portfolio_files.length} Assets Attached</p>}
                    </label>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step-4" {...stepAnim} className="space-y-10 max-w-2xl">
                  <div className="rounded-[2rem] bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 border border-[var(--color-border)] p-8 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px]" />
                    <div className="flex gap-6 relative z-10">
                      <div className="mt-1 bg-indigo-500 rounded-2xl p-3 text-white shadow-lg shadow-indigo-500/30 shrink-0">
                        <FiMapPin size={20} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-[var(--color-heading)] tracking-tight">Geographic Domain Discovery</p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)] font-bold uppercase tracking-widest opacity-80">
                          Precision mapping ensures you are prioritized for projects within your reachable radius.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--color-surface)] p-10 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl space-y-8">
                    <label className="block">
                      <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">HQ Service Address</span>
                      <input className={`w-full bg-[var(--color-bg)] border ${errors.location_text ? 'border-rose-500/50' : 'border-[var(--color-border)]'} rounded-2xl px-6 py-4 text-[var(--color-heading)] font-bold focus:border-indigo-500 transition-all outline-none shadow-inner`} value={form.location_text} onChange={update("location_text")} placeholder="City, Landmark, Area" />
                      {errors.location_text && <p className="mt-2 text-xs font-black uppercase text-rose-500 tracking-widest">{errors.location_text}</p>}
                    </label>

                    <div>
                      <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Pin Precise Locality</span>
                      <div className="relative z-50">
                        <LocationSearchInput
                          value={locationQuery}
                          onChange={setLocationQuery}
                          onSelect={handleLocationSelect}
                          placeholder="Search Map Area..."
                        />
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-4">
                        <button type="button" onClick={() => requestGps({ enableHighAccuracy: true })} disabled={gpsLoading} className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-400 transition-all flex items-center gap-3 shadow-lg shadow-indigo-500/20">
                          {gpsLoading ? <LoadingSpinner size="sm" /> : <FiMapPin size={14} />}
                          Sync via GPS
                        </button>
                        {selectedLocation?.lat && (
                          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 border border-emerald-500/30 shadow-inner">
                            <FiCheckCircle size={14} /> Coordinates Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <label className="block group relative rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 transition-all hover:border-indigo-500/40 cursor-pointer flex items-center gap-8 shadow-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] pointer-events-none" />
                    <div className="w-20 h-20 bg-[var(--color-bg-elevated)] text-indigo-500 rounded-3xl flex items-center justify-center shrink-0 border border-[var(--color-border)] group-hover:scale-105 transition-transform shadow-md">
                      <FiFileText size={28} />
                    </div>
                    <div>
                      <span className="block text-lg font-black text-[var(--color-heading)] tracking-tight">Identity Verification</span>
                      <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)] font-bold uppercase tracking-widest">
                        Upload Aadhaar, PAN, or GST Cert. Encrypted & Secure.
                      </p>
                      {form.id_proof_file && <p className="mt-4 text-xs font-black text-emerald-500 flex items-center gap-2 uppercase tracking-widest animate-in fade-in"><FiCheckCircle/> {form.id_proof_file.name}</p>}
                    </div>
                    <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleIdProof} />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Footer */}
            {!(step === 3 && subStepIndex < activeQuestionnaire.length && activeQuestionnaire[subStepIndex].type === 'multi') && (
              <div className="mt-16 flex items-center gap-6 border-t border-[var(--color-border)] pt-10 pb-12">
                {(step > 1 || (step === 3 && subStepIndex > 0)) && (
                  <button type="button" onClick={goBack} className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-[var(--color-border)] text-[var(--color-heading)] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[var(--color-surface-hover)] transition-all">
                    <FiArrowLeft size={16} /> Previous Phase
                  </button>
                )}
                
                {step < TOTAL_STEPS ? (
                  <button type="button" onClick={goNext} className="ml-auto flex items-center gap-3 px-12 py-4 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-[0.25em] text-[10px] shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 active:scale-95 transition-all group">
                    Advance Process <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="ml-auto flex items-center justify-center gap-4 px-14 py-5 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-[0.25em] text-xs shadow-xl shadow-indigo-500/40 hover:bg-indigo-400 active:scale-95 transition-all disabled:opacity-50">
                    {loading ? <LoadingSpinner size="sm" /> : <>Finalize Registration <FiCheckCircle size={20} /></>}
                  </button>
                )}
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
