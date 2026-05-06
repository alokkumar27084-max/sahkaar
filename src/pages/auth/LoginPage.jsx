import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { isValidPhone, isValidEmail, isValidPassword, sanitize } from "../../utils/validators";
import { OTP_RESEND_SECONDS } from "../../utils/constants";
import toast from "react-hot-toast";
import { FiPhone, FiMail, FiLock, FiArrowRight, FiShield } from "react-icons/fi";
import {
  auth as firebaseAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from '../../config/firebase';

export default function LoginPage() {
  const { t, lang } = useLanguage();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const nextParam = new URLSearchParams(window.location.search).get("next");
  const customerNext = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  useEffect(() => {
    if (!user) return;
    navigate(
      user.role === "admin" ? "/admin/dashboard"
        : user.role === "contractor" ? "/contractor/dashboard"
          : customerNext
    );
  }, [user, navigate, customerNext]);

  // modes: "phone" = phone OTP, "emailOtp" = email OTP, "email" = email+password
  const [mode, setMode] = useState("phone");
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState({});

  // Firebase phone auth state
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "1") { setMode("email"); setEmail(""); setPassword(""); }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Check if returning from email sign-in link
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      let savedEmail = window.localStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        savedEmail = window.prompt('Please provide your email for confirmation');
      }
      if (savedEmail) {
        handleEmailLinkReturn(savedEmail);
      }
    }
  }, []);

  // Initialize invisible reCAPTCHA for Firebase Phone Auth
  const setupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) return;
    recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => { recaptchaVerifierRef.current = null; },
    });
  }, []);

  // Handle ACCOUNT_NOT_FOUND error — redirect to register
  function handleAccountNotFound(err) {
    const code = err.response?.data?.code;
    if (code === "ACCOUNT_NOT_FOUND") {
      toast.error(lang === "hi" ? "कोई खाता नहीं मिला। पहले रजिस्टर करें।" : "No account found. Please register first.");
      navigate(customerNext !== "/" ? `/register?next=${encodeURIComponent(customerNext)}` : "/register");
      return true;
    }
    return false;
  }

  // ── Phone OTP handlers (Firebase) ──
  async function handleSendOTP(e) {
    e.preventDefault();
    const cleanPhone = sanitize(phone.replace(/\s/g, ""));
    if (!isValidPhone(cleanPhone)) { setErrors({ phone: t("err.invalid_phone") }); return; }
    setLoading(true); setErrors({});
    try {
      setupRecaptcha();
      const phoneNumber = `+91${cleanPhone}`;
      const result = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      toast.success(t("auth.otp_sent"));
      setStep(2); setCountdown(OTP_RESEND_SECONDS);
    } catch (err) {
      console.error('Firebase phone auth error:', err);
      recaptchaVerifierRef.current = null;
      if (err.code === 'auth/too-many-requests') {
        toast.error(lang === "hi" ? "बहुत अधिक प्रयास। बाद में पुनः प्रयास करें।" : "Too many attempts. Please try again later.");
      } else if (err.code === 'auth/invalid-phone-number') {
        toast.error(lang === "hi" ? "अमान्य फ़ोन नंबर" : "Invalid phone number");
      } else {
        toast.error(err.message || t("app.error"));
      }
    }
    finally { setLoading(false); }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    const cleanOTP = sanitize(otp.trim());
    if (cleanOTP.length !== 6 || !/^\d{6}$/.test(cleanOTP)) { setErrors({ otp: t("err.invalid_otp") }); return; }
    if (!confirmationResult) {
      toast.error(lang === "hi" ? "सत्र समाप्त। कृपया पुनः OTP भेजें।" : "Session expired. Please resend OTP.");
      setStep(1);
      return;
    }
    setLoading(true); setErrors({});
    try {
      // Verify OTP with Firebase
      const credential = await confirmationResult.confirm(cleanOTP);
      const idToken = await credential.user.getIdToken();

      // Send Firebase ID token to our backend
      const res = await authAPI.verifyPhoneToken(idToken);
      if (res.data.isNewUser) {
        toast.error(lang === "hi" ? "कोई खाता नहीं मिला। पहले रजिस्टर करें।" : "No account found. Please register first.");
        navigate(customerNext !== "/" ? `/register?next=${encodeURIComponent(customerNext)}` : "/register");
      } else {
        login(res.data.user, res.data.token);
        toast.success(lang === "hi" ? "लॉगिन सफल!" : "Logged in!");
        navigate(res.data.user.role === "admin" ? "/admin/dashboard" : res.data.user.role === "contractor" ? "/contractor/dashboard" : customerNext);
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setErrors({ otp: t("err.invalid_otp") });
      } else if (!handleAccountNotFound(err)) {
        setErrors({ otp: t("err.invalid_otp") });
      }
    }
    finally { setLoading(false); }
  }

  // ── Email OTP handlers (Firebase Email Link) ──
  async function handleSendEmailOTP(e) {
    e.preventDefault();
    const cleanEmail = sanitize(emailForOtp.trim());
    if (!isValidEmail(cleanEmail)) { setErrors({ emailOtp: t("err.invalid_email") }); return; }
    setLoading(true); setErrors({});
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(firebaseAuth, cleanEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', cleanEmail);
      toast.success(lang === "hi" ? "साइन-इन लिंक ईमेल पर भेजा गया" : "Sign-in link sent to email");
      setStep(2); setCountdown(OTP_RESEND_SECONDS);
    } catch (err) {
      console.error('Firebase email link error:', err);
      if (err.code === 'auth/invalid-email') {
        setErrors({ emailOtp: t("err.invalid_email") });
      } else {
        toast.error(err.message || t("app.error"));
      }
    }
    finally { setLoading(false); }
  }

  // Handle return from email sign-in link
  async function handleEmailLinkReturn(emailForSignIn) {
    setLoading(true);
    try {
      const result = await signInWithEmailLink(firebaseAuth, emailForSignIn, window.location.href);
      const idToken = await result.user.getIdToken();
      const res = await authAPI.verifyEmailToken(idToken);
      window.localStorage.removeItem('emailForSignIn');
      if (res.data.isNewUser) {
        toast.error(lang === "hi" ? "कोई खाता नहीं मिला। पहले रजिस्टर करें।" : "No account found. Please register first.");
        navigate(customerNext !== "/" ? `/register?next=${encodeURIComponent(customerNext)}` : "/register");
      } else {
        login(res.data.user, res.data.token);
        toast.success(lang === "hi" ? "लॉगिन सफल!" : "Logged in!");
        navigate(res.data.user.role === "admin" ? "/admin/dashboard" : res.data.user.role === "contractor" ? "/contractor/dashboard" : customerNext);
      }
    } catch (err) {
      console.error('Email link sign-in error:', err);
      toast.error(err?.response?.data?.message || err.message || 'Sign-in failed.');
    } finally { setLoading(false); }
  }



  // ── Email Password handler ──
  async function handleEmailLogin(e) {
    e.preventDefault();
    const cleanEmail = sanitize(email.trim());
    const errs = {};
    if (!isValidEmail(cleanEmail)) errs.email = t("err.invalid_email");
    if (!isValidPassword(password)) errs.password = t("err.weak_password");
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      const res = await authAPI.login({ email: cleanEmail, password });
      login(res.data.user, res.data.token);
      toast.success("Logged in!");
      navigate(res.data.user.role === "admin" ? "/admin/dashboard" : res.data.user.role === "contractor" ? "/contractor/dashboard" : customerNext);
    } catch (err) { toast.error(err.response?.data?.message || t("app.error")); }
    finally { setLoading(false); }
  }

  // ── Google Auth Handler ──
  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin({ credential: credentialResponse.credential });
      login(res.data.user, res.data.token);
      toast.success(lang === "hi" ? "लॉगिन सफल!" : "Logged in!");
      navigate(res.data.user.role === "admin" ? "/admin/dashboard" : res.data.user.role === "contractor" ? "/contractor/dashboard" : customerNext);
    } catch (err) {
      if (err.response?.data?.code === 'ACCOUNT_NOT_FOUND') {
        const googleData = err.response.data.googleData;
        const searchParams = new URLSearchParams({ email: googleData.email, name: googleData.name });
        if (customerNext !== "/") searchParams.append("next", customerNext);
        navigate(`/register?${searchParams.toString()}`);
        toast.error(err.response.data.message);
      } else {
        toast.error(err.response?.data?.message || t("app.error"));
      }
    } finally {
      setLoading(false);
    }
  }

  const MODES = [
    { id: "phone", icon: FiPhone, label: lang === "hi" ? "मोबाइल OTP" : "Mobile OTP" },
    { id: "emailOtp", icon: FiMail, label: lang === "hi" ? "ईमेल OTP" : "Email OTP" },
    { id: "email", icon: FiLock, label: lang === "hi" ? "पासवर्ड" : "Password" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#030712] items-center justify-center p-12">
        <div className="absolute top-[15%] left-[15%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-indigo-600/25 to-purple-600/10 blur-[80px] animate-[float_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-cyan-500/15 to-blue-500/8 blur-[100px] animate-[float_22s_ease-in-out_infinite_reverse]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px"
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <h1 className="font-display text-5xl text-white font-extrabold tracking-[-0.04em] uppercase mb-4">
            THE<span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">KEDAAR</span>
          </h1>
          <p className="text-white/40 text-base max-w-sm mx-auto">
            {lang === "hi" ? "हर काम का एक ठेकेदार" : "India's Premium Contractor Network"}
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-white/25 text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2"><FiShield size={13} /> Verified</span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span>10k+ Projects</span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span>Trusted</span>
          </div>
        </motion.div>
      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-14 bg-[var(--color-bg)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-display text-3xl font-extrabold text-[var(--color-heading)] uppercase tracking-[-0.03em]">
              THE<span className="gradient-text">KEDAAR</span>
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-1 uppercase tracking-wider">{lang === "hi" ? "हर काम का एक ठेकेदार" : "Premium Contractor Network"}</p>
          </div>

          {new URLSearchParams(window.location.search).get("admin") === "1" && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium text-center">
              Admin login mode
            </div>
          )}

          <div className="glass-card p-7 md:p-8">
            <h2 className="font-display text-2xl text-[var(--color-heading)] font-extrabold uppercase tracking-tight mb-1">{t("auth.login_title")}</h2>
            <p className="text-[var(--color-muted)] text-sm mb-6">{t("auth.login_sub")}</p>

            {/* Google Login */}
            <div className="mb-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign In Failed')}
                text="continue_with"
                shape="rectangular"
                width="100%"
              />
            </div>

            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-[var(--color-border)]"></div>
              <span className="flex-shrink-0 mx-4 text-[var(--color-muted)] text-xs uppercase tracking-wider">{lang === "hi" ? "या" : "Or login with"}</span>
              <div className="flex-grow border-t border-[var(--color-border)]"></div>
            </div>

            {/* Mode switcher — 3 tabs */}
            <div className="flex bg-[var(--color-border)] rounded-xl p-1 mb-6">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setStep(1); setErrors({}); }}
                  className={`flex-1 py-2.5 text-xs sm:text-sm rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${mode === m.id
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-[var(--color-muted)] hover:text-[var(--color-body)]"
                    }`}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* ── Phone OTP ── */}
              {mode === "phone" && (
                <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                  {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.phone")}</label>
                        <div className="flex gap-2">
                          <span className="input-field !w-16 !px-0 text-center text-[var(--color-muted)] font-medium flex items-center justify-center">+91</span>
                          <input type="tel" inputMode="numeric" maxLength={10} value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder={t("auth.phone_placeholder")}
                            className={`input-field ${errors.phone ? "error" : ""}`} />
                        </div>
                        {errors.phone && <p className="text-danger text-xs mt-1.5">{errors.phone}</p>}
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t("auth.send_otp")} <FiArrowRight size={16} /></>}
                      </button>
                    </form>
                  )}
                  {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                      <div className="text-sm text-[var(--color-accent)] bg-[var(--color-accent)]/5 rounded-xl p-3 border border-[var(--color-accent)]/10">
                        {t("auth.otp_sent")}: <strong>+91 {phone}</strong>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.otp")}</label>
                        <input type="text" inputMode="numeric" maxLength={6} value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder={t("auth.otp_placeholder")}
                          className={`input-field text-center text-xl tracking-[0.4em] font-mono ${errors.otp ? "error" : ""}`}
                          autoFocus />
                        {errors.otp && <p className="text-danger text-xs mt-1.5">{errors.otp}</p>}
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("auth.verify_otp")}
                      </button>
                      <div className="text-center text-sm">
                        {countdown > 0 ? (
                          <span className="text-[var(--color-muted)]">Resend in {countdown}s</span>
                        ) : (
                          <button type="button" onClick={handleSendOTP} className="text-[var(--color-primary)] font-semibold hover:underline">{t("auth.resend_otp")}</button>
                        )}
                        <button type="button" onClick={() => setStep(1)} className="ml-4 text-[var(--color-muted)] hover:text-[var(--color-body)] text-sm">Change number</button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* ── Email OTP ── */}
              {mode === "emailOtp" && (
                <motion.div key="emailOtp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                  {step === 1 && (
                    <form onSubmit={handleSendEmailOTP} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.email")}</label>
                        <div className="relative">
                          <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                          <input type="email" value={emailForOtp} onChange={(e) => setEmailForOtp(e.target.value)}
                            placeholder={lang === "hi" ? "आपका ईमेल एड्रेस" : "Enter your email"}
                            className={`input-field !pl-10 ${errors.emailOtp ? "error" : ""}`} />
                        </div>
                        {errors.emailOtp && <p className="text-danger text-xs mt-1.5">{errors.emailOtp}</p>}
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{lang === "hi" ? "साइन-इन लिंक भेजें" : "Send Sign-in Link"} <FiArrowRight size={16} /></>}
                      </button>
                    </form>
                  )}
                  {step === 2 && (
                    <div className="space-y-4 text-center">
                      <div className="text-4xl mb-2">📧</div>
                      <div className="text-sm text-[var(--color-accent)] bg-[var(--color-accent)]/5 rounded-xl p-3 border border-[var(--color-accent)]/10">
                        {lang === "hi" ? "साइन-इन लिंक भेजा गया:" : "Sign-in link sent to:"} <strong>{emailForOtp}</strong>
                      </div>
                      <p className="text-[var(--color-muted)] text-sm">
                        {lang === "hi" ? "अपने ईमेल में लिंक पर क्लिक करके साइन इन करें" : "Click the link in your email to sign in"}
                      </p>
                      <div className="text-center text-sm pt-2">
                        {countdown > 0 ? (
                          <span className="text-[var(--color-muted)]">Resend in {countdown}s</span>
                        ) : (
                          <button type="button" onClick={handleSendEmailOTP} className="text-[var(--color-primary)] font-semibold hover:underline">{lang === "hi" ? "लिंक दोबारा भेजें" : "Resend link"}</button>
                        )}
                        <button type="button" onClick={() => setStep(1)} className="ml-4 text-[var(--color-muted)] hover:text-[var(--color-body)] text-sm">{lang === "hi" ? "ईमेल बदलें" : "Change email"}</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Email + Password ── */}
              {mode === "email" && (
                <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.email")}</label>
                      <div className="relative">
                        <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("auth.email_placeholder")}
                          className={`input-field !pl-10 ${errors.email ? "error" : ""}`} />
                      </div>
                      {errors.email && <p className="text-danger text-xs mt-1.5">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.password")}</label>
                      <div className="relative">
                        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className={`input-field !pl-10 ${errors.password ? "error" : ""}`} />
                      </div>
                      {errors.password && <p className="text-danger text-xs mt-1.5">{errors.password}</p>}
                      <div className="text-right mt-2">
                        <Link to="/forgot-password" className="text-xs text-[var(--color-primary)] hover:underline">{lang === "hi" ? "पासवर्ड भूल गए?" : "Forgot password?"}</Link>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t("auth.login_btn")} <FiArrowRight size={16} /></>}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center text-sm text-[var(--color-muted)] mt-6">
              {t("auth.no_account")}{" "}
              <Link to={customerNext !== "/" ? `/register?next=${encodeURIComponent(customerNext)}` : "/register"}
                className="text-[var(--color-primary)] font-semibold hover:underline">
                {lang === "hi" ? "रजिस्टर करें" : "Register"}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
    </div>
  );
}

