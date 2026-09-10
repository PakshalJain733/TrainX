import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Flame, Users, Sparkles } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/Leaderboard.css";

const getInitials = (name) => {
  if (!name || name.trim().length === 0) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("overall");
  const [allStudents, setAllStudents] = useState([]);
  const [userDept, setUserDept] = useState("Computer Engineering & IT");
  const [myRank, setMyRank] = useState("#1");

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u && (u.department || u.studentProfile?.department)) {
        setUserDept(u.department || u.studentProfile?.department);
      }
    } catch (e) {}

    // Fetch live leaderboard data
    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data) {
          const processList = (rawList) => {
            return rawList.map((item, idx) => ({
              rank: item.rank || idx + 1,
              name: item.name,
              score: `${item.score.toLocaleString()} XP`,
              progress: item.progress || 0,
              initials: item.initials || getInitials(item.name),
              department: item.sub || userDept || "General",
              batch: item.batch || "Unassigned",
              sub: item.isCurrentUser ? "Your Account" : (item.sub || "Enrolled Student"),
              isCurrentUser: item.isCurrentUser,
            }));
          };

          const overallList = processList(res.data.overall || []);
          const deptList = processList(res.data.department || []);

          // Keep all students state with property to distinguish if needed, but we can just use activeTab to select from response.
          // Wait, better to store the response directly and select in render.
          setLeaderboardData({ overall: overallList, department: deptList, milestone: processList(res.data.milestone || []) });
          
          const currentUser = overallList.find((s) => s.isCurrentUser);
          if (currentUser) {
            setMyRank(`#${currentUser.rank}`);
          }
        }
      })
      .catch(() => {});
  }, [userDept]);

  const [leaderboardData, setLeaderboardData] = useState({ overall: [], department: [], milestone: [] });

  const displayedStudents = leaderboardData[activeTab] || [];

  const getRankClass = (r) => {
    if (r === 1) return "rank-1";
    if (r === 2) return "rank-2";
    if (r === 3) return "rank-3";
    return "";
  };

  return (
    <div className="leaderboard-page stack-6">
      <SectionHeader
        eyebrow="BATCH & DEPT RANKINGS"
        title="Student Leaderboard"
        description="View real-time batch rankings, XP score points, and top performers across your department."
      />

      {/* Top KPIs */}
      <div className="leaderboard-kpis-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap">
            <Trophy size={22} />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Overall Rank</div>
            <p className="leaderboard-kpi-val">{myRank}</p>
            <p className="leaderboard-kpi-sub">of {leaderboardData.overall.length || 1} enrolled students</p>
          </div>
        </div>

        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap leaderboard-kpi-icon-wrap--emerald">
            <Medal size={22} />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Department Rank</div>
            <p className="leaderboard-kpi-val">{myRank}</p>
            <p className="leaderboard-kpi-sub">{userDept}</p>
          </div>
        </div>

        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Flame size={22} />
          </div>
          <div>
            <div className="leaderboard-kpi-label">My Overall Score</div>
            <p className="leaderboard-kpi-val">
              {leaderboardData.overall.find(s => s.isCurrentUser)?.score || "0 XP"}
            </p>
            <p className="leaderboard-kpi-sub">Total Experience Points</p>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table Card */}
      <div className="leaderboard-main-card">
        {/* Simplified Tabs Row - Only Overall and Department */}
        <div className="leaderboard-tabs-row">
          <button
            className={`leaderboard-tab-btn ${activeTab === "overall" ? "active" : ""}`}
            onClick={() => setActiveTab("overall")}
          >
            Overall
          </button>
          <button
            className={`leaderboard-tab-btn ${activeTab === "department" ? "active" : ""}`}
            onClick={() => setActiveTab("department")}
          >
            Department
          </button>
          <button
            className={`leaderboard-tab-btn ${activeTab === "milestone" ? "active" : ""}`}
            onClick={() => setActiveTab("milestone")}
          >
            Milestone
          </button>
        </div>

        <div className="leaderboard-list-header">
          <h3 className="leaderboard-list-title">
            {activeTab === "overall" && "College-wide ranking"}
            {activeTab === "department" && `${userDept} Department Ranking`}
            {activeTab === "milestone" && "Milestone Completion Ranking"}
          </h3>
          <p className="leaderboard-list-desc">
            {activeTab === "overall"
              ? "College-wide student leaderboard across all departments"
              : activeTab === "department"
              ? `Specific department leaderboard showing assigned students for ${userDept}`
              : "Ranking based on roadmap milestones completed"}
          </p>
        </div>

        <div className="leaderboard-items-list">
          {displayedStudents.length === 0 ? (
            <div className="leaderboard-empty-state">
              No students found for this department leaderboard.
            </div>
          ) : (
            displayedStudents.map((st, idx) => (
              <div
                key={st.rank || idx}
                className={`leaderboard-row-item ${st.isCurrentUser ? "is-current-user" : ""}`}
              >
                <div className="leaderboard-row-left">
                  <span className={`leaderboard-rank-num ${getRankClass(idx + 1)}`}>
                    #{idx + 1}
                  </span>
                  <div className="leaderboard-avatar">{st.initials}</div>
                  <div className="leaderboard-user-meta">
                    <div className="leaderboard-user-name">
                      {st.name}
                      {st.isCurrentUser && <span className="you-pill">You</span>}
                    </div>
                    <div className="leaderboard-user-sub">{st.sub}</div>
                  </div>
                </div>

                <div className="leaderboard-score-val">{st.score}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
