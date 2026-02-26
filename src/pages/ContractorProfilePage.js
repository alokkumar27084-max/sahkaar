// ─────────────────────────────────────────────────────────
// ContractorProfilePage.js — Full Contractor Profile
// URL: /contractor/:id
// Shows: Photos, about, pricing, reviews, WhatsApp CTA
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractorAPI, reviewAPI } from '../utils/api';
import StarRating from '../components/ui/StarRating';
import ReviewCard from '../components/contractor/ReviewCard';
import ReviewForm from '../components/contractor/ReviewForm';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiUsers, FiArrowLeft, FiShare2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './ContractorProfilePage.css';

export default function ContractorProfilePage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { isLoggedIn, isCustomer } = useAuth();
  const navigate = useNavigate();

  const [contractor, setContractor] = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  async function loadProfile() {
    try {
      const [cData, rData] = await Promise.all([
        contractorAPI.getById(id),
        reviewAPI.getForContractor(id),
      ]);
      setContractor(cData.contractor);
      setReviews(rData.reviews || []);
    } catch {
      toast.error('Could not load profile');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  }

  function buildWhatsApp() {
    const phone = contractor.whatsapp_number?.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hi ${contractor.name}, I found your profile on Thekedaar. I need ${contractor.category} services. Can we discuss?`
    );
    return `https://wa.me/91${phone}?text=${msg}`;
  }

  async function handleWhatsAppClick() {
    try { await contractorAPI.recordLead(contractor.id); } catch {}
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: contractor.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success(t('common.copied'));
    }
  }

  async function handleReviewSubmit(rating, text) {
    try {
      await reviewAPI.create(contractor.id, rating, text);
      toast.success('Review submitted!');
      setShowReviewForm(false);
      loadProfile(); // refresh
    } catch (err) {
      toast.error(err.message || 'Could not submit review');
    }
  }

  if (loading) return (
    <div className="profile-loading page-content container">
      <div className="skeleton" style={{ height: '300px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '200px' }} />
    </div>
  );

  if (!contractor) return null;

  return (
    <div className="contractor-profile page-content">

      {/* ── TOP NAV ── */}
      <div className="profile-topnav container">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <FiArrowLeft /> {t('common.back')}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleShare}>
          <FiShare2 /> {t('common.share')}
        </button>
      </div>

      {/* ── PHOTO GALLERY ── */}
      {contractor.photos?.length > 0 && (
        <div className="photo-gallery container">
          <div className="photo-main">
            <img
              src={contractor.photos[activePhoto]}
              alt={`${contractor.name} work ${activePhoto + 1}`}
            />
          </div>
          {contractor.photos.length > 1 && (
            <div className="photo-thumbs">
              {contractor.photos.map((ph, i) => (
                <img
                  key={i}
                  src={ph}
                  alt=""
                  className={`photo-thumb ${i === activePhoto ? 'active' : ''}`}
                  onClick={() => setActivePhoto(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="profile-body container">

        {/* ── MAIN INFO ── */}
        <div className="profile-main">
          <div className="profile-identity">
            {/* Avatar */}
            <div className="profile-avatar">
              {contractor.photo_url
                ? <img src={contractor.photo_url} alt={contractor.name} />
                : <span>{contractor.name?.charAt(0)}</span>
              }
              <span className={`availability-dot ${contractor.is_available ? 'available' : 'busy'}`} />
            </div>
            <div>
              <div className="profile-name-row">
                <h1 className="profile-name">{contractor.name}</h1>
                <div className="profile-badges">
                  {contractor.is_verified && <span className="badge badge-verified">Verified</span>}
                  {contractor.is_featured && <span className="badge badge-featured">Featured</span>}
                  {contractor.is_labour_group && <span className="badge badge-new">Labour Group</span>}
                </div>
              </div>
              <p className="profile-category">{contractor.category}</p>
              <div className="profile-rating">
                <StarRating rating={contractor.avg_rating || 0} size={16} />
                <strong>{contractor.avg_rating?.toFixed(1) || 'New'}</strong>
                <span className="text-muted">({contractor.review_count || 0} {t('contractor.reviews')})</span>
              </div>
            </div>
          </div>

          {/* Location + Experience */}
          <div className="profile-meta">
            <div className="meta-item">
              <FiMapPin size={14} />
              <span>{contractor.city}</span>
            </div>
            {contractor.experience_years && (
              <div className="meta-item">
                <span>Exp</span>
                <span>{contractor.experience_years} {t('contractor.experience')}</span>
              </div>
            )}
            {contractor.is_labour_group && (
              <div className="meta-item">
                <FiUsers size={14} />
                <span>{contractor.team_size} {t('contractor.teamSize')}</span>
              </div>
            )}
          </div>

          {/* Availability */}
          <div className={`availability-banner ${contractor.is_available ? 'av-available' : 'av-busy'}`}>
            {contractor.is_available
              ? `${t('contractor.available')} — Can take new work`
              : `${t('contractor.busy')} — Currently engaged`
            }
          </div>
        </div>

        {/* ── PRICING CARD ── */}
        <div className="profile-pricing card">
          <h3>Pricing</h3>
          {contractor.price_min && (
            <div className="price-display">
              <span className="price-big">
                ₹{contractor.price_min?.toLocaleString('en-IN')} – ₹{contractor.price_max?.toLocaleString('en-IN')}
              </span>
              <span className="text-muted"> {t('contractor.perJob')}</span>
            </div>
          )}
          {contractor.is_labour_group && contractor.daily_rate_per_person && (
            <div className="price-item">
              <span>Daily Rate</span>
              <strong>₹{contractor.daily_rate_per_person?.toLocaleString('en-IN')}{t('contractor.perPerson')}/day</strong>
            </div>
          )}
          {contractor.travel_range_km && (
            <div className="price-item">
              <span>Travels up to</span>
              <strong>{contractor.travel_range_km} km</strong>
            </div>
          )}

          {/* WhatsApp CTA — the most important button */}
          <a
            href={buildWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-full whatsapp-cta"
            onClick={handleWhatsAppClick}
            style={{ background: '#25D366', marginTop: '16px' }}
          >
            <FaWhatsapp size={18} />
            {t('contractor.contactWhatsApp')}
          </a>
        </div>

        {/* ── ABOUT ── */}
        {contractor.about && (
          <div className="profile-section">
            <h3>About</h3>
            <p className="profile-about">{contractor.about}</p>
          </div>
        )}

        {/* ── LABOUR GROUP DETAILS ── */}
        {contractor.is_labour_group && (
          <div className="profile-section card">
            <h3>Labour Group Details</h3>
            <div className="labour-details">
              <div className="ld-item">
                <span>Total Workers</span>
                <strong>{contractor.team_size}</strong>
              </div>
              <div className="ld-item">
                <span>Daily Rate/Person</span>
                <strong>₹{contractor.daily_rate_per_person?.toLocaleString('en-IN')}</strong>
              </div>
              {contractor.team_skills && (
                <div className="ld-item ld-skills">
                  <span>Skills</span>
                  <div className="skill-tags">
                    {contractor.team_skills.map(s => (
                      <span key={s} className="skill-tag">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        <div className="profile-section">
          <div className="reviews-header">
            <h3>Reviews ({reviews.length})</h3>
            {isLoggedIn && isCustomer && !showReviewForm && (
              <button
                className="btn btn-outline-cyan btn-sm"
                onClick={() => setShowReviewForm(true)}
              >
                {t('reviews.writeReview')}
              </button>
            )}
          </div>

          {showReviewForm && (
            <ReviewForm
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(false)}
            />
          )}

          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          ) : (
            <p className="text-muted">{t('reviews.noReviews')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
