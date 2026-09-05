import { useState } from "react";
import { Plus, Video, Calendar, UserCheck, Users, ExternalLink, X } from "lucide-react";
import { coordinatorSchedules, coordinatorBatches, coordinatorMentors } from "../../../data/coordinatorMockData";
import "../Styles/Schedules.css";
import "../../Admin/Styles/AdminUsers.css";

export default function CoordinatorSchedules() {
  const [schedules, setSchedules] = useState(coordinatorSchedules);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState(coordinatorBatches[0]?.name || "");
  const [trainer, setTrainer] = useState(coordinatorMentors[0]?.name || "");
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
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Video size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Schedule Live Training Session</h2>
                  <p className="modal-subtitle">Schedule interactive classes and generate video meeting links.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>Session Topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graph Algorithms Deep Dive"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input-admin"
                    autoFocus
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Target Batch</label>
                    <select
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="form-select-admin"
                    >
                      {coordinatorBatches.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-admin">
                    <label>Trainer / Instructor</label>
                    <select
                      value={trainer}
                      onChange={(e) => setTrainer(e.target.value)}
                      className="form-select-admin"
                    >
                      {coordinatorMentors.map((m) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Date & Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. Tomorrow, 10:00 AM - 12:00 PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="form-input-admin"
                  />
                </div>

                <div className="form-group-admin">
                  <label>Google Meet / Zoom URL</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                    className="form-input-admin"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
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
