import React, { useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  CheckCircle,
  XCircle,
  FileCheck2,
  Users
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent } from "../../../components/ui/Card";
import "../Style/CoordinatorAttendance.css";

const initialLeaveRequests = [
  {
    id: 1,
    student: "Neha Kulkarni",
    rollNo: "ECS-042",
    batch: "ECS - Sem 6",
    dates: "Oct 12, 2026 - Oct 14, 2026",
    days: 3,
    type: "Academic Duty Leave",
    reason: "Representing college at Smart India Hackathon grand finale in Pune.",
    status: "Pending"
  },
  {
    id: 2,
    student: "Kabir Menon",
    rollNo: "COMPS-015",
    batch: "COMPS - Sem 6",
    dates: "Oct 14, 2026",
    days: 1,
    type: "Sports Leave",
    reason: "Inter-collegiate Football Tournament semifinal match.",
    status: "Pending"
  },
  {
    id: 3,
    student: "Ananya Rao",
    rollNo: "IT-028",
    batch: "IT - Sem 6",
    dates: "Oct 15, 2026 - Oct 17, 2026",
    days: 3,
    type: "Medical Leave",
    reason: "Viral fever; prescribed bed rest by family physician.",
    status: "Pending"
  }
];

const batchAttendanceList = [
  { batch: "Python Backend (PY-BE)", code: "PY-BE-2026", enrolled: 64, attendance: 91.2 },
  { batch: "DSA Algorithms (DSA-ADV)", code: "DSA-ADV-02", enrolled: 58, attendance: 88.5 },
  { batch: "React Frontend (FE-REACT)", code: "FE-REACT-05", enrolled: 62, attendance: 85.8 },
  { batch: "Cloud Ops (CLOUD-AWS)", code: "CLOUD-AWS-01", enrolled: 56, attendance: 89.1 }
];

export default function CoordinatorAttendance() {
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [activeTab, setActiveTab] = useState("leaves"); // "leaves" | "overview"

  const handleAction = (id, newStatus) => {
    setLeaveRequests(
      leaveRequests.map((req) =>
        req.id === id ? { ...req, status: newStatus } : req
      )
    );
  };

  return (
    <div className="student-page-inner stack-6 attendance-wrapper">
      {/* Page Title */}
      <div>
        <h1 className="attendance-page-title">Attendance & Duty Leave Center</h1>
        <p className="attendance-page-subtitle">Verify students attendance and approve official leaves</p>
      </div>

      {/* Tabs Menu */}
      <div className="attendance-tabs">
        <button
          className={`tab-btn ${activeTab === "leaves" ? "active" : ""}`}
          onClick={() => setActiveTab("leaves")}
        >
          Duty Leaves Applications ({leaveRequests.filter(r => r.status === "Pending").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Batch Attendance Overview
        </button>
      </div>

      {activeTab === "leaves" ? (
        <div className="stack-5">
          {leaveRequests.length === 0 ? (
            <div className="empty-panel stack-2 shadow-sm">
              <CalendarCheck size={36} className="empty-icon" />
              <h3>All applications cleared!</h3>
              <p>There are no pending duty leaves or medical applications.</p>
            </div>
          ) : (
            <div className="leaves-list stack-4">
              {leaveRequests.map((req) => (
                <div key={req.id} className="leave-card shadow-sm stack-3">
                  <div className="leave-card-top">
                    <div className="leave-card-left">
                      <div className="student-avatar-small">
                        {req.student.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="leave-student-name">{req.student}</h3>
                        <p className="leave-student-sub">
                          Roll No: {req.rollNo} · {req.batch}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`status-badge status-badge--${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div className="leave-details-grid">
                    <div className="leave-detail-item">
                      <span className="detail-label">Application Type</span>
                      <span className="detail-value">{req.type}</span>
                    </div>
                    <div className="leave-detail-item">
                      <span className="detail-label">Requested Dates</span>
                      <span className="detail-value">{req.dates} ({req.days} days)</span>
                    </div>
                  </div>

                  <div className="leave-reason-box">
                    <span className="detail-label">Reason for Absence</span>
                    <p className="reason-text">{req.reason}</p>
                  </div>

                  {req.status === "Pending" && (
                    <div className="leave-actions-row">
                      <button
                        className="btn-approve-large"
                        onClick={() => handleAction(req.id, "Approved")}
                      >
                        <CheckCircle size={15} /> Approve Application
                      </button>
                      <button
                        className="btn-reject-large"
                        onClick={() => handleAction(req.id, "Rejected")}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="stack-5">
          {/* Batches Attendance Table Card */}
          <div className="table-card shadow-sm">
            <div className="table-header">
              <h3 className="table-title">Batch Attendance Logs</h3>
              <p className="table-desc">Calculated based on lecture check-ins and approved leaves</p>
            </div>
            <div className="table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Batch Details</th>
                    <th>Batch Code</th>
                    <th>Enrolled</th>
                    <th>Avg Attendance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batchAttendanceList.map((b) => (
                    <tr key={b.code}>
                      <td>
                        <div className="table-batch-name">
                          <Users size={16} />
                          <span>{b.batch}</span>
                        </div>
                      </td>
                      <td><code>{b.code}</code></td>
                      <td>{b.enrolled} Students</td>
                      <td>
                        <div className="table-progress-wrap">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${b.attendance}%` }}></div>
                          </div>
                          <span className="progress-value">{b.attendance}%</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={b.attendance >= 90 ? "success" : ""}>
                          {b.attendance >= 90 ? "Excellent" : "On Track"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
