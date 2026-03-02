// ─────────────────────────────────────────────────────────
// Header.js — Top Navigation Bar
// Shows: Logo | Language Toggle | Login/Profile button
// ─────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThekedaarLogo } from '../common/ThekedaarLogo';
import './Header.css';

export default function Header() {
  const { t } = useTranslation();
  const { user, isLoggedIn, logout, isContractor } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown if user clicks outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <header className="header">
      <div className="header-inner container">

        {/* ── LOGO ── */}
        <Link to="/" className="header-logo">
          <ThekedaarLogo className="h-11 w-11" />
        </Link>

        {/* ── RIGHT SIDE ── */}
        <div className="header-right">

          {/* Language toggle button — switches between EN and HI */}
          <button
            className="lang-toggle btn btn-ghost btn-sm"
            onClick={toggleLanguage}
            aria-label="Switch language"
          >
            {language === 'en' ? 'हिं' : 'EN'}
          </button>

          {/* If not logged in: show Login button */}
          {!isLoggedIn && (
            <Link to="/login" className="btn btn-primary btn-sm">
              {t('nav.login')}
            </Link>
          )}

          {/* If logged in: show user avatar + dropdown menu */}
          {isLoggedIn && (
            <div className="user-menu" ref={menuRef}>
              <button
                className="user-avatar-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
              >
                <div className="user-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="user-name hide-mobile">
                  {user?.name?.split(' ')[0]}
                </span>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="user-dropdown animate-fade-in">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user?.name}</p>
                    <p className="dropdown-role">
                      {isContractor ? 'Contractor' : 'Customer'}
                    </p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link
                    to={isContractor ? '/dashboard' : '/profile'}
                    className="dropdown-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    {isContractor ? t('nav.dashboard') : t('nav.profile')}
                  </Link>
                  {isContractor && (
                    <Link
                      to="/dashboard/edit-profile"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('profile.editProfile')}
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={handleLogout}
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
