import React from "react";
import { FiSettings } from "react-icons/fi";
import { BtnPrimary, AdminInput } from "./AdminShared";

export default function SettingsPanel({ settings, setSettings, busy, onSave }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
        <h3 className="font-semibold text-[var(--color-heading)] flex items-center gap-2"><FiSettings size={16} /> Site Configuration</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Site Name</label>
            <AdminInput value={settings.site_name || ""} onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Support Email</label>
              <AdminInput value={settings.support_email || ""} onChange={e => setSettings(s => ({ ...s, support_email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Support Phone</label>
              <AdminInput value={settings.support_phone || ""} onChange={e => setSettings(s => ({ ...s, support_phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Featured Contractors Limit</label>
              <AdminInput type="number" min={1} max={50} value={settings.featured_limit || 8} onChange={e => setSettings(s => ({ ...s, featured_limit: parseInt(e.target.value) || 8 }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Max Portfolio Photos</label>
              <AdminInput type="number" min={1} max={20} value={settings.max_portfolio_photos || 5} onChange={e => setSettings(s => ({ ...s, max_portfolio_photos: parseInt(e.target.value) || 5 }))} />
            </div>
          </div>

          {/* Maintenance mode toggle */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
            <button
              onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
              className={`w-12 h-6 rounded-full transition-all flex items-center p-0.5 ${settings.maintenance_mode ? "bg-red-500 justify-end" : "bg-white/20 justify-start"}`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow" />
            </button>
            <div>
              <p className="text-sm font-medium text-[var(--color-heading)]">Maintenance Mode</p>
              <p className="text-xs text-[var(--color-muted)]">When enabled, only admins can access the site.</p>
            </div>
          </div>
        </div>

        <BtnPrimary onClick={onSave} disabled={busy}>Save Settings</BtnPrimary>
      </div>
    </div>
  );
}
