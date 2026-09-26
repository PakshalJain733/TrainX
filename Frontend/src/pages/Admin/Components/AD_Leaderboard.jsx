import React, { useState, useEffect } from "react";
import { Trophy, Flame, Medal, Users, RefreshCw, Filter, BookOpen, Brain } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { collegeAPI, departmentAPI } from "../../../services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/AD_Leaderboard.css";

const getRankClass = (r) => r === 1 ? "admin-rank-1" : r === 2 ? "admin-rank-2" : r === 3 ? "admin-rank-3" : "";

export default function AdminLeaderboard() {
  const [activeTab, setActiveTab] = useState("moduleWise"); // 'moduleWise' | 'department'
  const [moduleFilter, setModuleFilter] = useState("all"); // 'all' | 'quiz' | 'interview' | 'roadmap'
  const [data, setData] = useState({ overall: [], department: [] });
  const [loading, setLoading] = useState(true);

  // Filters for Department Ranking tab
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

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

    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data) {
          setData({
            overall: res.data.overall || [],
            department: res.data.department || []
          });
        } else {
          setData({ overall: [], department: [] });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch leaderboard data:", err);
        setData({ overall: [], department: [] });
      })
      .finally(() => setLoading(false));
  };

  // Process overall list sorting based on module filter
  let currentList = [];
  if (activeTab === "moduleWise") {
    const rawList = [...(data.overall || [])];
    if (moduleFilter === "quiz") {
      rawList.sort((a, b) => (b.quiz_score || 0) - (a.quiz_score || 0));
    } else if (moduleFilter === "interview") {
      rawList.sort((a, b) => (b.interview_score || 0) - (a.interview_score || 0));
    } else if (moduleFilter === "roadmap") {
      rawList.sort((a, b) => (b.coding_score || 0) - (a.coding_score || 0));
    } else {
      rawList.sort((a, b) => (b.score || b.overall_score || 0) - (a.score || a.overall_score || 0));
    }
    currentList = rawList.map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  } else if (activeTab === "department") {
    let deptList = [...(data.department || [])];
    currentList = deptList.map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  }

  return (
    <div className="admin-leaderboard-container page-fade-in">
      <div className="ui-section-header-AD">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <Trophy size={22} className="ui-section-title-icon" />
              <span>Leaderboard & Rankings</span>
            </h2>
            <p className="ui-section-desc">
              Campus-wide student module standings, department level performance, and milestone rankings.
            </p>
          </div>
          <div className="ui-section-action">
            <button onClick={fetchLeaderboard} className="admin-refresh-btn">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="admin-lb-tabs">
        <button
          onClick={() => setActiveTab('moduleWise')}
          className={`admin-lb-tab-btn ${activeTab === 'moduleWise' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          <Trophy size={15} />
          Module Wise Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('department')}
          className={`admin-lb-tab-btn ${activeTab === 'department' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          <Medal size={15} />
          Department Ranking
        </button>
      </div>

      {/* Department Filter Controls (Admin only) */}
      {activeTab === 'department' && (
        <div className="admin-lb-filter-bar">
          <div className="admin-lb-filter-group">
            <label><BookOpen size={13} /> Department</label>
            <CustomSelect
              value={selectedDept}
              options={[
                { value: "", label: "All Departments" },
                ...departments.map((d) => ({ value: d.id, label: `${d.name} ${d.code ? `(${d.code})` : ''}` }))
              ]}
              onChange={(val) => setSelectedDept(val)}
              placeholder="All Departments"
            />
          </div>
        </div>
      )}

      {/* Module Wise Sub-Tabs (Clean text, no emojis) */}
      {activeTab === 'moduleWise' && (
        <div className="admin-lb-metric-pills">
          <button
            onClick={() => setModuleFilter('all')}
            className={`admin-metric-pill ${moduleFilter === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setModuleFilter('quiz')}
            className={`admin-metric-pill ${moduleFilter === 'quiz' ? 'active' : ''}`}
          >
            Quiz
          </button>
          <button
            onClick={() => setModuleFilter('interview')}
            className={`admin-metric-pill ${moduleFilter === 'interview' ? 'active' : ''}`}
          >
            Interview
          </button>
          <button
            onClick={() => setModuleFilter('roadmap')}
            className={`admin-metric-pill ${moduleFilter === 'roadmap' ? 'active' : ''}`}
          >
            Roadmap
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
              {activeTab === 'moduleWise' && moduleFilter === 'all' && 'Top Students (Overall Standings)'}
              {activeTab === 'moduleWise' && moduleFilter === 'quiz' && 'Academic & Assessment Quiz Leaderboard'}
              {activeTab === 'moduleWise' && moduleFilter === 'interview' && 'AI Mock Interview Leaderboard'}
              {activeTab === 'moduleWise' && moduleFilter === 'roadmap' && 'AI Roadmap & Coding Leaderboard'}
              {activeTab === 'department' && 'Department Rankings & Standings'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'moduleWise' && moduleFilter === 'all' && 'Ranked across quiz assessments, AI interviews, roadmap progress, and attendance.'}
              {activeTab === 'moduleWise' && moduleFilter === 'quiz' && 'Ranked by academic quiz scores, quiz accuracy, and completed tests.'}
              {activeTab === 'moduleWise' && moduleFilter === 'interview' && 'Ranked by AI mock technical and HR interview performance ratings.'}
              {activeTab === 'moduleWise' && moduleFilter === 'roadmap' && 'Ranked by roadmap milestones achieved, coding problems solved, and active streak.'}
              {activeTab === 'department' && 'Ranked by department level performance and composite student scores.'}
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
              {activeTab === 'moduleWise' && moduleFilter === 'all' && (
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

              {activeTab === 'moduleWise' && moduleFilter === 'quiz' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Department</div>
                  <div className="col-metric">Quizzes Taken</div>
                  <div className="col-metric">Quiz Score</div>
                  <div className="col-score">Quiz XP</div>
                </div>
              )}

              {activeTab === 'moduleWise' && moduleFilter === 'interview' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Department</div>
                  <div className="col-metric">Interviews</div>
                  <div className="col-metric">AI Rating</div>
                  <div className="col-score">Interview XP</div>
                </div>
              )}

              {activeTab === 'moduleWise' && moduleFilter === 'roadmap' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Department</div>
                  <div className="col-metric">Milestones</div>
                  <div className="col-metric">Streak</div>
                  <div className="col-score">Coding XP</div>
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

              {currentList.map((s, idx) => {
                const displayRank = s.displayRank || idx + 1;

                if (activeTab === 'moduleWise' && moduleFilter === 'all') {
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
                        <span className="lb-metric-badge badge-blue">{s.quiz_score || 0}%</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-purple">{s.interview_score || 0}%</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-emerald">{s.coding_score || 0}%</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-amber">{s.attendance_score || 0}%</span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {s.score !== undefined ? s.score : s.overall_score || 0} pts
                        </span>
                      </div>
                    </div>
                  );
                }

                if (activeTab === 'moduleWise' && moduleFilter === 'quiz') {
                  return (
                    <div key={s.id || idx} className="lb-grid-row">
                      <div className="col-rank">
                        <span className={`lb-rank ${getRankClass(displayRank)}`}>#{displayRank}</span>
                      </div>
                      <div className="col-student">
                        <Avatar size="34"><AvatarFallback>{s.initials || 'ST'}</AvatarFallback></Avatar>
                        <div className="lb-info">
                          <span className="lb-name">{s.name}</span>
                          <span className="lb-sub">{s.department || 'Computer Science'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-dept-tag">{s.department || 'CS Dept'}</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-students-count">{s.quizzes || 12} Quizzes</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-blue">{s.quiz_score || 90}% Avg</span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {(s.quiz_score || 90) * 10} pts
                        </span>
                      </div>
                    </div>
                  );
                }

                if (activeTab === 'moduleWise' && moduleFilter === 'interview') {
                  return (
                    <div key={s.id || idx} className="lb-grid-row">
                      <div className="col-rank">
                        <span className={`lb-rank ${getRankClass(displayRank)}`}>#{displayRank}</span>
                      </div>
                      <div className="col-student">
                        <Avatar size="34"><AvatarFallback>{s.initials || 'ST'}</AvatarFallback></Avatar>
                        <div className="lb-info">
                          <span className="lb-name">{s.name}</span>
                          <span className="lb-sub">{s.department || 'Computer Science'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-dept-tag">{s.department || 'CS Dept'}</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-students-count">{s.interviews || 6} Interviews</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-purple">{s.interview_score || 88}% AI Score</span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {(s.interview_score || 88) * 10} pts
                        </span>
                      </div>
                    </div>
                  );
                }

                if (activeTab === 'moduleWise' && moduleFilter === 'roadmap') {
                  return (
                    <div key={s.id || idx} className="lb-grid-row">
                      <div className="col-rank">
                        <span className={`lb-rank ${getRankClass(displayRank)}`}>#{displayRank}</span>
                      </div>
                      <div className="col-student">
                        <Avatar size="34"><AvatarFallback>{s.initials || 'ST'}</AvatarFallback></Avatar>
                        <div className="lb-info">
                          <span className="lb-name">{s.name}</span>
                          <span className="lb-sub">{s.department || 'Computer Science'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-dept-tag">{s.department || 'CS Dept'}</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-students-count">{s.milestones || 10} Milestones</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-emerald">{s.streak || 14}d Streak</span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {(s.coding_score || 92) * 10} pts
                        </span>
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
                        <span className="lb-xp-clean-num">
                          {s.score || s.overall_score || 0} pts
                        </span>
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
