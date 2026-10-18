import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertCircle,
  QrCode,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/TrainingRegistration.css";

export default function TrainingRegistrationPage() {
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get("code") || "";
  const queryId = searchParams.get("id") || "";

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile: "",
    roll_number: "",
    college: "PVPPCOE",
    branch: "CS",
    year: "Third Year",
    division: "A",
    batch: "C2C",
    amount_paid: "",
    utr_number: "",
    payment_proof_url: "",
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    apiFetch("/departments")
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setDepartments(list);
          setFormData((prev) => ({
            ...prev,
            branch: prev.branch || list[0].code || list[0].value,
          }));
        }
      })
      .catch(() => {});

    async function loadTraining() {
      setLoading(true);
      setError("");
      try {
        let endpoint = "";
        if (queryCode) {
          endpoint = `/trainings/code/${encodeURIComponent(queryCode)}`;
        } else if (queryId) {
          endpoint = `/trainings/public/${encodeURIComponent(queryId)}`;
        } else {
          // Default to active C2C 2026 program if no param specified
          endpoint = `/trainings/code/C2C 2026`;
        }

        const res = await apiFetch(endpoint);
        if (res?.data) {
          setTraining(res.data);
          setFormData((prev) => ({
            ...prev,
            amount_paid: res.data.fee_amount ? String(res.data.fee_amount) : "3500",
          }));
        } else {
          setError(res?.error || "Training program not found.");
        }
      } catch (err) {
        setError("Could not load training details: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTraining();
  }, [queryCode, queryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!training) return;

    if (training.status !== "Open") {
      alert(`Registration for this program is currently ${training.status}.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...formData,
        training_id: training.id,
        training_code: training.code,
        amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : 0,
      };

      const res = await apiFetch("/trainings/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.error) {
        setError(res.error);
      } else {
        setSubmitSuccess(res.data || true);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="reg-page-container">
        <div className="reg-card" style={{ padding: "48px", textAlign: "center" }}>
          <div className="animate-spin" style={{ display: "inline-block", fontSize: "28px" }}>⏳</div>
          <p style={{ marginTop: "16px", color: "#64748b" }}>Loading training registration details...</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="reg-page-container">
        <div className="reg-card">
          <div className="reg-success-card">
            <div className="reg-success-icon">
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
              Registration Submitted Successfully!
            </h2>
            <p style={{ color: "#475569", fontSize: "14.5px", maxWidth: "520px", margin: "0 auto 20px auto" }}>
              Thank you for registering for <strong>{training?.name}</strong> (Code: <code>{training?.code}</code>).
              Your registration and payment verification request have been saved and sent to the administrator.
            </p>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", textAlign: "left", maxWidth: "480px", margin: "0 auto 24px auto", fontSize: "13px", color: "#334155" }}>
              <div style={{ marginBottom: "6px" }}><strong>Student:</strong> {formData.full_name}</div>
              <div style={{ marginBottom: "6px" }}><strong>Email:</strong> {formData.email}</div>
              <div style={{ marginBottom: "6px" }}><strong>Roll Number:</strong> {formData.roll_number}</div>
              <div style={{ marginBottom: "6px" }}><strong>UTR / Ref:</strong> {formData.utr_number || "Not provided"}</div>
              <div><strong>Registration Status:</strong> <span style={{ color: "#d97706", fontWeight: 600 }}>Pending Admin Approval</span></div>
            </div>

            <Link
              to="/student"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "#4f46e5",
                color: "#ffffff",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Go to Student Portal <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="reg-page-container">
        <div className="reg-card" style={{ padding: "48px", textAlign: "center" }}>
          <AlertCircle size={44} color="#ef4444" style={{ margin: "0 auto 12px auto" }} />
          <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 8px 0" }}>Training Program Not Found</h2>
          <p style={{ color: "#64748b", margin: "0 0 20px 0" }}>{error || "The requested training program link is invalid or has expired."}</p>
          <Link to="/" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>← Back to TrainX Portal</Link>
        </div>
      </div>
    );
  }

  const startDate = training.start_date ? new Date(training.start_date).toLocaleDateString("en-IN") : "TBA";
  const endDate = training.end_date ? new Date(training.end_date).toLocaleDateString("en-IN") : "TBA";

  return (
    <div className="reg-page-container">
      <div className="reg-card">
        {/* Header */}
        <div className="reg-header">
          <div className="reg-brand-badge">
            <ShieldCheck size={14} /> TrainX Official Enrollment
          </div>
          <h1 className="reg-title">{training.name}</h1>
          <p className="reg-subtitle">
            {training.description || "Official registration and enrollment portal."}
          </p>

          <div className="reg-meta-pills">
            <div className="reg-pill">
              <Briefcase size={14} /> Code: <strong>{training.code}</strong>
            </div>
            <div className="reg-pill">
              <DollarSign size={14} /> Fee: <strong>₹{Number(training.fee_amount || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div className="reg-pill">
              <Calendar size={14} /> Duration: {startDate} - {endDate}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="reg-body">
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                color: "#b91c1c",
                fontSize: "13.5px",
                marginBottom: "20px",
              }}
            >
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {training.status !== "Open" ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                color: "#92400e",
              }}
            >
              <h3 style={{ margin: "0 0 6px 0", fontSize: "16px" }}>Registration {training.status}</h3>
              <p style={{ margin: 0, fontSize: "13.5px" }}>
                Registrations for this training program are currently closed. Please contact your training coordinator.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Payment Info Box */}
              {(training.payment_instructions || training.payment_qr_url) && (
                <div className="reg-instructions-box">
                  <div className="reg-inst-title">Payment Instructions</div>
                  {training.payment_instructions && (
                    <p className="reg-inst-text">{training.payment_instructions}</p>
                  )}
                  {training.payment_qr_url && (
                    <div className="reg-qr-section" style={{ marginTop: "12px" }}>
                      <img
                        src={training.payment_qr_url}
                        alt="Payment QR"
                        className="reg-qr-img"
                      />
                      <div style={{ fontSize: "12.5px", color: "#475569" }}>
                        <strong>Scan QR Code to Pay:</strong>
                        <br />
                        Pay <strong>₹{Number(training.fee_amount || 0).toLocaleString("en-IN")}</strong> via any UPI app.
                        Save your UTR / Transaction Reference ID and screenshot before submitting.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Student Details Grid */}
              <div className="reg-form-grid">
                <div>
                  <label className="reg-label">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="reg-input"
                    placeholder="e.g. John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="reg-label">
                    Email Address <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    className="reg-input"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="reg-label">
                    Mobile Number <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    className="reg-input"
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="reg-label">
                    Roll Number / PRN <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="reg-input"
                    placeholder="e.g. 2026CS101"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="reg-label">College Name</label>
                  <input
                    type="text"
                    className="reg-input"
                    placeholder="e.g. PVPPCOE"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  />
                </div>

                <div>
                  <label className="reg-label">Branch / Department</label>
                  <select
                    className="reg-select"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  >
                    {departments.length > 0 ? (
                      departments.map((d) => {
                        const code = (d.code && d.code.trim()) || d.value;
                        return (
                          <option key={d.id || code} value={code}>
                            {code}
                          </option>
                        );
                      })
                    ) : (
                      <option value={formData.branch || "CS"}>{formData.branch || "CS"}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="reg-label">Year of Study</label>
                  <select
                    className="reg-select"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  >
                    <option value="First Year">First Year (FE)</option>
                    <option value="Second Year">Second Year (SE)</option>
                    <option value="Third Year">Third Year (TE)</option>
                    <option value="Final Year">Final Year (BE)</option>
                  </select>
                </div>

                <div>
                  <label className="reg-label">Division & Batch</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="reg-input"
                      placeholder="Div (e.g. A)"
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    />
                    <input
                      type="text"
                      className="reg-input"
                      placeholder="Batch (e.g. B1)"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="reg-label">Amount Paid (₹)</label>
                  <input
                    type="number"
                    className="reg-input"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                    min={0}
                  />
                </div>

                <div>
                  <label className="reg-label">UTR / Transaction ID</label>
                  <input
                    type="text"
                    className="reg-input"
                    placeholder="12-digit UPI reference number"
                    value={formData.utr_number}
                    onChange={(e) => setFormData({ ...formData, utr_number: e.target.value })}
                  />
                </div>

                <div className="reg-form-full">
                  <label className="reg-label">Payment Proof Link (Google Drive / Image URL)</label>
                  <input
                    type="url"
                    className="reg-input"
                    placeholder="https://drive.google.com/file/d/..."
                    value={formData.payment_proof_url}
                    onChange={(e) => setFormData({ ...formData, payment_proof_url: e.target.value })}
                  />
                  <span style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Upload screenshot to Google Drive with 'Anyone with the link can view' permission, or paste direct image link.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="reg-btn-submit"
                disabled={submitting}
              >
                {submitting ? "Submitting Registration..." : "Complete Registration"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
