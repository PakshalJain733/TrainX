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
import "../Styles/MN_Notifications.css"
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

export default function MentorNotifications() {
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
        const res = await apiFetch("/mentor/notifications");
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
    <div className="mn-notif-container">
      <div className="mn-notif-header-top">
        <div>
          <span className="mn-notif-header-tagline">
            MENTOR ACTIVITY LOG & ALERTS
          </span>
          <h2 className="mn-notif-header-title">
            Mentor Notifications
          </h2>
          <p className="mn-notif-header-subtitle">
            Stay updated with batch progress, evaluation requests, student submissions, and institutional announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="mn-notif-mark-all-btn"
          >
            <CheckCheck size={16} color="#4f46e5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs Pills */}
      <div className="mn-notif-filter-pills-bar">
        {categories.map((c) => {
          return (
            <button
              key={c}
              className={`mn-notif-filter-pill ${filter === c ? "mn-notif-filter-pill--active" : ""}`}
              onClick={() => setFilter(c)}
            >
              <span>{c}</span>
              {c === "Unread" && unreadCount > 0 && (
                <span className="mn-notif-pill-counter mn-notif-pill-counter--unread">{unreadCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List Card */}
      <div className="mn-notif-list-container">
        {filteredNotifs.length === 0 ? (
          <div className="mn-notif-empty-state">
            <div className="mn-notif-empty-icon-wrap">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="mn-notif-empty-title">All Caught Up!</h3>
            <p className="mn-notif-empty-desc">
              There are no {filter !== "All" ? `"${filter}"` : ""} notifications pending your review.
            </p>
          </div>
        ) : (
          <div className="mn-notif-items-stack">
            {filteredNotifs.map((item) => {
              const Icon = item.icon || Bell;
              return (
                <div
                  key={item.id}
                  className={`mn-notif-card-item ${item.unread ? "mn-notif-card-item--unread" : ""}`}
                  onClick={() => item.unread && markSingleRead(item.id)}
                >
                  <div
                    className="mn-notif-item-icon-box"
                    style={{ background: item.iconBg, color: item.iconColor }}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="mn-notif-item-content">
                    <div className="mn-notif-item-top-row">
                      <div className="mn-notif-item-title-group">
                        <h4 className="mn-notif-item-title">{item.title}</h4>
                        {item.unread && <span className="mn-notif-unread-dot" title="Unread" />}
                      </div>
                      <span className="mn-notif-item-time">{item.time}</span>
                    </div>

                    <p className="mn-notif-item-body">{item.body}</p>

                    <div className="mn-notif-item-bottom-row">
                      <span className="mn-notif-category-tag">
                        {item.category}
                      </span>

                      <div className="mn-notif-item-actions-group">
                        {item.actionLabel && item.actionUrl && (
                          <Link
                            to={item.actionUrl}
                            className="mn-notif-action-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{item.actionLabel}</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}

                        <button
                          type="button"
                          className="mn-notif-dismiss-btn"
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

