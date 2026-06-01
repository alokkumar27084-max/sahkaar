import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FiEdit3, FiCamera, FiMapPin, FiCalendar, FiSave } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import toast from "react-hot-toast";
import { profileAPI } from "../../services/api";

const fadeUp = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } }
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
      const res = await profileAPI.getMe();
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
        setForm(prev => ({
          ...prev,
          display_name: user?.name || "",
        }));
      }
    } catch {
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
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await profileAPI.uploadAvatar(fd);
      }

      await profileAPI.updateMe(form);

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
        <span className="w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const isNewProfile = !profile;
  const isEditing = editing || isNewProfile;
  const currentAvatar = avatarPreview || profile?.avatar_url;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-24 pb-20 transition-colors duration-300">
      <div className="max-w-[700px] mx-auto px-4 md:px-6">

        {/* Header */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-6">
          <p className="text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider mb-1.5">Your Account</p>
          <h1 className="font-display text-2xl font-bold text-[var(--color-heading)] tracking-tight">
            {isNewProfile ? "Create Your Profile" : "Personal Profile"}
          </h1>
          <p className="text-[var(--color-muted)] mt-1.5 text-xs font-semibold leading-relaxed">
            {isNewProfile
              ? "Set up your personal profile to get a tailored experience."
              : "Manage your personal information, address, and profile settings."}
          </p>
        </motion.div>

        <motion.form
          initial="hidden"
          animate="show"
          variants={fadeUp}
          onSubmit={handleSave}
          className="space-y-6"
        >
          {/* Avatar & Name Header */}
          <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar upload */}
              <div 
                className={`relative group ${isEditing ? "cursor-pointer" : ""}`} 
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center shadow-xs">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[var(--color-primary)] text-2xl font-display font-bold">
                      {(form.display_name || user?.name || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <div className="absolute inset-0 rounded-[var(--radius-md)] bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera className="text-white" size={20} />
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

              {/* Name Details */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                {isEditing ? (
                  <input
                    value={form.display_name}
                    onChange={(e) => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                    className="input-field max-w-sm h-11"
                    placeholder="Your Full Name"
                    required
                  />
                ) : (
                  <h2 className="font-display text-xl font-bold text-[var(--color-heading)]">{form.display_name || user?.name}</h2>
                )}
                <p className="text-xs text-[var(--color-muted)] font-semibold">{user?.email || user?.phone}</p>
                <span className="inline-block text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-2 py-0.5 rounded-[var(--radius-pill)] uppercase tracking-wider">
                  {user?.role === "contractor" ? "Contractor" : user?.role === "admin" ? "Administrator" : "Customer"}
                </span>
              </div>

              {/* Edit button */}
              {!isNewProfile && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn-ghost border border-[var(--color-border)] text-xs rounded-[var(--radius-sm)] flex items-center gap-1.5 py-2 px-3 font-semibold shrink-0"
                >
                  <FiEdit3 size={13} /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Biography */}
          <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm space-y-3.5">
            <h3 className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">About Me</h3>
            {isEditing ? (
              <textarea
                value={form.bio}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                className="input-field h-auto py-2.5 resize-none"
                rows={3}
                placeholder="Write a short bio about yourself..."
                maxLength={500}
              />
            ) : (
              <p className="text-sm leading-relaxed text-[var(--color-body)] font-medium">
                {profile?.bio || <span className="italic text-[var(--color-subtle)] font-normal">No details provided yet.</span>}
              </p>
            )}
          </div>

          {/* Location & Address */}
          <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <FiMapPin size={12} className="text-[var(--color-primary)]" /> Location & Address
            </h3>
            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 block uppercase tracking-wider">Street Address</label>
                  <input value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} className="input-field" placeholder="E.g. Flat 104, Sunrise Residency" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 block uppercase tracking-wider">City</label>
                  <input value={form.city} onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))} className="input-field" placeholder="City" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 block uppercase tracking-wider">State</label>
                  <input value={form.state} onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))} className="input-field" placeholder="State" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 block uppercase tracking-wider">PIN Code</label>
                  <input value={form.pincode} onChange={(e) => setForm(prev => ({ ...prev, pincode: e.target.value }))} className="input-field" placeholder="PIN Code" />
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--color-body)] font-medium leading-relaxed">
                {[profile?.address, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(", ") || (
                  <span className="italic text-[var(--color-subtle)] font-normal">No address provided.</span>
                )}
              </div>
            )}
          </div>

          {/* Personal Settings */}
          <div className="card bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <FiCalendar size={12} className="text-[var(--color-primary)]" /> Personal Details
            </h3>
            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 block uppercase tracking-wider">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 block uppercase tracking-wider">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))} className="input-field">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <p className="text-[var(--color-muted)] text-[9px] uppercase tracking-wider">Date of Birth</p>
                  <p className="text-[var(--color-body)] text-sm">{profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--color-muted)] text-[9px] uppercase tracking-wider">Gender</p>
                  <p className="text-[var(--color-body)] text-sm capitalize">{profile?.gender?.replace("_", " ") || "—"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          {isEditing && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary rounded-[var(--radius-sm)] flex items-center gap-2 px-5 py-3 font-semibold text-sm shadow-xs"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSave size={16} /> {isNewProfile ? "Create Profile" : "Save Changes"}
                  </>
                )}
              </button>
              {!isNewProfile && (
                <button 
                  type="button" 
                  onClick={() => { setEditing(false); fetchProfile(); }} 
                  className="btn-ghost text-sm font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] py-2.5 px-4"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </motion.form>
      </div>
    </main>
  );
}

