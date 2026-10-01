import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  XCircle,
  Clock3,
  QrCode,
  Plus,
  Link2,
  Copy,
  Check,
  KeyRound,
  Settings2,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import CustomSelect from "../../../components/ui/CustomSelect";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/Tabs";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_C2CEnrollments.css";

const PROGRAM_CODE = "C2C 2026";

/**
 * The four mutually-exclusive payment statuses. Exactly one applies at a time
 * and the Admin sets it manually.
 */
const PAYMENT_STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "part_payment", label: "Part Payment" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_META = {
  completed: { label: "Completed", cls: "c2c-status--paid" },
  part_payment: { label: "Part Payment", cls: "c2c-status--partial" },
  pending: { label: "Pending", cls: "c2c-status--unpaid" },
  cancelled: { label: "Cancelled", cls: "c2c-status--cancelled" },
};

const ACCESS_STATUSES = [
  { value: "active", label: "Active" },
  { value: "not_activated", label: "Not Activated" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "revoked", label: "Revoked" },
];

const ACCESS_STATUS_META = {
  active: { label: "Active", cls: "c2c-access--active" },
  not_activated: { label: "Not Activated", cls: "c2c-access--muted" },
  pending: { label: "Pending", cls: "c2c-access--pending" },
  suspended: { label: "Suspended", cls: "c2c-access--suspended" },
  revoked: { label: "Revoked", cls: "c2c-access--revoked" },
};

const REGISTRATION_STATUS_META = {
  awaiting_payment: { label: "Awaiting Payment", cls: "c2c-status--unpaid" },
  awaiting_registration: { label: "Link Released", cls: "c2c-status--partial" },
  awaiting_approval: { label: "Awaiting Approval", cls: "c2c-status--pending-approval" },
  enrolled: { label: "Enrolled", cls: "c2c-status--paid" },
  cancelled: { label: "Cancelled", cls: "c2c-status--cancelled" },
};

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatCurrency = (value) => {
  const number = toNumber(value);
  return number === null ? "—" : `₹${number.toLocaleString("en-IN")}`;
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const formatDate = (value) => {
  const text = textValue(value);
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getInitials = (name) => {
  if (!name) return "—";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

/** Fallback registration link when the server-built URL is not returned. */
const buildLocalLink = (token) =>
  token ? `${window.location.origin}/register?c2c_token=${encodeURIComponent(token)}` : null;

const normalizeStatus = (value) => {
  const key = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "paid") return "completed";
  if (key === "partial" || key === "partpayment") return "part_payment";
  if (key === "unpaid") return "pending";
  if (key === "canceled") return "cancelled";
  return key;
};

/** Falls back to client-side counting so the cards always render. */
const statValue = (stats, key, rows, predicate) => {
  const fromServer = toNumber(stats?.[key]);
  if (fromServer !== null) return fromServer;
  return rows.filter(predicate).length;
};

export default function AdminC2CEnrollments() {
  const [tab, setTab] = useState("enrollments");

  // Enrollments
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Registrations (intake)
  const [registrations, setRegistrations] = useState([]);
  const [regStats, setRegStats] = useState(null);
  const [regSearch, setRegSearch] = useState("");
  const [regStatusFilter, setRegStatusFilter] = useState("all");
  const [regLoading, setRegLoading] = useState(true);

  // Modals
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPayment, setShowPayment] = useState(null);
  const [qrFor, setQrFor] = useState(null);
  const [copied, setCopied] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchEnrollments = useCallback(
    () =>
      apiFetch(`/c2c/enrollments?program_code=${encodeURIComponent(PROGRAM_CODE)}`).then((response) => {
        const payload = unwrap(response);
        if (response?.error) return { rows: [], branches: [], error: response.error };
        return {
          rows: Array.isArray(payload?.enrollments) ? payload.enrollments : Array.isArray(payload) ? payload : [],
          branches: Array.isArray(payload?.branches) ? payload.branches : [],
          error: "",
        };
      }),
    [],
  );

  const fetchRegistrations = useCallback(
    () =>
      apiFetch(`/c2c/registrations?program_code=${encodeURIComponent(PROGRAM_CODE)}`).then((response) => {
        const payload = unwrap(response);
        return {
          rows: Array.isArray(payload) ? payload : payload?.registrations || [],
          error: response?.error || "",
        };
      }),
    [],
  );

  const fetchDashboard = useCallback(
    () =>
      apiFetch(`/c2c/dashboard?program_code=${encodeURIComponent(PROGRAM_CODE)}`).then((response) => {
        const payload = unwrap(response);
        return response?.error ? null : payload;
      }),
    [],
  );

  const loadEnrollments = useCallback(() => {
    setLoading(true);
    Promise.all([fetchEnrollments(), fetchDashboard()])
      .then(([enrollmentResult, dashboard]) => {
        setRows(enrollmentResult.rows);
        setBranches(enrollmentResult.branches);
        setStats(dashboard);
        setError(enrollmentResult.error);
      })
      .finally(() => setLoading(false));
  }, [fetchEnrollments, fetchDashboard]);

  const loadRegistrations = useCallback(() => {
    setRegLoading(true);
    Promise.all([fetchRegistrations(), fetchDashboard()])
      .then(([registrationResult, dashboard]) => {
        setRegistrations(registrationResult.rows);
        setRegStats(dashboard);
      })
      .finally(() => setRegLoading(false));
  }, [fetchRegistrations, fetchDashboard]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleRefresh = () => {
    loadEnrollments();
    loadRegistrations();
  };

  // --- Enrollment filtering -------------------------------------------------

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (query) {
        const haystack = [row.name, row.rollNumber, row.email, row.mobile, row.batchName, row.utr]
          .map(textValue)
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (branchFilter !== "all") {
        const branchId = textValue(row.departmentId);
        const branchName = textValue(row.branch);
        const match = branches.find((b) => String(b.id) === branchFilter || b.name === branchName);
        if (match && String(match.id) !== branchFilter) return false;
        if (!match && branchName !== branchFilter) return false;
      }
      if (statusFilter !== "all" && normalizeStatus(row.paymentStatus) !== statusFilter) return false;
      return true;
    });
  }, [rows, search, branchFilter, statusFilter, branches]);

  const counts = {
    total: statValue(stats, "totalEnrolled", rows, () => true),
    completed: statValue(stats, "completed", rows, (r) => normalizeStatus(r.paymentStatus) === "completed"),
    partPayment: statValue(stats, "partPayment", rows, (r) => normalizeStatus(r.paymentStatus) === "part_payment"),
    pending: statValue(stats, "pending", rows, (r) => normalizeStatus(r.paymentStatus) === "pending"),
    cancelled: statValue(stats, "cancelled", rows, (r) => normalizeStatus(r.paymentStatus) === "cancelled"),
  };

  // --- Registration filtering ----------------------------------------------

  const filteredRegistrations = useMemo(() => {
    const query = regSearch.trim().toLowerCase();
    return registrations.filter((row) => {
      if (query) {
        const haystack = [row.name, row.email, row.mobile, row.rollNumber, row.utr, row.branch]
          .map(textValue)
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (regStatusFilter !== "all" && row.status !== regStatusFilter) return false;
      return true;
    });
  }, [registrations, regSearch, regStatusFilter]);

  // --- Actions -------------------------------------------------------------

  const handlePaymentStatusChange = async (row, nextStatus) => {
    if (normalizeStatus(row.paymentStatus) === nextStatus) return;
    setSavingId(row.enrollmentId);
    const response = await apiFetch(`/c2c/enrollments/${row.enrollmentId}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus: nextStatus }),
    });
    if (response?.error) {
      showToast(response.error, "error");
    } else {
      const updated = unwrap(response);
      setRows((prev) =>
        prev.map((item) => (item.enrollmentId === row.enrollmentId ? { ...item, ...updated } : item))
      );
      showToast(`Payment status set to ${PAYMENT_STATUS_META[nextStatus]?.label || nextStatus}`);
    }
    setSavingId(null);
  };

  const handleAccessStatusChange = async (row, nextStatus) => {
    if (row.accessStatus === nextStatus) return;
    setSavingId(row.enrollmentId);
    const response = await apiFetch(`/c2c/enrollments/${row.enrollmentId}/access`, {
      method: "PATCH",
      body: JSON.stringify({ accessStatus: nextStatus }),
    });
    if (response?.error) {
      showToast(response.error, "error");
    } else {
      const updated = unwrap(response);
      setRows((prev) =>
        prev.map((item) => (item.enrollmentId === row.enrollmentId ? { ...item, ...updated } : item))
      );
      showToast(`Software access set to ${ACCESS_STATUS_META[nextStatus]?.label || nextStatus}`);
    }
    setSavingId(null);
  };

  const openQr = async (registration) => {
    const response = await apiFetch(`/c2c/registrations/${registration.registrationId}/qr`);
    if (response?.error) {
      showToast(response.error, "error");
      return;
    }
    setQrFor({ ...registration, ...unwrap(response) });
  };

  const releaseLink = async (registration, { email }) => {
    const response = await apiFetch(`/c2c/registrations/${registration.registrationId}/registration-link`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (response?.error) {
      showToast(response.error, "error");
      return;
    }
    const updated = unwrap(response);
    setRegistrations((prev) =>
      prev.map((item) => (item.registrationId === registration.registrationId ? { ...item, ...updated } : item))
    );
    showToast(email ? "Registration link released and emailed" : "Registration link released");
    return updated?.registrationLink;
  };

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="admin-page-inner c2c-container">
      <SectionHeader
        icon={Briefcase}
        title="C2C Enrollment"
        description={`Program ${PROGRAM_CODE} · payment intake, enrollment records and TrainX access, all read from the database.`}
        action={
          <div className="c2c-header-actions">
            <button type="button" className="c2c-btn-refresh" onClick={() => setShowSettings(true)}>
              <Settings2 size={15} /> Settings
            </button>
            <button type="button" className="c2c-btn-primary" onClick={() => setShowCreateLead(true)}>
              <Plus size={15} /> New Registration
            </button>
            <button type="button" className="c2c-btn-refresh" onClick={handleRefresh} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        }
      />

      {error && (
        <div className="c2c-error-banner">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {toast && (
        <div className={`c2c-toast c2c-toast--${toast.type === "error" ? "error" : "success"}`}>
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {toast.message}
        </div>
      )}

      <div className="c2c-stats-grid">
        <div className="c2c-stat-card">
          <div className="c2c-stat-icon c2c-stat-icon--indigo"><Users size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.total}</span>
            <span className="c2c-stat-lbl">Total Enrolled</span>
          </div>
        </div>
        <div className="c2c-stat-card">
          <div className="c2c-stat-icon c2c-stat-icon--emerald"><CheckCircle2 size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.completed}</span>
            <span className="c2c-stat-lbl">Payment Completed</span>
          </div>
        </div>
        <div className="c2c-stat-card">
          <div className="c2c-stat-icon c2c-stat-icon--amber"><TrendingUp size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.partPayment}</span>
            <span className="c2c-stat-lbl">Part Payment</span>
          </div>
        </div>
        <div className="c2c-stat-card">
          <div className="c2c-stat-icon c2c-stat-icon--sky"><Clock3 size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.pending}</span>
            <span className="c2c-stat-lbl">Pending</span>
          </div>
        </div>
        <div className="c2c-stat-card">
          <div className="c2c-stat-icon c2c-stat-icon--rose"><XCircle size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.cancelled}</span>
            <span className="c2c-stat-lbl">Cancelled</span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="c2c-tabs">
        <TabsList className="c2c-tabs-list">
          <TabsTrigger value="enrollments" className="c2c-tabs-trigger">C2C Enrollments</TabsTrigger>
          <TabsTrigger value="registrations" className="c2c-tabs-trigger">
            Payment QR &amp; Registration
            {regStats?.registrations?.awaitingApproval ? ` (${regStats.registrations.awaitingApproval})` : ""}
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ C2C Enrollment */}
        <TabsContent value="enrollments" className="c2c-tabs-content">
          <div className="c2c-toolbar">
            <div className="c2c-search-wrap">
              <Search size={16} className="c2c-search-icon" />
              <input
                type="text"
                className="c2c-search-input"
                placeholder="Search by student, roll ID, email, mobile, batch or UTR..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="c2c-filters">
              <CustomSelect
                value={branchFilter}
                onChange={(val) => setBranchFilter(val)}
                options={[
                  { value: "all", label: "All Branches" },
                  ...branches.map((b) => ({ value: String(b.id), label: b.name })),
                ]}
                className="c2c-custom-select"
              />
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[{ value: "all", label: "All Payments" }, ...PAYMENT_STATUSES]}
                className="c2c-custom-select"
              />
            </div>
          </div>

          <div className="c2c-table-card">
            <div className="c2c-table-responsive">
              <table className="c2c-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Branch</th>
                    <th>Batch</th>
                    <th className="c2c-num">Total Fee</th>
                    <th className="c2c-num">Amount Paid</th>
                    <th className="c2c-num">Balance</th>
                    <th>Payment Status</th>
                    <th>Software / Access</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8}><div className="c2c-empty">Loading enrollments...</div></td></tr>
                  ) : filteredEnrollments.length > 0 ? (
                    filteredEnrollments.map((row, index) => {
                      const paymentKey = normalizeStatus(row.paymentStatus) || "pending";
                      const paymentMeta = PAYMENT_STATUS_META[paymentKey] || { label: paymentKey, cls: "" };
                      const accessKey = row.accessStatus || "not_activated";
                      const accessMeta = ACCESS_STATUS_META[accessKey] || { label: accessKey, cls: "c2c-access--muted" };
                      const name = textValue(row.name) || "N/A";
                      const saving = savingId === row.enrollmentId;
                      return (
                        <tr key={textValue(row.enrollmentId) || index}>
                          <td>
                            <div className="c2c-user-cell">
                              <div className="c2c-avatar">{getInitials(name)}</div>
                              <div>
                                <div className="c2c-name-title">{name}</div>
                                <div className="c2c-email-sub">
                                  {textValue(row.rollNumber) ? `ID: ${row.rollNumber}` : "ID: N/A"}
                                  {textValue(row.email) ? ` · ${row.email}` : textValue(row.mobile) ? ` · ${row.mobile}` : ""}
                                </div>
                                {textValue(row.utr) && <div className="c2c-utr">UTR: {row.utr}</div>}
                              </div>
                            </div>
                          </td>
                          <td><span className="c2c-branch">{textValue(row.branch) || "N/A"}</span></td>
                          <td><span className="c2c-batch-name">{textValue(row.batchName) || "N/A"}</span></td>
                          <td className="c2c-num"><span className="c2c-amount">{formatCurrency(row.totalFee)}</span></td>
                          <td className="c2c-num"><span className="c2c-amount">{formatCurrency(row.amountPaid)}</span></td>
                          <td className="c2c-num">
                            <span className={`c2c-balance ${toNumber(row.balance) > 0 ? "c2c-balance--due" : "c2c-balance--clear"}`}>
                              {formatCurrency(row.balance)}
                            </span>
                          </td>
                          <td>
                            <div className="c2c-status-cell">
                              <span className={`c2c-status ${paymentMeta.cls}`}>{paymentMeta.label}</span>
                              <CustomSelect
                                value={paymentKey}
                                onChange={(val) => handlePaymentStatusChange(row, val)}
                                options={PAYMENT_STATUSES}
                                disabled={saving}
                                className="c2c-inline-select"
                              />
                            </div>
                          </td>
                          <td>
                            <div className="c2c-status-cell">
                              <span className={`c2c-access ${accessMeta.cls}`}>{accessMeta.label}</span>
                              <CustomSelect
                                value={accessKey}
                                onChange={(val) => handleAccessStatusChange(row, val)}
                                options={ACCESS_STATUSES}
                                disabled={saving}
                                className="c2c-inline-select"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="c2c-empty">
                          <Users size={26} />
                          <p>No C2C enrollments yet</p>
                          <span>Enrollments are created automatically when an approved student is a C2C registrant.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

                        {/* ------------------------------- Payment QR + Registration */}
        <TabsContent value="registrations" className="c2c-tabs-content">
          <div className="c2c-intro">
            <p>
              Issue the C2C payment QR, record the payment (amount, UTR, date) before the student registers,
              then release the TrainX registration link. Approving the student creates the C2C Enrollment automatically.
            </p>
          </div>

          <div className="c2c-toolbar">
            <div className="c2c-search-wrap">
              <Search size={16} className="c2c-search-icon" />
              <input
                type="text"
                className="c2c-search-input"
                placeholder="Search by student, email, mobile, roll ID or UTR..."
                value={regSearch}
                onChange={(event) => setRegSearch(event.target.value)}
              />
            </div>
            <div className="c2c-filters">
              <CustomSelect
                value={regStatusFilter}
                onChange={(val) => setRegStatusFilter(val)}
                options={[
                  { value: "all", label: "All Stages" },
                  { value: "awaiting_payment", label: "Awaiting Payment" },
                  { value: "awaiting_registration", label: "Link Released" },
                  { value: "awaiting_approval", label: "Awaiting Approval" },
                  { value: "enrolled", label: "Enrolled" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
                className="c2c-custom-select"
              />
              <button type="button" className="c2c-btn-primary" onClick={() => setShowCreateLead(true)}>
                <Plus size={15} /> New Registration
              </button>
            </div>
          </div>

          <div className="c2c-table-card">
            <div className="c2c-table-responsive">
              <table className="c2c-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Branch / Batch</th>
                    <th>Total Fee</th>
                    <th>Amount Paid</th>
                    <th className="c2c-num">Balance</th>
                    <th>Payment Status</th>
                    <th>Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regLoading ? (
                    <tr><td colSpan={8}><div className="c2c-empty">Loading registrations...</div></td></tr>
                  ) : filteredRegistrations.length > 0 ? (
                    filteredRegistrations.map((row) => {
                      const paymentKey = normalizeStatus(row.paymentStatus) || "pending";
                      const paymentMeta = PAYMENT_STATUS_META[paymentKey] || { label: paymentKey, cls: "" };
                      const stageMeta = REGISTRATION_STATUS_META[row.status] || { label: row.status, cls: "" };
                      const qualifies = paymentKey === "completed" || paymentKey === "part_payment";
                      return (
                        <tr key={row.registrationId}>
                          <td>
                            <div className="c2c-user-cell">
                              <div className="c2c-avatar">{getInitials(row.name)}</div>
                              <div>
                                <div className="c2c-name-title">{textValue(row.name) || "N/A"}</div>
                                <div className="c2c-email-sub">
                                  {textValue(row.email) || textValue(row.mobile) || "N/A"}
                                </div>
                                {textValue(row.utr) && <div className="c2c-utr">UTR: {row.utr}</div>}
                                {textValue(row.paymentDate) && (
                                  <div className="c2c-utr">Paid: {formatDate(row.paymentDate)}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="c2c-branch">{textValue(row.branch) || "N/A"}</div>
                            <div className="c2c-batch">{textValue(row.batchName) || "—"}</div>
                          </td>
                          <td className="c2c-num"><span className="c2c-amount">{formatCurrency(row.feeAmount)}</span></td>
                          <td className="c2c-num"><span className="c2c-amount">{formatCurrency(row.amountPaid)}</span></td>
                          <td className="c2c-num">
                            <span className={`c2c-balance ${toNumber(row.balance) > 0 ? "c2c-balance--due" : "c2c-balance--clear"}`}>
                              {formatCurrency(row.balance)}
                            </span>
                          </td>
                          <td><span className={`c2c-status ${paymentMeta.cls}`}>{paymentMeta.label}</span></td>
                          <td><span className={`c2c-status ${stageMeta.cls}`}>{stageMeta.label}</span></td>
                          <td>
                            <div className="c2c-row-actions">
                              <button type="button" className="c2c-btn-mini" onClick={() => openQr(row)}>
                                <QrCode size={13} /> QR
                              </button>
                              <button type="button" className="c2c-btn-mini" onClick={() => setShowPayment(row)}>
                                <Wallet size={13} /> Payment
                              </button>
                              {row.registrationToken ? (
                                <button
                                  type="button"
                                  className="c2c-btn-mini c2c-btn-mini--ok"
                                  title="Copy the TrainX registration link"
                                  onClick={async () => {
                                    const released = await releaseLink(row, { email: false });
                                    const link = released?.registrationLink || buildLocalLink(row.registrationToken);
                                    copyText(link, `link-${row.registrationId}`);
                                  }}
                                >
                                  {copied === `link-${row.registrationId}` ? <Check size={13} /> : <Link2 size={13} />}
                                  {copied === `link-${row.registrationId}` ? "Copied" : "Link"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="c2c-btn-mini c2c-btn-mini--primary"
                                  disabled={!qualifies}
                                  title={qualifies ? "Release the TrainX registration link" : "Record a full or part payment first"}
                                  onClick={async () => {
                                    const released = await releaseLink(row, { email: true });
                                    const link = released?.registrationLink || buildLocalLink(row.registrationToken);
                                    if (link) copyText(link, `link-${row.registrationId}`);
                                  }}
                                >
                                  <KeyRound size={13} /> Release
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="c2c-empty">
                          <QrCode size={26} />
                          <p>No C2C registrations yet</p>
                          <span>Create a registration to generate the payment QR for a student.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showCreateLead && (
        <CreateLeadModal
          branches={branches}
          onClose={() => setShowCreateLead(false)}
          onCreated={(created) => {
            setShowCreateLead(false);
            setRegistrations((prev) => [created, ...prev]);
            showToast("C2C registration created. Share the payment QR with the student.");
            setQrFor(created);
            loadRegistrations();
          }}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSaved={() => { setShowSettings(false); handleRefresh(); }} />}

      {showPayment && (
        <PaymentModal
          registration={showPayment}
          onClose={() => setShowPayment(null)}
          onSaved={(updated) => {
            setShowPayment(null);
            setRegistrations((prev) =>
              prev.map((item) => (item.registrationId === updated.registrationId ? { ...item, ...updated } : item))
            );
            showToast("Payment information recorded");
            loadRegistrations();
          }}
        />
      )}

      {qrFor && (
        <QrModal
          data={qrFor}
          copiedKey={copied}
          onCopy={copyText}
          onClose={() => setQrFor(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

function ModalShell({ title, subtitle, icon: Icon, onClose, children, footer, wide }) {
  return (
    <div className="c2c-modal-overlay" onClick={onClose} role="presentation">
      <div className={`c2c-modal ${wide ? "c2c-modal--wide" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="c2c-modal-header">
          <div className="c2c-modal-title-wrap">
            {Icon && <div className="c2c-modal-icon"><Icon size={18} /></div>}
            <div>
              <h3 className="c2c-modal-title">{title}</h3>
              {subtitle && <p className="c2c-modal-sub">{subtitle}</p>}
            </div>
          </div>
          <button type="button" className="c2c-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="c2c-modal-body">{children}</div>
        {footer && <div className="c2c-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="c2c-field">
      <label className="c2c-field-label">{label}</label>
      {children}
      {hint && <span className="c2c-field-hint">{hint}</span>}
    </div>
  );
}

function CreateLeadModal({ branches, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    roll_number: "",
    branch: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Student name is required");
    if (!form.email.trim() && !form.mobile_number.trim()) {
      return setError("An email address or mobile number is required to identify the student");
    }
    setSaving(true);
    const response = await apiFetch("/c2c/registrations", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (response?.error) {
      setError(response.error);
      return;
    }
    onCreated(unwrap(response));
  };

  return (
    <ModalShell
      title="New C2C Registration"
      subtitle="Creates the intake record and a payment QR for the student."
      icon={Plus}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="c2c-btn-refresh" onClick={onClose}>Cancel</button>
          <button type="submit" form="c2c-lead-form" className="c2c-btn-primary" disabled={saving}>
            {saving ? "Creating..." : "Create & Show QR"}
          </button>
        </>
      }
    >
      <form id="c2c-lead-form" onSubmit={submit} className="c2c-form">
        {error && <div className="c2c-form-error"><AlertCircle size={14} /> {error}</div>}
        <Field label="Student name *">
          <input className="c2c-input" value={form.name} onChange={set("name")} placeholder="e.g. Aarav Sharma" />
        </Field>
        <div className="c2c-form-row">
          <Field label="College email *">
            <input className="c2c-input" type="email" value={form.email} onChange={set("email")} placeholder="student@college.edu" />
          </Field>
          <Field label="Mobile number">
            <input className="c2c-input" value={form.mobile_number} onChange={set("mobile_number")} placeholder="10-digit mobile" />
          </Field>
        </div>
        <div className="c2c-form-row">
          <Field label="Roll number">
            <input className="c2c-input" value={form.roll_number} onChange={set("roll_number")} placeholder="e.g. 22CS1043" />
          </Field>
          <Field label="Branch">
            <input
              className="c2c-input"
              list="c2c-branch-options"
              value={form.branch}
              onChange={set("branch")}
              placeholder="e.g. Computer Science"
            />
            <datalist id="c2c-branch-options">
              {branches.map((b) => <option key={b.id} value={b.name} />)}
            </datalist>
          </Field>
        </div>
        <p className="c2c-form-note">
          The student is identified by email or mobile. A TrainX placeholder account is created so the
          registration link can be completed later, and approving it will create the C2C Enrollment.
        </p>
      </form>
    </ModalShell>
  );
}

function PaymentModal({ registration, onClose, onSaved }) {
  const [form, setForm] = useState({
    amount_paid: registration.amountPaid ? String(registration.amountPaid) : "",
    utr: registration.utr || "",
    payment_date: registration.paymentDate ? String(registration.paymentDate).slice(0, 10) : "",
    payment_status: normalizeStatus(registration.paymentStatus) || "pending",
    payment_mode: registration.paymentMode || "UPI",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    const response = await apiFetch(`/c2c/registrations/${registration.registrationId}/payment`, {
      method: "PATCH",
      body: JSON.stringify({
        amount_paid: form.amount_paid === "" ? undefined : Number(form.amount_paid),
        utr: form.utr,
        payment_date: form.payment_date || null,
        payment_status: form.payment_status,
        payment_mode: form.payment_mode,
      }),
    });
    setSaving(false);
    if (response?.error) {
      setError(response.error);
      return;
    }
    onSaved(unwrap(response));
  };

  return (
    <ModalShell
      title="Record Payment"
      subtitle={`${registration.name} · recorded before TrainX registration`}
      icon={Wallet}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="c2c-btn-refresh" onClick={onClose}>Cancel</button>
          <button type="submit" form="c2c-payment-form" className="c2c-btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </>
      }
    >
      <form id="c2c-payment-form" onSubmit={submit} className="c2c-form">
        {error && <div className="c2c-form-error"><AlertCircle size={14} /> {error}</div>}
        <div className="c2c-form-row">
          <Field label={`Amount paid (of ${formatCurrency(registration.feeAmount)})`}>
            <input className="c2c-input" type="number" min="0" max={registration.feeAmount} value={form.amount_paid} onChange={set("amount_paid")} placeholder="0" />
          </Field>
          <Field label="Payment status">
            <CustomSelect value={form.payment_status} onChange={(val) => setForm((p) => ({ ...p, payment_status: val }))} options={PAYMENT_STATUSES} className="c2c-custom-select" />
          </Field>
        </div>
        <div className="c2c-form-row">
          <Field label="UTR / transaction reference" hint="Optional if not available">
            <input className="c2c-input" value={form.utr} onChange={set("utr")} placeholder="e.g. 426781234567" />
          </Field>
          <Field label="Payment date">
            <input className="c2c-input" type="date" value={form.payment_date} onChange={set("payment_date")} />
          </Field>
        </div>
        <Field label="Payment mode">
          <input className="c2c-input" value={form.payment_mode} onChange={set("payment_mode")} placeholder="UPI / Cash / Bank transfer" />
        </Field>
        <p className="c2c-form-note">
          Choosing <strong>Completed</strong> without an amount fills the amount up to the full fee.
          A <strong>Part Payment</strong> or <strong>Completed</strong> status unlocks the TrainX registration link.
        </p>
      </form>
    </ModalShell>
  );
}

function SettingsModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ totalFee: "", upiId: "", upiPayeeName: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    apiFetch("/c2c/config")
      .then((response) => {
        if (!mounted || response?.error) return;
        const data = unwrap(response) || {};
        setForm({
          totalFee: data.totalFee != null ? String(data.totalFee) : "",
          upiId: data.upiId || "",
          upiPayeeName: data.upiPayeeName || "",
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    const response = await apiFetch("/c2c/config", {
      method: "PUT",
      body: JSON.stringify({
        feeAmount: form.totalFee === "" ? undefined : Number(form.totalFee),
        upiId: form.upiId,
        upiPayeeName: form.upiPayeeName,
      }),
    });
    setSaving(false);
    if (response?.error) {
      setError(response.error);
      return;
    }
    onSaved();
  };

  return (
    <ModalShell
      title="C2C Program Settings"
      subtitle="Fee and UPI details encoded into every payment QR."
      icon={Settings2}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="c2c-btn-refresh" onClick={onClose}>Cancel</button>
          <button type="submit" form="c2c-settings-form" className="c2c-btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </>
      }
    >
      <form id="c2c-settings-form" onSubmit={submit} className="c2c-form">
        {error && <div className="c2c-form-error"><AlertCircle size={14} /> {error}</div>}
        <Field label="Program fee (₹)" hint="Pre-fills the amount on every payment QR">
          <input className="c2c-input" type="number" min="0" value={form.totalFee} onChange={set("totalFee")} placeholder="3500" />
        </Field>
        <Field label="UPI ID" hint="Without this no payment QR can be generated">
          <input className="c2c-input" value={form.upiId} onChange={set("upiId")} placeholder="college@bank" />
        </Field>
        <Field label="UPI payee name">
          <input className="c2c-input" value={form.upiPayeeName} onChange={set("upiPayeeName")} placeholder="Institute Name" />
        </Field>
      </form>
    </ModalShell>
  );
}

function QrModal({ data, copiedKey, onCopy, onClose }) {
  const key = `qr-${data.registrationId}`;
  const isCopied = copiedKey === key;
  return (
    <ModalShell
      title="C2C Payment QR"
      subtitle={`${data.name} · ${formatCurrency(data.totalFee ?? data.feeAmount)}`}
      icon={QrCode}
      onClose={onClose}
      footer={<button type="button" className="c2c-btn-refresh" onClick={onClose}>Close</button>}
    >
      <div className="c2c-qr-wrap">
        {data.qrCode ? (
          <img src={data.qrCode} alt="C2C payment QR" className="c2c-qr-image" />
        ) : (
          <div className="c2c-qr-placeholder">QR unavailable</div>
        )}
        <p className="c2c-qr-caption">
          Student scans with any UPI app to pay the {PROGRAM_CODE} program fee.
        </p>
        <div className="c2c-qr-meta">
          <div><span>UPI ID</span><strong>{textValue(data.upiId) || "Not configured"}</strong></div>
          <div><span>Payee</span><strong>{textValue(data.upiPayeeName) || "—"}</strong></div>
          <div><span>Amount</span><strong>{formatCurrency(data.totalFee ?? data.feeAmount)}</strong></div>
        </div>
        {data.payload && (
          <button type="button" className="c2c-btn-refresh" onClick={() => onCopy(data.payload, key)}>
            {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? "Copied" : "Copy UPI link"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
