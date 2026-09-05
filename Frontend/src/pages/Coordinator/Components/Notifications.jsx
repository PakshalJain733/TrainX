import { useState } from "react";
import {
  Bell,
  Send,
  Code,
  CalendarCheck,
  Bot,
  Briefcase,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react";
import "../Styles/Notifications.css";

const defaultNotifications = [
  {
    id: 1,
    title: "New Student Practice Submissions Received",
    body: "42 students from CSE 2026 Alpha Cohort completed the 'Two Sum II' coding practice assignment.",
    time: "15 min ago",
    category: "Coding Practice",
    icon: Code,
    iconColor: "#4f46e5",
    iconBg: "#e0e7ff",
    unread: true,
    actionLabel: "View Submissions",
    actionUrl: "/coordinator/practice",
  },
  {
    id: 2,
    title: "Attendance Warning Alert Triggered",
    body: "6 students in Data Science & ML 2025 cohort crossed 3 consecutive session absences.",
    time: "2 hours ago",
    category: "Attendance",
    icon: CalendarCheck,
    iconColor: "#dc2626",
    iconBg: "#fef2f2",
    unread: true,
    actionLabel: "View Defaulters",
    actionUrl: "/coordinator/attendance",
  },
  {
    id: 3,
    title: "AI Interview Simulation Results Ready",
    body: "Week 34 AI Mock Interview performance metrics generated for 48 department students.",
    time: "Yesterday",
    category: "AI Interview",
    icon: Bot,
    iconColor: "#7c3aed",
    iconBg: "#f5f3ff",
    unread: false,
    actionLabel: "Inspect Results",
    actionUrl: "/coordinator/assessments",
  },
  {
    id: 4,
    title: "Placement Drive Registration Open",
    body: "Goldman Sachs Technical Analyst drive link broadcasted to all CSE & IT final year batches.",
    time: "2 days ago",
    category: "Placement",
    icon: Briefcase,
    iconColor: "#059669",
    iconBg: "#ecfdf5",
    unread: false,
    actionLabel: "View Drive",
    actionUrl: "/coordinator/placement",
  },
];

export default function CoordinatorNotifications() {
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [activeTab, setActiveTab] = useState("All");
  const [text, setText] = useState("");

  const categories = ["All", "Unread", "Coding Practice", "Attendance", "AI Interview", "Placement"];

  const filteredNotifs = notifications.filter((item) => {
    if (activeTab === "Unread") return item.unread;
    if (activeTab !== "All") return item.category === activeTab;
    return true;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newNotif = {
      id: Date.now(),
      title: `Broadcast Notice: ${text}`,
      body: "Real-time broadcast sent to all department student and mentor channels.",
      time: "Just now",
      category: "Governance",
      icon: ShieldCheck,
      iconColor: "#2563eb",
      iconBg: "#eff6ff",
      unread: true,
    };

    setNotifications([newNotif, ...notifications]);
    setText("");
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div style={{ paddingBottom: "32px" }}>
      {/* Header */}
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Coordinator Notification & Broadcast Center</h1>
          <p className="coord-page-sub">
            Publish real-time announcements to department cohorts and monitor system activity alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="coord-btn coord-btn--secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <CheckCircle2 size={15} /> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Broadcast Announcement Form */}
      <div className="coord-card" style={{ marginBottom: "24px" }}>
        <div className="coord-card-title">
          <Send size={18} color="#4f46e5" />
          Send Real-time Department Broadcast
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
          <textarea
            rows={3}
            required
            placeholder="Type notice or broadcast alert for department students and mentors..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", resize: "none" }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="coord-btn coord-btn--primary">
              <Send size={14} /> Publish Broadcast Alert
            </button>
          </div>
        </form>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {categories.map((cat) => {
          const isActive = activeTab === cat;
          const count = cat === "Unread" ? unreadCount : notifications.filter((n) => cat === "All" || n.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid " + (isActive ? "#4f46e5" : "#cbd5e1"),
                background: isActive ? "#4f46e5" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "12.5px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {cat}
              <span style={{ opacity: 0.8, fontSize: "11px" }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Notification Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredNotifs.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "18px 20px",
                border: "1px solid " + (item.unread ? "#c7d2fe" : "#e2e8f0"),
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                boxShadow: item.unread ? "0 4px 14px rgba(79,70,229,0.06)" : "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: item.iconBg,
                  color: item.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "14.5px", fontWeight: 800, color: "#0f172a", margin: 0 }}>{item.title}</h3>
                    {item.unread && (
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4f46e5" }} />
                    )}
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} /> {item.time}
                  </span>
                </div>

                <p style={{ fontSize: "13px", color: "#475569", margin: "6px 0 10px 0" }}>{item.body}</p>

                {item.actionLabel && (
                  <a
                    href={item.actionUrl}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "#4f46e5",
                      textDecoration: "none",
                    }}
                  >
                    {item.actionLabel} <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

