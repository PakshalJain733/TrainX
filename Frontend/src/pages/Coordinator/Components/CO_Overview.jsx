import { useState, useEffect } from "react";
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
  Sparkles,
  Info,
  ChevronRight,
  BookOpen,
  Megaphone,
  BellRing,
  FileText,
  Layers,
  Activity,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import {
  coordinatorStats,
  coordinatorStudents,
} from "../../../data/coordinatorMockData";
import "../Styles/CO_Overview.css";

export default function CoordinatorOverview() {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("general");
  const [targetAudience, setTargetAudience] = useState("all");
  const [broadcastSent, setBroadcastSent] = useState(false);

  const targetAudienceOptions = [
    { value: "all", label: "All CSE Batches & Enrolled Students" },
    { value: "cse26", label: "CSE 2026 Alpha Cohort" },
    { value: "fs", label: "Fullstack React & Node Specialization" },
    { value: "ds", label: "Data Science & AI/ML 2025" },
  ];

  const [coordUser, setCoordUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch (_) {
      return {};
    }
  });

  const [liveBatches, setLiveBatches] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [mentorCount, setMentorCount] = useState(0);

  useEffect(() => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          setCoordUser(res.data);
        }
      })
      .catch(() => { });

    apiFetch("/batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setLiveBatches(res.data);
        }
      })
      .catch(() => {});

    apiFetch("/coordinator/students")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setStudentCount(res.data.length);
        }
      })
      .catch(() => {});

    apiFetch("/coordinator/mentors")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setMentorCount(res.data.length);
        } else if (res && Array.isArray(res)) {
          setMentorCount(res.length);
        }
      })
      .catch(() => {
        apiFetch("/mentors")
          .then((res) => {
            if (res && res.data && Array.isArray(res.data)) {
              setMentorCount(res.data.length);
            }
          })
          .catch(() => {});
      });
  }, []);

  const fullName = coordUser.name || coordUser.fullName || coordUser.email?.split("@")[0] || "Department Coordinator";
  const dept = coordUser.department || coordUser.dept || coordUser.coordinatorProfile?.department || "CSE Department";
  const email = coordUser.email || "";
  const role = coordUser.role || "Coordinator";

  const getInitials = (name) => {
    if (!name) return "DC";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(fullName);

  const highRiskStudents = coordinatorStudents.filter((s) => s.riskStatus === "High Risk");

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setBroadcastSent(true);
    setBroadcastMsg("");
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const categories = [
    { id: "general", label: "General Notice", icon: Megaphone } 
  ];

  const statsList = [
    { label: "Enrolled Students", value: String(studentCount || 0), hint: `Active in ${dept}`, icon: GraduationCap },
    { label: "Managed Batches", value: `${liveBatches.length} Batches`, hint: "Current active batches", icon: Users },
    { label: "Assigned Mentors", value: `${mentorCount} Mentors`, hint: `Assigned in ${dept}`, icon: UserCheck },
    { label: "Attendance Rate", value: "Active", hint: "Department average", icon: LineChart },
  ];

  const liveSessions = [
    {
      id: 1,
      trainerName: "Anubhav Shukla",
      topic: "Java OOPS",
      batch: "CSE 2026 Cohort",
      time: "10:00 AM - 11:30 AM",
      status: "Live",
    },
    {
      id: 2,
      trainerName: "Priya Sharma",
      topic: "React Fundamentals",
      batch: "Fullstack Specialization",
      time: "11:00 AM - 12:30 PM",
      status: "Live",
    },
    {
      id: 3,
      trainerName: "Rahul Verma",
      topic: "Data Structures & Algorithms",
      batch: "CSE 2025 Alpha",
      time: "10:30 AM - 12:00 PM",
      status: "Live",
    }
  ];

  return (
    <div className="student-page-inner stack-6 overview-wrapper">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card-coordinator">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {userInitials}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> COORDINATOR WORKSPACE DASHBOARD
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {fullName}!
            </h1>
            <p className="overview-hero-desc">
              {dept || "Computer Engineering"} &nbsp;|&nbsp; {role || "Training Coordinator"} &nbsp;|&nbsp; {email || "coordinator@pvppcoe.ac.in"}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {statsList.map((s) => (
          <Card key={s.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <s.icon size={16} />
                </div>
                <span className="overview-stat-label">{s.label}</span>
                <Info size={15} className="overview-info-icon" />
              </div>

              <p className="overview-stat-value">{s.value}</p>

              <div className="overview-stat-hint-row">
                <span className="overview-stat-trend-pill">{s.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2-Column Main Arena */}
      <div className="overview-split-grid">
        {/* Left: Live Training Sessions */}
        <div className="co-arena-card">
          <div className="co-arena-card-header">
            <div className="co-arena-header-left">
              <div className="co-arena-icon-wrap co-arena-icon-wrap--emerald">
                <Activity size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="co-arena-header-title">Live Training Sessions</h3>
                <p className="co-arena-header-sub">Currently ongoing classes and active topics</p>
              </div>
            </div>
            <span className="co-arena-badge-active">
              <span className="co-live-dot"></span>
              {liveSessions.length} Active Sessions
            </span>
          </div>

          <div className="co-arena-card-body">
            {liveSessions.map((session) => (
              <div key={session.id} className="co-live-item-card">
                {/* Top Row: Status Badge & Time */}
                <div className="co-live-item-top">
                  <div className="co-live-pill">
                    <span className="co-live-dot"></span>
                    {session.status}
                  </div>

                  <div className="co-live-time-tag">
                    <Clock size={13} style={{ color: "#64748b" }} />
                    <span>{session.time}</span>
                  </div>
                </div>

                {/* Middle Row: Topic & Trainer */}
                <div>
                  <h4 className="co-live-topic-title">{session.topic}</h4>
                  <p className="co-live-trainer-text">
                    <strong>{session.trainerName}</strong> (Trainer) is conducting this live module.
                  </p>
                </div>

                {/* Bottom Row: Batch & Status */}
                <div className="co-live-item-bottom">
                  <div className="co-live-batch-pill">
                    <Users size={13} style={{ color: "#4f46e5" }} />
                    <span>{session.batch}</span>
                  </div>
                  <span className="co-live-status-tag">Class in Progress</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Flagged High Risk Students */}
        <div className="co-arena-card">
          <div className="co-arena-card-header">
            <div className="co-arena-header-left">
              <div className="co-arena-icon-wrap co-arena-icon-wrap--rose">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="co-arena-header-title">Defaulter & Risk Audit</h3>
                <p className="co-arena-header-sub">Students requiring active intervention</p>
              </div>
            </div>
            <Link to="/coordinator/students" className="co-arena-badge-link">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="co-arena-card-body">
            {highRiskStudents.length === 0 ? (
              <div className="co-risk-empty-box">
                <CheckCircle size={32} style={{ color: "#10b981" }} />
                <h4 className="co-risk-empty-title">No high risk students flagged.</h4>
                <p className="co-risk-empty-sub">All department students are within attendance compliance.</p>
              </div>
            ) : (
              highRiskStudents.map((s) => {
                const initials = s.name
                  ? s.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  : "ST";
                const attendanceVal = s.attendance ?? 72;
                const perfVal = s.testAvg ?? s.avgScore ?? s.score ?? 58;

                return (
                  <div key={s.id} className="co-risk-item-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div className="co-risk-avatar">{initials}</div>
                      <div style={{ minWidth: 0 }}>
                        <h5 className="co-risk-info-name">{s.name}</h5>
                        <p className="co-risk-info-sub">
                          {s.rollNo || s.studentId || "CSE26-001"} · {s.batch || "CSE 2026 Cohort"}
                        </p>
                        <div className="co-risk-metrics-row">
                          <span className="co-risk-metric-pill--danger">
                            Attendance: {attendanceVal}%
                          </span>
                          <span className="co-risk-metric-pill--warning">
                            Performance: {perfVal}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="co-risk-badge">High Risk</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

