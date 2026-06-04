// ─────────────────────────────────────────────
// constants.js — App-wide constant values
// ─────────────────────────────────────────────

// How many categories to show on Home before "View All"
export const CATEGORIES_HOME_LIMIT = 8;

// Full service categories on Thekedaar (40 total)
export const CATEGORIES = [
  { id: "construction", icon: "construction", emoji: "🏗️", key: "cat.construction", subtitleKey: "cat.construction.subtitle", image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&fit=crop" },
  { id: "interior_finishing", icon: "carpentry", emoji: "🪑", key: "cat.interior_finishing", subtitleKey: "cat.interior_finishing.subtitle", image: "https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?w=400&fit=crop" },
  { id: "electrical", icon: "electrical", emoji: "⚡", key: "cat.electrical", subtitleKey: "cat.electrical.subtitle", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&fit=crop" },
  { id: "plumbing", icon: "plumbing", emoji: "🔧", key: "cat.plumbing", subtitleKey: "cat.plumbing.subtitle", image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&fit=crop" },
  { id: "appliance_repair", icon: "ac", emoji: "🔌", key: "cat.appliance_repair", subtitleKey: "cat.appliance_repair.subtitle", image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&fit=crop" },
  { id: "cleaning", icon: "shuttering", emoji: "🧹", key: "cat.cleaning", subtitleKey: "cat.cleaning.subtitle", image: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=400&fit=crop" },
  { id: "painting", icon: "painting", emoji: "🎨", key: "cat.painting", subtitleKey: "cat.painting.subtitle", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&fit=crop" },
  { id: "events_wedding", icon: "tent", emoji: "💐", key: "cat.events_wedding", subtitleKey: "cat.events_wedding.subtitle", image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&fit=crop" },
  { id: "labour_group", icon: "labour", emoji: "👷", key: "cat.labour_group", subtitleKey: "cat.labour_group.subtitle", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&fit=crop" },
  { id: "transport", icon: "transport", emoji: "🚛", key: "cat.transport", subtitleKey: "cat.transport.subtitle", image: "https://images.unsplash.com/photo-1597404294360-feeefa0443eb?w=400&fit=crop" },
  { id: "agriculture", icon: "farming", emoji: "🌾", key: "cat.agriculture", subtitleKey: "cat.agriculture.subtitle", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&fit=crop" },
  { id: "industrial", icon: "fabrication", emoji: "🏭", key: "cat.industrial", subtitleKey: "cat.industrial.subtitle", image: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=400&fit=crop" },
  { id: "institutional_food", icon: "cook", emoji: "🍱", key: "cat.institutional_food", subtitleKey: "cat.institutional_food.subtitle", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&fit=crop" },
  { id: "healthcare", icon: "guard", emoji: "🏥", key: "cat.healthcare", subtitleKey: "cat.healthcare.subtitle", image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&fit=crop" },
  { id: "personal_care", icon: "salon", emoji: "💆", key: "cat.personal_care", subtitleKey: "cat.personal_care.subtitle", image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&fit=crop" },
  { id: "education_tutoring", icon: "key", emoji: "📚", key: "cat.education_tutoring", subtitleKey: "cat.education_tutoring.subtitle", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&fit=crop" },
  { id: "retail_shop", icon: "fabrication", emoji: "🏪", key: "cat.retail_shop", subtitleKey: "cat.retail_shop.subtitle", image: "https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=400&fit=crop" },
  { id: "govt_municipal", icon: "guard", emoji: "🏛️", key: "cat.govt_municipal", subtitleKey: "cat.govt_municipal.subtitle", image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&fit=crop" },
  { id: "it_tech", icon: "electrical", emoji: "💻", key: "cat.it_tech", subtitleKey: "cat.it_tech.subtitle", image: "https://images.unsplash.com/photo-1597872200969-2b65dffc90a9?w=400&fit=crop" },
  { id: "seasonal_specialty", icon: "tent", emoji: "🎪", key: "cat.seasonal_specialty", subtitleKey: "cat.seasonal_specialty.subtitle", image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&fit=crop" },
  { id: "software_dev", icon: "electrical", emoji: "🖥️", key: "cat.software_dev", subtitleKey: "cat.software_dev.subtitle", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&fit=crop" },
  { id: "digital_marketing", icon: "key", emoji: "📱", key: "cat.digital_marketing", subtitleKey: "cat.digital_marketing.subtitle", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&fit=crop" },
  { id: "design_creative", icon: "painting", emoji: "🎭", key: "cat.design_creative", subtitleKey: "cat.design_creative.subtitle", image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&fit=crop" },
  { id: "legal_compliance", icon: "guard", emoji: "⚖️", key: "cat.legal_compliance", subtitleKey: "cat.legal_compliance.subtitle", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&fit=crop" },
  { id: "accounting_finance", icon: "key", emoji: "📊", key: "cat.accounting_finance", subtitleKey: "cat.accounting_finance.subtitle", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&fit=crop" },
  { id: "hr_staffing", icon: "labour", emoji: "🤝", key: "cat.hr_staffing", subtitleKey: "cat.hr_staffing.subtitle", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&fit=crop" },
  { id: "media_content", icon: "tent", emoji: "🎬", key: "cat.media_content", subtitleKey: "cat.media_content.subtitle", image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&fit=crop" },
  { id: "event_management", icon: "catering", emoji: "🎉", key: "cat.event_management", subtitleKey: "cat.event_management.subtitle", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&fit=crop" },
  { id: "security_services", icon: "guard", emoji: "🛡️", key: "cat.security_services", subtitleKey: "cat.security_services.subtitle", image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&fit=crop" },
  { id: "printing_publishing", icon: "fabrication", emoji: "🖨️", key: "cat.printing_publishing", subtitleKey: "cat.printing_publishing.subtitle", image: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=400&fit=crop" },
  { id: "tailoring_textile", icon: "tailor", emoji: "🧵", key: "cat.tailoring_textile", subtitleKey: "cat.tailoring_textile.subtitle", image: "https://images.unsplash.com/photo-1524295984809-5f848031a988?w=400&fit=crop" },
  { id: "food_processing", icon: "cook", emoji: "🥘", key: "cat.food_processing", subtitleKey: "cat.food_processing.subtitle", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&fit=crop" },
  { id: "waste_management", icon: "drain", emoji: "♻️", key: "cat.waste_management", subtitleKey: "cat.waste_management.subtitle", image: "https://images.unsplash.com/photo-1532996127610-53316972cca6?w=400&fit=crop" },
  { id: "real_estate", icon: "construction", emoji: "🏠", key: "cat.real_estate", subtitleKey: "cat.real_estate.subtitle", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&fit=crop" },
  { id: "automobile", icon: "mechanic", emoji: "🚗", key: "cat.automobile", subtitleKey: "cat.automobile.subtitle", image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&fit=crop" },
  { id: "renewable_energy", icon: "electrical", emoji: "☀️", key: "cat.renewable_energy", subtitleKey: "cat.renewable_energy.subtitle", image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&fit=crop" },
  { id: "tourism_hospitality", icon: "catering", emoji: "🏨", key: "cat.tourism_hospitality", subtitleKey: "cat.tourism_hospitality.subtitle", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&fit=crop" },
  { id: "research_data", icon: "key", emoji: "🔬", key: "cat.research_data", subtitleKey: "cat.research_data.subtitle", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&fit=crop" },
  { id: "animal_veterinary", icon: "farming", emoji: "🐾", key: "cat.animal_veterinary", subtitleKey: "cat.animal_veterinary.subtitle", image: "https://images.unsplash.com/photo-1581888227599-779811939961?w=400&fit=crop" },
  { id: "spiritual_religious", icon: "tent", emoji: "🙏", key: "cat.spiritual_religious", subtitleKey: "cat.spiritual_religious.subtitle", image: "https://images.unsplash.com/photo-1609137144813-2efdf607fb2f?w=400&fit=crop" },
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
