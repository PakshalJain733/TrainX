
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import TrainXIcon from "../../assets/TrainX.png";
import { getApiBaseUrl } from "../../utils/api";
import { Card, CardContent } from "../../components/ui/Card";
import "./register.css";

/* ── Inline dropdown for Register page (CSS: register.css .reg-select-*) ── */
function RegSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const safeOptions = Array.isArray(options) ? options : [];
  const selected = safeOptions.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`reg-select-wrap${isOpen ? ' reg-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`reg-select-trigger${isOpen ? ' reg-select-trigger--open' : ''}`} title={selected?.fullName || selected?.label || ""}>
        {Icon && <span className="reg-select-icon">{Icon}</span>}
        <span className="reg-select-text">{selected ? selected.label : <span style={{ color: '#94a3b8' }}>{placeholder}</span>}</span>
        <svg className={`reg-select-arrow${isOpen ? ' reg-select-arrow--rotate' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {isOpen && (
        <div className="reg-select-dropdown">
          {safeOptions.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`reg-select-option${isSel ? ' reg-select-option--selected' : ''}`} title={opt.fullName || opt.label}>
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
  college: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2 2 7h20L12 2z" />
    </svg>
  ),
  refresh: (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState("Student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    college_name: "",
    mobile_number: "",
    roll_number: "",
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

  const [colleges, setColleges] = useState([]);
  const [deptOptions, setDeptOptions] = useState([]);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/colleges`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.data)) {
          setColleges(data.data);
        } else if (Array.isArray(data)) {
          setColleges(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load colleges for domain validation:", err);
      });
  }, []);

  useEffect(() => {
    const email = (formData.email || "").trim();
    if (!email.includes("@") || email.split("@")[1].length < 3) {
      setDeptOptions([]);
      setFormData((prev) => ({ ...prev, department: "" }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/departments-by-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const formatted = data.data.map((d) => {
            let shortCode = (d.code && d.code.trim()) || "";
            if (!shortCode && d.label) {
              if (d.label.includes("(")) shortCode = d.label.match(/\(([^)]+)\)/)?.[1]?.trim() || "";
              else if (d.label.includes("-")) shortCode = d.label.split("-")[0]?.trim() || "";
            }
            if (!shortCode && d.name) {
              if (d.name.includes("(")) shortCode = d.name.match(/\(([^)]+)\)/)?.[1]?.trim() || "";
              else if (d.name.includes("-")) shortCode = d.name.split("-")[0]?.trim() || "";
            }
            if (!shortCode && d.value) {
              if (String(d.value).includes("(")) shortCode = String(d.value).match(/\(([^)]+)\)/)?.[1]?.trim() || "";
              else if (String(d.value).includes("-")) shortCode = String(d.value).split("-")[0]?.trim() || "";
            }
            if (!shortCode) {
              shortCode = (d.code || d.value || d.name || "").trim();
            }
            const fullName = d.fullName || d.name || d.value || shortCode;
            return {
              value: shortCode,
              label: shortCode,
              code: shortCode,
              fullName: fullName,
            };
          });
          setDeptOptions(formatted);
          setFormData((prev) => {
            const hasExisting = formatted.some((d) => String(d.value).toLowerCase() === String(prev.department).toLowerCase());
            return {
              ...prev,
              department: hasExisting ? prev.department : (formatted[0]?.value || ""),
            };
          });
        } else {
          setDeptOptions([]);
          setFormData((prev) => ({ ...prev, department: "" }));
        }
      } catch (err) {
        console.warn("Error fetching departments by email domain:", err);
        setDeptOptions([]);
        setFormData((prev) => ({ ...prev, department: "" }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.email]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const nameParam = searchParams.get("name");
    const roleParam = searchParams.get("role");
    const mobileParam = searchParams.get("mobile_number") || searchParams.get("phone") || searchParams.get("mobile");
    const rollParam = searchParams.get("roll_number") || searchParams.get("roll_id") || searchParams.get("college_id");
    const deptParam = searchParams.get("department") || searchParams.get("dept");
    const yearParam = searchParams.get("year");
    const divParam = searchParams.get("division") || searchParams.get("div");

    if (emailParam || nameParam) {
      if (roleParam) {
        const formattedRole = roleParam.charAt(0).toUpperCase() + roleParam.slice(1).toLowerCase();
        setRole(formattedRole);
      }
      setFormData((prev) => ({
        ...prev,
        name: nameParam || prev.name,
        email: emailParam || prev.email,
        mobile_number: mobileParam || prev.mobile_number,
        roll_number: rollParam || prev.roll_number,
        department: deptParam || prev.department,
        year: yearParam || prev.year,
        division: divParam || prev.division,
      }));
      setSuccessMsg("Pre-registered account loaded! Your details added by Administrator are pre-filled below. Create a password to complete registration.");
    }
  }, [searchParams]);

  // TOTP Authenticator Setup State
  const [totpSetupData, setTotpSetupData] = useState(null);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [totpCode, setTotpCode] = useState(["", "", "", "", "", ""]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [totpTab, setTotpTab] = useState("qr"); // 'qr' | 'manual'
  const totpInputRefs = useRef([]);

  // Live polling for Admin approval while on the pending approval screen
  useEffect(() => {
    if (!showPendingApproval || isApproved) return undefined;

    const emailToCheck = registeredEmail || formData.email?.trim() || totpSetupData?.user?.email;
    if (!emailToCheck) return undefined;

    const pollApproval = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/registration-status?email=${encodeURIComponent(emailToCheck)}`);
        const json = await res.json();
        if (json.success && json.data?.isApproved) {
          setIsApproved(true);
        }
      } catch (_) {
        // silent polling fallback
      }
    };

    pollApproval();
    const interval = setInterval(pollApproval, 3000);
    return () => clearInterval(interval);
  }, [showPendingApproval, isApproved, registeredEmail, formData.email, totpSetupData]);

  // Auto-redirect countdown when approval is confirmed
  useEffect(() => {
    if (!isApproved) return undefined;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isApproved, navigate]);

  // College Email OTP verification (must pass before an account is created)
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [resendIn, setResendIn] = useState(0);
  const emailOtpRefs = useRef([]);
  const resendTimerRef = useRef(null);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    resendTimerRef.current = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(resendTimerRef.current);
  }, [resendIn]);

  useEffect(() => () => clearTimeout(resendTimerRef.current), []);

  // Request College Access Key / Demo State
  const [isRequestDemoOpen, setIsRequestDemoOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Secure Code Request State (for College Admin self-registration)
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [codeRequestedMsg, setCodeRequestedMsg] = useState("");

  const handleRequestSecureCode = async () => {
    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim();
    const collegeName = (formData.college_name || "").trim();

    if (!name || !email) {
      setErrorMsg("Please enter your Full Name and Email before requesting a Secure Code.");
      return;
    }
    if (!collegeName) {
      setErrorMsg("Please enter or select your College / Institution Name before requesting a Secure Code.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid college email address.");
      return;
    }

    setIsRequestingCode(true);
    setErrorMsg("");
    setCodeRequestedMsg("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/request-secure-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role: role || "Admin",
          collegeName,
          college_name: collegeName,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setCodeRequested(true);
        setCodeRequestedMsg(`✓ Secure code request sent to Super Admin for "${collegeName}"! Super Admin will select your college and generate your code.`);
        setSuccessMsg(`Secure code request sent for ${collegeName}!`);
      } else {
        setErrorMsg(data.message || "Failed to request secure code. Please try again.");
      }
    } catch (err) {
      console.error("Error requesting secure code:", err);
      setErrorMsg("Unable to connect to server. Please try again.");
    } finally {
      setIsRequestingCode(false);
    }
  };

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
        if (role === "Admin" || data.data?.user?.role === "college_admin") {
          setShowTotpSetup(false);
          setSuccessMsg("🎉 Registration and 2FA verified successfully! Please log in with your email and password.");
          setTimeout(() => {
            navigate("/?registered=true");
          }, 1500);
        } else {
          setRegisteredEmail(emailToVerify);
          setShowTotpSetup(false);
          setShowPendingApproval(true);
          setErrorMsg("");
          setSuccessMsg("");
        }
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
    if (name === "email") {
      setEmailOtpSent(false);
      setEmailVerified(false);
      setEmailOtp(["", "", "", "", "", ""]);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateDetails = () => {
    if (!role) {
      setErrorMsg("Please select your role.");
      return false;
    }
    const name = (formData.name || "").trim();
    if (!name) {
      setErrorMsg("Please enter your full name.");
      return false;
    }
    const email = (formData.email || "").trim();
    if (!email) {
      setErrorMsg("Please enter your college email address.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid college email address.");
      return false;
    }
    if (!formData.password) {
      setErrorMsg("Please create a password.");
      return false;
    }
    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setErrorMsg("Passwords do not match. Please re-enter passwords.");
      return false;
    }
    if (role === "Student") {
      const roll = (formData.roll_number || "").trim();
      if (!roll) {
        setErrorMsg("Please enter your College ID.");
        return false;
      }
      const mobile = (formData.mobile_number || "").trim();
      if (!mobile) {
        setErrorMsg("Please enter your mobile number.");
        return false;
      }
      if (mobile.length < 10) {
        setErrorMsg("Please enter a valid 10-digit mobile number.");
        return false;
      }
      if (deptOptions.length > 0 && !formData.department) {
        setErrorMsg("Please select your department.");
        return false;
      }
      if (!formData.year) {
        setErrorMsg("Please select your academic year.");
        return false;
      }
      if (!(formData.division || "").trim()) {
        setErrorMsg("Please enter your division.");
        return false;
      }
    } else {
      const mobile = (formData.mobile_number || "").trim();
      if (mobile && mobile.length < 10) {
        setErrorMsg("Please enter a valid 10-digit mobile number.");
        return false;
      }
      if (role === "Admin") {
        const col = (formData.college_name || "").trim();
        if (!col) {
          setErrorMsg("Please enter your College / Institution Name.");
          return false;
        }
      }
      const secureCode = (formData.secure_code || "").trim();
      if (!secureCode) {
        setErrorMsg("Please enter your Secure Access Code.");
        return false;
      }
    }
    return true;
  };

  const isFormFullyFilled = () => {
    if (!role) return false;
    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim();
    const pass = formData.password || "";
    const confirmPass = formData.confirm_password || "";

    if (!name || !email) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (pass.length < 6 || pass !== confirmPass) return false;

    if (role === "Student") {
      const roll = (formData.roll_number || "").trim();
      const mobile = (formData.mobile_number || "").trim();
      const yr = formData.year || "";
      const div = formData.division || "";
      if (!roll || !mobile || mobile.length < 10 || !yr || !div) return false;
      if (deptOptions.length > 0 && !formData.department) return false;
    } else if (role === "Admin") {
      const col = (formData.college_name || "").trim();
      const secureCode = (formData.secure_code || "").trim();
      if (!col || !secureCode) return false;
    } else {
      const secureCode = (formData.secure_code || "").trim();
      if (!secureCode) return false;
    }

    return true;
  };

  const isEmailValidForOtp = () => {
    const email = (formData.email || "").trim();
    return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const requestEmailOtp = async () => {
    const email = (formData.email || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address before requesting OTP.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/register/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: formData.name || "", role }),
      });
      const data = await response.json();
      if (data.success) {
        setEmailOtpSent(true);
        setEmailOtp(["", "", "", "", "", ""]);
        setResendIn(60);
        setSuccessMsg(`Verification code sent to ${email}. Enter it below to create your account.`);
        setTimeout(() => emailOtpRefs.current[0]?.focus(), 100);
      } else {
        setErrorMsg(data.message || "Could not send the verification code.");
      }
    } catch (err) {
      console.error("Registration OTP send error:", err);
      setErrorMsg("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (codeOverride) => {
    const code = codeOverride || emailOtp.join("");
    if (!/^\d{6}$/.test(code)) {
      setErrorMsg("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    setVerifyingEmailOtp(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/register/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim(), otp: code }),
      });
      const data = await response.json();
      if (data.success) {
        setEmailVerified(true);
        setSuccessMsg("✅ College Email verified successfully! You can now complete your registration details.");
        setErrorMsg("");
      } else {
        setErrorMsg(data.message || "Invalid or expired verification code.");
      }
    } catch (err) {
      console.error("Registration OTP verify error:", err);
      setErrorMsg("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleEmailOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    setEmailOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      const joined = next.join("");
      if (joined.length === 6) {
        handleVerifyEmailOtp(joined);
      }
      return next;
    });
    if (value && index < 5) {
      emailOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleEmailOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !emailOtp[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) emailOtpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) emailOtpRefs.current[index + 1]?.focus();
  };

  const handleEmailOtpPaste = (e) => {
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (pasted.length !== 6) return;
    e.preventDefault();
    setEmailOtp(pasted.split(""));
    emailOtpRefs.current[5]?.focus();
    handleVerifyEmailOtp(pasted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateDetails()) return;

    // Email verification check for Student role
    if (role === "Student" && !emailVerified) {
      setErrorMsg("Please request and verify the 6-digit OTP sent to your college email before completing registration.");
      return;
    }

    let otp = "";
    if (role === "Student") {
      otp = emailOtp.join("");
      if (!/^\d{6}$/.test(otp)) {
        setErrorMsg("Please enter and verify the 6-digit code sent to your email.");
        return;
      }
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/register/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim(),
          role,
          otp,
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.qrCode) {
        setTotpSetupData(data.data);
        setShowTotpSetup(true);
        setSuccessMsg("");
      } else if (data.success) {
        if (role === "Admin") {
          setSuccessMsg("Account created successfully!");
          setTimeout(() => {
            navigate("/");
          }, 2500);
        } else {
          setRegisteredEmail(formData.email.trim());
          setShowPendingApproval(true);
          setErrorMsg("");
          setSuccessMsg("");
        }
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

        {errorMsg && (
          <div className="auth-error-msg" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
            <span>{errorMsg}</span>
            {(errorMsg.toLowerCase().includes("already register") || errorMsg.toLowerCase().includes("please log in")) && (
              <button
                type="button"
                onClick={() => navigate("/")}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "2px"
                }}
              >
                Go to Login →
              </button>
            )}
          </div>
        )}
        {!showTotpSetup && !showPendingApproval && successMsg && <div className="auth-success-msg">{successMsg}</div>}

        {showPendingApproval ? (
          <div className={`pending-approval-card ${isApproved ? "approved" : ""}`}>
            <div className={`pending-approval-icon-wrapper ${isApproved ? "approved" : ""}`}>
              {isApproved ? (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )}
            </div>

            <h3 className={`pending-approval-title ${isApproved ? "approved" : ""}`}>
              {isApproved ? "Registration Approved! 🎉" : "Registration & 2FA Setup Complete!"}
            </h3>

            <p className="pending-approval-subtitle">
              {isApproved
                ? "Your account has been officially approved by the College Administrator. You can now log in!"
                : "Your registration details and Authenticator app (2FA) pairing have been successfully verified."}
            </p>

            <div className={`pending-approval-box ${isApproved ? "approved" : ""}`}>
              <div className={`pending-approval-badge-row ${isApproved ? "approved" : ""}`}>
                <span className={`pending-approval-badge ${isApproved ? "approved" : ""}`}>
                  {isApproved ? "Status: Approved" : "Status: Pending Admin Approval"}
                </span>
              </div>
              <p className={`pending-approval-desc ${isApproved ? "approved" : ""}`}>
                {isApproved
                  ? `Your account is active and verified! Redirecting to login screen automatically in ${redirectCountdown}s...`
                  : "You can login only after an Administrator approves your account. Your registration is currently under review by college administration."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className={`pending-approval-btn ${isApproved ? "approved" : ""}`}
            >
              {isApproved ? (
                <>
                  <span>Proceed to Login Screen ({redirectCountdown}s)</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Return to Login Screen</span>
                </>
              )}
            </button>
          </div>
        ) : showTotpSetup ? (
          <form onSubmit={handleVerifyTotpSetup} className="totp-setup-form">
            <div className="totp-header">
              <h3 className="totp-title">Pair Authenticator App</h3>
              <p className="totp-subtitle">
                Scan QR Code using Authenticator App.
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
              <div className="login-otp-input-row" onPaste={handleTotpPaste}>
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
                {/* Row 1: Full Name | College ID | Mobile Number */}
                <div className="form-grid-student-row1">
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
                    <FieldLabel icon={Icons.id}>College ID</FieldLabel>
                    <input
                      type="text"
                      name="roll_number"
                      autoComplete="off"
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
                      autoComplete="tel"
                      required
                      placeholder="Mobile number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Row 2: College Email & Inline 6-Digit OTP Code */}
                <div className="input-group" style={{ marginBottom: "11px" }}>
                  {emailVerified ? (
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <FieldLabel icon={Icons.email}>College Email</FieldLabel>
                        <button
                          type="button"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#2563eb",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0
                          }}
                          onClick={() => {
                            setEmailVerified(false);
                            setEmailOtpSent(false);
                            setEmailOtp(["", "", "", "", "", ""]);
                            setSuccessMsg("");
                          }}
                        >
                          Change Email
                        </button>
                      </div>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        placeholder="name@college.edu"
                        value={formData.email}
                        readOnly
                        style={{ backgroundColor: "#f8fafc", cursor: "default" }}
                      />
                    </div>
                  ) : (
                    <div className={emailOtpSent ? "form-grid-2" : "input-group"} style={{ marginBottom: 0 }}>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <FieldLabel icon={Icons.email}>College Email</FieldLabel>
                        <div className="email-with-otp-row">
                          <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            required
                            placeholder="name@college.edu"
                            value={formData.email}
                            onChange={handleChange}
                          />
                          {!emailOtpSent && (
                            <button
                              type="button"
                              className={`get-otp-inline-btn ${isEmailValidForOtp() ? "active" : ""}`}
                              disabled={!isEmailValidForOtp() || loading}
                              onClick={requestEmailOtp}
                            >
                              {loading ? "Sending..." : "Get OTP"}
                            </button>
                          )}
                        </div>
                        {(() => {
                          if (!formData.email || !formData.email.includes("@")) return null;
                          const userDomain = (formData.email.split("@")[1] || "").toLowerCase().trim();
                          const selectedCollege = Array.isArray(colleges) ? colleges.find(c => String(c.id) === String(formData.college_id)) : null;
                          const expectedDomain = (selectedCollege?.domain || selectedCollege?.email_domain || "pvppcoe.ac.in").toLowerCase().replace(/^@/, "");
                          if (userDomain && expectedDomain && !userDomain.endsWith(expectedDomain) && !userDomain.includes(expectedDomain)) {
                            return (
                              <div style={{ fontSize: "12px", color: "#d97706", marginTop: "5px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                                <span>⚠️ Non-college email domain (@{userDomain}). Flagged for Admin review.</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Right Column: 6-Digit OTP Code beside Email Bar */}
                      {emailOtpSent && (
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <div className="label-with-resend-row">
                            <FieldLabel icon={Icons.shield}>Enter 6-Digit Code</FieldLabel>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {verifyingEmailOtp && (
                                <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>Verifying...</span>
                              )}
                              <button
                                type="button"
                                className="reg-resend-symbol-btn"
                                disabled={resendIn > 0 || loading || verifyingEmailOtp}
                                onClick={requestEmailOtp}
                                title={resendIn > 0 ? `Resend available in ${resendIn}s` : "Resend OTP"}
                              >
                                {Icons.refresh}
                                <span>{resendIn > 0 ? `${resendIn}s` : "Resend"}</span>
                              </button>
                            </div>
                          </div>
                          <div className="email-with-otp-row">
                            <div className="login-otp-inputs-compact" onPaste={handleEmailOtpPaste} style={{ flex: 1 }}>
                              {emailOtp.map((digit, i) => (
                                <input
                                  key={i}
                                  ref={(el) => (emailOtpRefs.current[i] = el)}
                                  className={`login-otp-digit-input-compact ${digit ? "filled" : ""}`}
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="one-time-code"
                                  maxLength={1}
                                  aria-label={`Digit ${i + 1}`}
                                  value={digit}
                                  disabled={verifyingEmailOtp}
                                  onChange={(e) => handleEmailOtpChange(i, e.target.value)}
                                  onKeyDown={(e) => handleEmailOtpKeyDown(i, e)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 3: Department | Year | Division */}
                <div className="form-grid-student-row3">
                  <div className="input-group">
                    <FieldLabel icon={Icons.dept}>Department</FieldLabel>
                    <RegSelect
                      value={formData.department}
                      wrapperClass="reg-select"
                      options={deptOptions}
                      onChange={(val) => setFormData({ ...formData, department: val })}
                      placeholder={
                        !formData.email || !formData.email.includes("@")
                          ? "Enter college email first"
                          : deptOptions.length > 0
                            ? "Select Dept"
                            : "No departments found"
                      }
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
                    <FieldLabel icon={Icons.division}>Division</FieldLabel>
                    <input
                      type="text"
                      name="division"
                      autoComplete="off"
                      required
                      placeholder="e.g. A, B, C"
                      value={formData.division}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 4: Password | Confirm Password */}
                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.lock}>Password</FieldLabel>
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
                    <FieldLabel icon={Icons.phone}>Mobile No.</FieldLabel>
                    <input
                      type="tel"
                      name="mobile_number"
                      autoComplete="tel"
                      placeholder="Mobile number (optional)"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      maxLength={10}
                    />
                  </div>
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

                {/* College Name input for Admin self-registration */}
                {role === "Admin" && (
                  <div className="input-group" style={{ marginTop: "4px", marginBottom: "16px" }}>
                    <FieldLabel icon={Icons.college}>College / Institution Name *</FieldLabel>
                    <input
                      type="text"
                      name="college_name"
                      list="admin-colleges-datalist"
                      required
                      placeholder="Enter or select your College / Institution Name (e.g. PVPPCOE, Mumbai)"
                      value={formData.college_name || ""}
                      onChange={handleChange}
                      style={{ width: "100%" }}
                    />
                    <datalist id="admin-colleges-datalist">
                      {Array.isArray(colleges) && colleges.map((c, idx) => (
                        <option key={c.id || idx} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                )}

                {/* Row: Password | Confirm Password for Staff/Mentors */}
                <div className="form-grid-2">
                  <div className="input-group">
                    <FieldLabel icon={Icons.lock}>Password</FieldLabel>
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
                  <div className="register-secure-code-wrap" style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      name="secure_code"
                      placeholder={`Enter ${role} secure code`}
                      value={formData.secure_code}
                      onChange={handleChange}
                      style={{ flex: 1, margin: 0 }}
                    />
                    {role === "Admin" && (
                      <button
                        type="button"
                        onClick={handleRequestSecureCode}
                        disabled={isRequestingCode}
                        className={`register-request-code-btn ${codeRequested ? 'requested' : ''}`}
                        style={{
                          padding: '0 16px',
                          whiteSpace: 'nowrap',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '12.5px',
                          cursor: isRequestingCode ? 'wait' : 'pointer',
                          background: codeRequested ? '#10b981' : '#2563eb',
                          color: '#fff',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        {isRequestingCode ? "Sending..." : (codeRequested ? "✓ Code Requested" : "Generate / Request Code")}
                      </button>
                    )}
                  </div>
                  {codeRequestedMsg && (
                    <div style={{ fontSize: '12px', color: '#059669', marginTop: '6px', fontWeight: 500 }}>
                      {codeRequestedMsg}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || (role === "Student" && !emailVerified)}>
              {loading ? "Registering..." : (role === "Student" && !emailVerified ? "Verify Email to Register" : "Register")}
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