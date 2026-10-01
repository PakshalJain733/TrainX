import React, { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle, AlertCircle, Laptop } from "lucide-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  isNotificationSupported,
} from "../../utils/browserNotification";
import "./DesktopNotificationToggle.css";

export default function DesktopNotificationToggle({ compact = false }) {
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  if (!isNotificationSupported()) return null;

  const handleEnableClick = async () => {
    setLoading(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setLoading(false);
  };

  const handleTestClick = () => {
    sendBrowserNotification("TrainX Laptop Notification Test 🎯", {
      body: "Laptop desktop notifications are working perfectly! You will receive live alerts for all upcoming broadcasts.",
    });
  };

  if (compact) {
    if (permission === "granted") {
      return (
        <button
          type="button"
          onClick={handleTestClick}
          className="desktop-notif-compact-btn granted"
          title="Laptop Notifications Enabled - Click to test"
        >
          <Bell size={14} />
          <span>Laptop Notifs Active</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={handleEnableClick}
        disabled={loading || permission === "denied"}
        className={`desktop-notif-compact-btn ${permission === "denied" ? "denied" : "prompt"}`}
        title={permission === "denied" ? "Notifications blocked in browser settings" : "Enable laptop desktop notifications"}
      >
        {permission === "denied" ? <BellOff size={14} /> : <Bell size={14} />}
        <span>{loading ? "Enabling..." : permission === "denied" ? "Notifs Blocked" : "Enable Laptop Notifs"}</span>
      </button>
    );
  }

  return (
    <div className={`desktop-notif-card ${permission}`}>
      <div className="desktop-notif-header">
        <div className="desktop-notif-icon">
          <Laptop size={20} />
        </div>
        <div className="desktop-notif-info">
          <div className="desktop-notif-title-row">
            <h4>Laptop Desktop Notifications</h4>
            {permission === "granted" && (
              <span className="notif-status-badge granted">
                <CheckCircle size={12} /> Active
              </span>
            )}
            {permission === "denied" && (
              <span className="notif-status-badge denied">
                <AlertCircle size={12} /> Blocked
              </span>
            )}
          </div>
          <p className="desktop-notif-desc">
            {permission === "granted"
              ? "Instant browser popups will appear on your laptop screen for new announcements and updates."
              : permission === "denied"
              ? "Notifications are blocked by browser settings. Please allow notifications for this website in your browser bar."
              : "Receive native popups on your laptop screen as soon as announcements or broadcasts are published."}
          </p>
        </div>
      </div>

      <div className="desktop-notif-actions">
        {permission === "granted" ? (
          <button type="button" onClick={handleTestClick} className="btn-desktop-notif-test">
            <Bell size={14} /> Send Test Popup to Laptop
          </button>
        ) : permission === "denied" ? (
          <div className="notif-denied-guide">
            Click browser lock icon in URL bar &gt; Site settings &gt; Allow Notifications
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEnableClick}
            disabled={loading}
            className="btn-desktop-notif-enable"
          >
            <Bell size={15} /> {loading ? "Requesting..." : "Enable Laptop Popups"}
          </button>
        )}
      </div>
    </div>
  );
}
