import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Camera,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Users,
  UserCheck,
  Award,
  Bell,
  CheckCircle2,
  Save,
  Target,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import "../Styles/ProfilePage.css";

export default function ProfilePage() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [form, setForm] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) {
        let name = u.name || "";
        const isAutoName = !name || /^\d+$/.test(name.trim()) || name.startsWith("User_") || /^vu\d/i.test(name.trim());
        if (isAutoName) {
          name = u.fullName || u.full_name || "Pakshal";
        }
        return {
          name: name,
          email: u.email || "",
          phone: u.phone || u.mobile_number || "",
          rollNo: u.rollNo || u.roll_number || "",
          department: u.department || "",
          semester: u.semester || "",
          batch: u.batch || "",
          college: u.college || "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
          coordinator: u.coordinator || "",
          mentor: u.mentor || "",
          track: u.track || "",
          bio: u.bio || "",
          notifMilestones: u.notifMilestones !== undefined ? u.notifMilestones : true,
          notifWeeklyReport: u.notifWeeklyReport !== undefined ? u.notifWeeklyReport : true,
          notifInterview: u.notifInterview !== undefined ? u.notifInterview : true,
        };
      }
    } catch (e) {}

    return {
      name: "",
      email: "",
      phone: "",
      rollNo: "",
      department: "",
      semester: "",
      batch: "",
      college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
      coordinator: "",
      mentor: "",
      track: "",
      bio: "",
      notifMilestones: true,
      notifWeeklyReport: true,
      notifInterview: true,
    };
  });

  useEffect(() => {
    apiFetch("/student/profile")
      .then((res) => {
        if (res.data) {
          const user = res.data;
          setForm((prev) => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            department: user.department || prev.department,
            rollNo: user.roll_number || prev.rollNo,
            phone: user.mobile_number || prev.phone,
          }));
        }
      })
      .catch((err) => console.error("PROFILE FETCH ERROR:", err));
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
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Student Account"
        title="My Profile & Settings"
        description="Manage your personal details, academic tracking preferences, and mentor communications."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile changes and communication preferences saved successfully!</span>
        </div>
      )}

      <div className="profile-main-grid">
        {/* LEFT COLUMN: Student Academic Dossier */}
        <div className="profile-dossier-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt={form.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials">GS</div>
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
              <span className="profile-roll-label">Roll No:</span>
              <strong>{form.rollNo}</strong>
            </div>

            <div className="profile-status-badge-wrap">
            </div>
          </div>

          <div className="profile-academic-divider" />

          {/* Academic Info Table List */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Academic Details</h4>

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
              <Users size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Batch & Sem</span>
                <p className="profile-detail-value">{form.batch} ({form.semester})</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <UserCheck size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Coordinator</span>
                <p className="profile-detail-value">{form.coordinator}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Award size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">C2C Mentor</span>
                <p className="profile-detail-value">{form.mentor}</p>
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
                  <h3 className="profile-heading-title">Personal Details</h3>
                  <p className="profile-heading-desc">Visible to your coordinator, mentors, and batch rankings.</p>
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
                  <label className="profile-label">Primary Career Track Goal</label>
                  <select
                    className="profile-input profile-select"
                    value={form.track}
                    onChange={(e) => setForm((p) => ({ ...p, track: e.target.value }))}
                  >
                    <option value="Python Backend & Cloud Systems">Python Backend & Cloud Systems</option>
                    <option value="Full Stack Web Development (MERN)">Full Stack Web Development (MERN)</option>
                    <option value="Java Enterprise & Spring Boot">Java Enterprise & Spring Boot</option>
                    <option value="Data Science & Machine Learning">Data Science & Machine Learning</option>
                    <option value="DevOps & Cloud Engineering">DevOps & Cloud Engineering</option>
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
