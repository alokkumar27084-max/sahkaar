import React from "react";
import Icon from "./Icon";

const types = {
  verified: {
    label: { en: "Verified", hi: "वेरिफाइड" },
    cls: "bg-emerald-300/20 text-emerald-100 border-emerald-200/40",
    icon: "check",
  },
  featured: {
    label: { en: "Featured", hi: "फीचर्ड" },
    cls: "bg-amber-300/20 text-amber-100 border-amber-200/40",
    icon: "rating",
  },
  labour_group: {
    label: { en: "Labour Group", hi: "लेबर ग्रुप" },
    cls: "bg-cyan-300/20 text-cyan-100 border-cyan-200/40",
    icon: "worker",
  },
  responsibility: {
    label: { en: "Full Ownership", hi: "पूर्ण जिम्मेदारी" },
    cls: "bg-indigo-300/20 text-indigo-100 border-indigo-200/40",
    icon: "team",
  },
};

export default function Badge({ type, lang = "en" }) {
  const badge = types[type];
  if (!badge) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
      <Icon name={badge.icon} className="w-3.5 h-3.5" />
      {badge.label[lang] || badge.label.en}
    </span>
  );
}
