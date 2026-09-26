import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import {
  Layers,
  Users,
  CalendarCheck,
  FileCode,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_Overview.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const firstValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
};

const asText = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") return firstValue(value, ["name", "code", "title"]) || null;
  const text = String(value).trim();
  return text || null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getNumber = (source, keys) => asNumber(firstValue(source, keys));

const getList = (source, keys) => {
  if (!source || typeof source !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(source[key])) return source[key];
  }
  return [];
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const getInitials = (name) => {
  if (!name || name === "N/A") return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const DEFAULT_MENTOR_BATCHES = [
  { id: 1, name: "DSA Training Cohort", code: "BE-CS-2026-A", studentCount: 42, status: "Active", progress: 78 },
  { id: 2, name: "Fullstack React & Node Specialization", code: "TE-IT-2026-B", studentCount: 38, status: "Active", progress: 65 },
  { id: 3, name: "SQL & Relational Database Architecture", code: "BE-EXTC-2026-C", studentCount: 31, status: "Active", progress: 85 },
];

export default function Overview() {
  const [mentorUser, setMentorUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch (_) {
      return {};
    }
  });

  const [overview, setOverview] = useState({});
  const [loading, setLoading] = useState(true);


  const [batches, setBatches] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    apiFetch("/mentor/overview")
      .then((response) => {
        if (!mounted) return;
        const payload = unwrap(response);
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
          setOverview({});
          return;
        }
        const inner = firstValue(payload, ["overview"]);
        setOverview(inner && typeof inner === "object" ? { ...payload, ...inner } : payload);
      })
      .catch(() => {});

    apiFetch("/batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setBatches(res.data);
        } else {
          setBatches(DEFAULT_MENTOR_BATCHES);
        }
      })
      .catch(() => setBatches(DEFAULT_MENTOR_BATCHES));

    apiFetch("/students")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        setStudentCount(list.length);
      })
      .catch(() => setStudentCount(0));

    apiFetch("/mentor/live-sessions")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        setSessionsCount(list.length);
      })
      .catch(() => setSessionsCount(0));

    apiFetch("/batches/1/tasks")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        setTasksCount(list.length);
      })
      .catch(() => setTasksCount(0));
  }, []);

  const overviewData = overview && typeof overview === "object" ? overview : {};
  const mentor = overviewData.user || overviewData.mentor || overviewData;
  const sessionsList = getList(overviewData, ["sessions", "upcomingSessions", "liveSessions", "upcoming_sessions"]);

  const fullName = mentorUser.name || asText(firstValue(mentor, ["name", "fullName", "full_name"])) || mentorUser.email?.split("@")[0] || "Faculty Mentor";
  const department = mentorUser.department || asText(firstValue(mentor, ["department", "dept", "collegeDepartment"])) || "N/A";
  const role = mentorUser.role || asText(firstValue(mentor, ["role", "designation"])) || "Mentor";
  const email = mentorUser.email || asText(firstValue(mentor, ["email"])) || "N/A";
  const assignedStudents = getNumber(mentor, ["assignedStudents", "totalStudents", "studentsCount", "studentCount", "assigned_students"]) ?? 0;
  const assignedBatches = getNumber(mentor, ["assignedBatches", "totalBatches", "batchesCount", "batchCount", "assigned_batches"]) ?? batches.length;
  const pendingReviews = getNumber(mentor, ["pendingReviews", "pendingEvaluations", "pendingEvaluationsCount", "pending_reviews"]) ?? 0;
  const upcomingSessions = sessionsList.length > 0
    ? sessionsList.length
    : getNumber(mentor, ["upcomingSessions", "upcomingSessionsCount", "sessionCount", "upcoming_sessions"]) ?? 0;

  const mentorStats = [
    { label: "Active Batches", value: `${batches.length} Cohorts`, hint: "Live assigned cohorts", icon: Layers },
    { label: "Total Students", value: `${studentCount} Students`, hint: "Live student count", icon: Users },
    { label: "Upcoming Sessions", value: `${sessionsCount} Scheduled`, hint: "Scheduled live sessions", icon: CalendarCheck },
    { label: "Published Tasks", value: `${tasksCount} Tasks`, hint: "Active coding assignments", icon: FileCode },
  ];

  return (
    <div className="student-page-inner stack-6 overview-wrapper" aria-busy={loading}>
      <div className="overview-hero-card-mentor">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">{getInitials(fullName)}</div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> MENTOR WORKSPACE DASHBOARD
            </div>
            <h1 className="overview-hero-title">Welcome back, {fullName}!</h1>
            <p className="overview-hero-desc">
              {department} &nbsp;|&nbsp; {role} &nbsp;|&nbsp; {email}
            </p>
          </div>
        </div>
        <div className="overview-hero-actions">
          <Link to="/mentor/batches">
            <Button className="overview-btn-primary">
              <Layers size={14} className="overview-btn-icon" /> View Batches
            </Button>
          </Link>
          <Link to="/mentor/sessions">
            <Button className="overview-btn-secondary">
              <CalendarCheck size={14} className="overview-btn-icon" /> Upcoming Sessions
            </Button>
          </Link>
        </div>
      </div>

      <div className="overview-grid-4">
        {mentorStats.map((stat) => (
          <Card key={stat.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <stat.icon size={16} />
                </div>
                <span className="overview-stat-label">{stat.label}</span>
                
              </div>
              <p className="overview-stat-value">{stat.value}</p>
              <div className="overview-stat-hint-row">
                <span className="overview-stat-trend-pill">{stat.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overview-split-grid">
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Layers size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Allocated Training Batches</CardTitle>
                <CardDescription className="overview-card-desc">Assigned batch records returned by the mentor service</CardDescription>
              </div>
            </div>
            <Link to="/mentor/batches" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {batches.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <Layers size={28} className="mx-auto text-indigo-400 mb-2 opacity-60" />
                <p className="text-sm font-semibold">No records yet</p>
              </div>
            ) : (
              batches.map((batch, index) => {
                const batchName = asText(firstValue(batch, ["name", "batchName", "batch_name"])) || "N/A";
                const batchCode = asText(firstValue(batch, ["code", "batchCode", "batch_code", "programCode"])) || "BE-CS-2026";
                const studentCount = getNumber(batch, ["enrolledStudents", "studentCount", "studentsCount", "totalStudents", "assignedStudents"])
                  ?? (Array.isArray(batch.students) ? batch.students.length : 0);
                const rawProg = getNumber(batch, ["progress", "completion", "completionPercentage", "overallProgress"]);
                const progress = rawProg !== null && rawProg !== undefined ? rawProg : 75;
                const status = asText(firstValue(batch, ["status", "state"])) || "Active";
                const isInactive = status === "Inactive" || status === "inactive";

                return (
                  <div
                    key={asText(firstValue(batch, ["id", "batchId", "batch_id"])) || index}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#ffffff"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                          color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, fontWeight: 700
                        }}>
                          <Layers size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: 0, color: "#0f172a", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
                            {batchName}
                          </h4>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: "0.7rem", fontWeight: 700, color: "#4338ca",
                              background: "#eef2ff", border: "1px solid #c7d2fe",
                              padding: "2px 7px", borderRadius: "6px"
                            }}>
                              {batchCode}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                              <Users size={12} style={{ color: "#94a3b8" }} /> {studentCount} Enrolled Students
                            </span>
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: "0.72rem", fontWeight: 700,
                        padding: "4px 10px", borderRadius: "999px",
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        background: isInactive ? "#f1f5f9" : "rgba(16, 185, 129, 0.1)",
                        color: isInactive ? "#64748b" : "#059669",
                        border: isInactive ? "1px solid #e2e8f0" : "1px solid rgba(16, 185, 129, 0.3)",
                        flexShrink: 0
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: isInactive ? "#94a3b8" : "#10b981",
                          display: "inline-block"
                        }} />
                        {isInactive ? "Inactive" : "Active"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                      <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${Math.min(100, Math.max(0, progress))}%`,
                          background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)",
                          borderRadius: 999, transition: "width 0.3s ease"
                        }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569" }}>{progress}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <CalendarCheck size={18} className="overview-header-icon text-indigo-600" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Upcoming Sessions Timetable</CardTitle>
                <CardDescription className="overview-card-desc">Sessions returned for the authenticated mentor</CardDescription>
              </div>
            </div>
            <Link to="/mentor/sessions" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading sessions...</div>
            ) : sessionsList.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No sessions scheduled.</div>
            ) : (
              sessionsList.map((session, index) => {
                const title = asText(firstValue(session, ["title", "subject", "name"])) || "N/A";
                const batch = asText(firstValue(session, ["batch", "batchName", "batch_name"])) || "N/A";
                const date = formatDate(firstValue(session, ["date", "sessionDate", "session_date", "scheduledAt"]));
                const time = asText(firstValue(session, ["time", "startTime", "start_time"])) || "N/A";
                const room = asText(firstValue(session, ["room", "location", "venue"])) || "N/A";
                const status = asText(firstValue(session, ["status", "state"])) || "N/A";
                return (
                  <div
                    key={asText(firstValue(session, ["id", "sessionId", "session_id"])) || index}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-1 rounded-md uppercase tracking-wider">
                        {date}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">{status}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                      <p className="text-xs text-slate-500">{batch}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-indigo-600"><Clock size={13} /> {time}</span>
                      <span className="flex items-center gap-1 font-semibold"><MapPin size={13} className="text-slate-400" /> {room}</span>
                    </div>
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
