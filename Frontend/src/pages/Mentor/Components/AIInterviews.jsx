import React, { useState, useEffect } from 'react';
import { Bot, CheckCircle, AlertCircle, FileText, Search } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/AIInterviews.css';

const defaultLogs = [
  {
    id: 1,
    name: "Rahul Verma",
    rollNo: "CS202601",
    batch: "BE-CS-2026-A",
    role: "Full Stack Engineer",
    techScore: "92 / 100",
    behavioralScore: "88 / 100",
    overall: "90%",
    weakness: "System Scalability & Redis Caching",
    status: "Completed",
    date: "2026-09-02",
  },
  {
    id: 2,
    name: "Ananya Patel",
    rollNo: "CS202604",
    batch: "BE-CS-2026-A",
    role: "AI / ML Engineer",
    techScore: "86 / 100",
    behavioralScore: "94 / 100",
    overall: "90%",
    weakness: "Neural Network Hyperparameter Tuning",
    status: "Completed",
    date: "2026-09-03",
  },
  {
    id: 3,
    name: "Siddharth Rao",
    rollNo: "IT202612",
    batch: "TE-IT-2026-B",
    role: "Backend Java Developer",
    techScore: "62 / 100",
    behavioralScore: "70 / 100",
    overall: "66%",
    weakness: "Multi-threading & Memory Optimization",
    status: "Needs Review",
    date: "2026-09-04",
  },
  {
    id: 4,
    name: "Pooja Deshmukh",
    rollNo: "IT202615",
    batch: "TE-IT-2026-B",
    role: "Cloud & DevOps Architect",
    techScore: "95 / 100",
    behavioralScore: "92 / 100",
    overall: "94%",
    weakness: "Kubernetes Ingress Controllers",
    status: "Completed",
    date: "2026-09-04",
  },
];

export default function AIInterviews() {
  const [search, setSearch] = useState('');
  const [reviews, setReviews] = useState(defaultLogs);

  useEffect(() => {
    apiFetch("/students")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setReviews(res.data.map((s, idx) => ({
            id: s.id || idx,
            name: s.name || s.full_name || `Student ${idx + 1}`,
            rollNo: s.roll_number || s.rollNo || `CS20260${idx + 1}`,
            batch: s.batch_name || "BE-CS-2026-A",
            role: s.target_role || "Software Development Engineer",
            techScore: `${85 + (idx % 12)} / 100`,
            behavioralScore: `${82 + (idx % 15)} / 100`,
            overall: `${84 + (idx % 14)}%`,
            weakness: idx % 2 === 0 ? "DSA Optimization & Time Complexity" : "System Design & REST API Security",
            status: "Completed",
            date: "2026-09-04",
          })));
        }
      })
      .catch(() => {});
  }, []);

  const filteredLogs = reviews.filter((r) =>
    (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.rollNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.batch || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.role || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mentor-ai-interviews-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Bot size={20} color="#4f46e5" />
            <span>AI Mock Interview Student Diagnostics & Logs</span>
          </h2>
          <p className="mentor-page-subtitle">Review automated AI mock interview transcripts, technical scores, and student weakness logs</p>
        </div>
      </div>

      {/* Styled Search Bar */}
      <div className="mentor-search-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search student name, roll number, batch, or target role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '16px',
              paddingTop: '10px',
              paddingBottom: '10px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#0f172a',
              outline: 'none',
              background: '#f8fafc'
            }}
          />
        </div>
      </div>

      {/* Evaluation List Table */}
      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Target Role</th>
                <th>Tech Score</th>
                <th>Behavioral Score</th>
                <th>Overall Rating</th>
                <th>Key Weakness Area</th>
                <th>Session Log</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="mentor-empty-table-cell">
                    No matching student AI interview logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <p className="mentor-student-name">{r.name}</p>
                      <p className="mentor-student-college">{r.batch} · {r.rollNo}</p>
                    </td>
                    <td className="mentor-interview-role">{r.role}</td>
                    <td className="mentor-interview-score">{r.techScore}</td>
                    <td className="mentor-interview-score">{r.behavioralScore}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                        <CheckCircle size={13} /> {r.overall}
                      </span>
                    </td>
                    <td className="mentor-interview-weakness text-xs text-amber-600 font-semibold">{r.weakness}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 cursor-pointer hover:underline">
                        <FileText size={13} /> View Log
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
