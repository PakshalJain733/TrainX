import { useState, useEffect } from "react";
import {
  AlertTriangle, Download, CheckCircle, RefreshCw,
  FileText, CalendarDays, Clock3, Loader2, Inbox, CheckCircle2, XCircle
} from "lucide-react";
import { coordinatorStudents, coordinatorBatches } from "../../../data/coordinatorMockData";
import { apiFetch } from "../../../utils/api";
import "../Styles/Attendance.css";

const defaultLeaveApplications = [
  { id: "LV-2026-201", studentName: "Rahul Verma", rollNo: "CS202601", batch: "BE-CS-2026-A", leaveType: "Medical Leave", startDate: "2026-09-10", endDate: "2026-09-11", days: 2, reason: "Viral fever, medical certificate attached.", status: "Pending", submittedAt: "2 hours ago" },
  { id: "LV-2026-202", studentName: "Ananya Patel", rollNo: "CS202604", batch: "BE-CS-2026-A", leaveType: "On-Duty Leave", startDate: "2026-09-14", endDate: "2026-09-14", days: 1, reason: "Smart India Hackathon internal hackathon duty.", status: "Pending", submittedAt: "5 hours ago" },
  { id: "LV-2026-203", studentName: "Siddharth Rao", rollNo: "IT202612", batch: "TE-IT-2026-B", leaveType: "Casual Leave", startDate: "2026-09-16", endDate: "2026-09-17", days: 2, reason: "Family emergency, need to travel out of station.", status: "Pending", submittedAt: "1 day ago" }
];

export default function CoordinatorAttendance() {
  const [students, setStudents] = useState(coordinatorStudents);

  // Student Leave Applications state
  const [leaveApplications, setLeaveApplications] = useState(defaultLeaveApplications);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveFeedback, setLeaveFeedback] = useState("");
  const [leaveFeedbackType, setLeaveFeedbackType] = useState("success");

  const defaulters = students.filter((s) => s.attendance < 75);

  const showLeaveFeedback = (msg, type = "success") => {
    setLeaveFeedback(msg);
    setLeaveFeedbackType(type);
    setTimeout(() => setLeaveFeedback(""), 4000);
  };

  // Load real leave applications from backend when available
  useEffect(() => {
    apiFetch("/coordinator/attendance/leaves")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setLeaveApplications(res.data);
        }
      })
      .finally(() => setLeaveLoading(false));
  }, []);

  const pendingLeaves = leaveApplications.filter((leave) => leave.status === "Pending");
  const pendingLeaveCount = pendingLeaves.length;

  const handleLeaveDecision = async (leaveId, newStatus) => {
    const student = leaveApplications.find((l) => l.id === leaveId);
    const action = newStatus === "Approved" ? "Approved" : "Rejected";
    const endpoint = `/coordinator/attendance/leaves/${leaveId}${newStatus === "Approved" ? "/approve" : "/reject"}`;

    const res = await apiFetch(endpoint, { method: "PATCH" });

    setLeaveApplications((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: newStatus } : l))
    );

    if (res && res.error) {
      showLeaveFeedback(
        `${action} ${student?.studentName || "student"}'s application (rendered locally — ${res.error})`,
        "error"
      );
    } else {
      showLeaveFeedback(`${action} ${student?.studentName || "student"}'s leave application.`);
    }
  };

  const handleOverride = (id) => {
    setStudents(
      students.map((s) => (s.id === id ? { ...s, attendance: 76, riskStatus: "Good" } : s))
    );
  };

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Attendance Governance & Defaulters</h1>
          <p className="coord-page-sub">
            Monitor batch-wise attendance rates, flag defaulters (&lt;75%), and grant attendance medical overrides.
          </p>
        </div>
        <button
          className="coord-btn coord-btn--primary"
          onClick={() => alert("Downloading Department Attendance Audit PDF...")}
        >
          <Download size={16} /> Export Attendance Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="coord-stats-grid coord-card--mb">
        {coordinatorBatches.map((b) => (
          <div key={b.id} className="coord-stat-card">
            <div className="coord-stat-label">{b.name}</div>
            <div className="coord-stat-value" style={{ color: b.avgAttendance >= 90 ? "#059669" : "#d97706" }}>
              {b.avgAttendance}%
            </div>
            <div className="coord-stat-subtext">{b.defaultersCount} Flagged Defaulters</div>
          </div>
        ))}
      </div>

      {/* Flagged Defaulters List */}
      <div className="coord-card">
        <div className="coord-card-title coord-card-title--danger">
          <AlertTriangle size={18} color="#e11d48" />
          Flagged Attendance Defaulters (&lt;75%)
        </div>

        {defaulters.length === 0 ? (
          <div className="coord-empty-state--success">
            🎉 No attendance defaulters in CSE department!
          </div>
        ) : (
          <div className="coord-defaulters-list">
            {defaulters.map((d) => (
              <div key={d.id} className="coord-defaulter-card">
                <div>
                  <div className="coord-defaulter-name">{d.name}</div>
                  <div className="coord-defaulter-meta">
                    Roll No: <strong>{d.rollNo}</strong> · {d.batch}
                  </div>
                </div>

                <div className="coord-defaulter-right">
                  <div className="coord-defaulter-pct">{d.attendance}%</div>
                  <button
                    className="coord-btn coord-btn--override"
                    onClick={() => handleOverride(d.id)}
                  >
                    Grant Medical Override (+4%)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Leave Applications Review Block */}
      <div className="coord-card coord-leave-section">
        <div className="coord-card-header coord-leave-header">
          <div className="coord-card-title">
            <FileText size={18} color="#4f46e5" />
            Student Leave Applications
          </div>
          <span className="coord-leave-pending-badge">{pendingLeaveCount} Pending</span>
        </div>
        <p className="coord-page-sub">
          Review pending student leave applications and approve or reject them.
        </p>

        {leaveFeedback && (
          <div className={`coord-leave-feedback coord-leave-feedback--${leaveFeedbackType}`}>
            {leaveFeedbackType === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{leaveFeedback}</span>
          </div>
        )}

        {leaveLoading ? (
          <div className="coord-leave-state">
            <Loader2 size={18} className="coord-leave-spin" />
            Loading leave applications...
          </div>
        ) : pendingLeaves.length === 0 ? (
          <div className="coord-leave-state coord-leave-state--empty">
            <Inbox size={22} />
            No pending leave applications.
          </div>
        ) : (
          <div className="coord-leave-list">
            {pendingLeaves.map((leave) => {
              const initials = (leave.studentName || "Student")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div key={leave.id} className="coord-leave-card">
                  <div className="coord-leave-avatar">{initials}</div>

                  <div className="coord-leave-main">
                    <div className="coord-leave-head">
                      <div>
                        <div className="coord-leave-name">{leave.studentName}</div>
                        <div className="coord-leave-meta">
                          Roll No: <strong>{leave.rollNo}</strong> · <span className="coord-leave-batch">{leave.batch}</span>
                        </div>
                      </div>
                      <span className="coord-leave-status-badge">PENDING</span>
                    </div>

                    <div className="coord-leave-detail-row">
                      <span className="coord-leave-type">{leave.leaveType}</span>
                      <span className="coord-leave-dates">
                        <CalendarDays size={13} /> {leave.startDate} → {leave.endDate}
                      </span>
                      <span className="coord-leave-days">
                        <Clock3 size={13} /> {leave.days} Day{leave.days > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="coord-leave-reason">Reason: {leave.reason}</div>
                  </div>

                  <div className="coord-leave-actions">
                    <button
                      className="coord-btn coord-leave-approve-btn"
                      onClick={() => handleLeaveDecision(leave.id, "Approved")}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      className="coord-btn coord-leave-reject-btn"
                      onClick={() => handleLeaveDecision(leave.id, "Rejected")}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
