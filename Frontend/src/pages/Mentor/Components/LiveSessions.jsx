import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Plus, Users, Play, Trash2, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { mentorLiveSessions as defaultMockSessions } from '../../../data/mentorMockData';

const INITIAL_SESSIONS = [
  {
    id: 1,
    title: 'Advanced System Design & Microservices Architecture',
    batch: 'BE-CS-2026-A',
    date: '2026-09-06',
    time: '10:00 AM - 11:30 AM',
    status: 'Upcoming',
    attendees: 42,
    link: 'https://meet.google.com/abc-defg-hij'
  },
  {
    id: 2,
    title: 'Full Stack MERN Project Mentorship & Code Review',
    batch: 'TE-IT-2026-B',
    date: '2026-09-06',
    time: '02:00 PM - 03:30 PM',
    status: 'Upcoming',
    attendees: 38,
    link: 'https://meet.google.com/xyz-uvwx-rst'
  },
  {
    id: 3,
    title: 'Data Structures & Algorithms - Live Problem Solving',
    batch: 'BE-EXTC-2026-C',
    date: '2026-09-05',
    time: '04:00 PM - 05:30 PM',
    status: 'Completed',
    attendees: 45,
    link: 'https://meet.google.com/dsa-live-session'
  }
];

const LiveSessions = () => {
  const [sessions, setSessions] = useState(() => {
    try {
      const stored = localStorage.getItem('mentor_live_sessions');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INITIAL_SESSIONS;
  });

  const [showModal, setShowModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [newSession, setNewSession] = useState({
    title: '',
    batch: 'BE-CS-2026-A',
    date: '',
    time: '',
    link: ''
  });

  // Sync with localStorage so deletion persists everywhere across the portal
  useEffect(() => {
    try {
      localStorage.setItem('mentor_live_sessions', JSON.stringify(sessions));
      window.dispatchEvent(new Event('mentorSessionsUpdated'));
    } catch (e) {}
  }, [sessions]);

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!newSession.title || !newSession.date || !newSession.time) return;
    const session = {
      id: Date.now(),
      ...newSession,
      status: 'Upcoming',
      attendees: 0,
      link: newSession.link || 'https://meet.google.com/new-session'
    };
    setSessions([session, ...sessions]);
    setShowModal(false);
    setNewSession({ title: '', batch: 'BE-CS-2026-A', date: '', time: '', link: '' });
  };

  const handleDeleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setSessionToDelete(null);
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Video size={28} color="#3b82f6" /> Live Training Sessions & Schedule
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '14px' }}>
            Schedule, manage, and delete live interactive coding & mentorship sessions across all portal views.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={18} /> Schedule New Session
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {sessions.map((sess) => (
          <div
            key={sess.id}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: sess.status === 'Upcoming' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    color: sess.status === 'Upcoming' ? '#60a5fa' : '#4ade80',
                    border: `1px solid ${sess.status === 'Upcoming' ? '#3b82f6' : '#22c55e'}`
                  }}
                >
                  {sess.status}
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} /> {sess.attendees} Enrolled
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#f1f5f9' }}>
                {sess.title}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="#94a3b8" /> {sess.date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={15} color="#94a3b8" /> {sess.time}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontWeight: '500' }}>
                  Target: {sess.batch}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '14px', marginTop: '10px', display: 'flex', gap: '10px' }}>
              <a
                href={sess.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: '#2563eb',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Play size={16} /> Join Session
              </a>

              <button
                onClick={() => setSessionToDelete(sess)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
                title="Delete Session"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Delete Live Session</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>"{sessionToDelete.title}"</strong>? This will permanently remove the live session from all mentor and student portals.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSessionToDelete(null)}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(sessionToDelete.id)}
                style={{ padding: '8px 16px', background: '#dc2626', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '450px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#f8fafc' }}>Schedule Live Session</h2>
            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Session Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass on System Architecture"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Target Batch</label>
                <select
                  value={newSession.batch}
                  onChange={(e) => setNewSession({ ...newSession, batch: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                >
                  <option>BE-CS-2026-A</option>
                  <option>TE-IT-2026-B</option>
                  <option>BE-EXTC-2026-C</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    required
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Time Range</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM - 11:30 AM"
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Meeting Link (Google Meet / Zoom)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={newSession.link}
                  onChange={(e) => setNewSession({ ...newSession, link: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Save & Schedule
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
