import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Info,
  ChevronRight,
  Activity,
  Clock,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import CustomSelect from "../../../components/ui/CustomSelect";
import { apiFetch } from "../../../utils/api";
import "../Styles/CO_Overview.css";

const DEFAULT_TRAINING_SESSIONS = [
  {
    id: 1,
    trainerName: "Anubhav Shukla",
    topic: "Java Masterclass: Core to Advanced",
    topicDetail:
      "Deep dive into JVM architecture, Classes, Interfaces, Exception Handling, Collections Framework, and Multithreading.",
    batch: "CSE 2026 Cohort",
  },
  {
    id: 2,
    trainerName: "Priya Sharma",
    topic: "React Intensive Bootcamp",
    topicDetail:
      "Complete guide from JSX, Hooks & Context API to building scalable single-page applications and global state management.",
    batch: "Fullstack Specialization",
  },
  {
    id: 3,
    trainerName: "Rahul Verma",
    topic: "DSA Marathon: Trees & Graphs",
    topicDetail:
      "Intensive problem-solving session covering BSTs, Tries, Graph traversals, shortest paths, and DP on trees.",
    batch: "CSE 2025 Alpha",
  },
];

export default function CoordinatorOverview() {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("general");
  const [targetAudience, setTargetAudience] = useState("all");
  const [broadcastSent, setBroadcastSent] = useState(false);

  const targetAudienceOptions = [
    { value: "all", label: "All CSE Batches & Enrolled Students" },
    { value: "cse26", label: "CSE 2026 Alpha Batch" },
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
  const [students, setStudents] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [mentorCount, setMentorCount] = useState(0);
  const [liveSessions, setLiveSessions] = useState([]);
  const [highRiskStudents, setHighRiskStudents] = useState([]);
  const [attendanceRate, setAttendanceRate] = useState("0%");

  useEffect(() => {
    // 1. Fetch Logged-in User Profile from MySQL DB
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          setCoordUser(res.data);
        }
      })
      .catch(() => {});

    // 2. Fetch Active Batches & Admin-Updated Topics from MySQL DB
    apiFetch("/batches")
      .then((res) => {
        const batchList = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(batchList)) {
          setLiveBatches(batchList);

          // Map active DB batches with topics & trainers updated by Admin
          const activeBatches = batchList.filter((b) => String(b.status).toLowerCase() !== "inactive");
          if (activeBatches.length > 0) {
            const mappedSessions = activeBatches.map((b) => ({
              id: b.id,
              trainerName: b.trainer || b.mentorName || b.mentor_name || "Department Faculty",
              topic: b.topic || `${b.name} - Core Module`,
              topicDetail: b.description || "Active training session topic assigned and managed by Admin.",
              batch: b.name || "CSE Batch",
              time: b.schedule || "10:00 AM - 05:00 PM",
              status: b.status === "Active" || !b.status ? "Live" : b.status,
            }));
            setLiveSessions(mappedSessions);
          } else {
            setLiveSessions([]);
          }
        }
      })
      .catch(() => setLiveSessions([]));

    // 3. Fetch Enrolled Department Students from DB & compute defaulters / avg attendance
    apiFetch("/coordinator/students")
      .then((res) => {
        const studentList = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(studentList)) {
          setStudents(studentList);
          setStudentCount(studentList.length);

          // Calculate department average attendance from DB records
          if (studentList.length > 0) {
            const totalAtt = studentList.reduce((sum, s) => {
              const val = Number(s.attendance ?? s.attendance_rate ?? s.studentProfile?.attendance ?? 0);
              return sum + (isNaN(val) ? 0 : val);
            }, 0);
            setAttendanceRate(`${Math.round(totalAtt / studentList.length)}%`);
          } else {
            setAttendanceRate("0%");
          }

          // Filter high risk students from DB records (<75% attendance or high risk status)
          const flagged = studentList.filter((s) => {
            const att = Number(s.attendance ?? s.attendance_rate ?? s.studentProfile?.attendance ?? 100);
            const risk = String(s.riskStatus || s.risk_level || s.risk_status || "");
            return att < 75 || risk.toLowerCase().includes("high");
          });
          setHighRiskStudents(flagged);
        }
      })
      .catch(() => {
        setStudentCount(0);
        setAttendanceRate("0%");
      });

    // 4. Fetch Department Assigned Mentors from MySQL DB
    apiFetch("/coordinator/mentors")
      .then((res) => {
        const mentorList = res?.data || (Array.isArray(res) ? res : []);
        setMentorCount(mentorList.length);
      })
      .catch(() => {
        apiFetch("/mentors")
          .then((res) => {
            const list = res?.data || (Array.isArray(res) ? res : []);
            setMentorCount(list.length);
          })
          .catch(() => setMentorCount(0));
      });
  }, []);

  useEffect(() => {
    apiFetch("/live-sessions")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setLiveSessions(res.data);
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

  const statsList = [
    { label: "Enrolled Students", value: `${studentCount}`, hint: `Active in ${dept}`, icon: GraduationCap },
    { label: "Managed Batches", value: `${liveBatches.length} Batches`, hint: "Current active batches", icon: Users },
    { label: "Faculty & Mentors", value: `${mentorCount} Trainers`, hint: "Assigned department mentors", icon: UserCheck },
    { label: "Attendance Rate", value: attendanceRate || "0%", hint: "Department average", icon: LineChart },
  ];

  // Merge live database sessions with default training sessions so exactly 3 deduplicated cards are shown
  const displaySessions = (() => {
    const list = [];
    // 1. Add unique live sessions first
    for (const s of liveSessions) {
      if (!list.some((existing) => existing.topic === s.topic && existing.trainerName === s.trainerName)) {
        list.push(s);
      }

    }
    // 2. Fill remaining slots up to 3 with default sessions
    for (const defSession of DEFAULT_TRAINING_SESSIONS) {
      if (list.length >= 3) break;
      if (!list.some((s) => s.topic === defSession.topic || s.trainerName === defSession.trainerName)) {
        list.push(defSession);
      }
    }
    return list.slice(0, 3);
  })();

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
        {/* Left: Broadcast Announcement Form */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Send size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Broadcast Department Notice</CardTitle>
                <CardDescription className="overview-card-desc">Send instant announcements to students & batches</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="px-2.5 py-1 text-xs font-semibold">CSE Dept</Badge>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleBroadcast} className="broadcast-form-space">
              {/* Category Pills */}
              <div className="broadcast-field-group">
                <label className="broadcast-label">Notice Type</label>
                <div className="broadcast-type-pills">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = noticeCategory === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setNoticeCategory(cat.id)}
                        className={`broadcast-type-pill ${isActive ? "active" : ""}`}
                      >
                        <Icon size={14} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience Dropdown */}
              <div className="broadcast-field-group">
                <label className="broadcast-label">Target Audience</label>
                <CustomSelect
                  value={targetAudience}
                  options={targetAudienceOptions}
                  onChange={(val) => setTargetAudience(val)}
                  placeholder="Select target audience..."
                  icon={Users}
                />
              </div>

              {/* Notice Message Textarea */}
              <div className="broadcast-field-group">
                <div className="flex items-center justify-between">
                  <label className="broadcast-label">Notice Message</label>
                  <span className="broadcast-char-count">{broadcastMsg.length} / 500</span>
                </div>
                <div className="broadcast-textarea-wrap">
                  <textarea
                    rows={4}
                    maxLength={500}
                    placeholder="Type notice message (e.g., IA-2 Quiz rescheduled to Friday 10:00 AM in Lab 302)..."
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="broadcast-textarea-input"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="broadcast-footer-row">
                <button
                  type="submit"
                  disabled={!broadcastMsg.trim()}
                  className="broadcast-send-btn"
                >
                  <Send size={15} /> Send Announcement
                </button>
                {broadcastSent && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-pulse">
                    <CheckCircle size={16} /> Notice Broadcasted Successfully!
                  </span>
                )}
              </div>
            </form>
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
                          {s.rollNo || s.studentId || "CSE26-001"} · {s.batch || "CSE 2026 Batch"}
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

      {/* Live Training Sessions Row */}
      <Card className="overview-subcard mt-4">
        <CardHeader className="overview-card-header-between border-b border-slate-100 pb-4 mb-4">
          <div className="overview-header-left">
            <div className="overview-header-icon-wrap bg-emerald-100 text-emerald-600">
              <Activity size={18} className="overview-header-icon animate-pulse" />

            </div>
            <div>
              <h3 className="co-arena-header-title">Current Training Sessions</h3>
              <p className="co-arena-header-sub">Currently ongoing classes and topics being taught</p>
            </div>
          </div>
          <span className="co-sessions-count-pill">
            {displaySessions.length} Active Sessions
          </span>
        </CardHeader>

        <div className="co-arena-card-body">
          <div className="co-sessions-grid">
            {displaySessions.map((session, index) => (
              <div key={session.id || index} className="co-session-card">
                {/* Trainer Box Header */}
                <div className="co-session-trainer-box">
                  <div className="co-session-trainer-badge">
                    <User size={12} />
                    <span>TRAINER</span>
                  </div>
                  <h4 className="co-session-trainer-name">{session.trainerName}</h4>
                </div>

                {/* Session Main Content */}
                <div className="co-session-main">
                  <h4 className="co-session-title">{session.topic}</h4>
                  <p className="co-session-desc">{session.topicDetail || session.description || "Active training module."}</p>
                </div>

                {/* Session Footer */}
                <div className="co-session-footer">
                  <User size={13} className="co-session-user-icon" />
                  <span>{session.batch}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Flagged High Risk Students Audit Arena */}
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
  );
}
