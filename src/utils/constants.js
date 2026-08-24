// ─────────────────────────────────────────────
// constants.js — App-wide constant values
// ─────────────────────────────────────────────

// How many categories to show on Home before "View All"
export const CATEGORIES_HOME_LIMIT = 8;

// Primary Household & Community Service Trades under Labour Cooperatives
export const CATEGORIES = [
  {
    id: "electrical",
    icon: "electrical",
    emoji: "⚡",
    name: "Master Electrician",
    hindiName: "मास्टर इलेक्ट्रीशियन",
    key: "cat.electrical",
    subtitleKey: "cat.electrical.subtitle",
    group: "repairs_maintenance",
    groupLabel: "Repairs & Maintenance",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    description: "Certified cooperative electricians for switchboards, MCB panels, house wiring, ceiling fans & short-circuit repair.",
    basePrice: "₹199",
    services: [
      "Switchboard & Socket Repair / Installation",
      "Ceiling Fan Installation & Regulator Repair",
      "MCB & Fuse Box Troubleshooting",
      "Complete House Wiring & Rewiring",
      "Inverter & Battery Wiring Setup",
      "Chandelier & Decorative Light Fitting",
      "Appliance Point & Heavy Load Wiring",
      "Short Circuit & Emergency Breakdown"
    ],
  },
  {
    id: "plumbing",
    icon: "plumbing",
    emoji: "🔧",
    name: "Master Plumber",
    hindiName: "मास्टर प्लंबर",
    key: "cat.plumbing",
    subtitleKey: "cat.plumbing.subtitle",
    group: "repairs_maintenance",
    groupLabel: "Repairs & Maintenance",
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80",
    description: "Expert plumbing for tap leakage, blocked drains, sanitary fittings, overhead water tanks & motor repair.",
    basePrice: "₹199",
    services: [
      "Tap, Mixer & Shower Repair / Replacement",
      "Blocked Drain & Toilet Choke Removal",
      "Water Tank Installation & Pipe Connection",
      "Motor & Water Pump Repair",
      "Geyser Connection & Pipe Installation",
      "Underground / Concealed Pipe Leakage",
      "Bathroom Sanitary Ware & Commode Fitting",
      "Water Purifier (RO) Inlet / Outlet Plumbing"
    ],
  },
  {
    id: "carpentry",
    icon: "carpentry",
    emoji: "🪑",
    name: "Master Carpenter",
    hindiName: "मास्टर बढ़ई / कारपेंटर",
    key: "cat.interior_finishing",
    subtitleKey: "cat.interior_finishing.subtitle",
    group: "installation_assembly",
    groupLabel: "Installation & Assembly",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80",
    description: "Precision woodwork, bespoke modular furniture, door lock/hinge repairs, cupboard fabrication & window mesh fixing.",
    basePrice: "₹299",
    services: [
      "Door Lock, Handle & Latch Repair",
      "Furniture Assembly (Bed, Table, Wardrobe)",
      "Drawer Channel & Modular Kitchen Hinge Repair",
      "Custom Cupboard & Wardrobe Fabrication",
      "Window Wooden Frame & Mesh Net Fixing",
      "Sofa, Chair & Bed Wood Joint Strengthening",
      "Wooden Partition & Decorative Paneling",
      "Door Trimming & Alignment"
    ],
  },
  {
    id: "painting",
    icon: "painting",
    emoji: "🎨",
    name: "Master Painter & Waterproofing",
    hindiName: "मास्टर पेंटर व वॉटरप्रूफिंग",
    key: "cat.painting",
    subtitleKey: "cat.painting.subtitle",
    group: "construction_renovation",
    groupLabel: "Construction & Renovation",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80",
    description: "Complete interior & exterior home painting, texture wall designs, putty smoothing & dampness waterproofing.",
    basePrice: "₹499",
    services: [
      "Full Interior Wall Painting & Primer",
      "Exterior Weatherproof Coating",
      "Wall Putty, POP & Surface Smoothing",
      "Texture & Feature Wall Art Painting",
      "Roof & Terrace Waterproofing Treatment",
      "Wall Seepage & Dampness (सीलन) Cure",
      "Wood & Metal Grill Enamel Polish",
      "Stenciling & Designer Wall Finishes"
    ],
  },
  {
    id: "appliance_repair",
    icon: "ac",
    emoji: "🔌",
    name: "AC & Home Appliance Technician",
    hindiName: "एसी व उपकरण तकनीशियन",
    key: "cat.appliance_repair",
    subtitleKey: "cat.appliance_repair.subtitle",
    group: "repairs_maintenance",
    groupLabel: "Repairs & Maintenance",
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80",
    description: "Certified technicians for Split/Window AC servicing, gas filling, refrigerator, washing machine & microwave repairs.",
    basePrice: "₹349",
    services: [
      "Split / Window AC Service & Jet Pump Clean",
      "AC Gas Leakage Check & Refill",
      "AC Installation & Uninstallation",
      "Refrigerator Cooling & Compressor Repair",
      "Washing Machine (Front/Top Load) Repair",
      "RO Water Purifier Filter & Membrane Replacement",
      "Microwave Oven & Induction Cooktop Repair",
      "Geyser & Water Heater Element Replacement"
    ],
  },
  {
    id: "cleaning",
    icon: "shuttering",
    emoji: "🧹",
    name: "Deep Cleaning & Housekeeping",
    hindiName: "डीप क्लीनिंग व हाउसकीपिंग",
    key: "cat.cleaning",
    subtitleKey: "cat.cleaning.subtitle",
    group: "cleaning_hygiene",
    groupLabel: "Cleaning & Hygiene",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
    description: "Thorough deep sanitization for full homes, bathrooms, modular kitchens, sofa upholstery & water tanks.",
    basePrice: "₹499",
    services: [
      "Full Home Deep Cleaning & Sanitization",
      "Intensive Bathroom & Tile Descaling",
      "Modular Kitchen Degreasing & Chimney Clean",
      "Sofa, Carpet & Mattress Shampooing",
      "Overhead & Underground Water Tank Cleaning",
      "Balcony, Floor Scrubbing & Machine Polishing",
      "Post-Construction & Move-in Deep Cleaning",
      "Glass Window & Facade Cleaning"
    ],
  },
  {
    id: "masonry",
    icon: "construction",
    emoji: "🧱",
    name: "Civil Masonry & Structural Repair",
    hindiName: "राजमिस्त्री व भवन मरम्मत",
    key: "cat.construction",
    subtitleKey: "cat.construction.subtitle",
    group: "construction_renovation",
    groupLabel: "Construction & Renovation",
    image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80",
    description: "Skilled civil masons for tile laying, wall plastering, concrete repair, boundary walls & structural modifications.",
    basePrice: "₹599",
    services: [
      "Tile & Granite / Marble Laying & Grouting",
      "Wall Plastering, Crack Filling & Repair",
      "Brickwork & Room Partition Wall Construction",
      "Floor Concreting & Leveling (ढलाई)",
      "Balcony & Boundary Wall Parapet Repair",
      "Door / Window Frame Chipping & Fixing",
      "Kitchen Slab Fabrication & Stone Cutting",
      "Structural Demolition & Debris Disposal"
    ],
  },
  {
    id: "pest_control",
    icon: "ac",
    emoji: "🐛",
    name: "Pest Control & Disinfection",
    hindiName: "पेस्ट कंट्रोल व कीट नियंत्रण",
    key: "cat.pest_control",
    subtitleKey: "cat.pest_control.subtitle",
    group: "cleaning_hygiene",
    groupLabel: "Cleaning & Hygiene",
    image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80",
    description: "Eco-friendly, odorless pest extermination for cockroaches, termites, bedbugs, rodents & mosquitoes.",
    basePrice: "₹499",
    services: [
      "Cockroach & Ant Gel Treatment (Odorless)",
      "Termite Control & Wood Injection (दीमक रोकथाम)",
      "Bedbug Spray & Steam Extermination (खटमल)",
      "Rodent & Rat Proofing Baiting",
      "Mosquito & Dengue Prevention Fogging",
      "Wood Borer & Silverfish Eradication",
      "Commercial Kitchen & Restaurant Disinfection",
      "Garden Pest & Lawn Insect Management"
    ],
  },
  {
    id: "domestic_help",
    icon: "labour",
    emoji: "🏠",
    name: "Domestic Helper & Housekeeper",
    hindiName: "घरेलू सहायिका व हाउसहेल्प",
    key: "cat.labour_group",
    subtitleKey: "cat.labour_group.subtitle",
    group: "personal_care",
    groupLabel: "Personal & Home Care",
    image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80",
    description: "Verified household assistants for daily cooking, cleaning, child assistance & elderly companionship.",
    basePrice: "₹399",
    services: [
      "Daily Household Cleaning & Mopping",
      "Home Cook & Meal Preparation (North/South Indian)",
      "Kitchen Dishwashing & Utensil Cleaning",
      "Babysitter & Child Care Attendant",
      "Laundry, Ironing & Clothes Folding",
      "Elderly Care & Daily Assistance",
      "Party & Festival Extra Help Assistant",
      "Full-Time / Live-in Cooperative Domestic Staff"
    ],
  },
  {
    id: "gardening",
    icon: "farming",
    emoji: "🌿",
    name: "Gardener & Balcony Landscaping",
    hindiName: "माली व बागवानी विशेषज्ञ",
    key: "cat.agriculture",
    subtitleKey: "cat.agriculture.subtitle",
    group: "installation_assembly",
    groupLabel: "Installation & Assembly",
    image: "https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?auto=format&fit=crop&w=600&q=80",
    description: "Professional gardening, lawn mowing, hedge trimming, plant potting, organic fertilizers & terrace garden design.",
    basePrice: "₹299",
    services: [
      "Lawn Mowing & Grass Leveling",
      "Hedge, Bush & Tree Branch Trimming",
      "Repotting & Soil Nourishment with Vermicompost",
      "Balcony & Terrace Garden Setup",
      "Plant Pest Treatment & Fungicide Spray",
      "Indoor Plant Maintenance & Watering Setup",
      "Drip Irrigation Pipe Installation",
      "Seasonal Flowering Plant Bed Creation"
    ],
  },
  {
    id: "driver",
    icon: "transport",
    emoji: "🚗",
    name: "Professional Driver & Chauffeur",
    hindiName: "प्रशिक्षित चालक / ड्राइवर",
    key: "cat.transport",
    subtitleKey: "cat.transport.subtitle",
    group: "personal_care",
    groupLabel: "Personal & Home Care",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
    description: "Verified drivers for city commute, outstation journeys, hourly chauffeuring & commercial vehicle transport.",
    basePrice: "₹349",
    services: [
      "Hourly / Daily City Personal Chauffeur",
      "One-Way & Round-Trip Outstation Driver",
      "Night Shift & Event Designated Driver",
      "Automatic & Luxury Car Specialist",
      "Commercial Pickup / Mini Truck Driver",
      "Monthly Permanent Cooperative Driver Placement",
      "Airport Pickup & Drop Driver",
      "Valet Parking Staff for Weddings & Events"
    ],
  },
  {
    id: "caregiving",
    icon: "guard",
    emoji: "🩺",
    name: "Caregiver & Elderly Nursing Support",
    hindiName: "केयरगिवर व वरिष्ठ नागरिक देखभाल",
    key: "cat.healthcare",
    subtitleKey: "cat.healthcare.subtitle",
    group: "personal_care",
    groupLabel: "Personal & Home Care",
    image: "https://images.unsplash.com/photo-1584515901187-60f4e353f57f?auto=format&fit=crop&w=600&q=80",
    description: "Compassionate, trained cooperative attendants for elderly support, bedridden patient assistance & post-op recovery.",
    basePrice: "₹599",
    services: [
      "Elderly Daily Mobility & Hygiene Support",
      "Bedridden Patient Attendant & Sponge Bath",
      "Post-Surgery Recovery & Dressing Support",
      "Vital Monitoring (BP, Sugar, Pulse, O2)",
      "Medication Schedule Management",
      "Physiotherapy Exercise Assistance",
      "Dementia & Alzheimer's Companion Care",
      "24x7 Live-in Cooperative Nursing Attendant"
    ],
  },
  {
    id: "locksmith",
    icon: "ac",
    emoji: "🔒",
    name: "Locksmith & Key Specialist",
    hindiName: "ताला चाबी कारीगर (लॉकस्मिथ)",
    key: "cat.locksmith",
    subtitleKey: "cat.locksmith.subtitle",
    group: "repairs_maintenance",
    groupLabel: "Repairs & Maintenance",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
    description: "Emergency door unlocking, Godrej / digital smart lock installations, duplicate key creation & latch repairs.",
    basePrice: "₹199",
    services: [
      "Emergency Door Unlock (Locked Out)",
      "Main Door Smart Lock / Biometric Installation",
      "Godrej & Padlock Key Duplication",
      "Cabinet, Wardrobe & Drawer Lock Repair",
      "Deadbolt & Night Latch Fitting",
      "Master Key System Creation",
      "Car Door Lock Mechanism Emergency Open",
      "Handle & Rim Cylinder Replacement"
    ],
  },
  {
    id: "catering_cook",
    icon: "farming",
    emoji: "🍳",
    name: "Catering, Cook & Halwai",
    hindiName: "हलवाई, कुक व कैटरिंग कारीगर",
    key: "cat.catering",
    subtitleKey: "cat.catering.subtitle",
    group: "personal_care",
    groupLabel: "Personal & Home Care",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
    description: "Skilled traditional halwai and chefs for family functions, festivals, daily gourmet cooking & corporate catering.",
    basePrice: "₹899",
    services: [
      "Wedding & Function Traditional Halwai Team",
      "Birthday & House Party Multi-Cuisine Cook",
      "Daily Home Chef for North & South Indian Meals",
      "Traditional Sweets & Snack Preparation (मिठाई/नमकीन)",
      "Pooja, Havan & Festival Prasad Cooking",
      "Live Tandoor & Barbecue Chef at Home",
      "Buffet Setup & Food Serving Helpers",
      "Corporate Lunch Box & Bulk Cooking"
    ],
  },
  {
    id: "cctv_security",
    icon: "guard",
    emoji: "📹",
    name: "CCTV & Security System Tech",
    hindiName: "सीसीटीवी व सुरक्षा तकनीशियन",
    key: "cat.security",
    subtitleKey: "cat.security.subtitle",
    group: "installation_assembly",
    groupLabel: "Installation & Assembly",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
    description: "Expert installation and servicing of CCTV cameras, DVR/NVR setups, video door phones & alarm systems.",
    basePrice: "₹449",
    services: [
      "HD / IP CCTV Camera Installation",
      "DVR / NVR Hard Drive Configuration & Wiring",
      "Mobile Phone Live View & WiFi Setup",
      "Video Doorbell (VDP) Installation",
      "CCTV Power Supply & SMPS Repair",
      "Biometric Attendance Machine Setup",
      "Security Alarm & Motion Sensor Fitting",
      "Annual Maintenance (AMC) for Society Surveillance"
    ],
  },
];

// Service Category Groups
export const CATEGORY_GROUPS = [
  { id: "all", label: "All Trades & Services", emoji: "✨" },
  { id: "repairs_maintenance", label: "Repairs & Maintenance", emoji: "🔧" },
  { id: "cleaning_hygiene", label: "Cleaning & Hygiene", emoji: "🧹" },
  { id: "installation_assembly", label: "Installation & Assembly", emoji: "⚙️" },
  { id: "construction_renovation", label: "Construction & Renovation", emoji: "🧱" },
  { id: "personal_care", label: "Personal & Home Care", emoji: "💆" },
];

// Sort options for search results
export const SORT_OPTIONS = [
  { value: "recommended", labelKey: "search.sort_recommended", label: "Recommended (Verified & Top)" },
  { value: "distance", labelKey: "search.sort_distance", label: "Nearest to Me" },
  { value: "rating", labelKey: "search.sort_rating", label: "Top Rated Masters" },
  { value: "price", labelKey: "search.sort_price", label: "Price: Low to High" },
];

// OTP resend countdown in seconds
export const OTP_RESEND_SECONDS = 30;

// Max file sizes
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_PORTFOLIO_PHOTOS = 5;

// WhatsApp deep-link base
export const WHATSAPP_URL = (phone, name) =>
  `https://wa.me/91${phone}?text=${encodeURIComponent(
    `Hello Master ${name || ''}! I found you on SahKaari Cooperative Marketplace. I would like to book your service.`
  )}`;

// Star rating options
export const STAR_RATINGS = [1, 2, 3, 4, 5];

// User roles
export const ROLES = {
  CUSTOMER: "customer",
  MASTER: "contractor",
  WORKER: "contractor",
  ADMIN: "admin",
  FEDERATION_ADMIN: "federation_admin",
  SOCIETY_ADMIN: "society_admin"
};

// Quick Service Categories
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
