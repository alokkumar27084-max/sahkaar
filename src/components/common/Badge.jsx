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
    label: { en: "Full Ownership", hi: "????? ??????????" },
    cls: "bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]",
    icon: "team",
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
