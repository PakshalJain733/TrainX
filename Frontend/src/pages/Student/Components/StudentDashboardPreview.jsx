import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  BookOpenCheck,
  Terminal,
  GraduationCap,
  Bot,
  LineChart,
  Gauge,
  CalendarCheck,
  FileCheck2,
  Settings,
  HelpCircle,
  Bell,
  ChevronDown,
  Target,
  TrendingUp,
  Compass,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Search,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import logoImg from "../../../assets/Logo.png";
import "../Styles/StudentDashboardPreview.css";

const toNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseTokenUserId = () => {
  try {
    const token = (sessionStorage.getItem("token") || localStorage.getItem("token"));
    if (!token || token.indexOf(".") === -1) return null;
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const raw = part + "=".repeat((4 - (part.length % 4)) % 4);
    const payload = JSON.parse(atob(raw));
    return payload.userId || payload.id || payload.sub || null;
  } catch {
    return null;
  }
};

const getStoredStudentName = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u) return "";
    const name = u.name || "";
    const isAutoName =
      !name.trim() ||
      /^\d+$/.test(name.trim()) ||
      name.startsWith("User_") ||
      /^vu\d/i.test(name.trim());
    if (isAutoName) return u.fullName || u.full_name || "";
    return name;
  } catch {
    return "";
  }
};

const getInitials = (name) => {
  if (!name || !name.trim()) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const NAV = {
  learn: [
    { title: "AI Roadmap", url: "/student/roadmap", icon: Sparkles },
    { title: "Learning Content", url: "/student/learning", icon: BookOpenCheck },
  ],
  practice: [
    { title: "Practice", url: "/student/practice", icon: Terminal },
    { title: "Quiz", url: "/student/quiz", icon: GraduationCap },
    { title: "AI Interview", url: "/student/ai-interview", icon: Bot },
  ],
  insights: [
    { title: "Progress", url: "/student/progress", icon: LineChart },
    { title: "Skill Gap Analysis", url: "/student/skill-gaps", icon: Gauge },
    { title: "Attendance", url: "/student/attendance", icon: CalendarCheck },
    { title: "Weekly Reports", url: "/student/weekly-reports", icon: FileCheck2 },
  ],
};

const FOOTER_NAV = [
  { title: "Settings", url: "/student/settings", icon: Settings },
  { title: "Support", url: "/student/help", icon: HelpCircle },
];

const priorityTone = (priority) => {
  const p = String(priority || "").toLowerCase();
  if (p === "high") return "dp-tone--critical";
  if (p === "medium") return "dp-tone--warning";
  return "dp-tone--ok";
};

export default function StudentDashboardPreview() {
  const { pathname } = useLocation();

  const [status, setStatus] = useState("loading"); // loading | success | error | auth
  const [errorMsg, setErrorMsg] = useState("");
  const [skillData, setSkillData] = useState(null);
  const [coding, setCoding] = useState(null);

  const studentName = getStoredStudentName();

  useEffect(() => {
    let active = true;

    async function load() {
      const uid = parseTokenUserId();
      if (!uid) {
        if (active) {
          setErrorMsg("Your session has expired. Please log in again to preview the redesigned dashboard.");
          setStatus("auth");
        }
        return;
      }
      const [skillRes, codingRes] = await Promise.all([
        apiFetch("/skill-gaps/my-gaps"),
        apiFetch(`/coding-submissions/student/${uid}`),
      ]);

      if (!active) return;

      const skillOk = skillRes && skillRes.data;
      const codingOk = codingRes && codingRes.data;

      if (skillOk) setSkillData(skillRes.data);
      if (codingOk) setCoding(codingRes.data);

      if (!skillOk && !codingOk) {
        setErrorMsg((skillRes && skillRes.error) || "Could not load your dashboard data.");
        setStatus("error");
      } else {
        if (skillRes && skillRes.status === 401 && !skillOk) {
          setErrorMsg("Your session has expired. Please log in again.");
          setStatus("auth");
          return;
        }
        setStatus("success");
      }
    }

    const timer = setTimeout(load, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const weakTopics = useMemo(() => {
    if (!skillData || !Array.isArray(skillData.weakTopics)) return [];
    const order = { High: 0, Medium: 1, Low: 2 };
    return skillData.weakTopics.slice().sort((a, b) => {
      const pa = order[String(a.priority || "").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())] ?? 1;
      const pb = order[String(b.priority || "").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())] ?? 1;
      return pa - pb;
    });
  }, [skillData]);

  const codingSummary = coding && coding.summary ? coding.summary : null;
  const totalSubs = codingSummary ? toNumber(codingSummary.totalSubmissions) : 0;
  const passedSubs = codingSummary ? toNumber(codingSummary.passedSubmissions) : 0;
  const codingAvg = codingSummary ? toNumber(codingSummary.averagePercentage) : null;
  const solvedPct = totalSubs ? Math.round((passedSubs / totalSubs) * 100) : null;

  const segments = useMemo(() => [
    {
      label: "Official Dashboard",
      href: "/student",
      icon: LayoutDashboard,
      description: "The current production dashboard",
    },
  ], []);

  const renderAuth = () => (
    <div className="dp-state">
      <div className="dp-state-icon dp-state-icon--muted">
        <AlertTriangle size={24} />
      </div>
      <h3 className="dp-state-title">Preview requires a login</h3>
      <p className="dp-state-desc">{errorMsg}</p>
      <Link to="/" className="dp-btn dp-btn--primary">
        Go to Login
      </Link>
    </div>
  );

  const renderError = () => (
    <div className="dp-state">
      <div className="dp-state-icon dp-state-icon--muted">
        <AlertTriangle size={24} />
      </div>
      <h3 className="dp-state-title">Could not load dashboard data</h3>
      <p className="dp-state-desc">{errorMsg}</p>
      <button
        className="dp-btn dp-btn--primary"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );

  const renderLoading = () => (
    <div className="dp-state">
      <div className="dp-loading-bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h3 className="dp-state-title">Building your preview</h3>
      <p className="dp-state-desc">Loading your real training data…</p>
    </div>
  );

  const metricTiles = useMemo(() => {
    const tiles = [
      {
        key: "overall",
        label: "Overall Progress",
        value: solvedPct === null ? "—" : `${solvedPct}%`,
        sub: solvedPct === null ? "Complete a practice to begin" : `${passedSubs} of ${totalSubs} problems solved`,
        icon: TrendingUp,
        ok: solvedPct !== null,
      },
      {
        key: "coding",
        label: "Coding Performance",
        value: codingAvg === null ? "—" : `${Math.round(codingAvg)}%`,
        sub: codingAvg === null ? "No submissions yet" : "average across submissions",
        icon: Terminal,
        ok: codingAvg !== null,
      },
      {
        key: "quiz",
        label: "Quiz Performance",
        value: "—",
        sub: "No quiz data yet",
        icon: GraduationCap,
        ok: false,
      },
      {
        key: "attendance",
        label: "Attendance",
        value: "—",
        sub: "No verified attendance data",
        icon: CalendarCheck,
        ok: false,
      },
    ];
    return tiles;
  }, [solvedPct, passedSubs, totalSubs, codingAvg]);

  return (
    <div className="dp-preview">
      {/* ── Preview-only slim sidebar (isolated, does not affect the real app) ── */}
      <aside className="dp-sidebar">
        <div className="dp-brand">
          <img src={logoImg} alt="Training Portal" className="dp-brand-logo" />
          <span className="dp-brand-name">Training Portal</span>
        </div>

        <nav className="dp-nav" aria-label="Preview navigation">
          <Link
            to="/student/dashboard-preview"
            className="dp-nav-item dp-nav-item--active"
          >
            <LayoutDashboard size={16} className="dp-nav-icon" />
            <span className="dp-nav-label">Dashboard</span>
          </Link>

          <div className="dp-nav-group">
            <span className="dp-nav-group-label">Learn</span>
            {NAV.learn.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className="dp-nav-item"
                aria-current={pathname === item.url ? "page" : undefined}
              >
                <item.icon size={16} className="dp-nav-icon" />
                <span className="dp-nav-label">{item.title}</span>
              </Link>
            ))}
          </div>

          <div className="dp-nav-group">
            <span className="dp-nav-group-label">Practice</span>
            {NAV.practice.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className="dp-nav-item"
                aria-current={pathname === item.url ? "page" : undefined}
              >
                <item.icon size={16} className="dp-nav-icon" />
                <span className="dp-nav-label">{item.title}</span>
              </Link>
            ))}
          </div>

          <div className="dp-nav-group">
            <span className="dp-nav-group-label">Insights</span>
            {NAV.insights.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className="dp-nav-item"
                aria-current={pathname === item.url ? "page" : undefined}
              >
                <item.icon size={16} className="dp-nav-icon" />
                <span className="dp-nav-label">{item.title}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="dp-nav-footer">
          {FOOTER_NAV.map((item) => (
            <Link key={item.url} to={item.url} className="dp-nav-item">
              <item.icon size={16} className="dp-nav-icon" />
              <span className="dp-nav-label">{item.title}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="dp-main">
        <header className="dp-header">
          <div className="dp-header-left">
            <div>
              <div className="dp-header-title">Dashboard</div>
              <div className="dp-header-sub">A design preview of the Student Dashboard</div>
            </div>
            <span className="dp-badge">Design preview</span>
          </div>

          <div className="dp-header-right">
            <a
              href={segments[0].href}
              className="dp-header-link"
              title={segments[0].description}
            >
              <Search size={15} /> Current dashboard
            </a>
            <button type="button" className="dp-icon-btn" aria-label="Notifications">
              <Bell size={17} />
              <span className="dp-dot" />
            </button>
            <div className="dp-user">
              <div className="dp-avatar">{getInitials(studentName)}</div>
              <div className="dp-user-meta">
                <span className="dp-user-name">{studentName || "Student"}</span>
                <span className="dp-user-role">Student</span>
              </div>
              <ChevronDown size={14} className="dp-user-caret" />
            </div>
          </div>
        </header>

        <div className="dp-content">
          {status === "loading" && renderLoading()}
          {status === "error" && renderError()}
          {status === "auth" && renderAuth()}

          {status === "success" && (
            <>
              {/* Compact greeting — not a banner */}
              <section className="dp-greeting">
                <h1 className="dp-greeting-title">
                  {getGreeting()}
                  {studentName ? `, ${studentName.split(" ")[0]}` : ""}
                </h1>
                <p className="dp-greeting-sub">Here's where your training stands today.</p>
              </section>

              {/* Compact metrics */}
              <section className="dp-metrics" aria-label="Key metrics">
                {metricTiles.map((m) => (
                  <div key={m.key} className="dp-metric-tile">
                    <div className="dp-metric-top">
                      <span className="dp-metric-label">{m.label}</span>
                      <m.icon size={15} className="dp-metric-icon" strokeWidth={1.7} />
                    </div>
                    <div className="dp-metric-value">{m.value}</div>
                    <div className="dp-metric-sub">{m.sub}</div>
                  </div>
                ))}
              </section>

              {/* Row: Skill Focus (real) + Continue Learning */}
              <div className="dp-grid dp-grid--main">
                <section className="dp-panel dp-panel--wide">
                  <div className="dp-panel-head">
                    <div>
                      <h2 className="dp-panel-title">Skill Focus</h2>
                      <p className="dp-panel-desc">
                        Weak areas detected from your real assessment &amp; coding data
                      </p>
                    </div>
                    <div className="dp-ai-tag">
                      <Sparkles size={13} /> AI
                    </div>
                  </div>

                  {weakTopics.length === 0 ? (
                    <div className="dp-empty-compact">
                      <CheckCircle2 size={18} />
                      <div>
                        <p className="dp-empty-title">No skill gaps detected</p>
                        <p className="dp-empty-sub">Keep practicing — you're on track.</p>
                      </div>
                      <Link to="/student/skill-gaps" className="dp-text-link">
                        View skills <ArrowRight size={13} />
                      </Link>
                    </div>
                  ) : (
                    <div className="dp-skill-list">
                      {weakTopics.map((w) => {
                        const avg = toNumber(w.avgScore);
                        const def = toNumber(w.deficiencyRate, 100 - avg);
                        const priority = w.priority || (avg < 50 ? "High" : avg < 60 ? "Medium" : "Low");
                        return (
                          <div key={w.topic} className="dp-skill-row">
                            <div className="dp-skill-main">
                              <div className="dp-skill-icon">
                                <Target size={16} strokeWidth={1.8} />
                              </div>
                              <div className="dp-skill-text">
                                <span className="dp-skill-name">{w.topic}</span>
                                <span className="dp-skill-cat">{w.category || "Skill"}</span>
                              </div>
                            </div>

                            <div className="dp-skill-stat">
                              <span className="dp-stat-label">Score</span>
                              <span className="dp-stat-value">{Math.round(avg)}%</span>
                            </div>

                            <div className="dp-skill-stat">
                              <span className="dp-stat-label">Gap</span>
                              <span className="dp-stat-value">{Math.round(def)}%</span>
                            </div>

                            <span className={`dp-priority ${priorityTone(priority)}`}>{priority}</span>

                            <Link
                              to="/student/skill-gaps"
                              className="dp-text-link"
                              aria-label={`View ${w.topic} improvement plan`}
                            >
                              View <ArrowRight size={13} />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="dp-panel-foot">
                    <Link to="/student/skill-gaps" className="dp-text-link dp-text-link--strong">
                      View full skill analysis <ArrowRight size={14} />
                    </Link>
                  </div>
                </section>

                <section className="dp-panel dp-panel--stack">
                  <h2 className="dp-panel-title">Continue Learning</h2>

                  <div className="dp-roadmap-empty">
                    <div className="dp-empty-icon">
                      <Compass size={20} strokeWidth={1.7} />
                    </div>
                    <p className="dp-empty-title">No active roadmap yet</p>
                    <p className="dp-empty-sub">
                      Generate your AI roadmap to start your learning journey.
                    </p>
                    <Link to="/student/roadmap" className="dp-btn dp-btn--primary">
                      Generate AI Roadmap
                    </Link>
                  </div>
                </section>
              </div>

              {/* Row: Weekly performance + Upcoming work */}
              <div className="dp-grid dp-grid--main">
                <section className="dp-panel dp-panel--wide">
                  <div className="dp-panel-head">
                    <div>
                      <h2 className="dp-panel-title">Weekly Performance</h2>
                      <p className="dp-panel-desc">
                        Your practice and quiz trend for the current week
                      </p>
                    </div>
                  </div>

                  <div className="dp-weekly-empty">
                    <div className="dp-empty-icon">
                      <LineChart size={20} strokeWidth={1.7} />
                    </div>
                    <p className="dp-empty-title">No weekly activity yet</p>
                    <p className="dp-empty-sub">
                      Complete practice sessions and quizzes and your weekly trend will appear here
                      automatically.
                    </p>
                    <Link to="/student/progress" className="dp-btn dp-btn--ghost">
                      Open Progress <ArrowRight size={14} />
                    </Link>
                  </div>
                </section>

                <section className="dp-panel dp-panel--stack">
                  <h2 className="dp-panel-title">Upcoming Work</h2>
                  <div className="dp-upcoming-empty">
                    <CalendarClock size={18} className="dp-upcoming-icon" />
                    <p className="dp-empty-title">You're all caught up.</p>
                    <p className="dp-empty-sub">
                      No quizzes, practice or milestones are due right now.
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}