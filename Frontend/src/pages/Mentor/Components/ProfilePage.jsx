import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Camera,
  Mail,
  Phone,
  Building,
  Briefcase,
  CheckCircle2,
  Save,
  ShieldCheck,
  ChevronDown,
  Check,
  Key,
  Bell,
  Users
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { mentorProfile } from "../../../data/mentorMockData";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../../Student/Styles/ProfilePage.css";
import "../Styles/ProfilePage.css";

/* ── Inline dropdown for Mentor Profile ── */
function MentorProfSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`mentor-prof-select-wrap${isOpen ? ' mentor-prof-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`mentor-prof-select-trigger${isOpen ? ' mentor-prof-select-trigger--open' : ''}`}>
        {Icon && <Icon className="mentor-prof-select-icon" />}
        <span className="mentor-prof-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`mentor-prof-select-arrow${isOpen ? ' mentor-prof-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="mentor-prof-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`mentor-prof-select-option${isSel ? ' mentor-prof-select-option--selected' : ''}`}>
                <span className="mentor-prof-select-option-label">{opt.label}</span>
                {isSel && <Check className="mentor-prof-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MentorProfilePage() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [form, setForm] = useState({
    name: "Portal System Admin",
    email: "training.portal0987@gmail.com",
    phone: "8422920060",
    role: "College Administrator",
    department: "Computer Engineering",
    college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
    notifSystemAlerts: true,
    notifWeeklyReport: true,
  });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          const u = res.data;
          setForm((prev) => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            phone: u.phone || u.mobile_number || prev.phone,
            role: u.role || prev.role,
            department: u.department || prev.department,
            college: u.college_name || prev.college,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          department: form.department,
        }),
      });
      window.dispatchEvent(new Event("userProfileUpdated"));
    } catch (err) {
      console.warn("Profile save warning:", err);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  const getInitials = (name) => {
    if (!name) return "MT";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Account Overview"
        title="Mentor Profile Settings"
        description="Update your personal details, contact information, and role designation."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Mentor profile changes saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="profile-main-grid">
        {/* LEFT COLUMN: Mentor Dossier */}
        <div className="profile-dossier-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt={form.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials">{getInitials(form.name)}</div>
              )}
              <button
                type="button"
                className="profile-camera-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Change Avatar"
              >
                <Camera size={14} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="profile-file-input"
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="profile-name">{form.name}</h2>
            <div className="profile-roll-chip">
              <ShieldCheck size={14} />
              <strong>{form.role}</strong>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="success">Active Mentor</Badge>
              <Badge variant="default">{form.department}</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Account Overview</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Institution</span>
                <p className="profile-detail-value">{form.college}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Briefcase size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Department</span>
                <p className="profile-detail-value">{form.department}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Mail size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Email</span>
                <p className="profile-detail-value">{form.email}</p>
              </div>
            </div>

            <div className="profile-change-pw-wrap">
              <button
                type="button"
                className="profile-change-pw-btn"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <Key size={16} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Account Details Form */}
        <div className="profile-form-card">
          <div className="profile-form-section">
            <div className="profile-section-heading">
              <User size={18} className="profile-heading-icon text-indigo-500" />
              <div>
                <h3 className="profile-heading-title">Personal & Contact Details</h3>
                <p className="profile-heading-desc">Used for student communication, platform credentials, and notification digests.</p>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label className="profile-label">Full Name *</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Email Address *</label>
                <input
                  type="email"
                  className="profile-input"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Phone Number *</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Role / Designation</label>
                <MentorProfSelect
                  value={form.role}
                  options={[
                    { value: "Senior Trainer", label: "Senior Trainer" },
                    { value: "College Administrator", label: "College Administrator" },
                    { value: "System Administrator", label: "System Administrator" },
                    { value: "Head of Department", label: "Head of Department" },
                  ]}
                  onChange={(val) => setForm((p) => ({ ...p, role: val }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">College Name</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.college}
                  onChange={(e) => setForm((p) => ({ ...p, college: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Office Location / Cabin</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.officeLocation || "Block C, Room 304"}
                  onChange={(e) => setForm((p) => ({ ...p, officeLocation: e.target.value }))}
                  placeholder="e.g. Block C, Room 304"
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Office Hours / Availability</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.officeHours || "Mon - Fri, 10:00 AM - 04:30 PM"}
                  onChange={(e) => setForm((p) => ({ ...p, officeHours: e.target.value }))}
                />
              </div>
            </div>

            {/* Alert Preferences & Change Password */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1.5px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Bell size={16} style={{ color: "#4f46e5" }} />
                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Alert Preferences</h4>
              </div>

              <div className="profile-toggle-list" style={{ gap: "8px", marginBottom: "16px" }}>
                <div className="profile-toggle-item" style={{ padding: "8px 10px" }}>
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>Student Activity Alerts</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifSystemAlerts}
                      onChange={(e) => setForm((p) => ({ ...p, notifSystemAlerts: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>

                <div className="profile-toggle-item" style={{ padding: "8px 10px" }}>
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>Weekly Evaluation Digest</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifWeeklyReport}
                      onChange={(e) => setForm((p) => ({ ...p, notifWeeklyReport: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-actions-bar">
            <button type="submit" className="profile-save-btn">
              <Save size={16} /> Save Profile Changes
            </button>
          </div>
        </div>
      </form>
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
