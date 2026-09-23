import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoMain from "../../assets/Logo.png";
import Logo from "../../assets/Logo2.png";
import { getApiBaseUrl } from "../../utils/api";

import "./login.css";

/* ── Reusable SVG icons ─────────────────────────────── */
const Icons = {
  email: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  lock: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  key: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-1.5 1.5L14 9.5" />
      <path d="M15.5 7.5 17 9" />
      <circle cx="7.5" cy="16.5" r="5.5" />
    </svg>
  ),
  send: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  shield: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  edit: (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  eye: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  google: (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  ),
};

/* ── Label with inline icon ─────────────────────────── */
function FieldLabel({ icon, children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="login-label-with-icon">
      <span className="login-label-icon">{icon}</span>
      <span className="login-label-text">{children}</span>
    </label>
  );
}

function Login() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState("password"); // "password" | "otp"
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pendingUserData, setPendingUserData] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  const API_BASE_URL = `${getApiBaseUrl()}/auth`;

  useEffect(() => {
    const isRemembered = sessionStorage.getItem("tx_remember_me") === "true";
    if (isRemembered) {
      const savedEmail = sessionStorage.getItem("tx_remembered_email") || "";
      const savedPassword = sessionStorage.getItem("tx_remembered_password") || "";
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleRememberMeChange = (checked) => {
    setRememberMe(checked);
    if (!checked) {
      sessionStorage.removeItem("tx_remember_me");
      sessionStorage.removeItem("tx_remembered_email");
      sessionStorage.removeItem("tx_remembered_password");
    }
  };

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setErrorMsg("");
    setSuccessMsg("");
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setPendingUserData(null);
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOtp }),
      });
      const data = await response.json();
      if (data.success) {
        setStep("new_password");
        setSuccessMsg("OTP verified successfully! Please enter your new password below.");
      } else {
        setErrorMsg(data.message || "Invalid or expired OTP code. Please check and try again.");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setErrorMsg("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: fullOtp,
          newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg("Password reset successfully! You can now log in with your new password.");
        setTimeout(() => {
          handleModeSwitch("password");
        }, 2000);
      } else {
        setErrorMsg(data.message || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setErrorMsg("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  const handlePostLoginRedirect = (serverUser) => {
    let existingUser = {};
    try { existingUser = JSON.parse(sessionStorage.getItem("user")) || {}; } catch { }

    let finalName = serverUser.name || existingUser.name || serverUser.email?.split("@")[0] || "Student";

    const mergedUser = {
      ...existingUser,
      ...serverUser,
      name: finalName,
    };

    sessionStorage.setItem("user", JSON.stringify(mergedUser));

    // Set flag for First Login Profile Update Alert
    const userKey = mergedUser.id || mergedUser.email;
    const isUpdatedInStorage = sessionStorage.getItem(`profile_updated_${userKey}`) === "true";
    const isUpdatedOnServer = Boolean(
      mergedUser.is_profile_updated ||
      mergedUser.profileCompleted ||
      mergedUser.studentProfile?.is_profile_updated ||
      (mergedUser.department && mergedUser.semester && mergedUser.roll_number && (mergedUser.skills || mergedUser.studentProfile?.skills)) ||
      (mergedUser.studentProfile?.department && mergedUser.studentProfile?.semester && mergedUser.studentProfile?.roll_number && (mergedUser.skills || mergedUser.studentProfile?.skills))
    );

    if (isUpdatedOnServer || isUpdatedInStorage) {
      if (userKey) sessionStorage.setItem(`profile_updated_${userKey}`, "true");
      sessionStorage.removeItem("showFirstLoginAlert");
    } else {
      sessionStorage.setItem("showFirstLoginAlert", "true");
    }

    const role = mergedUser.role?.toLowerCase() || "";
    if (role.includes("superadmin") || role.includes("super admin") || role.includes("super_admin")) {
      navigate("/super-admin");
    } else if (role.includes("coordinator")) {
      navigate("/coordinator");
    } else if (role.includes("admin")) {
      navigate("/admin");
    } else if (role.includes("mentor") || role.includes("faculty")) {
      navigate("/mentor");
    } else {
      navigate("/student");
    }
  };

  // ── Password Login Handler ─────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    if (rememberMe) {
      sessionStorage.setItem("tx_remember_me", "true");
      sessionStorage.setItem("tx_remembered_email", email);
      sessionStorage.setItem("tx_remembered_password", password);
    } else {
      sessionStorage.removeItem("tx_remember_me");
      sessionStorage.removeItem("tx_remembered_email");
      sessionStorage.removeItem("tx_remembered_password");
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/login-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        setPendingUserData(data.data);
        setStep("authenticator");
        setSuccessMsg("Password verified! Open Microsoft or Google Authenticator on your phone for your 6-digit code.");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        setErrorMsg(data.message || "Invalid credentials. Please check your email and password.");
      }
    } catch (err) {
      console.error("Password login error:", err);
      setErrorMsg("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Handlers ───────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setStep("otp");
        setResendTimer(30);
      } else {
        setErrorMsg(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("OTP send error:", err);
      setErrorMsg("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setOtp(["", "", "", "", "", ""]);

    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg("A new OTP has been sent to your email!");
        setResendTimer(30);
      } else {
        setErrorMsg(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setErrorMsg("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
      inputRefs.current[0]?.focus();
    }
  };

  const handleEditEmail = () => {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndLogin = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setErrorMsg("Please enter complete 6-digit Authenticator code.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const endpoint = step === "authenticator" ? `${API_BASE_URL}/verify-totp` : `${API_BASE_URL}/verify-otp`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: enteredOtp, otp: enteredOtp }),
      });
      const data = await response.json();
      if (data.success && (data.data?.token || pendingUserData?.token)) {
        const finalToken = data.data?.token || pendingUserData?.token;
        const finalUser = data.data?.user || pendingUserData?.user || {};
        sessionStorage.setItem("token", finalToken);
        handlePostLoginRedirect(finalUser);
      } else {
        setErrorMsg(data.message || "Invalid Authenticator Code from Microsoft or Google Authenticator.");
      }
    } catch (err) {
      console.error("Login verification error:", err);
      setErrorMsg("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Shapes */}
      <div className="login-bg-shape login-circle1"></div>
      <div className="login-bg-shape login-circle2"></div>
      <div className="login-bg-shape login-circle3"></div>
      <div className="login-bg-shape login-circle4"></div>
      <div className="login-bg-shape login-circle5"></div>
      <div className="login-bg-shape login-circle6"></div>

      <div className="login-wrapper">
        {/* Left Panel - Minimal Premium TrainX Logo Creation Animation */}
        <div className="lp2-panel">
          {/* Subtle Ambient Radial Glow */}
          <div className="tx-ambient-radial-glow"></div>

          {/* Minimal Floating Ambient Energy Particles */}
          <div className="tx-micro-particle p1"></div>
          <div className="tx-micro-particle p2"></div>
          <div className="tx-micro-particle p3"></div>
          <div className="tx-micro-particle p4"></div>
          <div className="tx-micro-particle p5"></div>
          <div className="tx-micro-particle p6"></div>

          {/* Top Eyebrow Section */}
          <div className="tx-hero-header">
            <span className="tx-eyebrow-text">YOUR LEARNING JOURNEY</span>
            <div className="tx-top-sparkle">✦</div>
          </div>

          {/* Center Stage — Minimal Premium Logo Creation Animation */}
          <div className="tx-logo-reveal-stage">
            {/* Step 2 Energy Light Point */}
            <div className="tx-energy-point"></div>

            {/* Backing Ambient Glow Pulse */}
            <div className="tx-logo-glow-pulse"></div>

            {/* Main Logo Reveal Canvas using Logo.png */}
            <div className="tx-logo-canvas">
              {/* Light Tracing Beam */}
              <div className="tx-light-trace-beam"></div>

              {/* Masked Reveal Container for Logo.png */}
              <div className="tx-logo-mask-layer">
                <img src={LogoMain} alt="TrainX Logo" className="tx-logo-main-img" />
              </div>

              {/* Shine Sweep Overlay */}
              <div className="tx-logo-shine-sweep"></div>
            </div>

            {/* Typography Below Logo */}
            <div className="tx-brand-text-block">
              <h1 className="tx-brand-name-title">
                Train<span className="tx-accent-x">X</span>
              </h1>
              <p className="tx-slogan-text">Learn • Practice • Assess • Excel</p>
            </div>
          </div>

          {/* Bottom Footer Section */}
          <div className="tx-bottom-footer-bar">
            <span className="tx-footer-tag">✦ Interactive Learning</span>
            <span className="tx-footer-tag">✦ Smart Assessment</span>
            <span className="tx-footer-tag">✦ Track Your Progress</span>
          </div>
        </div>


        {/* Right Panel - Login Card */}
        <div className="login-card">
          <img src={Logo} alt="Logo" className="login-logo" />

          {/* Segmented Auth Mode Switcher */}
          <div className="login-mode-segmented-bar">
            <button
              type="button"
              className={`login-mode-tab ${authMode === "password" ? "active" : ""}`}
              onClick={() => handleModeSwitch("password")}
            >
              {Icons.lock}
              <span>Login with Password</span>
            </button>
            <button
              type="button"
              className={`login-mode-tab ${authMode === "otp" ? "active" : ""}`}
              onClick={() => handleModeSwitch("otp")}
            >
              {Icons.shield}
              <span>Login with OTP</span>
            </button>
          </div>

          {errorMsg && <div className="auth-error-msg">{errorMsg}</div>}
          {successMsg && <div className="auth-success-msg">{successMsg}</div>}

          {/* ═════════════════════════════════════════════════ */}
          {/* MODE 1: PASSWORD LOGIN                            */}
          {/* ═════════════════════════════════════════════════ */}
          {authMode === "password" && (
            <>
              {step === "email" && (
                <form onSubmit={handlePasswordLogin}>
                  <div className="login-input-group">
                    <FieldLabel htmlFor="email" icon={Icons.email}>Email Address</FieldLabel>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="user@pvppcoe.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="login-input-group">
                    <FieldLabel htmlFor="password" icon={Icons.lock}>Password</FieldLabel>
                    <div className="password-input-wrapper">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? Icons.eyeOff : Icons.eye}
                      </button>
                    </div>
                  </div>

                  <div className="login-options-row">
                    <label className="login-remember-label">
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => handleRememberMeChange(e.target.checked)}
                      />
                      <span>Remember Me</span>
                    </label>
                    <button type="button" className="forgot-password-link" onClick={() => handleModeSwitch("forgot")}>
                      Forgot Password?
                    </button>
                  </div>

                  <button type="submit" className="login-send-otp-btn" disabled={loading}>
                    {Icons.key} {loading ? "Authenticating..." : "Login to Account"}
                  </button>

                  <div className="login-links">
                    <p>
                      Don&apos;t have an account?{" "}
                      <Link className="login-registeration-link" to="/register">
                        Create Account
                      </Link>
                    </p>
                  </div>
                </form>
              )}

              {step === "authenticator" && (
                <form onSubmit={handleVerifyAndLogin}>
                  <div className="login-input-group">
                    <div className="login-email-header-row">
                      <FieldLabel icon={Icons.shield}>Microsoft / Google Authenticator</FieldLabel>
                      <button
                        type="button"
                        onClick={handleEditEmail}
                        className="login-edit-email-btn"
                      >
                        {Icons.edit} Edit
                      </button>
                    </div>

                    <div className="login-email-display-card">
                      <span className="login-email-display-text">{email || "user@pvppcoe.ac.in"}</span>
                    </div>
                  </div>

                  {/* Authenticator Code Input Boxes */}
                  <div className="login-input-group">
                    <FieldLabel icon={Icons.key}>Enter 6-Digit Code from App</FieldLabel>
                    <div className="login-otp-input-row">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          className={`login-otp-digit-input ${digit ? "filled" : ""}`}
                          onChange={(e) => handleOtpChange(e, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        />
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="login-send-otp-btn" style={{ marginTop: "12px" }} disabled={loading}>
                    {Icons.shield} {loading ? "Verifying..." : "Verify Authenticator & Login"}
                  </button>

                  <div className="login-links">
                    <p>
                      Wrong account?{" "}
                      <button
                        type="button"
                        onClick={handleEditEmail}
                        className="login-registeration-link"
                        style={{ background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer" }}
                      >
                        Back to Login
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ═════════════════════════════════════════════════ */}
          {/* MODE 2: OTP LOGIN                                 */}
          {/* ═════════════════════════════════════════════════ */}
          {authMode === "otp" && (
            <>
              {step === "email" && (
                <form onSubmit={handleSendOtp}>
                  <div className="login-input-group">
                    <FieldLabel htmlFor="otp-email" icon={Icons.email}>Email Address</FieldLabel>
                    <input
                      id="otp-email"
                      type="email"
                      required
                      placeholder="user@pvppcoe.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="login-options">
                    <label className="login-remember-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => handleRememberMeChange(e.target.checked)}
                      />
                      <span>Remember Me</span>
                    </label>
                  </div>

                  <button type="submit" className="login-send-otp-btn" disabled={loading}>
                    {Icons.send} {loading ? "Sending..." : "Send OTP"}
                  </button>

                  <div className="login-links">
                    <p>
                      Don&apos;t have an account?{" "}
                      <Link className="login-registeration-link" to="/register">
                        Create Account
                      </Link>
                    </p>
                  </div>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyAndLogin}>
                  <div className="login-input-group">
                    <div className="login-email-header-row">
                      <FieldLabel icon={Icons.email}>Sent to Email</FieldLabel>
                      <button
                        type="button"
                        onClick={handleEditEmail}
                        className="login-edit-email-btn"
                      >
                        {Icons.edit} Edit
                      </button>
                    </div>

                    <div className="login-email-display-card">
                      <span className="login-email-display-text">{email || "user@pvppcoe.ac.in"}</span>
                    </div>
                  </div>

                  {/* OTP Input Boxes */}
                  <div className="login-input-group">
                    <FieldLabel icon={Icons.key}>Enter 6-Digit OTP</FieldLabel>
                    <div className="login-otp-input-row">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          className={`login-otp-digit-input ${digit ? "filled" : ""}`}
                          onChange={(e) => handleOtpChange(e, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend OTP */}
                  <div className="login-resend-wrap">
                    <span className="login-resend-text">Didn&apos;t receive OTP?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || loading}
                      className="login-resend-link-btn"
                      style={{ opacity: resendTimer > 0 || loading ? 0.6 : 1, cursor: resendTimer > 0 || loading ? "not-allowed" : "pointer" }}
                    >
                      ↺ {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                    </button>
                  </div>

                  <button type="submit" className="login-send-otp-btn" disabled={loading}>
                    {Icons.send} {loading ? "Verifying..." : "Verify & Login"}
                  </button>

                  <div className="login-links">
                    <p>
                      Don&apos;t have an account?{" "}
                      <Link className="login-registeration-link" to="/register">
                        Create Account
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </>
          )}
          {/* ═════════════════════════════════════════════════ */}
          {/* MODE 3: FORGOT / RESET PASSWORD (3-STEP FLOW)     */}
          {/* ═════════════════════════════════════════════════ */}
          {authMode === "forgot" && (
            <>
              {/* STEP 1: Enter Email */}
              {step === "email" && (
                <form onSubmit={handleSendOtp}>
                  <div className="login-input-group">
                    <FieldLabel htmlFor="forgot-email" icon={Icons.email}>Account Email Address</FieldLabel>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="user@pvppcoe.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <p style={{ fontSize: "12px", color: "#64748b", margin: "10px 0 16px", lineHeight: "1.4" }}>
                    🔒 Enter your registered email address. We will send a 6-digit OTP to reset your password.
                  </p>

                  <button type="submit" className="login-send-otp-btn" disabled={loading}>
                    {Icons.send} {loading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <div className="login-links">
                    <p>
                      Remembered password?{" "}
                      <button
                        type="button"
                        onClick={() => handleModeSwitch("password")}
                        className="login-registeration-link"
                        style={{ background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer" }}
                      >
                        Back to Login
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* STEP 2: Enter & Verify 6-Digit OTP */}
              {step === "otp" && (
                <form onSubmit={handleVerifyForgotOtp}>
                  <div className="login-input-group">
                    <div className="login-email-header-row">
                      <FieldLabel icon={Icons.email}>OTP Sent To</FieldLabel>
                      <button
                        type="button"
                        onClick={handleEditEmail}
                        className="login-edit-email-btn"
                      >
                        {Icons.edit} Edit
                      </button>
                    </div>

                    <div className="login-email-display-card">
                      <span className="login-email-display-text">{email || "user@pvppcoe.ac.in"}</span>
                    </div>
                  </div>

                  {/* 6-Digit OTP Input Boxes */}
                  <div className="login-input-group">
                    <FieldLabel icon={Icons.key}>Enter 6-Digit OTP</FieldLabel>
                    <div className="login-otp-input-row">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          className={`login-otp-digit-input ${digit ? "filled" : ""}`}
                          onChange={(e) => handleOtpChange(e, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend OTP */}
                  <div className="login-resend-wrap" style={{ marginTop: "12px" }}>
                    <span className="login-resend-text">Didn&apos;t receive OTP?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || loading}
                      className="login-resend-link-btn"
                      style={{ opacity: resendTimer > 0 || loading ? 0.6 : 1, cursor: resendTimer > 0 || loading ? "not-allowed" : "pointer" }}
                    >
                      ↺ {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                    </button>
                  </div>

                  <button type="submit" className="login-send-otp-btn" style={{ marginTop: "14px" }} disabled={loading}>
                    {Icons.send} {loading ? "Verifying OTP..." : "Verify OTP"}
                  </button>

                  <div className="login-links">
                    <p>
                      Remembered password?{" "}
                      <button
                        type="button"
                        onClick={() => handleModeSwitch("password")}
                        className="login-registeration-link"
                        style={{ background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer" }}
                      >
                        Back to Login
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* STEP 3: Enter New Password & Confirm */}
              {step === "new_password" && (
                <form onSubmit={handleResetPasswordSubmit}>
                  <div className="login-input-group">
                    <div className="login-email-header-row">
                      <FieldLabel icon={Icons.shield}>OTP Verified Account</FieldLabel>
                    </div>
                    <div className="login-email-display-card" style={{ borderColor: "#86efac", background: "#f0fdf4" }}>
                      <span className="login-email-display-text" style={{ color: "#166534", fontWeight: "600" }}>✓ {email}</span>
                    </div>
                  </div>

                  {/* New Password Input */}
                  <div className="login-input-group" style={{ marginTop: "14px" }}>
                    <FieldLabel htmlFor="new-password" icon={Icons.lock}>New Password *</FieldLabel>
                    <div className="login-password-input-wrap">
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? Icons.eyeOff : Icons.eye}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password Input */}
                  <div className="login-input-group">
                    <FieldLabel htmlFor="confirm-new-password" icon={Icons.lock}>Confirm New Password *</FieldLabel>
                    <div className="login-password-input-wrap">
                      <input
                        id="confirm-new-password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="login-send-otp-btn" style={{ marginTop: "16px" }} disabled={loading}>
                    {Icons.key} {loading ? "Updating Password..." : "Update Password & Login"}
                  </button>

                  <div className="login-links">
                    <p>
                      Back to{" "}
                      <button
                        type="button"
                        onClick={() => handleModeSwitch("password")}
                        className="login-registeration-link"
                        style={{ background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer" }}
                      >
                        Login
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;