import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { contractorAPI } from "../../services/api";
import { sanitizeForm, isValidImageFile } from "../../utils/validators";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Icon from "../../components/common/Icon";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/imageUtils";
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
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-6">
      <section className="glass-card p-5 md:p-7">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-['Space_Grotesk'] text-2xl text-slate-100 font-semibold">Edit Profile</h1>
          <button onClick={() => navigate("/contractor/dashboard")} className="btn-secondary !py-2 !px-4">
            {t("app.back")}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <label className="card text-center cursor-pointer">
            <img
              src={getImageUrl(profile?.photo_url || profile?.image_url)}
              alt="profile"
              className="w-24 h-24 rounded-xl object-cover mx-auto border border-white/20"
            />
            <p className="text-xs text-slate-300 mt-3">Change profile photo</p>
            <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={uploadSingle} />
          </label>
          <label className="card text-center cursor-pointer">
            <span className="inline-flex justify-center text-cyan-100">
              <Icon name="camera" className="w-8 h-8" />
            </span>
            <p className="text-xs text-slate-300 mt-3">Add portfolio photos (max 5)</p>
            <input type="file" className="hidden" accept="image/jpeg,image/png" multiple onChange={uploadPortfolio} />
          </label>
        </div>

        <div className="card mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Current Portfolio</h2>
            <button type="button" onClick={savePortfolioOrder} disabled={saving} className="btn-secondary !py-1.5 !px-3 text-xs">
              Save Order
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Drag photos to reorder before saving.</p>
          {portfolio.length === 0 ? (
            <p className="text-xs text-slate-300">No portfolio photos yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {portfolio.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="rounded-xl border border-white/15 p-1.5 bg-slate-950/30"
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropAt(idx)}
                >
                  <img src={getImageUrl(url)} alt={`portfolio-${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <div className="flex gap-1 mt-1.5">
                    <button type="button" onClick={() => movePortfolioItem(idx, -1)} className="btn-secondary !py-1 !px-2 text-xs">
                      Up
                    </button>
                    <button type="button" onClick={() => movePortfolioItem(idx, 1)} className="btn-secondary !py-1 !px-2 text-xs">
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removePortfolioItem(idx)}
                      className="btn-secondary !py-1 !px-2 text-xs text-rose-200 border-rose-300/40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={saveProfile} className="space-y-3">
          <input className="input-field" value={form.category} onChange={update("category")} placeholder="Category" />
          <textarea className="input-field resize-none" rows={4} value={form.description} onChange={update("description")} placeholder="Description" />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" type="number" min="0" value={form.daily_rate} onChange={update("daily_rate")} placeholder="Daily rate" />
            <input className="input-field" type="number" min="0" value={form.experience_years} onChange={update("experience_years")} placeholder="Experience (years)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" type="number" min="1" value={form.team_size} onChange={update("team_size")} placeholder="Team size" />
            <input className="input-field" value={form.location_text} onChange={update("location_text")} placeholder="Location text" />
          </div>
          <div className="rounded-xl border border-cyan-200/30 bg-cyan-200/10 p-3">
            <button
              type="button"
              onClick={() => getLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })}
              disabled={geoLoading}
              className="btn-secondary !py-2 !px-3 text-xs"
            >
              {geoLoading ? "Capturing..." : "Use my precise GPS location"}
            </button>
            {geo.lat !== null && geo.lng !== null && (
              <p className="text-xs text-cyan-100 mt-2">
                GPS: {Number(geo.lat).toFixed(6)}, {Number(geo.lng).toFixed(6)}
                {geo.accuracy ? ` (+/-${Math.round(geo.accuracy)}m)` : ""}
              </p>
            )}
            {geoError && <p className="text-xs text-amber-200 mt-2">{geoError}</p>}
          </div>
          <input className="input-field" value={form.services} onChange={update("services")} placeholder="Services (comma separated)" />
          <div className="flex flex-wrap gap-4 text-sm text-slate-200 pt-1">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.is_labour_group} onChange={update("is_labour_group")} className="accent-cyan-200" />
              Labour Group
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_responsibility_model}
                onChange={update("is_responsibility_model")}
                className="accent-cyan-200"
              />
              Responsibility Model
            </label>
          </div>

          {form.is_labour_group && (
            <div className="rounded-xl border border-white/10 bg-slate-950/20 p-4 space-y-4">
              <div>
                <span className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">Labour Chowk Crew Details</span>
                <p className="text-[10px] text-slate-400 mt-1">Specify worker counts and category pricing under your team/group leadership.</p>
              </div>

              <div className="space-y-3">
                {form.labour_crew.map((crew, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-900/30 p-2.5 rounded-xl border border-white/5">
                    <input
                      type="text"
                      required
                      placeholder="Role (e.g. Helper, Mason)"
                      className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
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
                      className="w-16 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
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
                      className="w-20 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
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
                  className="py-2 px-4 rounded-lg border border-dashed border-indigo-500/30 text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500/5 transition-all"
                >
                  + Add Crew Worker
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving || uploading || geoLoading} className="btn-primary w-full !text-slate-900 mt-2">
            {saving || uploading || geoLoading ? <LoadingSpinner size="sm" /> : t("app.save")}
          </button>
        </form>
      </section>
    </div>
  );
}
