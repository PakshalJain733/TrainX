import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, User, Camera, Mail, Phone, Building, Briefcase, CheckCircle2, Save, ShieldCheck, Globe, Bell, Key, AlertCircle, QrCode, Copy, Loader2, X, Edit2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/AD_Profile.css";

export default function AdminProfile() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [form, setForm] = useState(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
      return {
        name: stored.name || "",
        email: stored.email || "",
        phone: stored.mobile_number || stored.phone || "",
        role: stored.role || "College Administrator",
        department: stored.department || "",
        college: stored.college_name || stored.college || "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
        location: stored.city || "Mumbai, Maharashtra",
        notifSystemAlerts: true,
        notifWeeklyReport: true,
        notifNewUsers: true,
      };
    } catch (_) {
      return {
        name: "",
        email: "",
        phone: "",
        role: "College Administrator",
        department: "",
        college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
        location: "Mumbai, Maharashtra",
        notifSystemAlerts: true,
        notifWeeklyReport: true,
        notifNewUsers: true,
      };
    }
  });

  const [deptOptions, setDeptOptions] = useState([]);

  useEffect(() => {
    apiFetch("/departments")
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          const opts = list.map((d) => {
            const code = (d.code && d.code.trim()) || d.name;
            const name = (d.name && d.name.trim()) || code;
            return {
              id: d.id,
              value: code,
              label: code,
              code: code,
              name: name,
            };
          });
          setDeptOptions(opts);
        }
      })
      .catch(() => {});
  }, []);

  const loadProfile = async () => {
    try {
      let u = null;
      try {
        const res = await apiFetch("/auth/me");
        if (res && (res.user || res.data)) {
          u = res.user || res.data;
        }
      } catch (_) {}

      if (!u) {
        try {
          const res = await apiFetch("/admin/profile");
          if (res && (res.data || res.user)) {
            u = res.data || res.user;
          }
        } catch (_) {}
      }

      if (u) {
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

    try {
      await apiFetch("/admin/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
        }),
      });

      let localUser = {};
      try { localUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user")) || {}; } catch { }
      const updatedUser = { ...localUser, name: form.name, email: form.email, phone: form.phone, department: form.department };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.setItem("adminProfile", JSON.stringify(updatedUser));
      localStorage.setItem("adminProfile", JSON.stringify(updatedUser));

      window.dispatchEvent(new Event("userProfileUpdated"));

      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return "AD";
    const parts = nameStr.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <div className="ui-section-header-AD">
        <div className="ui-section-main-AD">
          <div>
            <h2 className="ui-section-title">
              <User size={22} className="ui-section-title-icon" />
              <span>My Profile & Settings</span>
            </h2>
            <p className="ui-section-desc">
              Manage your account profile, institution credentials, and system settings.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile changes and notification preferences saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="profile-main-grid">
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

            <div className="profile-badges-wrap" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant="default">
                {(form.college && form.college.match(/\(([^)]+)\)/)?.[1]) || (form.college && form.college.length <= 15 ? form.college : form.college?.split(' ')[0]) || "PVPPCOE"}
              </Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

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
                <Key size={15} />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Profile Form */}
        <div className="profile-form-card">
          <div className="profile-form-section">
            <div className="profile-section-heading profile-section-heading-flex">
              <div className="profile-heading-group">
                <User size={18} className="profile-heading-icon profile-icon-indigo" />
                <div>
                  <h3 className="profile-heading-title">{isEditing ? "Edit Personal & Contact Details" : "Personal & Contact Details"}</h3>
                  <p className="profile-heading-desc">Saved directly to your college admin profile in MySQL database.</p>
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
                      disabled={saving}
                    >
                      <Save size={15} /> {saving ? "Saving..." : "Save Profile"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
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

              <div className="profile-field">
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

              <div className="profile-field">
                <label className="profile-label">Department</label>
                <CustomSelect
                  value={form.department}
                  options={deptOptions}
                  disabled={!isEditing}
                  onChange={(val) => {
                    const matched = deptOptions.find(d => d.value === val || d.code === val || d.name === val);
                    setForm((p) => ({ ...p, department: val, department_id: matched?.id || p.department_id }));
                  }}
                  placeholder="Select Department"
                  icon={Building}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Institution / Organization</label>
                <input
                  type="text"
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.college}
                  onChange={(e) => setForm((p) => ({ ...p, college: e.target.value }))}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Alert Preferences */}
            <div className="sa-profile-alerts-section mt-6">
              <div className="sa-profile-alerts-header">
                <Bell size={16} className="sa-profile-alert-icon" />
                <h4 className="sa-profile-alert-heading">Notification & Alert Preferences</h4>
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
                      onChange={(e) => {
                        const val = e.target.checked;
                        setForm((p) => {
                          const updated = { ...p, notifSystemAlerts: val };
                          const prefs = {
                            notifSystemAlerts: val,
                            notifWeeklyReport: p.notifWeeklyReport,
                            notifNewUsers: p.notifNewUsers,
                          };
                          sessionStorage.setItem("adminNotifPrefs", JSON.stringify(prefs));
                          window.dispatchEvent(new CustomEvent("adminNotifPrefsUpdated", { detail: prefs }));
                          return updated;
                        });
                      }}
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
                      onChange={(e) => {
                        const val = e.target.checked;
                        setForm((p) => {
                          const updated = { ...p, notifWeeklyReport: val };
                          const prefs = {
                            notifSystemAlerts: p.notifSystemAlerts,
                            notifWeeklyReport: val,
                            notifNewUsers: p.notifNewUsers,
                          };
                          sessionStorage.setItem("adminNotifPrefs", JSON.stringify(prefs));
                          window.dispatchEvent(new CustomEvent("adminNotifPrefsUpdated", { detail: prefs }));
                          return updated;
                        });
                      }}
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
                      onChange={(e) => {
                        const val = e.target.checked;
                        setForm((p) => {
                          const updated = { ...p, notifNewUsers: val };
                          const prefs = {
                            notifSystemAlerts: p.notifSystemAlerts,
                            notifWeeklyReport: p.notifWeeklyReport,
                            notifNewUsers: val,
                          };
                          sessionStorage.setItem("adminNotifPrefs", JSON.stringify(prefs));
                          window.dispatchEvent(new CustomEvent("adminNotifPrefsUpdated", { detail: prefs }));
                          return updated;
                        });
                      }}
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
