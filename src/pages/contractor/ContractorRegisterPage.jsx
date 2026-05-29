import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiGrid,
  FiHome,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUpload,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { authAPI, contractorAPI } from "../../services/api";
import LocationSearchInput from "../../components/common/LocationSearchInput";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { CATEGORIES, QUICK_SERVICE_CATEGORIES } from "../../utils/constants";
import {
  isValidEmail,
  isValidImageFile,
  isValidPassword,
  isValidPhone,
  sanitize,
  sanitizeForm,
} from "../../utils/validators";
import { getQuestionnaireForCategory } from "../../utils/questionnaires";

const STEPS = [
  { id: 1, label: "Type" },
  { id: 2, label: "Identity" },
  { id: 3, label: "Details" },
  { id: 4, label: "Verify" },
];

const PROVIDER_TYPES = [
  {
    id: "project",
    title: "Contractor",
    subtitle: "Projects, renovations, civil work, long scope jobs",
    badge: "Project bids",
    icon: FiBriefcase,
    categoryMode: "project",
    categoryTitle: "Select your project category",
    categoryHelp: "This decides the project questions customers will see before meeting you.",
    flags: { is_labour_group: false, is_responsibility_model: true },
    accent: "cyan",
  },
  {
    id: "quick",
    title: "Quick Service Provider",
    subtitle: "Fast home repairs, visits, installation and small jobs",
    badge: "Same-day work",
    icon: FiZap,
    categoryMode: "quick",
    categoryTitle: "Select your quick service",
    categoryHelp: "Choose the service you can accept as a direct booking.",
    flags: { is_labour_group: false, is_responsibility_model: false },
    accent: "indigo",
  },
  {
    id: "labour",
    title: "Labour Group Leader",
    subtitle: "Masons, helpers, painters, crews and site manpower",
    badge: "Team hiring",
    icon: FiUsers,
    categoryMode: "labour",
    categoryTitle: "Confirm your labour category",
    categoryHelp: "Labour leaders are listed as team providers with worker breakdowns.",
    flags: { is_labour_group: true, is_responsibility_model: false },
    accent: "amber",
  },
];

const QUICK_PROVIDER_QUESTIONS = {
  ac_repair: [
    q("ac_work", "Which AC service calls do you accept?", ["Wet service", "Gas refill", "PCB or cooling diagnosis", "Install / uninstall"]),
    q("ac_tools", "Which AC tools do you carry on visits?", ["Vacuum pump", "Pressure gauge", "Jet washer", "Leak detector"]),
  ],
  electrician: [
    q("electrical_jobs", "Which electrical calls can you take?", ["Switchboard repair", "Fan / light fitting", "MCB or inverter work", "Hidden wiring fault"]),
    q("electrical_safety", "Which safety checks do you perform?", ["Load check", "Earthing check", "Short-circuit tracing", "Appliance isolation"]),
  ],
  plumber: [
    q("plumbing_jobs", "Which plumbing jobs can you take?", ["Leak repair", "Tap and sanitary fitting", "Drain choke", "Pipeline work"]),
    q("plumbing_tools", "Which plumbing tools do you carry?", ["Drill machine", "Pipe cutter", "Drain spring", "CPVC/PPR tool"]),
  ],
  carpenter: [
    q("carpentry_calls", "Which carpentry visits do you accept?", ["Door repair", "Furniture assembly", "Modular fitting repair", "Lock / hinge replacement"]),
    q("carpentry_tools", "Which tools do you carry?", ["Drill and bits", "Circular saw", "Laminate trimmer", "Hand tool kit"]),
  ],
  home_cleaning: [
    q("cleaning_scope", "Which cleaning packages do you accept?", ["1BHK / 2BHK deep clean", "Kitchen deep clean", "Bathroom deep clean", "Move-in / move-out clean"]),
    q("cleaning_materials", "What cleaning setup do you bring?", ["Chemicals included", "Machine scrubbing", "Vacuum cleaner", "Customer provides material"]),
  ],
  pest_control: [
    q("pest_scope", "Which pest-control treatments do you offer?", ["Cockroach gel", "Termite treatment", "Bed bug treatment", "Rodent control"]),
    q("pest_safety", "What safety process do you follow?", ["Odourless chemicals", "Child-safe guidance", "Kitchen-safe protocol", "Warranty visit"]),
  ],
  painter: [
    q("paint_scope", "Which quick painting jobs do you accept?", ["One-room repaint", "Touch-up patches", "Texture repair", "Putty and primer patch"]),
    q("paint_material", "How do you handle paint material?", ["Customer provides paint", "I procure paint", "Brand-specific work", "Only labour visit"]),
  ],
  mechanic: [
    q("vehicle_scope", "Which vehicle calls do you take?", ["Bike breakdown", "Car battery jump", "Puncture support", "Basic servicing"]),
    q("mechanic_visit", "Where can you work?", ["Customer home", "Roadside nearby", "Workshop only", "Pickup support"]),
  ],
  locksmith: [
    q("lock_scope", "Which lock jobs do you handle?", ["Door lock opening", "Lock replacement", "Duplicate key", "Digital lock setup"]),
    q("lock_verification", "What proof do you check before opening locks?", ["Photo ID", "Address proof", "Owner confirmation", "Society guard confirmation"]),
  ],
  packers_movers: [
    q("moving_scope", "Which shifting jobs do you accept?", ["Few-item shifting", "1BHK shifting", "Office small move", "Packing-only visit"]),
    q("moving_assets", "What do you provide?", ["Packing boxes", "Bubble wrap", "Tempo / mini truck", "Loading labour"]),
  ],
  salon_women: [
    q("salon_services_women", "Which salon-at-home services do you offer?", ["Facial / clean-up", "Waxing / threading", "Hair spa / hair cut", "Manicure / pedicure"]),
    q("salon_hygiene_women", "What hygiene setup do you carry?", ["Disposable kit", "Sanitized tools", "Branded products", "Customer product on request"]),
  ],
  grooming_men: [
    q("grooming_services_men", "Which men's grooming services do you offer?", ["Hair cut", "Beard trim", "Head massage", "Facial / clean-up"]),
    q("grooming_hygiene_men", "What grooming kit do you carry?", ["Sanitized trimmer", "Disposable cape", "Fresh blades", "Branded products"]),
  ],
  tv_repair: [
    q("tv_scope", "Which TV jobs do you accept?", ["No display", "Sound issue", "Wall mounting", "Motherboard / panel diagnosis"]),
    q("tv_types", "Which TV types can you handle?", ["LED", "OLED / QLED", "Smart TV setup", "Set-top / HDMI issue"]),
  ],
  washing_machine: [
    q("washing_scope", "Which washing machine issues do you handle?", ["No spin", "Water leakage", "Drain problem", "Installation / demo"]),
    q("washing_types", "Which machines do you service?", ["Top load", "Front load", "Semi-automatic", "Washer dryer"]),
  ],
  refrigerator: [
    q("fridge_scope", "Which refrigerator issues do you handle?", ["Cooling issue", "Gas refill", "Compressor diagnosis", "Water leakage"]),
    q("fridge_types", "Which fridge types do you service?", ["Single door", "Double door", "Side-by-side", "Commercial fridge"]),
  ],
  ro_service: [
    q("ro_scope", "Which RO jobs do you accept?", ["Filter change", "Membrane change", "Leak repair", "New installation"]),
    q("ro_parts", "How do you handle parts?", ["Carry standard filters", "Customer buys parts", "Brand-specific parts", "Service-only visit"]),
  ],
  cctv: [
    q("cctv_scope", "Which CCTV jobs do you accept?", ["New camera install", "DVR / NVR setup", "Mobile viewing setup", "Fault tracing"]),
    q("cctv_systems", "Which systems can you handle?", ["Analog CCTV", "IP camera", "Wi-Fi camera", "Door camera"]),
  ],
  welding: [
    q("welding_scope", "Which welding jobs do you accept?", ["Gate repair", "Grill fabrication", "Frame repair", "On-site welding"]),
    q("welding_setup", "What setup can you bring?", ["Arc welding", "Gas welding", "Cutting tools", "Helper included"]),
  ],
};

const PROJECT_CATEGORY_QUESTIONS = {
  events: [
    q("event_scope", "Which event contracts do you manage?", ["Wedding setup", "Birthday / private party", "Corporate event", "Tent and stage setup"]),
    q("event_assets", "What event assets can you arrange?", ["Decor team", "Lighting and sound", "Catering partners", "Furniture and tenting"]),
  ],
  carpentry: [
    q("carpentry_project_scope", "Which carpentry projects do you take?", ["Modular kitchen", "Wardrobes", "Doors and windows", "Office furniture"]),
    q("carpentry_material", "How do you work with material?", ["Plywood and laminate included", "Labour-only", "Factory-made modules", "Client-selected brands"]),
  ],
  farming: [
    q("farming_scope", "Which farming contracts do you handle?", ["Land preparation", "Irrigation setup", "Harvest labour", "Equipment operation"]),
    q("farming_equipment", "Which farm resources can you provide?", ["Tractor", "Sprayer", "Pump setup", "Seasonal labour team"]),
  ],
  transport: [
    q("transport_scope", "Which transport work do you take?", ["Construction material", "House shifting", "Commercial delivery", "Heavy goods movement"]),
    q("transport_assets", "Which vehicles can you arrange?", ["Pickup", "Mini truck", "Tempo", "Large truck"]),
  ],
  cleaning: [
    q("cleaning_contract_scope", "Which cleaning contracts do you take?", ["Residential deep clean", "Office housekeeping", "Post-construction clean", "Society common areas"]),
    q("cleaning_contract_team", "What cleaning resources do you provide?", ["Trained staff", "Machines", "Chemicals", "Supervisor included"]),
  ],
  property: [
    q("property_scope", "Which property services do you provide?", ["Rental brokerage", "Sale / purchase", "Property management", "Tenant verification support"]),
    q("property_area", "What property type is your strength?", ["Residential flats", "Plots", "Commercial shops", "Warehouses / offices"]),
  ],
  other: [
    q("specialist_scope", "What kind of specialist work do you want listed?", ["Custom installation", "Repair contract", "Maintenance AMC", "Skilled consultation"]),
    q("specialist_proof", "What proves your specialist capability?", ["Photos of work", "Client references", "Certificate / license", "Tool or machine ownership"]),
  ],
};

const LABOUR_CREW_TEMPLATES = [
  { role: "Mason", count: 4, rate: 650 },
  { role: "Helper", count: 6, rate: 450 },
  { role: "Painter", count: 4, rate: 550 },
  { role: "Carpenter", count: 2, rate: 800 },
];

const DETAIL_COPY = {
  project: {
    eyebrow: "Project Capability",
    title: "Set project scope, team strength, and proof",
    descriptionLabel: "Project profile",
    descriptionPlaceholder: "Mention project types, materials, site supervision, billing model, and recent completed work.",
    servicesLabel: "Project services, comma separated",
    servicesPlaceholder: "RCC work, turnkey construction, interior execution, plumbing layout",
    rateLabel: "Starting project value",
  },
  quick: {
    eyebrow: "Visit Readiness",
    title: "Set visit pricing, coverage, and proof",
    descriptionLabel: "Service visit profile",
    descriptionPlaceholder: "Mention exact services, visit process, hygiene/safety setup, tools carried, and what is included in your base rate.",
    servicesLabel: "Bookable service menu, comma separated",
    servicesPlaceholder: "Facial, waxing, threading, manicure, pedicure",
    rateLabel: "Base visit rate",
  },
  labour: {
    eyebrow: "Crew Capability",
    title: "Set crew strength, wage structure, and proof",
    descriptionLabel: "Labour crew profile",
    descriptionPlaceholder: "Mention worker categories, attendance reliability, site discipline, supervisor role, and wage/billing model.",
    servicesLabel: "Crew work types, comma separated",
    servicesPlaceholder: "Masonry, helpers, plaster, shuttering, painting crew",
    rateLabel: "Lead booking rate",
  },
};

const QUICK_SERVICE_PLACEHOLDERS = {
  ac_repair: "Wet service, gas refill, cooling diagnosis, AC installation",
  electrician: "Switchboard repair, fan fitting, MCB work, inverter wiring",
  plumber: "Leak repair, tap fitting, drain cleaning, pipeline repair",
  carpenter: "Door repair, hinge replacement, furniture assembly, modular repair",
  home_cleaning: "Kitchen deep clean, bathroom cleaning, full home cleaning",
  pest_control: "Cockroach treatment, termite treatment, bed bug treatment",
  painter: "Room repaint, patch touch-up, texture repair, putty work",
  mechanic: "Bike repair, battery jump, puncture support, basic servicing",
  locksmith: "Lock opening, lock replacement, duplicate key, digital lock setup",
  packers_movers: "Few-item shifting, 1BHK shifting, packing, loading labour",
  salon_women: "Facial, waxing, threading, hair spa, manicure, pedicure",
  grooming_men: "Hair cut, beard trim, massage, facial clean-up",
  tv_repair: "No display diagnosis, wall mounting, sound issue, smart TV setup",
  washing_machine: "No spin repair, leakage repair, drain issue, installation",
  refrigerator: "Cooling issue, gas refill, compressor check, leakage repair",
  ro_service: "Filter change, membrane change, leak repair, RO installation",
  cctv: "Camera installation, DVR setup, mobile viewing, fault tracing",
  welding: "Gate repair, grill fabrication, frame repair, on-site welding",
};

function q(id, question, labels, type = "multi") {
  return {
    id,
    question,
    type,
    options: labels.map((label) => ({
      label,
      value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    })),
  };
}

function asNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value) {
  const num = Number(value || 0);
  return num ? `Rs ${num.toLocaleString("en-IN")}` : "Not set";
}

function titleFromId(id) {
  return String(id || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getCategoryLabel(category) {
  if (!category) return "";
  if (category.label) return category.label;
  if (category.id === "labour_group") return "Labour Group";
  return titleFromId(category.id);
}

function getAccentClasses(accent, selected = false) {
  const map = {
    cyan: selected
      ? "border-cyan-400 bg-cyan-500/10 text-cyan-700 shadow-cyan-500/10 dark:border-cyan-300 dark:bg-cyan-400/10 dark:text-cyan-200"
      : "hover:border-cyan-400/70 hover:bg-cyan-500/5",
    indigo: selected
      ? "border-indigo-400 bg-indigo-500/10 text-indigo-700 shadow-indigo-500/10 dark:border-indigo-300 dark:bg-indigo-400/10 dark:text-indigo-200"
      : "hover:border-indigo-400/70 hover:bg-indigo-500/5",
    amber: selected
      ? "border-amber-400 bg-amber-500/10 text-amber-700 shadow-amber-500/10 dark:border-amber-300 dark:bg-amber-400/10 dark:text-amber-200"
      : "hover:border-amber-400/70 hover:bg-amber-500/5",
  };
  return map[accent] || map.indigo;
}

function buildQuickQuestions(categoryId) {
  return QUICK_PROVIDER_QUESTIONS[categoryId] || [
    q(`${categoryId}_scope`, `Which ${titleFromId(categoryId)} services do you offer?`, ["Basic service", "Advanced service", "Inspection visit", "Scheduled maintenance"]),
    q(`${categoryId}_setup`, `What setup do you carry for ${titleFromId(categoryId)} work?`, ["Own tools", "Helper available", "Material support", "Customer material only"]),
  ];
}

function visibleProjectQuestions(categoryId, answers) {
  const questions = PROJECT_CATEGORY_QUESTIONS[categoryId] || getQuestionnaireForCategory(categoryId, answers);
  return questions.map((item) => ({
    ...item,
    question: item.question,
  }));
}

function ProviderCard({ provider, selected, onClick }) {
  const Icon = provider.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[176px] overflow-hidden rounded-2xl border bg-[var(--color-surface)] p-5 text-left shadow-xl shadow-black/10 transition-all duration-300 ${getAccentClasses(provider.accent, selected)}`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--color-border)] dark:bg-white/20" />
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selected ? "bg-[var(--color-heading)] text-[var(--color-bg)]" : "bg-[var(--color-bg)] text-[var(--color-muted)]"} transition-colors`}>
          <Icon size={22} />
        </span>
        <span className="rounded-full border border-current/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
          {provider.badge}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-black text-[var(--color-heading)]">{provider.title}</h3>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-muted)]">{provider.subtitle}</p>
      {selected && (
        <span className="absolute bottom-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-heading)] text-[var(--color-bg)]">
          <FiCheck size={16} />
        </span>
      )}
    </button>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </span>
      {children}
      {error && <p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}
    </label>
  );
}

function FileDrop({ icon: Icon, title, hint, value, onChange, multiple = false }) {
  return (
    <label className="flex min-h-[170px] cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-5 transition-colors hover:border-indigo-400/60">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface)] text-indigo-500">
        <Icon size={20} />
      </span>
      <span>
        <strong className="block text-sm font-black text-[var(--color-heading)]">{title}</strong>
        <span className="mt-1 block text-xs font-semibold leading-relaxed text-[var(--color-muted)]">{hint}</span>
        {value && (
          <span className="mt-3 flex items-center gap-2 text-xs font-black text-emerald-600">
            <FiCheckCircle size={14} />
            {Array.isArray(value) ? `${value.length} files selected` : value.name}
          </span>
        )}
      </span>
      <input
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={onChange}
      />
    </label>
  );
}

export default function ContractorRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { lat, lng, address, accuracy, request: requestGps, loading: gpsLoading } = useGeolocation();

  const [step, setStep] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [form, setForm] = useState({
    provider_type: "",
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
    service_radius_km: "8",
    response_time: "",
    location_text: "",
    profile_photo_file: null,
    portfolio_files: [],
    id_proof_file: null,
    onboarding_data: {},
    labour_crew: [],
  });

  const selectedProvider = useMemo(
    () => PROVIDER_TYPES.find((item) => item.id === form.provider_type),
    [form.provider_type]
  );

  const categoryOptions = useMemo(() => {
    if (!selectedProvider) return [];
    if (selectedProvider.categoryMode === "quick") {
      return QUICK_SERVICE_CATEGORIES.map((item) => ({
        ...item,
        id: item.id,
        subtitle: `Starting price ${money(item.price)}`,
      }));
    }
    if (selectedProvider.categoryMode === "labour") {
      return CATEGORIES.filter((item) => item.id === "labour_group");
    }
    return CATEGORIES.filter((item) => item.id !== "labour_group");
  }, [selectedProvider]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((item) => item.id === form.category),
    [categoryOptions, form.category]
  );

  const adaptiveQuestions = useMemo(() => {
    if (!form.category || !selectedProvider) return [];
    if (selectedProvider.categoryMode === "quick") return buildQuickQuestions(form.category);
    return visibleProjectQuestions(form.category, form.onboarding_data);
  }, [form.category, selectedProvider, form.onboarding_data]);

  const crewStats = useMemo(() => {
    const totalCount = form.labour_crew.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const totalDaily = form.labour_crew.reduce(
      (sum, item) => sum + (Number(item.count) || 0) * (Number(item.rate) || 0),
      0
    );
    return { totalCount, totalDaily };
  }, [form.labour_crew]);

  const progress = useMemo(() => {
    const stepProgress = ((step - 1) / STEPS.length) * 100;
    if (step !== 3 || adaptiveQuestions.length === 0) return Math.round(stepProgress);
    const detailShare = (questionIndex / (adaptiveQuestions.length + 1)) * (100 / STEPS.length);
    return Math.min(100, Math.round(stepProgress + detailShare));
  }, [adaptiveQuestions.length, questionIndex, step]);

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
    setErrors((prev) => ({ ...prev, location_text: undefined }));
  }, [lat, lng, address, accuracy]);

  function update(field) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function chooseProvider(provider) {
    setForm((prev) => ({
      ...prev,
      provider_type: provider.id,
      category: provider.id === "labour" ? "labour_group" : "",
      daily_rate: provider.id === "quick" ? prev.daily_rate || "299" : prev.daily_rate,
      team_size: provider.id === "labour" ? prev.team_size || "8" : prev.team_size || "1",
      labour_crew: provider.id === "labour" && prev.labour_crew.length === 0 ? LABOUR_CREW_TEMPLATES.slice(0, 2) : prev.labour_crew,
      onboarding_data: {},
    }));
    setQuestionIndex(0);
    setErrors((prev) => ({ ...prev, provider_type: undefined, category: undefined }));
  }

  function chooseCategory(categoryId) {
    setForm((prev) => ({
      ...prev,
      category: categoryId,
      services: selectedProvider?.categoryMode === "quick" ? getCategoryLabel({ id: categoryId, label: QUICK_SERVICE_CATEGORIES.find((item) => item.id === categoryId)?.label }) : prev.services,
      onboarding_data: {},
    }));
    setQuestionIndex(0);
    setErrors((prev) => ({ ...prev, category: undefined }));
  }

  function setQuestionAnswer(question, value) {
    setForm((prev) => {
      const current = prev.onboarding_data[question.id] || [];
      const nextValue =
        question.type === "single"
          ? [value]
          : current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value];

      return {
        ...prev,
        onboarding_data: {
          ...prev.onboarding_data,
          [question.id]: nextValue,
        },
      };
    });
    setErrors((prev) => ({ ...prev, questionnaire: undefined }));
  }

  function setCrew(index, field, value) {
    setForm((prev) => {
      const labour_crew = prev.labour_crew.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: field === "role" ? value : Math.max(0, Number(value) || 0) } : item
      );
      return { ...prev, labour_crew };
    });
  }

  function addCrewRow() {
    setForm((prev) => ({
      ...prev,
      labour_crew: [...prev.labour_crew, { role: "", count: 1, rate: 450 }],
    }));
  }

  function removeCrewRow(index) {
    setForm((prev) => ({
      ...prev,
      labour_crew: prev.labour_crew.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function validateStep(targetStep = step) {
    const nextErrors = {};

    if (targetStep === 1) {
      if (!form.provider_type) nextErrors.provider_type = "Choose how you want to register.";
      if (!form.category) nextErrors.category = "Choose a category to continue.";
    }

    if (targetStep === 2) {
      if (!form.name.trim()) nextErrors.name = "Enter the owner's full name.";
      if (!form.business_name.trim()) nextErrors.business_name = "Enter your public business name.";
      if (!isValidPhone(form.phone)) nextErrors.phone = "Enter a valid 10-digit mobile number.";
      if (!isValidEmail(form.email)) nextErrors.email = "Enter a valid email address.";
      if (!isValidPassword(form.password)) nextErrors.password = "Use at least 8 characters.";
    }

    if (targetStep === 3) {
      if (questionIndex < adaptiveQuestions.length) {
        const question = adaptiveQuestions[questionIndex];
        if (!form.onboarding_data[question.id]?.length) {
          nextErrors.questionnaire = "Select at least one option.";
        }
      } else {
        if (!form.description.trim() || form.description.trim().length < 40) {
          nextErrors.description = "Write at least 40 characters about your work.";
        }
        if (selectedProvider?.categoryMode === "labour" && Number(form.team_size || 0) < 2) {
          nextErrors.team_size = "Labour group leaders need at least 2 workers.";
        }
        if (form.daily_rate && Number(form.daily_rate) < 0) nextErrors.daily_rate = "Enter a valid rate.";
      }
    }

    if (targetStep === 4) {
      if (!form.location_text.trim()) {
        nextErrors.location_text = "Enter your operating area.";
      } else if (!selectedLocation?.lat || !selectedLocation?.lng) {
        setSelectedLocation({
          lat: Number(lat || 28.6139),
          lng: Number(lng || 77.2090),
          address: form.location_text,
          accuracy_m: accuracy ?? null,
        });
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

    if (step === 3 && questionIndex < adaptiveQuestions.length) {
      setQuestionIndex((prev) => prev + 1);
      return;
    }
    setStep((prev) => Math.min(STEPS.length, prev + 1));
  }

  function goBack() {
    if (step === 3 && questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
  }

  function handleLocationSelect(selection) {
    setSelectedLocation(selection);
    setLocationQuery(selection.address || "");
    setForm((prev) => ({ ...prev, location_text: selection.address || prev.location_text }));
    setErrors((prev) => ({ ...prev, location_text: undefined }));
  }

  function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file).ok) {
      toast.error("Upload a JPG, PNG, or WebP image under 5MB.");
      return;
    }
    setForm((prev) => ({ ...prev, profile_photo_file: file }));
  }

  function handlePortfolio(event) {
    const files = Array.from(event.target.files || []).slice(0, 5);
    if (!files.length) return;
    if (files.some((file) => !isValidImageFile(file).ok)) {
      toast.error("Portfolio images must be JPG, PNG, or WebP under 5MB.");
      return;
    }
    setForm((prev) => ({ ...prev, portfolio_files: files }));
  }

  function handleIdProof(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file).ok) {
      toast.error("ID proof must be a JPG, PNG, or WebP file under 5MB.");
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
      const registerRes = await authAPI.register({
        name: sanitize(form.name),
        email: sanitize(form.email),
        phone: sanitize(form.phone),
        password: form.password,
        role: "contractor",
      });
      login(registerRes.data.user, registerRes.data.token);

      const flags = selectedProvider?.flags || {};
      const categoryLabel = getCategoryLabel(selectedCategory || { id: form.category });
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
        team_size: asNumberOrNull(form.team_size) || (selectedProvider?.categoryMode === "labour" ? crewStats.totalCount || 2 : 1),
        is_labour_group: !!flags.is_labour_group,
        is_responsibility_model: !!flags.is_responsibility_model,
        services: services.length ? services : [categoryLabel],
        location_text: form.location_text,
        latitude: Number(selectedLocation.lat),
        longitude: Number(selectedLocation.lng),
        lat: Number(selectedLocation.lat),
        lng: Number(selectedLocation.lng),
        onboarding_data: {
          ...form.onboarding_data,
          provider_type: form.provider_type,
          category_label: categoryLabel,
          service_radius_km: asNumberOrNull(form.service_radius_km),
          response_time: form.response_time || null,
          min_project_value: asNumberOrNull(form.min_project_value),
        },
        labour_crew: form.labour_crew.filter((item) => item.role || item.count || item.rate),
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

      toast.success("Registration submitted. Your profile is ready for review.");
      navigate("/contractor/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not complete registration.");
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = adaptiveQuestions[questionIndex];
  const isFinalDetailPanel = step === 3 && questionIndex >= adaptiveQuestions.length;
  const selectedAccent = selectedProvider?.accent || "indigo";
  const detailCopy = DETAIL_COPY[selectedProvider?.categoryMode] || DETAIL_COPY.project;
  const servicesPlaceholder =
    selectedProvider?.categoryMode === "quick"
      ? QUICK_SERVICE_PLACEHOLDERS[form.category] || detailCopy.servicesPlaceholder
      : detailCopy.servicesPlaceholder;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] px-4 pb-16 pt-24 text-[var(--color-heading)] md:px-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.22) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(to bottom, black, transparent 75%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_45%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_45%)]" />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] dark:shadow-black/30">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--color-border)] dark:bg-white/20" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">Thekedaar Partner</p>
              <h1 className="mt-4 font-display text-3xl font-black leading-tight text-[var(--color-heading)]">
                Build a verified work profile
              </h1>
              <p className="mt-4 text-sm font-semibold leading-7 text-[var(--color-muted)]">
                Your questions now change by provider type, category, and actual work. Customers see cleaner matching from day one.
              </p>

              <div className="mt-8 h-2 overflow-hidden rounded-full bg-[var(--color-bg-elevated)] dark:bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-300 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-6 space-y-3">
                {STEPS.map((item) => {
                  const active = step === item.id;
                  const complete = step > item.id;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${active || complete ? "bg-indigo-500 text-white" : "bg-[var(--color-bg)] text-[var(--color-muted)]"}`}>
                        {complete ? <FiCheck size={15} /> : item.id}
                      </span>
                      <span className={`text-sm font-black ${active ? "text-[var(--color-heading)]" : "text-[var(--color-muted)]"}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">Profile Preview</p>
              <h2 className="mt-3 text-lg font-black text-[var(--color-heading)]">{form.business_name || form.name || "Your public name"}</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">
                {selectedProvider?.title || "Provider type"} {selectedCategory ? `// ${getCategoryLabel(selectedCategory)}` : ""}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-bold text-[var(--color-muted)]">
                <span className="rounded-xl bg-[var(--color-surface)] px-3 py-2 dark:bg-white/[0.04]">{money(form.daily_rate)}</span>
                <span className="rounded-xl bg-[var(--color-surface)] px-3 py-2 dark:bg-white/[0.04]">{form.team_size || 1} people</span>
              </div>
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] dark:shadow-black/30 md:p-8">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--color-border)] dark:bg-white/20" />
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section key="step-1" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="space-y-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-500">Start Here</p>
                  <h2 className="mt-3 font-display text-3xl font-black text-[var(--color-heading)]">What kind of provider are you?</h2>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[var(--color-muted)]">
                    Choose one path. The next questions change automatically so you only answer what matters for your work.
                  </p>
                  {errors.provider_type && <p className="mt-3 text-sm font-bold text-rose-500">{errors.provider_type}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {PROVIDER_TYPES.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      selected={form.provider_type === provider.id}
                      onClick={() => chooseProvider(provider)}
                    />
                  ))}
                </div>

                {selectedProvider && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 md:p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">{selectedProvider.categoryTitle}</p>
                        <h3 className="mt-2 text-xl font-black text-[var(--color-heading)]">{selectedProvider.title} category</h3>
                      </div>
                      <p className="max-w-md text-xs font-semibold leading-6 text-[var(--color-muted)]">{selectedProvider.categoryHelp}</p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {categoryOptions.map((category) => {
                        const selected = form.category === category.id;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => chooseCategory(category.id)}
                            className={`min-h-[116px] rounded-2xl border bg-[var(--color-surface)] p-4 text-left transition-all ${getAccentClasses(selectedAccent, selected)}`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="text-sm font-black text-[var(--color-heading)]">{getCategoryLabel(category)}</span>
                              {selected && <FiCheckCircle className="shrink-0" size={17} />}
                            </span>
                            <span className="mt-2 block text-xs font-semibold leading-5 text-[var(--color-muted)]">{category.subtitle}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.category && <p className="mt-3 text-sm font-bold text-rose-500">{errors.category}</p>}
                  </div>
                )}
              </motion.section>
            )}

            {step === 2 && (
              <motion.section key="step-2" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="space-y-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-500">Identity</p>
                  <h2 className="mt-3 font-display text-3xl font-black text-[var(--color-heading)]">Tell customers who they are hiring</h2>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Owner full name" error={errors.name}>
                    <div className="relative">
                      <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input className="input-field !pl-11" value={form.name} onChange={update("name")} placeholder="Amit Kumar" />
                    </div>
                  </Field>
                  <Field label="Public business / team name" error={errors.business_name}>
                    <div className="relative">
                      <FiHome className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input className="input-field !pl-11" value={form.business_name} onChange={update("business_name")} placeholder="Amit Civil Works" />
                    </div>
                  </Field>
                  <Field label="Mobile number" error={errors.phone}>
                    <div className="relative">
                      <FiPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input className="input-field !pl-11" value={form.phone} onChange={update("phone")} inputMode="numeric" placeholder="9876543210" maxLength={10} />
                    </div>
                  </Field>
                  <Field label="Email address" error={errors.email}>
                    <div className="relative">
                      <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input className="input-field !pl-11" value={form.email} onChange={update("email")} type="email" placeholder="you@example.com" />
                    </div>
                  </Field>
                  <Field label="Password" error={errors.password}>
                    <div className="relative">
                      <FiShield className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input className="input-field !pl-11" value={form.password} onChange={update("password")} type="password" placeholder="Minimum 8 characters" />
                    </div>
                  </Field>
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">Selected path</p>
                    <p className="mt-3 text-lg font-black text-[var(--color-heading)]">{selectedProvider?.title}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">{getCategoryLabel(selectedCategory)}</p>
                  </div>
                </div>
              </motion.section>
            )}

            {step === 3 && currentQuestion && (
              <motion.section key={`question-${currentQuestion.id}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="space-y-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-500">
                    Smart Questions {questionIndex + 1} / {adaptiveQuestions.length}
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-black text-[var(--color-heading)]">{currentQuestion.question}</h2>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[var(--color-muted)]">
                    These answers shape your profile, search match, and customer booking prompts.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {currentQuestion.options.map((option) => {
                    const selected = form.onboarding_data[currentQuestion.id]?.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setQuestionAnswer(currentQuestion, option.value)}
                        className={`flex min-h-[92px] items-center justify-between gap-4 rounded-2xl border bg-[var(--color-bg)] p-5 text-left transition-all ${getAccentClasses(selectedAccent, selected)}`}
                      >
                        <span className="text-sm font-black text-[var(--color-heading)]">{option.label}</span>
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${selected ? "border-current bg-current/10" : "border-[var(--color-border)] text-[var(--color-muted)]"}`}>
                          {selected && <FiCheck size={15} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.questionnaire && <p className="text-sm font-bold text-rose-500">{errors.questionnaire}</p>}
              </motion.section>
            )}

            {step === 3 && isFinalDetailPanel && (
              <motion.section key="details-final" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="space-y-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-500 dark:text-indigo-300">{detailCopy.eyebrow}</p>
                  <h2 className="mt-3 font-display text-3xl font-black text-[var(--color-heading)]">{detailCopy.title}</h2>
                </div>

                <Field label={detailCopy.descriptionLabel} error={errors.description}>
                  <textarea
                    className="input-field min-h-[150px] resize-none"
                    value={form.description}
                    onChange={update("description")}
                    maxLength={700}
                    placeholder={detailCopy.descriptionPlaceholder}
                  />
                  <p className="mt-2 text-xs font-semibold text-[var(--color-muted)]">{form.description.length} / 700 characters</p>
                </Field>

                <Field label={detailCopy.servicesLabel}>
                  <input
                    className="input-field"
                    value={form.services}
                    onChange={update("services")}
                    placeholder={servicesPlaceholder}
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-4">
                  <Field label={detailCopy.rateLabel} error={errors.daily_rate}>
                    <input className="input-field" type="number" min="0" value={selectedProvider?.categoryMode === "project" ? form.min_project_value : form.daily_rate} onChange={selectedProvider?.categoryMode === "project" ? update("min_project_value") : update("daily_rate")} placeholder="Amount in Rs" />
                  </Field>
                  <Field label="Experience years">
                    <input className="input-field" type="number" min="0" max="60" value={form.experience_years} onChange={update("experience_years")} placeholder="5" />
                  </Field>
                  <Field label="Team size" error={errors.team_size}>
                    <input className="input-field" type="number" min="1" max="500" value={form.team_size} onChange={update("team_size")} placeholder="1" />
                  </Field>
                  <Field label="Service radius km">
                    <input className="input-field" type="number" min="1" max="100" value={form.service_radius_km} onChange={update("service_radius_km")} placeholder="8" />
                  </Field>
                </div>

                {selectedProvider?.categoryMode === "quick" && (
                  <Field label="Usual response time">
                    <select className="input-field" value={form.response_time} onChange={update("response_time")}>
                      <option value="">Select response time</option>
                      <option value="under_60_min">Under 60 minutes</option>
                      <option value="same_day">Same day</option>
                      <option value="next_day">Next day</option>
                      <option value="scheduled_only">Scheduled only</option>
                    </select>
                  </Field>
                )}

                {selectedProvider?.categoryMode === "labour" && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">Crew Breakdown</p>
                        <h3 className="mt-2 text-xl font-black text-[var(--color-heading)]">{crewStats.totalCount || 0} workers // {money(crewStats.totalDaily)} daily pool</h3>
                      </div>
                      <button type="button" onClick={addCrewRow} className="rounded-xl border border-indigo-400/40 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-500 transition-colors hover:bg-indigo-500/10">
                        Add role
                      </button>
                    </div>
                    <div className="mt-5 space-y-3">
                      {form.labour_crew.map((crew, index) => (
                        <div key={index} className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-[1fr_110px_140px_44px]">
                          <input className="input-field" value={crew.role} onChange={(event) => setCrew(index, "role", event.target.value)} placeholder="Role, e.g. Mason" />
                          <input className="input-field" type="number" min="0" value={crew.count} onChange={(event) => setCrew(index, "count", event.target.value)} placeholder="Qty" />
                          <input className="input-field" type="number" min="0" value={crew.rate} onChange={(event) => setCrew(index, "rate", event.target.value)} placeholder="Rate" />
                          <button type="button" onClick={() => removeCrewRow(index)} className="flex h-11 items-center justify-center rounded-xl bg-rose-500/10 font-black text-rose-500 transition-colors hover:bg-rose-500/20">
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <FileDrop icon={FiCamera} title="Profile photo or logo" hint="A clear face or brand mark builds trust." value={form.profile_photo_file} onChange={handleProfilePhoto} />
                  <FileDrop icon={FiUpload} title="Portfolio photos" hint="Upload up to 5 work samples." value={form.portfolio_files.length ? form.portfolio_files : null} onChange={handlePortfolio} multiple />
                </div>
              </motion.section>
            )}

            {step === 4 && (
              <motion.section key="step-4" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="space-y-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-500">Location and Verification</p>
                  <h2 className="mt-3 font-display text-3xl font-black text-[var(--color-heading)]">Lock your service area</h2>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[var(--color-muted)]">
                    Customers nearby will discover you first. You can use GPS, search an area, or type your operating base.
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                    <Field label="Operating address / area" error={errors.location_text}>
                      <div className="relative">
                        <FiMapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                        <input className="input-field !pl-11" value={form.location_text} onChange={update("location_text")} placeholder="Area, city, landmark" />
                      </div>
                    </Field>

                    <Field label="Search precise locality">
                      <LocationSearchInput
                        value={locationQuery}
                        onChange={setLocationQuery}
                        onSelect={handleLocationSelect}
                        placeholder="Search your locality"
                      />
                    </Field>

                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => requestGps({ enableHighAccuracy: true })} disabled={gpsLoading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-indigo-600 disabled:opacity-60">
                        {gpsLoading ? <LoadingSpinner size="sm" /> : <FiMapPin size={15} />}
                        Use GPS
                      </button>
                      {selectedLocation?.lat && (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-black text-emerald-600">
                          <FiCheckCircle size={15} />
                          Coordinates locked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FileDrop icon={FiFileText} title="ID / GST / license proof" hint="Optional now, but verified profiles rank better." value={form.id_proof_file} onChange={handleIdProof} />
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                      <p className="flex items-center gap-2 text-sm font-black text-[var(--color-heading)]">
                        <FiGrid size={17} />
                        Review Summary
                      </p>
                      <div className="mt-4 space-y-2 text-sm font-semibold text-[var(--color-muted)]">
                        <p>{selectedProvider?.title}</p>
                        <p>{getCategoryLabel(selectedCategory)}</p>
                        <p>{form.services || "Services will use selected category"}</p>
                        <p>{form.location_text || "Location pending"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="mt-10 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center">
            {step > 1 || (step === 3 && questionIndex > 0) ? (
              <button type="button" onClick={goBack} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-heading)] transition-colors hover:bg-[var(--color-bg)]">
                <FiArrowLeft size={15} />
                Back
              </button>
            ) : null}

            {step < STEPS.length ? (
              <button type="button" onClick={goNext} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-7 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-indigo-600 sm:ml-auto">
                Continue
                <FiArrowRight size={15} />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-7 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-indigo-600 disabled:opacity-60 sm:ml-auto">
                {loading ? <LoadingSpinner size="sm" /> : <FiCheckCircle size={16} />}
                Submit Registration
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
