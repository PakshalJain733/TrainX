import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { Video, Plus, Clock, ExternalLink, X } from 'lucide-react';
import "../Styles/MN_LiveSessions.css";

export default function LiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: 'General',
    batch: 'All Batches',
    date: new Date().toISOString().split('T')[0],
    time: '04:00 PM - 05:00 PM',
    duration: '60 mins',
    meetingLink: '',
  });

  const loadSessions = () => {
    setLoading(true);
    apiFetch("/mentor/live-sessions")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setSessions(res.data);
        } else {
          setSessions([]);
        }
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      await apiFetch("/mentor/live-sessions", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({
        title: '',
        subject: 'General',
        batch: 'All Batches',
        date: new Date().toISOString().split('T')[0],
        time: '04:00 PM - 05:00 PM',
        duration: '60 mins',
        meetingLink: '',
      });
      loadSessions();
    } catch (err) {
      console.error("Failed to save live session to DB:", err);
    }
  };

  return (
    <div className="mentor-livesessions-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Video size={20} color="#4f46e5" />
            <span>Live Classes & Doubts Desk</span>
          </h2>
          <p className="mentor-page-subtitle">Schedule live lecture sessions, launch meeting rooms, and resolve student doubt tickets saved in database</p>
        </div>

        <button className="mentor-btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Schedule Live Class</span>
        </button>
      </div>

      <div className="mentor-livesessions-grid">
        {/* Left: Scheduled Sessions */}
        <div className="mentor-column-block">
          <h3 className="mentor-col-heading">Upcoming Live Sessions</h3>
          {loading ? (
            <div style={{ padding: "24px", color: "#64748b" }}>Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: "32px 16px", color: "#64748b", fontSize: "14px" }}>
              No live sessions scheduled yet in database.
            </div>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="mentor-session-card">
                <div className="mentor-session-top">
                  <span className="mentor-batch-code-tag">{s.batch}</span>
                  <span className="mentor-status-tag mentor-status-tag--indigo">
                    {s.status || 'Upcoming'}
                  </span>
                </div>
                <h4 className="mentor-session-title">{s.title}</h4>
                <p className="mentor-session-time">
                  <Clock size={14} color="#4f46e5" /> {s.date ? `${s.date} · ${s.time}` : s.time}
                </p>
                {s.meeting_link || s.link ? (
                  <a
                    href={s.meeting_link || s.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mentor-session-launch-btn"
                  >
                    <span>Launch Meeting Room</span>
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>

        {/* Right: Doubts Ticket Queue */}
        <div className="mentor-column-block">
          <h3 className="mentor-col-heading">Student Doubts Queue</h3>
          <div className="mentor-doubts-card">
            <div className="mentor-doubt-item">
              <div className="mentor-session-top">
                <span className="mentor-doubt-student">Ganesh Shinde</span>
                <span className="mentor-doubt-status">Open</span>
              </div>
              <p className="mentor-doubt-text">How do I optimize space complexity in DP recursion trees?</p>
              <div className="mentor-doubt-meta">
                <span>TE-ECS · Today 10:15 AM</span>
                <button className="mentor-doubt-reply-btn">Reply</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Live Class Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px', width: '90%', padding: '24px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Schedule Live Lecture</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Session Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design & Microservices"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Target Batch</label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Time Slot</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Meeting Link (Google Meet / Zoom)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>Save to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
