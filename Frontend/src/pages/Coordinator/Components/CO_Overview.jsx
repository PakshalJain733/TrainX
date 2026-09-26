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
import { Card, CardContent } from "../../../components/ui/Card";
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

      {/* Current Training Sessions Section */}
      <div className="co-arena-card co-training-sessions-card">
        <div className="co-arena-card-header">
          <div className="co-arena-header-left">
            <div className="co-arena-icon-wrap co-arena-icon-wrap--indigo">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="co-arena-header-title">Current Training Sessions</h3>
              <p className="co-arena-header-sub">Currently ongoing classes and topics being taught</p>
            </div>
          </div>
          <span className="co-sessions-count-pill">
            {displaySessions.length} Active Sessions
          </span>
        </div>

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
      </div>

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
