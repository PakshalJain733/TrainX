import React, { useState, useEffect } from "react";
import { Trophy, Medal, Users, RefreshCw, BookOpen, Brain, Code, CheckCircle, Clock } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { collegeAPI, departmentAPI } from "../../../services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/AD_Leaderboard.css";

const getRankClass = (r) => r === 1 ? "admin-rank-1" : r === 2 ? "admin-rank-2" : r === 3 ? "admin-rank-3" : "";

export default function AdminLeaderboard() {
  const [activeTab, setActiveTab] = useState("moduleWise"); // 'moduleWise' | 'department'
  const [moduleFilter, setModuleFilter] = useState("all"); // 'all' | 'quiz' | 'coding' | 'tasks' | 'interview'
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

  // Process overall list sorting based on module filter and time tie-breaker
  let currentList = [];
  if (activeTab === "moduleWise") {
    const rawList = [...(data.overall || [])];
    if (moduleFilter === "quiz") {
      rawList.sort((a, b) => {
        const scoreDiff = (b.quiz_points || 0) - (a.quiz_points || 0);
        if (scoreDiff !== 0) return scoreDiff;
        const aTime = Number(a.quiz_time_seconds) || 0;
        const bTime = Number(b.quiz_time_seconds) || 0;
        if (aTime > 0 && bTime > 0 && aTime !== bTime) return aTime - bTime;
        return (b.quiz_score || 0) - (a.quiz_score || 0);
      });
    } else if (moduleFilter === "coding") {
      rawList.sort((a, b) => {
        const scoreDiff = (b.coding_points || 0) - (a.coding_points || 0);
        if (scoreDiff !== 0) return scoreDiff;
        const aTime = Number(a.coding_time_seconds) || 0;
        const bTime = Number(b.coding_time_seconds) || 0;
        if (aTime > 0 && bTime > 0 && aTime !== bTime) return aTime - bTime;
        return (b.problems_solved || 0) - (a.problems_solved || 0);
      });
    } else if (moduleFilter === "tasks") {
      rawList.sort((a, b) => {
        const scoreDiff = (b.task_points || 0) - (a.task_points || 0);
        if (scoreDiff !== 0) return scoreDiff;
        const aTime = Number(a.task_time_seconds) || 0;
        const bTime = Number(b.task_time_seconds) || 0;
        if (aTime > 0 && bTime > 0 && aTime !== bTime) return aTime - bTime;
        return (b.tasks_completed || 0) - (a.tasks_completed || 0);
      });
    } else if (moduleFilter === "interview") {
      rawList.sort((a, b) => {
        const diff = (b.interview_score || 0) - (a.interview_score || 0);
        if (diff !== 0) return diff;
        return (b.interviews_count || 0) - (a.interviews_count || 0);
      });
    } else {
      // all activities
      rawList.sort((a, b) => {
        const aScore = a.total_points !== undefined ? a.total_points : (a.score || 0);
        const bScore = b.total_points !== undefined ? b.total_points : (b.score || 0);
        if (bScore !== aScore) return bScore - aScore;
        const aTime = Number(a.total_time_seconds) || 0;
        const bTime = Number(b.total_time_seconds) || 0;
        if (aTime > 0 && bTime > 0 && aTime !== bTime) return aTime - bTime;
        return (b.score || 0) - (a.score || 0);
      });
    }
    currentList = rawList.map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  } else if (activeTab === "department") {
    let deptList = [...(data.department || [])];
    deptList.sort((a, b) => {
      const aScore = a.total_points !== undefined ? a.total_points : (a.score || 0);
      const bScore = b.total_points !== undefined ? b.total_points : (b.score || 0);
      if (bScore !== aScore) return bScore - aScore;
      const aTime = Number(a.total_time_seconds) || 0;
      const bTime = Number(b.total_time_seconds) || 0;
      if (aTime > 0 && bTime > 0 && aTime !== bTime) return aTime - bTime;
      return 0;
    });
    currentList = deptList.map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  }

  return (
    <div className="admin-leaderboard-container page-fade-in">
      <div className="ui-section-header-AD">
        <div className="ui-section-main-AD">
          <div>
            <h2 className="ui-section-title">
              <Trophy size={22} className="ui-section-title-icon" />
              <span>Leaderboard & Rankings</span>
            </h2>
            <p className="ui-section-desc">
              Campus-wide student standings, tracking real performance points across Quizzes, Practice Coding, and Coursework Tasks with solve duration.
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

      {/* Module Wise Sub-Tabs */}
      {activeTab === 'moduleWise' && (
        <div className="admin-lb-metric-pills">
          <button
            onClick={() => setModuleFilter('all')}
            className={`admin-metric-pill ${moduleFilter === 'all' ? 'active' : ''}`}
          >
            All Activities
          </button>
          <button
            onClick={() => setModuleFilter('quiz')}
            className={`admin-metric-pill ${moduleFilter === 'quiz' ? 'active' : ''}`}
          >
            Quiz Assessment
          </button>
          <button
            onClick={() => setModuleFilter('coding')}
            className={`admin-metric-pill ${moduleFilter === 'coding' ? 'active' : ''}`}
          >
            Practice Coding
          </button>
          <button
            onClick={() => setModuleFilter('tasks')}
            className={`admin-metric-pill ${moduleFilter === 'tasks' ? 'active' : ''}`}
          >
            Coursework Tasks
          </button>
          <button
            onClick={() => setModuleFilter('interview')}
            className={`admin-metric-pill ${moduleFilter === 'interview' ? 'active' : ''}`}
          >
            AI Interview
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
              {activeTab === 'moduleWise' && moduleFilter === 'all' && 'Campus-Wide Student Standings (All Activities)'}
              {activeTab === 'moduleWise' && moduleFilter === 'quiz' && 'Academic & Quiz Assessment Leaderboard'}
              {activeTab === 'moduleWise' && moduleFilter === 'coding' && 'Practice Coding Problem Leaderboard'}
              {activeTab === 'moduleWise' && moduleFilter === 'tasks' && 'Coursework Task Submissions Leaderboard'}
              {activeTab === 'moduleWise' && moduleFilter === 'interview' && 'AI Mock Interview Performance'}
              {activeTab === 'department' && 'Department Rankings & Standings'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'moduleWise' && moduleFilter === 'all' && 'Ranked by true student progress points earned from quizzes, coding problems, and coursework tasks, with total solve duration as tie-breaker.'}
              {activeTab === 'moduleWise' && moduleFilter === 'quiz' && 'Ranked by Quiz Points earned and Quiz Accuracy, with Quiz Solve Time as tie-breaker (faster completion ranks higher).'}
              {activeTab === 'moduleWise' && moduleFilter === 'coding' && 'Ranked by Practice Coding Points and Problems Solved, with Execution & Solve Time as tie-breaker.'}
              {activeTab === 'moduleWise' && moduleFilter === 'tasks' && 'Ranked by Coursework Task Points and Completed Tasks, with Completion Duration as tie-breaker.'}
              {activeTab === 'moduleWise' && moduleFilter === 'interview' && 'Ranked by AI mock technical and HR interview performance ratings.'}
              {activeTab === 'department' && 'Ranked by department-level performance, points earned, and overall speed.'}
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
              <div className="admin-empty-state-icon-wrap">
                <Trophy size={32} />
              </div>
              <p className="admin-empty-state-title">No leaderboard entries found for this selection</p>
              <p className="admin-empty-state-sub">Rankings will update dynamically as students in this batch complete quizzes, coding challenges, or coursework tasks.</p>
            </div>
          ) : (
            <>
              {activeTab === 'moduleWise' && moduleFilter === 'all' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Quiz Points</div>
                  <div className="col-metric">Coding Points</div>
                  <div className="col-metric">Task Points</div>
                  <div className="col-metric">Total Time Taken</div>
                  <div className="col-score">Total Points</div>
                </div>
              )}

              {activeTab === 'moduleWise' && moduleFilter === 'quiz' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Department</div>
                  <div className="col-metric">Quizzes Taken</div>
                  <div className="col-metric">Avg Score</div>
                  <div className="col-metric">Time Taken</div>
                  <div className="col-score">Quiz Points</div>
                </div>
              )}

              {activeTab === 'moduleWise' && moduleFilter === 'coding' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Department</div>
                  <div className="col-metric">Problems Solved</div>
                  <div className="col-metric">Solve / Run Time</div>
                  <div className="col-score">Coding Points</div>
                </div>
              )}

              {activeTab === 'moduleWise' && moduleFilter === 'tasks' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Department</div>
                  <div className="col-metric">Tasks Completed</div>
                  <div className="col-metric">Time Taken</div>
                  <div className="col-score">Task Points</div>
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

              {activeTab === 'department' && (
                <div className="admin-lb-grid-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-student">Student</div>
                  <div className="col-metric">Department</div>
                  <div className="col-metric">College</div>
                  <div className="col-metric">Total Time</div>
                  <div className="col-score">Total Points</div>
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
                          <span className="lb-sub">{[s.roll_number, s.department || s.college].filter(Boolean).join(' • ') || 'Student'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-blue">{s.quiz_points || 0} pts</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-emerald">{s.coding_points || 0} pts</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-purple">{s.task_points || 0} pts</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-time">
                          <Clock size={12} style={{ marginRight: 3 }} />
                          {s.total_time_formatted || '0s'}
                        </span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {s.total_points !== undefined ? s.total_points : (s.score || 0)} pts
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
                          <span className="lb-sub">{s.roll_number || 'Student'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-dept-tag">{s.department || 'General'}</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-students-count">{s.quizzes_taken || 0} Quizzes</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-blue">{s.quiz_score || 0}% Avg</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-time">
                          <Clock size={12} style={{ marginRight: 3 }} />
                          {s.quiz_time_formatted || '0s'}
                        </span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {s.quiz_points || 0} pts
                        </span>
                      </div>
                    </div>
                  );
                }

                if (activeTab === 'moduleWise' && moduleFilter === 'coding') {
                  return (
                    <div key={s.id || idx} className="lb-grid-row">
                      <div className="col-rank">
                        <span className={`lb-rank ${getRankClass(displayRank)}`}>#{displayRank}</span>
                      </div>
                      <div className="col-student">
                        <Avatar size="34"><AvatarFallback>{s.initials || 'ST'}</AvatarFallback></Avatar>
                        <div className="lb-info">
                          <span className="lb-name">{s.name}</span>
                          <span className="lb-sub">{s.roll_number || 'Student'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-dept-tag">{s.department || 'General'}</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-emerald">{s.problems_solved || 0} Solved</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-time">
                          <Clock size={12} style={{ marginRight: 3 }} />
                          {s.coding_time_formatted || '0s'}
                        </span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {s.coding_points || 0} pts
                        </span>
                      </div>
                    </div>
                  );
                }

                if (activeTab === 'moduleWise' && moduleFilter === 'tasks') {
                  return (
                    <div key={s.id || idx} className="lb-grid-row">
                      <div className="col-rank">
                        <span className={`lb-rank ${getRankClass(displayRank)}`}>#{displayRank}</span>
                      </div>
                      <div className="col-student">
                        <Avatar size="34"><AvatarFallback>{s.initials || 'ST'}</AvatarFallback></Avatar>
                        <div className="lb-info">
                          <span className="lb-name">{s.name}</span>
                          <span className="lb-sub">{s.roll_number || 'Student'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-dept-tag">{s.department || 'General'}</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-purple">{s.tasks_completed || 0} Tasks</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-time">
                          <Clock size={12} style={{ marginRight: 3 }} />
                          {s.task_time_formatted || '0s'}
                        </span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {s.task_points || 0} pts
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
                          <span className="lb-sub">{s.roll_number || 'Student'}</span>
                        </div>
                      </div>
                      <div className="col-metric">
                        <span className="lb-dept-tag">{s.department || 'General'}</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-students-count">{s.interviews_count || 0} Sessions</span>
                      </div>
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-purple">{s.interview_score || 0}% AI Score</span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {(s.interview_score || 0) * 10} pts
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
                      <div className="col-metric">
                        <span className="lb-metric-badge badge-time">
                          <Clock size={12} style={{ marginRight: 3 }} />
                          {s.total_time_formatted || '0s'}
                        </span>
                      </div>
                      <div className="col-score">
                        <span className="lb-xp-clean-num">
                          {s.total_points !== undefined ? s.total_points : (s.score || 0)} pts
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
