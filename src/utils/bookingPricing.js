function toAmount(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function inferServiceTier(contractor) {
  return "macro";
}

export function getSuggestedProjectValue(contractor, serviceTier) {
  const dailyRate = toAmount(contractor?.daily_rate, 0);

  if (serviceTier === "macro") {
    return Math.max(dailyRate * Math.max(Number(contractor?.team_size) || 1, 3), 5000);
  }

  return Math.max(dailyRate || 149, 149);
}
