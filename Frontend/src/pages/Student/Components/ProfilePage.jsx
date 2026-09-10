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
  CheckCircle2,
  Save,
  Sparkles,
  BookOpen,
  Star,
  AlertCircle,
  Plus,
  X,
  Check,
  Target,
  Bell,
  Search,
  Briefcase,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import "../Styles/ProfilePage.css";

const CAREER_TRACK_OPTIONS = [
  "Python Backend Developer",
  "React Frontend Developer",
  "Full Stack Engineer",
  "Data Science & AI Engineer",
  "Cloud & DevOps Specialist",
  "Java Full Stack Developer",
  "Mobile App Developer (Flutter / React Native)",
  "Cyber Security & Ethical Hacking Specialist",
  "UI/UX & Product Designer",
  "Embedded Systems & IoT Engineer",
  "Blockchain & Web3 Engineer",
  "Machine Learning & MLOps Specialist",
];

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

export default function ProfilePage() {
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

  const [form, setForm] = useState(() => {
    let localUser = {};
    try { localUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}
    const sp = localUser.studentProfile || {};
    return {
      name: localUser.name || localUser.fullName || localUser.full_name || "",
      email: localUser.email || "",
      phone: localUser.mobile_number || localUser.phone || "",
      rollNo: sp.roll_number || localUser.roll_number || "",
      department: sp.department || localUser.department || "",
      gender: sp.gender || localUser.gender || "",
      city: sp.city || localUser.city || "",
      guardianContact: sp.emergency_contact || localUser.emergency_contact || "",
      linkedinUrl: sp.linkedin_url || localUser.linkedin_url || "",
      semester: sp.semester || localUser.semester || "",
      cgpa: sp.cgpa || localUser.cgpa || localUser.aggregate_cgpa || "",
      skills: sp.skills || localUser.skills || "",
      profileCompleted: true,
      batch: "",
      college: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
      coordinator: "",
      mentor: "",
      track: sp.target_track || localUser.target_track || "",
      notifMilestones: true,
      notifWeeklyReport: true,
      notifInterview: true,
    };
  });

  const filteredTracks = CAREER_TRACK_OPTIONS.filter((track) =>
    track.toLowerCase().includes((form.track || "").toLowerCase())
  );

  useEffect(() => {
    apiFetch("/student/profile")
      .then((res) => {
        if (res && res.data) {
          const user = res.data;
          const sp = user.studentProfile || {};
          setForm((prev) => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            phone: user.mobile_number || prev.phone,
            rollNo: sp.roll_number || user.roll_number || prev.rollNo,
            department: sp.department || user.department || prev.department,
            semester: sp.semester || user.semester || prev.semester,
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
    window.dispatchEvent(new Event("userProfileUpdated"));

    // Save exclusively to MySQL DB — no localStorage
    try {
      await apiFetch("/student/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          mobile_number: form.phone,
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
        }),
      });

      try {
        let existingUser = {};
        try { existingUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}
        const updatedUser = {
          ...existingUser,
          name: form.name,
          email: form.email,
          mobile_number: form.phone,
          department: form.department,
          semester: form.semester,
          cgpa: form.cgpa,
          skills: form.skills,
          gender: form.gender,
          city: form.city,
          target_track: form.track,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (e) {}
    } catch (err) {
      console.error("[ProfilePage] Save error:", err);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };


  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Student Account"
        title="My Academic Profile & Onboarding Settings"
        description="Update your semester, aggregate CGPA, technical skills, and target career goal."
      />

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
          <span>Profile updated successfully! Semester, CGPA, and Skills have been saved.</span>
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
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">My Skills</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {currentSkillsList.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No skills selected yet.</span>
                ) : (
                  currentSkillsList.map((skill, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Academic Profile Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
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
                  <select
                    className="profile-input profile-select"
                    value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
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
              </div>
            </div>

            {/* Section 2: Academic & Skill Details (MIDDLE) */}
            <div className="profile-form-section mt-6">


              <div className="profile-form-grid">
                <div className="profile-field">
                  <label className="profile-label">Current Semester *</label>
                  <select
                    className="profile-input profile-select"
                    value={form.semester}
                    onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
                    required
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
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

                {/* SEARCHABLE CAREER TRACK INPUT */}
                <div className="profile-field full-width" style={{ position: "relative" }}>
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
                      placeholder="Type your target career track (e.g. Python Backend, Full Stack Developer)..."
                      value={form.track}
                      onChange={(e) => setForm((p) => ({ ...p, track: e.target.value }))}
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
                </div>

                {/* 🌟 ENHANCED SKILLS SELECTION SECTION */}
                <div className="profile-field full-width" style={{ marginTop: "12px" }}>
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
                      <select
                        className="profile-input profile-select"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "13.5px",
                          fontWeight: "500",
                          color: "#1e293b",
                          backgroundColor: "#f8fafc",
                          cursor: "pointer"
                        }}
                        value=""
                        onChange={(e) => {
                          handleAddSkillFromDropdown(e.target.value);
                          e.target.value = "";
                        }}
                      >
                        <option value="" disabled>-- 🔍 Click to select skills from standard catalog --</option>
                        {PREDEFINED_SKILLS.map((skill) => (
                          <option
                            key={skill}
                            value={skill}
                            disabled={currentSkillsList.includes(skill)}
                          >
                            {skill} {currentSkillsList.includes(skill) ? " ✓ (Added)" : ""}
                          </option>
                        ))}
                      </select>
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
            </div>



            {/* Section 4: Account Settings & Preferences */}
            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <Bell size={18} className="profile-heading-icon text-indigo-500" />
                <div>
                  <h3 className="profile-heading-title">Account Settings & Alert Preferences</h3>
                  <p className="profile-heading-desc">Control automated reports, mock interview reminders, and milestone alerts.</p>
                </div>
              </div>

              <div className="profile-toggle-list">
                <div className="profile-toggle-item">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title">Milestone Progress Alerts</span>
                    <span className="profile-toggle-desc">Receive real-time notifications when a milestone is completed or unlocked.</span>
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

                <div className="profile-toggle-item">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title">Weekly Mentor Report Digest</span>
                    <span className="profile-toggle-desc">Get a PDF scorecard summary of your attendance, quizzes, and mentor feedback every Friday.</span>
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

                <div className="profile-toggle-item">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title">AI Mock Interview Drill Reminders</span>
                    <span className="profile-toggle-desc">Remind you 1 hour before scheduled AI technical mock drills & gap evaluation sessions.</span>
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

            {/* Bottom Actions */}
            <div className="profile-actions-bar">
              <button type="submit" className="profile-save-btn">
                <Save size={16} /> Save All Profile & Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
