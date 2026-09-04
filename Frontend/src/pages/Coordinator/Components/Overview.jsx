import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  LineChart,
  PlusCircle,
  AlertTriangle,
  Send,
  CheckCircle,
} from "lucide-react";
import {
  coordinatorStats,
  coordinatorStudents,
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
                </div>
              </div>
              <div className="coord-stat-value">{stat.value}</div>
              <div className="coord-stat-subtext">{stat.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Broadcast Department Announcement */}
      <div className="coord-card">
        <div className="coord-card-title">
          <Send size={18} color="#4f46e5" />
          Broadcast Department Announcement
        </div>
        <form onSubmit={handleBroadcast} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <select
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
            }}
          >
            <option value="all">All CSE Batches & Students</option>
            <option value="cse26">CSE 2026 Alpha Cohort</option>
            <option value="fs">Fullstack React & Node Specialization</option>
            <option value="ds">Data Science & ML 2025</option>
          </select>
          <textarea
            rows={4}
            placeholder="Type notice message (e.g., IA-2 Quiz rescheduled to Friday 10 AM)..."
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              resize: "vertical",
            }}
          />
          <button
            type="submit"
            className="coord-btn coord-btn--primary"
            style={{ justifyContent: "center", width: "fit-content", minWidth: "200px" }}
          >
            <Send size={14} />
            Send Announcement
          </button>
          {broadcastSent && (
            <div style={{ fontSize: "13px", color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={16} /> Announcement broadcasted to students!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
