import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Users, CalendarCheck, FileCode, Clock, Sparkles, Info, ChevronRight, MapPin, GraduationCap, UserCheck, BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { apiFetch } from '../../../utils/api';
import "../Styles/MN_Overview.css";

export default function Overview() {
  const [mentorUser, setMentorUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch (_) {
      return {};
    }
  });

  const [batches, setBatches] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);

  useEffect(() => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          setMentorUser(res.data);
        }
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

  const fullName = mentorUser.name || mentorUser.fullName || mentorUser.email?.split("@")[0] || "Faculty Mentor";
  const dept = mentorUser.department || mentorUser.dept || mentorUser.mentorProfile?.department || "";
  const email = mentorUser.email || "";
  const role = mentorUser.role || "Mentor";

  const getInitials = (name) => {
    if (!name) return "FM";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(fullName);

  const mentorStats = [
    { label: "Active Batches", value: `${batches.length} Cohorts`, hint: "Live from database", icon: Layers },
    { label: "Total Students", value: `${studentCount} Students`, hint: "Live student count", icon: Users },
    { label: "Upcoming Sessions", value: `${sessionsCount} Scheduled`, hint: "Live live sessions", icon: CalendarCheck },
    { label: "Published Tasks", value: `${tasksCount} Tasks`, hint: "Active coding assignments", icon: FileCode },
  ];

  const upcomingTimetable = [];

  return (
    <div className="student-page-inner stack-6 overview-wrapper">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card-mentor">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {userInitials}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> MENTOR WORKSPACE DASHBOARD
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {fullName}!
            </h1>
            <p className="overview-hero-desc">
              {dept || "Computer Engineering"} &nbsp;|&nbsp; {role || "Mentor"} &nbsp;|&nbsp; {email || "mentor@pvppcoe.ac.in"}
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

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {mentorStats.map((s) => (
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
        {/* Left: Allocated Training Batches */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Layers size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Allocated Training Batches</CardTitle>
                <CardDescription className="overview-card-desc">Active cohort syllabus completion & health</CardDescription>
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
                <p className="text-sm font-semibold">No training batches allocated yet.</p>
              </div>
            ) : (
              batches.map((b) => (
                <div
                  key={b.id || b.name}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 transition-all shadow-xs hover:shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {b.code || b.department || "CSE"}
                        </span>
                        {b.studentsCount && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            • {b.studentsCount} Students
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm tracking-tight truncate mt-1">
                        {b.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {b.college || "PVPPCOE"} · {b.department || "Computer Engineering"}
                      </p>
                    </div>
                    <Badge variant="success" className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider flex-shrink-0">
                      {b.status || "Active"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Syllabus Progress</span>
                      <span className="text-indigo-600">{b.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${b.progress || 0}%`,
                          background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)"
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Upcoming Sessions Timetable */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <CalendarCheck size={18} className="overview-header-icon text-indigo-600" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Upcoming Sessions Timetable</CardTitle>
                <CardDescription className="overview-card-desc">Scheduled mentorship classes & lab timetable</CardDescription>
              </div>
            </div>
            <Link to="/mentor/sessions" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {upcomingTimetable.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: s.isToday ? "1.5px solid #c7d2fe" : "1px solid #e2e8f0",
                  background: s.isToday
                    ? "linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)"
                    : "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Top Row: Date Pill & Status */}
                <div style={{ display: "flex", alignItems: "center", justifyCenter: "space-between" }}>
                  <span
                    style={{
                      background: s.isToday ? "#4f46e5" : "#e2e8f0",
                      color: s.isToday ? "#ffffff" : "#334155",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "6px",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.date}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: s.isToday ? "#1d4ed8" : "#475569",
                      background: s.isToday ? "#dbeafe" : "#f1f5f9",
                      padding: "3px 10px",
                      borderRadius: "999px",
                    }}
                  >
                    {s.status}
                  </span>
                </div>

                {/* Title & Batch */}
                <div>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0", lineHeight: "1.4" }}>
                    {s.title}
                  </h4>
                  <p style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500, margin: 0 }}>
                    {s.batch}
                  </p>
                </div>

                {/* Footer Info Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(226, 232, 240, 0.8)",
                    fontSize: "11.5px",
                    color: "#475569",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 600, color: "#4f46e5" }}>
                    <Clock size={13} /> {s.time}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, color: "#334155" }}>
                    <MapPin size={13} style={{ color: "#64748b" }} /> {s.room}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
