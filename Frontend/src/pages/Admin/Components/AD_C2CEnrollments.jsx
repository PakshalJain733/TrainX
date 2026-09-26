import { useCallback, useEffect, useState } from "react";
import {
  GraduationCap,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_C2CEnrollments.css";

const PROGRAM_CODE = "C2C 2029";

const statusMeta = {
  paid: { label: "Paid", cls: "c2c-status--paid" },
  partial: { label: "Partial", cls: "c2c-status--partial" },
  unpaid: { label: "Unpaid", cls: "c2c-status--unpaid" },
};

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const firstValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
};

const getEnrollments = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["enrollments", "rows", "records", "items"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const getProgram = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { code: PROGRAM_CODE };
  const value = firstValue(payload, ["program", "programInfo", "trainingProgram", "course"]);
  if (typeof value === "string") return { code: value };
  if (value && typeof value === "object") return value;
  const code = firstValue(payload, ["programCode", "program_code", "code"]);
  return { code: code || PROGRAM_CODE };
};

const getCountSources = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  return [payload.counts, payload.countSummary, payload.summary, payload.paymentCounts, payload.stats, payload].filter(
    (source) => source && typeof source === "object" && !Array.isArray(source),
  );
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getServerCount = (payload, keys, fallback) => {
  for (const source of getCountSources(payload)) {
    const value = firstValue(source, keys);
    const number = asNumber(value);
    if (number !== null) return number;
  }
  return fallback;
};

const formatCurrency = (value) => {
  const number = asNumber(value);
  return number === null ? "N/A" : `₹${number.toLocaleString("en-IN")}`;
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const getInitials = (name) => {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const hasProof = (row) => Boolean(row.paymentProofUrl && /^https?:\/\//i.test(row.paymentProofUrl));

export default function AdminC2CEnrollments() {
  const [rows, setRows] = useState([]);
  const [program, setProgram] = useState({ code: PROGRAM_CODE });
  const [serverCounts, setServerCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(
    () =>
      apiFetch(`/admin/c2c/enrollments?program_code=${encodeURIComponent(PROGRAM_CODE)}`).then((response) => {
        const payload = unwrap(response);
        return {
          rows: getEnrollments(payload),
          program: getProgram(payload),
          serverCounts: response?.error ? null : payload,
          error: response?.error || "",
        };
      }),
    [],
  );

  const applyData = useCallback((next) => {
    setRows(next.rows);
    setProgram(next.program);
    setServerCounts(next.serverCounts);
    setError(next.error);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchData()
      .then((next) => {
        if (mounted) applyData(next);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetchData, applyData]);

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    fetchData()
      .then(applyData)
      .finally(() => setLoading(false));
  };

  const branches = [...new Set(rows.map((row) => textValue(row.branch || row.department)).filter(Boolean))].sort();
  const filtered = rows.filter((row) => {
    const query = search.trim().toLowerCase();
    if (query) {
      const haystack = [row.name, row.rollNumber, row.roll_number, row.email, row.mobile, row.batchName, row.batch_name]
        .map(textValue)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (branchFilter !== "all" && (row.branch || row.department) !== branchFilter) return false;
    const status = String(row.paymentStatus || row.payment_status || "").toLowerCase();
    if (statusFilter !== "all" && status !== statusFilter) return false;
    return true;
  });

  const counts = {
    total: getServerCount(serverCounts, ["total", "totalEnrollments", "enrolled", "enrollmentCount", "count"], rows.length),
    paid: getServerCount(serverCounts, ["paid", "paidCount", "fullyPaid"], rows.filter((row) => String(row.paymentStatus || row.payment_status || "").toLowerCase() === "paid").length),
    partial: getServerCount(serverCounts, ["partial", "partialCount"], rows.filter((row) => String(row.paymentStatus || row.payment_status || "").toLowerCase() === "partial").length),
    unpaid: getServerCount(serverCounts, ["unpaid", "unpaidCount"], rows.filter((row) => String(row.paymentStatus || row.payment_status || "").toLowerCase() === "unpaid").length),
  };

  const programName = textValue(firstValue(program, ["name", "title"])) || textValue(program.code) || PROGRAM_CODE;
  const programCode = textValue(firstValue(program, ["code", "programCode", "program_code"])) || PROGRAM_CODE;
  const programFee = firstValue(program, ["feeAmount", "programFee", "fee", "amount"]);
  const firstRowFee = rows.length > 0 ? firstValue(rows[0], ["feeAmount", "fee", "programFee"]) : null;
  const feeAmount = programFee ?? firstRowFee;
  const paidLabel = feeAmount === null ? "Paid" : `Paid (Full ${formatCurrency(feeAmount)})`;

  return (
    <div className="admin-page-inner c2c-container">
      <SectionHeader
        icon={GraduationCap}
        title={`${programName} Enrollments`}
        description={`Program ${programCode} · Enrollment, payment, and mentor allocation records returned from the database.`}
        action={
          <button type="button" className="c2c-btn-refresh" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      {error && (
        <div className="c2c-error-banner">
          <AlertCircle size={16} /> {error}
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
            <span className="c2c-stat-num">{counts.paid}</span>
            <span className="c2c-stat-lbl">{paidLabel}</span>
          </div>
        </div>
        <div className="c2c-stat-card">
          <div className="c2c-stat-icon c2c-stat-icon--amber"><TrendingUp size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.partial}</span>
            <span className="c2c-stat-lbl">Partial Payment</span>
          </div>
        </div>
        <div className="c2c-stat-card">
          <div className="c2c-stat-icon c2c-stat-icon--rose"><AlertCircle size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.unpaid}</span>
            <span className="c2c-stat-lbl">Unpaid</span>
          </div>
        </div>
      </div>

      <div className="c2c-toolbar">
        <div className="c2c-search-wrap">
          <Search size={16} className="c2c-search-icon" />
          <input
            type="text"
            className="c2c-search-input"
            placeholder="Search by student name, roll ID, email, mobile or batch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="c2c-filters">
          <select className="c2c-select" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
            <option value="all">All Branches</option>
            {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </select>
          <select className="c2c-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      <div className="c2c-table-card">
        <div className="c2c-table-responsive">
          <table className="c2c-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Branch / Batch</th>
                <th>Enrollment</th>
                <th>Payment Status</th>
                <th>Amount</th>
                <th>Paid To</th>
                <th>Mentor</th>
                <th>WhatsApp</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><div className="c2c-empty">Loading enrollments...</div></td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((row, index) => {
                  const paymentStatus = String(row.paymentStatus || row.payment_status || "").toLowerCase();
                  const status = statusMeta[paymentStatus] || { label: "N/A", cls: "" };
                  const name = textValue(row.name) || "N/A";
                  const rollNumber = textValue(row.rollNumber || row.roll_number) || "N/A";
                  const branch = textValue(row.branch || row.department) || "N/A";
                  const batchName = textValue(row.batchName || row.batch_name) || "N/A";
                  const enrollment = textValue(row.trainingOption || row.training_option || row.enrollmentType || row.enrollment_type) || "N/A";
                  const amountPaid = firstValue(row, ["amountPaid", "amount_paid", "paidAmount"]);
                  const fee = firstValue(row, ["feeAmount", "fee_amount", "programFee"]);
                  const mentorName = textValue(row.mentorName || row.mentor_name) || "N/A";
                  const whatsapp = textValue(row.whatsappGroupAdded || row.whatsapp_group_added);
                  const whatsappAdded = whatsapp?.toLowerCase().startsWith("yes");
                  return (
                    <tr key={textValue(row.enrollmentId || row.enrollment_id || row.id) || index}>
                      <td>
                        <div className="c2c-user-cell">
                          <div className="c2c-avatar">{getInitials(name)}</div>
                          <div>
                            <div className="c2c-name-title">{name}</div>
                            <div className="c2c-email-sub">
                              {rollNumber !== "N/A" ? `ID: ${rollNumber}` : "ID: N/A"}
                              {row.email || row.mobile ? " · " : ""}
                              {textValue(row.email) || (textValue(row.mobile) ? `Ph: ${textValue(row.mobile)}` : "N/A")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="c2c-branch">{branch}</div>
                        <div className="c2c-batch">{batchName}</div>
                      </td>
                      <td><span className="c2c-enrollment-type">{enrollment}</span></td>
                      <td>
                        <span className={`c2c-status ${status.cls}`}>{status.label}</span>
                        {row.sourceStatus && <div className="c2c-source-hint" title={row.sourceStatus}>Note</div>}
                      </td>
                      <td>
                        <div className="c2c-amount">{formatCurrency(amountPaid)}</div>
                        <div className="c2c-fee">of {formatCurrency(fee)}</div>
                      </td>
                      <td><span className="c2c-paidto">{textValue(row.paymentReceivedBy || row.payment_received_by) || "N/A"}</span></td>
                      <td>
                        <div className="c2c-mentor">{mentorName}</div>
                        {textValue(row.mentorPhone || row.mentor_phone) && <div className="c2c-mentor-phone">Ph: {textValue(row.mentorPhone || row.mentor_phone)}</div>}
                      </td>
                      <td>
                        <span className={`c2c-wa ${whatsappAdded ? "c2c-wa--yes" : "c2c-wa--no"}`}>
                          {whatsapp || "N/A"}
                        </span>
                      </td>
                      <td>
                        {hasProof(row) ? (
                          <a href={row.paymentProofUrl} target="_blank" rel="noreferrer noopener" className="c2c-proof-link">
                            <ExternalLink size={13} /> View
                          </a>
                        ) : (
                          <span className="c2c-proof-none">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9}>
                    <div className="c2c-empty">
                      <Users size={26} />
                      <p>No records yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
