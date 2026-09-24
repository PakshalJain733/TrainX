import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Megaphone, X, Bell, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./BroadcastToast.css";

export default function BroadcastToast() {
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNewBroadcast = (event) => {
      if (event && event.detail) {
        setToast(event.detail);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === "app_broadcast_notifications" && e.newValue) {
        try {
          const list = JSON.parse(e.newValue);
          if (list.length > 0) {
            setToast(list[0]);
          }
        } catch (err) {}
      }
    };

    window.addEventListener("new_broadcast_notification", handleNewBroadcast);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("new_broadcast_notification", handleNewBroadcast);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  const handleToastClick = () => {
    setToast(null);
    const userRole = sessionStorage.getItem("role") || "student";
    if (userRole === "student") {
      navigate("/student/notifications");
    } else if (userRole === "coordinator") {
      navigate("/coordinator/notifications");
    } else if (userRole === "admin") {
      navigate("/admin/broadcast");
    }
  };

  return createPortal(
    <div className="broadcast-toast-container" role="alert" aria-live="assertive">
      <div className="broadcast-toast-card">
        <div className="broadcast-toast-header">
          <div className="broadcast-toast-badge">
            <Megaphone size={14} className="broadcast-toast-icon" />
            <span>New Broadcast Notice</span>
          </div>
          <button 
            className="broadcast-toast-close"
            onClick={(e) => {
              e.stopPropagation();
              setToast(null);
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <div className="broadcast-toast-body" onClick={handleToastClick}>
          <h4 className="broadcast-toast-title">{toast.title || "Announcement Alert"}</h4>
          <p className="broadcast-toast-desc">
            {toast.desc || toast.body || toast.message}
          </p>

          <div className="broadcast-toast-footer">
            {toast.priority && (
              <span className="broadcast-priority-tag">{toast.priority}</span>
            )}
            <span className="broadcast-view-link">
              View Notice <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
