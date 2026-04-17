import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FiEdit3, FiCamera, FiMapPin, FiCalendar, FiSave } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://thekedaar-api.onrender.com/api";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function MyProfilePage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    date_of_birth: "",
    gender: "",
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.profile) {
        setProfile(res.data.profile);
        setForm({
          display_name: res.data.profile.display_name || user?.name || "",
          bio: res.data.profile.bio || "",
          address: res.data.profile.address || "",
          city: res.data.profile.city || "",
          state: res.data.profile.state || "",
          pincode: res.data.profile.pincode || "",
          date_of_birth: res.data.profile.date_of_birth?.split("T")[0] || "",
          gender: res.data.profile.gender || "",
        });
      } else {
        // No profile yet — prefill from user
        setForm(prev => ({
          ...prev,
          display_name: user?.name || "",
        }));
      }
    } catch {
      // API might not exist yet — show create state
      setForm(prev => ({ ...prev, display_name: user?.name || "" }));
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      // Upload avatar first if present
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await axios.post(`${API_URL}/profiles/me/avatar`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });
      }

      // Save profile data
      await axios.put(`${API_URL}/profiles/me`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(lang === "hi" ? "प्रोफाइल सेव हो गई!" : "Profile saved successfully!");
      setEditing(false);
      setAvatarFile(null);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const isNewProfile = !profile;
  const isEditing = editing || isNewProfile;
  const currentAvatar = avatarPreview || profile?.avatar_url;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-20">
      <div className="max-w-[800px] mx-auto px-4 md:px-8">

        {/* Header */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-8">
          <p className="text-[var(--color-primary)] text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Your Profile</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight">
            {isNewProfile ? "Create Your Profile" : "My Profile"}
          </h1>
          <p className="text-[var(--color-muted)] mt-2 font-medium">
            {isNewProfile
              ? "Set up your personal profile to get a tailored experience."
              : "Manage your personal information and preferences."}
          </p>
        </motion.div>

        <motion.form
          initial="hidden"
          animate="show"
          variants={fadeUp}
          onSubmit={handleSave}
          className="space-y-6"
        >
          {/* Avatar + Name Card */}
          <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-display font-bold">
                      {(form.display_name || user?.name || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera className="text-white" size={24} />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                {isEditing ? (
                  <input
                    value={form.display_name}
                    onChange={(e) => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                    className="input-field !text-lg font-bold mb-2"
                    placeholder="Your Name"
                  />
                ) : (
                  <h2 className="font-display text-2xl font-bold text-[var(--color-heading)]">{form.display_name || user?.name}</h2>
                )}
                <p className="text-sm text-[var(--color-muted)]">{user?.email || user?.phone}</p>
                <p className="text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wider mt-1">
                  {user?.role === "contractor" ? "Contractor" : user?.role === "admin" ? "Administrator" : "Customer"}
                </p>
              </div>

              {!isNewProfile && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn-ghost text-sm flex items-center gap-2 shrink-0"
                >
                  <FiEdit3 size={14} /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest mb-4">About</h3>
            {isEditing ? (
              <textarea
                value={form.bio}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                className="input-field"
                rows={3}
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
            ) : (
              <p className="text-[var(--color-body)] leading-relaxed">
                {profile?.bio || <span className="italic text-[var(--color-muted)]">No bio added yet.</span>}
              </p>
            )}
          </div>

          {/* Address & Location */}
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <FiMapPin size={12} /> Location
            </h3>
            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] mb-1.5 block">Address</label>
                  <input value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} className="input-field" placeholder="Street address" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] mb-1.5 block">City</label>
                  <input value={form.city} onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))} className="input-field" placeholder="City" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] mb-1.5 block">State</label>
                  <input value={form.state} onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))} className="input-field" placeholder="State" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] mb-1.5 block">Pincode</label>
                  <input value={form.pincode} onChange={(e) => setForm(prev => ({ ...prev, pincode: e.target.value }))} className="input-field" placeholder="PIN Code" />
                </div>
              </div>
            ) : (
              <div className="text-[var(--color-body)] text-sm">
                {[profile?.address, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(", ") || (
                  <span className="italic text-[var(--color-muted)]">No address added.</span>
                )}
              </div>
            )}
          </div>

          {/* Personal Info */}
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <FiCalendar size={12} /> Personal
            </h3>
            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] mb-1.5 block">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] mb-1.5 block">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))} className="input-field">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--color-muted)] text-xs font-bold uppercase tracking-wider mb-1">Date of Birth</p>
                  <p className="text-[var(--color-body)]">{profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p>
                </div>
                <div>
                  <p className="text-[var(--color-muted)] text-xs font-bold uppercase tracking-wider mb-1">Gender</p>
                  <p className="text-[var(--color-body)] capitalize">{profile?.gender?.replace("_", " ") || "—"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 pt-2"
            >
              <button type="submit" disabled={saving} className="btn-primary shadow-glow">
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSave size={16} /> {isNewProfile ? "Create Profile" : "Save Changes"}
                  </>
                )}
              </button>
              {!isNewProfile && (
                <button type="button" onClick={() => { setEditing(false); fetchProfile(); }} className="btn-ghost">
                  Cancel
                </button>
              )}
            </motion.div>
          )}
        </motion.form>
      </div>
    </main>
  );
}
