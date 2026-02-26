// ─────────────────────────────────────────────────────────
// ContractorDashboard.js — Contractor Control Panel
// Shows: Stats, availability toggle, leads, profile preview
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractorAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiEdit2, FiEye, FiPhone, FiStar, FiToggleLeft, FiToggleRight, FiZap } from 'react-icons/fi';
import './ContractorDashboard.css';

export default function ContractorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [contractor, setContractor] = useState(null);
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toggling, setToggling]     = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      // Get contractor profile linked to this user
      const [cData, lData] = await Promise.all([
        contractorAPI.getById(user.contractor_id),
        contractorAPI.getLeads(user.contractor_id),
      ]);
      setContractor(cData.contractor);
      setLeads(lData.leads || []);
    } catch {
      toast.error('Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability() {
    setToggling(true);
    try {
      const data = await contractorAPI.toggleAvailability(contractor.id);
      setContractor(prev => ({ ...prev, is_available: data.is_available }));
      toast.success(data.is_available ? 'You are now Available!' : 'Set to Busy');
    } catch {
      toast.error('Could not update availability');
    } finally {
      setToggling(false);
    }
  }

  if (loading) return (
    <div className="dashboard page-content container">
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: '120px', marginBottom: '16px' }} />
      ))}
    </div>
  );

  if (!contractor) return (
    <div className="dashboard page-content container">
      <div className="empty-state">
        <p>No contractor profile found.</p>
        <Link to="/register-contractor" className="btn btn-primary">Create Profile</Link>
      </div>
    </div>
  );

  return (
    <div className="dashboard page-content container">

      {/* ── WELCOME HEADER ── */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {contractor.name.split(' ')[0]}</h1>
          <p className="text-muted">{contractor.category} · {contractor.city}</p>
        </div>
        <div className="dashboard-header-actions">
          <Link to={`/contractor/${contractor.id}`} className="btn btn-ghost btn-sm">
            <FiEye size={14} /> View Profile
          </Link>
          <Link to="/dashboard/edit-profile" className="btn btn-outline-cyan btn-sm">
            <FiEdit2 size={14} /> {t('profile.editProfile')}
          </Link>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="stats-row">
        <StatCard icon="Views" value={contractor.profile_views || 0} label={t('profile.profileViews')} color="var(--cyan)" />
        <StatCard icon="Leads" value={leads.length}                  label={t('profile.totalLeads')}   color="var(--amber)" />
        <StatCard icon="Rate" value={contractor.avg_rating?.toFixed(1) || '—'} label={t('profile.avgRating')} color="var(--amber)" />
        <StatCard icon="Rev" value={contractor.review_count || 0}  label="Reviews"                   color="var(--green)" />
      </div>

      {/* ── AVAILABILITY TOGGLE ── */}
      <div className={`availability-card card ${contractor.is_available ? 'av-on' : 'av-off'}`}>
        <div className="av-info">
          <div className="av-dot-big" style={{background: contractor.is_available ? 'var(--green)' : 'var(--gray-500)'}} />
          <div>
            <p style={{fontWeight:700, color:'var(--white)'}}>
              {contractor.is_available ? t('contractor.available') : t('contractor.busy')}
            </p>
            <p className="text-muted" style={{fontSize:'0.82rem'}}>
              {contractor.is_available
                ? 'Customers can see you are open for work'
                : 'You are hidden from "Available" filter'
              }
            </p>
          </div>
        </div>
        <button
          className={`btn ${contractor.is_available ? 'btn-ghost' : 'btn-primary'}`}
          onClick={toggleAvailability}
          disabled={toggling}
        >
          {toggling
            ? <span className="spinner" />
            : contractor.is_available
              ? <><FiToggleRight size={16}/> {t('profile.setBusy')}</>
              : <><FiToggleLeft  size={16}/> {t('profile.setAvailable')}</>
          }
        </button>
      </div>

      {/* ── UPGRADE BANNER (if not featured) ── */}
      {!contractor.is_featured && (
        <div className="upgrade-banner card">
          <FiZap size={20} color="var(--amber)" />
          <div>
            <p style={{fontWeight:700, color:'var(--white)'}}>Get More Leads with Featured Listing</p>
            <p className="text-muted" style={{fontSize:'0.82rem'}}>Appear at the top of search results — ₹199/month</p>
          </div>
          <Link to="/upgrade" className="btn btn-amber btn-sm">Upgrade</Link>
        </div>
      )}

      {/* ── RECENT LEADS ── */}
      <div className="dashboard-section">
        <h3>{t('profile.myLeads')}</h3>
        {leads.length > 0 ? (
          <div className="leads-list">
            {leads.slice(0, 10).map((lead, i) => (
              <div key={i} className="lead-item card">
                <div className="lead-avatar">
                  {lead.customer_name?.charAt(0) || 'C'}
                </div>
                <div className="lead-info">
                  <p className="lead-name">{lead.customer_name || 'Anonymous Customer'}</p>
                  <p className="lead-time text-muted">{formatDate(lead.created_at)}</p>
                </div>
                <span className="lead-badge">
                  <FiPhone size={11} /> WhatsApp
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No leads yet. Make sure your profile is complete and availability is ON.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value" style={{ color }}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
