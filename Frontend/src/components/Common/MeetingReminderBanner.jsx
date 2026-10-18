import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock, Video, X } from "lucide-react";
import { apiFetch } from "../../utils/api";
import "./MeetingReminderBanner.css";

export default function MeetingReminderBanner() {
  const [activeUpcomingMeeting, setActiveUpcomingMeeting] = useState(null);
  const [timeLeftString, setTimeLeftString] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkUpcomingMeetings = async () => {
      const userRaw = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (!userRaw) return;

      let user;
      try {
        user = JSON.parse(userRaw);
      } catch (_) {
        return;
      }

      const role = (user.role || "").toLowerCase();
      let sessions = [];

      try {
        if (role.includes("mentor") || role.includes("faculty")) {
          const res = await apiFetch("/mentor/live-sessions");
          sessions = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        } else if (role.includes("student")) {
          const res = await apiFetch("/student/notifications");
          const notifs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          sessions = notifs
            .filter((n) => {
              const text = (n.title || "") + " " + (n.message || n.desc || "");
              return text.toLowerCase().includes("meet") || text.toLowerCase().includes("scheduled");
            })
            .map((n) => {
              // Extract date, time, and meet link from message
              const text = (n.message || n.desc || "");
              const linkMatch = text.match(/https?:\/\/[^\s)]+/);
              const timeMatch = (n.title || text).match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
              const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
              return {
                id: n.id,
                title: n.title,
                meeting_link: linkMatch ? linkMatch[0] : "https://meet.google.com/new",
                date: dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10),
                time: timeMatch ? timeMatch[1] : "08:00 PM",
              };
            });
        }
      } catch (_) {
        return;
      }

      if (!sessions || sessions.length === 0) {
        setActiveUpcomingMeeting(null);
        return;
      }

      // Check if any session is today and approaching (within 15 minutes before or 30 minutes after)
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      for (const s of sessions) {
        if (!s.time || s.time.toLowerCase().includes("immediate") || s.time.toLowerCase().includes("now")) {
          continue;
        }

        const sessDate = s.date ? String(s.date).slice(0, 10) : todayStr;
        if (sessDate !== todayStr) continue;

        // Parse session time (e.g. 08:00 PM)
        const match = s.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) continue;

        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const ampm = match[3] ? match[3].toUpperCase() : null;
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;

        const scheduledTime = new Date();
        scheduledTime.setHours(h, m, 0, 0);

        const diffMs = scheduledTime.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);

        // Active if 15 minutes before start time until 45 minutes after start time
        if (diffMins <= 15 && diffMins >= -45) {
          setActiveUpcomingMeeting({
            ...s,
            diffMins,
            scheduledTime,
          });

          if (diffMins > 0) {
            setTimeLeftString(`Starts in ${diffMins} min${diffMins > 1 ? "s" : ""}`);
          } else {
            setTimeLeftString("Live Now!");
          }
          return;
        }
      }

      setActiveUpcomingMeeting(null);
    };

    checkUpcomingMeetings();
    const interval = setInterval(checkUpcomingMeetings, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  if (!activeUpcomingMeeting || dismissed) return null;

  const joinLink = activeUpcomingMeeting.meeting_link || activeUpcomingMeeting.meetingLink || "https://meet.google.com/new";

  return createPortal(
    <div className="meeting-reminder-dock">
      <div className="meeting-reminder-card">
        <div className="meeting-reminder-left">
          <div className="meeting-reminder-pulse">
            <span className="reminder-ping" />
            <Clock size={18} className="reminder-clock-icon" />
          </div>
          <div>
            <div className="meeting-reminder-header-row">
              <span className="meeting-reminder-badge">{timeLeftString}</span>
              <span className="meeting-reminder-time">{activeUpcomingMeeting.time}</span>
            </div>
            <div className="meeting-reminder-title">
              {activeUpcomingMeeting.title || "Scheduled Mentorship Call"}
            </div>
          </div>
        </div>

        <div className="meeting-reminder-right">
          <a
            href={joinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="meeting-reminder-join-btn"
          >
            <Video size={14} />
            <span>Join Meeting</span>
          </a>
          <button
            className="meeting-reminder-close"
            onClick={() => setDismissed(true)}
            title="Dismiss reminder"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
