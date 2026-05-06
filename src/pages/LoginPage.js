// ─────────────────────────────────────────────────────────
// LoginPage.js — Firebase-powered Login + Register
//
// FLOW:
//   Phone: Enter phone → Firebase sends OTP SMS → Enter OTP → Verified → Login/Register
//   Email: Enter email → Firebase sends sign-in link → User clicks link → Verified → Login/Register
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from '../config/firebase';
import './LoginPage.css';

const STEP = { METHOD: 'method', PHONE: 'phone', OTP: 'otp', EMAIL: 'email', EMAIL_SENT: 'email_sent', ROLE: 'role' };
const METHOD = { PHONE: 'phone', EMAIL: 'email' };

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go after login (if redirected from a protected page)
  const from = location.state?.from?.pathname || '/';

  const [step, setStep]               = useState(STEP.PHONE);
  const [method, setMethod]           = useState(METHOD.PHONE);
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']); // 6 boxes
  const [loading, setLoading]         = useState(false);
  const [countdown, setCountdown]     = useState(0); // resend timer
  const [role, setRole]               = useState('customer');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Firebase confirmation result (for phone OTP)
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);
  const otpRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true });
  }, [isLoggedIn]);

  // Check if returning from email sign-in link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email from localStorage (saved when link was sent)
      let savedEmail = window.localStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        savedEmail = window.prompt('Please provide your email for confirmation');
      }
      if (savedEmail) {
        handleEmailLinkSignIn(savedEmail);
      }
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Initialize invisible reCAPTCHA for phone auth
  const setupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) return;

    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - will proceed with phone auth
      },
      'expired-callback': () => {
        recaptchaVerifierRef.current = null;
      },
    });
  }, []);

  // ── PHONE: SEND OTP via Firebase ──────────────────────────
  async function handleSendOTP(e) {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error(t('common.invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      setupRecaptcha();
      const phoneNumber = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep(STEP.OTP);
      setCountdown(60);
      toast.success(`${t('auth.otpSent')} +91${phone}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      console.error('Firebase phone auth error:', err);
      // Reset reCAPTCHA on error
      recaptchaVerifierRef.current = null;
      if (err.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number. Please check and try again.');
      } else {
        toast.error(err.message || t('common.error'));
      }
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

  // ── PHONE: VERIFY OTP via Firebase ────────────────────────
  async function handleVerifyOTP(e) {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    if (!confirmationResult) {
      toast.error('Session expired. Please resend OTP.');
      setStep(STEP.PHONE);
      return;
    }
    setLoading(true);
    try {
      // Verify OTP with Firebase
      const credential = await confirmationResult.confirm(otpString);
      const idToken = await credential.user.getIdToken();

      // Send Firebase ID token to our backend for user lookup/login
      const res = await authAPI.verifyPhoneToken(idToken);
      const data = res.data;

      if (data.isNewUser) {
        setVerifiedPhone(data.phone || phone);
        setStep(STEP.ROLE);
      } else {
        login(data.user, data.token);
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        toast.error('Invalid OTP. Please check and try again.');
      } else {
        toast.error(err?.response?.data?.message || err.message || 'Invalid OTP. Please try again.');
      }
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // ── EMAIL: SEND SIGN-IN LINK via Firebase ─────────────────
  async function handleSendEmailLink(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save email for later verification
      window.localStorage.setItem('emailForSignIn', email);
      setStep(STEP.EMAIL_SENT);
      toast.success(`Sign-in link sent to ${email}`);
    } catch (err) {
      console.error('Firebase email link error:', err);
      if (err.code === 'auth/invalid-email') {
        toast.error('Invalid email address.');
      } else {
        toast.error(err.message || t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  }

  // ── EMAIL: HANDLE RETURNING FROM EMAIL LINK ───────────────
  async function handleEmailLinkSignIn(emailForSignIn) {
    setLoading(true);
    try {
      const result = await signInWithEmailLink(auth, emailForSignIn, window.location.href);
      const idToken = await result.user.getIdToken();

      // Send Firebase ID token to our backend
      const res = await authAPI.verifyEmailToken(idToken);
      const data = res.data;

      // Clear saved email
      window.localStorage.removeItem('emailForSignIn');

      if (data.isNewUser) {
        setVerifiedEmail(data.email || emailForSignIn);
        setStep(STEP.ROLE);
      } else {
        login(data.user, data.token);
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Email link sign-in error:', err);
      toast.error(err?.response?.data?.message || err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── STEP: SELECT ROLE AND REGISTER ─────────────────────
  async function handleRegister() {
    setLoading(true);
    try {
      const registerData = { role };
      if (verifiedPhone) registerData.phone = verifiedPhone;
      if (verifiedEmail) registerData.email = verifiedEmail;

      const res = await authAPI.register(registerData);
      const data = res.data;
      login(data.user, data.token);
      toast.success('Account created!');
      if (role === 'contractor') {
        navigate('/register-contractor', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  // ── Switch between phone and email method ─────────────────
  function switchMethod(newMethod) {
    setMethod(newMethod);
    setStep(newMethod === METHOD.PHONE ? STEP.PHONE : STEP.EMAIL);
    setOtp(['', '', '', '', '', '']);
    setConfirmationResult(null);
  }

  return (
    <div className="login-page page-content">
      <div className="login-card card">

        {/* Logo */}
        <div className="login-logo">
          <span className="logo-the">The</span>
          <span className="logo-kedaar">kedaar</span>
        </div>

        {/* Method Toggle (Phone / Email) */}
        {(step === STEP.PHONE || step === STEP.EMAIL) && (
          <div className="method-toggle">
            <button
              className={`method-btn ${method === METHOD.PHONE ? 'active' : ''}`}
              onClick={() => switchMethod(METHOD.PHONE)}
            >
              📱 {t('auth.phone') || 'Phone'}
            </button>
            <button
              className={`method-btn ${method === METHOD.EMAIL ? 'active' : ''}`}
              onClick={() => switchMethod(METHOD.EMAIL)}
            >
              📧 {t('auth.email') || 'Email'}
            </button>
          </div>
        )}

        {/* ── PHONE INPUT ── */}
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

        {/* ── EMAIL INPUT ── */}
        {step === STEP.EMAIL && (
          <form onSubmit={handleSendEmailLink} className="animate-fade-in">
            <h2>{t('auth.loginTitle')}</h2>
            <p className="login-sub">We'll send a sign-in link to your email</p>

            <div className="input-group" style={{ marginTop: '24px' }}>
              <label className="input-label">{t('auth.email') || 'Email'}</label>
              <input
                type="email"
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || !email.includes('@')}
            >
              {loading ? <span className="spinner" /> : 'Send Sign-in Link'}
            </button>

            <p className="login-terms">{t('auth.terms')}</p>
          </form>
        )}

        {/* ── EMAIL LINK SENT ── */}
        {step === STEP.EMAIL_SENT && (
          <div className="animate-fade-in email-sent-step">
            <div className="email-sent-icon">📧</div>
            <h2>Check your email</h2>
            <p className="login-sub">
              We've sent a sign-in link to <strong>{email}</strong>
            </p>
            <p className="login-sub" style={{ marginTop: '8px' }}>
              Click the link in the email to sign in. You can close this tab.
            </p>
            <button
              type="button"
              className="btn btn-outline btn-full"
              onClick={() => switchMethod(METHOD.EMAIL)}
              style={{ marginTop: '24px' }}
            >
              ← Try a different email
            </button>
          </div>
        )}

        {/* ── OTP (Phone) ── */}
        {step === STEP.OTP && (
          <form onSubmit={handleVerifyOTP} className="animate-fade-in">
            <button
              type="button"
              className="back-btn"
              onClick={() => { setStep(STEP.PHONE); setOtp(['','','','','','']); setConfirmationResult(null); }}
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

        {/* ── ROLE SELECTION ── */}
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

      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
