import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle2,
  Save,
  Sparkles,
  BookOpen,
  Star,
  AlertCircle,
  Plus,
  X,
  Check,
  ChevronDown,
  Target,
  Bell,
  Search,
  Briefcase,
  Key,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/ST_ProfilePage.css";

/* ── Inline dropdown for Student Profile (CSS: ProfilePage.css .student-prof-select-*) ── */
function StudentProfSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`student-prof-select-wrap${isOpen ? ' student-prof-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`student-prof-select-trigger${isOpen ? ' student-prof-select-trigger--open' : ''}`}>
        {Icon && <Icon className="student-prof-select-icon" />}
        <span className="student-prof-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`student-prof-select-arrow${isOpen ? ' student-prof-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="student-prof-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`student-prof-select-option${isSel ? ' student-prof-select-option--selected' : ''}`}>
                <span className="student-prof-select-option-label">{opt.label}</span>
                {isSel && <Check className="student-prof-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const PREDEFINED_SKILLS = [
  "Python",
  "Java",
  "C++",
  "C Programming",
  "JavaScript",
  "TypeScript",
  "React.js",
  "Node.js",
  "Express.js",
  "FastAPI",
  "HTML5 & CSS3",
  "Tailwind CSS",
  "Data Structures & Algorithms",
  "SQL & Databases",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Machine Learning",
  "Deep Learning",
  "Docker & Containers",
  "Git & GitHub",
  "REST APIs",
  "System Design",
  "Problem Solving",
  "Communication Skills",
];

export const CAREER_TRACK_OPTIONS = [
  "Full Stack Web Development",
  "Frontend Web Development",
  "Backend Engineering",
  "AI & Machine Learning Engineering",
  "Data Science & Analytics",
  "DevOps & Cloud Engineering",
  "Mobile App Development (Flutter / Android / iOS)",
  "Cybersecurity & Ethical Hacking",
  "UI/UX Design & Product Design",
  "Blockchain & Web3",
  "Embedded Systems & IoT",
  "Software Quality Assurance & Automation Testing",
  "Data Engineering",
  "Cloud Architecture (AWS / Azure / GCP)",
  "Game Development",
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const trackWrapperRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [trackSearchFocus, setTrackSearchFocus] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (trackWrapperRef.current && !trackWrapperRef.current.contains(e.target)) {
        setTrackSearchFocus(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    rollNo: "",
    department: "",
    gender: "",
    city: "",
    guardianContact: "",
    linkedinUrl: "",
    semester: "",
    cgpa: "",
    skills: "",
    profileCompleted: true,
    batch: "",
    college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
    coordinator: "",
    mentor: "",
    track: "",
    notifMilestones: true,
    notifWeeklyReport: true,
    notifInterview: true,
  });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const filteredTracks = CAREER_TRACK_OPTIONS.filter((track) =>
    track.toLowerCase().includes((form.track || "").toLowerCase())
  );

  useEffect(() => {
    apiFetch("/student/profile")
      .then((res) => {
        if (res && res.data) {
          const user = res.data;
          const sp = user.studentProfile || {};
          const rawYear = sp.year || user.year;
          let derivedSem = sp.semester || user.semester;
          if (!derivedSem && rawYear) {
            if (rawYear === 'FE') derivedSem = 'Semester 1';
            else if (rawYear === 'SE') derivedSem = 'Semester 3';
            else if (rawYear === 'TE') derivedSem = 'Semester 5';
            else if (rawYear === 'BE') derivedSem = 'Semester 7';
          }
          setForm((prev) => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            phone: user.mobile_number || user.phone || prev.phone,
            rollNo: sp.roll_number || user.roll_number || prev.rollNo,
            department: sp.department || user.department || prev.department,
            semester: derivedSem || prev.semester,
            cgpa: sp.cgpa || user.cgpa || user.aggregate_cgpa || prev.cgpa,
            skills: sp.skills || user.skills || prev.skills,
            gender: sp.gender || user.gender || prev.gender,
            city: sp.city || user.city || prev.city,
            guardianContact: sp.emergency_contact || user.emergency_contact || prev.guardianContact,
            linkedinUrl: sp.linkedin_url || user.linkedin_url || prev.linkedinUrl,
            track: sp.target_track || user.target_track || prev.track,
            notifMilestones: sp.notif_milestones !== undefined ? Boolean(sp.notif_milestones) : prev.notifMilestones,
            notifWeeklyReport: sp.notif_weekly_report !== undefined ? Boolean(sp.notif_weekly_report) : prev.notifWeeklyReport,
            notifInterview: sp.notif_interview !== undefined ? Boolean(sp.notif_interview) : prev.notifInterview,
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

  // Convert skills string into clean array
  const currentSkillsList = typeof form.skills === "string"
    ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : Array.isArray(form.skills) ? form.skills : [];

  // Skill Handlers
  const handleAddSkillFromDropdown = (skillToAdd) => {
    if (!skillToAdd) return;
    if (!currentSkillsList.includes(skillToAdd)) {
      const updatedList = [...currentSkillsList, skillToAdd];
      setForm((p) => ({ ...p, skills: updatedList.join(", ") }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedList = currentSkillsList.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase());
    setForm((p) => ({ ...p, skills: updatedList.join(", ") }));
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !currentSkillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      const updatedList = [...currentSkillsList, trimmed];
      setForm((p) => ({ ...p, skills: updatedList.join(", ") }));
      setCustomSkillInput("");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, profileCompleted: true }));

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile_number: form.phone.trim(),
        roll_number: form.rollNo,
        department: form.department,
        semester: form.semester,
        cgpa: form.cgpa,
        skills: form.skills,
        gender: form.gender,
        city: form.city,
        emergency_contact: form.guardianContact,
        linkedin_url: form.linkedinUrl,
        target_track: form.track,
        notif_milestones: form.notifMilestones,
        notif_weekly_report: form.notifWeeklyReport,
        notif_interview: form.notifInterview,
      };

      const res = await apiFetch("/student/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res && res.data) {
        window.dispatchEvent(new Event("userProfileUpdated"));
      }
    } catch (err) {
      console.error("[ProfilePage] Save error:", err);
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate("/student");
    }, 1500);
  };


  const getInitials = (nameStr) => {
    if (!nameStr) return "ST";
    const parts = nameStr.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <UserCheck size={22} style={{ color: "#4f46e5" }} />
          <span>My Academic Profile & Onboarding Settings</span>
        </h2>
        <p className="student-header-desc">Update your semester, aggregate CGPA, technical skills, and target career goal.</p>
      </div>

      {/* First Time Login Alert Banner */}
      {!form.profileCompleted && (
        <div className="p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="text-amber-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-base">First-Time Setup Required</h4>
              <p className="text-sm opacity-90">Please update your Semester, Aggregate CGPA, Skills, and Target Goal below to generate your personalized AI Learning Roadmap.</p>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile saved successfully! Redirecting to Overview...</span>
        </div>
      )}

      <form onSubmit={handleSave} className="profile-main-grid">
        {/* LEFT COLUMN: Student Academic Dossier & Preferences */}
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
              <span className="profile-roll-label">Roll No:</span>
              <strong>{form.rollNo}</strong>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge variant="success">CGPA: {form.cgpa} / 10</Badge>
              <Badge variant="default">{form.semester}</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          {/* Academic Info Details */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Academic Overview</h4>

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
              <BookOpen size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Semester & CGPA</span>
                <p className="profile-detail-value">{form.semester} · {form.cgpa} CGPA</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Target size={16} className="profile-detail-icon text-indigo-500" />
              <div>
                <span className="profile-detail-label">Target Career Goal</span>
                <p className="profile-detail-value font-semibold text-indigo-600 dark:text-indigo-400">{form.track}</p>
              </div>
            </div>

            {/* Confirmed Skills Pills */}
            <div className="profile-skills-wrap">
              <span className="profile-skills-title">My Skills</span>
              <div className="profile-skills-list">
                {currentSkillsList.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No skills selected yet.</span>
                ) : (
                  currentSkillsList.map((skill, idx) => (
                    <span key={idx} className="profile-skill-chip">
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Account Settings & Alert Preferences in Left Card */}
            <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1.5px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Bell size={16} style={{ color: "#4f46e5" }} />
                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Alert Preferences</h4>
              </div>

              <div className="profile-toggle-list" style={{ gap: "8px" }}>
                <div className="profile-toggle-item" style={{ padding: "8px 10px" }}>
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>Milestone Progress Alerts</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifMilestones}
                      onChange={(e) => setForm((p) => ({ ...p, notifMilestones: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>

                <div className="profile-toggle-item" style={{ padding: "8px 10px" }}>
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>Weekly Mentor Digest</span>
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
                    <span className="profile-toggle-title" style={{ fontSize: "12px" }}>AI Mock Drill Reminders</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifInterview}
                      onChange={(e) => setForm((p) => ({ ...p, notifInterview: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>
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

        {/* RIGHT COLUMN: Edit Academic Profile Form */}
        <div className="profile-form-card">
          {/* Section 1: Personal & Contact Details (TOP) */}
          <div className="profile-form-section">
            <div className="profile-section-heading">
              <User size={18} className="profile-heading-icon text-indigo-500" />
              <div>
                <h3 className="profile-heading-title">Personal & Academic Details</h3>
                <p className="profile-heading-desc">Used for mentor notifications, personal contact, and training drive updates.</p>
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
                <label className="profile-label">Gender</label>
                <StudentProfSelect
                  value={form.gender}
                  placeholder="-- Select Gender --"
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                  ]}
                  onChange={(val) => setForm((p) => ({ ...p, gender: val }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Parent / Emergency Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  className="profile-input"
                  value={form.guardianContact}
                  onChange={(e) => setForm((p) => ({ ...p, guardianContact: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  className="profile-input"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Current Semester *</label>
                <StudentProfSelect
                  value={form.semester}
                  options={[
                    { value: "Semester 1", label: "Semester 1" },
                    { value: "Semester 2", label: "Semester 2" },
                    { value: "Semester 3", label: "Semester 3" },
                    { value: "Semester 4", label: "Semester 4" },
                    { value: "Semester 5", label: "Semester 5" },
                    { value: "Semester 6", label: "Semester 6" },
                    { value: "Semester 7", label: "Semester 7" },
                    { value: "Semester 8", label: "Semester 8" },
                  ]}
                  onChange={(val) => setForm((p) => ({ ...p, semester: val }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Aggregate CGPA (out of 10.0) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.75"
                  className="profile-input"
                  value={form.cgpa}
                  onChange={(e) => setForm((p) => ({ ...p, cgpa: e.target.value }))}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Roll Number *</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.rollNo}
                  onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))}
                  required
                />
              </div>

              {/* SEARCHABLE CAREER TRACK INPUT */}
              <div className="profile-field" style={{ position: "relative" }} ref={trackWrapperRef}>
                <label className="profile-label">Target Career Track / Role Goal *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Search
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      color: "#64748b",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                  <input
                    type="text"
                    className="profile-input"
                    style={{
                      paddingLeft: "42px",
                      paddingRight: form.track ? "36px" : "14px",
                      width: "100%",
                    }}
                    placeholder="Search or type target track (e.g. Full Stack)..."
                    value={form.track}
                    onFocus={() => setTrackSearchFocus(true)}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, track: e.target.value }));
                      setTrackSearchFocus(true);
                    }}
                    required
                  />
                  {form.track && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, track: "" }))}
                      style={{
                        position: "absolute",
                        right: "12px",
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "2px",
                      }}
                      title="Clear input"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {trackSearchFocus && filteredTracks.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      marginTop: "6px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredTracks.map((trk) => {
                      const isSelected = form.track === trk;
                      return (
                        <div
                          key={trk}
                          onClick={() => {
                            setForm((p) => ({ ...p, track: trk }));
                            setTrackSearchFocus(false);
                          }}
                          style={{
                            padding: "10px 14px",
                            fontSize: "13.5px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: isSelected ? "#eff6ff" : "transparent",
                            color: isSelected ? "#2563eb" : "#334155",
                            fontWeight: isSelected ? 600 : 500,
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span>{trk}</span>
                          {isSelected && <Check size={16} color="#2563eb" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Technical Skills & Soft Skills (Full Horizontal Width Below 5 Pairs) */}
          <div className="profile-form-section mt-6">
            <div className="profile-field full-width">
                <div style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)"
                }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <label className="profile-label" style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                          Confirmed Technical & Soft Skills *
                        </label>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>
                          Add your core programming languages, frameworks, tools, and soft skills.
                        </span>
                      </div>
                    </div>
                    
                    <span style={{
                      background: "#e0e7ff",
                      color: "#3730a3",
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "4px 12px",
                      borderRadius: "9999px"
                    }}>
                      {currentSkillsList.length} Skills Selected
                    </span>
                  </div>

                  {/* Catalog Dropdown Selector */}
                  <div style={{ marginBottom: "12px" }}>
                    <StudentProfSelect
                      value=""
                      placeholder="-- 🔍 Click to select skills from standard catalog --"
                      options={PREDEFINED_SKILLS.map((skill) => ({
                        value: skill,
                        label: currentSkillsList.includes(skill) ? `${skill} ✓ (Added)` : skill
                      }))}
                      onChange={(val) => {
                        if (val) handleAddSkillFromDropdown(val);
                      }}
                    />
                  </div>

                  {/* Add Custom Skill Input + Gradient Button */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <input
                      type="text"
                      placeholder="Or type a custom skill (e.g. Docker, OpenCV, PyTorch)..."
                      className="profile-input"
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "13.5px"
                      }}
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSkill(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "10px 20px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: "13px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                        outline: "none"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.25)";
                      }}
                      onClick={handleAddCustomSkill}
                    >
                      <Plus size={16} strokeWidth={2.5} style={{ color: "#ffffff" }} />
                      <span>Add Skill</span>
                    </button>
                  </div>

                  {/* Selected Skills Container with Ultra-Clean Badges */}
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px"
                  }}>
                    <div style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      color: "#475569",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                      <span>Active Skills on Profile ({currentSkillsList.length})</span>
                    </div>

                    {currentSkillsList.length === 0 ? (
                      <div style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                        No skills added yet. Select from the dropdown catalog or type above.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {currentSkillsList.map((skill) => (
                          <span
                            key={skill}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px 6px 14px",
                              borderRadius: "9999px",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              color: "#1e40af",
                              fontSize: "13px",
                              fontWeight: "600",
                              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                background: "#dbeafe",
                                color: "#1e40af",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                transition: "all 0.15s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#ef4444";
                                e.currentTarget.style.color = "#ffffff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#dbeafe";
                                e.currentTarget.style.color = "#1e40af";
                              }}
                              onClick={() => handleRemoveSkill(skill)}
                              title={`Remove ${skill}`}
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          {/* Bottom Actions */}
          <div className="profile-actions-bar">
            <button type="submit" className="profile-save-btn">
              <Save size={16} /> Save All Profile & Preferences
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
