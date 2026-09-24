import React, { useState, useEffect } from "react";
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

const statusMeta = {
  paid: { label: "Paid", cls: "c2c-status--paid" },
  partial: { label: "Partial", cls: "c2c-status--partial" },
  unpaid: { label: "Unpaid", cls: "c2c-status--unpaid" },
};

export default function AdminC2CEnrollments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/c2c/enrollments?program_code=C2C 2029");
      if (res && Array.isArray(res.data)) setRows(res.data);
    } catch (e) {
      console.error("Failed to fetch C2C enrollments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const branches = [...new Set(rows.map((r) => r.branch).filter(Boolean))].sort();

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = [r.name, r.rollNumber, r.email, r.mobile, r.batchName].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (branchFilter !== "all" && r.branch !== branchFilter) return false;
    if (statusFilter !== "all" && r.paymentStatus !== statusFilter) return false;
    return true;
  });

  const counts = {
    total: rows.length,
    paid: rows.filter((r) => r.paymentStatus === "paid").length,
    partial: rows.filter((r) => r.paymentStatus === "partial").length,
    unpaid: rows.filter((r) => r.paymentStatus === "unpaid").length,
  };

  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const hasProof = (r) => Boolean(r.paymentProofUrl && /^https?:\/\//i.test(r.paymentProofUrl));

  return (
    <div className="admin-page-inner c2c-container">
      <SectionHeader
        icon={GraduationCap}
        title="C2C 2029 Enrollments"
        description="Campus to Corporate Training Program — live enrollment, payment status, and mentor allocation for Placement Season 2029."
        action={
          <button className="c2c-btn-refresh" onClick={fetchData}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

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
            <span className="c2c-stat-lbl">Paid (Full ₹3,500)</span>
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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="c2c-filters">
          <select
            className="c2c-select"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            className="c2c-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
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
                <tr><td colSpan={8}><div className="c2c-empty">Loading enrollments...</div></td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((r) => {
                  const st = statusMeta[r.paymentStatus] || statusMeta.unpaid;
                  return (
                    <tr key={r.enrollmentId}>
                      <td>
                        <div className="c2c-user-cell">
                          <div className="c2c-avatar">{getInitials(r.name)}</div>
                          <div>
                            <div className="c2c-name-title">{r.name || "Unnamed Student"}</div>
                            <div className="c2c-email-sub">
                              {r.rollNumber ? `ID: ${r.rollNumber}` : ""}
                              {r.rollNumber && r.email ? " · " : ""}
                              {r.email || (r.mobile ? `Ph: ${r.mobile}` : "No email")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="c2c-branch">{r.branch || "—"}</div>
                        <div className="c2c-batch">{r.batchName || "No Batch"}</div>
                      </td>
                      <td>
                        <span className={`c2c-status ${st.cls}`}>
                          {st.label}
                        </span>
                        {r.sourceStatus && (
                          <div className="c2c-source-hint" title={r.sourceStatus}>Note</div>
                        )}
                      </td>
                      <td>
                        <div className="c2c-amount">₹{r.amountPaid ?? 0}</div>
                        <div className="c2c-fee">of ₹{r.feeAmount ?? 0}</div>
                      </td>
                      <td><span className="c2c-paidto">{r.paymentReceivedBy || "—"}</span></td>
                      <td>
                        <div className="c2c-mentor">{r.mentorName || "Not assigned"}</div>
                        {r.mentorPhone && <div className="c2c-mentor-phone">Ph: {r.mentorPhone}</div>}
                      </td>
                      <td>
                        <span className={`c2c-wa ${String(r.whatsappGroupAdded).toLowerCase().startsWith("yes") ? "c2c-wa--yes" : "c2c-wa--no"}`}>
                          {String(r.whatsappGroupAdded).toLowerCase().startsWith("yes") ? "Added" : String(r.whatsappGroupAdded || "No")}
                        </span>
                      </td>
                      <td>
                        {hasProof(r) ? (
                          <a
                            href={r.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="c2c-proof-link"
                          >
                            <ExternalLink size={13} /> View
                          </a>
                        ) : (
                          <span className="c2c-proof-none">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="c2c-empty">
                      <Users size={26} />
                      <p>No enrollments match the current filters.</p>
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