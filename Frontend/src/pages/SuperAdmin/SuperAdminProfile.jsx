import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Mail,
  Phone,
  Building,
  Briefcase,
  CheckCircle2,
  Save,
  ShieldCheck,
} from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import "../Student/Styles/ProfilePage.css";

export default function SuperAdminProfile() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [form, setForm] = useState({
    name: "Dr. Sara Rao",
    email: "sara.rao@trainingportal.com",
    phone: "+91 98765 43210",
    role: "Super Admin",
    region: "Mumbai, Maharashtra",
    organization: "Training Portal",
  });

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) {
        setForm((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          phone: u.phone || u.mobile_number || prev.phone,
          role: u.role || prev.role,
        }));
      }
    } catch (e) {}
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("user", JSON.stringify(form));
    window.dispatchEvent(new Event("userProfileUpdated"));
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  const getInitials = (name) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Account Overview"
        title="Profile Settings"
        description="Update your personal details, contact information, and role designation."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      <div className="profile-main-grid">
        {/* LEFT COLUMN: Dossier */}
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
          </div>

          <div className="profile-academic-divider" />

          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Account Summary</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Organization</span>
                <p className="profile-detail-value">{form.organization}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Briefcase size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Region</span>
                <p className="profile-detail-value">{form.region}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Mail size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Email</span>
                <p className="profile-detail-value">{form.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Account Details Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <div>
                  <h3 className="profile-heading-title">Personal & Contact Details</h3>
                  <p className="profile-heading-desc">Used for platform communication, access control, and notification digests.</p>
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
                  <label className="profile-label">Phone Number</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
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
              </div>
            </div>

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
