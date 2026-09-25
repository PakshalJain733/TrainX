import React, { useState } from "react";
import { 
  Bell, X, Search, Check, Trash2, Calendar, 
  AlertTriangle, CheckCircle2, FileText, Filter 
} from "lucide-react";
import "./FullNotificationModal.css";

export default function FullNotificationModal({ isOpen, onClose, notifications = [], setNotifications }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;
  const totalCount = notifications.length;

  const handleMarkAllRead = () => {
    if (setNotifications) {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    }
  };

  const handleClearAll = () => {
    if (setNotifications) {
      setNotifications([]);
    }
  };

  const handleDeleteItem = (id) => {
    if (setNotifications) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const toggleSingleRead = (id) => {
    if (setNotifications) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
      );
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "calendar":
        return <Calendar size={18} />;
      case "alert":
        return <AlertTriangle size={18} />;
      case "success":
        return <CheckCircle2 size={18} />;
      case "document":
        return <FileText size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = 
      (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.desc || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === "unread") return n.unread;
    if (activeTab === "alert") return n.type === "alert";
    if (activeTab === "calendar") return n.type === "calendar";
    if (activeTab === "document") return n.type === "document";
    return true;
  });

  return (
    <div className="full-notif-overlay" onClick={onClose}>
      <div className="full-notif-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="full-notif-header">
          <div className="full-notif-header-left">
            <div className="full-notif-icon-badge">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="full-notif-title">All Notifications & Alerts</h3>
              <p className="full-notif-subtitle">
                {totalCount} total notifications • {unreadCount} unread alerts
              </p>
            </div>
          </div>

          <div className="full-notif-header-actions">
            <button 
              className="full-notif-btn" 
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              style={{ opacity: unreadCount === 0 ? 0.5 : 1 }}
            >
              <Check size={14} /> Mark all read
            </button>
            <button 
              className="full-notif-btn full-notif-btn-danger" 
              onClick={handleClearAll}
              disabled={totalCount === 0}
              style={{ opacity: totalCount === 0 ? 0.5 : 1 }}
            >
              <Trash2 size={14} /> Clear all
            </button>
            <button className="full-notif-close-btn" onClick={onClose} title="Close view">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="full-notif-controls">
          <div className="full-notif-search">
            <Search size={15} className="full-notif-search-icon" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="full-notif-tabs">
            <button 
              className={`full-notif-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({totalCount})
            </button>
            <button 
              className={`full-notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button 
              className={`full-notif-tab ${activeTab === 'alert' ? 'active' : ''}`}
              onClick={() => setActiveTab('alert')}
            >
              Alerts
            </button>
            <button 
              className={`full-notif-tab ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              Events
            </button>
            <button 
              className={`full-notif-tab ${activeTab === 'document' ? 'active' : ''}`}
              onClick={() => setActiveTab('document')}
            >
              Reports
            </button>
          </div>
        </div>

        {/* Notifications Body */}
        <div className="full-notif-body">
          {filteredNotifications.length === 0 ? (
            <div className="full-notif-empty">
              <Bell className="full-notif-empty-icon" />
              <div className="full-notif-empty-title">No notifications found</div>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                There are no notifications matching your search or active filter.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div 
                key={n.id} 
                className={`full-notif-card ${n.unread ? 'unread' : ''}`}
              >
                <div className={`full-notif-card-icon type-${n.type || 'alert'}`}>
                  {getIcon(n.type)}
                </div>

                <div className="full-notif-card-content">
                  <div className="full-notif-card-header">
                    <div className="full-notif-card-title">
                      {n.title}
                      {n.unread && <span className="full-notif-unread-dot" />}
                    </div>
                    <span className="full-notif-card-time">{n.time}</span>
                  </div>

                  <div className="full-notif-card-desc">
                    {n.desc || n.message || "No detailed description provided."}
                  </div>

                  <div className="full-notif-card-actions">
                    <button 
                      className="full-notif-action-btn"
                      onClick={() => toggleSingleRead(n.id)}
                    >
                      {n.unread ? "Mark as read" : "Mark as unread"}
                    </button>
                    <button 
                      className="full-notif-action-btn"
                      onClick={() => handleDeleteItem(n.id)}
                      style={{ color: '#ef4444' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
