import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Inbox, Clock, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/Requests.css";

export default function CoordinatorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadRequests = () => {
    setLoading(true);
    apiFetch("/coordinator/requests")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.requests)) {
          setRequests(res.data.requests.map((r) => ({
            ...r,
            studentName: r.student_name || "Unknown Student",
            rollNo: r.roll_number || `R-${r.user_id || r.id}`,
            requestType: r.category || r.title || "Request",
            reason:
              r.reason ||
              `Start: ${r.start_date || "N/A"} · End: ${r.end_date || "N/A"} · Days: ${r.days || 1}`,
          })));
        }
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = (id, newStatus) => {
    setActionLoading(id);
    apiFetch(`/coordinator/requests/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => {
        if (res && res.success) {
          setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
        } else {
          alert(res?.message || "Failed to update request");
        }
      })
      .catch((err) => alert(err.message || "Failed to update request"))
      .finally(() => setActionLoading(null));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#64748b", gap: 12 }}>
        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#4f46e5" }} />
        <p style={{ fontSize: 13 }}>Loading requests...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Requests & Approvals Center</h1>
          <p className="coord-page-sub">
            Review student leave applications and update their status. Approve or reject from here.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="coord-table-card" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
          <Inbox size={28} style={{ margin: "0 auto 8px", color: "#cbd5e1" }} />
          No student requests pending.
        </div>
      ) : (
        <div className="coord-requests-list">
          {requests.map((r) => (
            <div key={r.id} className="coord-request-card">
              <div>
                <div className="coord-req-header">
                  <span className="coord-req-name">{r.studentName}</span>
                  <span className="coord-req-roll">Roll No: {r.rollNo}</span>
                  <span
                    className={
                      r.status === "Approved"
                        ? "coord-req-status-approved"
                        : r.status === "Rejected"
                        ? "coord-req-status-rejected"
                        : "coord-req-status-pending"
                    }
                  >
                    {r.status}
                  </span>
                </div>

                <div className="coord-req-type">
                  {r.requestType}
                </div>
                <div className="coord-req-reason">
                  Reason: {r.reason}
                </div>
              </div>

              {r.status === "Pending" ? (
                <div className="coord-req-actions">
                  <button
                    className="coord-btn coord-btn--approve"
                    onClick={() => handleAction(r.id, "Approved")}
                    disabled={actionLoading === r.id}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    className="coord-btn coord-btn--reject"
                    onClick={() => handleAction(r.id, "Rejected")}
                    disabled={actionLoading === r.id}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              ) : (
                <div className="coord-req-actioned">
                  <Clock size={13} /> Actioned ({r.status})
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}