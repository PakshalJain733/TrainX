import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Bell, Calendar, FileText, CheckCircle2,
  AlertTriangle, Trash2, Check, ExternalLink, Clock, User, Video, Copy
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
    if (titleLower.includes("meeting") || titleLower.includes("call") || t === "video" || t === "meeting") {
      return (
        <div className="notif-modal-icon-box notif-icon-emerald">
          <Video size={22} />
        </div>
      );
    }
    return (
      <div className="notif-modal-icon-box notif-icon-amber">
        <AlertTriangle size={22} />
      </div>
    );
  };

  const [copiedCode, setCopiedCode] = useState(false);
  const titleLower = (notification.title || "").toLowerCase();
  const isSupportTicket = titleLower.includes("ticket") || titleLower.includes("support");

  const fullText = `${notification.title || ''} ${notification.message || ''} ${notification.desc || ''}`;
  const meetUrlMatch = fullText.match(/https?:\/\/[^\s)]+/);
  let extractedMeetUrl = meetUrlMatch ? meetUrlMatch[0] : null;
  if (!extractedMeetUrl && notification.actionUrl && notification.actionUrl.startsWith("http")) {
    extractedMeetUrl = notification.actionUrl;
  }

  let meetCode = null;
  const explicitCodeMatch = fullText.match(/Meeting Code:\s*([a-zA-Z0-9-]+)/i);
  if (explicitCodeMatch) {
    meetCode = explicitCodeMatch[1].trim();
  } else if (extractedMeetUrl && extractedMeetUrl.includes("meet.google.com/")) {
    const rawCode = extractedMeetUrl.split("meet.google.com/")[1]?.split(/[?#\s]/)[0];
    if (rawCode && rawCode !== "new" && rawCode.length >= 3) {
      meetCode = rawCode;
    }
  }

  return createPortal(
    <div className="notif-modal-overlay" onClick={onClose}>
      <div className="notif-modal-card" role="dialog" aria-modal="true" aria-labelledby="notif-modal-heading" onClick={(e) => e.stopPropagation()}>
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
              <h3 id="notif-modal-heading" className="notif-modal-title">{notification.title}</h3>
            </div>
          </div>
          <button className="notif-modal-close-btn" onClick={onClose} title="Close" aria-label="Close notification dialog">
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

          {extractedMeetUrl && (
            <div className="notif-meet-highlight-box">
              <div className="notif-meet-top-row">
                <div className="notif-meet-label-group">
                  <Video size={18} color="#16a34a" />
                  <span className="notif-meet-label">Google Meet Video Room</span>
                </div>
                {meetCode && (
                  <div className="notif-meet-code-chip">
                    <span>Code: {meetCode}</span>
                    <button
                      type="button"
                      className="notif-meet-copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(meetCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      title="Copy meeting code"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>

              <div className="notif-meet-link-row">
                <span className="notif-meet-url-text">{extractedMeetUrl}</span>
                <a
                  href={extractedMeetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="notif-meet-join-btn"
                >
                  <Video size={14} /> Join Meeting Now →
                </a>
              </div>
            </div>
          )}

          <div className="notif-modal-message-box">
            <h4 className="notif-message-heading">Notification Message</h4>
            <p className="notif-message-text" style={{ whiteSpace: 'pre-line' }}>
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
            {notification.actionUrl && onNavigate && (
              <button
                className="notif-modal-btn notif-modal-btn-primary"
                onClick={() => {
                  if (notification.unread && onMarkRead) onMarkRead(notification.id);
                  onClose();
                  onNavigate(notification.actionUrl);
                }}
                style={{
                  background: notification.actionColor || '#2563eb',
                  borderColor: notification.actionColor || '#2563eb',
                  color: '#ffffff'
                }}
              >
                <ExternalLink size={14} /> {notification.actionLabel || 'Review & Take Action'}
              </button>
            )}
            {isSupportTicket && !notification.actionUrl && onNavigate && (
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
