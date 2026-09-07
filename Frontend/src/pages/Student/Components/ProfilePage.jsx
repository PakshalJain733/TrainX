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
  Code2,
  AlertCircle,
  Plus,
  X,
  Check,
  Target,
  Bell,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import "../Styles/ProfilePage.css";

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
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const [form, setForm] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) {
        let name = u.name || "";
        const isAutoName = !name || /^\d+$/.test(name.trim()) || name.startsWith("User_") || /^vu\d/i.test(name.trim());
        if (isAutoName) {
          name = u.fullName || u.full_name || "";
        }
        return {
          name: name,
          email: u.email || "",
          phone: u.phone || u.mobile_number || "",
          rollNo: u.rollNo || u.roll_number || "",
          department: u.department || "",
          semester: u.semester || "",
          cgpa: u.cgpa || u.aggregate_cgpa || "",
          skills: u.skills || "",
          profileCompleted: u.profileCompleted !== undefined ? u.profileCompleted : Boolean(u.cgpa && u.skills),
          gender: u.gender || "",
          city: u.city || "",
          guardianContact: u.guardianContact || u.emergency_contact || "",
          linkedinUrl: u.linkedinUrl || u.linkedin_url || "",
          batch: u.batch || "",
          college: u.college || "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
          coordinator: u.coordinator || "",
          mentor: u.mentor || "",
          track: u.track || u.target_track || "",
        };
      }
    } catch (e) {}

    return {
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
            gender: user.gender || prev.gender,
            city: user.city || prev.city,
            guardianContact: user.emergency_contact || prev.guardianContact,
            linkedinUrl: user.linkedin_url || prev.linkedinUrl,
            semester: user.semester || prev.semester,
            cgpa: user.cgpa || user.aggregate_cgpa || prev.cgpa,
            skills: user.skills || prev.skills,
            track: user.target_track || user.track || prev.track,
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
    const updatedUser = {
      ...form,
      profileCompleted: true,
    };
    
    setForm(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("userProfileUpdated"));

    setSaved(true);

    try {
      // Synchronous await backend database save!
      await apiFetch("/students/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          roll_number: form.rollNo,
          department: form.department,
          gender: form.gender,
          city: form.city,
          guardianContact: form.guardianContact || form.guardianPhone,
          emergency_contact: form.guardianContact || form.guardianPhone,
          linkedinUrl: form.linkedinUrl || form.linkedin,
          semester: form.semester,
          cgpa: form.cgpa,
          skills: form.skills,
          track: form.track,
        }),
      });
    } catch (err) {
      console.error("PROFILE SAVE API ERROR:", err);
    }

    // Hard redirect to Student Dashboard after DB write completes
    window.location.href = "/student";
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
            {/* Section 1: Personal Contact Details (NOW FIRST) */}
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <div>
                  <h3 className="profile-heading-title">Personal Contact Details</h3>
                  <p className="profile-heading-desc">Used for mentor notifications and training drive updates.</p>
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
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">College ID (Roll Number) *</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.rollNo}
                    onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))}
                    placeholder="e.g. VU21CS042"
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Gender</label>
                  <select
                    className="profile-input profile-select"
                    value={form.gender || ""}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="profile-field">
                  <label className="profile-label">City / Native Location</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.city || ""}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Mumbai, Maharashtra"
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Parents Contact</label>
                  <input
                    type="text" 
                    className="profile-input"
                    value={form.guardianContact || form.guardianPhone || ""}
                    onChange={(e) => setForm((p) => ({ ...p, guardianContact: e.target.value, guardianPhone: e.target.value }))}
                    placeholder="e.g. Parent Phone Number"
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">LinkedIn / GitHub Profile URL</label>
                  <input
                    type="url"
                    className="profile-input"
                    value={form.linkedinUrl || form.linkedin || ""}
                    onChange={(e) => setForm((p) => ({ ...p, linkedinUrl: e.target.value, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Update Academic & Skill Details (NOW SECOND) */}
            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <div>
                  <h3 className="profile-heading-title">Academic & Skill Details</h3>
                  <p className="profile-heading-desc">Enter your semester, CGPA, target career goal, and current skills. The AI engine will generate your customized learning roadmap based on these details.</p>
                </div>
              </div>

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

                <div className="profile-field full-width">
                  <label className="profile-label">Target Career Track / Role Goal *</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={form.track || ""}
                    onChange={(e) => setForm((p) => ({ ...p, track: e.target.value }))}
                    placeholder="e.g. Python Backend Developer, Full Stack Engineer"
                    required
                  />
                </div>

                {/* SKILLS MULTI-SELECT DROPDOWN SECTION */}
                <div className="profile-field full-width">
                  <label className="profile-label">Current Confirmed Skills (Select from catalog) *</label>
                  
                  {/* Select Dropdown */}
                  <select
                    className="profile-input profile-select mb-3"
                    value=""
                    onChange={(e) => {
                      handleAddSkillFromDropdown(e.target.value);
                      e.target.value = "";
                    }}
                  >
                    <option value="" disabled>-- Click to select skills from catalog --</option>
                    {PREDEFINED_SKILLS.map((skill) => (
                      <option
                        key={skill}
                        value={skill}
                        disabled={currentSkillsList.includes(skill)}
                      >
                        {skill} {currentSkillsList.includes(skill) ? "✓ (Added)" : ""}
                      </option>
                    ))}
                  </select>

                  {/* Add Custom Skill Row */}
                  <div className="profile-custom-skill-row">
                    <input
                      type="text"
                      placeholder="Or type a custom skill (e.g. OpenCV, Kubernetes)..."
                      className="profile-input profile-custom-skill-input"
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
                      className="profile-add-skill-btn"
                      onClick={handleAddCustomSkill}
                    >
                      <Plus size={15} /> Add Skill
                    </button>
                  </div>

                  {/* Clean Selected Skill Container */}
                  <div className="profile-skills-box">
                    <span className="profile-skills-box-title">
                      Selected Skills ({currentSkillsList.length})
                    </span>
                    {currentSkillsList.length === 0 ? (
                      <span className="profile-no-skills-text">Please select at least 1 skill from the dropdown above.</span>
                    ) : (
                      <div className="profile-skill-pills-wrap">
                        {currentSkillsList.map((skill) => (
                          <span key={skill} className="profile-skill-pill">
                            {skill}
                            <button
                              type="button"
                              className="profile-skill-remove-btn"
                              onClick={() => handleRemoveSkill(skill)}
                              title={`Remove ${skill}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Notification & System Preferences (Integrated from Settings) */}
            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <div>
                  <h3 className="profile-heading-title">Notification & Alert Preferences</h3>
                  <p className="profile-heading-desc">Control automated weekly reports, milestone alerts, and mock drill notifications.</p>
                </div>
              </div>

              <div className="profile-toggle-list">
                <div className="profile-toggle-item">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title">Milestone Progress Alerts</span>
                    <span className="profile-toggle-desc">Receive notifications when milestone tasks are completed.</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifMilestones !== false}
                      onChange={(e) => setForm((p) => ({ ...p, notifMilestones: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>

                <div className="profile-toggle-item">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title">Weekly Mentor Report Digest</span>
                    <span className="profile-toggle-desc">Get weekly performance summary of attendance, quizzes, and mentor notes.</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifWeeklyReport !== false}
                      onChange={(e) => setForm((p) => ({ ...p, notifWeeklyReport: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>

                <div className="profile-toggle-item">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title">AI Mock Interview Drill Reminders</span>
                    <span className="profile-toggle-desc">Remind 1 hour before scheduled AI technical mock drills & gap evaluation sessions.</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifInterview !== false}
                      onChange={(e) => setForm((p) => ({ ...p, notifInterview: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="profile-actions-bar">
              <button type="submit" onClick={handleSave} className="profile-save-btn">
                <Save size={16} /> Save Profile Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
