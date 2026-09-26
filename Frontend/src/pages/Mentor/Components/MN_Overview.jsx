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
        if (res && res.data && Array.isArray(res.data)) {
          setBatches(res.data);
        } else {
          setBatches([]);
        }
      })
      .catch(() => setBatches([]));

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
    { label: "Active Batches", value: `${batches.length} Cohorts`, hint: "Live from database", icon: Layers },
    { label: "Total Students", value: `${studentCount} Students`, hint: "Live student count", icon: Users },
    { label: "Upcoming Sessions", value: `${sessionsCount} Scheduled`, hint: "Live live sessions", icon: CalendarCheck },
    { label: "Published Tasks", value: `${tasksCount} Tasks`, hint: "Active coding assignments", icon: FileCode },

    { label: "Active Batches", value: `${assignedBatches} Batches`, hint: "From assigned batch records", icon: Layers },
    { label: "Total Students", value: `${assignedStudents}`, hint: "Assigned student records", icon: Users },
    { label: "Upcoming Sessions", value: `${upcomingSessions} Scheduled`, hint: "Returned session records", icon: CalendarCheck },
    { label: "Pending Reviews", value: `${pendingReviews}`, hint: "Returned review count", icon: FileCode },

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
                const batchCode = asText(firstValue(batch, ["code", "batchCode", "batch_code", "programCode"])) || "N/A";
                const batchCollege = asText(firstValue(batch, ["college", "collegeName", "college_name", "institution"])) || "N/A";
                const studentCount = getNumber(batch, ["enrolledStudents", "studentCount", "studentsCount", "totalStudents", "assignedStudents"])
                  ?? (Array.isArray(batch.students) ? batch.students.length : 0);
                const progress = getNumber(batch, ["progress", "completion", "completionPercentage", "overallProgress"]);
                const status = asText(firstValue(batch, ["status", "state"]));
                return (
                  <div
                    key={asText(firstValue(batch, ["id", "batchId", "batch_id"])) || index}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 transition-all shadow-xs hover:shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {batchCode}

                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">• {studentCount} Students</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm tracking-tight truncate mt-1">{batchName}</h4>
                        <p className="text-xs text-slate-500 font-medium truncate">{batchCollege}</p>
                      </div>
                      <Badge variant={status ? "success" : "default"} className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider flex-shrink-0">
                        {status || "N/A"}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">Enrolled Students</span>
                        <span className="text-indigo-600">{studentCount}</span>
                      </div>
                      {progress === null ? (
                        <div className="text-xs text-slate-400">Progress: N/A</div>
                      ) : (
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                      )}
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
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No sessions scheduled.</div>
            ) : (
              sessions.map((session, index) => {
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
