import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Plus, Users, Play, Trash2, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/LiveSessions.css';

const LiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [dbBatches, setDbBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [newSession, setNewSession] = useState({
    title: '',
    batch: 'All Batches',
    date: '',
    time: '',
    meetingLink: ''
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/mentor/live-sessions');
      if (res && res.success && Array.isArray(res.data)) {
        setSessions(res.data);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('[LiveSessions API fetch error]', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiFetch('/batches');
      if (res && res.data && Array.isArray(res.data)) {
        setDbBatches(res.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSessions();
    fetchBatches();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSession.title || !newSession.date || !newSession.time) return;
    try {
      const res = await apiFetch('/mentor/live-sessions', {
        method: 'POST',
        body: JSON.stringify(newSession)
      });
      if (res && res.success) {
        setShowModal(false);
        setNewSession({ title: '', batch: 'BE-CS-2026-A', date: '', time: '', meetingLink: '' });
        fetchSessions();
      }
    } catch (err) {
      console.error('[LiveSessions API create error]', err);
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      const res = await apiFetch(`/mentor/live-sessions/${id}`, { method: 'DELETE' });
      if (res && res.success) {
        setSessionToDelete(null);
        fetchSessions();
      }
    } catch (err) {
      console.error('[LiveSessions API delete error]', err);
    }
  };

  return (
    <div className="mentor-livesessions-page">
      <div className="mentor-livesessions-header">
        <div>
          <h1 className="mentor-livesessions-title">
            <Video size={28} color="#3b82f6" /> Live Training Sessions & Schedule
          </h1>
          <p className="mentor-livesessions-desc">
            Schedule, manage, and track live interactive coding & mentorship sessions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mentor-schedule-btn"
        >
          <Plus size={18} /> Schedule New Session
        </button>
      </div>

      {loading ? (
        <p>Loading live sessions...</p>
      ) : sessions.length === 0 ? (
        <p>No live sessions found.</p>
      ) : (
        <div className="mentor-sessions-grid">
          {sessions.map(s => {
            const isLive = s.status === 'Live';
            const isCompleted = s.status === 'Completed';

            return (
              <div key={s.id} className="mentor-session-box">
                <div>
                  <div className="mentor-session-box-header">
                    <span className={`mentor-badge ${
                      isLive ? 'mentor-badge-live' : isCompleted ? 'mentor-badge-completed' : 'mentor-badge-upcoming'
                    }`}>
                      {isLive ? '🔴 LIVE NOW' : s.status}
                    </span>
                    <span className="mentor-session-batch">
                      <Users size={14} /> {s.batch || 'All Batches'}
                    </span>
                  </div>

                  <h3 className="mentor-session-heading">{s.title}</h3>

                  <div className="mentor-session-meta">
                    <div className="mentor-session-meta-row">
                      <Calendar size={15} color="#94a3b8" />
                      <span>Date: {s.date}</span>
                    </div>
                    <div className="mentor-session-meta-row">
                      <Clock size={15} color="#94a3b8" />
                      <span>Time: {s.time}</span>
                    </div>
                    <div className="mentor-session-meta-row mentor-session-meta-highlight">
                      <Users size={15} />
                      <span>{s.attendeesCount || s.attendees || 0} Registered / Expected Students</span>
                    </div>
                  </div>
                </div>

                <div className="mentor-session-actions">
                  <a
                    href={s.meeting_link || s.meetingLink || s.link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`mentor-join-btn ${isLive ? 'mentor-join-btn-primary' : 'mentor-join-btn-secondary'}`}
                  >
                    {isLive ? <Play size={16} /> : <ExternalLink size={16} />}
                    {isLive ? 'Join Live Stream' : 'Meeting Link'}
                  </a>

                  <button
                    onClick={() => setSessionToDelete(s)}
                    className="mentor-delete-icon-btn"
                    title="Delete Live Session"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Delete Live Session</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>"{sessionToDelete.title}"</strong>?
            </p>
            <div className="mentor-modal-actions">
              <button
                onClick={() => setSessionToDelete(null)}
                className="mentor-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(sessionToDelete.id)}
                className="mentor-btn-danger"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-box">
            <h2 className="mentor-modal-title">Schedule Live Session</h2>
            <form onSubmit={handleCreateSession} className="mentor-modal-form">
              <div className="mentor-form-group">
                <label>Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. System Design Masterclass"
                  value={newSession.title}
                  onChange={e => setNewSession({ ...newSession, title: e.target.value })}
                  required
                />
              </div>

              <div className="mentor-form-group">
                <label>Target Batch</label>
                <select
                  value={newSession.batch}
                  onChange={e => setNewSession({ ...newSession, batch: e.target.value })}
                >
                  <option value="All Batches">All Batches</option>
                  {dbBatches.map((b) => (
                    <option key={b.id} value={b.name || b.code}>
                      {b.name || b.code} ({b.code || b.join_code || b.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mentor-form-grid-2">
                <div className="mentor-form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                    required
                  />
                </div>
                <div className="mentor-form-group">
                  <label>Time Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 11:30 AM"
                    value={newSession.time}
                    onChange={e => setNewSession({ ...newSession, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mentor-form-group">
                <label>Meeting Link (Google Meet / Zoom)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={newSession.meetingLink}
                  onChange={e => setNewSession({ ...newSession, meetingLink: e.target.value })}
                />
              </div>

              <div className="mentor-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mentor-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mentor-btn-submit"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessions;
