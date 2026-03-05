import React from "react";
import Icon from "./Icon";

const types = {
  verified: {
    label: { en: "Verified", hi: "????????" },
    cls: "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]",
    icon: "check",
  },
  featured: {
    label: { en: "Featured", hi: "??????" },
    cls: "bg-[#FEF9C3] text-[#CA8A04] border-[#FDE047]",
    icon: "rating",
  },
  labour_group: {
    label: { en: "Labour Group", hi: "???? ?????" },
    cls: "bg-[#E0F2FE] text-[#0284C7] border-[#7DD3FC]",
    icon: "worker",
  },
  responsibility: {
    label: { en: "Full Ownership", hi: "पूरी जिम्मेदारी" },
    cls: "bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]",
    icon: "team",
  },
  tier_silver: {
    label: { en: "Silver Pro", hi: "सिल्वर प्रो" },
    cls: "bg-slate-100 text-slate-500 border-slate-300",
    icon: "trophy",
  },
  tier_gold: {
    label: { en: "Gold Pro", hi: "गोल्ड प्रो" },
    cls: "bg-amber-100 text-amber-600 border-amber-300",
    icon: "trophy",
  },
  tier_platinum: {
    label: { en: "Platinum Pro", hi: "प्लैटिनम प्रो" },
    cls: "bg-purple-100 text-purple-600 border-purple-300",
    icon: "trophy",
  },
};

export default function Badge({ type, lang = "en" }) {
  const badge = types[type];
  if (!badge) return null;

  return (
    <span className={`badge border ${badge.cls}`}>
      <Icon name={badge.icon} className="w-3.5 h-3.5" />
      {badge.label[lang] || badge.label.en}
    </span>
  );
}
