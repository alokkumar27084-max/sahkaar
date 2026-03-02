import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="px-4 py-8 md:py-14">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="brand-logo text-white text-4xl">
            The<span className="text-cyan-200">kedaar</span>
          </h1>
        </div>

        <div className="glass-card p-6 md:p-7">
          <h2 className="font-['Space_Grotesk'] text-2xl text-slate-100 font-semibold mb-4">{t("auth.register_title")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: "name", label: t("auth.name"), type: "text", ph: t("auth.name_placeholder"), inputMode: "text" },
              { field: "phone", label: t("auth.phone"), type: "tel", ph: t("auth.phone_placeholder"), inputMode: "numeric", max: 10 },
              { field: "email", label: `${t("auth.email")} (optional)`, type: "email", ph: t("auth.email_placeholder"), inputMode: "email" },
              { field: "password", label: t("auth.password"), type: "password", ph: t("auth.password_placeholder") },
            ].map(({ field, label, type, ph, inputMode, max }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-200 mb-1">{label}</label>
                <input
                  type={type}
                  inputMode={inputMode}
                  maxLength={max}
                  value={form[field]}
                  onChange={update(field)}
                  placeholder={ph}
                  className={`input-field ${errors[field] ? "!border-red-300" : ""}`}
                />
                {errors[field] && <p className="text-red-300 text-xs mt-1">{errors[field]}</p>}
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full !text-slate-900">
              {loading ? <LoadingSpinner size="sm" /> : t("auth.register_btn")}
            </button>
          </form>

          <p className="text-center text-sm text-slate-300 mt-4">
            {t("auth.have_account")} <Link to={customerNext !== "/" ? `/login?next=${encodeURIComponent(customerNext)}` : "/login"} className="text-cyan-200 font-semibold hover:underline">{t("nav.login")}</Link>
          </p>

          <div className="mt-4 pt-4 border-t glass-divider text-center">
            <p className="text-xs text-slate-400 mb-3">{lang === "hi" ? "ठेकेदार हैं?" : "Are you a contractor?"}</p>
            <Link to="/register/contractor" className="btn-secondary">
              {t("auth.contractor_register")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
