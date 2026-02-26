// ─────────────────────────────────────────────────────────
// ContractorRegisterPage.js — Multi-step Contractor Profile
// Step 1: Basic info (name, category, location, phone)
// Step 2: Services & pricing
// Step 3: Portfolio photos upload
// Step 4: Success screen
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractorAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ContractorRegisterPage.css';

const CATEGORIES_LIST = [
  'Construction','Electrical','Plumbing','Painting','Carpentry',
  'Events & Catering','Property Dealers','Labour Groups',
  'Agriculture','Transport','Industrial','Healthcare',
];

const TOTAL_STEPS = 3;

export default function ContractorRegisterPage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]); // File objects
  const [form, setForm]     = useState({
    name:             user?.name || '',
    category:         '',
    city:             '',
    whatsapp_number:  user?.phone || '',
    experience_years: '',
    about:            '',
    price_min:        '',
    price_max:        '',
    is_labour_group:  false,
    team_size:        '',
    daily_rate_per_person: '',
    travel_range_km:  '',
  });

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function nextStep() {
    // Basic validation before moving forward
    if (step === 1) {
      if (!form.name.trim())     { toast.error('Name is required'); return; }
      if (!form.category)        { toast.error('Select a category'); return; }
      if (!form.city.trim())     { toast.error('City is required'); return; }
      if (!form.whatsapp_number) { toast.error('WhatsApp number is required'); return; }
    }
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  }

  function prevStep() {
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  }

  // Photo file selection
  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });
    setPhotos(prev => [...prev, ...validFiles]);
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  // ── FINAL SUBMIT ──────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true);
    try {
      // Step 1: Create contractor profile
      const profileData = {
        ...form,
        experience_years: form.experience_years ? parseInt(form.experience_years) : null,
        price_min: form.price_min ? parseInt(form.price_min) : null,
        price_max: form.price_max ? parseInt(form.price_max) : null,
        team_size: form.team_size ? parseInt(form.team_size) : null,
        daily_rate_per_person: form.daily_rate_per_person ? parseInt(form.daily_rate_per_person) : null,
        travel_range_km: form.travel_range_km ? parseInt(form.travel_range_km) : null,
      };

      const { contractor } = await contractorAPI.create(profileData);

      // Step 2: Upload photos if any
      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach(f => fd.append('photos', f));
        await contractorAPI.uploadPhotos(contractor.id, fd);
      }

      updateUser({ has_contractor_profile: true });
      setStep(4); // Success screen
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page page-content container">

      {/* ── STEP INDICATOR ── */}
      {step < 4 && (
        <div className="step-indicator">
          {[1, 2, 3].map(s => (
            <div key={s} className={`step-item ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
              <div className="step-circle">
                {step > s ? 'Done' : s}
              </div>
              <span className="step-label">
                {t(`register.step${s}`)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="register-card card">

        {/* ══ STEP 1: BASIC INFO ══════════════════════════ */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2>Basic Information</h2>
            <p className="text-muted" style={{marginBottom:'24px'}}>Tell customers who you are</p>

            <div className="input-group">
              <label className="input-label">{t('register.name')} *</label>
              <input className="input-field" placeholder={t('register.namePlaceholder')}
                value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">{t('register.category')} *</label>
              <select className="input-field" value={form.category}
                onChange={e => setField('category', e.target.value)}>
                <option value="">Select category...</option>
                {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">{t('register.location')} *</label>
                <input className="input-field" placeholder={t('register.locationPlaceholder')}
                  value={form.city} onChange={e => setField('city', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('register.phone')} *</label>
                <input className="input-field" type="tel" placeholder="10-digit WhatsApp number"
                  value={form.whatsapp_number}
                  onChange={e => setField('whatsapp_number', e.target.value.replace(/\D/g,'').slice(0,10))} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{t('register.experience')}</label>
              <input className="input-field" type="number" placeholder="e.g. 5"
                value={form.experience_years} onChange={e => setField('experience_years', e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">{t('register.about')}</label>
              <textarea className="input-field" rows={4} placeholder={t('register.aboutPlaceholder')}
                value={form.about} onChange={e => setField('about', e.target.value)} />
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={nextStep}>
              {t('common.next')} →
            </button>
          </div>
        )}

        {/* ══ STEP 2: SERVICES & PRICING ══════════════════ */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2>Services & Pricing</h2>
            <p className="text-muted" style={{marginBottom:'24px'}}>Help customers understand your rates</p>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">{t('register.priceMin')} *</label>
                <input className="input-field" type="number" placeholder="e.g. 5000"
                  value={form.price_min} onChange={e => setField('price_min', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('register.priceMax')} *</label>
                <input className="input-field" type="number" placeholder="e.g. 50000"
                  value={form.price_max} onChange={e => setField('price_max', e.target.value)} />
              </div>
            </div>

            {/* Labour Group toggle */}
            <div className="toggle-row card" style={{padding:'16px', marginBottom:'16px'}}>
              <div>
                <p style={{fontWeight:600, color:'var(--white)', marginBottom:'4px'}}>
                  {t('register.isLabourGroup')}
                </p>
                <p className="text-muted" style={{fontSize:'0.82rem'}}>
                  Register your team as one unit
                </p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={form.is_labour_group}
                  onChange={e => setField('is_labour_group', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Labour group extra fields */}
            {form.is_labour_group && (
              <div className="labour-fields animate-fade-in">
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">{t('register.teamSize')}</label>
                    <input className="input-field" type="number" placeholder="e.g. 12"
                      value={form.team_size} onChange={e => setField('team_size', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('register.dailyRate')}</label>
                    <input className="input-field" type="number" placeholder="e.g. 500"
                      value={form.daily_rate_per_person} onChange={e => setField('daily_rate_per_person', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">{t('register.travelRange')}</label>
                  <input className="input-field" type="number" placeholder="e.g. 50"
                    value={form.travel_range_km} onChange={e => setField('travel_range_km', e.target.value)} />
                </div>
              </div>
            )}

            <div className="form-btns">
              <button className="btn btn-ghost" onClick={prevStep}>← {t('common.back')}</button>
              <button className="btn btn-primary btn-lg" onClick={nextStep}>{t('common.next')} →</button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: PORTFOLIO PHOTOS ════════════════════ */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2>Portfolio Photos</h2>
            <p className="text-muted" style={{marginBottom:'24px'}}>
              {t('register.photoHint')}
            </p>

            {/* Photo grid */}
            <div className="photo-upload-grid">
              {photos.map((file, i) => (
                <div key={i} className="photo-preview">
                  <img src={URL.createObjectURL(file)} alt="" />
                  <button className="photo-remove" onClick={() => removePhoto(i)}>X</button>
                </div>
              ))}

              {/* Add button */}
              {photos.length < 5 && (
                <label className="photo-add-btn">
                  <input type="file" accept="image/*" multiple style={{display:'none'}}
                    onChange={handlePhotoSelect} />
                  <span className="add-icon">+</span>
                  <span>Add Photo</span>
                </label>
              )}
            </div>

            <p className="text-muted" style={{fontSize:'0.8rem', marginTop:'8px'}}>
              {photos.length}/5 photos added
            </p>

            <div className="form-btns" style={{marginTop:'24px'}}>
              <button className="btn btn-ghost" onClick={prevStep}>← {t('common.back')}</button>
              <button
                className="btn btn-amber btn-lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : t('register.submit')}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 4: SUCCESS ═════════════════════════════ */}
        {step === 4 && (
          <div className="success-screen animate-fade-in">
            <div className="success-icon">Success</div>
            <h2>Profile Created!</h2>
            <p>{t('register.success')}</p>
            <div className="success-btns">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
