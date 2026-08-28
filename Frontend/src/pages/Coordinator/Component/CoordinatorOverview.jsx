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
import "../Style/CoordinatorOverview.css";

const stats = [
  { label: "Total Students", value: "240 Students", hint: "ECS & IT Departments", icon: Users },
  { label: "Active Batches", value: "6 Batches", hint: "COMPS, IT, ECS", icon: TrendingUp },
  { label: "Avg Attendance", value: "88.5%", hint: "+1.2% this week", icon: CalendarCheck },
  { label: "Weekly Reviews", value: "32 Pending", hint: "208 graded this week", icon: FileCheck2 },
];

const leaveRequests = [
  { id: 1, name: "Neha Kulkarni", batch: "ECS - Sem 6", reason: "Smart India Hackathon", date: "Oct 12, 2026", initials: "NK" },
  { id: 2, name: "Kabir Menon", batch: "COMPS - Sem 6", reason: "Inter-collegiate Sports", date: "Oct 14, 2026", initials: "KM" },
  { id: 3, name: "Ananya Rao", batch: "IT - Sem 6", reason: "Medical Leave (Ailment)", date: "Oct 15, 2026", initials: "AR" },
];

const recentSubmissions = [
  { id: 1, student: "Ganesh Shinde", batch: "ECS - Sem 6", time: "10 mins ago", status: "Ungraded" },
  { id: 2, student: "Riya Shah", batch: "ECS - Sem 6", time: "1 hour ago", status: "Graded (9/10)" },
  { id: 3, student: "Aditya Mehta", batch: "IT - Sem 6", time: "2 hours ago", status: "Ungraded" },
  { id: 4, student: "Tanvi Saxena", batch: "COMPS - Sem 6", time: "1 day ago", status: "Graded (8/10)" },
];

export default function CoordinatorOverview() {
  const [user, setUser] = useState({ name: "Prof. A. Deshmukh" });

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u && u.name) setUser(u);
    } catch (e) {}
  }, []);

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
        {stats.map((s) => (
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
            {leaveRequests.map((req) => (
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
            ))}
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
            {recentSubmissions.map((sub) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
