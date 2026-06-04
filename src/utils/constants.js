// ─────────────────────────────────────────────
// constants.js — App-wide constant values
// ─────────────────────────────────────────────

// How many categories to show on Home before "View All"
export const CATEGORIES_HOME_LIMIT = 8;

// Full service categories on Thekedaar (40 total)
export const CATEGORIES = [
  { id: "construction", icon: "construction", emoji: "🏗️", key: "cat.construction", subtitleKey: "cat.construction.subtitle" },
  { id: "interior_finishing", icon: "carpentry", emoji: "🪑", key: "cat.interior_finishing", subtitleKey: "cat.interior_finishing.subtitle" },
  { id: "electrical", icon: "electrical", emoji: "⚡", key: "cat.electrical", subtitleKey: "cat.electrical.subtitle" },
  { id: "plumbing", icon: "plumbing", emoji: "🔧", key: "cat.plumbing", subtitleKey: "cat.plumbing.subtitle" },
  { id: "appliance_repair", icon: "ac", emoji: "🔌", key: "cat.appliance_repair", subtitleKey: "cat.appliance_repair.subtitle" },
  { id: "cleaning", icon: "shuttering", emoji: "🧹", key: "cat.cleaning", subtitleKey: "cat.cleaning.subtitle" },
  { id: "painting", icon: "painting", emoji: "🎨", key: "cat.painting", subtitleKey: "cat.painting.subtitle" },
  { id: "events_wedding", icon: "tent", emoji: "💐", key: "cat.events_wedding", subtitleKey: "cat.events_wedding.subtitle" },
  { id: "labour_group", icon: "labour", emoji: "👷", key: "cat.labour_group", subtitleKey: "cat.labour_group.subtitle" },
  { id: "transport", icon: "transport", emoji: "🚛", key: "cat.transport", subtitleKey: "cat.transport.subtitle" },
  { id: "agriculture", icon: "farming", emoji: "🌾", key: "cat.agriculture", subtitleKey: "cat.agriculture.subtitle" },
  { id: "industrial", icon: "fabrication", emoji: "🏭", key: "cat.industrial", subtitleKey: "cat.industrial.subtitle" },
  { id: "institutional_food", icon: "cook", emoji: "🍱", key: "cat.institutional_food", subtitleKey: "cat.institutional_food.subtitle" },
  { id: "healthcare", icon: "guard", emoji: "🏥", key: "cat.healthcare", subtitleKey: "cat.healthcare.subtitle" },
  { id: "personal_care", icon: "salon", emoji: "💆", key: "cat.personal_care", subtitleKey: "cat.personal_care.subtitle" },
  { id: "education_tutoring", icon: "key", emoji: "📚", key: "cat.education_tutoring", subtitleKey: "cat.education_tutoring.subtitle" },
  { id: "retail_shop", icon: "fabrication", emoji: "🏪", key: "cat.retail_shop", subtitleKey: "cat.retail_shop.subtitle" },
  { id: "govt_municipal", icon: "guard", emoji: "🏛️", key: "cat.govt_municipal", subtitleKey: "cat.govt_municipal.subtitle" },
  { id: "it_tech", icon: "electrical", emoji: "💻", key: "cat.it_tech", subtitleKey: "cat.it_tech.subtitle" },
  { id: "seasonal_specialty", icon: "tent", emoji: "🎪", key: "cat.seasonal_specialty", subtitleKey: "cat.seasonal_specialty.subtitle" },
  { id: "software_dev", icon: "electrical", emoji: "🖥️", key: "cat.software_dev", subtitleKey: "cat.software_dev.subtitle" },
  { id: "digital_marketing", icon: "key", emoji: "📱", key: "cat.digital_marketing", subtitleKey: "cat.digital_marketing.subtitle" },
  { id: "design_creative", icon: "painting", emoji: "🎭", key: "cat.design_creative", subtitleKey: "cat.design_creative.subtitle" },
  { id: "legal_compliance", icon: "guard", emoji: "⚖️", key: "cat.legal_compliance", subtitleKey: "cat.legal_compliance.subtitle" },
  { id: "accounting_finance", icon: "key", emoji: "📊", key: "cat.accounting_finance", subtitleKey: "cat.accounting_finance.subtitle" },
  { id: "hr_staffing", icon: "labour", emoji: "🤝", key: "cat.hr_staffing", subtitleKey: "cat.hr_staffing.subtitle" },
  { id: "media_content", icon: "tent", emoji: "🎬", key: "cat.media_content", subtitleKey: "cat.media_content.subtitle" },
  { id: "event_management", icon: "catering", emoji: "🎉", key: "cat.event_management", subtitleKey: "cat.event_management.subtitle" },
  { id: "security_services", icon: "guard", emoji: "🛡️", key: "cat.security_services", subtitleKey: "cat.security_services.subtitle" },
  { id: "printing_publishing", icon: "fabrication", emoji: "🖨️", key: "cat.printing_publishing", subtitleKey: "cat.printing_publishing.subtitle" },
  { id: "tailoring_textile", icon: "tailor", emoji: "🧵", key: "cat.tailoring_textile", subtitleKey: "cat.tailoring_textile.subtitle" },
  { id: "food_processing", icon: "cook", emoji: "🥘", key: "cat.food_processing", subtitleKey: "cat.food_processing.subtitle" },
  { id: "waste_management", icon: "drain", emoji: "♻️", key: "cat.waste_management", subtitleKey: "cat.waste_management.subtitle" },
  { id: "real_estate", icon: "construction", emoji: "🏠", key: "cat.real_estate", subtitleKey: "cat.real_estate.subtitle" },
  { id: "automobile", icon: "mechanic", emoji: "🚗", key: "cat.automobile", subtitleKey: "cat.automobile.subtitle" },
  { id: "renewable_energy", icon: "electrical", emoji: "☀️", key: "cat.renewable_energy", subtitleKey: "cat.renewable_energy.subtitle" },
  { id: "tourism_hospitality", icon: "catering", emoji: "🏨", key: "cat.tourism_hospitality", subtitleKey: "cat.tourism_hospitality.subtitle" },
  { id: "research_data", icon: "key", emoji: "🔬", key: "cat.research_data", subtitleKey: "cat.research_data.subtitle" },
  { id: "animal_veterinary", icon: "farming", emoji: "🐾", key: "cat.animal_veterinary", subtitleKey: "cat.animal_veterinary.subtitle" },
  { id: "spiritual_religious", icon: "tent", emoji: "🙏", key: "cat.spiritual_religious", subtitleKey: "cat.spiritual_religious.subtitle" },
];

// Sort options for search results
export const SORT_OPTIONS = [
  { value: "rating", labelKey: "search.sort_rating" },
  { value: "distance", labelKey: "search.sort_distance" },
  { value: "price", labelKey: "search.sort_price" },
];

// OTP resend countdown in seconds
export const OTP_RESEND_SECONDS = 30;

// Max file sizes
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_PORTFOLIO_PHOTOS = 5;

// WhatsApp deep-link base (no API cost)
export const WHATSAPP_URL = (phone, name) =>
  `https://wa.me/91${phone}?text=${encodeURIComponent(
    `Hello! I found you on Thekedaar. I need your services.`
  )}`;

// Star rating options
export const STAR_RATINGS = [1, 2, 3, 4, 5];

// User roles
export const ROLES = { CUSTOMER: "customer", CONTRACTOR: "contractor", ADMIN: "admin" };

// Quick Service Categories (20 total matching localized daily/emergency needs)
export const QUICK_SERVICE_CATEGORIES = [
  { id: "ac_repair", labelKey: "quick.ac", icon: "ac", price: 499 },
  { id: "mason_daily", labelKey: "quick.mason", icon: "mason", price: 599 },
  { id: "mazdoor_daily", labelKey: "quick.helper", icon: "helper", price: 399 },
  { id: "shuttering_daily", labelKey: "quick.shuttering", icon: "shuttering", price: 599 },
  { id: "tractor_trolley", labelKey: "quick.tractor", icon: "tractor", price: 2499 },
  { id: "plumbing_quick", labelKey: "quick.plumber", icon: "plumber", price: 199 },
  { id: "electrical_quick", labelKey: "quick.electrician", icon: "electrician", price: 199 },
  { id: "ro_service", labelKey: "quick.ro", icon: "ro", price: 299 },
  { id: "washing_machine", labelKey: "quick.washing", icon: "washing", price: 399 },
  { id: "refrigerator", labelKey: "quick.fridge", icon: "fridge", price: 449 },
  { id: "pest_control", labelKey: "quick.pest", icon: "pest", price: 599 },
  { id: "drain_choke", labelKey: "quick.drain", icon: "drain", price: 299 },
  { id: "halwai_cook", labelKey: "quick.cook", icon: "cook", price: 1499 },
  { id: "doorstep_mechanic", labelKey: "quick.mechanic", icon: "mechanic", price: 299 },
  { id: "puncture_jumpstart", labelKey: "quick.puncture", icon: "puncture", price: 199 },
  { id: "salon_barber", labelKey: "quick.salon", icon: "salon", price: 149 },
  { id: "chowkidar_guard", labelKey: "quick.guard", icon: "guard", price: 399 },
  { id: "locksmith_key", labelKey: "quick.key", icon: "key", price: 199 },
  { id: "tank_cleaning", labelKey: "quick.tank", icon: "tank", price: 399 },
  { id: "tailor_alteration", labelKey: "quick.tailor", icon: "tailor", price: 149 },
];
