import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import sideImage from "../../assets/LoginSideImage.png";
import "./login.css";

/* ── Reusable SVG icons ─────────────────────────────── */
const Icons = {
  email: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  send: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  key: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-1.5 1.5L14 9.5" />
      <path d="M15.5 7.5 17 9" />
      <circle cx="7.5" cy="16.5" r="5.5" />
    </svg>
  ),
  edit: (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  const API_BASE_URL = "/api/v1/auth";

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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
        setErrorMsg(data.message || "Failed to send OTP. Please ensure your account is registered.");
      }
    } catch (err) {
      console.error("OTP send error:", err);
      setErrorMsg("Unable to connect to server. Please check your connection and try again.");
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
      setErrorMsg("Unable to connect to server. Please check your connection and try again.");
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
      setErrorMsg("Please enter complete 6-digit OTP");
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
      if (data.success && data.data?.token) {
        localStorage.setItem("token", data.data.token);

        const serverUser = data.data.user || {};
        let existingUser = {};
        try { existingUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}

        const isAutoName = (n) => !n || /^\d+$/.test(n.trim()) || n.startsWith("User_") || /^vu\d/i.test(n.trim());

        let finalName = serverUser.name;
        if (isAutoName(finalName)) {
          if (existingUser.name && !isAutoName(existingUser.name)) {
            finalName = existingUser.name;
          } else {
            // Default friendly name instead of raw roll code Vu3f2425047
            finalName = "Pakshal";
          }
        }

        const mergedUser = {
          ...existingUser,
          ...serverUser,
          name: finalName,
        };

        localStorage.setItem("user", JSON.stringify(mergedUser));

        const role = mergedUser.role?.toLowerCase() || "";
        if (role.includes("coordinator")) {
          navigate("/coordinator");
        } else if (role.includes("admin") || role.includes("hod")) {
          navigate("/admin");
        } else {
          navigate("/student");
        }
      } else {
        setErrorMsg(data.message || "Invalid OTP or account not found.");
      }
    } catch (err) {
      console.error("Login verification error:", err);
      setErrorMsg("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative Background Shapes */}
      <div className="login-bg-shape login-circle1"></div>
      <div className="login-bg-shape login-circle2"></div>
      <div className="login-bg-shape login-circle3"></div>
      <div className="login-bg-shape login-circle4"></div>
      <div className="login-bg-shape login-circle5"></div>
      <div className="login-bg-shape login-circle6"></div>
      <div className="login-bg-shape login-blob1"></div>
      <div className="login-bg-shape login-blob2"></div>
      <div className="login-bg-shape login-ring1"></div>
      <div className="login-bg-shape login-ring2"></div>

      <div className="login-wrapper">
        {/* Left Panel */}
        <div className="login-left-panel">
          <div className="login-left-content">
            <h1 className="login-welcome-text">Welcome to</h1>

            <div className="brand-row-login">
              <span className="brand-name-login1">Training</span>
              <span className="brand-name-login2">Portal</span>
            </div>

            <p className="login-brand-tagline">Learn. Practice. Grow.</p>
            <p className="login-brand-tagline">
              Your journey to success starts here.
            </p>
          </div>
          <div className="login-side-image-wrapper">
            <img src={sideImage} alt="AcadNexus Learning" className="login-side-image" />
          </div>
        </div>

        {/* Right Panel - Login Card */}
        <div className="login-card">
          <img src={Logo} alt="Logo" className="login-logo" />

          {errorMsg && (
            <div className="auth-error-msg">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="auth-success-msg">
              {successMsg}
            </div>
          )}
          {/* STEP 1: EMAIL INPUT SCREEN */}
          {step === "email" && (
            <>
              <p className="login-subtitle">OTP-Based Login to continue</p>

              <div className="login-shield-divider">
                <span className="login-divider-line"></span>
                <span className="login-divider-shield">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <span className="login-divider-line"></span>
              </div>

              <form onSubmit={handleSendOtp}>
                <div className="login-input-group">
                  <FieldLabel htmlFor="email" icon={Icons.email}>Email</FieldLabel>
                  <input
                    id="email"
                    type="text"
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
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember Me</span>
                  </label>
                </div>

                <button type="submit" className="login-send-otp-btn" disabled={loading}>
                  {Icons.send} {loading ? "Sending..." : "Send OTP"}
                </button>

                <div className="login-simple-divider"></div>

                <div className="login-links">
                  <p>
                    Don&apos;t have an account?{" "}
                    <Link className="login-registeration-link" to="/register">
                      Create Account
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}

          {/* STEP 2: OTP ENTER SCREEN */}
          {step === "otp" && (
            <>
              <p className="login-subtitle">Enter the OTP sent to your email</p>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;