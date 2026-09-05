import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Sparkles,
  Award,
  Bot,
  Terminal,
  CalendarCheck,
  Clock,
  Trash2,
  Filter,
  ExternalLink,
  Info,
  CheckCircle2,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import "../Styles/Notifications.css";

const defaultNotifications = [
  {
    id: 1,
    title: "New Milestone Unlocked: Advanced SQL & Indexing",
    body: "You've successfully cleared the SQL fundamentals quiz with 85% score. Milestone 2 (Query Plans & Partitioning) is now accessible.",
    time: "25 min ago",
    category: "Milestones",
    icon: Sparkles,
    iconColor: "#2563eb",
    iconBg: "#eff6ff",
    unread: true,
    actionLabel: "View Roadmap",
    actionUrl: "/student/roadmap",
  },
  {
    id: 2,
    title: "Weekly Mentor Dossier (Week 34) Published",
    body: "Your mentor Ms. R. Kulkarni has reviewed your week's quiz submissions, attendance, and AI mock interview. Status: On Track.",
    time: "2 hours ago",
    category: "Weekly Reports",
    icon: Award,
    iconColor: "#059669",
    iconBg: "#ecfdf5",
    unread: true,
    actionLabel: "View Report",
    actionUrl: "/student/weekly-reports",
  },
  {
    id: 3,
    title: "AI Mock Interview Drill Scheduled",
    body: "Your technical interview simulation on 'FastAPI Dependency Injection & Async Handlers' is ready. Take the 5-question drill anytime today.",
    time: "5 hours ago",
    category: "AI Interview",
    icon: Bot,
    iconColor: "#7c3aed",
    iconBg: "#f5f3ff",
    unread: true,
    actionLabel: "Start Interview",
    actionUrl: "/student/ai-interview",
  },
  {
    id: 4,
    title: "New Practice Set: Distributed HashMaps & Concurrency",
    body: "Coordinator Prof. A. Deshmukh posted 4 new curated LeetCode-style algorithm challenges to your ECS Batch Practice Queue.",
    time: "Yesterday",
    category: "Practice",
    icon: Terminal,
    iconColor: "#d97706",
    iconBg: "#fffbeb",
    unread: false,
    actionLabel: "Practice Now",
    actionUrl: "/student/practice",
  },
  {
    id: 5,
    title: "Attendance Recorded for Embedded Systems Lab",
    body: "Your attendance for the ECS Lab Session (Lab 304, 10:15 AM) has been marked as Present.",
    time: "2 days ago",
    category: "Attendance",
    icon: CalendarCheck,
    iconColor: "#0891b2",
    iconBg: "#ecfeff",
    unread: false,
    actionLabel: "View Attendance",
    actionUrl: "/student/attendance",
  },
  {
    id: 6,
    title: "System Update: New Python Code Sandbox",
    body: "The compiler runner has been updated with Python 3.12, NumPy, and Pydantic v2 support. Submissions run 40% faster.",
    time: "3 days ago",
    category: "System",
    icon: Info,
    iconColor: "#64748b",
    iconBg: "#f1f5f9",
    unread: false,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    // Fetch live broadcast announcements from admin
    apiFetch("/admin/broadcast")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const broadcastMapped = res.data.map((b) => ({
            id: `broadcast-${b.id}`,
            title: `[Notice] ${b.title}`,
            body: b.message,
            time: b.created_at ? new Date(b.created_at).toLocaleString() : "Recently",
            category: "Broadcast",
            icon: Bell,
            iconColor: "#7c3aed",
            iconBg: "#f5f3ff",
            unread: true,
          }));
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newNotifs = broadcastMapped.filter((n) => !existingIds.has(n.id));
            return [...newNotifs, ...prev];
          });
        }
      })
      .catch((err) => console.error("BROADCAST FETCH ERROR:", err));
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const deleteNotif = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const markSingleRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const categories = ["All", "Unread", "Milestones", "Weekly Reports", "AI Interview", "Practice", "Attendance", "System"];

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "Unread") return n.unread;
    if (filter === "All") return true;
    return n.category === filter;
  });

  return (
    <div className="student-page-inner notif-page-container">
      <SectionHeader
        eyebrow="Activity Log & Alerts"
        title="Notifications"
        description="Stay updated with milestone progression, mentor scorecard dossiers, mock interview drill alerts, and system announcements."
        action={
          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllRead}>
                <CheckCheck size={16} /> Mark all read
              </button>
            )}
          </div>
        }
      />

      {/* Filter Tabs Pills */}
      <div className="notif-filter-pills-bar">
        {categories.map((c) => {
          const count = c === "Unread" ? unreadCount : notifications.filter((n) => n.category === c).length;
          return (
            <button
              key={c}
              className={`notif-filter-pill ${filter === c ? "notif-filter-pill--active" : ""}`}
              onClick={() => setFilter(c)}
            >
              <span>{c}</span>
              {c === "Unread" && unreadCount > 0 && (
                <span className="notif-pill-counter notif-pill-counter--unread">{unreadCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List Card */}
      <div className="notif-list-container">
        {filteredNotifs.length === 0 ? (
          <div className="notif-empty-state">
            <div className="notif-empty-icon-wrap">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="notif-empty-title">All Caught Up!</h3>
            <p className="notif-empty-desc">
              There are no {filter !== "All" ? `"${filter}"` : ""} notifications pending your review.
            </p>
          </div>
        ) : (
          <div className="notif-items-stack">
            {filteredNotifs.map((item) => {
              const Icon = item.icon || Bell;
              return (
                <div
                  key={item.id}
                  className={`notif-card-item ${item.unread ? "notif-card-item--unread" : ""}`}
                  onClick={() => item.unread && markSingleRead(item.id)}
                >
                  <div
                    className="notif-item-icon-box"
                    style={{ background: item.iconBg, color: item.iconColor }}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="notif-item-content">
                    <div className="notif-item-top-row">
                      <div className="notif-item-title-group">
                        <h4 className="notif-item-title">{item.title}</h4>
                        {item.unread && <span className="notif-unread-dot" title="Unread" />}
                      </div>
                      <span className="notif-item-time">{item.time}</span>
                    </div>

                    <p className="notif-item-body">{item.body}</p>

                    <div className="notif-item-bottom-row">
                      <Badge variant="outline" className="notif-category-chip">
                        {item.category}
                      </Badge>

                      <div className="notif-item-actions-group">
                        {item.actionLabel && item.actionUrl && (
                          <Link
                            to={item.actionUrl}
                            className="notif-action-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{item.actionLabel}</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}

                        <button
                          type="button"
                          className="notif-dismiss-btn"
                          title="Delete notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotif(item.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
