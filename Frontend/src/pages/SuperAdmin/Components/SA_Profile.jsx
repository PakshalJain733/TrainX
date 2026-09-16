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
  Key,
  AlertCircle,
  Bell,
  Globe
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/SA_Profile.css";

export default function SuperAdminProfile() {
  const fileInputRef = useRef(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [form, setForm] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        name: stored.name || "Super Admin",
        email: stored.email || "training.portal0987@gmail.com",
        phone: stored.mobile_number || stored.phone || "+91 98765 43210",
        role: "Super Administrator",
        region: "Mumbai, Maharashtra",
        organization: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
        notifSystemAlerts: true,
        notifWeeklyReport: true,
        notifNewUsers: true,
      };
    } catch (e) {
      return {
        name: "Super Admin",
        email: "training.portal0987@gmail.com",
        phone: "+91 98765 43210",
        role: "Super Administrator",
        region: "Mumbai, Maharashtra",
        organization: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
        notifSystemAlerts: true,
        notifWeeklyReport: true,
        notifNewUsers: true,
      };
    }
  });

  useEffect(() => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && (res.user || res.data)) {
          const u = res.user || res.data;
          setForm((prev) => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            phone: u.mobile_number || u.phone || prev.phone,
            role: u.role ? (u.role.toLowerCase().includes("super") ? "Super Administrator" : u.role.toUpperCase()) : prev.role,
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setProfileSaved(false);

    try {
      await apiFetch("/admin/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          mobile_number: form.phone,
        }),
      });

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        name: form.name,
        email: form.email,
        mobile_number: form.phone,
        phone: form.phone,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("userProfileUpdated"));

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 4000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update profile details in database.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Account Governance"
        title="Super Admin Profile & Security"
        description="Manage your account profile, contact credentials, and security settings."
      />

      {profileSaved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Super Admin profile updated and saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="profile-main-grid">
        {/* LEFT COLUMN: Dossier Card */}
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
                title="Change Avatar Image"
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
              <Badge variant="success">Active Governance</Badge>
              <Badge variant="default">Super Admin</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Account Overview</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Institution</span>
                <p className="profile-detail-value">{form.organization}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <ShieldCheck size={16} className="profile-detail-icon text-indigo-500" />
              <div>
                <span className="profile-detail-label">Designation & Role</span>
                <p className="profile-detail-value font-semibold text-indigo-600 dark:text-indigo-400">{form.role}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Mail size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Database Email</span>
                <p className="profile-detail-value">{form.email}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Phone size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Contact Phone</span>
                <p className="profile-detail-value">{form.phone}</p>
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

        {/* RIGHT COLUMN: Profile Details Form */}
        <div className="profile-form-card">
          <div className="profile-form-section">
            <div className="profile-section-heading">
              <User size={18} className="profile-heading-icon text-indigo-500" />
              <div>
                <h3 className="profile-heading-title">Personal & Contact Details</h3>
                <p className="profile-heading-desc">Saved directly to your user account record in MySQL database.</p>
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
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Role / Designation</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.role}
                  disabled
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Institution / Organization</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.organization}
                  onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Office Hours / Availability</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.officeHours || "Mon - Sat, 09:00 AM - 06:00 PM"}
                  onChange={(e) => setForm((p) => ({ ...p, officeHours: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Emergency Administrative Desk</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.emergencyDesk || "Room 501, Central Governance Building"}
                  onChange={(e) => setForm((p) => ({ ...p, emergencyDesk: e.target.value }))}
                />
              </div>
            </div>

            {/* Alert Preferences */}
            <div className="sa-profile-alerts-section">
              <div className="sa-profile-alerts-header">
                <Bell size={16} className="sa-profile-alert-icon" />
                <h4 className="sa-profile-alert-heading">Alert Preferences</h4>
              </div>

              <div className="profile-toggle-list profile-toggle-list-sm">
                <div className="profile-toggle-item profile-toggle-item-sm">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title profile-toggle-title-sm">System Security Alerts</span>
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

                <div className="profile-toggle-item profile-toggle-item-sm">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title profile-toggle-title-sm">Weekly Audit Digest</span>
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

                <div className="profile-toggle-item profile-toggle-item-sm">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title profile-toggle-title-sm">New User Enrollment</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifNewUsers}
                      onChange={(e) => setForm((p) => ({ ...p, notifNewUsers: e.target.checked }))}
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
