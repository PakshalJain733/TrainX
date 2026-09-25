import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Inbox, Clock } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/CO_Requests.css";

export default function CoordinatorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = () => {
    setLoading(true);
    apiFetch("/attendance/leave-requests")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setRequests(
            res.data.map((r) => ({
              id: r.id,
              studentName: r.student_name || "Student",
              rollNo: r.roll_number || "CS-101",
              requestType: r.category || r.title || "Leave Request",
              reason: r.reason || "Personal Leave",
              status: r.status || "Pending",
            }))
          );
        } else {
          setRequests([]);
        }
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id, newStatus) => {
    // Optimistic UI update
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      await apiFetch(`/attendance/leave-requests/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn("Failed to update leave request status in DB:", e);
    }
  };

  return (
    <div className="coord-requests-container">
      <div className="coord-requests-page-header">
        <div>
          <h2 className="coord-requests-page-title">
            <Inbox size={20} color="#0284c7" />
            <span>Requests & Approvals Center</span>
          </h2>
          <p className="coord-requests-page-subtitle">
            Review student leave applications, batch transfer requests, and re-assessment permissions stored in database.
          </p>
        </div>
      </div>

      <div className="coord-requests-list">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
            No leave requests or approvals pending in database.
          </div>
        ) : (
          requests.map((r) => (
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

                <div className="coord-req-type">{r.requestType}</div>
                <div className="coord-req-reason">Reason: {r.reason}</div>
              </div>

              {r.status === "Pending" ? (
                <div className="coord-req-actions">
                  <button
                    className="coord-btn coord-btn--approve"
                    onClick={() => handleAction(r.id, "Approved")}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    className="coord-btn coord-btn--reject"
                    onClick={() => handleAction(r.id, "Rejected")}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              ) : (
                <div className="coord-req-actioned">Actioned ({r.status})</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
