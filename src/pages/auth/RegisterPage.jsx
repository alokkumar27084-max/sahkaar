import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { isValidPhone, isValidEmail, isValidPassword, sanitize } from "../../utils/validators";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

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
    if (!form.name.trim()) errs.name = t("err.required");
    if (!isValidPhone(form.phone)) errs.phone = t("err.invalid_phone");
    if (form.email && !isValidEmail(form.email)) errs.email = t("err.invalid_email");
    if (!isValidPassword(form.password)) errs.password = t("err.weak_password");
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
      login(res.data.user);
      toast.success(lang === "hi" ? "अकाउंट बन गया!" : "Account created!");
      navigate(customerNext);
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setLoading(false);
    }
  }

  // ── Google Auth Handler ──
  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin({ credential: credentialResponse.credential });
      login(res.data.user);
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
    <div className="px-4 py-8 md:py-14 bg-[var(--color-bg)] min-h-[85vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-6 lg:hidden">
          <h1 className="font-display text-4xl text-[var(--color-heading)] font-extrabold uppercase tracking-[-0.04em]">
            THE<span className="text-[var(--color-primary)]">KEDAAR</span>
          </h1>
        </div>

        <div className="glass-card p-6 md:p-8">
          <h2 className="font-display text-2xl text-[var(--color-heading)] font-extrabold uppercase tracking-tight mb-4">{t("auth.register_title")}</h2>

          <div className="mb-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Sign In Failed')}
              text="signup_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-[var(--color-border)]"></div>
            <span className="flex-shrink-0 mx-4 text-[var(--color-muted)] text-xs uppercase tracking-wider">{lang === "hi" ? "या" : "Or"}</span>
            <div className="flex-grow border-t border-[var(--color-border)]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: "name", label: t("auth.name"), type: "text", ph: t("auth.name_placeholder"), inputMode: "text" },
              { field: "phone", label: t("auth.phone"), type: "tel", ph: t("auth.phone_placeholder"), inputMode: "numeric", max: 10 },
              { field: "email", label: `${t("auth.email")} (optional)`, type: "email", ph: t("auth.email_placeholder"), inputMode: "email" },
              { field: "password", label: t("auth.password"), type: "password", ph: t("auth.password_placeholder") },
            ].map(({ field, label, type, ph, inputMode, max }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-[var(--color-body)] mb-1">{label}</label>
                <input
                  type={type}
                  inputMode={inputMode}
                  maxLength={max}
                  value={form[field]}
                  onChange={update(field)}
                  placeholder={ph}
                  className={`input-field ${errors[field] ? "error" : ""}`}
                />
                {errors[field] && <p className="text-danger text-xs mt-1">{errors[field]}</p>}
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <LoadingSpinner size="sm" /> : t("auth.register_btn")}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-muted)] mt-5">
            {t("auth.have_account")} <Link to={customerNext !== "/" ? `/login?next=${encodeURIComponent(customerNext)}` : "/login"} className="text-[var(--color-primary)] font-semibold hover:underline">{t("nav.login")}</Link>
          </p>

          <div className="mt-5 pt-5 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-muted)] mb-3">{lang === "hi" ? "ठेकेदार हैं?" : "Are you a contractor?"}</p>
            <Link to="/register/contractor" className="btn-secondary w-full justify-center">
              {t("auth.contractor_register")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
