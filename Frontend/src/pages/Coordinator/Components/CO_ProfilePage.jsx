import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  KeyRound,
  QrCode,
  Copy,
  Check,
  Loader2,
  X,
  Edit2
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { coordinatorProfile } from "../../../data/coordinatorMockData";
import CustomSelect from "../../../components/ui/CustomSelect";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import { apiFetch } from "../../../utils/api";
import "../Styles/CO_ProfilePage.css";

const deptOptions = [
  { value: "Computer Engineering", label: "Computer Engineering" },
  { value: "Information Technology", label: "Information Technology" },
  { value: "Artificial Intelligence & Data Science", label: "Artificial Intelligence & Data Science" },
  { value: "Electronics & Telecommunication", label: "Electronics & Telecommunication" },
  { value: "Mechanical Engineering", label: "Mechanical Engineering" },
];

export default function CoordinatorProfilePage() {
  const fileInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
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
    let name = localUser.name || localUser.fullName || localUser.full_name || coordinatorProfile?.name || "Department Coordinator";
    let email = localUser.email || coordinatorProfile?.email || "coordinator@pvppcoe.ac.in";
    return { name, email, ...localUser };
  };

  const initialUser = resolveUser();

  const [form, setForm] = useState({
    name: initialUser.name,
    email: initialUser.email,
    phone: initialUser.mobile_number || coordinatorProfile?.phone || "",
    department: initialUser.department || coordinatorProfile?.department || "Computer Engineering",
    role: "Department Coordinator",
    college: coordinatorProfile?.college || "P.V.P.P. College of Engineering",
    officeLocation: coordinatorProfile?.officeLocation || "Room 402, Block B",
    officeHours: coordinatorProfile?.officeHours || "Mon-Fri 10:00 AM - 5:00 PM",
    managedBatches: coordinatorProfile?.managedBatches || 0,
    totalStudents: coordinatorProfile?.totalStudents || 0,
    skills: Array.isArray(coordinatorProfile?.skills) ? coordinatorProfile.skills.join(", ") : (coordinatorProfile?.skills || ""),
    bio: coordinatorProfile?.bio || "",
    empId: initialUser.empId || initialUser.emp_id || initialUser.employee_id || "EMP-CO-101",
    notifBatchAlerts: coordinatorProfile?.notifications?.notifBatchAlerts ?? true,
    notifWeeklyReport: coordinatorProfile?.notifications?.notifWeeklyReport ?? true,
    notifNewStudents: coordinatorProfile?.notifications?.notifNewStudents ?? true,
  });

  useEffect(() => {
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
          }));
          setIs2FAEnabled(Boolean(u.two_factor_enabled || u.two_factor_secret));
        }
      })
      .catch(() => { });
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
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/admin/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
        }),
      });

      window.dispatchEvent(new Event("userProfileUpdated"));

      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save coordinator profile:", err);
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return "CO";
    const parts = nameStr.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <div className="ui-section-header-CO">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <span>Coordinator Profile & Settings</span>
            </h2>
            <p className="ui-section-desc">
              Manage your coordinator dossier, assigned department scope, and notification preferences.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile updated and saved successfully!</span>
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
                  title="Change Avatar Image"
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
            <div className="profile-roll-chip">
              <ShieldCheck size={14} />
              <strong>{form.role}</strong>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="success">Active Coordinator</Badge>
              <Badge variant="default">{form.department || "Engineering"}</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Scope Overview</h4>

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
              <ShieldCheck size={16} className="profile-detail-icon text-indigo-500" />
              <div>
                <span className="profile-detail-label">Designation & Role</span>
                <p className="profile-detail-value font-semibold text-indigo-600 dark:text-indigo-400">{form.role}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Users size={16} className="profile-detail-icon text-emerald-500" />
              <div>
                <span className="profile-detail-label">Managed Scope</span>
                <p className="profile-detail-value">{form.managedBatches} · {form.totalStudents}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <MapPin size={16} className="profile-detail-icon text-amber-500" />
              <div>
                <span className="profile-detail-label">Office Location</span>
                <p className="profile-detail-value">{form.officeLocation}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Clock size={16} className="profile-detail-icon text-purple-500" />
              <div>
                <span className="profile-detail-label">Office Hours</span>
                <p className="profile-detail-value">{form.officeHours}</p>
              </div>
            </div>

            {/* Change Password & 2FA Buttons */}
            <div className="profile-actions-wrapper">
              <button
                type="button"
                onClick={() => setShowChangePassModal(true)}
                className="profile-change-pass-btn"
              >
                <span>Change Password</span>
              </button>


            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Profile Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            <div className="profile-form-section">
              <div className="profile-section-heading profile-section-heading-flex">
                <div className="profile-heading-group">
                  <User size={18} className="profile-heading-icon text-indigo-500" />
                  <div>
                    <h3 className="profile-heading-title">{isEditing ? "Edit Personal & Contact Details" : "Personal & Contact Details"}</h3>
                    <p className="profile-heading-desc">Saved directly to your coordinator profile in MySQL database.</p>
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Office Hours</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.officeHours}
                    onChange={(e) => setForm((p) => ({ ...p, officeHours: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    placeholder="e.g. Mon-Fri 10:00 AM - 5:00 PM"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Departmental & Role Governance (SHIFTED DOWN) */}
            <div className="profile-form-section mt-6">
              <div className="profile-section-heading">
                <Sparkles size={18} className="profile-heading-icon text-indigo-500" />
                <div>
                  <h3 className="profile-heading-title">Departmental & Role Governance</h3>
                  <p className="profile-heading-desc">Enter your designation, department, employee ID, and office cabin location.</p>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-field">
                  <label className="profile-label">Official Designation / Title *</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Department *</label>
                  <CustomSelect
                    value={form.department}
                    options={deptOptions}
                    disabled={!isEditing}
                    onChange={(val) => setForm((p) => ({ ...p, department: val }))}
                    placeholder="Select Department"
                    icon={Building}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Employee / Staff ID *</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.empId}
                    onChange={(e) => setForm((p) => ({ ...p, empId: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Office Location / Cabin</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.officeLocation}
                    onChange={(e) => setForm((p) => ({ ...p, officeLocation: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    placeholder="e.g. Room 402, Block B"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            {isEditing && (
              <div className="profile-actions-bar">
                <button type="submit" className="profile-save-btn">
                  <Save size={16} /> Save Profile Details
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassModal && (
        <ChangePasswordModal onClose={() => setShowChangePassModal(false)} />
      )}

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
