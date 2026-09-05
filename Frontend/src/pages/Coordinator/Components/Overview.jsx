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
          <Link to="/coordinator/schedules" className="coord-btn coord-btn--outline">
            <Calendar size={16} />
            Schedule Class
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
          <Link to="/coordinator/students" className="coord-btn coord-btn--danger">
            Review Defaulters
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="coord-stats-grid">
        {coordinatorStats.map((stat) => {
          let themeModifier = "coord-stat-icon-bg--indigo";
          if (stat.id === "batches") themeModifier = "coord-stat-icon-bg--blue";
          if (stat.id === "mentors") themeModifier = "coord-stat-icon-bg--emerald";
          if (stat.id === "attendance") themeModifier = "coord-stat-icon-bg--amber";
          if (stat.id === "readiness") themeModifier = "coord-stat-icon-bg--purple";
          if (stat.id === "requests") themeModifier = "coord-stat-icon-bg--rose";

          return (
            <div key={stat.id} className="coord-stat-card">
              <div className="coord-stat-top">
                <span className="coord-stat-label">{stat.label}</span>
                <div className={`coord-stat-icon-bg ${themeModifier}`}>
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
        <div className="coord-col-stack">
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

            <div className="coord-batch-list">
              {coordinatorBatches.map((batch) => (
                <div key={batch.id} className="coord-batch-item">
                  <div className="coord-batch-header-row">
                    <div>
                      <div className="coord-batch-title">{batch.name}</div>
                      <div className="coord-batch-mentor-text">
                        Trainer: <strong className="coord-batch-mentor-name">{batch.mentor}</strong> · {batch.enrolledStudents} Students
                      </div>
                    </div>
                    <span
                      className={`coord-batch-status-pill ${
                        batch.status === "Active"
                          ? "coord-batch-status--active"
                          : "coord-batch-status--other"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div>
                    <div className="coord-batch-progress-header">
                      <span className="coord-batch-progress-label">Syllabus Completion</span>
                      <span className="coord-batch-progress-val">{batch.progress}%</span>
                    </div>
                    <div className="coord-batch-progress-track">
                      <div
                        className="coord-batch-progress-bar"
                        style={{ width: `${batch.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Classes Schedule */}
          <div className="coord-card">
            <div className="coord-card-header">
              <div className="coord-card-title">
                <Video size={18} color="#059669" />
                Today & Upcoming Live Training Sessions
              </div>
              <Link to="/coordinator/schedules" className="coord-card-link">
                Full Timetable →
              </Link>
            </div>

            <div className="coord-schedule-list">
              {coordinatorSchedules.map((session) => (
                <div key={session.id} className="coord-schedule-item">
                  <div>
                    <div className="coord-schedule-title">{session.title}</div>
                    <div className="coord-schedule-meta">
                      {session.batch} · {session.time}
                    </div>
                  </div>
                  <a
                    href={session.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className={`coord-schedule-link-btn ${
                      session.status === "Live Now"
                        ? "coord-schedule-link--live"
                        : "coord-schedule-link--upcoming"
                    }`}
                  >
                    {session.status === "Live Now" ? "Join Live" : "View Link"}
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Approvals & Broadcast */}
        <div className="coord-col-stack">
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

            <div className="coord-requests-list">
              {coordinatorRequests.map((req) => (
                <div key={req.id} className="coord-request-card">
                  <div className="coord-request-top">
                    <span>{req.studentName}</span>
                    <span
                      className={
                        req.status === "Pending"
                          ? "coord-request-status--pending"
                          : "coord-request-status--approved"
                      }
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="coord-request-type">{req.requestType}</div>
                  <div className="coord-request-reason">{req.reason}</div>
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
            <form onSubmit={handleBroadcast} className="coord-broadcast-form">
              <select className="coord-broadcast-select">
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
                className="coord-broadcast-textarea"
              />
              <button
                type="submit"
                className="coord-btn coord-btn--primary coord-btn--full"
              >
                <Send size={14} />
                Send Announcement
              </button>
              {broadcastSent && (
                <div className="coord-broadcast-success-msg">
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
