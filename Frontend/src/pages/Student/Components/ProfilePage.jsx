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
          batch: u.batch || "",
          college: u.college || "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
          coordinator: u.coordinator || "",
          mentor: u.mentor || "",
          track: u.track || "",
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
            semester: user.semester || prev.semester,
            cgpa: user.cgpa || user.aggregate_cgpa || prev.cgpa,
            skills: user.skills || prev.skills,
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

  const handleSave = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...form,
      profileCompleted: true,
    };
    
    setForm(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("userProfileUpdated"));

    // Async backend save
    apiFetch("/students/profile", {
      method: "PATCH",
      body: JSON.stringify({
        semester: form.semester,
        cgpa: form.cgpa,
        skills: form.skills,
        track: form.track,
      }),
    }).catch(() => {});

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
            {/* Section 1: Update Academic Profile */}
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <Sparkles size={18} className="profile-heading-icon text-indigo-500" />
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
                  <select
                    className="profile-input profile-select"
                    value={form.track}
                    onChange={(e) => setForm((p) => ({ ...p, track: e.target.value }))}
                    required
                  >
                    <option value="Python Backend Developer">Python Backend Developer</option>
                    <option value="React Frontend Developer">React Frontend Developer</option>
                    <option value="Full Stack Engineer">Full Stack Engineer</option>
                    <option value="Data Science & AI Engineer">Data Science & AI Engineer</option>
                    <option value="Cloud & DevOps Specialist">Cloud & DevOps Specialist</option>
                  </select>
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
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Or type a custom skill (e.g. OpenCV, Kubernetes)..."
                      className="profile-input flex-1"
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
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1 transition-colors flex-shrink-0 shadow-sm"
                      onClick={handleAddCustomSkill}
                    >
                      <Plus size={14} /> Add Skill
                    </button>
                  </div>

                  {/* Crisp White / Light Skill Container */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block mb-2.5">
                      Selected Skills ({currentSkillsList.length}):
                    </span>
                    {currentSkillsList.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">Please select at least 1 skill from the dropdown above.</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentSkillsList.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
                          >
                            {skill}
                            <button
                              type="button"
                              className="hover:bg-indigo-800 p-0.5 rounded-full text-indigo-100 transition-colors"
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

            {/* Section 2: Personal Contact Details */}
            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <User size={18} className="profile-heading-icon" />
                <div>
                  <h3 className="profile-heading-title">Personal Contact Details</h3>
                  <p className="profile-heading-desc">Used for mentor notifications and training drive updates.</p>
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
