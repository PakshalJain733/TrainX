import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Bell,
  RefreshCw,
  PlusCircle,
  X,
  CheckCircle2,
  Calendar,
  UserCheck,
  FileText,
  ChevronDown,
  Check,
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/Defaulters.css';

/* ── Inline dropdown for Mentor Defaulters (CSS: Defaulters.css .mentor-def-select-*) ── */
function MentorDefSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`mentor-def-select-wrap${isOpen ? ' mentor-def-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`mentor-def-select-trigger${isOpen ? ' mentor-def-select-trigger--open' : ''}`}>
        {Icon && <Icon className="mentor-def-select-icon" />}
        <span className="mentor-def-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`mentor-def-select-arrow${isOpen ? ' mentor-def-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="mentor-def-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`mentor-def-select-option${isSel ? ' mentor-def-select-option--selected' : ''}`}>
                <span className="mentor-def-select-option-label">{opt.label}</span>
                {isSel && <Check className="mentor-def-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Defaulters() {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Intervention Modal Form State
  const [interactionDate, setInteractionDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Action Taken');
  const [notes, setNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const fetchDefaulters = () => {
    setLoading(true);
    apiFetch('/interventions')
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setDefaulters(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch mentor defaulters:', err);
      })
      .finally(() => setLoading(false));
  };

  const handleOpenIntervention = (student) => {
    setSelectedStudent(student);
    setStatus(student.status || 'Action Taken');
    setActionTaken('Assigned 1-on-1 counseling & remedial DSA practice set');
    setRecommendations('Complete Database Indexing module in 7 days');
    setNotes('');
  };

  const handleSubmitIntervention = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSubmitting(true);
    const payload = {
      student_id: selectedStudent.student_id || selectedStudent.user_id || selectedStudent.id,
      interaction_date: interactionDate,
      status,
      notes,
      action_taken: actionTaken,
      recommendations,
      next_followup: nextFollowup || null,
    };

    apiFetch('/interventions/log', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then(() => {
        setMessage(`Intervention action logged for ${selectedStudent.student_name || selectedStudent.name || 'student'}!`);
        fetchDefaulters();
        setSelectedStudent(null);
        setTimeout(() => setMessage(''), 4000);
      })
      .catch((err) => {
        console.error('Failed to log intervention:', err);
      })
      .finally(() => setSubmitting(false));
  };

  const getStatusBadge = (st) => {
    const s = String(st || 'Needs Attention');
    if (s === 'Resolved') {
      return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', fontSize: '12px', fontWeight: 700 }}>Resolved</span>;
    }
    if (s === 'Improving') {
      return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 700 }}>Improving</span>;
    }
    if (s === 'Action Taken') {
      return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: 700 }}>Action Taken</span>;
    }
    if (s === 'Under Review') {
      return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#f3e8ff', color: '#6b21a8', fontSize: '12px', fontWeight: 700 }}>Under Review</span>;
    }
    return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#ffe4e6', color: '#e11d48', fontSize: '12px', fontWeight: 700 }}>Needs Attention</span>;
  };

  return (
    <div className="mentor-defaulters-container">
      {/* Header */}
      <div className="mentor-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="mentor-page-title">
            <AlertCircle size={20} color="#e11d48" />
            <span>Defaulter Queue & Mentor Interventions</span>
          </h2>
          <p className="mentor-page-subtitle">Identify students requiring support (&lt;75% attendance or &lt;60% performance) and log intervention actions</p>
        </div>

        <button onClick={fetchDefaulters} className="mentor-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* Table */}
      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', marginRight: 10 }} />
              <span>Scanning student performance & scanning defaulters...</span>
              <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            </div>
          ) : defaulters.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No defaulter students flagged. All assigned students are above attendance & performance thresholds!
            </div>
          ) : (
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Batch / Dept</th>
                  <th>Attendance</th>
                  <th>Overall Score</th>
                  <th>Defaulter Reasons</th>
                  <th>Status</th>
                  <th className="mentor-actions-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((d, idx) => {
                  const name = d.student_name || d.name || 'Student';
                  const roll = d.roll_number || d.rollNo || '2026COMP042';
                  const batch = d.batch_name || d.batch || d.department || 'Batch A - CSE';
                  const att = d.attendance_score !== undefined ? `${d.attendance_score}%` : (d.attendance || '68%');
                  const score = d.overall_score !== undefined ? `${d.overall_score}%` : (d.lastTestScore || '52%');
                  const reasons = Array.isArray(d.reasons) && d.reasons.length > 0 ? d.reasons : [d.reason || 'Low Attendance (<75%)'];

                  return (
                    <tr key={d.id || idx}>
                      <td className="mentor-student-name">{name}</td>
                      <td className="mentor-student-roll">{roll}</td>
                      <td className="mentor-student-batch">{batch}</td>
                      <td className="mentor-student-attendance--rose font-bold">{att}</td>
                      <td className="mentor-student-score">{score}</td>
                      <td className="mentor-defaulter-reason">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {reasons.map((r, i) => (
                            <span key={i} style={{ fontSize: '11px', background: '#fff1f2', color: '#e11d48', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecdd3', display: 'inline-block' }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{getStatusBadge(d.status)}</td>
                      <td className="mentor-actions-cell">
                        <button
                          className="mentor-notify-btn"
                          style={{ background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}
                          onClick={() => handleOpenIntervention(d)}
                        >
                          <UserCheck size={14} /> Log Intervention
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Intervention Action Modal */}
      {selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#4f46e5', padding: '16px 20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Log Mentor Intervention Action</h3>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitIntervention} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Target Student</label>
                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a' }}>
                  {selectedStudent.student_name || selectedStudent.name || 'Student'} ({selectedStudent.roll_number || selectedStudent.rollNo || 'Roll N/A'})
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Interaction Date</label>
                  <input
                    type="date"
                    value={interactionDate}
                    onChange={(e) => setInteractionDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Workflow Status</label>
                  <MentorDefSelect
                    value={status}
                    options={[
                      { value: "Needs Attention", label: "Needs Attention" },
                      { value: "Under Review", label: "Under Review" },
                      { value: "Action Taken", label: "Action Taken" },
                      { value: "Improving", label: "Improving" },
                      { value: "Resolved", label: "Resolved" },
                    ]}
                    onChange={(val) => setStatus(val)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Action Taken</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Assigned 1-on-1 counseling & remedial DSA tasks"
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Improvement Recommendation</label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="e.g. Complete Database Indexing module in 7 days"
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mentor Notes & Remarks</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter detailed observation notes..."
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Next Follow-up Date (Optional)</label>
                <input
                  type="date"
                  value={nextFollowup}
                  onChange={(e) => setNextFollowup(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {submitting ? 'Saving...' : 'Save & Log Intervention'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
