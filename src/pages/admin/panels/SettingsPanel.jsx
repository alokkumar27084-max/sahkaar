import React from "react";
import { FiSettings } from "react-icons/fi";
import { BtnPrimary, AdminInput } from "./AdminShared";

export default function SettingsPanel({ settings, setSettings, busy, onSave }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-6 border border-border bg-surface space-y-5">
        <h3 className="text-sm font-bold text-heading flex items-center gap-2 uppercase tracking-wider">
          <FiSettings size={15} /> Site Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Site Brand Name</label>
            <AdminInput value={settings.site_name || ""} onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Support Contact Email</label>
              <AdminInput value={settings.support_email || ""} onChange={e => setSettings(s => ({ ...s, support_email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Support Contact Phone</label>
              <AdminInput value={settings.support_phone || ""} onChange={e => setSettings(s => ({ ...s, support_phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Featured Contractors Limit</label>
              <AdminInput type="number" min={1} max={50} value={settings.featured_limit || 8} onChange={e => setSettings(s => ({ ...s, featured_limit: parseInt(e.target.value) || 8 }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Max Portfolio Photos Limit</label>
              <AdminInput type="number" min={1} max={20} value={settings.max_portfolio_photos || 5} onChange={e => setSettings(s => ({ ...s, max_portfolio_photos: parseInt(e.target.value) || 5 }))} />
            </div>
          </div>

          {/* Maintenance mode toggle */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-elevated border border-border">
            <button
              type="button"
              onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
              className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center p-0.5 shrink-0 ${settings.maintenance_mode ? "bg-rose-500 justify-end" : "bg-muted/40 justify-start"}`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
            <div>
              <p className="text-sm font-bold text-heading">System Maintenance Mode</p>
              <p className="text-xs text-muted mt-0.5">When enabled, only administrative accounts can log in and browse the site.</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <BtnPrimary onClick={onSave} disabled={busy}>Save Site Settings</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
