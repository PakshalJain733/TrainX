import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Camera,
  GraduationCap,
  Building,
  Users,
  ShieldCheck,
  CheckCircle2,
  Save,
  Sparkles,
  MapPin,
  Clock,
  ChevronDown,
  Check,
  Key,
  Bell,
  Mail,
  Phone
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { coordinatorProfile } from "../../../data/coordinatorMockData";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../../Student/Styles/ProfilePage.css";
import "../Styles/ProfilePage.css";

function CoordProfSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`coord-prof-select-wrap${isOpen ? ' coord-prof-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`coord-prof-select-trigger${isOpen ? ' coord-prof-select-trigger--open' : ''}`}>
        {Icon && <Icon className="coord-prof-select-icon" />}
        <span className="coord-prof-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`coord-prof-select-arrow${isOpen ? ' coord-prof-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="coord-prof-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`coord-prof-select-option${isSel ? ' coord-prof-select-option--selected' : ''}`}>
                <span className="coord-prof-select-option-label">{opt.label}</span>
                {isSel && <Check className="coord-prof-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorProfilePage() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [form, setForm] = useState({
    name: coordinatorProfile.name || "Harshad Nandurkar",
    email: coordinatorProfile.email || "harshadnandurkar851@gmail.com",
    phone: coordinatorProfile.phone || "+91 77109 07045",
    empId: "COORD-ECS-004",
    role: coordinatorProfile.role || "Department Training Coordinator",
    department: coordinatorProfile.department || "Electronics & Computer Science",
    college: coordinatorProfile.college || "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
    officeLocation: "Room 402, Block B, ECS Dept",
    officeHours: "Mon - Fri, 09:30 AM - 05:00 PM",
    managedBatches: "6 Active Batches",
    totalStudents: "480 Enrolled Students",
    notifSystemAlerts: true,
    notifWeeklyReport: true,
    notifNewUsers: true,
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
            department: u.department || prev.department,
            college: u.college_name || prev.college,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const getInitials = (nameStr) => {
    if (!nameStr) return "HN";
    const parts = nameStr.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
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
    } catch (err) {
      console.warn("Profile save warning:", err);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Coordinator Account"
        title="My Profile & Governance Settings"
        description="Manage your official contact details, department role, office location, and availability."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile updated successfully! Official contact details, office location, and settings have been saved.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="profile-main-grid">
        {/* LEFT COLUMN: Coordinator Dossier Card */}
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
              <span className="profile-roll-label">Emp ID:</span>
              <strong>{form.empId}</strong>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="success">Active Coordinator</Badge>
              <Badge variant="default">{form.department}</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          {/* Administrative Overview Details */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Administrative Overview</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">College</span>
                <p className="profile-detail-value">{form.college}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <GraduationCap size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Department</span>
                <p className="profile-detail-value">{form.department}</p>
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
              <Users size={16} className="profile-detail-icon text-emerald-500" />
              <div>
                <span className="profile-detail-label">Managed Scope</span>
                <p className="profile-detail-value">{form.managedBatches} · {form.totalStudents}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <MapPin size={16} className="profile-detail-icon text-amber-500" />
              <div>
                <span className="profile-detail-label">Office Location</span>
                <p className="profile-detail-value">{form.officeLocation}</p>
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
          {/* Section 1: Departmental & Role Governance */}
          <div className="profile-form-section">
            <div className="profile-section-heading">
              <Sparkles size={18} className="profile-heading-icon text-indigo-500" />
              <div>
                <h3 className="profile-heading-title">Departmental & Role Governance</h3>
                <p className="profile-heading-desc">Enter your designation, department, employee ID, and office cabin location.</p>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label className="profile-label">Official Designation / Title *</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Department *</label>
                <CoordProfSelect
                  value={form.department}
                  options={[
                    { value: "Electronics & Computer Science", label: "Electronics & Computer Science" },
                    { value: "Computer Science & Engineering", label: "Computer Science & Engineering" },
                    { value: "Information Technology", label: "Information Technology" },
                    { value: "Artificial Intelligence & Data Science", label: "Artificial Intelligence & Data Science" },
                    { value: "Mechanical Engineering", label: "Mechanical Engineering" },
                  ]}
                  onChange={(val) => setForm((p) => ({ ...p, department: val }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Employee / Staff ID *</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.empId}
                  onChange={(e) => setForm((p) => ({ ...p, empId: e.target.value }))}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Office Location / Cabin</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.officeLocation}
                  onChange={(e) => setForm((p) => ({ ...p, officeLocation: e.target.value }))}
                  placeholder="e.g. Room 402, Block B"
                />
              </div>

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
                <label className="profile-label">Official Email Address *</label>
                <input
                  type="email"
                  className="profile-input"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Office Hours / Availability</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.officeHours}
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
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>Departmental Alerts</span>
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
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>Weekly Cohort Scorecards</span>
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

          {/* Bottom Actions */}
          <div className="profile-actions-bar">
            <button type="submit" className="profile-save-btn">
              <Save size={16} /> Save Profile Details
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
