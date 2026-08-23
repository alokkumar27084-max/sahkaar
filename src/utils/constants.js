// ─────────────────────────────────────────────
// constants.js — App-wide constant values
// ─────────────────────────────────────────────

// How many categories to show on Home before "View All"
export const CATEGORIES_HOME_LIMIT = 8;

// Primary Household & Community Service Trades under Labour Cooperatives
export const CATEGORIES = [
  { id: "electrical", icon: "electrical", emoji: "⚡", name: "Electrician", hindiName: "इलेक्ट्रीशियन", key: "cat.electrical", subtitleKey: "cat.electrical.subtitle", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80" },
  { id: "plumbing", icon: "plumbing", emoji: "🔧", name: "Plumber", hindiName: "प्लंबर", key: "cat.plumbing", subtitleKey: "cat.plumbing.subtitle", image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80" },
  { id: "carpentry", icon: "carpentry", emoji: "🪑", name: "Carpenter", hindiName: "बढ़ई / कारपेंटर", key: "cat.interior_finishing", subtitleKey: "cat.interior_finishing.subtitle", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80" },
  { id: "painting", icon: "painting", emoji: "🎨", name: "Painter", hindiName: "पेंटर / रंगसाज", key: "cat.painting", subtitleKey: "cat.painting.subtitle", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80" },
  { id: "domestic_help", icon: "labour", emoji: "🏠", name: "Domestic Helper / Maid", hindiName: "घरेलू सहायिका / मेड", key: "cat.labour_group", subtitleKey: "cat.labour_group.subtitle", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" },
  { id: "caregiving", icon: "guard", emoji: "🩺", name: "Caregiver & Elderly Care", hindiName: "देखभाल कर्ता / केयरगिवर", key: "cat.healthcare", subtitleKey: "cat.healthcare.subtitle", image: "https://images.unsplash.com/photo-1584515901187-60f4e353f57f?auto=format&fit=crop&w=400&q=80" },
  { id: "driver", icon: "transport", emoji: "🚗", name: "Driver", hindiName: "चालक / ड्राइवर", key: "cat.transport", subtitleKey: "cat.transport.subtitle", image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80" },
  { id: "gardening", icon: "farming", emoji: "🌿", name: "Gardener", hindiName: "माली / बागवानी", key: "cat.agriculture", subtitleKey: "cat.agriculture.subtitle", image: "https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?auto=format&fit=crop&w=400&q=80" },
  { id: "cleaning", icon: "shuttering", emoji: "🧹", name: "Deep Cleaning & Housekeeping", hindiName: "सफाई कर्मी / हाउसकीपिंग", key: "cat.cleaning", subtitleKey: "cat.cleaning.subtitle", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" },
  { id: "appliance_repair", icon: "ac", emoji: "🔌", name: "Appliance & AC Technician", hindiName: "उपकरण व एसी तकनीशियन", key: "cat.appliance_repair", subtitleKey: "cat.appliance_repair.subtitle", image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80" },
  { id: "masonry", icon: "construction", emoji: "🧱", name: "Civil Masonry & Home Repair", hindiName: "राजमिस्त्री व भवन मरम्मत", key: "cat.construction", subtitleKey: "cat.construction.subtitle", image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=400&q=80" },
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
