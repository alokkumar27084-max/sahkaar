import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { isValidPhone, isValidEmail, isValidOTP, isValidPassword, sanitize } from "../../utils/validators";
import { OTP_RESEND_SECONDS } from "../../utils/constants";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function LoginPage() {
  const { t, lang } = useLanguage();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const nextParam = new URLSearchParams(window.location.search).get("next");
  const customerNext = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  useEffect(() => {
    if (!user) return;
    navigate(
      user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "contractor"
        ? "/contractor/dashboard"
        : customerNext
    );
  }, [user, navigate, customerNext]);

  const [mode, setMode] = useState("phone");
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState({});

  // Open email mode for admin route, but never prefill credentials
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "1") {
      setMode("email");
      setEmail("");
      setPassword("");
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSendOTP(e) {
    e.preventDefault();
    const cleanPhone = sanitize(phone.replace(/\s/g, ""));

    if (!isValidPhone(cleanPhone)) {
      setErrors({ phone: t("err.invalid_phone") });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await authAPI.sendOTP(cleanPhone);
      toast.success(t("auth.otp_sent"));
      setStep(2);
      setCountdown(OTP_RESEND_SECONDS);
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault();
    const cleanOTP = sanitize(otp.trim());
    const cleanPhone = sanitize(phone.replace(/\s/g, ""));

    if (!isValidOTP(cleanOTP)) {
      setErrors({ otp: t("err.invalid_otp") });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const res = await authAPI.verifyOTP(cleanPhone, cleanOTP);
      login(res.data.user);
      toast.success(lang === "hi" ? "लॉगिन सफल!" : "Logged in!");
      navigate(
        res.data.user.role === "admin"
          ? "/admin/dashboard"
          : res.data.user.role === "contractor"
          ? "/contractor/dashboard"
          : customerNext
      );
    } catch {
      setErrors({ otp: t("err.invalid_otp") });
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin(e) {
    e.preventDefault();
    const cleanEmail = sanitize(email.trim());
    const errs = {};
    if (!isValidEmail(cleanEmail)) errs.email = t("err.invalid_email");
    if (!isValidPassword(password)) errs.password = t("err.weak_password");
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const res = await authAPI.login({ email: cleanEmail, password });
      login(res.data.user);
      toast.success("Logged in!");
      navigate(
        res.data.user.role === "admin"
          ? "/admin/dashboard"
          : res.data.user.role === "contractor"
          ? "/contractor/dashboard"
          : customerNext
      );
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-8 md:py-14">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="brand-logo text-white text-4xl">
            The<span className="text-cyan-200">kedaar</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">{lang === "hi" ? "हर काम का एक ठेकेदार" : "Premium Contractor Network"}</p>
          {new URLSearchParams(window.location.search).get('admin') === '1' && (
            <p className="mt-2 text-xs text-amber-300">
              {lang === 'hi' ? 'एडमिन लॉगिन मोड' : 'Admin login mode'}
            </p>
          )}
        </div>

        <div className="glass-card p-6 md:p-7">
          <h2 className="font-['Space_Grotesk'] text-2xl text-slate-100 font-semibold mb-1">{t("auth.login_title")}</h2>
          <p className="text-slate-300 text-sm mb-5">{t("auth.login_sub")}</p>

          <div className="surface-panel rounded-xl p-1 mb-5 flex">
            {["phone", "email"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setStep(1);
                  setErrors({});
                }}
                className={`flex-1 py-2 text-sm rounded-lg font-semibold transition ${
                  mode === m ? "bg-cyan-200 text-slate-950" : "text-slate-300"
                }`}
              >
                {m === "phone" ? (lang === "hi" ? "मोबाइल OTP" : "Mobile OTP") : lang === "hi" ? "ईमेल" : "Email"}
              </button>
            ))}
          </div>

          {mode === "phone" && (
            <>
              {step === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">{t("auth.phone")}</label>
                    <div className="flex gap-2">
                      <span className="input-field !w-16 !px-0 !text-center">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder={t("auth.phone_placeholder")}
                        className={`input-field ${errors.phone ? "!border-red-300" : ""}`}
                      />
                    </div>
                    {errors.phone && <p className="text-red-300 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full !text-slate-900">
                    {loading ? <LoadingSpinner size="sm" /> : t("auth.send_otp")}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <p className="text-sm text-cyan-100 bg-cyan-300/15 rounded-xl p-3">
                    {t("auth.otp_sent")}: <strong>+91 {phone}</strong>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">{t("auth.otp")}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder={t("auth.otp_placeholder")}
                      className={`input-field text-center text-lg tracking-[0.35em] font-mono ${errors.otp ? "!border-red-300" : ""}`}
                      autoFocus
                    />
                    {errors.otp && <p className="text-red-300 text-xs mt-1">{errors.otp}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full !text-slate-900">
                    {loading ? <LoadingSpinner size="sm" /> : t("auth.verify_otp")}
                  </button>
                  <div className="text-center text-sm">
                    {countdown > 0 ? (
                      <span className="text-slate-300">Resend in {countdown}s</span>
                    ) : (
                      <button type="button" onClick={handleSendOTP} className="text-cyan-200 hover:underline">
                        {t("auth.resend_otp")}
                      </button>
                    )}
                    <button type="button" onClick={() => setStep(1)} className="ml-4 text-slate-400 hover:text-slate-200">
                      Change number
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {mode === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("auth.email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email_placeholder")}
                  className={`input-field ${errors.email ? "!border-red-300" : ""}`}
                />
                {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">{t("auth.password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`input-field ${errors.password ? "!border-red-300" : ""}`}
                />
                {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !text-slate-900">
                {loading ? <LoadingSpinner size="sm" /> : t("auth.login_btn")}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-300 mt-5">
            {t("auth.no_account")} <Link to={customerNext !== "/" ? `/register?next=${encodeURIComponent(customerNext)}` : "/register"} className="text-cyan-200 font-semibold hover:underline">{lang === "hi" ? "रजिस्टर करें" : "Register"}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
