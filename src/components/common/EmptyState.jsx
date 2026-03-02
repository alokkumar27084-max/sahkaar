import React from "react";
import Icon from "./Icon";

export default function EmptyState({ icon = "search", title, subtitle, action }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="mb-3 text-[#06B6D4]">
        <Icon name={icon} className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-['Poppins'] font-semibold text-[#111827] mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-[#6B7280] mb-5 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}
