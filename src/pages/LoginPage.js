// ─────────────────────────────────────────────────────────
// LoginPage.js — OTP-based Login + Register
//
// FLOW:
//   Step 1: User enters phone number → clicks Send OTP
//   Step 2: User enters 6-digit OTP  → backend verifies
//   Step 3: If new user → show register form
//   Step 3: If existing user → logged in, redirected
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './LoginPage.css';

const STEP = { PHONE: 'phone', OTP: 'otp', ROLE: 'role' };

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go after login (if redirected from a protected page)
  const from = location.state?.from?.pathname || '/';

  const [step, setStep]       = useState(STEP.PHONE);
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']); // 6 boxes
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // resend timer
  const [isNewUser, setIsNewUser] = useState(false);
  const [role, setRole]       = useState('customer');

  const otpRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true });
  }, [isLoggedIn]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── STEP 1: SEND OTP ──────────────────────────────────────
  async function handleSendOTP(e) {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error(t('common.invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      const data = await authAPI.sendOTP(phone);
      setIsNewUser(data.isNewUser || false);
      setStep(STEP.OTP);
      setCountdown(60); // 60 second resend timer
      toast.success(`${t('auth.otpSent')} +91${phone}`);
      // Auto-focus first OTP box
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  // ── OTP INPUT HANDLING ────────────────────────────────────
  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return; // only digits
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last digit
    setOtp(newOtp);
    // Auto-advance to next box
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    // Backspace moves to previous box
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    // Allow pasting full 6-digit OTP
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  }

  // ── STEP 2: VERIFY OTP ────────────────────────────────────
  async function handleVerifyOTP(e) {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const data = await authAPI.verifyOTP(phone, otpString);

      if (data.isNewUser) {
        // New user needs to select role (customer or contractor)
        setStep(STEP.ROLE);
      } else {
        // Existing user — log them in
        login(data.user, data.token);
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // ── STEP 3: SELECT ROLE AND REGISTER ─────────────────────
  async function handleRegister() {
    setLoading(true);
    try {
      const data = await authAPI.register({ phone, role });
      login(data.user, data.token);
      toast.success('Account created!');
      if (role === 'contractor') {
        navigate('/register-contractor', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page page-content">
      <div className="login-card card">

        {/* Logo */}
        <div className="login-logo">
          <span className="logo-the">The</span>
          <span className="logo-kedaar">kedaar</span>
        </div>

        {/* ── STEP 1: PHONE ── */}
        {step === STEP.PHONE && (
          <form onSubmit={handleSendOTP} className="animate-fade-in">
            <h2>{t('auth.loginTitle')}</h2>
            <p className="login-sub">{t('auth.loginSub')}</p>

            <div className="input-group" style={{ marginTop: '24px' }}>
              <label className="input-label">{t('auth.phone')}</label>
              <div className="phone-input-wrap">
                <span className="phone-prefix">+91</span>
                <input
                  type="tel"
                  className="input-field phone-input"
                  placeholder={t('auth.phonePlaceholder')}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  autoComplete="tel"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || phone.length !== 10}
            >
              {loading ? <span className="spinner" /> : t('auth.sendOTP')}
            </button>

            <p className="login-terms">{t('auth.terms')}</p>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === STEP.OTP && (
          <form onSubmit={handleVerifyOTP} className="animate-fade-in">
            <button
              type="button"
              className="back-btn"
              onClick={() => { setStep(STEP.PHONE); setOtp(['','','','','','']); }}
            >
              ← Back
            </button>
            <h2>{t('auth.verifyOTP')}</h2>
            <p className="login-sub">{t('auth.otpSent')} <strong>+91{phone}</strong></p>

            {/* 6-box OTP input */}
            <div className="otp-boxes" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-box ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || otp.join('').length !== 6}
              style={{ marginTop: '16px' }}
            >
              {loading ? <span className="spinner" /> : t('auth.verifyOTP')}
            </button>

            {/* Resend timer */}
            <div className="resend-row">
              {countdown > 0 ? (
                <span className="text-muted">
                  {t('auth.resendIn')} {countdown}{t('auth.seconds')}
                </span>
              ) : (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleSendOTP}
                >
                  {t('auth.resendOTP')}
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── STEP 3: ROLE SELECTION ── */}
        {step === STEP.ROLE && (
          <div className="animate-fade-in">
            <h2>Welcome to Thekedaar!</h2>
            <p className="login-sub">Tell us who you are</p>

            <div className="role-cards">
              <button
                className={`role-card ${role === 'customer' ? 'active' : ''}`}
                onClick={() => setRole('customer')}
              >
                <span className="role-emoji">C</span>
                <span className="role-title">{t('auth.asCustomer')}</span>
                <span className="role-desc">Find & hire contractors</span>
              </button>
              <button
                className={`role-card ${role === 'contractor' ? 'active' : ''}`}
                onClick={() => setRole('contractor')}
              >
                <span className="role-emoji">T</span>
                <span className="role-title">{t('auth.asContractor')}</span>
                <span className="role-desc">List your services & get leads</span>
              </button>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : t('auth.registerBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
