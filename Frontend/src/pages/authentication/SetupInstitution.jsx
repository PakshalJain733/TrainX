import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getApiBaseUrl } from "../../utils/api";
import Logo from "../../assets/Logo2.png";
import TrainXIcon from "../../assets/TrainX.png";
import "./SetupInstitution.css";

const Icons = {
  institution: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
    </svg>
  ),
  shieldCheck: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  email: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
  checkCircle: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  alertCircle: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

export default function SetupInstitution() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = (searchParams.get("token") || searchParams.get("code") || "").trim();
  const emailParam = (searchParams.get("email") || "").trim();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [institutionData, setInstitutionData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: emailParam || "",
    mobile_number: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Verify invitation token on mount
  useEffect(() => {
    if (!tokenParam) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("Missing institution invitation token. Please use the complete link sent to your official email.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/verify-institution-token?token=${encodeURIComponent(tokenParam)}`);
        const json = await res.json();

        if (json.success && json.data) {
          setInstitutionData(json.data);
          setTokenValid(true);
          if (emailParam) {
            setFormData((prev) => ({ ...prev, email: emailParam }));
          }
        } else {
          setTokenValid(false);
          setTokenError(json.message || "This institution invitation link is invalid or has expired.");
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError("Unable to connect to authorization server. Please check your network connection.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [tokenParam, emailParam]);

  // Handle countdown on success
  useEffect(() => {
    if (!setupComplete) return;
    const interval = setInterval(() => {
      setRedirectCountdown((n) => {
        if (n <= 1) {
          clearInterval(interval);
          navigate("/admin");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [setupComplete, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();
    const mobile = formData.mobile_number.trim();
    const pass = formData.password;
    const confirmPass = formData.confirm_password;

    if (!name) {
      setSubmitError("Please enter your full name.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubmitError("Please enter a valid official college email address.");
      return;
    }
    if (mobile && mobile.length < 10) {
      setSubmitError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!pass || pass.length < 6) {
      setSubmitError("Password must be at least 6 characters long.");
      return;
    }
    if (pass !== confirmPass) {
      setSubmitError("Passwords do not match. Please re-enter passwords.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/complete-institution-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenParam,
          name,
          email,
          mobile_number: mobile || null,
          password: pass,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        if (data.data.token) {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          localStorage.setItem("role", data.data.user.role || "college_admin");
        }
        setSetupComplete(true);
      } else {
        setSubmitError(data.message || "Failed to complete institutional setup. Please try again.");
      }
    } catch (err) {
      setSubmitError("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="setup-inst-page">
      <div className="setup-inst-card">
        {/* Brand Banner */}
        <div className="setup-inst-banner">
          <img src={Logo} alt="Logo" className="setup-inst-logo" />
          <div className="setup-inst-divider"></div>
          <div className="setup-inst-banner-text">
            <div className="setup-inst-brand-row">
              <span className="setup-brand-training">Train</span>
              <img src={TrainXIcon} alt="X" className="setup-brand-x" />
            </div>
            <p className="setup-inst-subtitle">Institutional Administrator Onboarding</p>
          </div>
        </div>

        {/* Loading State */}
        {verifying && (
          <div className="setup-inst-loading">
            <div className="setup-spinner"></div>
            <h3>Verifying Institutional Authorization...</h3>
            <p>Authenticating your single-use setup token with TrainX security layer.</p>
          </div>
        )}

        {/* Error State: Invalid or Missing Token */}
        {!verifying && !tokenValid && (
          <div className="setup-inst-error-state">
            <div className="setup-icon-wrap error">{Icons.alertCircle}</div>
            <h3>Invalid or Expired Invitation</h3>
            <p>{tokenError}</p>
            <div className="setup-inst-error-help">
              <p>Institutional setup links are private and single-use. If your link has expired or has already been used, please contact your Super Administrator to re-issue an invitation.</p>
            </div>
            <Link to="/" className="setup-btn-return">
              Return to Login Screen
            </Link>
          </div>
        )}

        {/* Success State: Account Configured */}
        {!verifying && tokenValid && setupComplete && (
          <div className="setup-inst-success-state">
            <div className="setup-icon-wrap success">{Icons.checkCircle}</div>
            <h3>Institution Portal Activated! 🎉</h3>
            <p>
              Welcome, <strong>{formData.name}</strong>. Your administrator account for <strong>{institutionData?.collegeName}</strong> is now officially active.
            </p>
            <div className="setup-countdown-badge">
              Launching College Dashboard in {redirectCountdown}s...
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="setup-btn-primary"
            >
              Access College Dashboard Now →
            </button>
          </div>
        )}

        {/* Form State: Valid Token */}
        {!verifying && tokenValid && !setupComplete && (
          <form onSubmit={handleSubmit} className="setup-inst-form">
            {/* Institution Verified Hero Badge */}
            <div className="setup-institution-hero">
              <div className="setup-hero-icon">{Icons.institution}</div>
              <div className="setup-hero-text">
                <span className="setup-hero-label">Authorized Institution</span>
                <h4 className="setup-hero-name">{institutionData?.collegeName || "Partner Institution"}</h4>
                <div className="setup-hero-meta">
                  <span className="setup-role-tag">ROLE: COLLEGE ADMINISTRATOR</span>
                  <span className="setup-verified-tag">{Icons.shieldCheck} Key Verified</span>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="setup-error-banner">
                <span>⚠️ {submitError}</span>
              </div>
            )}

            <div className="setup-form-grid">
              {/* Full Name */}
              <div className="setup-input-group">
                <label>
                  {Icons.user}
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Official College Email */}
              <div className="setup-input-group">
                <label>
                  {Icons.email}
                  <span>Official College Email *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
                {institutionData?.college?.domain && (
                  <span className="setup-hint">
                    Authorized domain: @{institutionData.college.domain}
                  </span>
                )}
              </div>

              {/* Mobile Number */}
              <div className="setup-input-group">
                <label>
                  {Icons.phone}
                  <span>Mobile Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="setup-form-row-2">
                <div className="setup-input-group">
                  <label>
                    {Icons.lock}
                    <span>Create Password *</span>
                  </label>
                  <div className="setup-pass-wrapper">
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
                      className="setup-pass-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? Icons.eyeOff : Icons.eye}
                    </button>
                  </div>
                </div>

                <div className="setup-input-group">
                  <label>
                    {Icons.lock}
                    <span>Confirm Password *</span>
                  </label>
                  <div className="setup-pass-wrapper">
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
                      className="setup-pass-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? Icons.eyeOff : Icons.eye}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="setup-btn-primary"
            >
              {submitting ? "Initializing Portal..." : "Complete Setup & Launch Portal →"}
            </button>

            <div className="setup-inst-footer">
              <p>
                Already have credentials? <Link to="/">Log in here</Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

