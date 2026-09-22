import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Camera,
  Mail,
  Phone,
  Building,
  Briefcase,
  CheckCircle2,
  Save,
  ShieldCheck,
  Key,
  AlertCircle,
  Bell,
  Globe,
  QrCode,
  Copy,
  Check,
  Loader2,
  X
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/SA_Profile.css";

export default function SuperAdminProfile() {
  const fileInputRef = useRef(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // 2FA Google Authenticator State
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [loading2FASetup, setLoading2FASetup] = useState(false);
  const [totpData, setTotpData] = useState(null); // { secret, qrCode, email }
  const [totpCodeInput, setTotpCodeInput] = useState(["", "", "", "", "", ""]);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [totpSuccess, setTotpSuccess] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const totpInputRefs = useRef([]);

  const [form, setForm] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        name: stored.name || "Super Admin",
        email: stored.email || "training.portal0987@gmail.com",
        phone: stored.mobile_number || stored.phone || "+91 12345 67890",
        role: "Super Administrator",
        region: "Mumbai, Maharashtra",
        organization: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
        notifSystemAlerts: true,
        notifWeeklyReport: true,
        notifNewUsers: true,
      };
    } catch (e) {
      return {
        name: "Super Admin",
        email: "training.portal0987@gmail.com",
        phone: "+91 98765 43210",
        role: "Super Administrator",
        region: "Mumbai, Maharashtra",
        organization: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
        notifSystemAlerts: true,
        notifWeeklyReport: true,
        notifNewUsers: true,
      };
    }
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
            role: u.role ? (u.role.toLowerCase().includes("super") ? "Super Administrator" : u.role.toUpperCase()) : prev.role,
          }));
          setIs2FAEnabled(Boolean(u.two_factor_enabled || u.two_factor_secret));
        }
      })
      .catch(() => {});
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setProfileSaved(false);

    try {
      await apiFetch("/admin/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          mobile_number: form.phone,
        }),
      });

      window.dispatchEvent(new Event("userProfileUpdated"));

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 4000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update profile details in database.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Account Governance"
        title="Super Admin Profile & Security"
        description="Manage your account profile, contact credentials, and security settings."
      />

      {profileSaved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Super Admin profile updated and saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="profile-main-grid">
        {/* LEFT COLUMN: Dossier Card */}
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
                title="Change Avatar Image"
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
              <ShieldCheck size={14} />
              <strong>{form.role}</strong>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="success">Active Governance</Badge>
              <Badge variant="default">Super Admin</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Account Overview</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Institution</span>
                <p className="profile-detail-value">{form.organization}</p>
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
              <Mail size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Database Email</span>
                <p className="profile-detail-value">{form.email}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Phone size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Contact Phone</span>
                <p className="profile-detail-value">{form.phone}</p>
              </div>
            </div>

            <div className="profile-change-pw-wrap flex flex-col gap-2.5 mt-4" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="profile-change-pw-btn"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <Key size={16} />
                Change Password
              </button>

              <button
                type="button"
                className="profile-2fa-setup-btn"
                onClick={handleOpen2FASetup}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: is2FAEnabled ? "#ecfdf5" : "#4f46e5",
                  color: is2FAEnabled ? "#047857" : "#ffffff",
                  border: is2FAEnabled ? "1.5px solid #a7f3d0" : "none",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(79, 70, 229, 0.15)",
                  transition: "all 0.2s ease"
                }}
              >
                <QrCode size={16} />
                {is2FAEnabled ? "Reconfigure Google 2FA QR Code" : "Setup Google Authenticator 2FA"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Profile Details Form */}
        <div className="profile-form-card">
          <div className="profile-form-section">
            <div className="profile-section-heading">
              <User size={18} className="profile-heading-icon text-indigo-500" />
              <div>
                <h3 className="profile-heading-title">Personal & Contact Details</h3>
                <p className="profile-heading-desc">Saved directly to your user account record in MySQL database.</p>
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
                <label className="profile-label">Role / Designation</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.role}
                  disabled
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Institution / Organization</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.organization}
                  onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Office Hours / Availability</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.officeHours || "Mon - Sat, 09:00 AM - 06:00 PM"}
                  onChange={(e) => setForm((p) => ({ ...p, officeHours: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Emergency Administrative Desk</label>
                <input
                  type="text"
                  className="profile-input"
                  value={form.emergencyDesk || "Room 501, Central Governance Building"}
                  onChange={(e) => setForm((p) => ({ ...p, emergencyDesk: e.target.value }))}
                />
              </div>
            </div>

            {/* Alert Preferences */}
            <div className="sa-profile-alerts-section">
              <div className="sa-profile-alerts-header">
                <Bell size={16} className="sa-profile-alert-icon" />
                <h4 className="sa-profile-alert-heading">Alert Preferences</h4>
              </div>

              <div className="profile-toggle-list profile-toggle-list-sm">
                <div className="profile-toggle-item profile-toggle-item-sm">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title profile-toggle-title-sm">System Security Alerts</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifSystemAlerts}
                      onChange={(e) => setForm((p) => ({ ...p, notifSystemAlerts: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>

                <div className="profile-toggle-item profile-toggle-item-sm">
                  <div className="profile-toggle-text">
                    <span className="profile-toggle-title profile-toggle-title-sm">Weekly Audit Digest</span>
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
                    <span className="profile-toggle-title profile-toggle-title-sm">New User Enrollment</span>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={form.notifNewUsers}
                      onChange={(e) => setForm((p) => ({ ...p, notifNewUsers: e.target.checked }))}
                    />
                    <span className="profile-slider round" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-actions-bar">
            <button type="submit" className="profile-save-btn">
              <Save size={16} /> Save Profile Changes
            </button>
          </div>
        </div>
      </form>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Google Authenticator 2FA Modal */}
      {is2FASetupOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", inset: 0 }}>
          <div className="modal-dialog" style={{ maxWidth: "480px", width: "90%", background: "#ffffff", padding: "24px 28px", borderRadius: "16px", textAlign: "left", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Google Authenticator 2FA</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Scan QR code to pair your account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIs2FASetupOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {loading2FASetup ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#4f46e5" }} />
                <p style={{ fontSize: "13px", margin: 0 }}>Generating Google Authenticator QR Code...</p>
              </div>
            ) : (
              <form onSubmit={handleVerify2FASubmit}>
                {totpError && (
                  <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", fontSize: "12px", fontWeight: "600", marginBottom: "14px" }}>
                    {totpError}
                  </div>
                )}

                {totpSuccess && (
                  <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", fontSize: "12px", fontWeight: "600", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} />
                    <span>{totpSuccess}</span>
                  </div>
                )}

                {/* QR Code Container */}
                <div style={{ textAlign: "center", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  {totpData?.qrCode ? (
                    <img
                      src={totpData.qrCode}
                      alt="Google Authenticator QR Code"
                      style={{ width: "160px", height: "160px", margin: "0 auto 8px auto", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  ) : (
                    <div style={{ width: "160px", height: "160px", background: "#e2e8f0", borderRadius: "8px", margin: "0 auto 8px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <QrCode size={40} className="text-slate-400" />
                    </div>
                  )}
                  <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0, fontWeight: "500" }}>
                    Open <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> app on your phone and scan this QR code.
                  </p>
                </div>

                {/* Secret Key Copy Bar */}
                {totpData?.secret && (
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                      Or enter Secret Key manually:
                    </label>
                    <div style={{ display: "flex", alignItems: "center", background: "#f1f5f9", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "6px 10px" }}>
                      <code style={{ fontSize: "12px", fontWeight: "700", color: "#334155", letterSpacing: "0.1em", flex: 1, fontFamily: "monospace" }}>
                        {totpData.secret.match(/.{1,4}/g)?.join(" ") || totpData.secret}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", fontWeight: "600", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        {copiedSecret ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copiedSecret ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 6-Digit Code Input */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "8px" }}>
                    Enter 6-Digit Authenticator Verification Code:
                  </label>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }} onPaste={handleTotpPaste}>
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
                        style={{
                          width: "42px",
                          height: "46px",
                          fontSize: "18px",
                          fontWeight: "800",
                          textAlign: "center",
                          borderRadius: "8px",
                          border: "1.5px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0f172a",
                          outline: "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setIs2FASetupOpen(false)}
                    style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                    disabled={verifying2FA}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "#4f46e5", color: "#ffffff", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
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
