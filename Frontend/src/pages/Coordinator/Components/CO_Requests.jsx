import { useState } from "react";
import { CheckCircle, XCircle, Inbox, Clock } from "lucide-react";
import { coordinatorRequests } from "../../../data/coordinatorMockData";
import "../Styles/CO_Requests.css";

export default function CoordinatorRequests() {
  const [requests, setRequests] = useState([]);

  const handleAction = (id, newStatus) => {
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
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
            Review student leave applications, batch transfer requests, and re-assessment permissions.
          </p>
        </div>
      </div>

      <div className="coord-requests-list">
        {requests.length === 0 ? (
          <div className="coord-requests-empty">
            <Inbox size={48} className="coord-requests-empty-icon" />
            <p className="coord-requests-empty-title">No Requests / Approvals</p>
            <p className="coord-requests-empty-sub">
              There are currently no pending student requests or approvals to review.
            </p>
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
          ))
        )}
      </div>
    </div>
  );
}
