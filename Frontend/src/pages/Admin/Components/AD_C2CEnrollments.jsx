import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  XCircle,
  Clock,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import CustomSelect from "../../../components/ui/CustomSelect";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_C2CEnrollments.css";

const statusMeta = {
  completed: { label: "Completed", cls: "c2c-status--paid" },
  paid: { label: "Completed", cls: "c2c-status--paid" },
  "part payment": { label: "Part Payment", cls: "c2c-status--partial" },
  partial: { label: "Part Payment", cls: "c2c-status--partial" },
  pending: { label: "Pending", cls: "c2c-status--unpaid" },
  unpaid: { label: "Pending", cls: "c2c-status--unpaid" },
  cancelled: { label: "Cancelled", cls: "c2c-status--cancelled" },
};

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") return "₹0";
  const number = Number(value);
  return Number.isFinite(number) ? `₹${number.toLocaleString("en-IN")}` : "₹0";
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

const hasProof = (row) => {
  const url = row.payment_proof_url || row.paymentProofUrl;
  return Boolean(url && /^https?:\/\//i.test(String(url).trim()));
};

export default function AdminC2CEnrollments() {
  const [rows, setRows] = useState([]);
  const [serverCounts, setServerCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(() => {
    return apiFetch("/c2c/enrollments").then((response) => {
      const payload = unwrap(response);
      const enrollmentsList = Array.isArray(payload?.enrollments)
        ? payload.enrollments
        : Array.isArray(payload)
        ? payload
        : [];
      return {
        rows: enrollmentsList,
        serverCounts: payload?.counts || null,
        error: response?.error || "",
      };
    });
  }, []);

  const applyData = useCallback((next) => {
    setRows(next.rows);
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

  const handleStatusChange = async (rowId, newStatus) => {
    setUpdatingId(rowId);
    try {
      const response = await apiFetch(`/c2c/enrollments/${rowId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status: newStatus }),
      });

      if (response.error) {
        alert(`Failed to update status: ${response.error}`);
      } else {
        // Optimistic / Real-time update in UI
        const updatedRow = response.data || response;
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  payment_status: updatedRow.payment_status || newStatus,
                  paymentStatus: updatedRow.payment_status || newStatus,
                  amount_paid: updatedRow.amount_paid !== undefined ? updatedRow.amount_paid : r.amount_paid,
                  amountPaid: updatedRow.amount_paid !== undefined ? updatedRow.amount_paid : r.amountPaid,
                  balance: updatedRow.balance !== undefined ? updatedRow.balance : r.balance,
                }
              : r
          )
        );
        handleRefresh();
      }
    } catch (err) {
      alert(`Error updating payment status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const branches = [...new Set(rows.map((row) => textValue(row.branch || row.department)).filter(Boolean))].sort();

  const filtered = rows.filter((row) => {
    const query = search.trim().toLowerCase();
    if (query) {
      const haystack = [
        row.name,
        row.full_name,
        row.rollNumber,
        row.roll_number,
        row.email,
        row.mobile,
        row.batchName,
        row.batch,
        row.utr_number,
        row.utrNumber,
      ]
        .map(textValue)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (branchFilter !== "all" && (row.branch || row.department) !== branchFilter) return false;

    const rawStatus = String(row.payment_status || row.paymentStatus || "").toLowerCase();
    if (statusFilter !== "all") {
      const normFilter = statusFilter.toLowerCase();
      if (normFilter === "pending" && rawStatus !== "pending" && rawStatus !== "unpaid") return false;
      if (normFilter === "part payment" && rawStatus !== "part payment" && rawStatus !== "partial") return false;
      if (normFilter === "completed" && rawStatus !== "completed" && rawStatus !== "paid") return false;
      if (normFilter === "cancelled" && rawStatus !== "cancelled") return false;
    }
    return true;
  });

  const counts = {
    total: serverCounts?.total ?? rows.length,
    completed: serverCounts?.completed ?? rows.filter((r) => ["completed", "paid"].includes(String(r.payment_status || r.paymentStatus).toLowerCase())).length,
    partPayment: serverCounts?.partPayment ?? rows.filter((r) => ["part payment", "partial"].includes(String(r.payment_status || r.paymentStatus).toLowerCase())).length,
    pending: serverCounts?.pending ?? rows.filter((r) => ["pending", "unpaid"].includes(String(r.payment_status || r.paymentStatus).toLowerCase())).length,
    cancelled: serverCounts?.cancelled ?? rows.filter((r) => String(r.payment_status || r.paymentStatus).toLowerCase() === "cancelled").length,
  };

  return (
    <div className="admin-page-inner c2c-container">
      <SectionHeader
        icon={Briefcase}
        title="C2C Program Enrollments"
        description="Live Google Form submissions, payment verification, and enrollment management."
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

      {/* 5 Summary Stat Cards */}
      <div className="c2c-stats-grid c2c-stats-grid-5">
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
            <span className="c2c-stat-lbl">Completed</span>
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
          <div className="c2c-stat-icon c2c-stat-icon--rose"><Clock size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.pending}</span>
            <span className="c2c-stat-lbl">Pending</span>
          </div>
        </div>

        <div className="c2c-stat-card">
          <div className="c2c-stat-icon" style={{ background: "#f1f5f9", color: "#64748b" }}><XCircle size={22} /></div>
          <div className="c2c-stat-info">
            <span className="c2c-stat-num">{counts.cancelled}</span>
            <span className="c2c-stat-lbl">Cancelled</span>
          </div>
        </div>
      </div>

      <div className="c2c-toolbar">
        <div className="c2c-search-wrap">
          <Search size={16} className="c2c-search-icon" />
          <input
            type="text"
            className="c2c-search-input"
            placeholder="Search by student name, email, roll number, mobile or UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="c2c-filters">
          <CustomSelect
            value={branchFilter}
            onChange={(val) => setBranchFilter(val)}
            options={[
              { value: "all", label: "All Branches" },
              ...branches.map((b) => ({ value: b, label: b })),
            ]}
            className="c2c-custom-select"
          />
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "Pending", label: "Pending" },
              { value: "Part Payment", label: "Part Payment" },
              { value: "Completed", label: "Completed" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
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
                <th>College / Branch</th>
                <th>Batch</th>
                <th>Total Fee</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Payment Status</th>
                <th>UTR Number</th>
                <th>Proof</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11}>
                    <div className="c2c-empty">Loading C2C enrollments...</div>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((row, index) => {
                  const currentStatus = row.payment_status || row.paymentStatus || "Pending";
                  const statusKey = String(currentStatus).toLowerCase();
                  const meta = statusMeta[statusKey] || { label: currentStatus, cls: "" };

                  const name = textValue(row.full_name || row.name) || "Student";
                  const rollNumber = textValue(row.roll_number || row.rollNumber) || "N/A";
                  const college = textValue(row.college) || "N/A";
                  const branch = textValue(row.branch || row.department) || "N/A";
                  const year = textValue(row.year) || "";
                  const div = textValue(row.division) || "";
                  const batchName = textValue(row.batch || row.batchName) || "C2C 2026";
                  const utr = textValue(row.utr_number || row.utrNumber) || "—";
                  const proofUrl = row.payment_proof_url || row.paymentProofUrl;
                  const dateStr = row.created_at || row.createdAt || row.payment_date || row.paymentDate;
                  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "—";

                  const totalFee = row.total_fee || row.totalFee || 3500;
                  const amountPaid = row.amount_paid !== undefined ? row.amount_paid : row.amountPaid || 0;
                  const balance = row.balance !== undefined ? row.balance : Math.max(0, totalFee - amountPaid);

                  return (
                    <tr key={row.id || index}>
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
                        <div className="c2c-batch" title={college}>
                          {college !== "N/A" ? college : ""}{year || div ? ` (${year} ${div})`.trim() : ""}
                        </div>
                      </td>
                      <td>
                        <span className="c2c-enrollment-type">{batchName}</span>
                      </td>
                      <td>
                        <div className="c2c-amount">{formatCurrency(totalFee)}</div>
                      </td>
                      <td>
                        <div className="c2c-amount" style={{ color: amountPaid > 0 ? "#059669" : "#64748b" }}>
                          {formatCurrency(amountPaid)}
                        </div>
                      </td>
                      <td>
                        <div className="c2c-amount" style={{ color: balance > 0 ? "#e11d48" : "#059669" }}>
                          {formatCurrency(balance)}
                        </div>
                      </td>
                      <td>
                        <select
                          className={`c2c-status-select ${meta.cls}`}
                          value={currentStatus}
                          disabled={updatingId === row.id}
                          onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Part Payment">Part Payment</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#334155" }}>{utr}</span>
                      </td>
                      <td>
                        {hasProof(row) ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="c2c-proof-link"
                          >
                            <ExternalLink size={13} /> View Proof
                          </a>
                        ) : (
                          <span className="c2c-proof-none">N/A</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{formattedDate}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="c2c-btn-refresh"
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          disabled={updatingId === row.id}
                          onClick={() => {
                            const newAmount = prompt(`Update amount paid for ${name} (Total Fee: ₹3,500):`, amountPaid);
                            if (newAmount !== null && !isNaN(parseFloat(newAmount))) {
                              handleStatusChange(row.id, currentStatus, parseFloat(newAmount));
                            }
                          }}
                        >
                          Edit Paid
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11}>
                    <div className="c2c-empty">
                      <Users size={26} />
                      <p>No C2C enrollment records found</p>
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
