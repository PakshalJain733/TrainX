import { useState } from "react";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roll_number: "",
    mobile_number: "",
    department: "",
    year: "",
    division: "",
    secure_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (data.success) {
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
              <option value="Faculty">Faculty</option>
              <option value="Mentor">Mentor</option>
              <option value="HOD">HOD</option>
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
      </div>
    </div>
  );
}

export default Register;