import React from "react";
import { createPortal } from "react-dom";
import {
  X, Bell, Calendar, FileText, CheckCircle2,
  AlertTriangle, Trash2, Check, ExternalLink, Clock, User
} from "lucide-react";
import "./NotificationDetailModal.css";

export default function NotificationDetailModal({
  notification,
  onClose,
  onMarkRead,
  onDelete,
  onNavigate
}) {
  if (!notification) return null;

  const getIcon = (type, title = "") => {
    const t = (type || "").toLowerCase();
    const titleLower = title.toLowerCase();

    if (titleLower.includes("placement") || titleLower.includes("drive") || t === "calendar") {
      return (
        <div className="notif-modal-icon-box notif-icon-rose">
          <Calendar size={22} />
        </div>
      );
    }
    if (titleLower.includes("quiz") || titleLower.includes("test") || t === "quiz" || t === "document") {
      return (
        <div className="notif-modal-icon-box notif-icon-blue">
          <FileText size={22} />
        </div>
      );
    }
    if (t === "success" || titleLower.includes("success") || titleLower.includes("completed")) {
      return (
        <div className="notif-modal-icon-box notif-icon-emerald">
          <CheckCircle2 size={22} />
        </div>
      );
    }
    return (
      <div className="notif-modal-icon-box notif-icon-amber">
        <AlertTriangle size={22} />
      </div>
    );
  };

  const titleLower = (notification.title || "").toLowerCase();
  const isSupportTicket = titleLower.includes("ticket") || titleLower.includes("support");

  return createPortal(
    <div className="notif-modal-overlay" onClick={onClose}>
      <div className="notif-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notif-modal-header">
          <div className="notif-modal-header-left">
            {getIcon(notification.type, notification.title)}
            <div className="notif-modal-title-area">
              <div className="notif-modal-badge-row">
                {notification.unread ? (
                  <span className="notif-modal-badge unread">Unread</span>
                ) : (
                  <span className="notif-modal-badge read">Read</span>
                )}
                {notification.priority && (
                  <span className="notif-modal-pill priority">⚡ {notification.priority}</span>
                )}
                {notification.target && (
                  <span className="notif-modal-pill target">🎯 {notification.target}</span>
                )}
              </div>
              <h3 className="notif-modal-title">{notification.title}</h3>
            </div>
          </div>
          <button className="notif-modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="notif-modal-body">
          <div className="notif-modal-meta-bar">
            <div className="notif-meta-item">
              <Clock size={13} />
              <span>Received: {notification.time}</span>
            </div>
            {notification.created_by_name && (
              <div className="notif-meta-item">
                <User size={13} />
                <span>Source: {notification.created_by_name}</span>
              </div>
            )}
          </div>

          <div className="notif-modal-message-box">
            <h4 className="notif-message-heading">Notification Message</h4>
            <p className="notif-message-text">
              {notification.message || notification.desc || "No additional detailed message provided for this alert."}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="notif-modal-footer">
          <div className="notif-modal-footer-left">
            <button
              className="notif-modal-btn notif-modal-btn-secondary"
              onClick={() => {
                if (onMarkRead) onMarkRead(notification.id);
              }}
            >
              <Check size={14} /> {notification.unread ? "Mark as Read" : "Mark as Unread"}
            </button>

            <button
              className="notif-modal-btn notif-modal-btn-danger"
              onClick={() => {
                if (onDelete) onDelete(notification.id);
                onClose();
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>

          <div className="notif-modal-footer-right">
            {isSupportTicket && onNavigate && (
              <button
                className="notif-modal-btn notif-modal-btn-primary"
                onClick={() => {
                  onClose();
                  onNavigate('/admin/help');
                }}
              >
                <ExternalLink size={14} /> View Tickets
              </button>
            )}
            <button className="notif-modal-btn notif-modal-btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
