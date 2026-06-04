// ─────────────────────────────────────────────
// constants.js — App-wide constant values
// ─────────────────────────────────────────────

// How many categories to show on Home before "View All"
export const CATEGORIES_HOME_LIMIT = 8;

// Full service categories on Thekedaar (40 total)
export const CATEGORIES = [
  { id: "construction", icon: "construction", emoji: "🏗️", key: "cat.construction", subtitleKey: "cat.construction.subtitle", image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=400&q=80" },
  { id: "interior_finishing", icon: "carpentry", emoji: "🪑", key: "cat.interior_finishing", subtitleKey: "cat.interior_finishing.subtitle", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80" },
  { id: "electrical", icon: "electrical", emoji: "⚡", key: "cat.electrical", subtitleKey: "cat.electrical.subtitle", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80" },
  { id: "plumbing", icon: "plumbing", emoji: "🔧", key: "cat.plumbing", subtitleKey: "cat.plumbing.subtitle", image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80" },
  { id: "appliance_repair", icon: "ac", emoji: "🔌", key: "cat.appliance_repair", subtitleKey: "cat.appliance_repair.subtitle", image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80" },
  { id: "cleaning", icon: "shuttering", emoji: "🧹", key: "cat.cleaning", subtitleKey: "cat.cleaning.subtitle", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" },
  { id: "painting", icon: "painting", emoji: "🎨", key: "cat.painting", subtitleKey: "cat.painting.subtitle", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80" },
  { id: "events_wedding", icon: "tent", emoji: "💐", key: "cat.events_wedding", subtitleKey: "cat.events_wedding.subtitle", image: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?auto=format&fit=crop&w=400&q=80" },
  { id: "labour_group", icon: "labour", emoji: "👷", key: "cat.labour_group", subtitleKey: "cat.labour_group.subtitle", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
  { id: "transport", icon: "transport", emoji: "🚛", key: "cat.transport", subtitleKey: "cat.transport.subtitle", image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80" },
  { id: "agriculture", icon: "farming", emoji: "🌾", key: "cat.agriculture", subtitleKey: "cat.agriculture.subtitle", image: "https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?auto=format&fit=crop&w=400&q=80" },
  { id: "industrial", icon: "fabrication", emoji: "🏭", key: "cat.industrial", subtitleKey: "cat.industrial.subtitle", image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80" },
  { id: "institutional_food", icon: "cook", emoji: "🍱", key: "cat.institutional_food", subtitleKey: "cat.institutional_food.subtitle", image: "https://images.unsplash.com/photo-1585699324551-f6c309eedee6?auto=format&fit=crop&w=400&q=80" },
  { id: "healthcare", icon: "guard", emoji: "🏥", key: "cat.healthcare", subtitleKey: "cat.healthcare.subtitle", image: "https://images.unsplash.com/photo-1584515901187-60f4e353f57f?auto=format&fit=crop&w=400&q=80" },
  { id: "personal_care", icon: "salon", emoji: "💆", key: "cat.personal_care", subtitleKey: "cat.personal_care.subtitle", image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=400&q=80" },
  { id: "education_tutoring", icon: "key", emoji: "📚", key: "cat.education_tutoring", subtitleKey: "cat.education_tutoring.subtitle", image: "https://images.unsplash.com/photo-1588072401702-d1571b55e2c6?auto=format&fit=crop&w=400&q=80" },
  { id: "retail_shop", icon: "fabrication", emoji: "🏪", key: "cat.retail_shop", subtitleKey: "cat.retail_shop.subtitle", image: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80" },
  { id: "govt_municipal", icon: "guard", emoji: "🏛️", key: "cat.govt_municipal", subtitleKey: "cat.govt_municipal.subtitle", image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=400&q=80" },
  { id: "it_tech", icon: "electrical", emoji: "💻", key: "cat.it_tech", subtitleKey: "cat.it_tech.subtitle", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" },
  { id: "seasonal_specialty", icon: "tent", emoji: "🎪", key: "cat.seasonal_specialty", subtitleKey: "cat.seasonal_specialty.subtitle", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=400&q=80" },
  { id: "software_dev", icon: "electrical", emoji: "🖥️", key: "cat.software_dev", subtitleKey: "cat.software_dev.subtitle", image: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=400&q=80" },
  { id: "digital_marketing", icon: "key", emoji: "📱", key: "cat.digital_marketing", subtitleKey: "cat.digital_marketing.subtitle", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" },
  { id: "design_creative", icon: "painting", emoji: "🎭", key: "cat.design_creative", subtitleKey: "cat.design_creative.subtitle", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80" },
  { id: "legal_compliance", icon: "guard", emoji: "⚖️", key: "cat.legal_compliance", subtitleKey: "cat.legal_compliance.subtitle", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80" },
  { id: "accounting_finance", icon: "key", emoji: "📊", key: "cat.accounting_finance", subtitleKey: "cat.accounting_finance.subtitle", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80" },
  { id: "hr_staffing", icon: "labour", emoji: "🤝", key: "cat.hr_staffing", subtitleKey: "cat.hr_staffing.subtitle", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80" },
  { id: "media_content", icon: "tent", emoji: "🎬", key: "cat.media_content", subtitleKey: "cat.media_content.subtitle", image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80" },
  { id: "event_management", icon: "catering", emoji: "🎉", key: "cat.event_management", subtitleKey: "cat.event_management.subtitle", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80" },
  { id: "security_services", icon: "guard", emoji: "🛡️", key: "cat.security_services", subtitleKey: "cat.security_services.subtitle", image: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=400&q=80" },
  { id: "printing_publishing", icon: "fabrication", emoji: "🖨️", key: "cat.printing_publishing", subtitleKey: "cat.printing_publishing.subtitle", image: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80" },
  { id: "tailoring_textile", icon: "tailor", emoji: "🧵", key: "cat.tailoring_textile", subtitleKey: "cat.tailoring_textile.subtitle", image: "https://images.unsplash.com/photo-1595062584313-47018e0ee5cb?auto=format&fit=crop&w=400&q=80" },
  { id: "food_processing", icon: "cook", emoji: "🥘", key: "cat.food_processing", subtitleKey: "cat.food_processing.subtitle", image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&q=80" },
  { id: "waste_management", icon: "drain", emoji: "♻️", key: "cat.waste_management", subtitleKey: "cat.waste_management.subtitle", image: "https://images.unsplash.com/photo-1532996127610-53316972cca6?auto=format&fit=crop&w=400&q=80" },
  { id: "real_estate", icon: "construction", emoji: "🏠", key: "cat.real_estate", subtitleKey: "cat.real_estate.subtitle", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80" },
  { id: "automobile", icon: "mechanic", emoji: "🚗", key: "cat.automobile", subtitleKey: "cat.automobile.subtitle", image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80" },
  { id: "renewable_energy", icon: "electrical", emoji: "☀️", key: "cat.renewable_energy", subtitleKey: "cat.renewable_energy.subtitle", image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=80" },
  { id: "tourism_hospitality", icon: "catering", emoji: "🏨", key: "cat.tourism_hospitality", subtitleKey: "cat.tourism_hospitality.subtitle", image: "https://images.unsplash.com/photo-1598977123418-45f0d2f90244?auto=format&fit=crop&w=400&q=80" },
  { id: "research_data", icon: "key", emoji: "🔬", key: "cat.research_data", subtitleKey: "cat.research_data.subtitle", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80" },
  { id: "animal_veterinary", icon: "farming", emoji: "🐾", key: "cat.animal_veterinary", subtitleKey: "cat.animal_veterinary.subtitle", image: "https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=400&q=80" },
  { id: "spiritual_religious", icon: "tent", emoji: "🙏", key: "cat.spiritual_religious", subtitleKey: "cat.spiritual_religious.subtitle", image: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=400&q=80" },
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
