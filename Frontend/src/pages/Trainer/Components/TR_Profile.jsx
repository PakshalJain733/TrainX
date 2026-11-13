import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Bell,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import { apiFetch } from "../../../utils/api";
import "../Styles/TR_Profile.css";

export function TrainerProfile() {
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Notification Preferences state
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("trainerNotifPrefs");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      taskSubmissions: true,
      batchUpdates: true,
      weeklyDigest: true,
    };
  });

  const handleToggleNotif = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("trainerNotifPrefs", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Exactly the 6 required profile fields + locked role
  const [form, setForm] = useState({
    name: "Trainer",
    email: "trainer@gmail.com",
    phone: "",
    experience: "5+ Years",
    specialization: "Full Stack Development & Data Structures",
    college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
    role: "Faculty Trainer",
  });

  // Load user data
  const loadProfile = async () => {
    try {
      const res = await apiFetch("/auth/me");
      const u = res?.user || res?.data || {};
      if (u) {
        setForm((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          phone: u.mobile_number || u.phone || prev.phone,
          experience: u.experience || prev.experience,
          specialization: u.specialization || u.area_of_expertise || u.target_track || prev.specialization,
          college: u.college_name || u.college || prev.college,
        }));
      }
    } catch (_e) {
      try {
        const stored = sessionStorage.getItem("user") || localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          setForm((prev) => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            phone: u.mobile_number || u.phone || prev.phone,
            experience: u.experience || prev.experience,
            specialization: u.specialization || u.area_of_expertise || u.target_track || prev.specialization,
            college: u.college_name || u.college || prev.college,
          }));
        }
      } catch (_err) {}
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const getInitials = (nameStr) => {
    if (!nameStr) return "TR";
    const parts = nameStr.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSaved(false);

    try {
      const res = await apiFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          mobile_number: form.phone,
          phone: form.phone,
          experience: form.experience,
          specialization: form.specialization,
          skills: form.specialization,
          area_of_expertise: form.specialization,
          target_track: form.specialization,
        }),
      });

      if (res?.success || res?.status === "success") {
        setSaved(true);
        setIsEditing(false);
        // Refresh local cache
        const updatedUser = { ...form };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("trainerNotifPrefs", JSON.stringify(notifPrefs));
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErrorMessage(res?.message || "Failed to update profile.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Error updating profile in database.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="trainer-profile-container profile-container">
      {/* Header Row */}
      <div className="trainer-profile-header-card">
        <div className="trainer-profile-header-left">
          <div className="trainer-profile-header-icon-box">
            <User size={22} />
          </div>
          <div>
            <h1 className="trainer-profile-header-title">Trainer Profile & Credentials</h1>
            <p className="trainer-profile-header-sub">
              Manage your faculty credentials, professional experience, and domain specialization.
            </p>
          </div>
        </div>

        <div>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="profile-edit-trigger-btn"
            >
              <Edit2 size={15} /> Edit Profile
            </button>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  loadProfile();
                }}
                className="profile-cancel-btn"
              >
                <X size={15} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="profile-save-btn"
              >
                <Save size={15} /> {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Feedback Banner */}
      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile updated and saved directly to database!</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#fef2f2",
            border: "1.5px solid #fecaca",
            borderRadius: "12px",
            padding: "12px 18px",
            fontSize: "13.5px",
            color: "#b91c1c",
            fontWeight: "600",
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Responsive Layout Matching Other Dashboards */}
      <div className="profile-main-grid">
        {/* LEFT COLUMN: Dossier Card */}
        <div className="profile-dossier-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt={form.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials-trainer">
                  {getInitials(form.name)}
                </div>
              )}
            </div>

            <h2 className="profile-name">{form.name}</h2>
            <span className="profile-roll-chip">
              <Mail size={12} /> {form.email}
            </span>

            <div className="profile-badges-wrap" style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <Badge variant="success">Authorized Faculty Trainer</Badge>
              <Badge variant="default">{form.experience || "5+ Years Experience"}</Badge>
            </div>

            {/* Quick Metrics Cards */}
            <div className="trainer-stats-mini-row">
              <div className="trainer-stat-mini-card">
                <span className="trainer-stat-mini-num">{form.experience || "5+ Yrs"}</span>
                <span className="trainer-stat-mini-label">Experience</span>
              </div>
              <div className="trainer-stat-mini-card">
                <span className="trainer-stat-mini-num">Trainer</span>
                <span className="trainer-stat-mini-label">Role</span>
              </div>
              <div className="trainer-stat-mini-card">
                <span className="trainer-stat-mini-num" style={{ color: "#16a34a" }}>Active</span>
                <span className="trainer-stat-mini-label">Status</span>
              </div>
            </div>
          </div>

          <div className="profile-academic-divider" />

          {/* Academic & Professional Credentials */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Faculty Credentials</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Working Institution</span>
                <p className="profile-detail-value">{form.college}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Briefcase size={16} className="profile-detail-icon profile-icon-indigo" />
              <div>
                <span className="profile-detail-label">Experience</span>
                <p className="profile-detail-value">{form.experience}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Sparkles size={16} className="profile-detail-icon profile-icon-amber" />
              <div>
                <span className="profile-detail-label">Specialization</span>
                <p className="profile-detail-value">{form.specialization}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <ShieldCheck size={16} className="profile-detail-icon profile-icon-emerald" />
              <div>
                <span className="profile-detail-label">Designation & Role</span>
                <p className="profile-detail-value profile-role-value">Faculty Trainer</p>
              </div>
            </div>

            {/* Change Password Button in Dossier */}
            <div className="profile-actions-wrapper profile-actions-wrapper--single" style={{ marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="profile-change-pass-btn"
              >
                <Key size={15} />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Profile Form Card with Only the 6 Fields */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            <div className="profile-form-section">
              <div className="profile-section-heading" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div className="profile-heading-group">
                  <User size={18} className="profile-heading-icon profile-icon-indigo" />
                  <div>
                    <h3 className="profile-heading-title">
                      {isEditing ? "Edit Trainer Profile" : "Trainer Profile Details"}
                    </h3>
                    <p className="profile-heading-desc">
                      Your verified credentials, experience, and domain specialization.
                    </p>
                  </div>
                </div>

                <div className="profile-heading-actions">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="profile-edit-trigger-btn"
                    >
                      <Edit2 size={15} /> Edit Profile
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          loadProfile();
                        }}
                        className="profile-cancel-btn"
                        disabled={saving}
                      >
                        <X size={15} /> Cancel
                      </button>
                      <button
                        type="submit"
                        className="profile-save-btn"
                        disabled={saving}
                      >
                        <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Grid: Exactly the 6 Fields */}
              <div className="profile-form-grid mobile-pair-2" style={{ marginTop: "16px" }}>
                {/* 1. Full Name */}
                <div className="profile-field mobile-field-full">
                  <label className="profile-label">Full Name *</label>
                  <div className="trainer-input-wrapper">
                    <User size={16} className="trainer-input-icon" />
                    <input
                      type="text"
                      required
                      className={`trainer-input ${isEditing ? "trainer-input-editable" : "trainer-input-readonly"}`}
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* 2. Email Address */}
                <div className="profile-field mobile-field-full">
                  <label className="profile-label">Email Address *</label>
                  <div className="trainer-input-wrapper">
                    <Mail size={16} className="trainer-input-icon" />
                    <input
                      type="email"
                      required
                      className="trainer-input trainer-input-readonly"
                      value={form.email}
                      readOnly
                      disabled
                      title="Email is locked to your account credentials"
                    />
                  </div>
                </div>

                {/* 3. Mobile Number */}
                <div className="profile-field">
                  <label className="profile-label">Mobile Number</label>
                  <div className="trainer-input-wrapper">
                    <Phone size={16} className="trainer-input-icon" />
                    <input
                      type="tel"
                      className={`trainer-input ${isEditing ? "trainer-input-editable" : "trainer-input-readonly"}`}
                      placeholder="e.g. 7463215698"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* 4. Experience */}
                <div className="profile-field">
                  <label className="profile-label">Experience</label>
                  <div className="trainer-input-wrapper">
                    <Briefcase size={16} className="trainer-input-icon" />
                    <input
                      type="text"
                      className={`trainer-input ${isEditing ? "trainer-input-editable" : "trainer-input-readonly"}`}
                      placeholder="e.g. 5+ Years"
                      value={form.experience}
                      onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* 5. Specialization */}
                <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="profile-label">Specialization</label>
                  <div className="trainer-input-wrapper">
                    <Sparkles size={16} className="trainer-input-icon" />
                    <input
                      type="text"
                      className={`trainer-input ${isEditing ? "trainer-input-editable" : "trainer-input-readonly"}`}
                      placeholder="e.g. Full Stack Development & Data Structures"
                      value={form.specialization}
                      onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* 6. Working Institution */}
                <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="profile-label">Working Institution</label>
                  <div className="trainer-input-wrapper">
                    <Building size={16} className="trainer-input-icon" />
                    <input
                      type="text"
                      className="trainer-input trainer-input-readonly"
                      value={form.college}
                      readOnly
                      disabled
                      title="Institutional affiliation"
                    />
                  </div>
                </div>
              </div>

              {/* Notification & Alert Preferences in Remaining Space */}
              <div className="trainer-notif-section">
                <div className="trainer-notif-header">
                  <Bell size={18} className="trainer-notif-icon" />
                  <div>
                    <h4 className="trainer-notif-heading">Notification & Alert Preferences</h4>
                    <p className="trainer-notif-sub">
                      Configure automated notifications for student submissions, cohort updates, and weekly digests.
                    </p>
                  </div>
                </div>

                <div className="trainer-toggle-list">
                  <div className="trainer-toggle-item">
                    <div className="trainer-toggle-text">
                      <span className="trainer-toggle-title">Student Code Submissions Alert</span>
                      <span className="trainer-toggle-desc">
                        Get instant alerts when enrolled students submit solutions for your batch tasks.
                      </span>
                    </div>
                    <label className="profile-switch trainer-profile-switch">
                      <input
                        type="checkbox"
                        checked={notifPrefs.taskSubmissions}
                        onChange={() => handleToggleNotif("taskSubmissions")}
                      />
                      <span className="profile-slider round" />
                    </label>
                  </div>

                  <div className="trainer-toggle-item">
                    <div className="trainer-toggle-text">
                      <span className="trainer-toggle-title">Cohort & Batch Notices</span>
                      <span className="trainer-toggle-desc">
                        Receive notices when new cohorts are assigned or student rosters change.
                      </span>
                    </div>
                    <label className="profile-switch trainer-profile-switch">
                      <input
                        type="checkbox"
                        checked={notifPrefs.batchUpdates}
                        onChange={() => handleToggleNotif("batchUpdates")}
                      />
                      <span className="profile-slider round" />
                    </label>
                  </div>

                  <div className="trainer-toggle-item">
                    <div className="trainer-toggle-text">
                      <span className="trainer-toggle-title">Weekly Performance Digest</span>
                      <span className="trainer-toggle-desc">
                        Receive weekly emails detailing solve rates, top coders, and pending code evaluations.
                      </span>
                    </div>
                    <label className="profile-switch trainer-profile-switch">
                      <input
                        type="checkbox"
                        checked={notifPrefs.weeklyDigest}
                        onChange={() => handleToggleNotif("weeklyDigest")}
                      />
                      <span className="profile-slider round" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

export default TrainerProfile;
