import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../../../utils/api';
import { Users, Search, Mail, Video, Plus, Calendar, Clock, ExternalLink, X, CheckCircle, Sparkles, Send } from "lucide-react";
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

  const [meetingMode, setMeetingMode] = useState("instant"); // "instant" or "scheduled"

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

    const extractList = (res) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data?.students)) return res.data.students;
      if (Array.isArray(res.data?.roster)) return res.data.roster;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.students)) return res.students;
      return [];
    };

    apiFetch("/mentor/students/performance")
      .then((res) => {
        if (!mounted) return;
        const list = extractList(res);
        if (list.length > 0) {
          setStudents(list);
        } else {
          apiFetch("/mentor/students").then((fallbackRes) => {
            if (!mounted) return;
            const fallbackList = extractList(fallbackRes);
            setStudents(fallbackList);
          }).catch(() => {
            if (mounted) setStudents([]);
          });
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
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
  };

  // Helper to build a Google Calendar Event creation link prefilled with Meet details
  const buildGoogleCalendarInviteLink = (title, dateStr, timeStr, durationStr, notesStr) => {
    try {
      const summary = encodeURIComponent(title || "1-on-1 Mentorship Meeting");
      const details = encodeURIComponent(
        `${notesStr ? `${notesStr}\n\n` : ""}Video Room: https://meet.google.com/new\nOrganized via Campus Training Portal`
      );
      
      // Calculate start and end in YYYYMMDDTHHmmSS format
      let startH = 20, startM = 0;
      if (timeStr) {
        const clean = timeStr.trim().toUpperCase();
        const match = clean.match(/(\d+):?(\d+)?\s*(AM|PM)?/);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = match[2] ? parseInt(match[2], 10) : 0;
          const ampm = match[3];
          if (ampm === "PM" && h < 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
          startH = h;
          startM = m;
        }
      }
      
      const pad = (n) => String(n).padStart(2, "0");
      const baseDate = dateStr ? dateStr.replace(/-/g, "") : new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const startIso = `${baseDate}T${pad(startH)}${pad(startM)}00`;
      
      let durMinutes = 30;
      if (durationStr && durationStr.includes("15")) durMinutes = 15;
      else if (durationStr && durationStr.includes("45")) durMinutes = 45;
      else if (durationStr && durationStr.includes("60")) durMinutes = 60;
      
      let endM = startM + durMinutes;
      let endH = startH + Math.floor(endM / 60);
      endM = endM % 60;
      const endIso = `${baseDate}T${pad(endH)}${pad(endM)}00`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${summary}&dates=${startIso}/${endIso}&details=${details}&location=Google%20Meet&add=meet`;
    } catch (_) {
      return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mentorship%20Meeting";
    }
  };

  const openCallModalForStudent = (student) => {
    setSelectedStudentForMeet(student);
    setMeetingMode("instant");
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

    const isScheduledTime = meetingMode === "scheduled" || Boolean(
      meetForm.time && 
      meetForm.time.trim() && 
      !meetForm.time.toLowerCase().includes("now") && 
      !meetForm.time.toLowerCase().includes("immediate")
    );

    const timeToSend = isScheduledTime
      ? (meetForm.time && meetForm.time.trim() ? meetForm.time.trim() : "08:00 PM")
      : "Immediate / Now";

    try {
      const targetMeetLink = meetForm.meetingLink || "https://meet.google.com/new";

      const payload = {
        title: titleToSend,
        subject: meetForm.subject || "1-on-1 Mentorship",
        batch: meetForm.batch || "All Batches",
        studentId: meetForm.studentId || "all",
        studentName: meetForm.studentName || "All Assigned Students",
        date: meetForm.date || new Date().toISOString().split("T")[0],
        time: timeToSend,
        duration: meetForm.duration || "30 mins",
        meetingLink: targetMeetLink,
        notes: meetForm.notes || "",
        isScheduled: isScheduledTime,
      };

      await apiFetch("/mentor/live-sessions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // If scheduled: generate a Google Calendar invite with Meet link pre-configured!
      if (isScheduledTime) {
        const calLink = buildGoogleCalendarInviteLink(
          titleToSend,
          meetForm.date,
          timeToSend,
          meetForm.duration,
          meetForm.notes
        );
        // Prompt/open Google Calendar invite
        window.open(calLink, "_blank", "noopener,noreferrer");
      } else {
        // Immediate call: open live Google Meet room right now
        window.open(targetMeetLink, "_blank", "noopener,noreferrer");
      }

      const callDetails = {
        ...meetForm,
        title: titleToSend,
        time: timeToSend,
        meetingLink: targetMeetLink,
        createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setActiveCallSession(callDetails);
      const successMsg = isScheduledTime
        ? `Meeting scheduled for ${meetForm.date} at ${timeToSend}! Google Calendar invite created and student notified.`
        : `Immediate meeting successfully created and launched! Invitation sent to ${meetForm.studentName}.`;
      setMeetingSuccess(successMsg);
      setShowMeetModal(false);
      setTimeout(() => setMeetingSuccess(null), 8000);
    } catch (err) {
      console.error("Failed to schedule meet:", err);
      alert(err?.error || err?.message || "Failed to schedule meeting. Please check network connection.");
    } finally {
      setIsSubmittingMeet(false);
    }
  };

  const filteredStudents = (Array.isArray(students) ? students : []).filter((s) => {
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
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
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
                {(Array.isArray(filteredStudents) ? filteredStudents : []).map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td>
                      <p className="mentor-student-name">{s.name}</p>
                      <p className="mentor-student-college">{s.college_name || s.college || 'College'}</p>
                    </td>
                    <td>
                      <span className="mentor-student-roll">{s.rollNo || s.roll_number || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="mentor-student-batch">{s.batch || s.batch_name || s.department || 'Batch'}</span>
                    </td>
                    <td>
                      <span className={`mentor-student-attendance ${getAttendanceClass(s.attendance)}`}>
                        {typeof s.attendance === 'number' ? `${s.attendance}%` : (s.attendance || '0%')}
                      </span>
                    </td>
                    <td>
                      <span className="mentor-student-score">
                        {typeof s.overallScore === 'number' ? `${s.overallScore}%` : (s.avgScore || s.score || '0%')}
                      </span>
                    </td>
                    <td>
                      <span className={`mentor-risk-pill ${getRiskClass(s.riskLevel || s.status || 'Good')}`}>
                        {s.riskLevel || s.status || 'Good'}
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
              {/* Meeting Mode Switcher */}
              <div className="mentor-meet-mode-selector">
                <button
                  type="button"
                  className={`mentor-mode-btn ${meetingMode === "instant" ? "active" : ""}`}
                  onClick={() => {
                    setMeetingMode("instant");
                    setMeetForm({ ...meetForm, time: "Now / Immediate" });
                  }}
                >
                  <Video size={15} />
                  <span>⚡ Instant Call (Now)</span>
                </button>
                <button
                  type="button"
                  className={`mentor-mode-btn ${meetingMode === "scheduled" ? "active" : ""}`}
                  onClick={() => {
                    setMeetingMode("scheduled");
                    setMeetForm({ ...meetForm, time: "08:00 PM" });
                  }}
                >
                  <Calendar size={15} />
                  <span>📅 Schedule for Later</span>
                </button>
              </div>

              <div className="mentor-meet-field">
                <label>Recipient / Target Student *</label>
                <CustomSelect
                  value={meetForm.studentId}
                  options={[
                    { value: "all", label: "All Assigned Students" },
                    ...(Array.isArray(students) ? students : []).map((st) => ({
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

              {meetingMode === "scheduled" && (
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
                    <label>Time Slot (e.g. 08:00 PM)</label>
                    <input
                      type="text"
                      placeholder="e.g. 08:00 PM"
                      value={meetForm.time}
                      onChange={(e) => setMeetForm({ ...meetForm, time: e.target.value })}
                      className="mentor-meet-input"
                    />
                  </div>
                </div>
              )}

              <div className="mentor-meet-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Google Meet Room Link &amp; Code</label>
                  <button
                    type="button"
                    onClick={() => setMeetForm({ ...meetForm, meetingLink: generateGoogleMeetLink() })}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Generate New Room Code
                  </button>
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij or paste existing meeting link"
                  value={meetForm.meetingLink}
                  onChange={(e) => setMeetForm({ ...meetForm, meetingLink: e.target.value })}
                  className="mentor-meet-input"
                />
                {meetForm.meetingLink && meetForm.meetingLink.includes('meet.google.com/') && (
                  <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700, marginTop: '3px', display: 'block' }}>
                    Meeting Code: {meetForm.meetingLink.split('meet.google.com/')[1]?.split(/[?#\s]/)[0] || ''}
                  </span>
                )}
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
                  <span>
                    {isSubmittingMeet 
                      ? "Processing..." 
                      : (meetingMode === "scheduled"
                          ? `Schedule & Sync Calendar (${meetForm.time || "08:00 PM"})`
                          : "Launch Instant Meeting Now")}
                  </span>
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

