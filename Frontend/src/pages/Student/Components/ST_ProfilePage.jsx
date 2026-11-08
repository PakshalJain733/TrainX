import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Check, User, Camera, Mail, Phone, GraduationCap, Building, Users, UserCheck, Award, CheckCircle2, Save, Sparkles, BookOpen, Star, AlertCircle, Plus, X, ChevronDown, Target, Bell, Search, Briefcase, Key, QrCode, Copy, Loader2, Edit2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/ST_ProfilePage.css";

/* ── Inline dropdown for Student Profile (CSS: ProfilePage.css .student-prof-select-*) ── */
function StudentProfSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const safeOptions = Array.isArray(options) ? options : [];
  const selected = safeOptions.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`student-prof-select-wrap${isOpen ? ' student-prof-select-wrap--open' : ''}${disabled ? ' student-prof-select-wrap--disabled' : ''}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(v => !v)}
        className={`student-prof-select-trigger${isOpen ? ' student-prof-select-trigger--open' : ''}${disabled ? ' student-prof-select-disabled' : ''}`}
      >
        {Icon && <Icon className="student-prof-select-icon" />}
        <span className={`student-prof-select-text${disabled ? ' student-prof-select-text-disabled' : ''}`}>{selected ? selected.label : <span className="student-prof-select-placeholder">{placeholder}</span>}</span>
        <ChevronDown className={`student-prof-select-arrow${isOpen ? ' student-prof-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <div className="student-prof-select-dropdown">
          {safeOptions.map(opt => {
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

function StudentSkillSelect({ options = [], onAdd, placeholder = 'Search or add skill...', disabled = false }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const showAdd = query.trim().length > 0 && !options.find(o => o.label.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className={`student-prof-select-wrap${isOpen ? ' student-prof-select-wrap--open' : ''}${disabled ? ' opacity-75 cursor-not-allowed' : ''}`} ref={ref}>
      <div className={`student-prof-select-trigger${isOpen ? ' student-prof-select-trigger--open' : ''}${disabled ? ' student-prof-select-disabled' : ''}`}>
        <input 
          type="text" 
          value={query}
          disabled={disabled}
          onChange={e => { if (!disabled) { setQuery(e.target.value); setIsOpen(true); } }}
          onFocus={() => { if (!disabled) setIsOpen(true); }}
          onKeyDown={e => {
            if (!disabled && e.key === 'Enter' && query.trim()) {
              e.preventDefault();
              onAdd(query.trim());
              setQuery("");
              setIsOpen(false);
            }
          }}
          placeholder={disabled ? "Click Edit Profile to manage skills" : placeholder}
          className="student-prof-skill-input"
        />
        <ChevronDown className={`student-prof-select-arrow${isOpen ? ' student-prof-select-arrow--rotate' : ''}`} />
      </div>
      {isOpen && !disabled && (
        <div className="student-prof-select-dropdown">
          {filtered.map(opt => (
            <div key={opt.value} onClick={() => { onAdd(opt.value); setQuery(""); setIsOpen(false); }} className="student-prof-select-option">
              <span className="student-prof-select-option-label">{opt.label}</span>
            </div>
          ))}
          {showAdd && (
            <div onClick={() => { onAdd(query.trim()); setQuery(""); setIsOpen(false); }} className="student-prof-select-option student-prof-select-add-opt">
              <Plus size={14} /> Add "{query.trim()}"
            </div>
          )}
          {filtered.length === 0 && !showAdd && (
            <div className="student-prof-select-option student-prof-select-empty-opt">
              No options found
            </div>
          )}
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
  const redirectTimerRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [trackSearchFocus, setTrackSearchFocus] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

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
    let u = {};
    try { u = JSON.parse(sessionStorage.getItem("user")) || {}; } catch { }
    const sp = u.studentProfile || {};
    let rawYear = sp.year || u.year || "";
    let rawDiv = sp.division || u.division || "";
    let rawDept = sp.department || u.department || "";

    if (rawYear) {
      const yStr = String(rawYear).trim().toUpperCase();
      if (yStr.startsWith("FE") || yStr.includes("FIRST")) rawYear = "FE";
      else if (yStr.startsWith("SE") || yStr.includes("SECOND")) rawYear = "SE";
      else if (yStr.startsWith("TE") || yStr.includes("THIRD")) rawYear = "TE";
      else if (yStr.startsWith("BE") || yStr.includes("FINAL") || yStr.includes("FOURTH")) rawYear = "BE";
    }
    if (rawDiv) {
      const dStr = String(rawDiv).replace(/division\s*/i, "").trim().toUpperCase();
      if (["A", "B", "C", "D", "E", "F"].includes(dStr)) rawDiv = dStr;
    }

    return {
      name: u.name || "",
      email: u.email || "",
      phone: u.mobile_number || u.phone || sp.mobile_number || "",
      rollNo: sp.roll_number || u.roll_number || "",
      department: rawDept,
      year: rawYear,
      division: rawDiv,
      gender: sp.gender || u.gender || "",
      city: sp.city || u.city || "",
      guardianContact: sp.emergency_contact || u.emergency_contact || "",
      semester: sp.semester || u.semester || "",
      cgpa: sp.cgpa || u.cgpa || "",
      skills: sp.skills || u.skills || "",
      profileCompleted: true,
      batch: sp.batch || u.batch || "",
      college: u.college_name || u.college || sp.college_name || sp.college || "",
      coordinator: "",
      mentor: "",
      track: sp.target_track || u.target_track || "",
      notifMilestones: true,
      notifWeeklyReport: true,
      notifInterview: true,
    };
  });

  const [isEditing, setIsEditing] = useState(false);
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
          let uStored = {};
          try { uStored = JSON.parse(sessionStorage.getItem("user")) || {}; } catch { }
          const uSp = uStored.studentProfile || {};

          let rawYear = sp.year || user.year || uSp.year || uStored.year || "";
          let rawDiv = sp.division || user.division || uSp.division || uStored.division || "";
          let rawDept = sp.department || user.department || uSp.department || uStored.department || "";

          if (rawYear) {
            const yStr = String(rawYear).trim().toUpperCase();
            if (yStr.startsWith("FE") || yStr.includes("FIRST")) rawYear = "FE";
            else if (yStr.startsWith("SE") || yStr.includes("SECOND")) rawYear = "SE";
            else if (yStr.startsWith("TE") || yStr.includes("THIRD")) rawYear = "TE";
            else if (yStr.startsWith("BE") || yStr.includes("FINAL") || yStr.includes("FOURTH")) rawYear = "BE";
          }

          if (rawDiv) {
            const dStr = String(rawDiv).replace(/division\s*/i, "").trim().toUpperCase();
            if (["A", "B", "C", "D", "E", "F"].includes(dStr)) rawDiv = dStr;
          }

          let derivedSem = sp.semester || user.semester || uSp.semester || uStored.semester;
          if (!derivedSem && rawYear) {
            if (rawYear === 'FE') derivedSem = 'Semester 1';
            else if (rawYear === 'SE') derivedSem = 'Semester 3';
            else if (rawYear === 'TE') derivedSem = 'Semester 5';
            else if (rawYear === 'BE') derivedSem = 'Semester 7';
          }

          const fetchedCollege = user.college_name || user.college || sp.college_name || sp.college || uStored.college_name || uStored.college || "";

          setForm((prev) => ({
            ...prev,
            college: fetchedCollege || prev.college,
            name: user.name || prev.name,
            email: user.email || prev.email,
            phone: user.mobile_number || user.phone || prev.phone,
            rollNo: sp.roll_number || user.roll_number || prev.rollNo,
            department: rawDept || prev.department,
            year: rawYear || prev.year,
            division: rawDiv || prev.division,
            semester: derivedSem || prev.semester,
            cgpa: sp.cgpa || user.cgpa || user.aggregate_cgpa || prev.cgpa,
            skills: sp.skills || user.skills || prev.skills,
            gender: sp.gender || user.gender || prev.gender,
            city: sp.city || user.city || prev.city,
            guardianContact: sp.emergency_contact || user.emergency_contact || prev.guardianContact,
            track: sp.target_track || user.target_track || prev.track,
            notifMilestones: sp.notif_milestones !== undefined ? Boolean(sp.notif_milestones) : prev.notifMilestones,
            notifWeeklyReport: sp.notif_weekly_report !== undefined ? Boolean(sp.notif_weekly_report) : prev.notifWeeklyReport,
            notifInterview: sp.notif_interview !== undefined ? Boolean(sp.notif_interview) : prev.notifInterview,
          }));

          if (fetchedCollege) {
            try {
              const curStored = JSON.parse(sessionStorage.getItem("user") || "{}");
              curStored.college = fetchedCollege;
              curStored.college_name = fetchedCollege;
              sessionStorage.setItem("user", JSON.stringify(curStored));
            } catch {}
          }
        }
      })
      .catch((err) => console.error("PROFILE FETCH ERROR:", err));
  }, []);


  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
        window.dispatchEvent(new Event("userProfileUpdated"));
      };
      reader.readAsDataURL(file);
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


  const handleSave = async (e) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, profileCompleted: true }));
    setIsSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile_number: form.phone.trim(),
        roll_number: form.rollNo,
        department: form.department,
        year: form.year,
        division: form.division,
        semester: form.semester,
        cgpa: form.cgpa,
        skills: form.skills,
        gender: form.gender,
        city: form.city,
        emergency_contact: form.guardianContact,
        target_track: form.track,
        is_profile_updated: true,
        notif_milestones: form.notifMilestones,
        notif_weekly_report: form.notifWeeklyReport,
        notif_interview: form.notifInterview,
      };

      const res = await apiFetch("/student/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res && res.data) {
        let u = {};
        try { u = JSON.parse(sessionStorage.getItem("user")) || {}; } catch { }
        const userKey = u.id || u.email || res.data.id || res.data.email;
        if (userKey) {
          sessionStorage.setItem(`profile_updated_${userKey}`, "true");
          localStorage.setItem(`profile_updated_${userKey}`, "true");
          sessionStorage.removeItem(`st_flash_skipped_${userKey}`);
          localStorage.removeItem(`st_flash_skipped_${userKey}`);
        }
        sessionStorage.removeItem("showFirstLoginAlert");
        sessionStorage.removeItem("st_first_login_dismissed");
        sessionStorage.removeItem("st_flash_skipped_session");
        sessionStorage.removeItem("st_flash_skipped_current");
        localStorage.removeItem("st_flash_skipped_current");
        window.dispatchEvent(new Event("userProfileUpdated"));
      }
    } catch (err) {
      console.error("[ProfilePage] Save error:", err);
    } finally {
      setIsSaving(false);
    }

    setSaved(true);
    setIsEditing(false);

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    redirectTimerRef.current = setTimeout(() => {
      setSaved(false);
      navigate("/student");
    }, 2500);
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
          <User size={24} style={{ color: "var(--primary-color, #4f46e5)", flexShrink: 0, marginRight: "10px" }} />
          <span>My Academic Profile & Onboarding Settings</span>
        </h2>
        <p className="student-header-desc">Update your semester, aggregate CGPA, technical skills, and target career goal.</p>
      </div>

      {/* First Time Login Alert Banner */}
      {!form.profileCompleted && (
        <div className="profile-first-login-alert">
          <div className="profile-first-login-content">
            <AlertCircle size={22} className="profile-first-login-icon" />
            <div>
              <h4 className="profile-first-login-title">First-Time Setup Required</h4>
              <p className="profile-first-login-desc">Please update your Semester, Aggregate CGPA, Skills, and Target Goal below to generate your personalized AI Learning Roadmap.</p>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile updated successfully! Redirecting to Overview...</span>
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
            {form.rollNo && String(form.rollNo).trim() !== "" && (
              <div className="profile-roll-chip">
                <span className="profile-roll-label">Roll No:</span>
                <strong>{form.rollNo}</strong>
              </div>
            )}

            {(Boolean(form.cgpa && String(form.cgpa).trim()) || Boolean(form.semester && String(form.semester).trim())) && (
              <div className="profile-badge-row">
                {form.cgpa && String(form.cgpa).trim() !== "" && (
                  <Badge variant="success">CGPA: {form.cgpa} / 10</Badge>
                )}
                {form.semester && String(form.semester).trim() !== "" && (
                  <Badge variant="default">{form.semester}</Badge>
                )}
              </div>
            )}
          </div>

          <div className="profile-academic-divider" />

          {/* Academic Info Details */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Academic Overview</h4>

            {form.college && String(form.college).trim() !== "" && (
              <div className="profile-detail-row">
                <Building size={16} className="profile-detail-icon" />
                <div>
                  <span className="profile-detail-label">College</span>
                  <p className="profile-detail-value">{form.college}</p>
                </div>
              </div>
            )}

            {form.department && String(form.department).trim() !== "" && (
              <div className="profile-detail-row">
                <GraduationCap size={16} className="profile-detail-icon" />
                <div>
                  <span className="profile-detail-label">Department</span>
                  <p className="profile-detail-value">{form.department}</p>
                </div>
              </div>
            )}

            {(form.year || form.division) && (
              <div className="profile-detail-row">
                <Users size={16} className="profile-detail-icon" />
                <div>
                  <span className="profile-detail-label">Year & Division</span>
                  <p className="profile-detail-value">
                    {[form.year, form.division ? `Div ${form.division}` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            )}

            {(form.semester || form.cgpa) && (
              <div className="profile-detail-row">
                <BookOpen size={16} className="profile-detail-icon" />
                <div>
                  <span className="profile-detail-label">Semester & CGPA</span>
                  <p className="profile-detail-value">
                    {[form.semester, form.cgpa ? `${form.cgpa} CGPA` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            )}

            {form.track && String(form.track).trim() !== "" && (
              <div className="profile-detail-row">
                <Target size={16} className="profile-detail-icon profile-icon-indigo" />
                <div>
                  <span className="profile-detail-label">Target Career Goal</span>
                  <p className="profile-detail-value profile-career-value">{form.track}</p>
                </div>
              </div>
            )}

            {/* Confirmed Skills Pills */}
            <div className="profile-skills-wrap">
              <span className="profile-skills-title">My Skills</span>
              <div className="profile-skills-list">
                {currentSkillsList.length === 0 ? (
                  <span className="profile-no-skills-msg">No skills selected yet.</span>
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
            <div className="student-prof-alerts-wrap">
              <div className="student-prof-alerts-header">
                <Bell size={16} color="#4f46e5" />
                <h4 className="student-prof-alerts-title">Alert Preferences</h4>
              </div>

              <div className="profile-toggle-list profile-toggle-list-sm">
                <div className="profile-toggle-item profile-toggle-item-sm">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title profile-toggle-title-sm">Milestone Progress Alerts</span>
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

                <div className="profile-toggle-item profile-toggle-item-sm">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title profile-toggle-title-sm">Weekly Mentor Digest</span>
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

                <div className="profile-toggle-item profile-toggle-item-sm">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title profile-toggle-title-sm">AI Mock Drill Reminders</span>
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
                <Key size={14} />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Academic Profile Form */}
        <div className="profile-form-card">
          {/* Section 1: Personal & Contact Details (TOP) */}
          <div className="profile-form-section">
            <div className="profile-section-heading profile-section-heading-flex">
              <div className="profile-heading-group">
                <User size={18} className="profile-heading-icon profile-icon-indigo" />
                <div>
                  <h3 className="profile-heading-title">{isEditing ? "Edit Personal & Academic Details" : "Personal & Academic Details"}</h3>
                  <p className="profile-heading-desc">Used for mentor notifications, personal contact, and training drive updates.</p>
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
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Saving...
                        </>
                      ) : saved ? (
                        <>
                          <Check size={15} /> Profile Updated
                        </>
                      ) : (
                        <>
                          <Save size={15} /> Save Profile
                        </>
                      )}
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
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label profile-label-flex">
                  Department <span className="profile-label-hint">(Read-Only)</span>
                </label>
                <input
                  type="text"
                  className="profile-input profile-input-readonly"
                  value={form.department || "—"}
                  readOnly
                  disabled
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Academic Year</label>
                <StudentProfSelect
                  value={form.year}
                  disabled={!isEditing}
                  placeholder="Select Year"
                  options={[
                    { value: "FE", label: "FE (First Year)" },
                    { value: "SE", label: "SE (Second Year)" },
                    { value: "TE", label: "TE (Third Year)" },
                    { value: "BE", label: "BE (Final Year)" },
                  ]}
                  onChange={(val) => setForm((p) => ({ ...p, year: val }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Division</label>
                <StudentProfSelect
                  value={form.division}
                  disabled={!isEditing}
                  placeholder="Select Division"
                  options={[
                    { value: "A", label: "Division A" },
                    { value: "B", label: "Division B" },
                    { value: "C", label: "Division C" },
                    { value: "D", label: "Division D" },
                    { value: "E", label: "Division E" },
                    { value: "F", label: "Division F" },
                  ]}
                  onChange={(val) => setForm((p) => ({ ...p, division: val }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Current Semester *</label>
                <StudentProfSelect
                  value={form.semester}
                  disabled={!isEditing}
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
                <label className="profile-label">Gender</label>
                <StudentProfSelect
                  value={form.gender}
                  disabled={!isEditing}
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
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.guardianContact}
                  onChange={(e) => setForm((p) => ({ ...p, guardianContact: e.target.value }))}
                  readOnly={!isEditing}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  readOnly={!isEditing}
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
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.cgpa}
                  onChange={(e) => setForm((p) => ({ ...p, cgpa: e.target.value }))}
                  readOnly={!isEditing}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Roll Number *</label>
                <input
                  type="text"
                  className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                  value={form.rollNo}
                  onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))}
                  readOnly={!isEditing}
                  required
                />
              </div>

              {/* SEARCHABLE CAREER TRACK INPUT */}
              <div className="profile-field profile-track-search-wrapper" ref={trackWrapperRef}>
                <label className="profile-label">Target Career Track / Role Goal *</label>
                <div className="profile-track-search-box">
                  <Search
                    size={18}
                    className="profile-track-search-icon"
                  />
                  <input
                    type="text"
                    className={`profile-input profile-track-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    placeholder="Search or type target track (e.g. Full Stack)..."
                    value={form.track}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    onFocus={() => isEditing && setTrackSearchFocus(true)}
                    onChange={(e) => {
                      if (isEditing) {
                        setForm((p) => ({ ...p, track: e.target.value }));
                        setTrackSearchFocus(true);
                      }
                    }}
                    required
                  />
                  {form.track && isEditing && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, track: "" }))}
                      className="profile-track-clear-btn"
                      title="Clear input"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {isEditing && trackSearchFocus && filteredTracks.length > 0 && (
                  <div className="profile-track-dropdown">
                    {filteredTracks.map((trk) => {
                      const isSelected = form.track === trk;
                      return (
                        <div
                          key={trk}
                          onClick={() => {
                            setForm((p) => ({ ...p, track: trk }));
                            setTrackSearchFocus(false);
                          }}
                          className={`profile-track-option${isSelected ? ' profile-track-option--selected' : ''}`}
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
          <div className="profile-form-section profile-form-section-skills">
            <div className="profile-field full-width">
                <div className="profile-skills-card">
                  {/* Header */}
                  <div className="profile-skills-header">
                    <div className="profile-skills-title-group">
                      <div className="profile-skills-icon-box">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <label className="profile-label profile-skills-main-label">
                          Confirmed Technical & Soft Skills *
                        </label>
                        <span className="profile-skills-sublabel">
                          Add your core programming languages, frameworks, tools, and soft skills.
                        </span>
                      </div>
                    </div>
                    
                    <span className="profile-skills-count-badge">
                      {currentSkillsList.length} {currentSkillsList.length === 1 ? "Skill" : "Skills"} Selected
                    </span>
                  </div>

                  {/* Mode-Dependent View: Edit Mode shows search & active box; View Mode shows clean pills directly */}
                  {isEditing ? (
                    <>
                      {/* Skill Search, Select & Add Input */}
                      <div className="profile-skills-input-wrapper">
                        <StudentSkillSelect
                          disabled={false}
                          placeholder="Search or add custom skill (e.g. Docker, OpenCV, PyTorch)..."
                          options={PREDEFINED_SKILLS.map((skill) => ({
                            value: skill,
                            label: currentSkillsList.includes(skill) ? `${skill} ✓ (Added)` : skill,
                          }))}
                          onAdd={(val) => {
                            const trimmed = val ? val.trim() : "";
                            if (trimmed && !currentSkillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
                              setForm((p) => ({ ...p, skills: [...currentSkillsList, trimmed].join(", ") }));
                            }
                          }}
                        />
                      </div>

                      {/* Selected Skills Container with Remove buttons */}
                      <div className="profile-skills-active-box">
                        <div className="profile-skills-active-title">
                          <CheckCircle2 size={14} color="#16a34a" />
                          <span>Active Skills on Profile ({currentSkillsList.length}) — Click ✕ to remove</span>
                        </div>

                        {currentSkillsList.length === 0 ? (
                          <div className="profile-no-skills-msg">
                            No skills added yet. Search or type above to add skills.
                          </div>
                        ) : (
                          <div className="profile-skill-pills-wrap">
                            {currentSkillsList.map((skill) => (
                              <span key={skill} className="profile-skill-pill">
                                <span>{skill}</span>
                                <button
                                  type="button"
                                  className="profile-skill-badge-btn"
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
                    </>
                  ) : (
                    /* Clean Direct View Mode without redundant disabled search box or double nested borders */
                    <div className="profile-skills-view-wrap">
                      {currentSkillsList.length === 0 ? (
                        <div className="profile-no-skills-msg">
                          No skills added yet. Click <strong>Edit Profile</strong> at the top to add your skills.
                        </div>
                      ) : (
                        <div className="profile-skill-pills-wrap">
                          {currentSkillsList.map((skill) => (
                            <span key={skill} className="profile-skill-pill">
                              <span>{skill}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
