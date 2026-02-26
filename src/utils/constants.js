// ─────────────────────────────────────────────
// constants.js — App-wide constant values
// ─────────────────────────────────────────────

// The 12 service categories on Thekedaar
export const CATEGORIES = [
  { id: "construction",  icon: "construction", key: "cat.construction"  },
  { id: "electrical",    icon: "electrical",   key: "cat.electrical"    },
  { id: "plumbing",      icon: "plumbing",     key: "cat.plumbing"      },
  { id: "painting",      icon: "painting",     key: "cat.painting"      },
  { id: "events",        icon: "events",       key: "cat.events"        },
  { id: "carpentry",     icon: "carpentry",    key: "cat.carpentry"     },
  { id: "farming",       icon: "farming",      key: "cat.farming"       },
  { id: "transport",     icon: "transport",    key: "cat.transport"     },
  { id: "cleaning",      icon: "cleaning",     key: "cat.cleaning"      },
  { id: "labour_group",  icon: "labour_group", key: "cat.labour_group"  },
  { id: "property",      icon: "property",     key: "cat.property"      },
  { id: "other",         icon: "other",        key: "cat.other"         },
];

// Sort options for search results
export const SORT_OPTIONS = [
  { value: "rating",   labelKey: "search.sort_rating"   },
  { value: "distance", labelKey: "search.sort_distance" },
  { value: "price",    labelKey: "search.sort_price"    },
];

// OTP resend countdown in seconds
export const OTP_RESEND_SECONDS = 30;

// Max file sizes
export const MAX_IMAGE_SIZE_MB   = 5;
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
