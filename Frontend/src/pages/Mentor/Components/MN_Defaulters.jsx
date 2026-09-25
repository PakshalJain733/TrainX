import React, { useState } from 'react';
import { mentorDefaulters as initialMentorDefaulters } from '../../../data/mentorMockData';
import { AlertCircle, Bell, Search, Filter, ShieldAlert, CheckCircle2, UserX } from 'lucide-react';
import CustomSelect from '../../../components/ui/CustomSelect';
import "../Styles/MN_Defaulters.css";

const DEFAULT_DEFAULTERS = [];

export default function Defaulters() {
  const listToUse = (initialMentorDefaulters && initialMentorDefaulters.length > 0)
    ? initialMentorDefaulters 
    : DEFAULT_DEFAULTERS;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [defaultersList, setDefaultersList] = useState(listToUse);
  const [notificationStatus, setNotificationStatus] = useState(null);

  const filteredDefaulters = defaultersList.filter((student) => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.batch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = selectedRisk === 'All' || (student.riskLevel || '').includes(selectedRisk);

    return matchesSearch && matchesRisk;
  });

  const handleNotifyStudent = async (student) => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/interventions/warn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentEmail: student.email || `${student.rollNo}@campus.edu`,
          studentName: student.name,
          reason: student.reason
        })
      });
      if (!res.ok) throw new Error('Failed to send email');
      setNotificationStatus(`Warning email successfully sent to ${student.name}`);
    } catch (err) {
      console.error(err);
      setNotificationStatus(`Failed to send email to ${student.name}`);
    }
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  const handleNotifyAll = async () => {
    try {
      for (const student of filteredDefaulters) {
        await fetch('http://localhost:5000/api/v1/interventions/warn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            studentEmail: student.email || `${student.rollNo}@campus.edu`,
            studentName: student.name,
            reason: student.reason
          })
        });
      }
      setNotificationStatus(`Warning emails dispatched to all ${filteredDefaulters.length} defaulter students.`);
    } catch (err) {
      console.error(err);
      setNotificationStatus('Error dispatching some emails.');
    }
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  return (
    <div className="mentor-defaulters-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title mentor-defaulter-header-title">
            <AlertCircle size={22} color="#e11d48" />
            <span>Defaulters & Performance Risk Queue</span>
          </h2>
          <p className="mentor-page-subtitle mentor-defaulter-header-sub">
            Track, filter, and alert students flagged for low attendance (&lt;75%), missed assignments, or test score drops.
          </p>
        </div>

        <button 
          className="mentor-btn-danger" 
          onClick={handleNotifyAll}
        >
          <Bell size={16} />
          <span>Send Warning Alert to All</span>
        </button>
      </div>

      {notificationStatus && (
        <div className="mentor-defaulter-alert-banner">
          <CheckCircle2 size={18} color="#047857" />
          <span>{notificationStatus}</span>
        </div>
      )}

      <div className="mentor-defaulter-card">
        {/* Controls Header */}
        <div className="mentor-defaulter-controls">
          <div className="mentor-defaulter-search-wrap">
            <Search 
              size={18} 
              className="mentor-defaulter-search-icon" 
            />
            <input 
              type="text" 
              placeholder="Search defaulters by student name, roll number, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mentor-defaulter-search-input"
            />
          </div>

          <div className="mentor-defaulter-filter-wrap">
            <Filter size={16} color="#64748b" />
            <CustomSelect
              value={selectedRisk}
              onChange={(val) => setSelectedRisk(val)}
              options={[
                { label: "All Risk Levels", value: "All" },
                { label: "High Risk", value: "High Risk" },
                { label: "Medium Risk", value: "Medium Risk" }
              ]}
              className="mentor-defaulter-select"
            />
          </div>
        </div>

        <div className="mentor-table-responsive">
          <table className="mentor-defaulter-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Batch</th>
                <th>Attendance</th>
                <th>Missed Assignments</th>
                <th>Last Test Score</th>
                <th>Defaulter Reason</th>
                <th>Risk Level</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefaulters.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <UserX size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>No defaulter students match your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredDefaulters.map((d) => {
                  const isHigh = (d.riskLevel || '').includes('High');
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{d.name}</td>
                      <td style={{ color: '#475569', fontWeight: 500 }}>{d.rollNo}</td>
                      <td style={{ color: '#334155', fontWeight: 500 }}>{d.batch}</td>
                      <td style={{ color: '#e11d48', fontWeight: 800 }}>{d.attendance}</td>
                      <td style={{ color: '#d97706', fontWeight: 700 }}>
                        {typeof d.missedAssignments === 'number' ? `${d.missedAssignments} missed` : d.missedAssignments}
                      </td>
                      <td style={{ color: '#0f172a', fontWeight: 800 }}>{d.lastTestScore}</td>
                      <td style={{ color: '#be123c', fontWeight: 600, maxWidth: '280px', lineHeight: 1.4 }}>{d.reason}</td>
                      <td>
                        <span className={`mentor-defaulter-risk-badge ${isHigh ? 'mentor-defaulter-risk-badge--high' : 'mentor-defaulter-risk-badge--medium'}`}>
                          <ShieldAlert size={13} />
                          {d.riskLevel || 'High Risk'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleNotifyStudent(d)}
                          className="mentor-notify-btn"
                        >
                          Notify Student
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


