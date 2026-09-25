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
    let url = "/leaderboards";
    const params = new URLSearchParams();
    if (selectedCollege) params.append("college_id", selectedCollege);
    if (selectedDept) params.append("department_id", selectedDept);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    apiFetch(url)
      .then((res) => {
        if (res && res.data) {
          setData({
            overall: res.data.overall || [],
            department: res.data.department || [],
            topBatches: res.data.topBatches || [],
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch leaderboard data:", err);
      })
      .finally(() => setLoading(false));
  };

  // Process list sorting based on activeTab
  let currentList = [];
  if (activeTab === "batches") {
    currentList = (data.topBatches || []).map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  } else {
    const rawList = [...(data.overall || [])];
    if (activeTab === "quiz") {
      rawList.sort((a, b) => (b.quiz_score || 0) - (a.quiz_score || 0));
    } else if (activeTab === "interview") {
      rawList.sort((a, b) => (b.interview_score || 0) - (a.interview_score || 0));
    } else if (activeTab === "coding") {
      rawList.sort((a, b) => (b.coding_score || 0) - (a.coding_score || 0));
    } else if (activeTab === "attendance") {
      rawList.sort((a, b) => (b.attendance_score || 0) - (a.attendance_score || 0));
    } else {
      rawList.sort((a, b) => (b.score || b.overall_score || 0) - (a.score || a.overall_score || 0));
    }
    currentList = rawList.map((item, idx) => ({ ...item, displayRank: idx + 1 }));
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

      {/* Tabs / Rank by Category (Merged into single row) */}
      <div className="admin-lb-tabs" style={{ alignItems: 'center' }}>
        <span className="admin-lb-metric-label" style={{ marginRight: '10px' }}>Rank By Category:</span>
        <button
          onClick={() => setActiveTab('overall')}
          className={`admin-lb-tab-btn ${activeTab === 'overall' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          Overall
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`admin-lb-tab-btn ${activeTab === 'batches' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          Best Batches
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`admin-lb-tab-btn ${activeTab === 'quiz' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          Quiz Score
        </button>
        <button
          onClick={() => setActiveTab('interview')}
          className={`admin-lb-tab-btn ${activeTab === 'interview' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          AI Interview
        </button>
        <button
          onClick={() => setActiveTab('coding')}
          className={`admin-lb-tab-btn ${activeTab === 'coding' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          Roadmap / Coding
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`admin-lb-tab-btn ${activeTab === 'attendance' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          Attendance
        </button>
      </div>

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
