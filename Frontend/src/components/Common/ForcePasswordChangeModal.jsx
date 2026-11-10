import React, { useState, useEffect } from "react";
import { getApiBaseUrl } from "../../utils/api";

const Icons = {
  lock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  shieldAlert: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function ForcePasswordChangeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const checkUserStatus = () => {
    try {
      const userRaw = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.force_password_change === true || u.force_password_change === 1 || u.forcePasswordChange === true) {
          setCurrentUser(u);
          setIsOpen(true);
          return;
        }
      }
      setIsOpen(false);
    } catch (_) {}
  };

  useEffect(() => {
    checkUserStatus();
    const interval = setInterval(checkUserStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && passwordsMatch && currentPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword) {
      setErrorMsg("Please enter your current temporary password.");
      return;
    }
    if (!isFormValid) {
      setErrorMsg("Please ensure your new password satisfies all security criteria.");
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg("New password must be different from your temporary password.");
      return;
    }

    setLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");

      const res = await fetch(`${baseUrl}/auth/force-change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to update password. Please check your current password and try again.");
        return;
      }

      setSuccessMsg("Permanent password set successfully! Unlocking your workspace...");

      // Update stored user object so force_password_change is false
      if (currentUser) {
        const updated = {
          ...currentUser,
          force_password_change: 0,
          forcePasswordChange: false,
        };
        if (sessionStorage.getItem("user")) {
          sessionStorage.setItem("user", JSON.stringify(updated));
        }
        if (localStorage.getItem("user")) {
          localStorage.setItem("user", JSON.stringify(updated));
        }
      }

      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (_) {
      setErrorMsg("Network error connecting to authentication server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            color: "#ffffff",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
            }}
          >
            {Icons.lock}
          </div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700 }}>
            Change Your Temporary Password
          </h2>
          <p style={{ margin: 0, color: "#c7d2fe", fontSize: "13.5px", lineHeight: 1.5 }}>
            Welcome to TrainX! For your account security, you must set a permanent password before accessing your dashboard.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {errorMsg && (
            <div
              style={{
                background: "#fef2f2",
                borderLeft: "4px solid #ef4444",
                padding: "12px 14px",
                borderRadius: "6px",
                color: "#991b1b",
                fontSize: "13px",
                marginBottom: "16px",
                lineHeight: 1.5,
              }}
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: "#f0fdf4",
                borderLeft: "4px solid #22c55e",
                padding: "12px 14px",
                borderRadius: "6px",
                color: "#166534",
                fontSize: "13px",
                marginBottom: "16px",
                lineHeight: 1.5,
              }}
            >
              {successMsg}
            </div>
          )}

          {/* Current Temporary Password */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              Current Temporary Password *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password from email"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 42px 10px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                {showCurrent ? Icons.eyeOff : Icons.eye}
              </button>
            </div>
          </div>

          {/* New Permanent Password */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              New Permanent Password *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 42px 10px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                {showNew ? Icons.eyeOff : Icons.eye}
              </button>
            </div>
          </div>

          {/* Confirm Permanent Password */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              Confirm Permanent Password *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 42px 10px 12px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                {showConfirm ? Icons.eyeOff : Icons.eye}
              </button>
            </div>
          </div>

          {/* Criteria Checklist */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "20px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            <div style={{ fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              Password Requirements:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              <div style={{ color: hasMinLength ? "#16a34a" : "#64748b", fontWeight: hasMinLength ? 600 : 400 }}>
                {hasMinLength ? "✓" : "•"} Min 8 characters
              </div>
              <div style={{ color: hasUppercase ? "#16a34a" : "#64748b", fontWeight: hasUppercase ? 600 : 400 }}>
                {hasUppercase ? "✓" : "•"} 1 Uppercase (A-Z)
              </div>
              <div style={{ color: hasLowercase ? "#16a34a" : "#64748b", fontWeight: hasLowercase ? 600 : 400 }}>
                {hasLowercase ? "✓" : "•"} 1 Lowercase (a-z)
              </div>
              <div style={{ color: hasNumber ? "#16a34a" : "#64748b", fontWeight: hasNumber ? 600 : 400 }}>
                {hasNumber ? "✓" : "•"} 1 Number (0-9)
              </div>
              <div style={{ color: hasSpecial ? "#16a34a" : "#64748b", fontWeight: hasSpecial ? 600 : 400 }}>
                {hasSpecial ? "✓" : "•"} 1 Special character
              </div>
              <div style={{ color: passwordsMatch ? "#16a34a" : "#64748b", fontWeight: passwordsMatch ? 600 : 400 }}>
                {passwordsMatch ? "✓" : "•"} Passwords match
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            style={{
              width: "100%",
              background: isFormValid ? "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)" : "#cbd5e1",
              color: "#ffffff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isFormValid ? "pointer" : "not-allowed",
              boxShadow: isFormValid ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "Updating Password..." : "Set Permanent Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

