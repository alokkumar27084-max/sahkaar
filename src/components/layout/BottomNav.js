// ─────────────────────────────────────────────────────────
// BottomNav.js — Mobile Bottom Navigation Bar
// Shows icons for: Home | Search | Profile/Dashboard
// Only visible on mobile screens
// ─────────────────────────────────────────────────────────
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiSearch, FiUser, FiTool } from 'react-icons/fi';
import './BottomNav.css';

export default function BottomNav() {
  const { t } = useTranslation();
  const { isLoggedIn, isContractor } = useAuth();
  const location = useLocation();

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  const navItems = [
    { to: '/',        icon: FiHome,   label: t('nav.home'),    always: true },
    { to: '/search',  icon: FiSearch, label: t('nav.search'),  always: true },
    isLoggedIn && isContractor
      ? { to: '/dashboard', icon: FiTool,   label: t('nav.dashboard'), always: false }
      : { to: '/profile',   icon: FiUser,   label: t('nav.profile'),   always: false },
  ].filter(Boolean);

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label">{item.label}</span>
            {active && <span className="bottom-nav-dot" />}
          </Link>
        );
      })}
    </nav>
  );
}
