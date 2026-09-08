import React from 'react';
import { Bell } from 'lucide-react';
import '../Styles/Notifications.css';

export default function Notifications() {
  const alerts = [
    { id: 1, title: "12 New Assignment Submissions", body: "Students from CSE 2026 Alpha submitted Graph Algorithms assignment.", time: "10 mins ago", unread: true },
    { id: 2, title: "Upcoming Live Session Reminder", body: "PyTorch & Neural Networks live class starts at 02:00 PM today.", time: "1 hour ago", unread: true },
    { id: 3, title: "Weekly Governance Report Approved", body: "Super Admin approved your Week 34 progress log.", time: "1 day ago", unread: false },
  ];

  return (
    <div className="mentor-notifications-container">
      <div className="mentor-page-header">
        <h2 className="mentor-page-title">
          <Bell size={20} color="#4f46e5" />
          <span>Notifications & Activity Stream</span>
        </h2>
      </div>

      <div className="mentor-notifications-card">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`mentor-notif-item ${
              a.unread ? 'mentor-notif-item--unread' : 'mentor-notif-item--read'
            }`}
          >
            <div className="mentor-notif-top">
              <h3 className="mentor-notif-title">{a.title}</h3>
              <span className="mentor-notif-time">{a.time}</span>
            </div>
            <p className="mentor-notif-body">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
