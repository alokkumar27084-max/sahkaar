// ─────────────────────────────────────────────────────────
// ContractorCard.js — Single Contractor Display Card
//
// Used on: Homepage, Search Results, Profile pages
// Shows: Name, Category, Rating, Badges, WhatsApp button
//
// PROPS:
//   contractor — the contractor object from backend
//   onCompare  — function called when Compare is clicked
//   showCompare — whether to show the compare checkbox
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractorAPI } from '../../utils/api';
import StarRating from '../ui/StarRating';
import {
  FiMapPin, FiUsers, FiCheckCircle,
  FiShield, FiStar, FiMessageCircle
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import './ContractorCard.css';

export default function ContractorCard({ contractor, onCompare, showCompare }) {
  const { t } = useTranslation();
  const [leadRecorded, setLeadRecorded] = useState(false);

  // Build WhatsApp URL with pre-filled message
  function buildWhatsAppUrl() {
    const phone = contractor.whatsapp_number?.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hi, I found your profile on Thekedaar. I need ${contractor.category} services. Can we discuss?`
    );
    return `https://wa.me/91${phone}?text=${message}`;
  }

  // Record lead in database when WhatsApp is clicked
  async function handleWhatsAppClick(e) {
    if (!leadRecorded) {
      setLeadRecorded(true);
      try {
        await contractorAPI.recordLead(contractor.id);
      } catch {
        // Don't block user if lead recording fails
      }
    }
  }

  return (
    <div className={`contractor-card card ${contractor.is_featured ? 'card-featured' : ''}`}>

      {/* ── BADGES ROW ── */}
      <div className="card-badges">
        {contractor.is_featured && (
          <span className="badge badge-featured">
            <FiStar size={10} /> {t('contractor.featured')}
          </span>
        )}
        {contractor.is_verified && (
          <span className="badge badge-verified">
            <FiCheckCircle size={10} /> {t('contractor.verified')}
          </span>
        )}
        {contractor.is_labour_group && (
          <span className="badge badge-new">
            <FiUsers size={10} /> {t('contractor.labourGroup')}
          </span>
        )}
        {contractor.is_responsibility_model && (
          <span className="badge badge-new">
            <FiShield size={10} /> {t('contractor.responsible')}
          </span>
        )}
      </div>

      {/* ── COMPARE CHECKBOX ── */}
      {showCompare && (
        <div className="card-compare">
          <label className="compare-label">
            <input
              type="checkbox"
              onChange={(e) => onCompare?.(contractor, e.target.checked)}
            />
            <span>{t('contractor.compare')}</span>
          </label>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="card-main">

        {/* Avatar */}
        <div className="card-avatar">
          {contractor.photo_url
            ? <img src={contractor.photo_url} alt={contractor.name} />
            : <span>{contractor.name?.charAt(0)?.toUpperCase()}</span>
          }
          {/* Availability dot */}
          <span className={`availability-dot ${contractor.is_available ? 'available' : 'busy'}`} />
        </div>

        {/* Info */}
        <div className="card-info">
          <h3 className="card-name">{contractor.name}</h3>
          <p className="card-category">{contractor.category}</p>

          {/* Rating */}
          <div className="card-rating">
            <StarRating rating={contractor.avg_rating || 0} size={14} />
            <span className="rating-value">{contractor.avg_rating?.toFixed(1) || 'New'}</span>
            <span className="rating-count">
              ({contractor.review_count || 0} {t('contractor.reviews')})
            </span>
          </div>

          {/* Location + Distance */}
          <div className="card-location">
            <FiMapPin size={13} />
            <span>{contractor.city}</span>
            {contractor.distance_km && (
              <span className="distance">
                · {contractor.distance_km.toFixed(1)} {t('contractor.distance')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── LABOUR GROUP DETAILS ── */}
      {contractor.is_labour_group && (
        <div className="card-group-info">
          <div className="group-stat">
            <FiUsers size={14} />
            <span>{contractor.team_size} {t('contractor.teamSize')}</span>
          </div>
          <div className="group-stat">
            <span className="group-rate">
              ₹{contractor.daily_rate_per_person?.toLocaleString('en-IN')}
              {t('contractor.perPerson')}/day
            </span>
          </div>
        </div>
      )}

      {/* ── PRICING ── */}
      <div className="card-pricing">
        {contractor.price_min && contractor.price_max && (
          <span className="price-range">
            ₹{contractor.price_min?.toLocaleString('en-IN')} –
            ₹{contractor.price_max?.toLocaleString('en-IN')}
            <span className="price-label"> {t('contractor.perJob')}</span>
          </span>
        )}
        <span className={`availability-text ${contractor.is_available ? 'text-green' : ''}`}
          style={{ color: contractor.is_available ? 'var(--green)' : 'var(--gray-300)' }}
        >
          {contractor.is_available ? t('contractor.available') : t('contractor.busy')}
        </span>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="card-actions">
        {/* WhatsApp — main CTA */}
        <a
          href={buildWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-full whatsapp-btn"
          onClick={handleWhatsAppClick}
        >
          <FaWhatsapp size={16} />
          {t('contractor.contactWhatsApp')}
        </a>

        {/* View full profile */}
        <Link
          to={`/contractor/${contractor.id}`}
          className="btn btn-ghost btn-full"
        >
          {t('contractor.viewProfile')}
        </Link>
      </div>
    </div>
  );
}
