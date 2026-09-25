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
    { label: "Faculty & Mentors", value: "Live DB", hint: "Assigned department mentors", icon: UserCheck },
    { label: "Attendance Rate", value: "Active", hint: "Department average", icon: LineChart },
  ];

  const getTopicEmoji = (topic = "") => {
    const t = topic.toLowerCase();
    if (t.includes("java") || t.includes("oops") || t.includes("oop")) return "☕";
    if (t.includes("react") || t.includes("frontend") || t.includes("ui")) return "⚛️";
    if (t.includes("data struct") || t.includes("algorithm") || t.includes("dsa")) return "🧮";
    if (t.includes("python")) return "🐍";
    if (t.includes("node") || t.includes("backend") || t.includes("express")) return "🟢";
    if (t.includes("sql") || t.includes("database") || t.includes("db")) return "🗄️";
    if (t.includes("machine learn") || t.includes("ml") || t.includes("ai")) return "🤖";
    if (t.includes("cloud") || t.includes("aws") || t.includes("devops")) return "☁️";
    if (t.includes("cybersec") || t.includes("security")) return "🔒";
    if (t.includes("mobile") || t.includes("android") || t.includes("ios")) return "📱";
    if (t.includes("git") || t.includes("version")) return "🔀";
    if (t.includes("web") || t.includes("html") || t.includes("css")) return "🌐";
    return "📚";
  };

  const getTopicColor = (topic = "") => {
    const t = topic.toLowerCase();
    if (t.includes("java") || t.includes("oops")) return { bg: "#fff7ed", color: "#ea580c" };
    if (t.includes("react") || t.includes("frontend")) return { bg: "#eff6ff", color: "#2563eb" };
    if (t.includes("data struct") || t.includes("algorithm")) return { bg: "#f0fdf4", color: "#16a34a" };
    if (t.includes("python")) return { bg: "#fefce8", color: "#ca8a04" };
    if (t.includes("node") || t.includes("backend")) return { bg: "#dcfce7", color: "#15803d" };
    if (t.includes("sql") || t.includes("database")) return { bg: "#f0f9ff", color: "#0369a1" };
    if (t.includes("machine learn") || t.includes("ml")) return { bg: "#fdf4ff", color: "#9333ea" };
    return { bg: "#f1f5f9", color: "#475569" };
  };

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
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between border-b border-slate-100 pb-4 mb-4">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap bg-emerald-100 text-emerald-600">
                <Activity size={18} className="overview-header-icon animate-pulse" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Live Training Sessions</CardTitle>
                <CardDescription className="overview-card-desc">Currently ongoing classes and topics being taught</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
              {liveSessions.length} Active Sessions
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="live-sessions-grid">
              {liveSessions.map((session) => {
                const emoji = getTopicEmoji(session.topic);
                const { bg, color } = getTopicColor(session.topic);
                return (
                  <div key={session.id} className="live-session-card">
                    <div className="live-session-card-top">
                      <div
                        className="live-session-emoji-box"
                        style={{ background: bg, color }}
                      >
                        <span className="live-session-emoji">{emoji}</span>
                      </div>
                      <div className="live-session-meta-right">
                        <div className="live-session-status-row">
                          <span className="live-session-live-dot">
                            <span className="live-dot-ping"></span>
                            <span className="live-dot-core"></span>
                          </span>
                          <span className="live-session-status-label">{session.status}</span>
                        </div>
                        <div className="live-session-time-pill">
                          <Clock size={11} />
                          {session.time}
                        </div>
                      </div>
                    </div>

                    <div className="live-session-body">
                      <h4 className="live-session-topic">{session.topic}</h4>
                      <p className="live-session-desc">
                        <span className="live-session-trainer">{session.trainerName}</span>
                        {" "}(Trainer) is teaching{" "}
                        <span className="live-session-topic-highlight">{session.topic}</span>
                        {" "}to students.
                      </p>
                    </div>

                    <div className="live-session-footer">
                      <Users size={13} className="live-session-footer-icon" />
                      <span className="live-session-batch">{session.batch}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>

        </Card>

        {/* Right: Flagged High Risk Students */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <AlertTriangle size={18} className="overview-header-icon text-rose-500" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Defaulter & Risk Audit</CardTitle>
                <CardDescription className="overview-card-desc">Students requiring intervention</CardDescription>
              </div>
            </div>
            <Link to="/coordinator/students" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {highRiskStudents.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle size={28} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-semibold">No high risk students flagged.</p>
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
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/50 flex items-center justify-between gap-3 transition-all hover:bg-rose-50 hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-rose-200 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {s.name}
                        </h5>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {s.rollNo || s.studentId || "CSE26-001"} · {s.batch || "CSE 2026 Cohort"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center text-[11px] text-rose-700 font-bold bg-rose-100/80 px-2 py-0.5 rounded-md">
                            Attendance: {attendanceVal}%
                          </span>
                          <span className="inline-flex items-center text-[11px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md">
                            Performance: {perfVal}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider flex-shrink-0 shadow-xs">
                      High Risk
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
}

