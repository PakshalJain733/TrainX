import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { ClipboardCheck, Plus, Award, UserCheck } from 'lucide-react';
import { getSharedDrives, EVENTS } from '../../../utils/sharedStore';
import '../Styles/SkillGaps.css';
import '../Styles/MockDrives.css';

export default function MentorMockDrives() {
  const [drives, setDrives] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMentorDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/drives');
      const data = res.data?.data || {};
      let list = Array.isArray(data) ? data : (data.drives || [
        { id: 1, name: 'TCS Digital Mock Placement Drive 2026', date: '2026-09-15', status: 'Active Today', registered: 45, passCutoff: '38 (84%)' },
        { id: 2, name: 'Infosys SP & DSE Mock Hiring Drive', date: '2026-09-20', status: 'Upcoming', registered: 52, passCutoff: '41 (78%)' }
      ]);
      const shared = await getSharedDrives([]);
      const existingIds = new Set(list.map(d => String(d.id)));
      const sharedMapped = shared
        .filter(s => !existingIds.has(String(s.id)))
        .map(s => ({
          id: s.id,
          name: s.title || s.name,
          date: s.data?.date || '2026-10-15',
          status: s.status || 'Upcoming',
          registered: 0,
          passCutoff: s.data?.cutoffScore || '75%'
        }));
      setDrives([...sharedMapped, ...list]);
      setStudentResults(data.studentResults || [
        { student_name: 'Ganesh Shinde', roll: '2026COMP042', aptitude: 85, coding: 90, interview: 80, final: 86, status: 'Completed' },
        { student_name: 'Aarav Sharma', roll: '2026COMP001', aptitude: 95, coding: 96, interview: 94, final: 95, status: 'Completed' },
        { student_name: 'Ananya Verma', roll: '2026ECS012', aptitude: 90, coding: 85, interview: 88, final: 87, status: 'Completed' }
      ]);
    } catch (err) {
      const shared = await getSharedDrives([]);
      const fallbackList = [
        { id: 1, name: 'TCS Digital Mock Placement Drive 2026', date: '2026-09-15', status: 'Active Today', registered: 45, passCutoff: '38 (84%)' },
        { id: 2, name: 'Infosys SP & DSE Mock Hiring Drive', date: '2026-09-20', status: 'Upcoming', registered: 52, passCutoff: '41 (78%)' }
      ];
      if (shared.length > 0) {
        const sharedMapped = shared.map(s => ({
          id: s.id,
          name: s.title || s.name,
          date: s.data?.date || '2026-10-15',
          status: 'Upcoming',
          registered: 0,
          passCutoff: s.data?.cutoffScore || '75%'
        }));
        setDrives([...sharedMapped, ...fallbackList]);
      } else {
        setDrives(fallbackList);
      }
      setStudentResults([
        { student_name: 'Ganesh Shinde', roll: '2026COMP042', aptitude: 85, coding: 90, interview: 80, final: 86, status: 'Completed' },
        { student_name: 'Aarav Sharma', roll: '2026COMP001', aptitude: 95, coding: 96, interview: 94, final: 95, status: 'Completed' },
        { student_name: 'Ananya Verma', roll: '2026ECS012', aptitude: 90, coding: 85, interview: 88, final: 87, status: 'Completed' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorDrives();
    const handleUpdate = () => fetchMentorDrives();
    window.addEventListener(EVENTS.DRIVE_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENTS.DRIVE_UPDATED, handleUpdate);
  }, []);

  const getStatusClass = (status) => {
    if (status === 'Active Today') return 'mentor-mockdrive-status--active';
    if (status === 'Upcoming') return 'mentor-mockdrive-status--upcoming';
    return 'mentor-mockdrive-status--past';
  };

  return (
    <div className="mentor-mockdrives-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <ClipboardCheck size={20} color="#4f46e5" />
            <span>Placement Mock Drives & Student Results</span>
          </h2>
          <p className="mentor-page-subtitle">Track assigned students' section scores (Aptitude, Coding, AI Interview) & final scores</p>
        </div>

        <button className="mentor-btn-primary">
          <Plus size={16} />
          <span>Nominate Students for Drive</span>
        </button>
      </div>

      <div className="mentor-mockdrives-grid">
        {drives.map((d) => (
          <div key={d.id} className="mentor-mockdrive-card">
            <div className="mentor-mockdrive-header">
              <span className={`mentor-mockdrive-status ${getStatusClass(d.status)}`}>
                {d.status}
              </span>
              <span className="mentor-mockdrive-date">{d.date}</span>
            </div>

            <h3 className="mentor-mockdrive-title">{d.name || d.title}</h3>

            <div className="mentor-mockdrive-stats">
              <div className="mentor-mockdrive-stat-row">
                <span>Registered Students:</span>
                <span className="mentor-mockdrive-stat-val">{d.registered || 45}</span>
              </div>
              <div className="mentor-mockdrive-stat-row">
                <span>Pass Cutoff Criteria:</span>
                <span className="mentor-mockdrive-stat-val--green">{d.passCutoff || '80%'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student Drive Performance Table */}
      <div className="mentor-mockdrives-table-card">
        <h3 className="mentor-section-title"><UserCheck size={18} color="#4f46e5" /> Assigned Student Drive Results</h3>
        <table className="mentor-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>PRN / Roll</th>
              <th>Aptitude (30%)</th>
              <th>Coding (40%)</th>
              <th>AI Interview (30%)</th>
              <th>Final Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {studentResults.map((sr, idx) => (
              <tr key={idx}>
                <td><strong>{sr.student_name}</strong></td>
                <td>{sr.roll}</td>
                <td><span className="score-badge blue">{sr.aptitude}%</span></td>
                <td><span className="score-badge purple">{sr.coding}%</span></td>
                <td><span className="score-badge green">{sr.interview}%</span></td>
                <td><strong><span className="score-badge highlight">{sr.final}%</span></strong></td>
                <td><span className="mentor-mockdrive-status mentor-mockdrive-status--active">{sr.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
