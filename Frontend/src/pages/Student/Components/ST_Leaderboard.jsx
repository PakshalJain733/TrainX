import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Flame, RefreshCw, Users, BookOpen } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/ST_Leaderboard.css";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("overall"); // 'overall' | 'department' | 'milestone' | 'batches'
  const [leaderboardData, setLeaderboardData] = useState({
    overall: [],
    department: [],
    milestone: [],
    topBatches: [],
    studentContext: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = () => {
    setLoading(true);
    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data) {
          if (Array.isArray(res.data)) {
            setLeaderboardData({
              overall: res.data,
              department: [],
              milestone: [],
              topBatches: [],
              studentContext: null,
            });
          } else {
            setLeaderboardData({
              overall: Array.isArray(res.data.overall) ? res.data.overall : [],
              department: Array.isArray(res.data.department) ? res.data.department : [],
              milestone: Array.isArray(res.data.milestone) ? res.data.milestone : [],
              topBatches: Array.isArray(res.data.topBatches) ? res.data.topBatches : (Array.isArray(res.data.batches) ? res.data.batches : []),
              studentContext: res.data.studentContext || null,
            });
          }
        } else {
          setLeaderboardData({
            overall: [],
            department: [],
            milestone: [],
            topBatches: [],
            studentContext: null,
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching leaderboard data:", err);
      })
      .finally(() => setLoading(false));
  };

  const getRankClass = (r) => {
    if (r === 1) return "rank-1";
    if (r === 2) return "rank-2";
    if (r === 3) return "rank-3";
    return "";
  };

  const studentContext = leaderboardData.studentContext || {};
  const myRankInfo = studentContext.myRank || { overallRank: "-", departmentRank: "-", milestoneRank: "-", score: 0, totalStudents: 0 };

  // Current tab items list
  let currentList = [];
  if (activeTab === "overall") currentList = leaderboardData.overall || [];
  else if (activeTab === "department") currentList = leaderboardData.department || [];
  else if (activeTab === "milestone") currentList = leaderboardData.milestone || [];
  else if (activeTab === "batches") currentList = leaderboardData.topBatches || [];

  return (
    <div className="leaderboard-page">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <span>Leaderboard & Rankings</span>
        </h2>
        <p className="student-header-desc">
          Real-time academic performance, department standing, and milestone progress rankings.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="leaderboard-kpis-grid">
        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap">
            <Trophy size={22} color="#4f46e5" />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Overall Rank</div>
            <p className="leaderboard-kpi-val">#{myRankInfo.overallRank}</p>
            <p className="leaderboard-kpi-sub">of {myRankInfo.totalStudents || currentList.length} enrolled students</p>
          </div>
        </div>

        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap leaderboard-kpi-icon-wrap--emerald">
            <Medal size={22} color="#10b981" />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Department Standing</div>
            <p className="leaderboard-kpi-val">#{myRankInfo.departmentRank}</p>
            <p className="leaderboard-kpi-sub">In your department</p>
          </div>
        </div>

        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Flame size={22} color="#ea580c" />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Overall Score</div>
            <p className="leaderboard-kpi-val">{myRankInfo.score} XP</p>
            <p className="leaderboard-kpi-sub">Composite performance</p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="leaderboard-main-card">
        {/* Navigation Tabs */}
        <div className="leaderboard-tabs-row">
          <button
            className={`leaderboard-tab-btn ${activeTab === "overall" ? "active" : ""}`}
            onClick={() => setActiveTab("overall")}
          >
            <Trophy size={16} style={{ marginRight: 6 }} /> Overall Ranking
          </button>
          <button
            className={`leaderboard-tab-btn ${activeTab === "department" ? "active" : ""}`}
            onClick={() => setActiveTab("department")}
          >
            <Medal size={16} style={{ marginRight: 6 }} /> Department Ranking
          </button>
          <button
            className={`leaderboard-tab-btn ${activeTab === "batches" ? "active" : ""}`}
            onClick={() => setActiveTab("batches")}
          >
            <Users size={16} style={{ marginRight: 6 }} /> Top Batches
          </button>
        </div>

        <div className="leaderboard-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="leaderboard-list-title">
              {activeTab === "overall" && "College-Wide Overall Ranking"}
              {activeTab === "department" && "Department Standing Ranking"}
              {activeTab === "batches" && "Top Batches Ranking"}
            </h3>
            <p className="leaderboard-list-desc">
              Ranked by overall academic, coding, and assessment performance score
            </p>
          </div>
          <button
            onClick={fetchLeaderboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', marginRight: 10 }} />
            <span>Loading leaderboard rankings...</span>
            <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
          </div>
        ) : (
          <div className="leaderboard-items-list">
            {currentList.length === 0 ? (
              <div className="leaderboard-empty-state" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No rankings available for this category yet.
              </div>
            ) : (
              currentList.map((st, idx) => {
                const displayName = st.name || st.username || st.student_name || st.batch_name || "Student";
                const displayInitials = st.initials || displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "ST";
                const displayScore = st.score !== undefined ? st.score : (st.overall_score !== undefined ? st.overall_score : (st.xp || 0));
                const displaySub = activeTab === "batches"
                  ? `${st.students || st.student_count || 0} Enrolled Students`
                  : [st.batch || st.batch_name || "All Batches", st.department || st.dept_name || st.sub].filter(Boolean).join(" • ");

                return (
                  <div
                    key={st.id || st.user_id || st.rank || idx}
                    className={`leaderboard-row-item ${st.isCurrentUser ? "is-current-user" : ""}`}
                  >
                    <div className="leaderboard-row-left">
                      <span className={`leaderboard-rank-num ${getRankClass(st.rank || idx + 1)}`}>
                        #{st.rank || idx + 1}
                      </span>
                      <div className="leaderboard-avatar">{displayInitials}</div>
                      <div className="leaderboard-user-meta">
                        <div className="leaderboard-user-name">
                          {displayName}
                          {st.isCurrentUser && <span className="you-pill">You</span>}
                        </div>
                        <div className="leaderboard-user-sub">
                          {displaySub}
                        </div>
                      </div>
                    </div>

                    <div className="leaderboard-score-val">
                      <Flame size={16} color="#ea580c" />
                      <span>{displayScore} XP</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
