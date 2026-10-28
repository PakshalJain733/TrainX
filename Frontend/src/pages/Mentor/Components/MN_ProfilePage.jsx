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
  MapPin,
  Clock,
  Award,
  BookOpen,
  Star,
  Key,
  QrCode,
  Copy,
  Loader2,
  X,
  Edit2,
  Mail,
  Phone,
  Briefcase,
  Database,
  AlertCircle,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { mentorProfile } from "../../../data/mentorMockData";
import CustomSelect from "../../../components/ui/CustomSelect";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_ProfilePage.css";

const specOptions = [
  { value: "Full Stack Development", label: "Full Stack Development" },
  { value: "Data Structures & Algorithms", label: "Data Structures & Algorithms" },
  { value: "AI & Machine Learning", label: "AI & Machine Learning" },
  { value: "Cloud & DevOps", label: "Cloud & DevOps" },
  { value: "Cybersecurity", label: "Cybersecurity" },
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

  const resolveUser = () => {
    let localUser = {};
    try { localUser = JSON.parse(sessionStorage.getItem("user")) || {}; } catch { }
    let name = localUser.name || localUser.fullName || localUser.full_name || mentorProfile?.name || "Mentor";
    let email = localUser.email || mentorProfile?.email || "mentor@pvppcoe.ac.in";
    return { name, email, ...localUser };
  };

  const initialUser = resolveUser();

  const [form, setForm] = useState({
    name: initialUser.name,
    email: initialUser.email,
    phone: initialUser.mobile_number || initialUser.phone || mentorProfile?.phone || "",
    department: initialUser.department || mentorProfile?.department || "Computer Engineering",
    specialization: initialUser.specialization || mentorProfile?.specialization || "Full Stack Development",
    role: initialUser.role || "Mentor",
    college: initialUser.college || mentorProfile?.college || "P.V.P.P. College of Engineering",
    officeLocation: initialUser.officeLocation || initialUser.office_location || mentorProfile?.officeLocation || "Room 304, Block A",
    officeHours: mentorProfile?.officeHours || "Mon-Fri 10:00 AM - 5:00 PM",
    allocatedBatches: mentorProfile?.allocatedBatches || 0,
    totalStudents: mentorProfile?.totalStudents || 0,
    rating: mentorProfile?.rating || 4.9,
    experience: initialUser.experience || mentorProfile?.experience || "5+ Years",
    empId: initialUser.empId || initialUser.emp_id || initialUser.employee_id || "EMP-MN-201",
  });

  useEffect(() => {
    // 1. Fetch live mentor profile directly from database
    apiFetch("/mentor/profile")
      .then((res) => {
        const u = res?.data || res?.user || res;
        if (u) {
          setForm((prev) => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            phone: u.phone || u.mobile || u.mobile_number || prev.phone,
            department: u.department || prev.department,
            specialization: u.specialization || prev.specialization,
            role: u.role || prev.role,
            college: u.college || prev.college,
            officeLocation: u.officeLocation || u.office_location || prev.officeLocation,
            officeHours: u.officeHours || prev.officeHours,
            experience: u.experience || prev.experience,
            empId: u.empId || u.employee_id || prev.empId,
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
                phone: u.mobile_number || u.phone || prev.phone,
                department: u.department || prev.department,
                specialization: u.specialization || prev.specialization,
                empId: u.empId || u.employee_id || prev.empId,
                officeLocation: u.officeLocation || u.office_location || prev.officeLocation,
                experience: u.experience || prev.experience,
              }));
              if (u.avatarUrl || u.avatar_url) {
                setAvatarUrl(u.avatarUrl || u.avatar_url);
              }
            }
          })
          .catch(() => {});
      });

    // 2. Fetch auth user to verify 2FA status
    apiFetch("/auth/me")
      .then((res) => {
        const u = res?.user || res?.data || res;
        if (u) {
          setIs2FAEnabled(Boolean(u.two_factor_enabled || u.two_factor_secret));
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

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        mobile_number: form.phone,
        department: form.department,
        specialization: form.specialization,
        role: form.role,
        employee_id: form.empId,
        empId: form.empId,
        office_location: form.officeLocation,
        officeLocation: form.officeLocation,
        experience: form.experience,
        avatar_url: avatarUrl,
        avatarUrl: avatarUrl,
      };

      // 1. Save directly to Mentor Profile API (MySQL Database)
      await apiFetch("/mentor/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // 2. Also sync current user in sessionStorage for instantaneous UI reactivity
      try {
        const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
        const updatedUser = {
          ...stored,
          name: form.name,
          email: form.email,
          mobile_number: form.phone,
          department: form.department,
          specialization: form.specialization,
          employee_id: form.empId,
          empId: form.empId,
          office_location: form.officeLocation,
          officeLocation: form.officeLocation,
          experience: form.experience,
          avatar_url: avatarUrl,
        };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
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
              Manage your mentor dossier, office availability, academic specialization, and security credentials.
            </p>
          </div>
        </div>
      </div>

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
              <Badge variant="default">{form.department || "Computer Engineering"}</Badge>
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

          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Academic Dossier</h4>

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
              <Award size={16} className="profile-detail-icon profile-icon-indigo" />
              <div>
                <span className="profile-detail-label">Specialization</span>
                <p className="profile-detail-value">{form.specialization}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Users size={16} className="profile-detail-icon profile-icon-emerald" />
              <div>
                <span className="profile-detail-label">Assigned Mentee Scope</span>
                <p className="profile-detail-value">{form.allocatedBatches} Batches · {form.totalStudents} Mentees</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <MapPin size={16} className="profile-detail-icon text-purple-500" />
              <div>
                <span className="profile-detail-label">Office Cabin Location</span>
                <p className="profile-detail-value">{form.officeLocation}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Clock size={16} className="profile-detail-icon text-blue-500" />
              <div>
                <span className="profile-detail-label">Office Availability</span>
                <p className="profile-detail-value">{form.officeHours}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Award size={16} className="profile-detail-icon text-amber-500" />
              <div>
                <span className="profile-detail-label">Teaching Experience</span>
                <p className="profile-detail-value">{form.experience}</p>
              </div>
            </div>

            {/* Change Password & 2FA Buttons */}
            <div className="profile-change-pw-wrap">
              <button
                type="button"
                onClick={() => setShowChangePassModal(true)}
                className="profile-change-pw-btn"
              >
                <Key size={13} />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={handleOpen2FASetup}
                className="profile-2fa-setup-btn"
              >
                <ShieldCheck size={13} />
                <span>{is2FAEnabled ? "2FA Enabled" : "Pair 2FA"}</span>
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
                <span>Edit Mode Active: Modifying profile fields. Click <strong>Save Profile</strong> to permanently commit updates to MySQL database.</span>
              </div>
            )}

            <div className="profile-form-section">
              <div className="profile-section-heading profile-section-heading-flex">
                <div className="profile-heading-group">
                  <User size={18} className="profile-heading-icon profile-icon-indigo" />
                  <div>
                    <h3 className="profile-heading-title">{isEditing ? "Edit Personal & Contact Details" : "Personal & Contact Details"}</h3>
                    <p className="profile-heading-desc">Saved directly to your mentor profile in MySQL database.</p>
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

              <div className="profile-form-grid">
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

                <div className="profile-field">
                  <label className="profile-label">Email Address *</label>
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

                <div className="profile-field">
                  <label className="profile-label">Phone Number *</label>
                  <div className="profile-input-wrapper">
                    <Phone size={16} className="profile-field-icon" />
                    <input
                      type="text"
                      className={`profile-input profile-input-with-icon ${!isEditing ? 'profile-input-readonly' : ''}`}
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <div className="profile-heading-group">
                  <Sparkles size={18} className="profile-heading-icon profile-icon-indigo" />
                  <div>
                    <h3 className="profile-heading-title">Specialization & Academic Governance</h3>
                    <p className="profile-heading-desc">Configure your primary domain expertise, department, employee ID, and office cabin location.</p>
                  </div>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-field">
                  <label className="profile-label">Official Title / Role *</label>
                  <div className="profile-input-wrapper">
                    <Briefcase size={16} className="profile-field-icon" />
                    <input
                      type="text"
                      className={`profile-input profile-input-with-icon ${!isEditing ? 'profile-input-readonly' : ''}`}
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      placeholder="e.g. Senior Mentor / Professor"
                      required
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">Primary Specialization *</label>
                  <CustomSelect
                    value={form.specialization}
                    options={specOptions}
                    disabled={!isEditing}
                    onChange={(val) => setForm((p) => ({ ...p, specialization: val }))}
                    placeholder="Select Specialization"
                    icon={Award}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Department *</label>
                  <CustomSelect
                    value={form.department}
                    options={deptOptions.length > 0 ? deptOptions : [
                      { value: "Computer Engineering", label: "Computer Engineering" },
                      { value: "Information Technology", label: "Information Technology" },
                      { value: "Electronics & Telecommunication", label: "Electronics & Telecommunication" },
                      { value: "Artificial Intelligence & Data Science", label: "Artificial Intelligence & Data Science" },
                    ]}
                    disabled={!isEditing}
                    onChange={(val) => setForm((p) => ({ ...p, department: val }))}
                    placeholder="Select Department"
                    icon={Building}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Employee / Staff ID *</label>
                  <div className="profile-input-wrapper">
                    <Key size={16} className="profile-field-icon" />
                    <input
                      type="text"
                      className={`profile-input profile-input-with-icon ${!isEditing ? 'profile-input-readonly' : ''}`}
                      value={form.empId}
                      onChange={(e) => setForm((p) => ({ ...p, empId: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      placeholder="e.g. EMP-MN-201"
                      required
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">Office Location / Cabin</label>
                  <div className="profile-input-wrapper">
                    <MapPin size={16} className="profile-field-icon" />
                    <input
                      type="text"
                      className={`profile-input profile-input-with-icon ${!isEditing ? 'profile-input-readonly' : ''}`}
                      value={form.officeLocation}
                      onChange={(e) => setForm((p) => ({ ...p, officeLocation: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      placeholder="e.g. Faculty Block C, Room 302"
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">Teaching Experience</label>
                  <div className="profile-input-wrapper">
                    <Clock size={16} className="profile-field-icon" />
                    <input
                      type="text"
                      className={`profile-input profile-input-with-icon ${!isEditing ? 'profile-input-readonly' : ''}`}
                      value={form.experience}
                      onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      placeholder="e.g. 6+ Years Teaching & Industry"
                    />
                  </div>
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
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
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
                      <QrCode size={40} className="profile-2fa-qr-icon" />
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
                        {copiedSecret ? <Check size={12} className="profile-copy-check-icon" /> : <Copy size={12} />}
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

export default MN_ProfilePage;