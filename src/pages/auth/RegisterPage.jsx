import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { isValidPhone, isValidEmail, isValidPassword, sanitize } from "../../utils/validators";
import toast from "react-hot-toast";
import { ThekedaarLogo } from "../../components/common/ThekedaarLogo";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const nextParam = new URLSearchParams(window.location.search).get("next");
  const customerNext = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleEmail = params.get("email");
    const googleName = params.get("name");

    if (googleEmail || googleName) {
      setForm(f => ({
        ...f,
        email: googleEmail || f.email,
        name: googleName || f.name,
      }));
    }
  }, []);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = t("err.required") || "Name is required";
    if (!isValidPhone(form.phone)) errs.phone = t("err.invalid_phone") || "Invalid phone number";
    if (form.email && !isValidEmail(form.email)) errs.email = t("err.invalid_email") || "Invalid email";
    if (!isValidPassword(form.password)) errs.password = t("err.weak_password") || "Invalid password";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: sanitize(form.name),
        phone: sanitize(form.phone),
        email: form.email ? sanitize(form.email) : undefined,
        password: form.password,
        role: "customer",
      };
      const res = await authAPI.register(payload);
      login(res.data.user, res.data.token);
      toast.success(lang === "hi" ? "अकाउंट बन गया!" : "Account created!");
      navigate(customerNext);
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setLoading(false);
    }
  }

  // Google Auth Handler
  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin({ credential: credentialResponse.credential });
      login(res.data.user, res.data.token);
      toast.success(lang === "hi" ? "लॉगिन सफल!" : "Account created successfully!");
      navigate(customerNext);
    } catch (err) {
      if (err.response?.data?.code === 'ACCOUNT_NOT_FOUND') {
        const googleData = err.response.data.googleData;
        setForm(f => ({ ...f, email: googleData.email, name: googleData.name }));
        toast.error("Please fill in your phone number to complete registration.");
      } else {
        toast.error(err.response?.data?.message || t("app.error"));
      }
    } finally {
      setLoading(false);
    }
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-[var(--color-bg-elevated)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      
      {/* Decorative highlights */}
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
            Create Account
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Join SahKaar today to book verified cooperative workers
          </p>
        </div>

        {/* Google Signup */}
        <div className="mb-6 flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google Sign In Failed')}
            text="signup_with"
            shape="rectangular"
            width="396px"
          />
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-[var(--color-border)]"></div>
          <span className="flex-shrink-0 mx-4 text-[var(--color-muted)] text-xs uppercase font-bold tracking-wider">or</span>
          <div className="flex-grow border-t border-[var(--color-border)]"></div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-body)] mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={update("name")}
              placeholder="e.g. Alok Mishra"
              className={`w-full h-11 px-4 rounded-xl bg-[var(--color-bg-elevated)] border text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors ${
                errors.name ? "border-red-500" : "border-[var(--color-border)]"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
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
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
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

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-body)] mb-2">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="name@example.com"
              className={`w-full h-11 px-4 rounded-xl bg-[var(--color-bg-elevated)] border text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors ${
                errors.email ? "border-red-500" : "border-[var(--color-border)]"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-body)] mb-2">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="Minimum 6 characters"
              className={`w-full h-11 px-4 rounded-xl bg-[var(--color-bg-elevated)] border text-sm text-[var(--color-heading)] focus:outline-none focus:border-[var(--color-primary)] transition-colors ${
                errors.password ? "border-red-500" : "border-[var(--color-border)]"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-sm transition-all mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Have Account Switcher */}
        <p className="text-center text-sm text-[var(--color-muted)] mt-5">
          Already have an account?{" "}
          <Link
            to={customerNext !== "/" ? `/login?next=${encodeURIComponent(customerNext)}` : "/login"}
            className="text-[var(--color-primary)] font-bold hover:underline"
          >
            Log in
          </Link>
        </p>

        {/* Contractor switch */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border)] text-center">
          <p className="text-xs text-[var(--color-muted)] mb-3">Are you a contractor or home professional?</p>
          <Link
            to="/register/contractor"
            className="w-full h-10 border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] rounded-xl text-xs font-bold flex items-center justify-center text-[var(--color-heading)] transition-colors"
          >
            Register as Business Partner
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
