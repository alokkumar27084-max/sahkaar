// ─────────────────────────────────────────────
// constants.js — App-wide constant values
// ─────────────────────────────────────────────

// The 12 service categories on Thekedaar
export const CATEGORIES = [
  { id: "construction", icon: "construction", key: "cat.construction", subtitleKey: "cat.construction.subtitle" },
  { id: "cleaning", icon: "shuttering", key: "cat.cleaning", subtitleKey: "cat.cleaning.subtitle" },
  { id: "electrical", icon: "electrical", key: "cat.electrical", subtitleKey: "cat.electrical.subtitle" },
  { id: "plumbing", icon: "plumbing", key: "cat.plumbing", subtitleKey: "cat.plumbing.subtitle" },
  { id: "painting", icon: "painting", key: "cat.painting", subtitleKey: "cat.painting.subtitle" },
  { id: "carpentry", icon: "carpentry", key: "cat.carpentry", subtitleKey: "cat.carpentry.subtitle" },
  { id: "farming", icon: "farming", key: "cat.farming", subtitleKey: "cat.farming.subtitle" },
  { id: "transport", icon: "transport", key: "cat.transport", subtitleKey: "cat.transport.subtitle" },
  { id: "property", icon: "fabrication", key: "cat.property", subtitleKey: "cat.property.subtitle" },
  { id: "events", icon: "catering", key: "cat.events", subtitleKey: "cat.events.subtitle" },
  { id: "other", icon: "tent", key: "cat.other", subtitleKey: "cat.other.subtitle" },
  { id: "labour_group", icon: "labour", key: "cat.labour_group", subtitleKey: "cat.labour_group.subtitle" },
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
