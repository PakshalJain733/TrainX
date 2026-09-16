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
import { apiFetch } from "../../../utils/api";
import { getSharedBroadcasts, EVENTS } from "../../../utils/sharedStore";
import "../Styles/CO_Notifications.css";

const defaultNotifications = [
  {
    id: "notif-1",
    title: "📢 [Notice] IA-2 Quiz Rescheduled to Friday 10:00 AM",
    body: "The Internal Assessment 2 test for TE Computer batches has been shifted to Friday 10:00 AM. Please revise your modules.",
    time: new Date().toLocaleString(),
    category: "Broadcast",
    icon: Bell,
    iconColor: "#7c3aed",
    iconBg: "#f5f3ff",
    unread: true,
  },
  {
    id: "notif-2",
    title: "📢 [Notice] Goldman Sachs Placement Drive Registration Live",
    body: "Eligible students with CGPA > 8.0 can apply for Goldman Sachs campus drive through the placement tab.",
    time: new Date().toLocaleString(),
    category: "Broadcast",
    icon: Bell,
    iconColor: "#7c3aed",
    iconBg: "#f5f3ff",
    unread: true,
  }
];

export default function CoordinatorNotifications() {
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const loadBroadcasts = async () => {
      const shared = await getSharedBroadcasts([]);
      const sharedMapped = shared.map((s) => ({
        id: `shared-${s.id}`,
        title: `📢 [Notice] ${s.title}`,
        body: s.data?.message || s.description || '',
        time: s.created_at ? new Date(s.created_at).toLocaleString() : new Date().toLocaleString(),
        category: "Broadcast",
        icon: Bell,
        iconColor: "#7c3aed",
        iconBg: "#f5f3ff",
        unread: true,
      }));

      try {
        const res = await apiFetch("/coordinator/notifications");
        let broadcastMapped = [];
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          broadcastMapped = res.data.map((b) => ({
            id: `broadcast-${b.id}`,
            title: `📢 [Notice] ${b.title}`,
            body: b.message,
            time: b.created_at ? new Date(b.created_at).toLocaleString() : new Date().toLocaleString(),
            category: "Broadcast",
            icon: Bell,
            iconColor: "#7c3aed",
            iconBg: "#f5f3ff",
            unread: true,
          }));
        }
        setNotifications((prev) => {
          const allItems = [...sharedMapped, ...broadcastMapped];
          const existingIds = new Set(prev.map((p) => p.id));
          const newNotifs = allItems.filter((n) => !existingIds.has(n.id));
          return [...newNotifs, ...prev];
        });
      } catch {
        if (sharedMapped.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newNotifs = sharedMapped.filter((n) => !existingIds.has(n.id));
            return [...newNotifs, ...prev];
          });
        }
      }
    };

    loadBroadcasts();

    const handleNewBroadcast = () => loadBroadcasts();
    window.addEventListener("new_broadcast_notification", handleNewBroadcast);
    window.addEventListener(EVENTS.BROADCAST_UPDATED, handleNewBroadcast);
    return () => {
      window.removeEventListener("new_broadcast_notification", handleNewBroadcast);
      window.removeEventListener(EVENTS.BROADCAST_UPDATED, handleNewBroadcast);
    };
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: '#6366f1', textTransform: 'uppercase' }}>
            ACTIVITY LOG & ALERTS
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>
            Notifications
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Stay updated with milestone progression, mentor scorecard dossiers, mock interview drill alerts, and system announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '2rem',
              color: '#1e293b',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <CheckCheck size={16} color="#2563eb" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs Pills */}
      <div className="notif-filter-pills-bar">
        {categories.map((c) => {
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
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '1rem',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid #e2e8f0'
                      }}>
                        {item.category}
                      </span>

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

