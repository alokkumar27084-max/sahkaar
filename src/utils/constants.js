// ─────────────────────────────────────────────
// constants.js — App-wide constant values
// ─────────────────────────────────────────────

// The 12 service categories on Thekedaar
export const CATEGORIES = [
  { id: "construction", icon: "construction", key: "cat.construction", subtitle: "Build homes, offices & structures with trusted civil contractors." },
  { id: "electrical", icon: "electrical", key: "cat.electrical", subtitle: "Wiring, repairs & installations by certified electricians." },
  { id: "plumbing", icon: "plumbing", key: "cat.plumbing", subtitle: "Fix leaks, install fittings & maintain water systems." },
  { id: "painting", icon: "painting", key: "cat.painting", subtitle: "Interior & exterior painting for a fresh, polished look." },
  { id: "events", icon: "events", key: "cat.events", subtitle: "Plan weddings, parties & corporate events seamlessly." },
  { id: "carpentry", icon: "carpentry", key: "cat.carpentry", subtitle: "Custom furniture, woodwork & fittings by skilled carpenters." },
  { id: "farming", icon: "farming", key: "cat.farming", subtitle: "Agricultural services, equipment & farm management help." },
  { id: "transport", icon: "transport", key: "cat.transport", subtitle: "Reliable logistics, shifting & material transport services." },
  { id: "cleaning", icon: "cleaning", key: "cat.cleaning", subtitle: "Deep cleaning, sanitization & housekeeping solutions." },
  { id: "labour_group", icon: "labour_group", key: "cat.labour_group", subtitle: "Hire verified labour teams for any scale of work." },
  { id: "property", icon: "property", key: "cat.property", subtitle: "Buy, sell or manage property with expert dealers." },
  { id: "other", icon: "other", key: "cat.other", subtitle: "Explore more specialized services and professionals." },
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
