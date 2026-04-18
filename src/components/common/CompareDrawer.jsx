import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiCheck, FiChevronDown, FiChevronUp, FiMessageCircle, FiTrash2, FiX } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";

function formatPrice(value) {
  if (!value) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatDistance(value) {
  if (value == null) return "—";
  return `${Number(value).toFixed(1)} km`;
}

export default function CompareDrawer({ contractors, onRemove, onClear }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const compareRows = useMemo(
    () => [
      {
        label: lang === "hi" ? "रेटिंग" : "Rating",
        value: (c) => `${Number(c.rating || 0).toFixed(1)} / 5`,
      },
      {
        label: lang === "hi" ? "रिव्यू" : "Reviews",
        value: (c) => `${c.review_count ?? c.reviews_count ?? 0}`,
      },
      {
        label: lang === "hi" ? "दैनिक दर" : "Daily Rate",
        value: (c) => formatPrice(c.daily_rate),
      },
      {
        label: lang === "hi" ? "अनुभव" : "Experience",
        value: (c) => (c.experience_years ? `${c.experience_years} yrs` : "—"),
      },
      {
        label: lang === "hi" ? "टीम साइज" : "Team Size",
        value: (c) => (c.team_size ? `${c.team_size}` : "—"),
      },
      {
        label: lang === "hi" ? "दूरी" : "Distance",
        value: (c) => formatDistance(c.distance_km),
      },
      {
        label: lang === "hi" ? "उपलब्धता" : "Availability",
        value: (c) => (c.is_available ? (lang === "hi" ? "उपलब्ध" : "Available") : (lang === "hi" ? "व्यस्त" : "Busy")),
      },
      {
        label: lang === "hi" ? "वेरिफाइड" : "Verified",
        value: (c) => (c.is_verified ? <FiCheck className="inline-block text-emerald-500" /> : "—"),
      },
      {
        label: lang === "hi" ? "लेबर ग्रुप" : "Labour Group",
        value: (c) => (c.is_labour_group ? (lang === "hi" ? "हाँ" : "Yes") : "—"),
      },
      {
        label: lang === "hi" ? "रिस्पॉन्सिबिलिटी मॉडल" : "Responsibility Model",
        value: (c) => (c.is_responsibility_model ? (lang === "hi" ? "हाँ" : "Yes") : "—"),
      },
    ],
    [lang]
  );

  if (!contractors.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-heading)]">
              {contractors.length} {lang === "hi" ? "प्रोफाइल तुलना के लिए चुनी गई" : "profiles selected for comparison"}
            </span>
            {contractors.map((contractor) => (
              <span
                key={contractor.id}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bg)] px-3 py-1 text-xs font-medium text-[var(--color-body)]"
              >
                {contractor.name || contractor.business_name || contractor.user_name || "Contractor"}
                <button
                  type="button"
                  onClick={() => onRemove(contractor.id)}
                  className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-danger)]"
                  aria-label="Remove from comparison"
                >
                  <FiX size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {contractors.length >= 2 && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="btn-secondary !h-10 !px-4"
              >
                {expanded ? (lang === "hi" ? "छिपाएँ" : "Collapse") : (lang === "hi" ? "तुलना देखें" : "Compare Now")}
                {expanded ? <FiChevronDown size={16} /> : <FiChevronUp size={16} />}
              </button>
            )}
            <button type="button" onClick={onClear} className="btn-ghost !h-10 !px-4">
              <FiTrash2 size={16} />
              {lang === "hi" ? "साफ़ करें" : "Clear"}
            </button>
          </div>
        </div>

        {expanded && contractors.length >= 2 && (
          <div className="max-h-[70vh] overflow-auto px-4 py-4 md:px-6">
            <div className="min-w-[760px] overflow-hidden rounded-2xl border border-[var(--color-border)]">
              <table className="w-full border-collapse">
                <thead className="bg-[var(--color-bg)]">
                  <tr>
                    <th className="border-b border-[var(--color-border)] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                      {lang === "hi" ? "फ़ीचर" : "Feature"}
                    </th>
                    {contractors.map((contractor) => (
                      <th
                        key={contractor.id}
                        className="border-b border-l border-[var(--color-border)] px-4 py-4 text-left"
                      >
                        <div className="text-sm font-semibold text-[var(--color-heading)]">
                          {contractor.name || contractor.business_name || contractor.user_name || "Contractor"}
                        </div>
                        <div className="mt-1 text-xs capitalize text-[var(--color-muted)]">
                          {(contractor.category || contractor.categories?.[0] || "general").replace("_", " ")}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.label} className="odd:bg-[var(--color-surface)] even:bg-[var(--color-bg)]/50">
                      <td className="border-b border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-heading)]">
                        {row.label}
                      </td>
                      {contractors.map((contractor) => (
                        <td
                          key={`${contractor.id}-${row.label}`}
                          className="border-b border-l border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-body)]"
                        >
                          {row.value(contractor)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--color-heading)]">
                      {lang === "hi" ? "एक्शन" : "Action"}
                    </td>
                    {contractors.map((contractor) => {
                      const name = contractor.name || contractor.business_name || contractor.user_name || "Contractor";
                      const phone = contractor.phone || "";
                      return (
                        <td key={`${contractor.id}-actions`} className="border-l border-[var(--color-border)] px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => navigate("/chat", { state: { initChatWith: contractor.id } })}
                              className="btn-outline-cyan !h-10 !px-4"
                            >
                              <FiMessageCircle size={15} />
                              {lang === "hi" ? "मेसेज" : "Message"}
                            </button>
                            <Link to={`/contractor/${contractor.id}`} className="btn-secondary !h-10 !px-4">
                              {lang === "hi" ? "प्रोफाइल" : "Profile"}
                              <FiArrowUpRight size={15} />
                            </Link>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
