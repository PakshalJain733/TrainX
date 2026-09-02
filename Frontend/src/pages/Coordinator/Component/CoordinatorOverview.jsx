import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  FileCheck2,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  Plus
} from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import "../Style/CoordinatorOverview.css";

export default function CoordinatorOverview() {
  const [user, setUser] = useState({ name: "Coordinator" });
  const [stats, setStats] = useState({
    students: 0,
    batches: 1,
    attendance: "95%",
    pendingReviews: 0,
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u && u.name) setUser(u);
    } catch (e) {}

    const loadData = async () => {
      try {
        const statsRes = await apiFetch("/admin/stats");
        if (statsRes && statsRes.data) {
          setStats((prev) => ({
            ...prev,
            students: statsRes.data.students || 0,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch coordinator stats:", err);
      }
    };

    loadData();
  }, []);

  const statCards = [
    { label: "Total Students", value: `${stats.students} Enrolled`, hint: "Department students", icon: Users },
    { label: "Active Batches", value: `${stats.batches} Batch`, hint: "Assigned streams", icon: TrendingUp },
    { label: "Avg Attendance", value: stats.attendance, hint: "Current semester", icon: CalendarCheck },
    { label: "Weekly Reviews", value: `${stats.pendingReviews} Pending`, hint: "Awaiting approval", icon: FileCheck2 },
  ];

  return (
    <div className="student-page-inner stack-6 overview-wrapper">
      {/* Welcome Banner */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "CO"}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> COORDINATOR PORTAL DASHBOARD
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {user.name}!
            </h1>
            <p className="overview-hero-desc">
              Manage student batches, approve leaves, review weekly logs, and publish curriculums.
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/coordinator/batches">
            <Button className="overview-btn-primary">
              <Plus size={14} className="overview-btn-icon" /> Manage Batches
            </Button>
          </Link>
          <Link to="/coordinator/weekly-reports">
            <Button className="overview-btn-secondary">
              <FileCheck2 size={14} className="overview-btn-icon" /> Review Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="overview-grid-4">
        {statCards.map((s) => (
          <Card key={s.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <s.icon size={18} className="overview-icon" />
                </div>
                <span className="overview-stat-label">{s.label}</span>
              </div>
              <div className="overview-stat-val">{s.value}</div>
              <div className="overview-stat-hint">{s.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid: Leave Requests & Recent Submissions */}
      <div className="overview-main-grid">
        {/* Left Column: Leave Approvals */}
        <div className="overview-panel-card shadow-sm stack-4">
          <div className="overview-panel-header">
            <div>
              <h2 className="overview-panel-title">Pending Leave Approvals</h2>
              <p className="overview-panel-desc">Approve academic duty leaves and medical certificates</p>
            </div>
            <Link to="/coordinator/attendance">
              <Button variant="ghost" size="sm" className="overview-panel-action">
                View All <ArrowUpRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="overview-list stack-3">
            {leaveRequests.length > 0 ? (
              leaveRequests.map((req) => (
                <div key={req.id} className="overview-list-row">
                  <div className="overview-list-row-left">
                    <div className="overview-list-avatar">{req.initials}</div>
                    <div>
                      <h3 className="overview-list-name">{req.name}</h3>
                      <p className="overview-list-sub">{req.batch} · {req.reason}</p>
                    </div>
                  </div>
                  <div className="overview-list-row-right">
                    <span className="overview-list-badge">{req.date}</span>
                    <div className="overview-list-actions">
                      <button className="btn-approve" onClick={() => alert("Approved " + req.name)}>Approve</button>
                      <button className="btn-reject" onClick={() => alert("Rejected " + req.name)}>Reject</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                <CalendarCheck size={28} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No pending leave requests</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 12.5 }}>All student leave applications are reviewed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Weekly Reports */}
        <div className="overview-panel-card shadow-sm stack-4">
          <div className="overview-panel-header">
            <div>
              <h2 className="overview-panel-title">Recent Weekly Reports</h2>
              <p className="overview-panel-desc">Submitted student training summaries</p>
            </div>
            <Link to="/coordinator/weekly-reports">
              <Button variant="ghost" size="sm" className="overview-panel-action">
                Review Logs <ArrowUpRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="overview-list stack-3">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((sub) => (
                <div key={sub.id} className="overview-list-row">
                  <div className="overview-list-row-left">
                    <div className="overview-list-icon">
                      <FileCheck2 size={16} />
                    </div>
                    <div>
                      <h3 className="overview-list-name">{sub.student}</h3>
                      <p className="overview-list-sub">{sub.batch} · Submitted {sub.time}</p>
                    </div>
                  </div>
                  <div className="overview-list-row-right">
                    <span className={`status-tag ${sub.status.includes("Graded") ? "status-tag--success" : "status-tag--warning"}`}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                <FileCheck2 size={28} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No weekly reports submitted yet</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 12.5 }}>Student weekly reports will appear here for grading.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

