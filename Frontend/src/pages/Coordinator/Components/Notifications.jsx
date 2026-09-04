import { useState } from "react";
import { Bell, Send, CheckCircle } from "lucide-react";
import "../Styles/Notifications.css";

export default function CoordinatorNotifications() {
  const [logs, setLogs] = useState([
    { id: 1, title: "Broadcast: IA-2 Quiz Rescheduled to Friday 10 AM", target: "CSE 2026 Alpha Cohort", time: "2 hours ago" },
    { id: 2, title: "Alert: Attendance Warning Sent to 6 High-Risk Students", target: "Data Science & ML 2025", time: "Yesterday" },
    { id: 3, title: "Notification: Goldman Sachs Placement Drive Link Live", target: "All CSE & IT Batches", time: "2 days ago" },
  ]);

  const [text, setText] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLogs([
      { id: Date.now(), title: `Broadcast: ${text}`, target: "All Department Batches", time: "Just now" },
      ...logs,
    ]);
    setText("");
  };

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Broadcast Notifications & Announcement Center</h1>
          <p className="coord-page-sub">
            Send real-time alerts to department students & mentors and view past broadcast logs.
          </p>
        </div>
      </div>

      <div className="coord-card coord-card--mb">
        <div className="coord-card-title">
          <Send size={18} color="#4f46e5" />
          Send Real-time Broadcast
        </div>

        <form onSubmit={handleSend} className="coord-broadcast-form">
          <textarea
            rows={3}
            required
            placeholder="Type your notice or notification message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="coord-broadcast-textarea"
          />

          <div className="coord-broadcast-actions">
            <button type="submit" className="coord-btn coord-btn--primary">
              <Send size={14} /> Send Broadcast Now
            </button>
          </div>
        </form>
      </div>

      <div className="coord-card">
        <div className="coord-card-title">
          <Bell size={18} color="#4f46e5" />
          Broadcast History & Activity Log
        </div>

        <div className="coord-notif-list">
          {logs.map((item) => (
            <div key={item.id} className="coord-notif-item">
              <div>
                <div className="coord-notif-title">{item.title}</div>
                <div className="coord-notif-sub">
                  Audience: <strong>{item.target}</strong>
                </div>
              </div>
              <span className="coord-notif-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
