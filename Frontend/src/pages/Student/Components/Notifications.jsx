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


export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    // Load local storage broadcast notifications
    try {
      const stored = JSON.parse(localStorage.getItem("app_broadcast_notifications") || "[]");
      if (stored.length > 0) {
        const storedMapped = stored.map((s) => ({
          id: s.id,
          title: s.title,
          body: s.desc || s.body,
          time: s.time || "Recently",
          category: "Broadcast",
          icon: Bell,
          iconColor: "#7c3aed",
          iconBg: "#f5f3ff",
          unread: s.unread !== undefined ? s.unread : true,
        }));
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newNotifs = storedMapped.filter((n) => !existingIds.has(n.id));
          return [...newNotifs, ...prev];
        });
      }
    } catch (e) {}

    // Fetch live broadcast announcements from the student notifications endpoint
    apiFetch("/student/notifications")
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const broadcastMapped = res.data.map((b) => ({
            id: `broadcast-${b.id}`,
            title: `[Notice] ${b.title}`,
            body: b.message,
            time: b.time || (b.created_at ? new Date(b.created_at).toLocaleString() : "Recently"),
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

    const handleNewBroadcast = (e) => {
      if (e.detail) {
        const newNotifItem = {
          id: e.detail.id,
          title: e.detail.title,
          body: e.detail.desc || e.detail.body,
          time: "Just now",
          category: "Broadcast",
          icon: Bell,
          iconColor: "#7c3aed",
          iconBg: "#f5f3ff",
          unread: true,
        };
        setNotifications((prev) => [newNotifItem, ...prev.filter((p) => p.id !== e.detail.id)]);
      }
    };

    window.addEventListener("new_broadcast_notification", handleNewBroadcast);
    return () => window.removeEventListener("new_broadcast_notification", handleNewBroadcast);
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

  const categories = ["All", "Unread", "Broadcast", "Important"];

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "Unread") return n.unread;
    if (filter === "Broadcast") return n.category === "Broadcast" || (n.title && n.title.includes("Broadcast")) || (n.title && n.title.includes("[Notice]"));
    if (filter === "Important") return n.unread || n.category === "Broadcast" || n.type === "alert" || n.priority === "Urgent Notice";
    return true;
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
