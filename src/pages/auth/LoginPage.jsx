import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { isValidPhone, isValidEmail, isValidOTP, isValidPassword, sanitize } from "../../utils/validators";
import { OTP_RESEND_SECONDS } from "../../utils/constants";
import toast from "react-hot-toast";
import { FiPhone, FiMail, FiLock, FiArrowRight, FiShield } from "react-icons/fi";

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
  const [emailOtpValue, setEmailOtpValue] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "1") { setMode("email"); setEmail(""); setPassword(""); }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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

  // ── Phone OTP handlers ──
  async function handleSendOTP(e) {
    e.preventDefault();
    const cleanPhone = sanitize(phone.replace(/\s/g, ""));
    if (!isValidPhone(cleanPhone)) { setErrors({ phone: t("err.invalid_phone") }); return; }
    setLoading(true); setErrors({});
    try {
      const res = await authAPI.sendOTP(cleanPhone);
      toast.success(t("auth.otp_sent"));
      if (res.data.otp_for_testing) toast(`Dev OTP: ${res.data.otp_for_testing}`, { icon: "🧪", duration: 10000 });
      setStep(2); setCountdown(OTP_RESEND_SECONDS);
    } catch (err) { toast.error(err.response?.data?.message || t("app.error")); }
    finally { setLoading(false); }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    const cleanOTP = sanitize(otp.trim());
    const cleanPhone = sanitize(phone.replace(/\s/g, ""));
    if (!isValidOTP(cleanOTP)) { setErrors({ otp: t("err.invalid_otp") }); return; }
    setLoading(true); setErrors({});
    try {
      const res = await authAPI.verifyOTP(cleanPhone, cleanOTP);
      login(res.data.user);
      toast.success(lang === "hi" ? "लॉगिन सफल!" : "Logged in!");
      navigate(res.data.user.role === "admin" ? "/admin/dashboard" : res.data.user.role === "contractor" ? "/contractor/dashboard" : customerNext);
    } catch (err) {
      if (!handleAccountNotFound(err)) setErrors({ otp: t("err.invalid_otp") });
    }
    finally { setLoading(false); }
  }

  // ── Email OTP handlers ──
  async function handleSendEmailOTP(e) {
    e.preventDefault();
    const cleanEmail = sanitize(emailForOtp.trim());
    if (!isValidEmail(cleanEmail)) { setErrors({ emailOtp: t("err.invalid_email") }); return; }
    setLoading(true); setErrors({});
    try {
      const res = await authAPI.sendEmailOTP(cleanEmail);
      toast.success(lang === "hi" ? "OTP ईमेल पर भेजा गया" : "OTP sent to email");
      if (res.data.otp_for_testing) toast(`Dev OTP: ${res.data.otp_for_testing}`, { icon: "🧪", duration: 10000 });
      setStep(2); setCountdown(OTP_RESEND_SECONDS);
    } catch (err) {
      if (!handleAccountNotFound(err)) toast.error(err.response?.data?.message || t("app.error"));
    }
    finally { setLoading(false); }
  }

  async function handleVerifyEmailOTP(e) {
    e.preventDefault();
    const cleanOTP = sanitize(emailOtpValue.trim());
    const cleanEmail = sanitize(emailForOtp.trim());
    if (!isValidOTP(cleanOTP)) { setErrors({ emailOtp: t("err.invalid_otp") }); return; }
    setLoading(true); setErrors({});
    try {
      const res = await authAPI.verifyEmailOTP(cleanEmail, cleanOTP);
      login(res.data.user);
      toast.success(lang === "hi" ? "लॉगिन सफल!" : "Logged in!");
      navigate(res.data.user.role === "admin" ? "/admin/dashboard" : res.data.user.role === "contractor" ? "/contractor/dashboard" : customerNext);
    } catch (err) {
      if (!handleAccountNotFound(err)) setErrors({ emailOtp: t("err.invalid_otp") });
    }
    finally { setLoading(false); }
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
      login(res.data.user);
      toast.success("Logged in!");
      navigate(res.data.user.role === "admin" ? "/admin/dashboard" : res.data.user.role === "contractor" ? "/contractor/dashboard" : customerNext);
    } catch (err) { toast.error(err.response?.data?.message || t("app.error")); }
    finally { setLoading(false); }
  }

  const MODES = [
    { id: "phone", icon: FiPhone, label: lang === "hi" ? "मोबाइल OTP" : "Mobile OTP" },
    { id: "emailOtp", icon: FiMail, label: lang === "hi" ? "ईमेल OTP" : "Email OTP" },
    { id: "email", icon: FiLock, label: lang === "hi" ? "पासवर्ड" : "Password" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-primary-dark items-center justify-center p-12">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[20%] w-[250px] h-[250px] rounded-full bg-primary/20 blur-[80px]"
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-accent/15 blur-[100px]"
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <h1 className="font-display text-5xl text-white font-bold mb-4">
            The<span className="gradient-text">kedaar</span>
          </h1>
          <p className="text-white/50 text-lg max-w-sm mx-auto">
            {lang === "hi" ? "हर काम का एक ठेकेदार" : "India's Premium Contractor Network"}
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-white/30 text-sm">
            <span className="flex items-center gap-2"><FiShield size={14} /> Verified Pros</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>10k+ Projects</span>
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
            <h1 className="font-display text-3xl font-bold text-[var(--color-heading)]">
              The<span className="gradient-text">kedaar</span>
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">{lang === "hi" ? "हर काम का एक ठेकेदार" : "Premium Contractor Network"}</p>
          </div>

          {new URLSearchParams(window.location.search).get("admin") === "1" && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium text-center">
              Admin login mode
            </div>
          )}

          <div className="glass-card p-7 md:p-8">
            <h2 className="font-display text-2xl text-[var(--color-heading)] font-bold mb-1">{t("auth.login_title")}</h2>
            <p className="text-[var(--color-muted)] text-sm mb-6">{t("auth.login_sub")}</p>

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
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{lang === "hi" ? "OTP भेजें" : "Send OTP"} <FiArrowRight size={16} /></>}
                      </button>
                    </form>
                  )}
                  {step === 2 && (
                    <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                      <div className="text-sm text-[var(--color-accent)] bg-[var(--color-accent)]/5 rounded-xl p-3 border border-[var(--color-accent)]/10">
                        {lang === "hi" ? "OTP भेजा गया:" : "OTP sent to:"} <strong>{emailForOtp}</strong>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-body)] mb-1.5">{t("auth.otp")}</label>
                        <input type="text" inputMode="numeric" maxLength={6} value={emailOtpValue}
                          onChange={(e) => setEmailOtpValue(e.target.value.replace(/\D/g, ""))}
                          placeholder={t("auth.otp_placeholder")}
                          className={`input-field text-center text-xl tracking-[0.4em] font-mono ${errors.emailOtp ? "error" : ""}`}
                          autoFocus />
                        {errors.emailOtp && <p className="text-danger text-xs mt-1.5">{errors.emailOtp}</p>}
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("auth.verify_otp")}
                      </button>
                      <div className="text-center text-sm">
                        {countdown > 0 ? (
                          <span className="text-[var(--color-muted)]">Resend in {countdown}s</span>
                        ) : (
                          <button type="button" onClick={handleSendEmailOTP} className="text-[var(--color-primary)] font-semibold hover:underline">{t("auth.resend_otp")}</button>
                        )}
                        <button type="button" onClick={() => setStep(1)} className="ml-4 text-[var(--color-muted)] hover:text-[var(--color-body)] text-sm">{lang === "hi" ? "ईमेल बदलें" : "Change email"}</button>
                      </div>
                    </form>
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
    </div>
  );
}
