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
  Key,
  AlertCircle
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../../Student/Styles/ProfilePage.css";

export default function AdminProfile() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [form, setForm] = useState({
    name: "System Administrator",
    email: "admin@pvppcoe.ac.in",
    phone: "+91 98765 43210",
    role: "College Administrator",
    department: "Computer Engineering",
    college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
    location: "Mumbai, Maharashtra",
    notifSystemAlerts: true,
    notifWeeklyReport: true,
    notifNewUsers: true,
  });

  const loadProfile = async () => {
    try {
      const res = await apiFetch("/admin/profile");
      if (res && res.data) {
        const u = res.data;
        setForm((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          phone: u.mobile_number || u.phone || prev.phone,
          role: u.role ? (u.role.toLowerCase().includes("super") ? "Super Administrator" : "College Administrator") : prev.role,
          department: u.department || prev.department,
          college: u.college_name || u.college || prev.college,
        }));
      }
    } catch (err) {
      console.warn("Error loading admin profile:", err);
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
      };

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
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
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
          <span>Profile changes and notification preferences saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="profile-main-grid">
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

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="success">Active Admin</Badge>
              <Badge variant="default">{form.department}</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          {/* Admin Info Details */}
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
              <Globe size={16} className="profile-detail-icon text-amber-500" />
              <div>
                <span className="profile-detail-label">Location</span>
                <p className="profile-detail-value">{form.location}</p>
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

        {/* RIGHT COLUMN: Edit Profile Form */}
        <div className="profile-form-card">
          <div className="profile-form-section">
            <div className="profile-section-heading">
              <User size={18} className="profile-heading-icon text-indigo-500" />
              <div>
                <h3 className="profile-heading-title">Account & Personal Details</h3>
                <p className="profile-heading-desc">Update your administrator contact & college settings.</p>
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
                <label className="profile-label">Designation / Role</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.role}
                  disabled
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
                <label className="profile-label">Office Location / Room</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Admin Block, Room 102"
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Office Hours / Availability</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.officeHours || "Mon - Fri, 09:00 AM - 05:00 PM"}
                  onChange={(e) => setForm((p) => ({ ...p, officeHours: e.target.value }))}
                />
              </div>
            </div>

            {/* Alert Preferences */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1.5px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Bell size={16} style={{ color: "#4f46e5" }} />
                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Alert Preferences</h4>
              </div>

              <div className="profile-toggle-list" style={{ gap: "8px" }}>
                <div className="profile-toggle-item" style={{ padding: "8px 10px" }}>
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>System Security Alerts</span>
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
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>Weekly Performance Summary</span>
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

                <div className="profile-toggle-item" style={{ padding: "8px 10px" }}>
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>User Registration Alerts</span>
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
            <button type="submit" className="profile-save-btn" disabled={saving}>
              <Save size={16} /> {saving ? "Saving Changes..." : "Save Profile Changes"}
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
