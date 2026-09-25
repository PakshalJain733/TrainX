import React, { useState, useEffect } from "react";
import { Trophy, Flame, Medal, Users, RefreshCw, Filter, BookOpen, Brain } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { collegeAPI, departmentAPI } from "../../../services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AD_Leaderboard.css";

const getRankClass = (r) => r === 1 ? "admin-rank-1" : r === 2 ? "admin-rank-2" : r === 3 ? "admin-rank-3" : "";

export default function AdminLeaderboard() {
  const [activeTab, setActiveTab] = useState("overall"); // 'overall' | 'department' | 'batches'
  const [data, setData] = useState({ overall: [], department: [], topBatches: [] });
  const [loading, setLoading] = useState(true);

  // Filters for Department Ranking tab
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  // Sort metric for Overall Ranking tab
  const [sortByMetric, setSortByMetric] = useState("overall"); // 'overall' | 'quiz' | 'interview' | 'coding' | 'attendance'

  useEffect(() => {
    // Load colleges list on mount
    collegeAPI.getColleges()
      .then((res) => {
        if (Array.isArray(res)) setColleges(res);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Fetch departments when college changes
    if (selectedCollege) {
      departmentAPI.getDepartments(selectedCollege)
        .then((res) => {
          if (Array.isArray(res)) setDepartments(res);
          else setDepartments([]);
        })
        .catch(() => setDepartments([]));
    } else {
      departmentAPI.getDepartments()
        .then((res) => {
          if (Array.isArray(res)) setDepartments(res);
          else setDepartments([]);
        })
        .catch(() => setDepartments([]));
    }
  }, [selectedCollege]);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCollege, selectedDept]);

  const fetchLeaderboard = () => {
    setLoading(true);
    
    const mockData = {
      overall: [
        { id: 1, rank: 1, name: "Aarav Sharma", department: "Computer Science", score: 98, initials: "AS" },
        { id: 2, rank: 2, name: "Sneha Gupta", department: "Information Tech", score: 95, initials: "SG" },
        { id: 3, rank: 3, name: "Rohan Patel", department: "Computer Science", score: 92, initials: "RP" },
        { id: 4, rank: 4, name: "Priya Singh", department: "Electronics", score: 88, initials: "PS" },
        { id: 5, rank: 5, name: "Vikram Verma", department: "Information Tech", score: 85, initials: "VV" },
      ],
      department: [
        { id: 1, rank: 1, name: "Computer Science", department: "CS Dept", score: 94, initials: "CS" },
        { id: 2, rank: 2, name: "Information Tech", department: "IT Dept", score: 90, initials: "IT" },
        { id: 3, rank: 3, name: "Electronics", department: "ECE Dept", score: 85, initials: "EC" },
        { id: 4, rank: 4, name: "Mechanical", department: "ME Dept", score: 78, initials: "ME" },
      ],
      milestone: [
        { id: 1, rank: 1, name: "Aarav Sharma", department: "Computer Science", score: 100, initials: "AS" },
        { id: 2, rank: 2, name: "Sneha Gupta", department: "Information Tech", score: 95, initials: "SG" },
        { id: 3, rank: 3, name: "Priya Singh", department: "Electronics", score: 90, initials: "PS" },
        { id: 4, rank: 4, name: "Rohan Patel", department: "Computer Science", score: 85, initials: "RP" },
      ],
      topBatches: [
        { id: 1, rank: 1, name: "Batch 2024-CS-A", students: 60, score: 92, initials: "CA" },
        { id: 2, rank: 2, name: "Batch 2024-IT-A", students: 55, score: 88, initials: "IA" },
        { id: 3, rank: 3, name: "Batch 2024-CS-B", students: 62, score: 85, initials: "CB" },
        { id: 4, rank: 4, name: "Batch 2024-EC-A", students: 50, score: 80, initials: "EA" },
      ]
    };

    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch admin leaderboard data:", err);
      })
      .finally(() => setLoading(false));
  };

  // Process overall list sorting
  let currentList = [];
  if (activeTab === "overall") {
    const rawList = [...(data.overall || [])];
    if (sortByMetric === "quiz") {
      rawList.sort((a, b) => (b.quiz_score || 0) - (a.quiz_score || 0));
    } else if (sortByMetric === "interview") {
      rawList.sort((a, b) => (b.interview_score || 0) - (a.interview_score || 0));
    } else if (sortByMetric === "coding") {
      rawList.sort((a, b) => (b.coding_score || 0) - (a.coding_score || 0));
    } else if (sortByMetric === "attendance") {
      rawList.sort((a, b) => (b.attendance_score || 0) - (a.attendance_score || 0));
    } else {
      rawList.sort((a, b) => (b.score || b.overall_score || 0) - (a.score || a.overall_score || 0));
    }
    currentList = rawList.map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  } else if (activeTab === "department") {
    currentList = (data.department || []).map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  } else if (activeTab === "batches") {
    currentList = (data.topBatches || []).map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  }

  return (
    <div className="admin-leaderboard-container">
      <SectionHeader
        icon={Trophy}
        title="Leaderboard & Rankings"
        description="Campus-wide student overall standings, department level performance, and best batch rankings."
        action={
          <button onClick={fetchLeaderboard} className="admin-refresh-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Tabs */}
      <div className="admin-lb-tabs">
        <button
          onClick={() => setActiveTab('overall')}
          className={`admin-lb-tab-btn ${activeTab === 'overall' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          <Trophy size={15} />
          Overall Ranking
        </button>
        <button
          onClick={() => setActiveTab('department')}
          className={`admin-lb-tab-btn ${activeTab === 'department' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          <Medal size={15} />
          Department Ranking
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`admin-lb-tab-btn ${activeTab === 'batches' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          <Users size={15} />
          Best Batches
        </button>
      </div>

      {/* Department Filter Controls (Task 02) */}
      {activeTab === 'department' && (
        <div className="admin-lb-filter-bar">
          <div className="admin-lb-filter-group">
            <label><Filter size={13} /> Select College Institution</label>
            <select
              value={selectedCollege}
              onChange={(e) => {
                setSelectedCollege(e.target.value);
                setSelectedDept("");
              }}
              className="admin-lb-select"
            >
              <option value="">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-lb-filter-group">
            <label><BookOpen size={13} /> Select Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="admin-lb-select"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Overall Metric Sort Bar (Task 01) */}
      {activeTab === 'overall' && (
        <div className="admin-lb-metric-pills">
          <span className="admin-lb-metric-label">Rank By Category:</span>
          <button
            onClick={() => setSortByMetric('overall')}
            className={`admin-metric-pill ${sortByMetric === 'overall' ? 'active' : ''}`}
          >
            🔥 Overall Composite
          </button>
          <button
            onClick={() => setSortByMetric('quiz')}
            className={`admin-metric-pill ${sortByMetric === 'quiz' ? 'active' : ''}`}
          >
            📝 Quiz Score
          </button>
          <button
            onClick={() => setSortByMetric('interview')}
            className={`admin-metric-pill ${sortByMetric === 'interview' ? 'active' : ''}`}
          >
            🤖 AI Interview
          </button>
          <button
            onClick={() => setSortByMetric('coding')}
            className={`admin-metric-pill ${sortByMetric === 'coding' ? 'active' : ''}`}
          >
            🗺️ Roadmap / Coding
          </button>
          <button
            onClick={() => setSortByMetric('attendance')}
            className={`admin-metric-pill ${sortByMetric === 'attendance' ? 'active' : ''}`}
          >
            📅 Attendance
          </button>
        </div>
      )}

      <Card className="lb-card">
        <CardHeader className="lb-card-header">
          <div className="lb-header-icon lb-header-icon--trophy">
            <Trophy size={18} />
          </div>
          <div>
            <CardTitle>
              {activeTab === 'overall' && 'Top Students (Overall Standings)'}
              {activeTab === 'department' && 'Department Rankings & Standings'}
              {activeTab === 'batches' && 'Best Batches Rankings'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'overall' && 'Ranked across quiz assessments, AI interviews, roadmap progress, and attendance.'}
              {activeTab === 'department' && 'Ranked by department level performance and composite student scores.'}
              {activeTab === 'batches' && 'Ranked by average performance score, quiz, coding, and attendance across cohorts.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="lb-list">
          {loading ? (
            <div className="admin-lb-loading">
              <RefreshCw size={24} className="animate-spin" style={{ color: '#4f46e5', marginRight: 10 }} />
              <span>Loading rankings...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="admin-empty-state-card">
              <Trophy size={32} className="admin-empty-state-icon" />
              <p className="admin-empty-state-title">No leaderboard entries found for this selection</p>
            </div>
          ) : (
            <>
              {activeTab === 'overall' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Quiz</div>
                  <div className="col-metric">AI Interview</div>
                  <div className="col-metric">Roadmap</div>
                  <div className="col-metric">Attendance</div>
                  <div className="col-score">Composite XP</div>
                </div>
              )}

              {activeTab === 'department' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Department</div>
                  <div className="col-metric">College</div>
                  <div className="col-score">Score</div>
                </div>
              )}

              {activeTab === 'batches' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Batch Name</div>
                  <div className="col-metric">Enrolled</div>
                  <div className="col-metric">Avg Quiz</div>
                  <div className="col-metric">Avg Coding</div>
                  <div className="col-metric">Avg Interview</div>
                  <div className="col-score">Batch Score</div>
                </div>
              )}

              {currentList.map((s, idx) => {
                const displayRank = s.displayRank || idx + 1;

                if (activeTab === 'overall') {
                  return (
                    <div key={s.id || idx} className="lb-grid-row">
                      <div className="col-rank">
                        <span className={`lb-rank ${getRankClass(displayRank)}`}>#{displayRank}</span>
                      </div>
                      <div className="col-student">
                        <Avatar size="34"><AvatarFallback>{s.initials || 'ST'}</AvatarFallback></Avatar>
                        <div className="lb-info">
                          <span className="lb-name">{s.name}</span>
                          <span className="lb-sub">{s.department || s.college || 'Student'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-blue">📝 {s.quiz_score || 0}%</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-purple">🤖 {s.interview_score || 0}%</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-emerald">🗺️ {s.coding_score || 0}%</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-amber">📅 {s.attendance_score || 0}%</span>
                      </div>
                      <div className="col-score">
                        <div className="lb-xp-pill">
                          <Flame size={12} className="lb-flame-icon" />
                          <span>{s.score !== undefined ? s.score : s.overall_score || 0} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (activeTab === 'department') {
                  return (
                    <div key={s.id || idx} className="lb-grid-row">
                      <div className="col-rank">
                        <span className={`lb-rank ${getRankClass(displayRank)}`}>#{displayRank}</span>
                      </div>
                      <div className="col-student">
                        <Avatar size="34"><AvatarFallback>{s.initials || 'ST'}</AvatarFallback></Avatar>
                        <div className="lb-info">
                          <span className="lb-name">{s.name}</span>
                          <span className="lb-sub">{s.roll_number || 'Roll N/A'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-dept-tag">{s.department || 'General'}</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-college-tag">{s.college || 'College'}</span>
                      </div>
                      <div className="col-score">
                        <div className="lb-xp-pill">
                          <Flame size={12} className="lb-flame-icon" />
                          <span>{s.score || s.overall_score || 0} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (activeTab === 'batches') {
                  return (
                    <div key={s.name || idx} className="lb-grid-row">
                      <div className="col-rank">
                        <span className={`lb-rank ${getRankClass(displayRank)}`}>#{displayRank}</span>
                      </div>
                      <div className="col-student">
                        <div className="lb-batch-avatar">{s.initials || 'BT'}</div>
                        <div className="lb-info">
                          <span className="lb-name">{s.name}</span>
                          <span className="lb-sub">{s.college || 'Institution Batch'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-students-count">👥 {s.students || 0} Students</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-blue">📝 {s.avg_quiz || 0}%</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-emerald">🗺️ {s.avg_coding || 0}%</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-purple">🤖 {s.avg_interview || 0}%</span>
                      </div>
                      <div className="col-score">
                        <div className="lb-xp-pill">
                          <Flame size={12} className="lb-flame-icon" />
                          <span>{s.score || 0} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
