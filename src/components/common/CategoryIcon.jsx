import React from "react";
import {
  FiZap,
  FiDroplet,
  FiLayers,
  FiCpu,
  FiHome,
  FiShield,
  FiHeart,
  FiKey,
  FiCamera,
  FiNavigation,
  FiCoffee,
  FiTool,
  FiActivity,
  FiCheckCircle,
  FiWind,
  FiSun
} from "react-icons/fi";

const CATEGORY_ICONS = {
  electrical: {
    Icon: FiZap,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200/80",
  },
  plumbing: {
    Icon: FiDroplet,
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-200/80",
  },
  carpentry: {
    Icon: FiLayers,
    color: "text-amber-800",
    bg: "bg-amber-50/70 border-amber-200/80",
  },
  painting: {
    Icon: FiWind,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200/80",
  },
  appliance_repair: {
    Icon: FiCpu,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200/80",
  },
  cleaning: {
    Icon: FiCheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200/80",
  },
  masonry: {
    Icon: FiHome,
    color: "text-stone-700",
    bg: "bg-stone-100 border-stone-200",
  },
  pest_control: {
    Icon: FiShield,
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-200/80",
  },
  domestic_help: {
    Icon: FiHeart,
    color: "text-pink-600",
    bg: "bg-pink-50 border-pink-200/80",
  },
  gardening: {
    Icon: FiSun,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200/80",
  },
  driver: {
    Icon: FiNavigation,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200/80",
  },
  caregiving: {
    Icon: FiActivity,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200/80",
  },
  locksmith: {
    Icon: FiKey,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200/80",
  },
  catering_cook: {
    Icon: FiCoffee,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200/80",
  },
  cctv_security: {
    Icon: FiCamera,
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200/80",
  },
};

export default function CategoryIcon({
  categoryId = "electrical",
  className = "w-5 h-5",
  containerClassName = "",
  showBackground = false,
  size,
}) {
  const normKey = String(categoryId || "").toLowerCase().replace(/[\s-]/g, "_");
  const config = CATEGORY_ICONS[normKey] || {
    Icon: FiTool,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200/80",
  };
  const IconComp = config.Icon;

  if (showBackground) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl border ${config.bg} ${containerClassName || "w-12 h-12"}`}
      >
        <IconComp className={`${config.color} ${className}`} size={size} />
      </div>
    );
  }

  return <IconComp className={`${config.color} ${className}`} size={size} />;
}
