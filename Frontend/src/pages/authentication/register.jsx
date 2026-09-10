import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import "./register.css";

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
  const totpInputRefs = useRef([]);

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
      const response = await fetch("/api/v1/auth/verify-totp", {
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
      const response = await fetch("/api/v1/auth/register", {
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
        setSuccessMsg("Account created! Scan the QR Code with Microsoft or Google Authenticator.");
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
        <img src={Logo} alt="Logo" className="logo" />

        <div id="brand-row">
          <h1 id="acad">Training</h1>
          <h1 id="nexus">Portal</h1>
        </div>

        <p className="subtitle">Create your account to get started.</p>

        {errorMsg && <div className="auth-error-msg">{errorMsg}</div>}
        {successMsg && <div className="auth-success-msg">{successMsg}</div>}

        {showTotpSetup ? (
          <form onSubmit={handleVerifyTotpSetup} className="totp-setup-form">
            <div className="totp-header" style={{ textAlign: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>Pair Microsoft / Google Authenticator</h3>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>Scan QR Code with Microsoft or Google Authenticator on your phone.</p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              {totpSetupData?.qrCode && (
                <img src={totpSetupData.qrCode} alt="2FA QR Code" style={{ width: "160px", height: "160px", borderRadius: "8px" }} />
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f1f5f9", padding: "8px 12px", borderRadius: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>Key:</span>
              <code style={{ fontSize: "12.5px", fontWeight: "700", color: "#1e293b", letterSpacing: "1px" }}>{totpSetupData?.secret}</code>
              <button type="button" onClick={handleCopySecret} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                {copiedSecret ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <div className="input-group">
              <FieldLabel icon={Icons.key}>Enter 6-Digit Code from App</FieldLabel>
              <div className="login-otp-input-row" style={{ marginTop: "8px" }}>
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

            <button type="submit" className="login-send-otp-btn" style={{ width: "100%", marginTop: "16px" }} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Complete Registration"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
          {/* ── Select Role ── */}
          <div className="role-select-container">
            <FieldLabel icon={Icons.role}>Select Role</FieldLabel>
            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select your role</option>
              <option value="Student">Student</option>
              <option value="Coordinator">Coordinator</option>
              <option value="HOD">HOD</option>
              <option value="Faculty">Faculty</option>
              <option value="Mentor">Mentor</option>
            </select>
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
                  <select
                    name="department"
                    className="field-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">Dept</option>
                    <option value="COMPS">COMPS</option>
                    <option value="IT">IT</option>
                    <option value="AIML">AIML</option>
                    <option value="ECS">ECS</option>
                    <option value="MTRX">MTRX</option>
                    <option value="EXTC">EXTC</option>
                  </select>
                </div>

                <div className="input-group">
                  <FieldLabel icon={Icons.year}>Year</FieldLabel>
                  <select
                    name="year"
                    className="field-select"
                    value={formData.year}
                    onChange={handleChange}
                  >
                    <option value="">Year</option>
                    <option value="FE">FE</option>
                    <option value="SE">SE</option>
                    <option value="TE">TE</option>
                    <option value="BE">BE</option>
                  </select>
                </div>

                <div className="input-group">
                  <FieldLabel icon={Icons.division}>Div.</FieldLabel>
                  <select
                    name="division"
                    className="field-select"
                    value={formData.division}
                    onChange={handleChange}
                  >
                    <option value="">Div</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                  </select>
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

          {/* ── OTHER ROLE FIELDS (Faculty / Mentor / HOD) ── */}
          {role !== "Student" && role !== "" && (
            <div key={role}>
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
        </form>
        )}
      </div>
    </div>
  );
}

export default Register;