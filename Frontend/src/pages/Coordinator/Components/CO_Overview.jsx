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
  Layers
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
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (_) {
      return {};
    }
  });

  useEffect(() => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          setCoordUser(res.data);
        }
      })
      .catch(() => { });
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
    { label: "Enrolled Students", value: "480", hint: `Active in ${dept}`, icon: GraduationCap },
    { label: "Managed Batches", value: "6 Batches", hint: "Current active batches", icon: Users },
    { label: "Faculty & Mentors", value: "12 Trainers", hint: "Assigned department mentors", icon: UserCheck },
    { label: "Attendance Rate", value: "88%", hint: "Department average", icon: LineChart },
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
        {/* Left: Broadcast Announcement Form */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Send size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Broadcast Department Notice</CardTitle>
                <CardDescription className="overview-card-desc">Send instant announcements to students & cohorts</CardDescription>
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

