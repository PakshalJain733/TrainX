import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch, getApiBaseUrl } from '../../../utils/api';
import { Video, Plus, Clock, ExternalLink, X, CheckCircle2, AlertCircle } from "lucide-react";
import "../Styles/MN_LiveSessions.css";

export default function LiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, email: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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

  const checkGoogleStatus = () => {
    apiFetch("/google/auth/user-status")
      .then((res) => {
        if (res && res.success) {
          setGoogleStatus({
            connected: Boolean(res.connected),
            email: res.email || '',
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSessions();
    checkGoogleStatus();

    // Check if returning from Google OAuth redirect
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("google_connected") === "true") {
        const email = urlParams.get("email");
        setToastMsg(`Google Meet connected successfully${email ? ` (${decodeURIComponent(email)})` : ''}!`);
        // Clean URL query params without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
        checkGoogleStatus();
      }
    }
  }, []);

  const handleConnectGoogle = () => {
    let localUser = {};
    try {
      localUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user")) || {};
    } catch {}

    const userId = localUser.id || localUser.userId || '';
    const apiBase = getApiBaseUrl().replace(/\/v1$/, '');
    const returnUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `${apiBase}/google/auth/login?userId=${userId}&returnTo=${returnUrl}`;
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Google account?")) return;
    try {
      setGoogleLoading(true);
      await apiFetch("/google/auth/disconnect", { method: "POST" });
      setGoogleStatus({ connected: false, email: '' });
      setToastMsg("Google account disconnected successfully.");
    } catch (err) {
      console.error("Failed to disconnect Google:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

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
      {/* Toast Notification */}
      {toastMsg && (
        <div className="mentor-toast-alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

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

      {/* Google Meet Connection Status Banner */}
      <div className={`mentor-google-banner ${googleStatus.connected ? 'mentor-google-banner--connected' : ''}`}>
        <div className="mentor-google-banner-left">
          <div className="mentor-google-icon-wrap">
            <Video size={18} color={googleStatus.connected ? "#16a34a" : "#4f46e5"} />
          </div>
          <div>
            <div className="mentor-google-banner-title">
              {googleStatus.connected ? (
                <span>Google Meet Connected · <strong style={{ fontWeight: 600 }}>{googleStatus.email}</strong></span>
              ) : (
                <span>Connect Your Google Account for Live Sessions</span>
              )}
            </div>
            <div className="mentor-google-banner-sub">
              {googleStatus.connected
                ? "Live sessions you schedule will automatically generate real Google Meet rooms on your personal Google Calendar."
                : "Connect your Google Calendar once so real Google Meet rooms are automatically created whenever you schedule a class."}
            </div>
          </div>
        </div>
        <div className="mentor-google-banner-right">
          {googleStatus.connected ? (
            <button
              type="button"
              onClick={handleDisconnectGoogle}
              disabled={googleLoading}
              className="mentor-google-btn-disconnect"
            >
              {googleLoading ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="mentor-google-btn-connect"
            >
              Connect Google Meet
            </button>
          )}
        </div>
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
            (Array.isArray(sessions) ? sessions : []).map((s) => (
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
      {showModal && createPortal(
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '90%', padding: '24px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
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
              <div className="form-grid-2 mobile-pair-2" style={{ gap: '12px' }}>
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
              <div className="form-grid-2 mobile-pair-2" style={{ gap: '12px' }}>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Meeting Link
                  {googleStatus.connected && (
                    <span style={{ color: '#16a34a', fontWeight: 400, marginLeft: '6px', fontSize: '12px' }}>
                      (Leave blank to auto-create Google Meet)
                    </span>
                  )}
                </label>
                <input
                  type="url"
                  placeholder={googleStatus.connected ? "Auto-generates Google Meet link if empty" : "https://meet.google.com/xyz-abc"}
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>Schedule Class</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
