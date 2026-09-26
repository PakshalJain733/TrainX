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
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import { getSharedBroadcasts, EVENTS } from "../../../utils/sharedStore";
import "../Styles/ST_Notifications.css";

const defaultNotifications = [];

export default function Notifications() {
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const loadBroadcasts = async () => {
      const shared = await getSharedBroadcasts([]);
      const sharedMapped = shared.map((s) => ({
        id: `shared-${s.id}`,
        title: `📢 [Broadcast] ${s.title}`,
        body: s.data?.message || s.description || '',
        time: s.created_at ? new Date(s.created_at).toLocaleString() : "Today",
        category: "Broadcast",
        icon: Bell,
        iconColor: "#7c3aed",
        iconBg: "#f5f3ff",
        unread: true,
      }));

      try {
        const res = await apiFetch("/student/notifications");
        let broadcastMapped = [];
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          broadcastMapped = res.data.map((b) => ({
            id: `broadcast-${b.id}`,
            title: `📢 [Notice] ${b.title}`,
            body: b.message,
            target: b.target || 'All Batches',
            priority: b.priority || 'General Announcement',
            created_by_name: b.created_by_name || 'Admin',
            time: b.created_at ? new Date(b.created_at).toLocaleString() : "Recently",
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
      <div className="student-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="student-header-title">
          <span>Notifications</span>
          </h2>
          <p className="student-header-desc">Stay updated with milestone progression, mentor scorecard dossiers, mock interview drill alerts, and system announcements.</p>
        </div>
        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button className="notif-mark-all-btn" onClick={markAllRead}>
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

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
                      {item.target && (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                          🎯 For: {item.target}
                        </span>
                      )}
                      {item.created_by_name && (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', background: '#f3e8ff', padding: '2px 8px', borderRadius: '6px' }}>
                          👤 By: {item.created_by_name}
                        </span>
                      )}

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
