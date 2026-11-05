import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  User,
  Camera,
  GraduationCap,
  Building,
  Users,
  ShieldCheck,
  CheckCircle2,
  Save,
  Sparkles,
  Award,
  Key,
  QrCode,
  Copy,
  Loader2,
  X,
  Edit2,
  Mail,
  Phone,
  Database,
  AlertCircle,
  Calendar,
  Star,
  Video,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import CustomSelect from "../../../components/ui/CustomSelect";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import { apiFetch, getApiBaseUrl } from "../../../utils/api";
import "../Styles/MN_ProfilePage.css";

// ── Year Options for Mentors ──
const yearOptions = [
  { value: "1st Year (FE)", label: "1st Year (FE)" },
  { value: "2nd Year (SE)", label: "2nd Year (SE)" },
  { value: "3rd Year (TE)", label: "3rd Year (TE)" },
  { value: "Final Year (BE 2026)", label: "Final Year (BE 2026)" },
  { value: "Academic Year 2025-2026", label: "Academic Year 2025-2026" },
  { value: "Academic Year 2026-2027", label: "Academic Year 2026-2027" },
];

// ── Area of Expertise Options ──
const expertiseOptions = [
  { value: "Full Stack Development", label: "Full Stack Development" },
  { value: "Data Structures & Algorithms", label: "Data Structures & Algorithms" },
  { value: "AI & Machine Learning", label: "AI & Machine Learning" },
  { value: "Cloud Computing & DevOps", label: "Cloud Computing & DevOps" },
  { value: "Cybersecurity & Network Defense", label: "Cybersecurity & Network Defense" },
  { value: "Database Systems & SQL Optimization", label: "Database Systems & SQL Optimization" },
  { value: "Mobile Application Engineering", label: "Mobile Application Engineering" },
  { value: "Data Science & Big Data Analytics", label: "Data Science & Big Data Analytics" },
  { value: "Software Architecture & System Design", label: "Software Architecture & System Design" },
];

function MN_ProfilePage() {
  const fileInputRef = useRef(null);
  const [deptOptions, setDeptOptions] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, email: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleToast, setGoogleToast] = useState('');

  const checkGoogleStatus = () => {
    apiFetch("/google/auth/user-status")
      .then((res) => {
        if (res && res.success) {
          setGoogleStatus({
            connected: Boolean(res.connected),
            email: res.email || '',
          });
        }
      })
      .catch(() => {});
  };

  const handleConnectGoogle = () => {
    let localUser = {};
    try {
      localUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user")) || {};
    } catch {}

    const userId = localUser.id || localUser.userId || '';
    const apiBase = getApiBaseUrl().replace(/\/v1$/, '');
    const returnUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `${apiBase}/google/auth/login?userId=${userId}&returnTo=${returnUrl}`;
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Google account?")) return;
    try {
      setGoogleLoading(true);
      await apiFetch("/google/auth/disconnect", { method: "POST" });
      setGoogleStatus({ connected: false, email: '' });
      setGoogleToast("Google account disconnected successfully.");
    } catch (err) {
      console.error("Failed to disconnect Google:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const resolveUser = () => {
    let localUser = {};
    try {
      localUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
    } catch {}
    return localUser;
  };

  const initialUser = resolveUser();

  // Exactly the 6 profile fields requested
  const [form, setForm] = useState({
    name: initialUser.name || "Mentor",
    email: initialUser.email || "mentor@college.edu.in",
    mobile_number: initialUser.mobile_number || initialUser.phone || "",
    department: initialUser.department || "",
    current_year: initialUser.current_year || initialUser.currentYear || "Final Year (2026)",
    area_of_expertise: initialUser.area_of_expertise || initialUser.areaOfExpertise || initialUser.specialization || "Full Stack Development",
    role: initialUser.role || "Mentor",
    allocatedBatches: 0,
    totalStudents: 0,
    rating: 4.9,
  });

  useEffect(() => {
    // 1. Fetch live mentor profile directly from database
    checkGoogleStatus();
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("google_connected") === "true") {
        const email = urlParams.get("email");
        setGoogleToast(`Google Meet connected successfully${email ? ` (${decodeURIComponent(email)})` : ''}!`);
        window.history.replaceState({}, document.title, window.location.pathname);
        checkGoogleStatus();
      }
    }

    // 1. Fetch live mentor profile directly from database
    apiFetch("/mentor/profile")
      .then((res) => {
        const u = res?.data || res?.user || res;
        if (u) {
          setForm((prev) => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            mobile_number: u.mobile_number || u.phone || u.mobile || prev.mobile_number,
            department: u.department || prev.department,
            current_year: u.current_year || u.currentYear || prev.current_year,
            area_of_expertise: u.area_of_expertise || u.areaOfExpertise || u.specialization || prev.area_of_expertise,
            role: u.role || prev.role,
            allocatedBatches: u.allocatedBatches ?? prev.allocatedBatches,
            totalStudents: u.totalStudents ?? prev.totalStudents,
            rating: u.rating ?? prev.rating,
          }));
          if (u.avatarUrl || u.avatar_url) {
            setAvatarUrl(u.avatarUrl || u.avatar_url);
          }
        }
      })
      .catch(() => {
        // Fallback to /auth/me
        apiFetch("/auth/me")
          .then((res) => {
            if (res && (res.user || res.data)) {
              const u = res.user || res.data;
              setForm((prev) => ({
                ...prev,
                name: u.name || prev.name,
                email: u.email || prev.email,
                mobile_number: u.mobile_number || u.phone || prev.mobile_number,
                department: u.department || prev.department,
                current_year: u.current_year || u.currentYear || prev.current_year,
                area_of_expertise: u.area_of_expertise || u.areaOfExpertise || u.specialization || prev.area_of_expertise,
              }));
              if (u.avatarUrl || u.avatar_url) {
                setAvatarUrl(u.avatarUrl || u.avatar_url);
              }
            }
          })
          .catch(() => {});
      });

    
    apiFetch("/auth/me")
      .then((res) => {
        const u = res?.user || res?.data || res;
        if (u) {
        }
      })
      .catch(() => {});

    // 3. Fetch departments list for dropdown
    apiFetch("/departments")
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          const opts = list.map((d) => {
            const code = (d.code && d.code.trim()) || d.name;
            return { value: code, label: code };
          });
          setDeptOptions(opts);
        }
      })
      .catch(() => {});
  }, []);


  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save the 6 fields directly to MySQL Database
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        mobile_number: form.mobile_number,
        phone: form.mobile_number,
        department: form.department,
        current_year: form.current_year,
        currentYear: form.current_year,
        area_of_expertise: form.area_of_expertise,
        areaOfExpertise: form.area_of_expertise,
        specialization: form.area_of_expertise,
        avatar_url: avatarUrl,
        avatarUrl: avatarUrl,
      };

      // 1. Save directly to Mentor Profile API (MySQL Database)
      await apiFetch("/mentor/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // 2. Also sync current user in storage for instantaneous UI reactivity
      try {
        const stored = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...stored,
          name: form.name,
          email: form.email,
          mobile_number: form.mobile_number,
          department: form.department,
          current_year: form.current_year,
          area_of_expertise: form.area_of_expertise,
          avatar_url: avatarUrl,
        };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (_) {}

      // 3. Emit global event so Top Navbar and headers update instantly
      window.dispatchEvent(new Event("userProfileUpdated"));

      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error("Failed to save mentor profile:", err);
      setSaveError(err.message || "Failed to commit changes to database. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return "MN";
    const parts = nameStr.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <div className="ui-section-header-MN">
        <div className="ui-section-main">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 className="ui-section-title" style={{ margin: 0 }}>
                <User size={22} className="ui-section-title-icon" />
                <span>Mentor Profile & Settings</span>
              </h2>
            </div>
            <p className="ui-section-desc">
              Manage your mentor dossier, department affiliation, current cohort year, and area of expertise.
            </p>
          </div>
        </div>
      </div>

      {googleToast && (
        <div className="profile-alert-success" style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{googleToast}</span>
          </div>
          <button onClick={() => setGoogleToast('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {saved && (
        <div className="profile-alert-success" style={{ marginBottom: '18px' }}>
          <CheckCircle2 size={18} />
          <span>Mentor profile updated and saved to MySQL database successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="profile-alert-error">
          <AlertCircle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      <div className="profile-main-grid">
        {/* LEFT COLUMN: Dossier Card */}
        <div className="profile-dossier-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt={form.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials">{getInitials(form.name)}</div>
              )}
              {isEditing && (
                <button
                  type="button"
                  className="profile-camera-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload New Avatar Photo"
                >
                  <Camera size={14} />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="profile-file-input"
                disabled={!isEditing}
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="profile-name">{form.name}</h2>
            <div className="profile-roll-chip" style={{ marginBottom: '6px' }}>
              <ShieldCheck size={14} />
              <strong>{form.role}</strong>
            </div>

            <div className="profile-badges-wrap" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant="success">Active Mentor</Badge>
              {form.department && <Badge variant="default">{form.department}</Badge>}
            </div>

            {/* Quick Metrics Cards */}
            <div className="profile-stats-mini-row">
              <div className="profile-stat-mini-card">
                <span className="profile-stat-mini-num">{form.allocatedBatches || 0}</span>
                <span className="profile-stat-mini-label">Batches</span>
              </div>
              <div className="profile-stat-mini-card">
                <span className="profile-stat-mini-num">{form.totalStudents || 0}</span>
                <span className="profile-stat-mini-label">Students</span>
              </div>
              <div className="profile-stat-mini-card">
                <span className="profile-stat-mini-num" style={{ color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" /> {form.rating || 4.9}
                </span>
                <span className="profile-stat-mini-label">Rating</span>
              </div>
            </div>
          </div>

          <div className="profile-academic-divider" />

          {/* Academic & Mentor Dossier List: Exactly the 6 Fields */}
          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Mentor Dossier</h4>

            {/* 1. Full Name */}
            <div className="profile-detail-row">
              <User size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Full Name</span>
                <p className="profile-detail-value">{form.name}</p>
              </div>
            </div>

            {/* 2. Email */}
            <div className="profile-detail-row">
              <Mail size={16} className="profile-detail-icon text-blue-500" />
              <div>
                <span className="profile-detail-label">Email Address</span>
                <p className="profile-detail-value">{form.email}</p>
              </div>
            </div>

            {/* 3. Mobile Number */}
            <div className="profile-detail-row">
              <Phone size={16} className="profile-detail-icon text-emerald-500" />
              <div>
                <span className="profile-detail-label">Mobile Number</span>
                <p className="profile-detail-value">{form.mobile_number || "Not specified"}</p>
              </div>
            </div>

            {/* 4. Department */}
            <div className="profile-detail-row">
              <GraduationCap size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Department</span>
                <p className="profile-detail-value">{form.department}</p>
              </div>
            </div>

            {/* 5. Current Year */}
            <div className="profile-detail-row">
              <Calendar size={16} className="profile-detail-icon text-purple-500" />
              <div>
                <span className="profile-detail-label">Current Year</span>
                <p className="profile-detail-value">{form.current_year || "Final Year (2026)"}</p>
              </div>
            </div>

            {/* 6. Area of Expertise */}
            <div className="profile-detail-row">
              <Award size={16} className="profile-detail-icon profile-icon-indigo" />
              <div>
                <span className="profile-detail-label">Area of Expertise</span>
                <p className="profile-detail-value">{form.area_of_expertise || "Full Stack Development"}</p>
              </div>
            </div>

            {/* 7. Google Meet Status */}
            <div className="profile-detail-row">
              <Video size={16} className={`profile-detail-icon ${googleStatus.connected ? 'text-green-500' : 'profile-icon-slate'}`} />
              <div>
                <span className="profile-detail-label">Google Meet</span>
                <p className="profile-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {googleStatus.connected ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Connected</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>Not Connected</span>
                  )}
                </p>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="profile-change-pw-wrap">
              <button
                type="button"
                onClick={() => setShowChangePassModal(true)}
                className="profile-change-pw-btn"
              >
                <Key size={13} />
                <span>Change Password</span>
              </button>

              
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Profile Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            {isEditing && (
              <div className="profile-edit-banner-info">
                <Database size={16} />
                <span>Edit Mode Active: Modifying mentor profile. Click <strong>Save Profile</strong> to permanently commit updates to MySQL database.</span>
              </div>
            )}

            <div className="profile-form-section">
              <div className="profile-section-heading profile-section-heading-flex">
                <div className="profile-heading-group">
                  <User size={18} className="profile-heading-icon profile-icon-indigo" />
                  <div>
                    <h3 className="profile-heading-title">{isEditing ? "Edit Mentor Profile Details" : "Mentor Profile Details"}</h3>
                    <p className="profile-heading-desc">Saved directly to your mentor profile in the database.</p>
                  </div>
                </div>

                <div className="profile-heading-actions">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setSaveError("");
                      }}
                      className="profile-edit-trigger-btn"
                    >
                      <Edit2 size={15} /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setSaveError("");
                        }}
                        className="profile-cancel-btn"
                        disabled={saving}
                      >
                        <X size={15} /> Cancel
                      </button>
                      <button
                        type="submit"
                        className="profile-save-btn"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 size={15} className="animate-spin" /> Saving...
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

              {/* Exact 6 Fields Form Grid */}
              <div className="profile-form-grid">
                {/* 1. Full Name */}
                <div className="profile-field">
                  <label className="profile-label">Full Name *</label>
                  <div className="profile-input-wrapper">
                    <User size={16} className="profile-field-icon" />
                    <input
                      type="text"
                      className={`profile-input profile-input-with-icon ${!isEditing ? 'profile-input-readonly' : ''}`}
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      required
                    />
                  </div>
                </div>

                {/* 2. Email Address */}
                <div className="profile-field">
                  <label className="profile-label">Email *</label>
                  <div className="profile-input-wrapper">
                    <Mail size={16} className="profile-field-icon" />
                    <input
                      type="email"
                      className={`profile-input profile-input-with-icon ${!isEditing ? 'profile-input-readonly' : ''}`}
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      placeholder="mentor@college.edu.in"
                      required
                    />
                  </div>
                </div>

                {/* 3. Mobile Number */}
                <div className="profile-field">
                  <label className="profile-label">Mobile Number *</label>
                  <div className="profile-input-wrapper">
                    <Phone size={16} className="profile-field-icon" />
                    <input
                      type="tel"
                      className={`profile-input profile-input-with-icon ${!isEditing ? 'profile-input-readonly' : ''}`}
                      value={form.mobile_number}
                      onChange={(e) => setForm((p) => ({ ...p, mobile_number: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      placeholder="e.g. 7418529635"
                      required
                    />
                  </div>
                </div>

                {/* 4. Department */}
                <div className="profile-field">
                  <label className="profile-label">Department *</label>
                  <CustomSelect
                    value={form.department}
                    options={deptOptions.length > 0 ? deptOptions : [
                      { value: "Computer Engineering", label: "Computer Engineering" },
                      { value: "Information Technology", label: "Information Technology" },
                      { value: "Electronics & Telecommunication", label: "Electronics & Telecommunication" },
                      { value: "Artificial Intelligence & Data Science", label: "Artificial Intelligence & Data Science" },
                      { value: "Mechanical Engineering", label: "Mechanical Engineering" },
                      { value: "Civil Engineering", label: "Civil Engineering" },
                    ]}
                    disabled={!isEditing}
                    onChange={(val) => setForm((p) => ({ ...p, department: val }))}
                    placeholder="Select Department"
                    icon={Building}
                  />
                </div>

                {/* 5. Current Year */}
                <div className="profile-field">
                  <label className="profile-label">Current Year *</label>
                  <CustomSelect
                    value={form.current_year}
                    options={yearOptions}
                    disabled={!isEditing}
                    onChange={(val) => setForm((p) => ({ ...p, current_year: val }))}
                    placeholder="Select Current Year"
                    icon={Calendar}
                  />
                </div>

                {/* 6. Area of Expertise */}
                <div className="profile-field">
                  <label className="profile-label">Area of Expertise *</label>
                  <CustomSelect
                    value={form.area_of_expertise}
                    options={expertiseOptions}
                    disabled={!isEditing}
                    onChange={(val) => setForm((p) => ({ ...p, area_of_expertise: val }))}
                    placeholder="Select Area of Expertise"
                    icon={Award}
                  />
                </div>
              </div>

              {isEditing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSaveError("");
                    }}
                    className="profile-cancel-btn"
                    disabled={saving}
                  >
                    <X size={15} /> Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-save-btn"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Saving to Database...
                      </>
                    ) : (
                      <>
                        <Save size={15} /> Save All Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Integrations Section */}
          <div className="profile-google-section">
            <div className="profile-section-heading">
              <div className="profile-heading-group">
                <Video size={18} className="profile-heading-icon profile-icon-indigo" />
                <div>
                  <h3 className="profile-heading-title">Live Classes & Meeting Integration</h3>
                  <p className="profile-heading-desc">
                    Connect your Google account to automatically schedule and launch real Google Meet rooms for your students.
                  </p>
                </div>
              </div>
            </div>

            <div className={`profile-google-card ${googleStatus.connected ? 'profile-google-card--connected' : ''}`}>
              <div className="profile-google-card-left">
                <div className="profile-google-icon-box">
                  <Video size={20} color={googleStatus.connected ? "#16a34a" : "#4f46e5"} />
                </div>
                <div>
                  <div className="profile-google-title">
                    {googleStatus.connected ? (
                      <>
                        <CheckCircle2 size={16} color="#16a34a" />
                        <span>Google Meet Connected · <strong>{googleStatus.email}</strong></span>
                      </>
                    ) : (
                      <span>Google Meet & Calendar</span>
                    )}
                  </div>
                  <div className="profile-google-desc">
                    {googleStatus.connected
                      ? "Your Google account is active. When you schedule classes, live Google Meet rooms are created directly on your calendar."
                      : "Authorize once to automatically generate real Google Meet rooms for all your live classes and doubt sessions."}
                  </div>
                </div>
              </div>

              <div className="profile-google-actions">
                {googleStatus.connected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    disabled={googleLoading}
                    className="profile-google-btn-disconnect"
                  >
                    {googleLoading ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    className="profile-google-btn-connect"
                  >
                    <Video size={15} />
                    <span>Connect Google Meet</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
      />
      
    </div>
  );
}

export default MN_ProfilePage;
