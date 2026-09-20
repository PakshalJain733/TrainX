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
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import apiFetch from "../../../utils/api";
import "../../Student/Styles/ProfilePage.css";
import "../Styles/ProfilePage.css";

export default function CoordinatorProfilePage() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [form, setForm] = useState(() => {
    try {
      const stored = localStorage.getItem("coordinatorProfile");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    return {
      name: "",
      email: "",
      phone: "",
      empId: "",
      role: "Department Training Coordinator",
      department: "",
      college: "",
      officeLocation: "",
      officeHours: "",
      managedBatches: "",
      totalStudents: "",
    };
  });

  useEffect(() => {
    let mounted = true;
    apiFetch("/auth/me")
      .then((data) => {
        if (!mounted) return;
        const u = data?.user || data || {};
        setForm((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          phone: u.mobile_number || prev.phone,
          empId: u.emp_id || prev.empId,
          role: u.role === "coordinator" ? "Department Training Coordinator" : prev.role,
          department: u.department_name || prev.department,
          college: u.college_name || prev.college,
        }));
      })
      .catch(() => {});
    return () => { mounted = false; };
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
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem("coordinatorProfile", JSON.stringify(form));
    } catch (err) {}

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
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Profile Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
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
                  <select
                    className="profile-input profile-select"
                    value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    required
                  >
                    <option value="Electronics & Computer Science">Electronics & Computer Science</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
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

            {/* Section 2: Personal Contact Details */}
            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <User size={18} className="profile-heading-icon" />
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

            {/* Bottom Actions */}
            <div className="profile-actions-bar">
              <button type="submit" className="profile-save-btn">
                <Save size={16} /> Save Profile Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
