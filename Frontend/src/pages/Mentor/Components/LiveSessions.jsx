import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Plus, Users, Play, Trash2, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../../utils/api';

const LiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    subject: '',
    batch_id: '',
    date: '',
    time: '',
    duration: '60 mins',
    meeting_link: ''
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiFetch("/mentor/live-sessions"),
      apiFetch("/mentor/batches"),
    ])
      .then(([sessRes, batchRes]) => {
        const sessionsData = (sessRes && sessRes.data && Array.isArray(sessRes.data.sessions)) ? sessRes.data.sessions : [];
        const batchesData = (batchRes && batchRes.data && Array.isArray(batchRes.data.batches)) ? batchRes.data.batches : [];
        setSessions(sessionsData);
        setBatches(batchesData);
        if (batchesData.length > 0) {
          setNewSession((p) => ({ ...p, batch_id: String(batchesData[0].id), batch: batchesData[0].name }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!newSession.title || !newSession.date || !newSession.time) return;
    setSaving(true);
    const selected = batches.find((b) => String(b.id) === newSession.batch_id);
    const payload = {
      title: newSession.title,
      subject: newSession.subject || 'General Training',
      batch: selected ? selected.name : 'All Batches',
      batch_id: newSession.batch_id ? parseInt(newSession.batch_id, 10) : null,
      date: newSession.date,
      time: newSession.time,
      duration: newSession.duration,
      meeting_link: newSession.meeting_link,
    };
    apiFetch("/mentor/live-sessions", { method: "POST", body: JSON.stringify(payload) })
      .then((res) => {
        if (res && res.success) {
          setShowModal(false);
          setNewSession({ title: '', subject: '', batch_id: newSession.batch_id, date: '', time: '', duration: '60 mins', meeting_link: '' });
          loadData();
        } else {
          alert(res?.message || "Failed to schedule session");
        }
      })
      .catch((err) => alert(err.message || "Failed to schedule session"))
      .finally(() => setSaving(false));
  };

  const handleDeleteSession = (id) => {
    apiFetch(`/mentor/live-sessions/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res && res.success) {
          setSessions((prev) => prev.filter((s) => s.id !== id));
        } else {
          alert(res?.message || "Failed to delete session");
        }
      })
      .catch((err) => alert(err.message || "Failed to delete session"))
      .finally(() => setSessionToDelete(null));
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Video size={28} color="#3b82f6" /> Live Training Sessions & Schedule
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '14px' }}>
            Schedule, manage, and delete live interactive coding & mentorship sessions (synced with the database).
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px',
            fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Plus size={18} /> Schedule New Session
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#94a3b8', gap: 12 }}>
          <RefreshCw size={28} style={{ animation: 'spin 1.2s linear infinite', color: '#3b82f6' }} />
          <p>Loading live sessions...</p>
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 20px', border: '1px dashed #334155', borderRadius: 12 }}>
          No live sessions scheduled yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {sessions.map((sess) => (
            <div
              key={sess.id}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', background: sess.status === 'Upcoming' ? 'rgba(59, 130, 246, 0.2)' : sess.status === 'Completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: sess.status === 'Upcoming' ? '#60a5fa' : sess.status === 'Completed' ? '#4ade80' : '#fbbf24', border: `1px solid ${sess.status === 'Upcoming' ? '#3b82f6' : sess.status === 'Completed' ? '#22c55e' : '#f59e0b'}` }}>
                    {sess.status}
                  </span>
                  <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} /> {sess.attendees ?? 0} Enrolled
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#f1f5f9' }}>{sess.title}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={15} color="#94a3b8" /> {sess.date}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={15} color="#94a3b8" /> {sess.time} · {sess.duration}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontWeight: '500' }}>Target: {sess.batch}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '14px', marginTop: '10px', display: 'flex', gap: '10px' }}>
                {sess.meeting_link ? (
                  <a href={sess.meeting_link} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ExternalLink size={16} /> Join Session
                  </a>
                ) : (
                  <div style={{ flex: 1, textAlign: 'center', background: '#334155', color: '#94a3b8', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                    No meeting link
                  </div>
                )}

                <button onClick={() => setSessionToDelete(sess)} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: '600', fontSize: '13px' }} title="Delete Session">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Delete Live Session</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: '#fff' }}>"{sessionToDelete.title}"</strong>? This will permanently remove the live session.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSessionToDelete(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDeleteSession(sessionToDelete.id)} style={{ padding: '8px 16px', background: '#dc2626', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Confirm Delete</button>
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
                <input type="text" required placeholder="e.g. Masterclass on System Architecture" value={newSession.title} onChange={(e) => setNewSession({ ...newSession, title: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Subject</label>
                <input type="text" placeholder="e.g. System Design" value={newSession.subject} onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Target Batch</label>
                <select value={newSession.batch_id} onChange={(e) => setNewSession({ ...newSession, batch_id: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}>
                  <option value="">All Batches</option>
                  {batches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Date</label>
                  <input type="date" required value={newSession.date} onChange={(e) => setNewSession({ ...newSession, date: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Time Range</label>
                  <input type="text" required placeholder="10:00 AM - 11:30 AM" value={newSession.time} onChange={(e) => setNewSession({ ...newSession, time: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Duration</label>
                <input type="text" placeholder="60 mins" value={newSession.duration} onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>Meeting Link (Google Meet / Zoom)</label>
                <input type="url" placeholder="https://meet.google.com/..." value={newSession.meeting_link} onChange={(e) => setNewSession({ ...newSession, meeting_link: e.target.value })} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 16px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save & Schedule'}
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