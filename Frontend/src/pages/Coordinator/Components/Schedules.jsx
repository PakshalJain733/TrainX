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

      <div className="coord-schedules-list">
        {schedules.map((s) => (
          <div key={s.id} className="coord-schedule-card">
            <div>
              <div className="coord-sched-header">
                <span className="coord-sched-title">{s.title}</span>
                <span
                  className={s.status === "Live Now" ? "coord-sched-status--live" : "coord-sched-status--default"}
                >
                  {s.status}
                </span>
              </div>
              <div className="coord-sched-meta">
                <span>Batch: <strong>{s.batch}</strong></span>
                <span>Trainer: <strong>{s.trainer}</strong></span>
                <span>Time: <strong>{s.time}</strong></span>
              </div>
            </div>

            <a
              href={s.meetLink}
              target="_blank"
              rel="noreferrer"
              className="coord-btn coord-btn--primary coord-sched-join-btn"
            >
              <Video size={14} /> Join Meeting
            </a>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="coord-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="coord-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="coord-modal-title">Schedule Live Training Session</h2>
            <form onSubmit={handleCreate} className="coord-modal-form">
              <div>
                <label className="coord-form-label">Session Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Graph Algorithms Deep Dive"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div>
                <label className="coord-form-label">Target Batch</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="coord-form-input"
                >
                  {coordinatorBatches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="coord-form-label">Trainer / Instructor</label>
                <select
                  value={trainer}
                  onChange={(e) => setTrainer(e.target.value)}
                  className="coord-form-input"
                >
                  {coordinatorMentors.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="coord-form-label">Date & Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g., Tomorrow, 10:00 AM - 12:00 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div>
                <label className="coord-form-label">Google Meet / Zoom URL</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div className="coord-modal-actions">
                <button type="button" className="coord-btn coord-btn--cancel" onClick={() => setShowModal(false)}>
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
