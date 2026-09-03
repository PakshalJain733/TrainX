import { useState } from "react";
import { CheckCircle, XCircle, Inbox, Clock } from "lucide-react";
import { coordinatorRequests } from "../../../data/coordinatorMockData";
import "../Styles/Requests.css";

export default function CoordinatorRequests() {
  const [requests, setRequests] = useState(coordinatorRequests);

  const handleAction = (id, newStatus) => {
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Requests & Approvals Center</h1>
          <p className="coord-page-sub">
            Review student leave applications, batch transfer requests, and re-assessment permissions.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {requests.map((r) => (
          <div key={r.id} className="coord-request-card">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>{r.studentName}</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Roll No: {r.rollNo}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: r.status === "Approved" ? "#ecfdf5" : r.status === "Rejected" ? "#fff1f2" : "#fffbeb",
                    color: r.status === "Approved" ? "#047857" : r.status === "Rejected" ? "#be123c" : "#b45309",
                  }}
                >
                  {r.status}
                </span>
              </div>

              <div style={{ fontSize: "13px", fontWeight: 700, color: "#4f46e5", marginTop: "4px" }}>
                {r.requestType}
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                Reason: {r.reason}
              </div>
            </div>

            {r.status === "Pending" ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="coord-btn"
                  style={{ background: "#ecfdf5", color: "#047857", fontSize: "12px" }}
                  onClick={() => handleAction(r.id, "Approved")}
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  className="coord-btn"
                  style={{ background: "#fff1f2", color: "#be123c", fontSize: "12px" }}
                  onClick={() => handleAction(r.id, "Rejected")}
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            ) : (
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                Actioned ({r.status})
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
