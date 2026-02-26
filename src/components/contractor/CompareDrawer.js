// ─────────────────────────────────────────────────────────
// CompareDrawer.js — Side-by-side contractor comparison
// Slides up from bottom when user selects 2-3 contractors
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import StarRating from '../ui/StarRating';
import './CompareDrawer.css';

const COMPARE_ROWS = [
  { label: 'Rating',      key: c => c.avg_rating ? `${c.avg_rating.toFixed(1)}` : 'No rating' },
  { label: 'Reviews',     key: c => `${c.review_count || 0} reviews` },
  { label: 'Experience',  key: c => c.experience_years ? `${c.experience_years} yrs` : '—' },
  { label: 'Price Range', key: c => c.price_min ? `₹${c.price_min?.toLocaleString('en-IN')} – ₹${c.price_max?.toLocaleString('en-IN')}` : '—' },
  { label: 'Available',   key: c => c.is_available ? 'Yes' : 'Busy' },
  { label: 'Verified',    key: c => c.is_verified ? 'Yes' : '—' },
  { label: 'Labour Group',key: c => c.is_labour_group ? `${c.team_size} members` : '—' },
  { label: 'Team Size',   key: c => c.team_size ? `${c.team_size} workers` : '—' },
];

export default function CompareDrawer({ contractors, onRemove, onClear }) {
  const [expanded, setExpanded] = useState(false);

  function buildWhatsApp(c) {
    const phone = c.whatsapp_number?.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hi, I found you on Thekedaar. Need ${c.category} services.`);
    return `https://wa.me/91${phone}?text=${msg}`;
  }

  return (
    <div className={`compare-drawer ${expanded ? 'expanded' : ''}`}>

      {/* Header bar */}
      <div className="compare-bar" onClick={() => setExpanded(!expanded)}>
        <div className="compare-bar-left">
          <span className="compare-count">{contractors.length} selected for comparison</span>
          {contractors.map(c => (
            <span key={c.id} className="compare-chip">
              {c.name}
              <button
                className="chip-remove"
                onClick={e => { e.stopPropagation(); onRemove(c.id); }}
              >
                <FiX size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="compare-bar-right">
          {contractors.length >= 2 && (
            <button
              className="compare-expand-btn"
              onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
            >
              {expanded ? 'Collapse' : 'Compare Now'}
              {expanded ? <FiChevronDown /> : <FiChevronUp />}
            </button>
          )}
          <button className="compare-clear" onClick={e => { e.stopPropagation(); onClear(); }}>
            Clear
          </button>
        </div>
      </div>

      {/* Expanded comparison table */}
      {expanded && contractors.length >= 2 && (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-row-label">Feature</th>
                {contractors.map(c => (
                  <th key={c.id}>
                    <div className="compare-th-name">{c.name}</div>
                    <div className="compare-th-cat">{c.category}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(row => (
                <tr key={row.label}>
                  <td className="compare-row-label">{row.label}</td>
                  {contractors.map(c => (
                    <td key={c.id}>{row.key(c)}</td>
                  ))}
                </tr>
              ))}
              {/* WhatsApp CTA row */}
              <tr>
                <td className="compare-row-label">Contact</td>
                {contractors.map(c => (
                  <td key={c.id}>
                    <a
                      href={buildWhatsApp(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm whatsapp-mini-btn"
                    >
                      <FaWhatsapp size={13} /> WhatsApp
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
