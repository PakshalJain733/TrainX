import React, { useState, useEffect, useRef } from "react";
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
  Globe,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../../Student/Styles/ProfilePage.css"; // Reuse student profile styling

export default function AdminProfile() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [form, setForm] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("admin_user"));
      if (u) return u;
    } catch (e) {}

    return {
      name: "Admin User",
      email: "admin@pvppcoe.ac.in",
      phone: "+91 99999 88888",
      role: "System Administrator",
      department: "IT & Placements Cell",
      college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
      location: "Mumbai, India",
      bio: "Managing the Campus Training Portal operations, student batches, and placement drives.",
      notifSystemAlerts: true,
      notifWeeklyReport: true,
      notifNewUsers: true,
    };
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("admin_user", JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Admin Account"
        title="My Profile & Settings"
        description="Manage your admin details and system notification preferences."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile changes and notification preferences saved successfully!</span>
        </div>
      )}

      <div className="profile-main-grid">
        {/* LEFT COLUMN: Admin Dossier */}
        <div className="profile-dossier-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt={form.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials">AD</div>
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
          </div>

          <div className="profile-academic-divider" />

          {/* Admin Info Table List */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Admin Details</h4>

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
              <Globe size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Location</span>
                <p className="profile-detail-value">{form.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Form & Notification Preferences */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            {/* Section 1: Personal Details */}
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <User size={18} className="profile-heading-icon" />
                <div>
                  <h3 className="profile-heading-title">Account Details</h3>
                  <p className="profile-heading-desc">Update your contact information.</p>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-field">
                  <label className="profile-label">Full Name</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Email Address</label>
                  <input
                    type="email"
                    className="profile-input"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Phone Number</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Role</label>
                  <select
                    className="profile-input profile-select"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  >
                    <option value="System Administrator">System Administrator</option>
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="Head of Department">Head of Department</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="profile-actions-bar">
              <button type="submit" className="profile-save-btn">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
