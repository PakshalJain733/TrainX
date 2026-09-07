import React, { useState, useRef } from "react";
import {
  User,
  Camera,
  Mail,
  Phone,
  Building2,
  Save,
  CheckCircle2,
  Sparkles,
  Shield,
  Globe,
  Briefcase,
  MapPin,
  Lock,
  Plus,
  X,
} from "lucide-react";
import "./SuperAdmin.css";
import "./SuperAdminProfile.css";

export default function SuperAdminProfile() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [form, setForm] = useState({
    name: "Dr. Sara Rao",
    email: "sara.rao@acadnexus.com",
    phone: "+91 98765 43210",
    designation: "Super Admin – Platform Owner",
    organization: "AcadNexus Platform",
    region: "Mumbai, Maharashtra",
    bio: "Overseeing cross-institutional academic coordination, placement analytics, and AI-powered training governance for partner colleges.",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [expertise] = useState([
    "Institutional Analytics",
    "Academic Governance",
    "AI-Powered Training",
    "Placement Management",
    "Cross-Campus Coordination",
  ]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="sa-profile-container">
      {/* Page Header */}
      <div className="sa-profile-page-header">
        <div>
          <h2 className="sa-profile-page-title">
            <Shield size={20} className="sa-profile-page-icon" />
            Edit Super Admin Profile
          </h2>
          <p className="sa-profile-page-desc">
            Update your platform identity, personal contact details, and account credentials.
          </p>
        </div>
      </div>

      {/* Success Alert */}
      {saved && (
        <div className="sa-profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="sa-profile-main-grid">
          {/* ── LEFT COLUMN: Identity Card ── */}
          <div className="sa-profile-dossier-card">
            <div className="sa-profile-avatar-section">
              <div className="sa-profile-avatar-wrap">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={form.name} className="sa-profile-avatar-img" />
                ) : (
                  <div className="sa-profile-avatar-initials">SR</div>
                )}
                <button
                  type="button"
                  className="sa-profile-camera-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Photo"
                >
                  <Camera size={14} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="sa-profile-file-input"
                  onChange={handleAvatarChange}
                />
              </div>

              <h2 className="sa-profile-name">{form.name}</h2>
              <div className="sa-profile-role-chip">
                <Shield size={12} />
                <span>Platform Owner</span>
              </div>
            </div>

            <div className="sa-profile-divider" />

            <div className="sa-profile-info-list">
              <h4 className="sa-profile-section-subtitle">Account Overview</h4>

              <div className="sa-profile-detail-row">
                <Mail size={15} className="sa-profile-detail-icon" />
                <div>
                  <span className="sa-profile-detail-label">Email</span>
                  <p className="sa-profile-detail-value">{form.email}</p>
                </div>
              </div>

              <div className="sa-profile-detail-row">
                <Phone size={15} className="sa-profile-detail-icon" />
                <div>
                  <span className="sa-profile-detail-label">Phone</span>
                  <p className="sa-profile-detail-value">{form.phone}</p>
                </div>
              </div>

              <div className="sa-profile-detail-row">
                <Building2 size={15} className="sa-profile-detail-icon" />
                <div>
                  <span className="sa-profile-detail-label">Organization</span>
                  <p className="sa-profile-detail-value">{form.organization}</p>
                </div>
              </div>

              <div className="sa-profile-detail-row">
                <MapPin size={15} className="sa-profile-detail-icon" />
                <div>
                  <span className="sa-profile-detail-label">Region</span>
                  <p className="sa-profile-detail-value">{form.region}</p>
                </div>
              </div>

              {/* Expertise Pills */}
              <div className="sa-profile-expertise-block">
                <span className="sa-profile-expertise-label">Areas of Expertise</span>
                <div className="sa-profile-expertise-pills">
                  {expertise.map((item, i) => (
                    <span key={i} className="sa-profile-expertise-pill">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Edit Form ── */}
          <div className="sa-profile-form-col">
            {/* Section 1: Personal Info */}
            <div className="sa-profile-form-card">
              <div className="sa-profile-form-section-heading">
                <Sparkles size={18} className="sa-profile-heading-icon" />
                <div>
                  <h3 className="sa-profile-heading-title">Personal Information</h3>
                  <p className="sa-profile-heading-desc">Your public-facing profile displayed on the platform.</p>
                </div>
              </div>

              <div className="sa-profile-form-grid">
                <div className="sa-profile-field">
                  <label className="sa-profile-label">Full Name *</label>
                  <input
                    type="text"
                    className="sa-profile-input"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="sa-profile-field">
                  <label className="sa-profile-label">Email Address *</label>
                  <input
                    type="email"
                    className="sa-profile-input"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="sa-profile-field">
                  <label className="sa-profile-label">Phone Number</label>
                  <input
                    type="text"
                    className="sa-profile-input"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="sa-profile-field">
                  <label className="sa-profile-label">Designation</label>
                  <input
                    type="text"
                    className="sa-profile-input"
                    value={form.designation}
                    onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
                  />
                </div>

                <div className="sa-profile-field">
                  <label className="sa-profile-label">Organization / Platform</label>
                  <input
                    type="text"
                    className="sa-profile-input"
                    value={form.organization}
                    onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                  />
                </div>

                <div className="sa-profile-field">
                  <label className="sa-profile-label">Region / Location</label>
                  <input
                    type="text"
                    className="sa-profile-input"
                    value={form.region}
                    onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
                  />
                </div>

                <div className="sa-profile-field sa-profile-field--full">
                  <label className="sa-profile-label">Bio / Description</label>
                  <textarea
                    className="sa-profile-input sa-profile-textarea"
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Change Password */}
            <div className="sa-profile-form-card">
              <div className="sa-profile-form-section-heading">
                <Lock size={18} className="sa-profile-heading-icon" />
                <div>
                  <h3 className="sa-profile-heading-title">Change Password</h3>
                  <p className="sa-profile-heading-desc">Leave blank if you do not wish to change your password.</p>
                </div>
              </div>

              <div className="sa-profile-form-grid">
                <div className="sa-profile-field">
                  <label className="sa-profile-label">Current Password</label>
                  <input
                    type="password"
                    className="sa-profile-input"
                    placeholder="Enter current password"
                    value={form.currentPassword}
                    onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="sa-profile-field">
                  <label className="sa-profile-label">New Password</label>
                  <input
                    type="password"
                    className="sa-profile-input"
                    placeholder="Enter new password"
                    value={form.newPassword}
                    onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  />
                </div>
                <div className="sa-profile-field">
                  <label className="sa-profile-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="sa-profile-input"
                    placeholder="Re-enter new password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="sa-profile-actions-bar">
              <button type="submit" className="sa-btn-primary sa-profile-save-btn">
                <Save size={16} />
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
