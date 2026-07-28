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
import { FiMail, FiLock, FiArrowRight, FiChevronLeft } from "react-icons/fi";
import { ThekedaarLogo } from "../../components/common/ThekedaarLogo";
import {
  auth as firebaseAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  isFirebaseConfigured,
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
    else if (!isFirebaseConfigured) { setMode("email"); }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Check if returning from email sign-in link
  useEffect(() => {
    async function completeEmailSignIn(emailForSignIn) {
      setLoading(true);
      try {
        const result = await signInWithEmailLink(firebaseAuth, emailForSignIn, window.location.href);
        const idToken = await result.user.getIdToken();
        const res = await authAPI.verifyEmailToken(idToken);
        window.localStorage.removeItem('emailForSignIn');
        if (res.data.isNewUser) {
          toast.error('No account found. Please register first.');
          navigate('/register');
        } else {
          login(res.data.user, res.data.token);
          toast.success('Logged in!');
          navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : res.data.user.role === 'contractor' ? '/contractor/dashboard' : '/');
        }
      } catch (err) {
        console.error('Email link sign-in error:', err);
        toast.error(err?.response?.data?.message || err.message || 'Sign-in failed.');
      } finally { setLoading(false); }
    }

    if (firebaseAuth && isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      let savedEmail = window.localStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        savedEmail = window.prompt('Please provide your email for confirmation');
      }
      if (savedEmail) {
        completeEmailSignIn(savedEmail);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize invisible reCAPTCHA for Firebase Phone Auth
  const setupRecaptcha = useCallback(() => {
    if (!firebaseAuth) throw new Error("Firebase phone auth is not configured. Use email/password login or check Firebase env keys.");
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

  // Phone OTP handlers (Firebase)
  async function handleSendOTP(e) {
    e.preventDefault();
    const cleanPhone = sanitize(phone.replace(/\s/g, ""));
    if (!isValidPhone(cleanPhone)) { setErrors({ phone: t("err.invalid_phone") || "Invalid phone number" }); return; }
    setLoading(true); setErrors({});
    try {
      if (!isFirebaseConfigured || !firebaseAuth) {
        toast.error("Phone OTP is not configured. Please use email/password login.");
        setMode("email");
        return;
      }
      setupRecaptcha();
      const phoneNumber = `+91${cleanPhone}`;
      const result = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      toast.success(t("auth.otp_sent") || "OTP Sent!");
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
    if (cleanOTP.length !== 6 || !/^\d{6}$/.test(cleanOTP)) { setErrors({ otp: t("err.invalid_otp") || "Invalid OTP" }); return; }
    if (!confirmationResult) {
      toast.error(lang === "hi" ? "सत्र समाप्त। कृपया पुनः OTP भेजें।" : "Session expired. Please resend OTP.");
      setStep(1);
      return;
    }
    setLoading(true); setErrors({});
    try {
      const credential = await confirmationResult.confirm(cleanOTP);
      const idToken = await credential.user.getIdToken();
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
        setErrors({ otp: t("err.invalid_otp") || "Invalid OTP" });
      } else if (!handleAccountNotFound(err)) {
        setErrors({ otp: t("err.invalid_otp") || "Invalid OTP" });
      }
    }
    finally { setLoading(false); }
  }

  // Email OTP handlers (Firebase Email Link)
  async function handleSendEmailOTP(e) {
    e.preventDefault();
    const cleanEmail = sanitize(emailForOtp.trim());
    if (!isValidEmail(cleanEmail)) { setErrors({ emailOtp: t("err.invalid_email") || "Invalid email" }); return; }
    setLoading(true); setErrors({});
    try {
      if (!isFirebaseConfigured || !firebaseAuth) {
        toast.error("Email sign-in links are not configured. Please use email/password login.");
        setMode("email");
        return;
      }
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
        setErrors({ emailOtp: t("err.invalid_email") || "Invalid email" });
      } else {
        toast.error(err.message || t("app.error"));
      }
    }
    finally { setLoading(false); }
  }

  // Email Password handler
  async function handleEmailLogin(e) {
    e.preventDefault();
    const cleanEmail = sanitize(email.trim());
    const errs = {};
    if (!isValidEmail(cleanEmail)) errs.email = t("err.invalid_email") || "Invalid email";
    if (!isValidPassword(password)) errs.password = t("err.weak_password") || "Invalid password";
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

  // Google Auth Handler
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

  return (
    <div className="min-h-screen bg-[var(--color-bg-elevated)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      
      {/* Decorative clean background highlights (subtle) */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-8 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <ThekedaarLogo className="h-9 w-9" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-heading)] tracking-tight">
            {step === 1 ? "Welcome to Thekedaar" : "Verify code"}
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {step === 1 
              ? "Your trusted marketplace for local contractors"
              : `We sent a 6-digit OTP code to +91 ${phone}`}
          </p>
        </div>

        {/* Admin indicator */}
        {new URLSearchParams(window.location.search).get("admin") === "1" && step === 1 && (
          <div className="mb-6 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold text-center">
            Admin login mode
          </div>
        )}

        {/* OAuth and Divider (Only shown in Step 1) */}
        {step === 1 && (
          <>
            <div className="mb-6 flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign In Failed')}
                text="continue_with"
                shape="rectangular"
                width="396px"
              />
            </div>

            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-[var(--color-border)]"></div>
              <span className="flex-shrink-0 mx-4 text-[var(--color-muted)] text-xs uppercase font-bold tracking-wider">or</span>
              <div className="flex-grow border-t border-[var(--color-border)]"></div>
            </div>
          </>
        )}

        <AnimatePresence mode="wait">
          {/* PHONE LOGIN */}
          {mode === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {step === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-body)] mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <span className="h-11 px-3.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm font-semibold flex items-center justify-center text-[var(--color-muted)]">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter 10 digit number"
                        className={`w-full h-11 px-4 rounded-xl bg-[var(--color-bg-elevated)] border text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors ${
                          errors.phone ? "border-red-500" : "border-[var(--color-border)]"
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.phone}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <FiArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-body)] mb-2 text-center">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="• • • • • •"
                      className={`w-full h-12 text-center text-2xl tracking-[0.25em] font-bold rounded-xl bg-[var(--color-bg-elevated)] border focus:outline-none focus:border-[var(--color-primary)] transition-colors ${
                        errors.otp ? "border-red-500" : "border-[var(--color-border)]"
                      }`}
                      autoFocus
                    />
                    {errors.otp && (
                      <p className="text-red-500 text-xs mt-2 text-center font-medium">{errors.otp}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-sm transition-all"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Verify & Log In"
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs px-1">
                    {countdown > 0 ? (
                      <span className="text-[var(--color-muted)] font-medium">Resend code in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        className="text-[var(--color-primary)] font-bold hover:underline"
                      >
                        Resend OTP code
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[var(--color-muted)] hover:text-[var(--color-heading)] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FiChevronLeft size={14} />
                      <span>Change phone</span>
                    </button>
                  </div>
                </form>
              )}

              {step === 1 && (
                <div className="mt-6 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => { setMode("email"); setErrors({}); }}
                    className="text-[var(--color-primary)] font-bold hover:underline"
                  >
                    Login with email/password instead
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* EMAIL PASSWORD LOGIN */}
          {mode === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-body)] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--color-bg-elevated)] border text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors ${
                        errors.email ? "border-red-500" : "border-[var(--color-border)]"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-body)]">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[var(--color-primary)] font-bold hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--color-bg-elevated)] border text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors ${
                        errors.password ? "border-red-500" : "border-[var(--color-border)]"
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <FiArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-2.5 text-center text-xs">
                <button
                  type="button"
                  onClick={() => { setMode("phone"); setStep(1); setErrors({}); }}
                  className="text-[var(--color-primary)] font-bold hover:underline"
                >
                  Login with phone OTP code instead
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("emailOtp"); setStep(1); setErrors({}); }}
                  className="text-[var(--color-muted)] font-semibold hover:text-[var(--color-heading)] hover:underline"
                >
                  Or get an email sign-in link
                </button>
              </div>
            </motion.div>
          )}

          {/* EMAIL OTP SIGN IN LINK */}
          {mode === "emailOtp" && (
            <motion.div
              key="emailOtp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {step === 1 ? (
                <form onSubmit={handleSendEmailOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-body)] mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
                      <input
                        type="email"
                        value={emailForOtp}
                        onChange={(e) => setEmailForOtp(e.target.value)}
                        placeholder="name@example.com"
                        className={`w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--color-bg-elevated)] border text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors ${
                          errors.emailOtp ? "border-red-500" : "border-[var(--color-border)]"
                        }`}
                      />
                    </div>
                    {errors.emailOtp && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.emailOtp}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Link</span>
                        <FiArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="text-4xl">📧</div>
                  <div className="text-sm p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 rounded-xl text-[var(--color-heading)] font-semibold leading-relaxed">
                    Check your email: <br /><span className="text-[var(--color-primary)] font-bold">{emailForOtp}</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    We sent a secure sign-in link. Click the button inside the email to immediately access your account.
                  </p>
                  
                  <div className="flex flex-col gap-2.5 pt-4 text-xs font-semibold text-[var(--color-muted)]">
                    {countdown > 0 ? (
                      <span>Resend link in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmailOTP}
                        className="text-[var(--color-primary)] font-bold hover:underline"
                      >
                        Resend sign-in email link
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="hover:text-[var(--color-heading)] transition-colors"
                    >
                      Change email address
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="mt-6 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => { setMode("phone"); setStep(1); setErrors({}); }}
                    className="text-[var(--color-primary)] font-bold hover:underline"
                  >
                    Go back to phone login
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info link */}
        <p className="text-center text-sm text-[var(--color-muted)] mt-8 pt-4 border-t border-[var(--color-border)]">
          New to Thekedaar?{" "}
          <Link
            to={customerNext !== "/" ? `/register?next=${encodeURIComponent(customerNext)}` : "/register"}
            className="text-[var(--color-primary)] font-bold hover:underline"
          >
            Register here
          </Link>
        </p>
      </motion.div>

      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
