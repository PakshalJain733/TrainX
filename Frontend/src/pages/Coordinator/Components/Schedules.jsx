import { useState, useEffect } from "react";
import { Plus, Video } from "lucide-react";
import apiFetch from "../../../utils/api";
import "../Styles/Schedules.css";

export default function CoordinatorSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [batches, setBatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [batchId, setBatchId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [time, setTime] = useState("");
  const [meetLink, setMeetLink] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch("/coordinator/live-sessions"),
      apiFetch("/coordinator/batches"),
      apiFetch("/coordinator/mentors"),
    ])
      .then(([sessRes, batchRes, mentorRes]) => {
        if (!mounted) return;
        setSchedules(sessRes?.sessions || []);
        setBatches(batchRes?.batches || []);
        setMentors(mentorRes?.mentors || []);
        setBatchId(batchRes?.batches?.[0]?.id ? String(batchRes.batches[0].id) : "");
        setMentorId(mentorRes?.mentors?.[0]?.id ? String(mentorRes.mentors[0].id) : "");
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load schedules");
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !time.trim()) return;
    setSaving(true);

    try {
      const res = await apiFetch("/coordinator/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject: subject || "Training Session",
          batchId: batchId ? Number(batchId) : null,
          mentorId: mentorId ? Number(mentorId) : null,
          time,
          meetLink,
        }),
      });
      const created = {
        id: res?.id || Date.now(),
        title,
        subject: subject || "Training Session",
        batch: batches.find((b) => String(b.id) === batchId)?.name || "All Batches",
        trainer: mentors.find((m) => String(m.id) === mentorId)?.name || "Assigned Faculty",
        time,
        meetLink: meetLink || "",
        status: "Upcoming",
      };
      setSchedules([created, ...schedules]);
      setShowModal(false);
      setTitle("");
      setSubject("");
      setTime("");
      setMeetLink("");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading schedules...</div>;
  }

  if (error) {
    return <div style={{ padding: "48px", textAlign: "center", color: "#e11d48" }}>{error}</div>;
  }

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

      {schedules.length === 0 ? (
        <div className="coord-schedule-card" style={{ padding: "36px", textAlign: "center", color: "#94a3b8" }}>
          No live training sessions have been scheduled for your department yet. Use "Schedule Live Class" to create one.
        </div>
      ) : (
        <div className="coord-schedules-list">
          {schedules.map((s) => (
            <div key={s.id} className="coord-schedule-card">
              <div>
                <div className="coord-sched-header">
                  <span className="coord-sched-title">{s.title}</span>
                  <span className={s.status === "Live" ? "coord-sched-status--live" : "coord-sched-status--default"}>
                    {s.status}
                  </span>
                </div>
                <div className="coord-sched-meta">
                  <span>Batch: <strong>{s.batch}</strong></span>
                  <span>Trainer: <strong>{s.trainer}</strong></span>
                  <span>Time: <strong>{s.time}</strong></span>
                  <span>Subject: <strong>{s.subject}</strong></span>
                </div>
              </div>

              {s.meetLink ? (
                <a
                  href={s.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="coord-btn coord-btn--primary coord-sched-join-btn"
                >
                  <Video size={14} /> Join Meeting
                </a>
              ) : (
                <span className="coord-btn coord-btn--primary coord-sched-join-btn" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                  No Meeting Link
                </span>
              )}
            </div>
          ))}
        </div>
      )}

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
                <label className="coord-form-label">Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Data Structures"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div>
                <label className="coord-form-label">Target Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="coord-form-input"
                >
                  <option value="">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="coord-form-label">Trainer / Instructor</label>
                <select
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="coord-form-input"
                >
                  <option value="">Auto-assign</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="coord-form-label">Date & Time Slot</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2026-09-22 10:00 AM - 12:00 PM"
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
                <button type="submit" className="coord-btn coord-btn--primary" disabled={saving}>
                  {saving ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}