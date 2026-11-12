import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  XCircle,
  RefreshCw,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

/**
 * GrantRetakeModal
 * Reusable modal for Admin, Mentor, Coordinator & College Admin to grant
 * student-specific retakes for Coding Tasks and Practice Arena problems.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - targetType: 'task' | 'practice'
 * - targetId: number | string
 * - targetTitle: string
 * - onRetakeGranted?: () => void
 */
export default function GrantRetakeModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onRetakeGranted,
}) {
  const [activeTab, setActiveTab] = useState('grant'); // 'grant' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History state
  const [retakesHistory, setRetakesHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  // Status feedback message
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen && targetId) {
      setSelectedStudentIds(new Set());
      setReason('');
      setSearchTerm('');
      setFeedback({ type: '', message: '' });
      fetchEligibleStudents();
      fetchRetakesHistory();
    }
  }, [isOpen, targetId, targetType]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchEligibleStudents = async (queryStr = '') => {
    setLoadingStudents(true);
    try {
      const q = queryStr ? `&q=${encodeURIComponent(queryStr)}` : '';
      const res = await apiFetch(`/retakes/eligible-students?target_type=${targetType}&target_id=${targetId}${q}`);
      if (res && res.data) {
        setStudents(Array.isArray(res.data) ? res.data : []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to load eligible students:', err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchRetakesHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiFetch(`/retakes?target_type=${targetType}&target_id=${targetId}`);
      if (res && res.data) {
        setRetakesHistory(Array.isArray(res.data) ? res.data : []);
      } else {
        setRetakesHistory([]);
      }
    } catch (err) {
      console.error('Failed to load retakes history:', err);
      setRetakesHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter students by local search
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase().trim();
    return students.filter((s) => {
      const name = String(s.name || '').toLowerCase();
      const email = String(s.email || '').toLowerCase();
      const roll = String(s.roll_number || s.prn || '').toLowerCase();
      return name.includes(term) || email.includes(term) || roll.includes(term);
    });
  }, [students, searchTerm]);

  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const availableFiltered = filteredStudents.filter((s) => !s.has_active_retake);
    const next = new Set(selectedStudentIds);
    const allSelected = availableFiltered.every((s) => next.has(s.id));

    if (allSelected) {
      availableFiltered.forEach((s) => next.delete(s.id));
    } else {
      availableFiltered.forEach((s) => next.add(s.id));
    }
    setSelectedStudentIds(next);
  };

  const handleGrantRetake = async (e) => {
    e.preventDefault();
    if (selectedStudentIds.size === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one student.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await apiFetch('/retakes/grant', {
        method: 'POST',
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          student_ids: Array.from(selectedStudentIds),
          reason: reason.trim(),
        }),
      });

      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `Retake successfully granted to ${selectedStudentIds.size} student${selectedStudentIds.size > 1 ? 's' : ''}!`,
        });
        setSelectedStudentIds(new Set());
        setReason('');
        // Refresh both lists
        fetchEligibleStudents();
        fetchRetakesHistory();
        if (onRetakeGranted) onRetakeGranted();
      } else {
        setFeedback({
          type: 'error',
          message: res?.message || 'Failed to grant retake permission.',
        });
      }
    } catch (err) {
      console.error('Error granting retake:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'An error occurred while granting retake.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeRetake = async (retakeId, studentName) => {
    if (!window.confirm(`Revoke unused retake for ${studentName || 'this student'}?`)) {
      return;
    }

    setRevokingId(retakeId);
    try {
      const res = await apiFetch('/retakes/revoke', {
        method: 'POST',
        body: JSON.stringify({ retake_id: retakeId }),
      });

      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `Retake revoked successfully for ${studentName || 'student'}.`,
        });
        fetchRetakesHistory();
        fetchEligibleStudents();
        if (onRetakeGranted) onRetakeGranted();
      } else {
        setFeedback({
          type: 'error',
          message: res?.message || 'Failed to revoke retake permission.',
        });
      }
    } catch (err) {
      console.error('Error revoking retake:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'An error occurred while revoking retake.',
      });
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #1e293b, #0f172a)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <RotateCcw size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
                  Manage Retakes
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: targetType === 'task' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: targetType === 'task' ? '#a5b4fc' : '#6ee7b7',
                    border: `1px solid ${targetType === 'task' ? 'rgba(79, 70, 229, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  }}
                >
                  {targetType === 'task' ? 'Coursework Task' : 'Practice Arena'}
                </span>
              </div>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: '#94a3b8',
                  maxWidth: '480px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {targetTitle || `Target ID #${targetId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #334155',
            backgroundColor: '#0f172a',
            padding: '0 24px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('grant')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'grant' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'grant' ? '#818cf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Users size={16} /> Grant Retake
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'history' ? '#818cf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Clock size={16} /> Granted Retakes ({retakesHistory.length})
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback.message && (
          <div
            style={{
              margin: '16px 24px 0 24px',
              padding: '12px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: feedback.type === 'success' ? '#34d399' : '#f87171',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'grant' ? (
            <form onSubmit={handleGrantRetake} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Notice */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '12.5px',
                  color: '#cbd5e1',
                  lineHeight: '1.5',
                }}
              >
                <strong style={{ color: '#818cf8' }}>Selective Permission:</strong> Retakes are granted only to the specific students selected below. Students will be allowed one additional attempt with compiler unlocked and full 3-strike proctoring tracking.
              </div>

              {/* Search & Select Bar */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search by student name, roll number, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <CheckSquare size={14} /> Toggle All
                </button>
              </div>

              {/* Students Selection List */}
              <div
                style={{
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {loadingStudents ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>Loading eligible students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    <Users size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>
                      {searchTerm ? 'No students match your search criteria.' : 'No students found for this target.'}
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    const isSelected = selectedStudentIds.has(s.id);
                    const isAlreadyActive = Boolean(s.has_active_retake);

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (!isAlreadyActive) toggleStudent(s.id);
                        }}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #1e293b',
                          cursor: isAlreadyActive ? 'not-allowed' : 'pointer',
                          backgroundColor: isSelected
                            ? 'rgba(99, 102, 241, 0.12)'
                            : isAlreadyActive
                            ? 'rgba(30, 41, 59, 0.4)'
                            : 'transparent',
                          transition: 'background 0.15s ease',
                          opacity: isAlreadyActive ? 0.65 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ color: isSelected ? '#818cf8' : '#64748b' }}>
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                                {s.name || 'Unnamed Student'}
                              </span>
                              {s.roll_number && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#94a3b8',
                                    backgroundColor: '#1e293b',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {s.roll_number}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{s.email}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Current attempt or score badge */}
                          {s.current_status && (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 500,
                                backgroundColor:
                                  s.current_status === 'Passed' || s.current_status === 'accepted'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(245, 158, 11, 0.15)',
                                color:
                                  s.current_status === 'Passed' || s.current_status === 'accepted'
                                    ? '#34d399'
                                    : '#fbbf24',
                              }}
                            >
                              {s.current_status}
                              {s.current_score !== null && s.current_score !== undefined
                                ? ` (${s.current_score} pts)`
                                : ''}
                            </span>
                          )}

                          {isAlreadyActive ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                              }}
                            >
                              Retake Active
                            </span>
                          ) : isSelected ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                color: '#a5b4fc',
                              }}
                            >
                              Selected
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#94a3b8' }}>
                <span>
                  Selected: <strong style={{ color: '#818cf8' }}>{selectedStudentIds.size}</strong> student{selectedStudentIds.size !== 1 ? 's' : ''}
                </span>
                {selectedStudentIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds(new Set())}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Optional Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Reason for Retake (Optional audit note):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Browser crash during test, lab network disruption, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedStudentIds.size === 0 || isSubmitting}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: selectedStudentIds.size === 0 || isSubmitting ? '#475569' : '#4f46e5',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: selectedStudentIds.size === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: selectedStudentIds.size > 0 ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Granting...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={15} /> Confirm Grant ({selectedStudentIds.size})
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Tab 2: Granted Retakes History */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                All retake permissions granted for this target. Pending retakes can be revoked before they are used by the student.
              </p>

              {loadingHistory ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>Loading history...</p>
                </div>
              ) : retakesHistory.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  <Clock size={28} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>No retakes granted yet</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                    Use the 'Grant Retake' tab to issue retake permissions to students.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155', backgroundColor: '#1e293b', color: '#94a3b8' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Student</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Granted By</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retakesHistory.map((r) => {
                        const isPending = r.status === 'pending';
                        const isUsed = r.status === 'used';
                        const isRevoked = r.status === 'revoked';

                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{r.student_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {r.roll_number ? `${r.roll_number} • ` : ''}
                                {r.student_email}
                              </div>
                              {r.reason && (
                                <div style={{ fontSize: '11px', color: '#a5b4fc', marginTop: '2px', fontStyle: 'italic' }}>
                                  "{r.reason}"
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                              <div>{r.granted_by_name || 'Admin'}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {r.granted_at ? new Date(r.granted_at).toLocaleDateString() : '—'}
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {isPending && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                  }}
                                >
                                  <Clock size={12} /> Pending (Unused)
                                </span>
                              )}
                              {isUsed && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                  }}
                                >
                                  <CheckCircle2 size={12} /> Completed
                                </span>
                              )}
                              {isRevoked && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: 'rgba(148, 163, 184, 0.15)',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                  }}
                                >
                                  <XCircle size={12} /> Revoked
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeRetake(r.id, r.student_name)}
                                  disabled={revokingId === r.id}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '6px',
                                    color: '#f87171',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Revoke retake permission"
                                >
                                  {revokingId === r.id ? 'Revoking...' : 'Revoke'}
                                </button>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '11px' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

