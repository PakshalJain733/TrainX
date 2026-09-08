import { useState } from "react";
import { Video, Calendar, Clock, Users, ExternalLink, Plus, CheckCircle, Search } from "lucide-react";
import "../Styles/LiveSessions.css";

export default function CoordinatorLiveSessions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const sessions = [
    {
      id: 1,
      title: "Spring Boot Microservices & Event Architecture",
      batch: "CSE-2026-A",
      mentor: "Dr. Rajesh Kulkarni",
      date: "Today",
      time: "02:00 PM - 04:00 PM",
      status: "Live Now",
      attendees: 58,
      totalCapacity: 64,
      meetLink: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: 2,
      title: "Deep Learning Neural Networks in PyTorch",
      batch: "AI-DS-2026-Alpha",
      mentor: "Priya Sundaram",
      date: "Today",
      time: "04:30 PM - 06:30 PM",
      status: "Upcoming",
      attendees: 0,
      totalCapacity: 58,
      meetLink: "https://meet.google.com/xyz-uvwx-rst",
    },
    {
      id: 3,
      title: "Advanced Dynamic Programming & Graph Algos",
      batch: "IT-2026-Beta",
      mentor: "Vikas Deshmukh",
      date: "Tomorrow",
      time: "10:00 AM - 12:00 PM",
      status: "Upcoming",
      attendees: 0,
      totalCapacity: 52,
      meetLink: "https://meet.google.com/klm-nopq-rst",
    },
    {
      id: 4,
      title: "Docker Containerization & Kubernetes Deployments",
      batch: "CSE-2026-B",
      mentor: "Dr. Rajesh Kulkarni",
      date: "03 Mar 2026",
      time: "02:00 PM - 04:00 PM",
      status: "Completed",
      attendees: 59,
      totalCapacity: 61,
      recordingAvailable: true,
    },
  ];

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.batch.toLowerCase().includes(search.toLowerCase()) ||
      s.mentor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="coord-sessions-page">
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">
            <Video size={22} className="coord-header-icon" color="#4f46e5" />
            Live Training Classrooms & Sessions
          </h1>
          <p className="coord-page-sub">
            Monitor real-time interactive lectures, trainer attendance check-ins, and meeting room links.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="coord-stats-grid">
        <div className="coord-stat-card">
          <div className="coord-stat-label">Currently Live</div>
          <div className="coord-stat-value" style={{ color: "#e11d48" }}>1 Class</div>
          <div className="coord-stat-subtext">58 active student attendees</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Scheduled This Week</div>
          <div className="coord-stat-value" style={{ color: "#4f46e5" }}>14 Sessions</div>
          <div className="coord-stat-subtext">4 Industry Trainers</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Average Attendance Rate</div>
          <div className="coord-stat-value" style={{ color: "#059669" }}>93.4%</div>
          <div className="coord-stat-subtext">Recorded live via portal</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Session Recordings</div>
          <div className="coord-stat-value" style={{ color: "#2563eb" }}>48 Uploaded</div>
          <div className="coord-stat-subtext">Archived in Study Material</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="coord-filter-bar">
        <div className="coord-search-wrap">
          <Search size={16} className="coord-search-icon" />
          <input
            type="text"
            className="coord-search-input coord-search-input--with-icon"
            placeholder="Search session title, mentor or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="coord-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Live Now">Live Now</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Sessions Grid */}
      <div className="coord-sessions-grid">
        {filteredSessions.map((s) => (
          <div key={s.id} className="coord-session-card">
            <div className="coord-session-top">
              <span className="coord-badge coord-badge--batch">{s.batch}</span>
              <span className={`coord-badge coord-badge--${s.status === "Live Now" ? "danger" : s.status === "Upcoming" ? "primary" : "neutral"}`}>
                {s.status === "Live Now" && <span className="coord-live-pulse" />}
                {s.status}
              </span>
            </div>

            <h3 className="coord-session-title">{s.title}</h3>
            <div className="coord-session-mentor">Trainer: <strong>{s.mentor}</strong></div>

            <div className="coord-session-meta">
              <div className="coord-session-meta-item">
                <Calendar size={13} color="#64748b" /> {s.date}
              </div>
              <div className="coord-session-meta-item">
                <Clock size={13} color="#64748b" /> {s.time}
              </div>
              <div className="coord-session-meta-item">
                <Users size={13} color="#64748b" /> {s.attendees > 0 ? `${s.attendees} / ${s.totalCapacity} Enrolled` : `${s.totalCapacity} Capacity`}
              </div>
            </div>

            <div className="coord-session-actions">
              {s.meetLink && (
                <a
                  href={s.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="coord-btn coord-btn--primary coord-btn--full"
                >
                  <ExternalLink size={14} /> Join Classroom Audit
                </a>
              )}
              {s.recordingAvailable && (
                <button
                  className="coord-btn coord-btn--neutral coord-btn--full"
                  onClick={() => alert(`Opening archive for: ${s.title}`)}
                >
                  View Lecture Recording
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
