import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { contractorAPI } from "../../services/api";
import { sanitizeForm, isValidImageFile } from "../../utils/validators";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Icon from "../../components/common/Icon";
import toast from "react-hot-toast";
import { getImageUrl, getAvatarUrl, getSafeImageUrl } from "../../utils/imageUtils";
import { useGeolocation } from "../../hooks/useGeolocation";

export default function ContractorEditPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [geo, setGeo] = useState({ lat: null, lng: null, accuracy: null });
  const { lat, lng, accuracy, request: getLocation, loading: geoLoading, error: geoError } = useGeolocation();
  const [form, setForm] = useState({
    category: "",
    description: "",
    daily_rate: "",
    experience_years: "",
    team_size: "",
    location_text: "",
    services: "",
    is_labour_group: false,
    is_responsibility_model: false,
    labour_crew: [],
  });

  useEffect(() => {
    contractorAPI
      .getMyProfile()
      .then((res) => {
        const p = res.data.contractor;
        setProfile(p);
        setPortfolio(p?.portfolio_photos || p?.portfolio_urls || []);
        setGeo({
          lat: p?.lat ?? p?.latitude ?? null,
          lng: p?.lng ?? p?.longitude ?? null,
          accuracy: null,
        });
        setForm({
          category: p.category || p.categories?.[0] || "",
          description: p.description || "",
          daily_rate: p.daily_rate || "",
          experience_years: p.experience_years || "",
          team_size: p.team_size || "",
          location_text: p.location_text || "",
          services: (p.services || []).join(", "),
          is_labour_group: !!p.is_labour_group,
          is_responsibility_model: !!p.is_responsibility_model,
          labour_crew: p.labour_crew || [],
        });
      })
      .catch((err) => {
        // If 404, we stay on the page to allow the user to CREATE the profile
        if (err.response?.status === 404) {
          setProfile(null);
        } else {
          toast.error(t("app.error"));
          navigate("/contractor/dashboard");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, t]);

  useEffect(() => {
    if (lat === null || lng === null) return;
    setGeo({ lat, lng, accuracy: accuracy ?? null });
  }, [lat, lng, accuracy]);

  function update(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: val }));
    };
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = sanitizeForm({
        category: form.category,
        description: form.description,
        daily_rate: form.daily_rate ? Number(form.daily_rate) : null,
        experience_years: form.experience_years ? Number(form.experience_years) : 0,
        team_size: form.team_size ? Number(form.team_size) : 1,
        location_text: form.location_text,
        latitude: geo.lat !== null ? Number(geo.lat) : null,
        longitude: geo.lng !== null ? Number(geo.lng) : null,
        services: form.services.split(",").map((x) => x.trim()).filter(Boolean),
        is_labour_group: form.is_labour_group,
        is_responsibility_model: form.is_responsibility_model,
        labour_crew: form.labour_crew,
      });

      let res;
      if (profile) {
        // Mode: Update existing
        res = await contractorAPI.updateMe(payload);
        toast.success(lang === "hi" ? "Profile saved" : "Profile updated");
      } else {
        // Mode: Create for first time (fixes "half-registered" user state)
        res = await contractorAPI.create(payload);
        toast.success(lang === "hi" ? "Profile created" : "Profile created successfully!");
      }
      
      setProfile(res.data.contractor || profile);
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadSingle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = isValidImageFile(file);
    if (!check.ok) return toast.error(t("err.invalid_file_type"));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await contractorAPI.uploadMyPhoto(fd);
      setProfile(res.data.contractor || profile);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setUploading(false);
    }
  }

  async function uploadPortfolio(e) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (!files.length) return;
    const invalid = files.find((f) => !isValidImageFile(f).ok);
    if (invalid) return toast.error(t("err.invalid_file_type"));
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("photos", f));
      const res = await contractorAPI.uploadMyWork(fd);
      const updated = res.data.contractor || profile;
      setProfile(updated);
      setPortfolio(updated?.portfolio_photos || updated?.portfolio_urls || []);
      toast.success("Portfolio updated");
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setUploading(false);
    }
  }

  function movePortfolioItem(index, direction) {
    setPortfolio((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  }

  function removePortfolioItem(index) {
    setPortfolio((prev) => prev.filter((_, i) => i !== index));
  }

  function onDragStart(index) {
    setDragIndex(index);
  }

  function onDropAt(index) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    setPortfolio((prev) => {
      const next = [...prev];
      const [item] = next.splice(dragIndex, 1);
      next.splice(index, 0, item);
      return next;
    });
    setDragIndex(null);
  }

  async function savePortfolioOrder() {
    setSaving(true);
    try {
      await contractorAPI.setMyPortfolio(portfolio);
      toast.success("Portfolio saved");
    } catch (err) {
      toast.error(err.response?.data?.message || t("app.error"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 text-[var(--color-heading)]">
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-card p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-heading)]">Edit Profile</h1>
            <p className="text-xs text-[var(--color-muted)] font-semibold mt-1">Keep your professional identity and catalog up to date.</p>
          </div>
          <button onClick={() => navigate("/contractor/dashboard")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-heading)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-elevated)] transition-all">
            {t("app.back")}
          </button>
        </div>

        {/* Media Uploads */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <label className="flex flex-col items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg-elevated)] rounded-xl p-5 text-center cursor-pointer hover:border-[var(--color-primary)] transition-all">
            <img
              src={getAvatarUrl(profile?.photo_url || profile?.image_url)}
              alt="profile"
              className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-[var(--color-border)] shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getAvatarUrl("");
              }}
            />
            <p className="text-xs font-bold text-[var(--color-heading)] mt-3">Change Profile Photo</p>
            <p className="text-[10px] text-[var(--color-muted)] font-semibold mt-0.5">JPG, PNG under 5MB</p>
            <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={uploadSingle} />
          </label>

          <label className="flex flex-col items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg-elevated)] rounded-xl p-5 text-center cursor-pointer hover:border-[var(--color-primary)] transition-all">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-2 shadow-sm">
              <Icon name="camera" className="w-5 h-5" />
            </span>
            <p className="text-xs font-bold text-[var(--color-heading)]">Add Portfolio Photos</p>
            <p className="text-[10px] text-[var(--color-muted)] font-semibold mt-0.5">Showcase your recent projects (max 5)</p>
            <input type="file" className="hidden" accept="image/jpeg,image/png" multiple onChange={uploadPortfolio} />
          </label>
        </div>

        {/* Portfolio Gallery */}
        <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-elevated)] p-5 mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-heading)]">Current Portfolio</h2>
              <p className="text-[10px] text-[var(--color-muted)] font-semibold mt-0.5">Drag photos to reorder before saving.</p>
            </div>
            <button type="button" onClick={savePortfolioOrder} disabled={saving} className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[var(--color-primary)]/90 shadow-sm">
              Save Order
            </button>
          </div>

          {portfolio.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)] font-semibold">No portfolio photos yet. Upload some above!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {portfolio.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="rounded-lg border border-[var(--color-border)] p-2 bg-[var(--color-surface)] shadow-sm relative group"
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropAt(idx)}
                >
                  <img
                    src={getSafeImageUrl(url)}
                    alt={`portfolio-${idx + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getSafeImageUrl("");
                    }}
                  />
                  <div className="flex justify-between items-center gap-1 mt-2">
                    <div className="flex gap-0.5">
                      <button type="button" onClick={() => movePortfolioItem(idx, -1)} className="p-1 text-[10px] bg-[var(--color-bg-elevated)] rounded border border-[var(--color-border)] text-[var(--color-heading)] hover:bg-[var(--color-surface)]">
                        &larr;
                      </button>
                      <button type="button" onClick={() => movePortfolioItem(idx, 1)} className="p-1 text-[10px] bg-[var(--color-bg-elevated)] rounded border border-[var(--color-border)] text-[var(--color-heading)] hover:bg-[var(--color-surface)]">
                        &rarr;
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePortfolioItem(idx)}
                      className="p-1 text-[10px] bg-rose-500/10 text-rose-600 rounded border border-rose-500/20 hover:bg-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Business Category</label>
            <input className="input-field" value={form.category} onChange={update("category")} placeholder="e.g. Electrician, Painter, Contractor" />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Professional Bio / Description</label>
            <textarea className="input-field resize-none" rows={4} value={form.description} onChange={update("description")} placeholder="Describe your experience, skill level, and core specialization..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Daily Wage / Base Rate (₹)</label>
              <input className="input-field" type="number" min="0" value={form.daily_rate} onChange={update("daily_rate")} placeholder="e.g. 500" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Experience (Years)</label>
              <input className="input-field" type="number" min="0" value={form.experience_years} onChange={update("experience_years")} placeholder="e.g. 5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Team size</label>
              <input className="input-field" type="number" min="1" value={form.team_size} onChange={update("team_size")} placeholder="e.g. 3" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Operating Base address</label>
              <input className="input-field" value={form.location_text} onChange={update("location_text")} placeholder="Locality, City, NCR" />
            </div>
          </div>

          {/* GPS Coordinates Locker */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">GPS Geolocation</span>
              {geo.lat !== null && geo.lng !== null ? (
                <p className="text-xs text-[var(--color-heading)] font-bold mt-0.5">
                  Locked: {Number(geo.lat).toFixed(6)}, {Number(geo.lng).toFixed(6)}
                  {geo.accuracy ? ` (accuracy +/-${Math.round(geo.accuracy)}m)` : ""}
                </p>
              ) : (
                <p className="text-xs text-[var(--color-muted)] font-semibold mt-0.5">GPS coordinates are not verified. Lock them for higher discovery rankings.</p>
              )}
              {geoError && <p className="text-[10px] text-amber-600 font-bold mt-1">{geoError}</p>}
            </div>
            <button
              type="button"
              onClick={() => getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })}
              disabled={geoLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-primary)]/5 disabled:opacity-60 transition-all shadow-sm"
            >
              {geoLoading ? "Capturing..." : "Update Current GPS"}
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Services List (comma separated)</label>
            <input className="input-field" value={form.services} onChange={update("services")} placeholder="e.g. Wet Service, Gas Refill, Shuttering, Plastering" />
          </div>

          {/* Configuration Flags */}
          <div className="flex flex-wrap gap-6 text-sm text-[var(--color-heading)] pt-2 font-semibold">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.is_labour_group} onChange={update("is_labour_group")} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" />
              <span>Labour Group Leader</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_responsibility_model}
                onChange={update("is_responsibility_model")}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
              />
              <span>Responsibility Model</span>
            </label>
          </div>

          {/* Labour Chowk Crew Composer */}
          {form.is_labour_group && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 space-y-4">
              <div>
                <span className="block text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">Labour Chowk Crew Details</span>
                <p className="text-[10px] text-[var(--color-muted)] font-semibold mt-0.5">Specify individual worker counts and category wage structures under your group leadership.</p>
              </div>

              <div className="space-y-3">
                {form.labour_crew.map((crew, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-[var(--color-surface)] p-2 rounded-lg border border-[var(--color-border)]">
                    <input
                      type="text"
                      required
                      placeholder="Role (e.g. Helper, Mason)"
                      className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-heading)] text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                      value={crew.role}
                      onChange={(e) => {
                        const next = [...form.labour_crew];
                        next[idx].role = e.target.value;
                        setForm(prev => ({ ...prev, labour_crew: next }));
                      }}
                    />
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Qty"
                      className="w-16 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-heading)] text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                      value={crew.count}
                      onChange={(e) => {
                        const next = [...form.labour_crew];
                        next[idx].count = Math.max(1, parseInt(e.target.value) || 0);
                        setForm(prev => ({ ...prev, labour_crew: next }));
                      }}
                    />
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Rate ₹"
                      className="w-24 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[var(--color-heading)] text-xs font-semibold outline-none focus:border-[var(--color-primary)]"
                      value={crew.rate}
                      onChange={(e) => {
                        const next = [...form.labour_crew];
                        next[idx].rate = Math.max(0, parseInt(e.target.value) || 0);
                        setForm(prev => ({ ...prev, labour_crew: next }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = form.labour_crew.filter((_, i) => i !== idx);
                        setForm(prev => ({ ...prev, labour_crew: next }));
                      }}
                      className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-colors text-lg"
                    >
                      &times;
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      labour_crew: [...prev.labour_crew, { role: "", count: 1, rate: 400 }]
                    }));
                  }}
                  className="py-2 px-3 rounded-lg border border-dashed border-[var(--color-primary)]/40 text-[var(--color-primary)] font-bold text-[10px] uppercase tracking-wider hover:bg-[var(--color-primary)]/5 transition-all"
                >
                  + Add Crew Worker
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving || uploading || geoLoading} className="w-full bg-[var(--color-primary)] text-white py-3 px-4 rounded-lg font-bold hover:bg-[var(--color-primary)]/90 disabled:opacity-60 transition-all shadow-sm">
            {saving || uploading || geoLoading ? <LoadingSpinner size="sm" /> : t("app.save")}
          </button>
        </form>
      </section>
    </div>
  );
}
