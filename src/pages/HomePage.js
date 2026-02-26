// ─────────────────────────────────────────────────────────
// HomePage.js — Main Landing Page
//
// Sections:
//   1. Hero — big tagline + search bar
//   2. Categories grid — 12 service types
//   3. Why Thekedaar — 3 value props
//   4. Featured contractors near user
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractorAPI } from '../utils/api';
import ContractorCard from '../components/contractor/ContractorCard';
import { FiSearch, FiMapPin, FiLoader } from 'react-icons/fi';
import {
  FaHardHat, FaBolt, FaTint, FaPaintBrush, FaTree,
  FaUtensils, FaHome, FaUsers, FaTractor, FaTruck,
  FaIndustry, FaHeartbeat
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './HomePage.css';

// ── SERVICE CATEGORIES ─────────────────────────────────────
const CATEGORIES = [
  { key: 'construction', icon: FaHardHat,   color: '#E9A63A' },
  { key: 'electrical',   icon: FaBolt,      color: '#00B4D8' },
  { key: 'plumbing',     icon: FaTint,      color: '#38BDF8' },
  { key: 'painting',     icon: FaPaintBrush,color: '#A78BFA' },
  { key: 'carpentry',    icon: FaTree,      color: '#34D399' },
  { key: 'events',       icon: FaUtensils,  color: '#F472B6' },
  { key: 'realEstate',   icon: FaHome,      color: '#60A5FA' },
  { key: 'labourGroups', icon: FaUsers,     color: '#00B4D8' },
  { key: 'agriculture',  icon: FaTractor,   color: '#86EFAC' },
  { key: 'transport',    icon: FaTruck,     color: '#FCA5A5' },
  { key: 'industrial',   icon: FaIndustry,  color: '#94A3B8' },
  { key: 'healthcare',   icon: FaHeartbeat, color: '#FB7185' },
];

// ── WHY THEKEDAAR POINTS ───────────────────────────────────
const WHY_POINTS = [
  {
    emoji: 'Compare',
    title: 'Compare Before You Hire',
    body:  'See ratings, photos, pricing and experience side-by-side. Make informed decisions — not blind guesses.',
  },
  {
    emoji: 'Direct',
    title: 'Direct Contact — No Middleman',
    body:  'One tap opens WhatsApp directly with the contractor. No platform booking fee. No commission. Ever.',
  },
  {
    emoji: 'Trust',
    title: 'Verified & Accountable',
    body:  'Verified badges, real reviews, and the power of choice protect you from being overcharged or misled.',
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [query, setQuery]       = useState('');
  const [location, setLocation] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [userCoords, setUserCoords] = useState(null);

  // Load featured contractors on page load
  useEffect(() => {
    loadFeaturedContractors();
  }, []);

  async function loadFeaturedContractors() {
    try {
      const data = await contractorAPI.search({ featured: true, limit: 6 });
      setFeatured(data.contractors || []);
    } catch {
      // Don't show error for initial load — just show empty
    } finally {
      setLoading(false);
    }
  }

  // Get user's GPS location
  function detectLocation() {
    if (!navigator.geolocation) {
      toast.error('Location not supported on this device');
      return;
    }
    const toastId = toast.loading('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation('Current Location');
        toast.success('Location detected!', { id: toastId });
      },
      () => {
        toast.error('Could not get location. Please enter manually.', { id: toastId });
      }
    );
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({ q: query });
    if (userCoords) {
      params.set('lat', userCoords.lat);
      params.set('lng', userCoords.lng);
    }
    navigate(`/search?${params.toString()}`);
  }

  function handleCategoryClick(categoryKey) {
    const params = new URLSearchParams({ category: categoryKey });
    if (userCoords) {
      params.set('lat', userCoords.lat);
      params.set('lng', userCoords.lng);
    }
    navigate(`/search?${params.toString()}`);
  }

  return (
    <div className="home-page page-wrapper">

      {/* ══ HERO SECTION ════════════════════════════════════ */}
      <section className="hero-section">
        {/* Background mesh gradient */}
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
        </div>

        <div className="container hero-content animate-fade-in-up">
          {/* Tagline */}
          <div className="hero-tagline">
            <span className="tagline-chip">Har Kaam Ka Ek Thekedaar</span>
          </div>

          {/* Main heading */}
          <h1 className="hero-title">
            {t('home.heroTitle')}{' '}
            <span className="hero-highlight">{t('home.heroTitleHighlight')}</span>
          </h1>
          <p className="hero-sub">{t('home.heroSub')}</p>

          {/* Search form */}
          <form className="hero-search" onSubmit={handleSearch}>
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder={t('home.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
              />
            </div>

            <div className="search-location">
              <FiMapPin className="location-icon" />
              <input
                type="text"
                className="location-input"
                placeholder="City or area..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button
                type="button"
                className="detect-btn"
                onClick={detectLocation}
                title={t('home.detectLocation')}
              >
                Use
              </button>
            </div>

            <button type="submit" className="btn btn-primary search-btn">
              {t('home.searchBtn')}
            </button>
          </form>

          {/* Quick stats */}
          <div className="hero-stats stagger-children animate-fade-in">
            {[
              { value: '500M+', label: 'Informal Workers' },
              { value: '₹0',    label: 'Commission' },
              { value: '12+',   label: 'Categories' },
            ].map((stat) => (
              <div key={stat.label} className="hero-stat">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES SECTION ══════════════════════════════ */}
      <section className="categories-section container">
        <h2 className="section-title">{t('home.popularCategories')}</h2>

        <div className="categories-grid stagger-children">
          {CATEGORIES.map(({ key, icon: Icon, color }) => (
            <button
              key={key}
              className="category-btn animate-fade-in"
              onClick={() => handleCategoryClick(key)}
              style={{ '--cat-color': color }}
            >
              <div className="category-icon-wrap">
                <Icon size={22} color={color} />
              </div>
              <span className="category-label">{t(`categories.${key}`)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ══ WHY THEKEDAAR SECTION ═══════════════════════════ */}
      <section className="why-section container">
        <h2 className="section-title">{t('home.whyUs')}</h2>

        <div className="why-grid stagger-children">
          {WHY_POINTS.map((point) => (
            <div key={point.title} className="why-card card animate-fade-in">
              <div className="why-emoji">{point.emoji}</div>
              <h3 className="why-title">{point.title}</h3>
              <p className="why-body">{point.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURED CONTRACTORS ════════════════════════════ */}
      <section className="featured-section container">
        <div className="section-header">
          <h2 className="section-title">{t('home.featuredContractors')}</h2>
          <button
            className="btn btn-outline-cyan btn-sm"
            onClick={() => navigate('/search?featured=true')}
          >
            {t('home.viewAll')}
          </button>
        </div>

        {loading ? (
          // Skeleton loaders while data loads
          <div className="contractors-grid">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: '360px' }} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="contractors-grid">
            {featured.map(c => (
              <ContractorCard key={c.id} contractor={c} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No featured contractors yet. Check back soon!</p>
          </div>
        )}
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════ */}
      <footer className="home-footer">
        <p>{t('common.poweredBy')}</p>
        <p className="footer-sub">
          thekedaar.in · ©2025 Thekedaar · All rights reserved
        </p>
      </footer>
    </div>
  );
}
