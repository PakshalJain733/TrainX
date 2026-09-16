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
  Award,
  BookOpen,
  Star,
  Key,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { mentorProfile } from "../../../data/mentorMockData";
import CustomSelect from "../../../components/ui/CustomSelect";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/MN_ProfilePage.css";

export default function ProfilePage() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const resolveUser = () => {
    let localUser = {};
    try { localUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}
    let name = localUser.name || localUser.fullName || localUser.full_name || mentorProfile.name || "Faculty Mentor";
    let email = localUser.email || mentorProfile.email || "mentor@pvppcoe.ac.in";
    return { name, email, ...localUser };
  };

  const [form, setForm] = useState(() => {
    const user = resolveUser();
    try {
      const stored = localStorage.getItem("mentorProfile");
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...parsed, name: parsed.name || user.name, email: parsed.email || user.email };
      }
    } catch (e) {}

    return {
      name: user.name,
      email: user.email,
      phone: "+91 98201 54321",
      empId: "MENTOR-CSE-102",
      role: mentorProfile.role || "Senior Technical Trainer & Mentor",
      specialization: mentorProfile.specialization || "Full-Stack Web Development & DSA",
      department: mentorProfile.department || "Computer Engineering",
      college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering",
      experience: mentorProfile.experience || "6+ Years Teaching & Industry",
      rating: mentorProfile.rating || "4.8",
      officeLocation: "Faculty Block C, Room 302",
      officeHours: "Mon - Fri, 10:00 AM - 04:00 PM",
      allocatedBatches: "3 Allocated Cohorts",
      totalStudents: "120 Assigned Students",
    };
  });

  const deptOptions = [
    { value: "Computer Engineering", label: "Computer Engineering" },
    { value: "Information Technology", label: "Information Technology" },
    { value: "Electronics & Computer Science", label: "Electronics & Computer Science" },
    { value: "Artificial Intelligence & Data Science", label: "Artificial Intelligence & Data Science" },
    { value: "Mechanical Engineering", label: "Mechanical Engineering" },
  ];

  const specOptions = [
    { value: "Full-Stack Web Development & DSA", label: "Full-Stack Web Development & DSA" },
    { value: "Data Science & Machine Learning", label: "Data Science & Machine Learning" },
    { value: "Python Backend & Cloud Architecture", label: "Python Backend & Cloud Architecture" },
    { value: "Mobile App Development (React Native / Flutter)", label: "Mobile App Development" },
    { value: "DevOps, Docker & Kubernetes", label: "DevOps & Cloud Computing" },
  ];

  const getInitials = (nameStr) => {
    if (!nameStr) return "FM";
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
      localStorage.setItem("mentorProfile", JSON.stringify(form));
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
          designation: form.designation,
          office_location: form.officeLocation,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist mentor profile to DB:", err);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Mentor Account"
        title="My Profile & Academic Guidance Settings"
        description="Manage your faculty contact details, primary specialization, office hours, and mentorship preferences."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile updated successfully! Official contact details, specialization, and settings have been saved.</span>
        </div>
      )}

      <div className="profile-main-grid">
        {/* LEFT COLUMN: Mentor Dossier Card */}
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
              <span className="profile-roll-label">Staff ID:</span>
              <strong>{form.empId}</strong>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="success">Active Mentor</Badge>
              <Badge variant="default">{form.department}</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          {/* Mentor Overview Details */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Dossier Overview</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Institution</span>
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
              <Award size={16} className="profile-detail-icon text-indigo-500" />
              <div>
                <span className="profile-detail-label">Specialization</span>
                <p className="profile-detail-value font-semibold text-indigo-600 dark:text-indigo-400">{form.specialization}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Users size={16} className="profile-detail-icon text-emerald-500" />
              <div>
                <span className="profile-detail-label">Assigned Batches & Scope</span>
                <p className="profile-detail-value">{form.allocatedBatches} · {form.totalStudents}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Star size={16} className="profile-detail-icon text-amber-500 fill-amber-400" />
              <div>
                <span className="profile-detail-label">Student Rating & Experience</span>
                <p className="profile-detail-value font-bold text-amber-600">{form.rating} / 5.0 ⭐ ({form.experience})</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <MapPin size={16} className="profile-detail-icon text-purple-500" />
              <div>
                <span className="profile-detail-label">Office Location</span>
                <p className="profile-detail-value">{form.officeLocation}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Clock size={16} className="profile-detail-icon text-blue-500" />
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
                <Key size={16} />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Profile Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            {/* Section 1: Personal Contact Details (FIRST) */}
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <User size={18} className="profile-heading-icon text-indigo-500" />
                <div>
                  <h3 className="profile-heading-title">Personal Contact & Availability</h3>
                  <p className="profile-heading-desc">Used for student doubt clearing, session announcements, and faculty advisories.</p>
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

            {/* Section 2: Specialization & Academic Governance (SECOND) */}
            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <Sparkles size={18} className="profile-heading-icon text-indigo-500" />
                <div>
                  <h3 className="profile-heading-title">Specialization & Academic Governance</h3>
                  <p className="profile-heading-desc">Configure your primary domain expertise, department, employee ID, and office cabin location.</p>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-field">
                  <label className="profile-label">Official Title / Role *</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Primary Specialization *</label>
                  <CustomSelect
                    value={form.specialization}
                    options={specOptions}
                    onChange={(val) => setForm((p) => ({ ...p, specialization: val }))}
                    placeholder="Select Specialization"
                    icon={Award}
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
                    placeholder="e.g. Faculty Block C, Room 302"
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Teaching Experience</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.experience}
                    onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                    placeholder="e.g. 6+ Years Teaching & Industry"
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
