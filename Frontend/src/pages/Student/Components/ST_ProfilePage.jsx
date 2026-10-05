import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {Check, 
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
  QrCode,
  Copy,
  Loader2,
  Edit2,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/ST_ProfilePage.css";

/* ── Inline dropdown for Student Profile (CSS: ProfilePage.css .student-prof-select-*) ── */
function StudentProfSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`student-prof-select-wrap${isOpen ? ' student-prof-select-wrap--open' : ''}${disabled ? ' opacity-75 cursor-not-allowed' : ''}`} ref={ref}>
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
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
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
      linkedinUrl: sp.linkedin_url || u.linkedin_url || "",
      semester: sp.semester || u.semester || "",
      cgpa: sp.cgpa || u.cgpa || "",
      skills: sp.skills || u.skills || "",
      profileCompleted: true,
      batch: sp.batch || u.batch || "",
      college: u.college_name || u.college || sp.college_name || "Enterprise Partner Institution",
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

  // 2FA Google Authenticator State
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [loading2FASetup, setLoading2FASetup] = useState(false);
  const [totpData, setTotpData] = useState(null);
  const [totpCodeInput, setTotpCodeInput] = useState(["", "", "", "", "", ""]);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [totpSuccess, setTotpSuccess] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const totpInputRefs = useRef([]);

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

          setForm((prev) => ({
            ...prev,
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
            linkedinUrl: sp.linkedin_url || user.linkedin_url || prev.linkedinUrl,
            track: sp.target_track || user.target_track || prev.track,
            notifMilestones: sp.notif_milestones !== undefined ? Boolean(sp.notif_milestones) : prev.notifMilestones,
            notifWeeklyReport: sp.notif_weekly_report !== undefined ? Boolean(sp.notif_weekly_report) : prev.notifWeeklyReport,
            notifInterview: sp.notif_interview !== undefined ? Boolean(sp.notif_interview) : prev.notifInterview,
          }));
          setIs2FAEnabled(Boolean(user.two_factor_enabled || user.two_factor_secret || sp.two_factor_enabled || sp.two_factor_secret));
        }
      })
      .catch((err) => console.error("PROFILE FETCH ERROR:", err));
  }, []);

  const handleOpen2FASetup = async () => {
    setTotpError("");
    setTotpSuccess("");
    setTotpCodeInput(["", "", "", "", "", ""]);
    setLoading2FASetup(true);
    setIs2FASetupOpen(true);

    try {
      const res = await apiFetch("/auth/setup-2fa", { method: "POST" });
      if (res && (res.data || res.qrCode)) {
        setTotpData(res.data || res);
      }
    } catch (err) {
      setTotpError(err.message || "Failed to generate Google Authenticator QR Code");
    } finally {
      setLoading2FASetup(false);
    }
  };

  const handleCopySecret = () => {
    if (totpData?.secret) {
      navigator.clipboard.writeText(totpData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleTotpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "").slice(-1);
    const newCode = [...totpCodeInput];
    newCode[index] = cleanVal;
    setTotpCodeInput(newCode);

    if (cleanVal && index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !totpCodeInput[index] && index > 0) {
      totpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleTotpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData) {
      const digits = pasteData.split("");
      const newCode = ["", "", "", "", "", ""];
      digits.forEach((d, i) => {
        newCode[i] = d;
      });
      setTotpCodeInput(newCode);
      const nextIdx = Math.min(digits.length, 5);
      totpInputRefs.current[nextIdx]?.focus();
    }
  };

  const handleVerify2FASubmit = async (e) => {
    e.preventDefault();
    const code = totpCodeInput.join("");
    if (code.length < 6) {
      setTotpError("Please enter complete 6-digit Authenticator code.");
      return;
    }
    setVerifying2FA(true);
    setTotpError("");
    setTotpSuccess("");

    try {
      const res = await apiFetch("/auth/verify-2fa", {
        method: "POST",
        body: JSON.stringify({
          secret: totpData?.secret,
          code: code,
        }),
      });

      if (res && (res.success || res.data)) {
        setTotpSuccess("Google Authenticator 2FA paired and activated successfully!");
        setIs2FAEnabled(true);
        setTimeout(() => {
          setIs2FASetupOpen(false);
        }, 1500);
      } else {
        setTotpError(res?.message || "Invalid Authenticator Code. Please check Google Authenticator.");
      }
    } catch (err) {
      setTotpError(err.message || "Failed to verify 2FA code. Please try again.");
    } finally {
      setVerifying2FA(false);
    }
  };

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
        linkedin_url: form.linkedinUrl,
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
        }
        sessionStorage.removeItem("showFirstLoginAlert");
        sessionStorage.removeItem("st_first_login_dismissed");
        window.dispatchEvent(new Event("userProfileUpdated"));
      }
    } catch (err) {
      console.error("[ProfilePage] Save error:", err);
    }

    setSaved(true);
    setIsEditing(false);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
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
            {form.rollNo && String(form.rollNo).trim() !== "" && (
              <div className="profile-roll-chip">
                <span className="profile-roll-label">Roll No:</span>
                <strong>{form.rollNo}</strong>
              </div>
            )}

            {(Boolean(form.cgpa && String(form.cgpa).trim()) || Boolean(form.semester && String(form.semester).trim())) && (
              <div className="mt-3 flex items-center justify-center gap-2">
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
                <Target size={16} className="profile-detail-icon text-indigo-500" />
                <div>
                  <span className="profile-detail-label">Target Career Goal</span>
                  <p className="profile-detail-value font-semibold text-indigo-600 dark:text-indigo-400">{form.track}</p>
                </div>
              </div>
            )}

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
                <User size={18} className="profile-heading-icon text-indigo-500" />
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
                    >
                      <Save size={15} /> Save Profile
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
                <div className="flex items-center relative">
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
          <div className="profile-form-section mt-6 border-b-0 pb-0">
            <div className="profile-field full-width">
                <div className="profile-skills-card">
                  {/* Header */}
                  <div className="profile-skills-header">
                    <div className="profile-skills-title-group">
                      <div className="profile-skills-icon-box">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <label className="profile-label m-0 text-sm font-bold text-slate-900">
                          Confirmed Technical & Soft Skills *
                        </label>
                        <span className="text-xs text-slate-500 block">
                          Add your core programming languages, frameworks, tools, and soft skills.
                        </span>
                      </div>
                    </div>
                    
                    <span className="profile-skills-count-badge">
                      {currentSkillsList.length} Skills Selected
                    </span>
                  </div>

                  {/* Skill Search, Select & Add */}
                  <div className="mb-4">
                    <StudentSkillSelect
                      disabled={!isEditing}
                      placeholder="Search or add custom skill (e.g. Docker, OpenCV, PyTorch)..."
                      options={PREDEFINED_SKILLS.map((skill) => ({
                        value: skill,
                        label: currentSkillsList.includes(skill) ? `${skill} ✓ (Added)` : skill
                      }))}
                      onAdd={(val) => {
                        if (val && isEditing) {
                          const trimmed = val.trim();
                          if (trimmed && !currentSkillsList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
                            setForm(p => ({ ...p, skills: [...currentSkillsList, trimmed].join(", ") }));
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Selected Skills Container */}
                  <div className="profile-skills-active-box">
                    <div className="profile-skills-active-title">
                      <CheckCircle2 size={14} color="#16a34a" />
                      <span>Active Skills on Profile ({currentSkillsList.length})</span>
                    </div>

                    {currentSkillsList.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">
                        No skills added yet. Click Edit Profile above to manage skills.
                      </div>
                    ) : (
                      <div className="profile-skill-pills-wrap">
                        {currentSkillsList.map((skill) => (
                          <span
                            key={skill}
                            className="profile-skill-pill"
                          >
                            <span>{skill}</span>
                            {isEditing && (
                              <button
                                type="button"
                                className="profile-skill-badge-btn"
                                onClick={() => handleRemoveSkill(skill)}
                                title={`Remove ${skill}`}
                              >
                                <X size={12} strokeWidth={2.5} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
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

      {/* Google Authenticator 2FA Modal */}
      {is2FASetupOpen && createPortal(
        <div className="modal-overlay profile-2fa-modal-overlay">
          <div className="modal-dialog profile-2fa-modal-dialog">
            <div className="profile-2fa-modal-header">
              <div className="profile-2fa-modal-title-wrap">
                <div className="profile-2fa-modal-icon">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="profile-2fa-modal-title">Google Authenticator 2FA</h3>
                  <p className="profile-2fa-modal-subtitle">Scan QR code to pair your account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIs2FASetupOpen(false)}
                className="profile-2fa-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {loading2FASetup ? (
              <div className="profile-2fa-modal-loading">
                <Loader2 size={32} className="animate-spin profile-2fa-loader-spinner" />
                <p className="profile-2fa-loading-text">Generating Google Authenticator QR Code...</p>
              </div>
            ) : (
              <form onSubmit={handleVerify2FASubmit}>
                {totpError && (
                  <div className="profile-2fa-alert-error">
                    {totpError}
                  </div>
                )}

                {totpSuccess && (
                  <div className="profile-2fa-alert-success">
                    <CheckCircle2 size={16} />
                    <span>{totpSuccess}</span>
                  </div>
                )}

                {/* QR Code Container */}
                <div className="profile-2fa-qr-box">
                  {totpData?.qrCode ? (
                    <img
                      src={totpData.qrCode}
                      alt="Google Authenticator QR Code"
                      className="profile-2fa-qr-img"
                    />
                  ) : (
                    <div className="profile-2fa-qr-placeholder">
                      <QrCode size={40} className="text-slate-400" />
                    </div>
                  )}
                  <p className="profile-2fa-qr-text">
                    Open <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> app on your phone and scan this QR code.
                  </p>
                </div>

                {/* Secret Key Copy Bar */}
                {totpData?.secret && (
                  <div className="profile-2fa-secret-box">
                    <label className="profile-2fa-secret-label">
                      Or enter Secret Key manually:
                    </label>
                    <div className="profile-2fa-secret-row">
                      <code className="profile-2fa-secret-code">
                        {totpData.secret.match(/.{1,4}/g)?.join(" ") || totpData.secret}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="profile-2fa-copy-btn"
                      >
                        {copiedSecret ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copiedSecret ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 6-Digit Code Input */}
                <div className="profile-2fa-code-input-section">
                  <label className="profile-2fa-code-label">
                    Enter 6-Digit Authenticator Verification Code:
                  </label>
                  <div className="profile-2fa-digit-row" onPaste={handleTotpPaste}>
                    {totpCodeInput.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (totpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleTotpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleTotpKeyDown(idx, e)}
                        className="profile-2fa-digit-input"
                      />
                    ))}
                  </div>
                </div>

                <div className="profile-2fa-modal-actions">
                  <button
                    type="button"
                    onClick={() => setIs2FASetupOpen(false)}
                    className="profile-2fa-modal-cancel-btn"
                    disabled={verifying2FA}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-2fa-modal-submit-btn"
                    disabled={verifying2FA}
                  >
                    {verifying2FA ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Verifying...
                      </>
                    ) : (
                      "Verify & Enable 2FA"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
