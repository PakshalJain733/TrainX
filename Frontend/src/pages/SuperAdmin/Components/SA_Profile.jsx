import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, User, Camera, Mail, Phone, Building, Briefcase, CheckCircle2, Save, ShieldCheck, Key, AlertCircle, Bell, Globe, QrCode, Copy, Loader2, X, Edit2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/SA_Profile.css";

export default function SuperAdminProfile() {
  const fileInputRef = useRef(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [form, setForm] = useState(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
      return {
        name: stored.name || "Super Admin",
        email: stored.email || "admin@trainingportal.com",
        phone: stored.mobile_number || stored.phone || "+91 12345 67890",
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
        email: "admin@trainingportal.com",
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
      .catch(() => { });
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

      window.dispatchEvent(new Event("userProfileUpdated"));

      setProfileSaved(true);
      setIsEditing(false);
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
      <div className="ui-section-header-SA">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <User size={22} className="ui-section-title-icon" />
              <span>Super Admin Profile & Security</span>
            </h2>
            <p className="ui-section-desc">
              Manage your account profile, contact credentials, and security settings.
            </p>
          </div>
        </div>
      </div>

      {profileSaved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Super Admin profile updated and saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="sa-profile-alert-error">
          <AlertCircle size={16} />
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
              {isEditing && (
                <button
                  type="button"
                  className="profile-camera-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Avatar Image"
                >
                  <Camera size={14} />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="profile-file-input"
                disabled={!isEditing}
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="profile-name">{form.name}</h2>

            <div className="profile-badges-row" style={{ marginTop: '8px' }}>
              <Badge variant="success">Active Governance</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Account Overview</h4>

            <div className="profile-detail-row">
              <ShieldCheck size={16} className="profile-detail-icon profile-icon-indigo" />
              <div>
                <span className="profile-detail-label">Designation & Role</span>
                <p className="profile-detail-value profile-role-highlight">{form.role}</p>
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
                <Key size={15} />
                <span>Change Password</span>
              </button>


            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Profile Details Form */}
        <div className="profile-form-card">
          <div className="profile-form-section">
            <div className="profile-section-heading profile-section-heading-flex">
              <div className="profile-heading-group">
                <User size={18} className="profile-heading-icon profile-icon-indigo" />
                <div>
                  <h3 className="profile-heading-title">{isEditing ? "Edit Personal & Contact Details" : "Personal & Contact Details"}</h3>
                  <p className="profile-heading-desc">Saved directly to your user account record in MySQL database.</p>
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
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="profile-cancel-btn"
                    >
                      <X size={15} /> Cancel
                    </button>
                    <button
                      type="submit"
                      className="profile-save-btn"
                    >
                      <Save size={15} /> Save Profile
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="sa-profile-form-grid mobile-pair-2">
              <div className="profile-field mobile-field-full">
                <label className="profile-label">Full Name *</label>
                <input
                  type="text"
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-field mobile-field-full">
                <label className="profile-label">Email Address *</label>
                <input
                  type="email"
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Phone Number *</label>
                <input
                  type="text"
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label profile-label-flex">
                  Role / Designation <span className="profile-label-hint">(Read-Only)</span>
                </label>
                <input
                  type="text"
                  className="profile-input profile-input-readonly"
                  value={form.role}
                  readOnly
                  disabled
                />
              </div>

              <div className="profile-field mobile-field-full">
                <label className="profile-label">Office Hours / Availability</label>
                <input
                  type="text"
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.officeHours || "Mon - Sat, 09:00 AM - 06:00 PM"}
                  onChange={(e) => setForm((p) => ({ ...p, officeHours: e.target.value }))}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                />
              </div>

              <div className="profile-field mobile-field-full">
                <label className="profile-label">Emergency Administrative Desk</label>
                <input
                  type="text"
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.emergencyDesk || "Room 501, Central Governance Building"}
                  onChange={(e) => setForm((p) => ({ ...p, emergencyDesk: e.target.value }))}
                  readOnly={!isEditing}
                  disabled={!isEditing}
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
                      disabled={!isEditing}
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
                      disabled={!isEditing}
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
                      disabled={!isEditing}
                      onChange={(e) => setForm((p) => ({ ...p, notifNewUsers: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>
              </div>
            </div>
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
