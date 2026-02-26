import React from "react";
import Icon from "./Icon";

export default function EmptyState({ icon = "search", title, subtitle, action }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="mb-3 text-cyan-100">
        <Icon name={icon} className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-slate-300 mb-5 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}
