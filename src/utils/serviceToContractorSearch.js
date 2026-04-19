/**
 * Maps catalog service category slugs (service_categories.slug) to contractor
 * search filters (contractors.category / categories[] use ids from constants.js).
 */
const SERVICE_CATEGORY_SLUG_TO_CONTRACTOR = {
  "ac-appliance-repair": { category: "electrical", q: "" },
  "home-cleaning": { category: "cleaning", q: "" },
  electrician: { category: "electrical", q: "" },
  plumber: { category: "plumbing", q: "" },
  carpenter: { category: "carpentry", q: "" },
  "salon-at-home": { category: "other", q: "salon beauty" },
  "pest-control": { category: "other", q: "pest control" },
  "painting-service": { category: "painting", q: "" },
  "home-construction": { category: "construction", q: "" },
  "home-renovation": { category: "construction", q: "renovation" },
  "interior-design": { category: "carpentry", q: "interior design" },
  "commercial-projects": { category: "construction", q: "commercial" },
  "electrical-overhaul": { category: "electrical", q: "" },
  "plumbing-overhaul": { category: "plumbing", q: "" },
};

/**
 * @param {string} categorySlug - service_categories.slug from API
 * @param {{ serviceName?: string, serviceSlug?: string }} [opts]
 * @returns {string} path starting with /search?
 */
export function buildContractorSearchPath(categorySlug, opts = {}) {
  const { serviceName = "", serviceSlug = "" } = opts;
  const mapped = SERVICE_CATEGORY_SLUG_TO_CONTRACTOR[categorySlug] || {
    category: "other",
    q: serviceName ? serviceName.slice(0, 80) : "",
  };

  const params = new URLSearchParams();
  params.set("sort", "distance");
  params.set("radius_km", "5");

  if (mapped.category) params.set("category", mapped.category);

  const qVal = typeof mapped.q === "string" ? mapped.q.trim() : "";
  if (qVal) params.set("q", qVal);
  else if (serviceName && (!mapped.category || mapped.category === "other")) {
    params.set("q", serviceName.slice(0, 120));
  }

  if (serviceSlug) params.set("from_service", serviceSlug);
  if (serviceName) params.set("context_label", serviceName.slice(0, 200));

  return `/search?${params.toString()}`;
}
