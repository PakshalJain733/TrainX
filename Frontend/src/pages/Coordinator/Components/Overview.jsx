import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  LineChart,
  Award,
  AlertTriangle,
  PlusCircle,
  Calendar,
  ArrowUpRight,
  Video,
  CheckCircle,
  Clock,
  Send,
} from "lucide-react";
import {
  coordinatorStats,
  coordinatorBatches,
  coordinatorStudents,
  coordinatorSchedules,
  coordinatorRequests,
} from "../../../data/coordinatorMockData";
import "../Styles/Overview.css";

export default function CoordinatorOverview() {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);

  const highRiskStudents = coordinatorStudents.filter((s) => s.riskStatus === "High Risk");

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setBroadcastSent(true);
    setBroadcastMsg("");
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  return (
    <div className="coord-overview">
      {/* Welcome Banner */}
      <div className="coord-welcome-card">
        <div>
          <h1 className="coord-welcome-title">Welcome back, Alok Mishra 👋</h1>
          <p className="coord-welcome-sub">
            Department Coordinator · Computer Science & Engineering (Apex Institute of Technology).
            Here is your daily training governance summary and batch status overview.
          </p>
        </div>
        <div className="coord-welcome-actions">
          <Link to="/coordinator/batches" className="coord-btn coord-btn--primary">
            <PlusCircle size={16} />
            Create Batch
          </Link>
        </div>
      </div>

      {/* Risk Alert Banner if any */}
      {highRiskStudents.length > 0 && (
        <div className="coord-alert-banner">
          <div className="coord-alert-left">
            <AlertTriangle className="coord-alert-icon" size={24} />
            <div>
              <div className="coord-alert-title">
                Attention Required: {highRiskStudents.length} Students Flagged as High Risk
              </div>
              <div className="coord-alert-sub">
                Low attendance (&lt; 75%) or test performance dips detected in Data Science & CSE cohorts.
              </div>
            </div>
          </div>
          <Link to="/coordinator/students" className="coord-btn" style={{ background: "#e11d48", color: "#ffffff" }}>
            Review Defaulters
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="coord-stats-grid">
        {coordinatorStats.map((stat) => {
          let iconBg = "#eff6ff";
          let iconColor = "#2563eb";
          if (stat.color === "purple") {
            iconBg = "#faf5ff";
            iconColor = "#9333ea";
          } else if (stat.color === "emerald") {
            iconBg = "#ecfdf5";
            iconColor = "#059669";
          } else if (stat.color === "amber") {
            iconBg = "#fffbeb";
            iconColor = "#d97706";
          } else if (stat.color === "rose") {
            iconBg = "#fff1f2";
            iconColor = "#e11d48";
          }

          return (
            <div key={stat.id} className="coord-stat-card">
              <div className="coord-stat-top">
                <span className="coord-stat-label">{stat.label}</span>
                <div className="coord-stat-icon-bg" style={{ background: iconBg, color: iconColor }}>
                  {stat.id === "students" && <GraduationCap size={18} />}
                  {stat.id === "batches" && <Users size={18} />}
                  {stat.id === "mentors" && <UserCheck size={18} />}
                  {stat.id === "attendance" && <LineChart size={18} />}
                  {stat.id === "readiness" && <Award size={18} />}
                  {stat.id === "requests" && <AlertTriangle size={18} />}
                </div>
              </div>
              <div className="coord-stat-value">{stat.value}</div>
              <div className="coord-stat-subtext">{stat.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Split Grid */}
      <div className="coord-grid-split">
        {/* Left Column: Active Batches & Schedules */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Batches Overview */}
          <div className="coord-card">
            <div className="coord-card-header">
              <div className="coord-card-title">
                <Users size={18} color="#4f46e5" />
                Active Managed Batches ({coordinatorBatches.length})
              </div>
              <Link to="/coordinator/batches" className="coord-card-link">
                View All Batches →
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {coordinatorBatches.map((batch) => (
                <div
                  key={batch.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{batch.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Trainer: <strong style={{ color: "#334155" }}>{batch.mentor}</strong> · {batch.enrolledStudents} Students
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: batch.status === "Active" ? "#ecfdf5" : "#eff6ff",
                        color: batch.status === "Active" ? "#047857" : "#1d4ed8",
                      }}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#64748b" }}>Syllabus Completion</span>
                      <span style={{ fontWeight: 700, color: "#4f46e5" }}>{batch.progress}%</span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${batch.progress}%`,
                          background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Approvals & Broadcast */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Pending Approvals Widget */}
          <div className="coord-card">
            <div className="coord-card-header">
              <div className="coord-card-title">
                <Clock size={18} color="#d97706" />
                Pending Requests ({coordinatorRequests.length})
              </div>
              <Link to="/coordinator/requests" className="coord-card-link">
                Review All →
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {coordinatorRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#1e293b" }}>
                    <span>{req.studentName}</span>
                    <span style={{ color: req.status === "Pending" ? "#d97706" : "#059669" }}>{req.status}</span>
                  </div>
                  <div style={{ color: "#4f46e5", fontWeight: 600, marginTop: "2px" }}>{req.requestType}</div>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>{req.reason}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Announcement Broadcast */}
          <div className="coord-card">
            <div className="coord-card-title">
              <Send size={18} color="#4f46e5" />
              Broadcast Department Announcement
            </div>
            <form onSubmit={handleBroadcast} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <select
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                }}
              >
                <option value="all">All CSE Batches & Students</option>
                <option value="cse26">CSE 2026 Alpha Cohort</option>
                <option value="fs">Fullstack React & Node Specialization</option>
                <option value="ds">Data Science & ML 2025</option>
              </select>
              <textarea
                rows={3}
                placeholder="Type notice message (e.g., IA-2 Quiz rescheduled to Friday 10 AM)..."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  resize: "none",
                }}
              />
              <button
                type="submit"
                className="coord-btn coord-btn--primary"
                style={{ justifyContent: "center", width: "100%" }}
              >
                <Send size={14} />
                Send Announcement
              </button>
              {broadcastSent && (
                <div style={{ fontSize: "12px", color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle size={14} /> Announcement broadcasted to students!
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
