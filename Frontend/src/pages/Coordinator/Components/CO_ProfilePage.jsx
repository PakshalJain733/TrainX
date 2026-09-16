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
  KeyRound,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { coordinatorProfile } from "../../../data/coordinatorMockData";
import CustomSelect from "../../../components/ui/CustomSelect";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import { apiFetch } from "../../../utils/api";
import "../Styles/CO_ProfilePage.css";

export default function CoordinatorProfilePage() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  const resolveUser = () => {
    let localUser = {};
    try { localUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}
    let name = localUser.name || localUser.fullName || localUser.full_name || coordinatorProfile.name || "Department Coordinator";
    let email = localUser.email || coordinatorProfile.email || "coordinator@pvppcoe.ac.in";
    return { name, email, ...localUser };
  };

  const [form, setForm] = useState(() => {
    const user = resolveUser();
    try {
      const stored = localStorage.getItem("coordinatorProfile");
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...parsed, name: parsed.name || user.name, email: parsed.email || user.email };
      }
    } catch (e) {}

    return {
      name: user.name,
      email: user.email,
      phone: coordinatorProfile.phone || "+91 77109 07045",
      empId: "COORD-ECS-004",
      role: coordinatorProfile.role || "Department Training Coordinator",
      department: coordinatorProfile.department || "Electronics & Computer Science",
      college: coordinatorProfile.college || "Apex Institute of Technology",
      officeLocation: "Room 402, Block B, ECS Dept",
      officeHours: "Mon - Fri, 09:30 AM - 05:00 PM",
      managedBatches: "6 Active Batches",
      totalStudents: "480 Enrolled Students",
    };
  });

  const deptOptions = [
    { value: "Electronics & Computer Science", label: "Electronics & Computer Science" },
    { value: "Computer Science & Engineering", label: "Computer Science & Engineering" },
    { value: "Information Technology", label: "Information Technology" },
    { value: "Artificial Intelligence & Data Science", label: "Artificial Intelligence & Data Science" },
    { value: "Mechanical Engineering", label: "Mechanical Engineering" },
  ];

  const getInitials = (nameStr) => {
    if (!nameStr) return "DC";
    const parts = nameStr.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      localStorage.setItem("coordinatorProfile", JSON.stringify(form));
      let localUser = {};
      try { localUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}
      localStorage.setItem("user", JSON.stringify({ ...localUser, name: form.name, email: form.email }));
      window.dispatchEvent(new Event("userProfileUpdated"));
    } catch (err) {}

    try {
      await apiFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          mobile_number: form.phone.trim(),
          department: form.department,
          designation: form.role,
          office_location: form.officeLocation,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist coordinator profile to DB:", err);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Coordinator Account"
        title="My Profile & Departmental Governance Settings"
        description="Manage your official contact details, department role, office location, and availability."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile updated successfully! Official contact details, office location, and settings have been saved.</span>
        </div>
      )}

      <div className="profile-main-grid">
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
              <Badge variant="default">ECS Department</Badge>
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

            <div className="profile-detail-row">
              <Clock size={16} className="profile-detail-icon text-purple-500" />
              <div>
                <span className="profile-detail-label">Office Hours</span>
                <p className="profile-detail-value">{form.officeHours}</p>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
              <button
                type="button"
                onClick={() => setShowChangePassModal(true)}
                className="profile-change-pass-btn"
              >
                <KeyRound size={16} />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Profile Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            {/* Section 1: Personal Contact Details (SHIFTED UP) */}
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <User size={18} className="profile-heading-icon text-indigo-500" />
                <div>
                  <h3 className="profile-heading-title">Personal Contact & Availability</h3>
                  <p className="profile-heading-desc">Used for faculty notifications, student advisories, and administrative communications.</p>
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
            </div>

            {/* Section 2: Departmental & Role Governance (SHIFTED DOWN) */}
            <div className="profile-form-section mt-6">
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
                  <CustomSelect
                    value={form.department}
                    options={deptOptions}
                    onChange={(val) => setForm((p) => ({ ...p, department: val }))}
                    placeholder="Select Department"
                    icon={Building}
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
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="profile-actions-bar">
              <button type="submit" className="profile-save-btn">
                <Save size={16} /> Save Profile Details
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassModal && (
        <ChangePasswordModal onClose={() => setShowChangePassModal(false)} />
      )}
    </div>
  );
}
