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
 * Styled in the clean, modern TrainX light-mode design system.
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
      } else if (Array.isArray(res)) {
        setStudents(res);
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
      } else if (Array.isArray(res)) {
        setRetakesHistory(res);
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
    const availableFiltered = filteredStudents.filter((s) => !s.has_active_retake && s.active_retake_status !== 'pending');
    const next = new Set(selectedStudentIds);
    const allSelected = availableFiltered.length > 0 && availableFiltered.every((s) => next.has(s.id));

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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          color: '#0f172a',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#eef2ff',
                border: '1px solid #c7d2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4f46e5',
                flexShrink: 0,
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Manage Retakes
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: targetType === 'task' ? '#eef2ff' : '#ecfdf5',
                    color: targetType === 'task' ? '#4f46e5' : '#059669',
                    border: `1px solid ${targetType === 'task' ? '#c7d2fe' : '#a7f3d0'}`,
                  }}
                >
                  {targetType === 'task' ? 'Coursework Task' : 'Practice Arena'}
                </span>
              </div>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: '#64748b',
                  fontWeight: 500,
                  maxWidth: '460px',
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
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.borderColor = '#fecaca';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#64748b';
            }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '4px 24px 0 24px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('grant')}
            style={{
              padding: '11px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'grant' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
              color: activeTab === 'grant' ? '#4f46e5' : '#64748b',
              fontWeight: activeTab === 'grant' ? 700 : 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} /> Grant Retake
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '11px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
              color: activeTab === 'history' ? '#4f46e5' : '#64748b',
              fontWeight: activeTab === 'history' ? 700 : 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
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
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} color="#059669" /> : <AlertCircle size={16} color="#dc2626" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '22px 28px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'grant' ? (
            <form onSubmit={handleGrantRetake} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Notice */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  fontSize: '12.5px',
                  color: '#3730a3',
                  lineHeight: '1.5',
                }}
              >
                <strong style={{ color: '#4338ca', fontWeight: 700 }}>Selective Permission:</strong> Retakes are granted only to the specific students selected below. Students will be allowed one additional attempt with compiler unlocked and full 3-strike proctoring tracking.
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
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search by student name, roll number, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#4f46e5')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    color: '#334155',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <CheckSquare size={14} /> Toggle All
                </button>
              </div>

              {/* Students Selection List */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {loadingStudents ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#4f46e5' }} />
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Loading eligible students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <Users size={26} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                      {searchTerm ? 'No students match your search criteria.' : 'No students found for this target.'}
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    const isSelected = selectedStudentIds.has(s.id);
                    const isAlreadyActive = Boolean(s.has_active_retake || s.active_retake_status === 'pending');

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (!isAlreadyActive) toggleStudent(s.id);
                        }}
                        style={{
                          padding: '11px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: isAlreadyActive ? 'not-allowed' : 'pointer',
                          backgroundColor: isSelected
                            ? '#eef2ff'
                            : isAlreadyActive
                            ? '#fefce8'
                            : '#ffffff',
                          transition: 'background 0.15s ease',
                          opacity: isAlreadyActive ? 0.85 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && !isAlreadyActive) {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && !isAlreadyActive) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ color: isSelected ? '#4f46e5' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                            {isSelected ? <CheckSquare size={19} color="#4f46e5" /> : <Square size={19} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                                {s.name || 'Unnamed Student'}
                              </span>
                              {s.roll_number && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#475569',
                                    backgroundColor: '#f1f5f9',
                                    border: '1px solid #e2e8f0',
                                    padding: '1px 7px',
                                    borderRadius: '5px',
                                    fontWeight: 600,
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
                          {(s.current_status || s.submission_status) && (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '3px 9px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                backgroundColor:
                                  (s.current_status === 'Passed' || s.current_status === 'accepted' || s.submission_status === 'Passed' || s.submission_status === 'Completed')
                                    ? '#dcfce7'
                                    : '#fee2e2',
                                color:
                                  (s.current_status === 'Passed' || s.current_status === 'accepted' || s.submission_status === 'Passed' || s.submission_status === 'Completed')
                                    ? '#166534'
                                    : '#991b1b',
                                border: `1px solid ${
                                  (s.current_status === 'Passed' || s.current_status === 'accepted' || s.submission_status === 'Passed' || s.submission_status === 'Completed')
                                    ? '#bbf7d0'
                                    : '#fecaca'
                                }`,
                              }}
                            >
                              {s.current_status || s.submission_status}
                              {(s.current_score !== null && s.current_score !== undefined)
                                ? ` (${s.current_score} pts)`
                                : (s.marks_obtained !== null && s.marks_obtained !== undefined)
                                ? ` (${s.marks_obtained} pts)`
                                : ''}
                            </span>
                          )}

                          {isAlreadyActive ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '6px',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                              }}
                            >
                              Retake Active
                            </span>
                          ) : isSelected ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '6px',
                                backgroundColor: '#e0e7ff',
                                color: '#3730a3',
                                border: '1px solid #c7d2fe',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#64748b' }}>
                <span>
                  Selected: <strong style={{ color: '#4f46e5', fontWeight: 700 }}>{selectedStudentIds.size}</strong> student{selectedStudentIds.size !== 1 ? 's' : ''}
                </span>
                {selectedStudentIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds(new Set())}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Optional Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason for Retake (Optional audit note):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Browser crash during test, lab network disruption, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4f46e5')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedStudentIds.size === 0 || isSubmitting}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: selectedStudentIds.size === 0 || isSubmitting ? '#cbd5e1' : '#4f46e5',
                    border: 'none',
                    borderRadius: '10px',
                    color: selectedStudentIds.size === 0 || isSubmitting ? '#94a3b8' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: selectedStudentIds.size === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: selectedStudentIds.size > 0 && !isSubmitting ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
                    transition: 'all 0.15s ease',
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
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                All retake permissions granted for this target. Pending retakes can be revoked before they are used by the student.
              </p>

              {loadingHistory ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#4f46e5' }} />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Loading history...</p>
                </div>
              ) : retakesHistory.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  <Clock size={30} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#334155' }}>No retakes granted yet</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12.5px' }}>
                    Use the 'Grant Retake' tab to issue retake permissions to students.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569' }}>
                        <th style={{ padding: '11px 16px', fontWeight: 700 }}>Student</th>
                        <th style={{ padding: '11px 16px', fontWeight: 700 }}>Granted By</th>
                        <th style={{ padding: '11px 16px', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: '11px 16px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retakesHistory.map((r) => {
                        const isPending = r.status === 'pending';
                        const isUsed = r.status === 'used';
                        const isRevoked = r.status === 'revoked';

                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.student_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {r.roll_number ? `${r.roll_number} • ` : ''}
                                {r.student_email}
                              </div>
                              {r.reason && (
                                <div style={{ fontSize: '11px', color: '#4f46e5', marginTop: '2px', fontStyle: 'italic' }}>
                                  "{r.reason}"
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#334155' }}>
                              <div style={{ fontWeight: 600 }}>{r.granted_by_name || 'Admin'}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {r.granted_at ? new Date(r.granted_at).toLocaleDateString() : '—'}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {isPending && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 9px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #fde68a',
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
                                    padding: '3px 9px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                    border: '1px solid #bbf7d0',
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
                                    padding: '3px 9px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  <XCircle size={12} /> Revoked
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeRetake(r.id, r.student_name)}
                                  disabled={revokingId === r.id}
                                  style={{
                                    padding: '5px 12px',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '6px',
                                    color: '#dc2626',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                                  title="Revoke retake permission"
                                >
                                  {revokingId === r.id ? 'Revoking...' : 'Revoke'}
                                </button>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
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
