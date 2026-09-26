import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Search,
  Filter,
  TrendingUp,
  Award,
  AlertCircle,
  FileText,
  Eye,
  X,
  CheckCircle2,
  BrainCircuit,
  UserCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/MN_AIInterviews.css';

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const MOCK_MENTEE_INTERVIEWS = [
  {
    id: 101,
    studentName: 'Harshad Nandurkar',
    rollNo: 'CS2024001',
    batch: 'CS-2024 Alpha',
    targetRole: 'Full Stack Developer',
    topic: 'React & Node.js',
    score: 88,
    grade: 'Excellent',
    status: 'Completed',
    feedback:
      'Demonstrated excellent command over React hooks, asynchronous state flow, and Express REST API architecture. Answered architectural questions with clear, well-structured reasoning. Weakness: Minor pause on database indexing best practices.',
    date: '2026-09-24',
  },
  {
    id: 102,
    studentName: 'Aditya Patil',
    rollNo: 'CS2024014',
    batch: 'CS-2024 Alpha',
    targetRole: 'Software Engineer',
    topic: 'Data Structures & Algorithms',
    score: 76,
    grade: 'Good',
    status: 'Completed',
    feedback:
      'Understands recursive binary tree traversal and hash map lookups. Offered optimal time complexity solution for 2-Sum problem. Suggested optimization: Practice minimizing auxiliary space complexity on graph BFS solutions.',
    date: '2026-09-22',
  },
  {
    id: 103,
    studentName: 'Sneha Deshmukh',
    rollNo: 'IT2024008',
    batch: 'IT-2024 Beta',
    targetRole: 'Backend Developer',
    topic: 'SQL / Databases',
    score: 62,
    grade: 'Good',
    status: 'Completed',
    feedback:
      'Solid handle on basic SQL joins and table normalization concepts. Struggled slightly with complex window functions and ACID transaction isolation levels. Recommended: Additional practice on DB indexing strategies.',
    date: '2026-09-21',
  },
  {
    id: 104,
    studentName: 'Rohan Kulkarni',
    rollNo: 'CS2024032',
    batch: 'CS-2024 Alpha',
    targetRole: 'DevOps Engineer',
    topic: 'Docker & CI/CD',
    score: 54,
    grade: 'Needs Work',
    status: 'Completed',
    feedback:
      'Understands container concepts at a basic level, but needs improvement in writing multi-stage Dockerfiles and configuring GitHub Actions deployment pipelines. Mentorship recommendation: Assign foundational hands-on lab.',
    date: '2026-09-19',
  },
  {
    id: 105,
    studentName: 'Priya Sharma',
    rollNo: 'CS2024045',
    batch: 'CS-2024 Beta',
    targetRole: 'Frontend Developer',
    topic: 'JavaScript & CSS Architecture',
    score: 92,
    grade: 'Excellent',
    status: 'Completed',
    feedback:
      'Outstanding candidate performance! Answered deep questions on JavaScript event loops, closures, and microtask queues with high accuracy. Articulated modern CSS Grid and custom property design tokens cleanly.',
    date: '2026-09-18',
  },
];

export default function MN_AIInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/mentor/interviews');
      const payload = unwrap(response);
      if (Array.isArray(payload) && payload.length > 0) {
        setInterviews(payload);
      } else {
        setInterviews(MOCK_MENTEE_INTERVIEWS);
      }
    } catch (err) {
      console.warn('[MN_AIInterviews] Error loading interviews, using fallback:', err);
      setInterviews(MOCK_MENTEE_INTERVIEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const term = search.toLowerCase().trim();
      const nameMatch = (item.studentName || '').toLowerCase().includes(term);
      const rollMatch = (item.rollNo || '').toLowerCase().includes(term);
      const batchMatch = (item.batch || '').toLowerCase().includes(term);
      const searchOk = !term || nameMatch || rollMatch || batchMatch;

      const roleMatch =
        roleFilter === 'ALL' ||
        (item.targetRole || '').toLowerCase().includes(roleFilter.toLowerCase()) ||
        (item.topic || '').toLowerCase().includes(roleFilter.toLowerCase());

      let gradeMatch = true;
      if (gradeFilter === 'EXCELLENT') gradeMatch = item.score >= 80;
      else if (gradeFilter === 'GOOD') gradeMatch = item.score >= 60 && item.score < 80;
      else if (gradeFilter === 'NEEDS_WORK') gradeMatch = item.score < 60;

      return searchOk && roleMatch && gradeMatch;
    });
  }, [interviews, search, roleFilter, gradeFilter]);

  const stats = useMemo(() => {
    const total = interviews.length;
    if (total === 0) return { total: 0, avgScore: 0, topPerformers: 0, needsSupport: 0 };
    const scoreSum = interviews.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
    const avgScore = Math.round((scoreSum / total) * 10) / 10;
    const topPerformers = interviews.filter((i) => (Number(i.score) || 0) >= 80).length;
    const needsSupport = interviews.filter((i) => (Number(i.score) || 0) < 60).length;
    return { total, avgScore, topPerformers, needsSupport };
  }, [interviews]);

  const getScoreBadgeClass = (score) => {
    const val = Number(score) || 0;
    if (val >= 80) return 'mn-ai-score-pill--high';
    if (val >= 60) return 'mn-ai-score-pill--med';
    return 'mn-ai-score-pill--low';
  };

  const getGradeBadgeClass = (score) => {
    const val = Number(score) || 0;
    if (val >= 80) return 'mn-ai-grade-badge--excellent';
    if (val >= 60) return 'mn-ai-grade-badge--good';
    return 'mn-ai-grade-badge--needswork';
  };

  return (
    <div className="mentor-ai-interviews-container">
      {/* Header */}
      <div className="mentor-page-header mentor-ai-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Bot size={22} color="#4f46e5" />
            <span>Mentee AI Interview Progress</span>
          </h2>
          <p className="mentor-page-subtitle">
            Track & evaluate AI mock interview performances, technical scores, and AI feedback for your assigned mentees
          </p>
        </div>
        <div className="mn-ai-header-badge">
          <Sparkles size={14} color="#6366f1" />
          <span>Mentee Analytics Active</span>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="mn-ai-stats-grid">
        <div className="mn-ai-stat-card">
          <div className="mn-ai-stat-icon mn-ai-stat-icon--indigo">
            <FileText size={20} />
          </div>
          <div className="mn-ai-stat-info">
            <span className="mn-ai-stat-label">Total AI Interviews</span>
            <span className="mn-ai-stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="mn-ai-stat-card">
          <div className="mn-ai-stat-icon mn-ai-stat-icon--blue">
            <TrendingUp size={20} />
          </div>
          <div className="mn-ai-stat-info">
            <span className="mn-ai-stat-label">Average Mentee Score</span>
            <span className="mn-ai-stat-value">{stats.avgScore}%</span>
          </div>
        </div>

        <div className="mn-ai-stat-card">
          <div className="mn-ai-stat-icon mn-ai-stat-icon--green">
            <Award size={20} />
          </div>
          <div className="mn-ai-stat-info">
            <span className="mn-ai-stat-label">Top Performers (≥80%)</span>
            <span className="mn-ai-stat-value">{stats.topPerformers}</span>
          </div>
        </div>

        <div className="mn-ai-stat-card">
          <div className="mn-ai-stat-icon mn-ai-stat-icon--rose">
            <AlertCircle size={20} />
          </div>
          <div className="mn-ai-stat-info">
            <span className="mn-ai-stat-label">Needs Support (&lt;60%)</span>
            <span className="mn-ai-stat-value">{stats.needsSupport}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="mn-ai-filter-card">
        <div className="mn-ai-search-box">
          <Search size={16} className="mn-ai-search-icon" />
          <input
            type="text"
            placeholder="Search by mentee name, roll no, or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="mn-ai-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mn-ai-filters-right">
          <div className="mn-ai-filter-item">
            <Filter size={14} color="#64748b" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="ALL">All Roles / Topics</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Full Stack">Full Stack Developer</option>
              <option value="Backend">Backend Developer</option>
              <option value="Frontend">Frontend Developer</option>
              <option value="Data Structures">DSA & Algorithms</option>
              <option value="SQL">SQL & Databases</option>
              <option value="DevOps">DevOps & Cloud</option>
            </select>
          </div>

          <div className="mn-ai-filter-item">
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="ALL">All Grades</option>
              <option value="EXCELLENT">Excellent (≥80%)</option>
              <option value="GOOD">Good (60%-79%)</option>
              <option value="NEEDS_WORK">Needs Work (&lt;60%)</option>
            </select>
          </div>

          <button className="mn-ai-refresh-btn" onClick={fetchInterviews} title="Refresh Mentee Interviews">
            <RefreshCw size={15} className={loading ? 'mentor-ai-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Mentee Interview Results Table */}
      <div className="mn-ai-table-card">
        {loading ? (
          <div className="mn-ai-loading-state">
            <RefreshCw size={24} className="mentor-ai-spin" color="#4f46e5" />
            <span>Loading mentee interview progress...</span>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="mn-ai-empty-state">
            <BrainCircuit size={40} color="#cbd5e1" />
            <h4>No Mentee Interview Records Found</h4>
            <p>No mentee interview sessions match your current search and filter criteria.</p>
          </div>
        ) : (
          <div className="mn-ai-table-wrapper">
            <table className="mn-ai-table">
              <thead>
                <tr>
                  <th>Mentee Student</th>
                  <th>Batch / Roll No</th>
                  <th>Target Role & Topic</th>
                  <th>Overall Score</th>
                  <th>Performance Grade</th>
                  <th>AI Evaluation Summary</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="mn-ai-student-cell">
                        <div className="mn-ai-avatar">
                          {item.studentName ? item.studentName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div className="mn-ai-student-info">
                          <span className="mn-ai-student-name">{item.studentName || 'Student'}</span>
                          <span className="mn-ai-student-sub">{item.studentEmail || 'Mentee'}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="mn-ai-batch-cell">
                        <span className="mn-ai-batch-name">{item.batch || 'Batch A'}</span>
                        <span className="mn-ai-roll-no">{item.rollNo || 'N/A'}</span>
                      </div>
                    </td>

                    <td>
                      <div className="mn-ai-role-cell">
                        <span className="mn-ai-role-title">{item.targetRole || 'Software Engineer'}</span>
                        <span className="mn-ai-topic-tag">{item.topic || 'General Mock'}</span>
                      </div>
                    </td>

                    <td>
                      <div className="mn-ai-score-cell">
                        <span className={`mn-ai-score-pill ${getScoreBadgeClass(item.score)}`}>
                          {item.score}%
                        </span>
                        <div className="mn-ai-score-bar-bg">
                          <div
                            className={`mn-ai-score-bar-fill ${getScoreBadgeClass(item.score)}`}
                            style={{ width: `${Math.min(item.score, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`mn-ai-grade-badge ${getGradeBadgeClass(item.score)}`}>
                        {item.grade || (item.score >= 80 ? 'Excellent' : item.score >= 60 ? 'Good' : 'Needs Work')}
                      </span>
                    </td>

                    <td className="mn-ai-feedback-cell">
                      <p className="mn-ai-feedback-text">
                        {item.feedback || 'Completed AI interview evaluation session.'}
                      </p>
                    </td>

                    <td>
                      <span className="mn-ai-date">{item.date || 'Recent'}</span>
                    </td>

                    <td>
                      <button
                        className="mn-ai-view-btn"
                        onClick={() => setSelectedSession(item)}
                        title="View Detailed AI Evaluation Report"
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Evaluation Detail Modal */}
      {selectedSession && (
        <div className="mn-ai-modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="mn-ai-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mn-ai-modal-header">
              <div className="mn-ai-modal-header-left">
                <div className="mn-ai-modal-avatar">
                  {selectedSession.studentName ? selectedSession.studentName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h3 className="mn-ai-modal-title">{selectedSession.studentName}</h3>
                  <p className="mn-ai-modal-sub">
                    {selectedSession.rollNo} • {selectedSession.batch}
                  </p>
                </div>
              </div>
              <button className="mn-ai-modal-close" onClick={() => setSelectedSession(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="mn-ai-modal-body">
              <div className="mn-ai-modal-meta-grid">
                <div className="mn-ai-meta-item">
                  <span className="mn-ai-meta-label">Target Role</span>
                  <span className="mn-ai-meta-val">{selectedSession.targetRole}</span>
                </div>
                <div className="mn-ai-meta-item">
                  <span className="mn-ai-meta-label">Interview Topic</span>
                  <span className="mn-ai-meta-val">{selectedSession.topic}</span>
                </div>
                <div className="mn-ai-meta-item">
                  <span className="mn-ai-meta-label">Technical Score</span>
                  <span className={`mn-ai-meta-score ${getScoreBadgeClass(selectedSession.score)}`}>
                    {selectedSession.score}%
                  </span>
                </div>
                <div className="mn-ai-meta-item">
                  <span className="mn-ai-meta-label">Grade Status</span>
                  <span className={`mn-ai-grade-badge ${getGradeBadgeClass(selectedSession.score)}`}>
                    {selectedSession.grade}
                  </span>
                </div>
              </div>

              <div className="mn-ai-modal-section">
                <h4>
                  <BrainCircuit size={16} color="#4f46e5" />
                  <span>AI Interviewer Evaluation Report</span>
                </h4>
                <div className="mn-ai-report-box">
                  <p>{selectedSession.feedback}</p>
                </div>
              </div>

              <div className="mn-ai-modal-section">
                <h4>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Mentor Action & Guidance Notes</span>
                </h4>
                <ul className="mn-ai-guidance-list">
                  {selectedSession.score >= 80 ? (
                    <>
                      <li>Mentee demonstrates high technical readiness for live placement rounds.</li>
                      <li>Encourage advanced system design topics and mock behavioral rounds.</li>
                    </>
                  ) : selectedSession.score >= 60 ? (
                    <>
                      <li>Review identified weak topics during weekly 1-on-1 mentorship session.</li>
                      <li>Assign targeted practice coding problems related to {selectedSession.topic}.</li>
                    </>
                  ) : (
                    <>
                      <li>High priority remediation required for core fundamentals in {selectedSession.topic}.</li>
                      <li>Schedule immediate review session and assign prerequisite learning roadmap.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="mn-ai-modal-footer">
              <button className="mn-ai-modal-dismiss-btn" onClick={() => setSelectedSession(null)}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
