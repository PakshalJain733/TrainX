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
  Bell,
  Sparkles,
  FileText,
  AlertCircle
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../../Student/Styles/ProfilePage.css"; // Reuse student profile styling

export default function AdminProfile() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [form, setForm] = useState({
    name: "System Administrator",
    email: "admin@pvppcoe.ac.in",
    phone: "+91 98765 43210",
    role: "System Administrator",
    department: "Computer Engineering",
    college: "Vasantdada Patil Pratishthan College of Engineering (PVPPCOE)",
    location: "Mumbai, Maharashtra",
    bio: "Administrator managing campus training portal, student cohorts, placement drives, and curriculum progress.",
    notifSystemAlerts: true,
    notifWeeklyReport: true,
    notifNewUsers: true,
    notifBroadcasts: true,
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Sync with backend DB
      const res = await apiFetch("/admin/profile");
      if (res && res.data) {
        const u = res.data;
        setForm((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          phone: u.mobile_number || u.phone || prev.phone,
          role: u.role ? (u.role.includes("super") ? "Super Administrator" : "College Administrator") : prev.role,
          department: u.department || prev.department,
          college: u.college_name || u.college || prev.college,
        }));
      }
    } catch (err) {
      console.warn("Error loading admin profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
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
    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile_number: form.phone.trim(),
        role: form.role,
        department: form.department,
        college: form.college,
        location: form.location,
        bio: form.bio,
      };

      // Save to backend database
      await apiFetch("/admin/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Admin Account"
        title="My Profile & Settings"
        description="Manage your administrator dossier, contact information, and system notification preferences."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile changes and notification preferences saved successfully to database!</span>
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

          {/* Admin Info Table List */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Admin Details</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Institution</span>
                <p className="profile-detail-value">{form.college || "PVPPCOE"}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Briefcase size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Department</span>
                <p className="profile-detail-value">{form.department || "Computer Engineering"}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Mail size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Email</span>
                <p className="profile-detail-value">{form.email}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Phone size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Phone</span>
                <p className="profile-detail-value">{form.phone}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Globe size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Location</span>
                <p className="profile-detail-value">{form.location || "Mumbai, India"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Form & Notification Preferences */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            {/* Section 1: Personal Contact Details */}
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <div>
                  <h3 className="profile-heading-title">Account Details</h3>
                  <p className="profile-heading-desc">Update your administrator account details.</p>
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
              </div>
            </div>

            {/* Section 2: Institutional Settings */}
            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <div>
                  <h3 className="profile-heading-title">Institutional Overview</h3>
                  <p className="profile-heading-desc">College affiliation and department authority settings.</p>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-field full-width">
                  <label className="profile-label">College Name</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.college}
                    onChange={(e) => setForm((p) => ({ ...p, college: e.target.value }))}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Department</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Designation / Role</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.role}
                    readOnly
                  />
                </div>
              </div>

              <div className="profile-field" style={{ marginTop: "14px" }}>
                <label className="profile-label">Bio / Description</label>
                <textarea
                  rows={3}
                  className="profile-input"
                  style={{ height: "auto", padding: "10px" }}
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Brief summary of responsibilities..."
                />
              </div>
            </div>

            {/* Section 3: Notification Toggles */}
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <Bell size={18} className="profile-heading-icon" />
                <div>
                  <h3 className="profile-heading-title">System Preferences</h3>
                  <p className="profile-heading-desc">Configure automated alerts and reports.</p>
                </div>
              </div>

              <div className="profile-toggles-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.notifSystemAlerts}
                    onChange={(e) => setForm((p) => ({ ...p, notifSystemAlerts: e.target.checked }))}
                  />
                  <span>Receive Critical System & Security Alerts</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.notifWeeklyReport}
                    onChange={(e) => setForm((p) => ({ ...p, notifWeeklyReport: e.target.checked }))}
                  />
                  <span>Receive Automated Weekly Performance Summary Reports</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.notifNewUsers}
                    onChange={(e) => setForm((p) => ({ ...p, notifNewUsers: e.target.checked }))}
                  />
                  <span>New User Registration & Enrollment Notifications</span>
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="profile-actions-bar">
              <button type="submit" className="profile-save-btn" disabled={saving}>
                <Save size={16} /> {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
