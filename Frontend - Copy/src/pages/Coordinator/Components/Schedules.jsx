import { useState } from "react";
import { Plus, Video, Calendar, UserCheck, Users, ExternalLink } from "lucide-react";
import { coordinatorSchedules, coordinatorBatches, coordinatorMentors } from "../../../data/coordinatorMockData";
import "../Styles/Schedules.css";

export default function CoordinatorSchedules() {
  const [schedules, setSchedules] = useState(coordinatorSchedules);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState(coordinatorBatches[0].name);
  const [trainer, setTrainer] = useState(coordinatorMentors[0].name);
  const [time, setTime] = useState("");
  const [meetLink, setMeetLink] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSession = {
      id: Date.now(),
      title,
      batch,
      trainer,
      time: time || "Tomorrow, 10:00 AM - 12:00 PM",
      room: "Online Meet",
      meetLink: meetLink || "https://meet.google.com/new-session",
      status: "Scheduled",
      attendees: 100,
    };

    setSchedules([newSession, ...schedules]);
    setShowModal(false);
    setTitle("");
    setTime("");
    setMeetLink("");
  };

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Live Training Schedules & Timetable</h1>
          <p className="coord-page-sub">
            Schedule live interactive classes, launch Google Meet sessions, and track class attendance.
          </p>
        </div>
        <button className="coord-btn coord-btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Schedule Live Class
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {schedules.map((s) => (
          <div key={s.id} className="coord-schedule-card">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>{s.title}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: s.status === "Live Now" ? "#ef4444" : "#eff6ff",
                    color: s.status === "Live Now" ? "#ffffff" : "#1d4ed8",
                  }}
                >
                  {s.status}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "flex", gap: "14px" }}>
                <span>Batch: <strong>{s.batch}</strong></span>
                <span>Trainer: <strong>{s.trainer}</strong></span>
                <span>Time: <strong>{s.time}</strong></span>
              </div>
            </div>

            <a
              href={s.meetLink}
              target="_blank"
              rel="noreferrer"
              className="coord-btn coord-btn--primary"
              style={{ padding: "8px 16px", textDecoration: "none" }}
            >
              <Video size={14} /> Join Meeting
            </a>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="coord-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="coord-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Schedule Live Training Session</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Session Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Graph Algorithms Deep Dive"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Target Batch</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  {coordinatorBatches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Trainer / Instructor</label>
                <select
                  value={trainer}
                  onChange={(e) => setTrainer(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  {coordinatorMentors.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Date & Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g., Tomorrow, 10:00 AM - 12:00 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Google Meet / Zoom URL</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" className="coord-btn" style={{ background: "#f1f5f9" }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn coord-btn--primary">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
