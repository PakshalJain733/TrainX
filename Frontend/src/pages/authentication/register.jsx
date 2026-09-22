
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import TrainXIcon from "../../assets/TrainX.png";
import { getApiBaseUrl } from "../../utils/api";
import "./register.css";

/* ── Inline dropdown for Register page (CSS: register.css .reg-select-*) ── */
function RegSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`reg-select-wrap${isOpen ? ' reg-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`reg-select-trigger${isOpen ? ' reg-select-trigger--open' : ''}`}>
        {Icon && <span className="reg-select-icon">{Icon}</span>}
        <span className="reg-select-text">{selected ? selected.label : <span style={{ color: '#94a3b8' }}>{placeholder}</span>}</span>
        <svg className={`reg-select-arrow${isOpen ? ' reg-select-arrow--rotate' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {isOpen && (
        <div className="reg-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`reg-select-option${isSel ? ' reg-select-option--selected' : ''}`}>
                <span className="reg-select-option-label">{opt.label}</span>
                {isSel && <svg className="reg-select-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Reusable SVG icons ─────────────────────────────── */
const Icons = {
  role: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      <path d="M18.5 6.5c1.9 0 3.5-1.6 3.5-3.5S20.4-.5 18.5-.5 15 1.1 15 3s1.6 3.5 3.5 3.5zm0 1.5c-2.3 0-7 1.2-7 3.5V13h14v-1.5c0-2.3-4.7-3.5-7-3.5z" opacity="0.6" />
      <path d="M5.5 6.5C7.4 6.5 9 4.9 9 3S7.4-.5 5.5-.5 2 1.1 2 3s1.6 3.5 3.5 3.5zm0 1.5C3.2 8 -1.5 9.2-1.5 11.5V13h14v-1.5C12.5 9.2 7.8 8 5.5 8z" opacity="0.6" />
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  email: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  id: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  phone: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  dept: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  year: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  division: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7v7H3z" />
      <path d="M14 3h7v7h-7z" />
      <path d="M3 14h7v7H3z" />
      <path d="M14 14h7v7h-7z" />
    </svg>
  ),
  lock: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  eye: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  shield: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  copy: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  qrCode: (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  arrowLeft: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
};

/* ── Label with inline icon ─────────────────────────── */
function FieldLabel({ icon, children }) {
  return (
    <label className="label-with-icon">
      <span className="label-icon">{icon}</span>
      {children}
    </label>
  );
}

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roll_number: "",
    mobile_number: "",
    department: "",
    year: "",
    division: "",
    password: "",
    confirm_password: "",
    secure_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // TOTP Authenticator Setup State
  const [totpSetupData, setTotpSetupData] = useState(null);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpCode, setTotpCode] = useState(["", "", "", "", "", ""]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [totpTab, setTotpTab] = useState("qr"); // 'qr' | 'manual'
  const totpInputRefs = useRef([]);

  // Request College Access Key / Demo State
  const [isRequestDemoOpen, setIsRequestDemoOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoFormData, setDemoFormData] = useState({
    collegeName: "",
    contactPerson: "",
    designation: "",
    email: "",
    phone: "",
    studentCount: "",
  });

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoSubmitted(true);
    setTimeout(() => {
      setDemoSubmitted(false);
      setIsRequestDemoOpen(false);
      setDemoFormData({
        collegeName: "",
        contactPerson: "",
        designation: "",
        email: "",
        phone: "",
        studentCount: "",
      });
    }, 2200);
  };

  const handleCopySecret = () => {
    if (totpSetupData?.secret) {
      navigator.clipboard.writeText(totpSetupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleTotpCodeChange = (e, index) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;
    const newCode = [...totpCode];
    newCode[index] = val.substring(val.length - 1);
    setTotpCode(newCode);

    if (val && index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !totpCode[index] && index > 0) {
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
      setTotpCode(newCode);
      const nextIdx = Math.min(digits.length, 5);
      totpInputRefs.current[nextIdx]?.focus();
    }
  };

  const formatSecretKey = (secret) => {
    if (!secret) return "";
    return secret.match(/.{1,4}/g)?.join(" ") || secret;
  };

  const handleVerifyTotpSetup = async (e) => {
    e.preventDefault();
    const enteredCode = totpCode.join("");
    if (enteredCode.length < 6) {
      setErrorMsg("Please enter complete 6-digit Authenticator code.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const emailToVerify = formData.email || totpSetupData?.user?.email || "";
      const response = await fetch(`${getApiBaseUrl()}/auth/verify-totp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToVerify,
          code: enteredCode,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg("Authenticator paired successfully! Account activated.");
        if (totpSetupData?.token) {
          const registeredUser = {
            ...totpSetupData.user,
            name: formData.name || totpSetupData.user?.name || "Student",
          };
          localStorage.setItem("token", totpSetupData.token);
          localStorage.setItem("user", JSON.stringify(registeredUser));
          sessionStorage.setItem("showFirstLoginAlert", "true");
        }
        setTimeout(() => {
          navigate("/");
        }, 1200);
      } else {
        setErrorMsg(data.message || "Invalid Authenticator Code. Please check Microsoft or Google Authenticator.");
      }
    } catch (err) {
      console.error("TOTP verify error:", err);
      setErrorMsg("Unable to verify Authenticator code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setErrorMsg("Please select your role.");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setErrorMsg("Passwords do not match. Please re-enter passwords.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role,
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.qrCode) {
        setTotpSetupData(data.data);
        setShowTotpSetup(true);
        setSuccessMsg("");
      } else if (data.success) {
        setSuccessMsg("Account created successfully! Redirecting to login...");
        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
        }
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setErrorMsg(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration submit error:", err);
      setErrorMsg("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Decorative Background Shapes */}
      <div className="bg-shape circle1"></div>
      <div className="bg-shape circle2"></div>
      <div className="bg-shape circle3"></div>
      <div className="bg-shape circle4"></div>
      <div className="bg-shape circle5"></div>
      <div className="bg-shape circle6"></div>
      <div className="bg-shape blob1"></div>
      <div className="bg-shape blob2"></div>
      <div className="bg-shape ring1"></div>
      <div className="bg-shape ring2"></div>

      <div className="register-card">
        {/* Horizontal Brand Banner */}
        <div className="register-header-banner">
          <img src={Logo} alt="Logo" className="register-banner-logo" ></img>
          <div className="register-banner-divider"></div>
          <div className="register-banner-text">
            <div className="register-brand-row">
              <span className="brand-training">Train</span>
              <img src={TrainXIcon} alt="X" className="register-brand-x-icon" />
            </div>
            <p className="register-banner-subtitle">Create your account to get started.</p>
          </div>
        </div>

        {showTotpSetup && (
          <div className="totp-stepper-bar">
            <div className="stepper-step completed">
              <span className="stepper-badge">{Icons.check}</span>
              <span className="stepper-label">Details</span>
            </div>
            <div className="stepper-line active"></div>
            <div className="stepper-step active">
              <span className="stepper-badge">{Icons.shield}</span>
              <span className="stepper-label">Authenticator</span>
            </div>
          </div>
        )}

        {errorMsg && <div className="auth-error-msg">{errorMsg}</div>}
        {!showTotpSetup && successMsg && <div className="auth-success-msg">{successMsg}</div>}

        {showTotpSetup ? (
          <form onSubmit={handleVerifyTotpSetup} className="totp-setup-form">
            <div className="totp-header">
              <h3 className="totp-title">Pair Authenticator App</h3>
              <p className="totp-subtitle">
                Scan QR Code using Google or Microsoft Authenticator.
              </p>
            </div>

            {/* Method Tab Selector */}
            <div className="totp-tab-nav">
              <button
                type="button"
                className={`totp-tab-btn ${totpTab === "qr" ? "active" : ""}`}
                onClick={() => setTotpTab("qr")}
              >
                {Icons.qrCode} Scan QR Code
              </button>
              <button
                type="button"
                className={`totp-tab-btn ${totpTab === "manual" ? "active" : ""}`}
                onClick={() => setTotpTab("manual")}
              >
                {Icons.key} Manual Key
              </button>
            </div>

            {/* Tab 1: QR Code View */}
            {totpTab === "qr" && (
              <div className="totp-qr-wrapper">
                <div className="totp-qr-frame">
                  <span className="qr-corner top-left"></span>
                  <span className="qr-corner top-right"></span>
                  <span className="qr-corner bottom-left"></span>
                  <span className="qr-corner bottom-right"></span>
                  {totpSetupData?.qrCode && (
                    <img src={totpSetupData.qrCode} alt="2FA QR Code" className="totp-qr-img" />
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Secret Key Card (Only shown when Manual Key tab is active) */}
            {totpTab === "manual" && (
              <div className="totp-secret-card">
                <div className="secret-card-header">
                  <span className="secret-card-label">{Icons.key} Secret Setup Key</span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className={`totp-copy-btn ${copiedSecret ? "copied" : ""}`}
                    title="Copy secret key"
                  >
                    {copiedSecret ? (
                      <>
                        {Icons.check} <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        {Icons.copy} <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="secret-code-display">
                  <code>{formatSecretKey(totpSetupData?.secret)}</code>
                </div>
              </div>
            )}

            {/* 6-Digit Verification Code Section */}
            <div className="totp-otp-section">
              <FieldLabel icon={Icons.key}>Enter 6-Digit Code from App</FieldLabel>
              <div className="login-otp-input-row" onPaste={handleTotpPaste} style={{ marginTop: "6px" }}>
                {totpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (totpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    className={`login-otp-digit-input ${digit ? "filled" : ""}`}
                    onChange={(e) => handleTotpCodeChange(e, idx)}
                    onKeyDown={(e) => handleTotpKeyDown(e, idx)}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="login-send-otp-btn totp-submit-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Complete Registration"}
            </button>

            <div className="totp-footer-actions">
              <button
                type="button"
                className="totp-back-link"
                onClick={() => {
                  setShowTotpSetup(false);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
              >
                {Icons.arrowLeft} Back to registration
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ── Select Role ── */}
            <div className="role-select-container">
              <FieldLabel icon={Icons.role}>Select Role</FieldLabel>
              <RegSelect
                value={role}
                wrapperClass="reg-select"
                options={[
                  { value: "Student", label: "Student" },
                  { value: "Coordinator", label: "Coordinator" },
                  { value: "Admin", label: "Admin" },
                  { value: "Mentor", label: "Mentor" },
                ]}
                onChange={(val) => setRole(val)}
                placeholder="Select your role"
              />
            </div>

            {/* ── STUDENT ROLE FIELDS ── */}
            {role === "Student" && (
              <div key="Student">
                {/* Row 1: Full Name | College Email */}
                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.user}>Full Name</FieldLabel>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Full name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <FieldLabel icon={Icons.email}>College Email</FieldLabel>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="user@pvppcoe.ac.in"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 2: College ID | Mobile Number */}
                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.id}>College ID</FieldLabel>
                    <input
                      type="text"
                      name="roll_number"
                      required
                      placeholder="College ID"
                      value={formData.roll_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <FieldLabel icon={Icons.phone}>Mobile No.</FieldLabel>
                    <input
                      type="tel"
                      name="mobile_number"
                      required
                      placeholder="Mobile number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 3: Department | Year | Division */}
                <div className="form-grid-3">
                  <div className="input-group">
                    <FieldLabel icon={Icons.dept}>Dept.</FieldLabel>
                    <RegSelect
                      value={formData.department}
                      wrapperClass="reg-select"
                      options={[
                        { value: "COMPS", label: "COMPS" },
                        { value: "IT", label: "IT" },
                        { value: "AIML", label: "AIML" },
                        { value: "ECS", label: "ECS" },
                        { value: "MTRX", label: "MTRX" },
                        { value: "EXTC", label: "EXTC" },
                      ]}
                      onChange={(val) => setFormData({ ...formData, department: val })}
                      placeholder="Dept"
                    />
                  </div>

                  <div className="input-group">
                    <FieldLabel icon={Icons.year}>Year</FieldLabel>
                    <RegSelect
                      value={formData.year}
                      wrapperClass="reg-select"
                      options={[
                        { value: "FE", label: "FE" },
                        { value: "SE", label: "SE" },
                        { value: "TE", label: "TE" },
                        { value: "BE", label: "BE" },
                      ]}
                      onChange={(val) => setFormData({ ...formData, year: val })}
                      placeholder="Year"
                    />
                  </div>

                  <div className="input-group">
                    <FieldLabel icon={Icons.division}>Div.</FieldLabel>
                    <RegSelect
                      value={formData.division}
                      wrapperClass="reg-select"
                      options={[
                        { value: "A", label: "A" },
                        { value: "B", label: "B" },
                        { value: "C", label: "C" },
                        { value: "D", label: "D" },
                        { value: "E", label: "E" },
                        { value: "F", label: "F" },
                      ]}
                      onChange={(val) => setFormData({ ...formData, division: val })}
                      placeholder="Div"
                    />
                  </div>
                </div>

                {/* Row 4: Password | Confirm Password */}
                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.lock}>Create Password</FieldLabel>
                    <div className="register-password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? Icons.eyeOff : Icons.eye}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <FieldLabel icon={Icons.lock}>Confirm Password</FieldLabel>
                    <div className="register-password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        required
                        placeholder="••••••••"
                        value={formData.confirm_password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? Icons.eyeOff : Icons.eye}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── OTHER ROLE FIELDS (Faculty / Mentor / HOD / Admin) ── */}
            {role !== "Student" && role !== "" && (
              <div key={role}>
                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.user}>Full Name</FieldLabel>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <FieldLabel icon={Icons.email}>Email</FieldLabel>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="user@pvppcoe.ac.in"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row: Password | Confirm Password for Staff/Mentors */}
                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.lock}>Create Password</FieldLabel>
                    <div className="register-password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? Icons.eyeOff : Icons.eye}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <FieldLabel icon={Icons.lock}>Confirm Password</FieldLabel>
                    <div className="register-password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        required
                        placeholder="••••••••"
                        value={formData.confirm_password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? Icons.eyeOff : Icons.eye}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <FieldLabel icon={Icons.shield}>Secure Code</FieldLabel>
                  <input
                    type="text"
                    name="secure_code"
                    placeholder={`Enter ${role} secure code`}
                    value={formData.secure_code}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>

            <div className="links">
              <p>
                Already have an account?
                <Link to="/"> Login</Link>
              </p>
            </div>

            {role === "Admin" && (
              <div className="request-key-banner">
                <p className="request-key-text">Don't have an Invitation Access Code for your Institution?</p>
                <button
                  type="button"
                  className="btn-request-key-link"
                  onClick={() => setIsRequestDemoOpen(true)}
                >
                  Request College Demo / Access Key
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Request College Access Key Modal */}
      {isRequestDemoOpen && (
        <div className="sa-modal-overlay" onClick={() => setIsRequestDemoOpen(false)}>
          <div className="sa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">🏛️ Request Institution Access Key / Demo</h3>
                <p className="sa-modal-desc">
                  Submit your institution details. Our Super Admin team will verify your college offline and issue your Secure Authorization Key via email.
                </p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setIsRequestDemoOpen(false)}>
                &times;
              </button>
            </div>

            {demoSubmitted ? (
              <div className="p-6 text-center space-y-3" style={{ padding: "36px 24px", textAlign: "center" }}>
                <div style={{ width: "52px", height: "52px", background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: "24px", fontWeight: "bold" }}>
                  ✓
                </div>
                <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px" }}>Request Submitted Successfully!</h4>
                <p style={{ fontSize: "13.5px", color: "#475569", margin: 0, lineHeight: "1.5" }}>
                  Our Super Admin team will review your institution credentials and issue your official Secure Access Code via email within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="sa-modal-body">
                <div className="input-group">
                  <FieldLabel icon={Icons.dept}>Institution / College Name *</FieldLabel>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    placeholder="e.g. Vasantdada Patil Pratishthan's College of Engg."
                    value={demoFormData.collegeName}
                    onChange={(e) => setDemoFormData({ ...demoFormData, collegeName: e.target.value })}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.user}>Contact Person Name *</FieldLabel>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="Dr. Rajesh Kumar"
                      value={demoFormData.contactPerson}
                      onChange={(e) => setDemoFormData({ ...demoFormData, contactPerson: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <FieldLabel icon={Icons.id}>Official Designation *</FieldLabel>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. Principal / TPO / HOD"
                      value={demoFormData.designation}
                      onChange={(e) => setDemoFormData({ ...demoFormData, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.email}>Institutional Email *</FieldLabel>
                    <input
                      type="email"
                      required
                      className="form-input-admin"
                      placeholder="tpo@college.ac.in"
                      value={demoFormData.email}
                      onChange={(e) => setDemoFormData({ ...demoFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <FieldLabel icon={Icons.phone}>Phone Number *</FieldLabel>
                    <input
                      type="tel"
                      required
                      className="form-input-admin"
                      placeholder="+91 9876543210"
                      value={demoFormData.phone}
                      onChange={(e) => setDemoFormData({ ...demoFormData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <FieldLabel icon={Icons.role}>Estimated Student Count</FieldLabel>
                  <RegSelect
                    value={demoFormData.studentCount}
                    options={[
                      { value: "100-500", label: "100 - 500 Students" },
                      { value: "500-1500", label: "500 - 1,500 Students" },
                      { value: "1500-3000", label: "1,500 - 3,000 Students" },
                      { value: "3000+", label: "3,000+ Students" },
                    ]}
                    onChange={(val) => setDemoFormData({ ...demoFormData, studentCount: val })}
                    placeholder="Select range"
                  />
                </div>

                <div className="sa-modal-footer">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsRequestDemoOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-submit">
                    Submit Access Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;