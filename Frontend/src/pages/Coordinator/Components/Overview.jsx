import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  LineChart,
  AlertTriangle,
  Send,
  CheckCircle,
  Sparkles,
  Info,
  ChevronRight,
  Megaphone,
  BellRing,
  FileText,
  AlertCircle,
  Mail,
  ChevronDown,
  Check,
} from "lucide-react";
import { coordinatorStudents } from "../../../data/coordinatorMockData";
import "../Styles/Overview.css";

/* ── Inline dropdown for Coordinator Overview (CSS: Overview.css .coord-ov-select-*) ── */
function CoordOvSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`coord-ov-select-wrap${isOpen ? ' coord-ov-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`coord-ov-select-trigger${isOpen ? ' coord-ov-select-trigger--open' : ''}`}>
        {Icon && <Icon className="coord-ov-select-icon" />}
        <span className="coord-ov-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`coord-ov-select-arrow${isOpen ? ' coord-ov-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="coord-ov-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`coord-ov-select-option${isSel ? ' coord-ov-select-option--selected' : ''}`}>
                <span className="coord-ov-select-option-label">{opt.label}</span>
                {isSel && <Check className="coord-ov-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorOverview() {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [targetCohort, setTargetCohort] = useState("all");
  const [noticeType, setNoticeType] = useState("general");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [notifiedStudentId, setNotifiedStudentId] = useState(null);

  const highRiskStudents = coordinatorStudents.filter((s) => s.riskStatus === "High Risk");

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setBroadcastSent(true);
    setBroadcastMsg("");
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  const handleNotifyStudent = (id) => {
    setNotifiedStudentId(id);
    setTimeout(() => setNotifiedStudentId(null), 3000);
  };

  const statsList = [
    { label: "Enrolled Students", value: "480", hint: "Active in CSE department", icon: GraduationCap },
    { label: "Managed Batches", value: "6 Batches", hint: "Current active batches", icon: Users },
    { label: "Faculty & Mentors", value: "12 Trainers", hint: "Assigned department mentors", icon: UserCheck },
    { label: "Attendance Rate", value: "88%", hint: "Department average", icon: LineChart },
  ];

  const noticeTypes = [
    { id: "general", label: "General Notice", icon: Megaphone },
    { id: "urgent", label: "Urgent Exam", icon: BellRing },
    { id: "syllabus", label: "Syllabus & Quiz", icon: FileText },
  ];

  return (
    <div className="coord-overview">
      {/* Radiant Welcome Hero Banner */}
      <div className="coord-welcome-card">
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "999px", marginBottom: "8px" }}>
            <Sparkles size={13} /> COORDINATOR WORKSPACE DASHBOARD
          </div>
          <h1 className="coord-welcome-title">
            Welcome back, Harshad Nandurkar!
          </h1>
          <p className="coord-welcome-sub">
            Department Coordinator · Electronics & Computer Science | Apex Institute of Technology
          </p>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="coord-stats-grid">
        {statsList.map((s) => (
          <div key={s.label} className="coord-stat-card">
            <div className="coord-stat-top">
              <div className="coord-stat-icon-bg coord-stat-icon-bg--indigo">
                <s.icon size={18} />
              </div>
              <span className="coord-stat-label">{s.label}</span>
              <Info size={15} style={{ color: "#94a3b8", cursor: "pointer" }} />
            </div>

            <div className="coord-stat-value">{s.value}</div>

            <div>
              <span className="coord-stat-trend" style={{ background: "#f1f5f9", color: "#475569" }}>
                {s.hint}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Main Arena */}
      <div className="coord-grid-split">
        {/* Left: Broadcast Announcement Form */}
        <div className="coord-subcard">
          <div className="coord-card-header">
            <div className="coord-card-header-left">
              <div className="coord-header-icon-wrap coord-header-icon-wrap--indigo">
                <Megaphone size={20} />
              </div>
              <div>
                <h3 className="coord-card-title">Broadcast Department Notice</h3>
                <p className="coord-card-desc">Send instant announcements to active cohorts</p>
              </div>
            </div>
            <span className="coord-badge-dept">CSE Dept</span>
          </div>

          <div style={{ padding: "20px" }}>
            <form onSubmit={handleBroadcast} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Notice Category */}
              <div>
                <label className="coord-field-label">Notice Category</label>
                <div className="coord-notice-types-grid">
                  {noticeTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = noticeType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setNoticeType(type.id)}
                        className={`coord-type-btn ${isSelected ? "coord-type-btn--active" : ""}`}
                      >
                        <Icon size={14} />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="coord-field-label" style={{ marginBottom: "6px", display: "block" }}>Target Audience</label>
                <CoordOvSelect
                  value={targetCohort}
                  options={[
                    { value: "all", label: "All CSE Batches & Students (480 Students)" },
                    { value: "cse26", label: "CSE 2026 Alpha Cohort (120 Students)" },
                    { value: "fs", label: "Fullstack React & Node Specialization (105 Students)" },
                    { value: "ds", label: "Data Science & ML 2025 (110 Students)" },
                    { value: "cloud", label: "Cloud Native & DevOps Infrastructure (85 Students)" },
                  ]}
                  onChange={(val) => setTargetCohort(val)}
                  icon={Users}
                />
              </div>

              {/* Notice Message */}
              <div>
                <div className="coord-textarea-header">
                  <label className="coord-field-label">Notice Message</label>
                  <span className="coord-char-count">{broadcastMsg.length}/500</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Type official notice message (e.g., Mid-Term Assessment scheduled for Friday 10:00 AM in Lab 402)..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="coord-textarea"
                />
              </div>

              {/* Submit & Status Row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" }}>
                <button
                  type="submit"
                  disabled={!broadcastMsg.trim()}
                  className="coord-submit-btn"
                >
                  <Send size={15} />
                  <span>Send Announcement</span>
                </button>

                {broadcastSent && (
                  <div className="coord-toast-sent">
                    <CheckCircle size={15} />
                    <span>Notice sent to {targetCohort === 'all' ? '480' : '120'} students!</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: Flagged High Risk Students */}
        <div className="coord-subcard">
          <div className="coord-card-header">
            <div className="coord-card-header-left">
              <div className="coord-header-icon-wrap coord-header-icon-wrap--rose">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="coord-card-title">Defaulter & Risk Audit</h3>
                <p className="coord-card-desc">Students requiring intervention (&lt;75% Attendance)</p>
              </div>
            </div>
            <span className="coord-badge-risk-count">{highRiskStudents.length} Flagged</span>
          </div>

          <div className="coord-risk-list">
            {highRiskStudents.length === 0 ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#64748b" }}>
                <CheckCircle size={32} style={{ color: "#10b981", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>No high risk students flagged.</p>
                <p style={{ fontSize: "12px", color: "#94a3b8" }}>All students maintain required attendance thresholds.</p>
              </div>
            ) : (
              highRiskStudents.map((s) => {
                const isNotified = notifiedStudentId === s.id;
                const initials = s.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div key={s.id} className="coord-risk-item">
                    <div className="coord-risk-top">
                      <div className="coord-risk-user-info">
                        <div className="coord-risk-avatar">{initials}</div>
                        <div>
                          <div className="coord-risk-name-row">
                            <span className="coord-risk-name">{s.name}</span>
                            <span className="coord-risk-badge">High Risk</span>
                          </div>
                          <p className="coord-risk-subtext">
                            {s.rollNo} · <strong style={{ color: "#334155" }}>{s.batch}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNotifyStudent(s.id)}
                        className={`coord-alert-btn ${isNotified ? "coord-alert-btn--sent" : ""}`}
                      >
                        {isNotified ? (
                          <>
                            <CheckCircle size={14} /> Sent
                          </>
                        ) : (
                          <>
                            <Mail size={14} /> Alert Student
                          </>
                        )}
                      </button>
                    </div>

                    <div className="coord-metric-strip">
                      <div className="coord-pill-metric coord-pill-metric--rose">
                        <AlertCircle size={12} />
                        <span>Attendance: {s.attendance}%</span>
                      </div>

                      <div className="coord-pill-metric coord-pill-metric--amber">
                        <span>Quiz Avg: {s.avgScore}%</span>
                      </div>

                      <div className="coord-pill-metric coord-pill-metric--purple">
                        <span>Interview: {s.interviewScore}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
              <Link to="/coordinator/students" className="coord-card-link" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span>View All Defaulter Records</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



