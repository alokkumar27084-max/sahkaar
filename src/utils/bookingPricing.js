function toAmount(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function inferServiceTier(contractor) {
  if (!contractor) return "quick";

  const category = String(contractor.category || contractor.categories?.[0] || "").toLowerCase();
  const macroCategories = [
    "construction",
    "renovation",
    "interior",
    "civil",
    "commercial",
    "event",
    "architecture",
    "waterproofing",
  ];

  if (contractor.is_responsibility_model || macroCategories.some((item) => category.includes(item))) {
    return "macro";
  }

  return "quick";
}

export function getSuggestedProjectValue(contractor, serviceTier) {
  const dailyRate = toAmount(contractor?.daily_rate, 0);

  if (serviceTier === "macro") {
    return Math.max(dailyRate * Math.max(Number(contractor?.team_size) || 1, 3), 5000);
  }

  return Math.max(dailyRate || 149, 149);
}
