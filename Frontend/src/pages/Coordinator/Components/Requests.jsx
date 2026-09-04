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
              <div className="coord-req-actioned">
                Actioned ({r.status})
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
