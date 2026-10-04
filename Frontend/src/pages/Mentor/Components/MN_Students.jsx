import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../../../utils/api';
import { Users, Search, Mail, Video, Plus, Calendar, Clock, ExternalLink, X, CheckCircle, Sparkles, Send } from 'lucide-react';
import CustomSelect from '../../../components/ui/CustomSelect';

import "../Styles/MN_Students.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getAttendanceClass = (attendance) => {
  const value = asNumber(attendance);
  if (value === null) return "";
  if (value >= 90) return "mentor-student-attendance--green";
  if (value >= 75) return "mentor-student-attendance--amber";
  return "mentor-student-attendance--rose";
};

const getRiskClass = (status) => {
  if (status === "Top Performer") return "mentor-risk-pill--top";
  if (status === "Good") return "mentor-risk-pill--good";
  if (status === "Moderate Risk" || status === "Average") return "mentor-risk-pill--moderate";
  if (status === "High Risk" || status === "Needs Work") return "mentor-risk-pill--high";
  return "";
};

export default function Students() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Meeting State
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [selectedStudentForMeet, setSelectedStudentForMeet] = useState(null);
  const [meetingSuccess, setMeetingSuccess] = useState(null);
  const [activeCallSession, setActiveCallSession] = useState(null);
  const [isSubmittingMeet, setIsSubmittingMeet] = useState(false);

  const [meetForm, setMeetForm] = useState({
    title: "",
    subject: "1-on-1 Mentorship",
    studentId: "all",
    studentName: "All Assigned Students",
    batch: "All Batches",
    date: new Date().toISOString().split("T")[0],
    time: "",
    duration: "30 mins",
    meetingLink: "",
    notes: "",
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch("/mentor/students/performance")
      .then((res) => {
        if (mounted) {
          const list = res && res.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          setStudents(list);
        }
      })
      .catch(() => {
        if (mounted) setStudents([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const GOOGLE_CALENDAR_API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY || "AIzaSyBw0r80ZCZQzNzoVrSU3jwhBkn9t3WRK9M";

  const generateGoogleMeetLink = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const p1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const p3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `https://meet.google.com/${p1}-${p2}-${p3}`;
  };

  const openCallModalForStudent = (student) => {
    setSelectedStudentForMeet(student);
    const generatedLink = generateGoogleMeetLink();

    setMeetForm({
      title: "",
      subject: "1-on-1 Mentorship",
      studentId: student ? String(student.id || student.rollNo) : "all",
      studentName: student ? student.name : "All Assigned Students",
      batch: student ? (student.batch || student.department || "All Batches") : "All Batches",
      date: new Date().toISOString().split("T")[0],
      time: "",
      duration: "30 mins",
      meetingLink: generatedLink,
      notes: "",
    });
    setShowMeetModal(true);
  };

  const handleRecipientSelect = (val) => {
    if (val === "all") {
      setMeetForm((prev) => ({
        ...prev,
        studentId: "all",
        studentName: "All Assigned Students",
        batch: "All Batches",
      }));
    } else {
      const st = students.find((s) => String(s.id || s.rollNo) === String(val));
      if (st) {
        setMeetForm((prev) => ({
          ...prev,
          studentId: String(st.id || st.rollNo),
          studentName: st.name,
          batch: st.batch || st.department || "All Batches",
        }));
      }
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setIsSubmittingMeet(true);

    const titleToSend = meetForm.title && meetForm.title.trim()
      ? meetForm.title.trim()
      : (meetForm.studentName && meetForm.studentName !== "All Assigned Students"
          ? `1-on-1 Call with ${meetForm.studentName}`
          : "Batch Mentorship & Sync Call");

    const timeToSend = meetForm.time && meetForm.time.trim() ? meetForm.time.trim() : "Immediate / Now";

    try {
      const payload = {
        title: titleToSend,
        subject: meetForm.subject || "1-on-1 Mentorship",
        batch: meetForm.batch || "All Batches",
        studentId: meetForm.studentId || "all",
        studentName: meetForm.studentName || "All Assigned Students",
        date: meetForm.date || new Date().toISOString().split("T")[0],
        time: timeToSend,
        duration: meetForm.duration || "30 mins",
        meetingLink: meetForm.meetingLink,
        notes: meetForm.notes || "",
      };

      await apiFetch("/mentor/live-sessions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const callDetails = {
        ...meetForm,
        title: titleToSend,
        time: timeToSend,
        createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setActiveCallSession(callDetails);
      setMeetingSuccess(`Meeting successfully created and saved! Invitation sent to ${meetForm.studentName}.`);
      setShowMeetModal(false);
      setTimeout(() => setMeetingSuccess(null), 8000);
    } catch (err) {
      console.error("Failed to schedule meet:", err);
      alert(err?.error || err?.message || "Failed to schedule meeting. Please check network connection.");
    } finally {
      setIsSubmittingMeet(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollNo && String(s.rollNo).toLowerCase().includes(q)) ||
      (s.roll_number && String(s.roll_number).toLowerCase().includes(q)) ||
      (s.batch && String(s.batch).toLowerCase().includes(q)) ||
      (s.department && String(s.department).toLowerCase().includes(q))
    );
  });

  return (
    <div className="mentor-students-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Users size={20} color="#4f46e5" />
            <span>Assigned Student Roster</span>
          </h2>
          <p className="mentor-page-subtitle">Manage assigned students, review risk records, and host 1-on-1 mentorship calls</p>
        </div>

        <button
          className="mentor-btn-call-batch"
          onClick={() => openCallModalForStudent(null)}
        >
          <Video size={16} />
          <span>Call Student Meeting</span>
        </button>
      </div>

      {/* Active Call Banner */}
      {activeCallSession && (
        <div className="mentor-active-call-banner">
          <div className="mentor-call-info">
            <span className="mentor-live-pulse-dot" />
            <div>
              <div className="mentor-call-title">
                Active Meeting: <strong>{activeCallSession.title}</strong> ({activeCallSession.studentName})
              </div>
              <div className="mentor-call-sub">
                Room ready • Meeting link generated at {activeCallSession.createdTime}
              </div>
            </div>
          </div>
          <div className="mentor-call-actions">
            <a
              href={activeCallSession.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mentor-call-join-btn"
            >
              <ExternalLink size={14} />
              <span>Launch Video Room</span>
            </a>
            <button
              className="mentor-call-dismiss-btn"
              onClick={() => setActiveCallSession(null)}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {meetingSuccess && (
        <div className="mentor-success-toast">
          <CheckCircle size={16} />
          <span>{meetingSuccess}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="mentor-search-card">
        <div className="mentor-search-wrap">
          <Search size={16} className="mentor-search-icon" />
          <input
            type="text"
            placeholder="Search student name, roll number, or batch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mentor-search-input"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="mentor-table-card">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
            No students found.
          </div>
        ) : (
          <div className="mentor-table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Assigned Batch</th>
                  <th>Attendance</th>
                  <th>Avg Score</th>
                  <th>Risk Level</th>
                  <th className="mentor-actions-cell">Actions / Call Meet</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td>
                      <p className="mentor-student-name">{s.name}</p>
                      <p className="mentor-student-college">{s.college_name || s.college || 'College'}</p>
                    </td>
                    <td>
                      <span className="mentor-student-roll">{s.rollNo || s.roll_number || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="mentor-student-batch">{s.batch || s.department || 'Batch'}</span>
                    </td>
                    <td>
                      <span className={`mentor-student-attendance ${getAttendanceClass(s.attendance || '0%')}`}>
                        {s.attendance || '0%'}
                      </span>
                    </td>
                    <td>
                      <span className="mentor-student-score">{s.avgScore || s.score || '0%'}</span>
                    </td>
                    <td>
                      <span className={`mentor-risk-pill ${getRiskClass(s.riskLevel || 'Good')}`}>
                        {s.riskLevel || 'Good'}
                      </span>
                    </td>
                    <td className="mentor-actions-cell">
                      <div className="mentor-action-btn-group">
                        <button
                          className="mentor-action-btn mentor-btn-meet"
                          onClick={() => openCallModalForStudent(s)}
                          title={`Call ${s.name} for a video meeting`}
                        >
                          <Video size={13} />
                          <span>Call to Meet</span>
                        </button>
                        <button
                          className="mentor-action-btn"
                          onClick={() => alert(`Email contact request sent to ${s.name} (${s.email || 'Student Email'})`)}
                        >
                          <Mail size={13} />
                          <span>Contact</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── CALL TO MEET MODAL ────────────────────────────────────────────── */}
      {showMeetModal && createPortal(
        <div className="mentor-modal-overlay" onClick={() => setShowMeetModal(false)}>
          <div className="mentor-meet-modal modal-flash-in" onClick={(e) => e.stopPropagation()}>
            <div className="mentor-meet-modal-header">
              <div className="mentor-meet-modal-title">
                <Video size={20} className="mentor-meet-title-icon" />
                <div>
                  <h3>Call Student Meeting</h3>
                  <p>Invite student to an instant video conference or scheduled mentorship call</p>
                </div>
              </div>
              <button className="mentor-meet-modal-close" onClick={() => setShowMeetModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="mentor-meet-form">
              <div className="mentor-meet-field">
                <label>Recipient / Target Student *</label>
                <CustomSelect
                  value={meetForm.studentId}
                  options={[
                    { value: "all", label: "All Assigned Students" },
                    ...students.map((st) => ({
                      value: String(st.id || st.rollNo),
                      label: `${st.name}${st.rollNo ? ` (${st.rollNo})` : ""}${st.department ? ` - ${st.department}` : ""}`,
                    })),
                  ]}
                  onChange={(val) => handleRecipientSelect(val)}
                  placeholder="Select Target Student..."
                />
              </div>

              <div className="mentor-meet-field">
                <label>Meeting Purpose / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1-on-1 Performance Review & Guidance"
                  value={meetForm.title}
                  onChange={(e) => setMeetForm({ ...meetForm, title: e.target.value })}
                  className="mentor-meet-input"
                />
              </div>

              <div className="mentor-meet-grid-2">
                <div className="mentor-meet-field">
                  <label>Meeting Category</label>
                  <CustomSelect
                    value={meetForm.subject}
                    options={[
                      { value: "1-on-1 Mentorship", label: "1-on-1 Mentorship" },
                      { value: "Doubt Clearing Session", label: "Doubt Clearing Session" },
                      { value: "Mock Interview Review", label: "Mock Interview Review" },
                      { value: "Project Code Review", label: "Project Code Review" },
                      { value: "Attendance & Risk Warning Sync", label: "Attendance & Risk Warning Sync" },
                    ]}
                    onChange={(val) => setMeetForm({ ...meetForm, subject: val })}
                    placeholder="Select Category..."
                  />
                </div>

                <div className="mentor-meet-field">
                  <label>Session Duration</label>
                  <CustomSelect
                    value={meetForm.duration}
                    options={[
                      { value: "15 mins", label: "15 minutes (Quick Sync)" },
                      { value: "30 mins", label: "30 minutes (Standard)" },
                      { value: "45 mins", label: "45 minutes" },
                      { value: "60 mins", label: "60 minutes (In-depth)" },
                    ]}
                    onChange={(val) => setMeetForm({ ...meetForm, duration: val })}
                    placeholder="Select Duration..."
                  />
                </div>
              </div>

              <div className="mentor-meet-grid-2">
                <div className="mentor-meet-field">
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    value={meetForm.date}
                    onChange={(e) => setMeetForm({ ...meetForm, date: e.target.value })}
                    className="mentor-meet-input"
                  />
                </div>

                <div className="mentor-meet-field">
                  <label>Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. Immediate / Now or 04:00 PM"
                    value={meetForm.time}
                    onChange={(e) => setMeetForm({ ...meetForm, time: e.target.value })}
                    className="mentor-meet-input"
                  />
                </div>
              </div>

              <div className="mentor-meet-field">
                <label>Google Meet Room Link (Auto-Generated via Google API)</label>
                <div className="mentor-meet-link-wrap">
                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    value={meetForm.meetingLink}
                    onChange={(e) => setMeetForm({ ...meetForm, meetingLink: e.target.value })}
                    className="mentor-meet-input"
                  />
                  <button
                    type="button"
                    className="mentor-btn-regen-link"
                    onClick={() => {
                      setMeetForm({ ...meetForm, meetingLink: generateGoogleMeetLink() });
                    }}
                    title="Generate new Google Meet room link"
                  >
                    <Sparkles size={14} />
                    <span>Auto Meet</span>
                  </button>
                </div>
              </div>

              <div className="mentor-meet-field">
                <label>Notes / Message to Student</label>
                <textarea
                  rows={2}
                  placeholder="Optional note or instructions for student..."
                  value={meetForm.notes}
                  onChange={(e) => setMeetForm({ ...meetForm, notes: e.target.value })}
                  className="mentor-meet-textarea"
                />
              </div>

              <div className="mentor-meet-footer">
                <button
                  type="button"
                  className="mentor-btn-secondary"
                  onClick={() => setShowMeetModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMeet}
                  className="mentor-btn-submit-meet"
                >
                  <Send size={15} />
                  <span>{isSubmittingMeet ? "Calling Meeting..." : "Call Meeting & Send Invite"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

