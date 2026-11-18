import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getApiBaseUrl } from "../../utils/api";
import Logo2 from "../../assets/Logo2.png";
import "./ActivateAccount.css";

const Icons = {
  shieldCheck: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  email: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  checkCircleLarge: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 12 15 16 9" />
    </svg>
  ),
  alertCircle: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  infoCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = (searchParams.get("token") || "").trim().replace(/[.,;!?#]+$/, "");
  const emailParam = (searchParams.get("email") || "").trim();
  const roleParam = (searchParams.get("role") || "").trim().toLowerCase();
  const codeParam = (searchParams.get("code") || "").trim().toUpperCase();

  // If role is specified and not student, or if code parameter is passed, use the Secure Code Activation flow
  const isCodeFlow = Boolean(codeParam || (roleParam && roleParam !== "student"));

  const [manualEmail, setManualEmail] = useState("");
  const activeEmail = emailParam || manualEmail;

  const [activationCode, setActivationCode] = useState(codeParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isAlreadyConsumed, setIsAlreadyConsumed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Resend activation link state
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  // Validate presence of credentials on mount
  useEffect(() => {
    if (!isCodeFlow && !tokenParam) {
      setErrorMsg("Missing or invalid activation token. If you received an invitation, please check your email or request a fresh link below.");
      setIsExpired(true);
    }
  }, [isCodeFlow, tokenParam]);

  // Handle auto-redirect countdown on immediate student success
  useEffect(() => {
    let timer;
    if (isSuccess && !isPendingApproval && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSuccess && !isPendingApproval && redirectCountdown === 0) {
      navigate("/");
    }
    return () => clearTimeout(timer);
  }, [isSuccess, isPendingApproval, redirectCountdown, navigate]);

  // Password policy criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsExpired(false);
    setIsAlreadyConsumed(false);

    if (isCodeFlow) {
      if (!activationCode) {
        setErrorMsg("Secure activation code is required. Please check your invitation email.");
        return;
      }
      if (!activeEmail || !activeEmail.includes("@")) {
        setErrorMsg("A valid registered email address is required.");
        return;
      }
    } else if (!tokenParam) {
      setErrorMsg("Activation token is missing. Please check your email link or request a fresh link below.");
      setIsExpired(true);
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const baseUrl = getApiBaseUrl();

      if (isCodeFlow) {
        // Part 2 & Part 4: Activate staff / admin with secure code
        const res = await fetch(`${baseUrl}/auth/activate-with-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: activeEmail,
            code: activationCode,
            password,
            confirmPassword,
            role: roleParam || undefined,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          const message = data.message || "Failed to activate account.";
          if (message.toLowerCase().includes("already") || message.toLowerCase().includes("sign in")) {
            setIsAlreadyConsumed(true);
          }
          setErrorMsg(message);
          return;
        }

        setIsSuccess(true);
        setIsPendingApproval(true);
      } else {
        // Student Career Gateway token activation (Preserved Flow)
        const res = await fetch(`${baseUrl}/integrations/career-gateway/activate-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenParam,
            password: password,
            email: activeEmail || undefined,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          const message = data.message || "Failed to activate account.";
          if (message.toLowerCase().includes("already") || message.toLowerCase().includes("sign in")) {
            setIsAlreadyConsumed(true);
          } else {
            setIsExpired(true);
          }
          setErrorMsg(message);
          return;
        }

        setIsSuccess(true);
      }
    } catch (err) {
      setErrorMsg("Network error connecting to activation service. Please verify your internet connection and try again.");
      setIsExpired(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const emailToSend = activeEmail.trim();
    if (!emailToSend || !emailToSend.includes("@")) {
      setResendStatus("Please enter your registered student email above to receive a new link.");
      return;
    }

    setResending(true);
    setResendStatus("");

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/integrations/career-gateway/resend-activation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSend }),
      });
      const data = await res.json().catch(() => ({}));
      setResendStatus(data.message || `If an eligible account exists for ${emailToSend}, a fresh activation email has been dispatched.`);
    } catch (_) {
      setResendStatus("Failed to send activation email. Please contact your placement coordinator or administrator.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="activate-account-page">
      {/* Decorative Background Shapes matching registration page */}
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

      <div className="activate-account-card">
        {/* Header Branding */}
        <div className="activate-account-header">
          <img src={Logo2} alt="TrainX" className="activate-account-logo" />
          <h1 className="activate-account-title">Activate Your Account</h1>
          <p className="activate-account-subtitle">
            Welcome to TrainX. Set your private password to activate your account.
          </p>
        </div>

        {/* State 1: Success / Pending Approval */}
        {isSuccess ? (
          isPendingApproval ? (
            <div className="activate-account-state activate-account-state--success">
              <div className="activate-state-icon-box activate-state-icon-box--success">
                {Icons.checkCircleLarge}
              </div>
              <h2>Account Activation Submitted! ⏳</h2>
              <p style={{ lineHeight: '1.6', color: '#475569', fontSize: '15px' }}>
                Your password has been successfully configured. Your TrainX account is now <strong>Pending Administrator Approval</strong>.
              </p>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '20px 0', textAlign: 'left', fontSize: '13.5px', color: '#334155' }}>
                <div><strong>Registered Email:</strong> {activeEmail}</div>
                <div style={{ marginTop: '6px' }}><strong>Status:</strong> <span style={{ color: '#d97706', fontWeight: 700 }}>Pending Approval</span></div>
                <div style={{ marginTop: '6px', color: '#64748b', fontSize: '12.5px' }}>
                  An administrator has been notified to review and approve your account. You will receive an email once your account is approved and ready for sign-in.
                </div>
              </div>
              <Link to="/" className="activate-btn activate-btn--primary">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <div className="activate-account-state activate-account-state--success">
              <div className="activate-state-icon-box activate-state-icon-box--success">
                {Icons.checkCircleLarge}
              </div>
              <h2>Account Activated Successfully!</h2>
              <p>
                Your account credentials have been created. You can now access your dashboard and workspace.
              </p>
              <div className="activate-countdown-badge">
                Redirecting to login in <strong>{redirectCountdown}</strong> seconds...
              </div>
              <Link to="/" className="activate-btn activate-btn--primary">
                Proceed to Sign In Now
              </Link>
            </div>
          )
        ) : isAlreadyConsumed ? (
          /* State 2: Already Activated */
          <div className="activate-account-state activate-account-state--info">
            <div className="activate-state-icon-box activate-state-icon-box--info">
              {Icons.infoCircle}
            </div>
            <h2>Account Already Activated</h2>
            <p>
              This activation token has already been consumed. Your password is set and active.
            </p>
            <Link to="/" className="activate-btn activate-btn--primary">
              Sign In to Your Account
            </Link>
          </div>
        ) : (
          /* State 3: Active Setup Form */
          <form onSubmit={handleSubmit} className="activate-account-form">
            {/* Error Notification */}
            {errorMsg && (
              <div className="activate-alert activate-alert--error">
                <span className="activate-alert-icon">{Icons.alertCircle}</span>
                <div className="activate-alert-content">
                  <span className="activate-alert-title">Activation Notice</span>
                  <span className="activate-alert-desc">{errorMsg}</span>
                  {!isCodeFlow && (
                    <div className="activate-resend-prompt">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="activate-resend-link"
                      >
                        {resending ? "Sending New Link..." : "Request a Fresh Activation Link"}
                      </button>
                      {resendStatus && <div className="activate-resend-status">{resendStatus}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            {emailParam ? (
              <div className="activate-input-group">
                <label className="activate-label" htmlFor="user-email">
                  {Icons.email} Registered Email
                </label>
                <div className="activate-input-wrapper activate-input-wrapper--readonly">
                  <input
                    id="user-email"
                    type="email"
                    value={emailParam}
                    readOnly
                    tabIndex={-1}
                    className="activate-input"
                  />
                  <span className="activate-readonly-badge">Verified</span>
                </div>
              </div>
            ) : (
              <div className="activate-input-group">
                <label className="activate-label" htmlFor="manual-email">
                  {Icons.email} Registered Email *
                </label>
                <div className="activate-input-wrapper">
                  <input
                    id="manual-email"
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="e.g. yourname@college.edu"
                    required
                    disabled={loading}
                    className="activate-input"
                  />
                </div>
              </div>
            )}

            {/* Secure Activation Code Field (Part 2 & Part 4) */}
            {isCodeFlow && (
              <div className="activate-input-group">
                <label className="activate-label" htmlFor="secure-activation-code">
                  {Icons.shieldCheck} Secure Activation Code *
                </label>
                <div className="activate-input-wrapper">
                  <input
                    id="secure-activation-code"
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ADM-2026-1234"
                    required
                    disabled={loading}
                    className="activate-input"
                    style={{ letterSpacing: '2px', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Enter the activation code received in your invitation email.
                </span>
              </div>
            )}

            {/* Password Input */}
            <div className="activate-input-group">
              <label className="activate-label" htmlFor="new-password">
                {Icons.lock} Set New Password *
              </label>
              <div className="activate-input-wrapper">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password (min 8 chars)"
                  required
                  autoFocus
                  disabled={loading}
                  className="activate-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="activate-pwd-toggle"
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="activate-input-group">
              <label className="activate-label" htmlFor="confirm-password">
                {Icons.lock} Confirm New Password *
              </label>
              <div className="activate-input-wrapper">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  className="activate-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="activate-pwd-toggle"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
            </div>

            {/* Password Criteria Checklist */}
            <div className="activate-criteria-box">
              <span className="activate-criteria-title">Password Security Requirements:</span>
              <ul className="activate-criteria-list">
                <li className={hasMinLength ? "is-met" : ""}>
                  <span className="activate-bullet">{Icons.check}</span> Minimum 8 characters
                </li>
                <li className={hasUppercase ? "is-met" : ""}>
                  <span className="activate-bullet">{Icons.check}</span> At least 1 uppercase letter (A-Z)
                </li>
                <li className={hasLowercase ? "is-met" : ""}>
                  <span className="activate-bullet">{Icons.check}</span> At least 1 lowercase letter (a-z)
                </li>
                <li className={hasNumber ? "is-met" : ""}>
                  <span className="activate-bullet">{Icons.check}</span> At least 1 number (0-9)
                </li>
                <li className={hasSpecial ? "is-met" : ""}>
                  <span className="activate-bullet">{Icons.check}</span> At least 1 special character (!@#$%^&*)
                </li>
                <li className={passwordsMatch ? "is-met" : ""}>
                  <span className="activate-bullet">{Icons.check}</span> Passwords match
                </li>
              </ul>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading || (isCodeFlow ? (!activationCode || !isFormValid) : (!tokenParam || !isFormValid))}
              className={`activate-btn activate-btn--primary ${loading ? "is-loading" : ""}`}
            >
              {loading ? (
                <>
                  <span className="activate-spinner" /> Submitting Activation...
                </>
              ) : (
                "Set Password & Activate Account"
              )}
            </button>

            {/* Footer Navigation */}
            <div className="activate-footer">
              <p>
                Already set your password? <Link to="/">Sign in directly</Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

