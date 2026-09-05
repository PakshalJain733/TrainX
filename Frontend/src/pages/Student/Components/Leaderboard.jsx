import React, { useState } from "react";
import { Trophy, Medal, Award, Flame, Users, Sparkles } from "lucide-react";
import "../Styles/Leaderboard.css";

const leaderboardData = {
  overall: [],
  department: [],
  milestone: [],
};

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("overall");

  const students = leaderboardData[activeTab] || leaderboardData.overall;

  const getRankClass = (r) => {
    if (r === 1) return "rank-1";
    if (r === 2) return "rank-2";
    if (r === 3) return "rank-3";
    return "";
  };

  return (
    <div className="leaderboard-page">
      {/* 3 Top KPIs */}
      <div className="leaderboard-kpis-grid">
        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap">
            <Trophy size={22} />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Overall Rank</div>
            <p className="leaderboard-kpi-val">#12</p>
            <p className="leaderboard-kpi-sub">of 420 students</p>
          </div>
        </div>

        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap leaderboard-kpi-icon-wrap--emerald">
            <Medal size={22} />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Department Rank</div>
            <p className="leaderboard-kpi-val">#3</p>
            <p className="leaderboard-kpi-sub">Electronics & Computer Science</p>
          </div>
        </div>

        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap leaderboard-kpi-icon-wrap--purple">
            <Award size={22} />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Milestone Rank</div>
            <p className="leaderboard-kpi-val">#7</p>
            <p className="leaderboard-kpi-sub">Milestone completion board</p>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table Card */}
      <div className="leaderboard-main-card">
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
            Coordinator / Department
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
            {activeTab === "department" && "Department-level ranking"}
            {activeTab === "milestone" && "Milestone velocity ranking"}
          </h3>
          <p className="leaderboard-list-desc">Ranked by overall academic and technical performance score</p>
        </div>

        <div className="leaderboard-items-list">
          {students.length === 0 ? (
            <div className="leaderboard-empty-state">
              No leaderboard rankings available yet.
            </div>
          ) : (
            students.map((st) => (
              <div
                key={st.name}
                className={`leaderboard-row-item ${st.isCurrentUser ? "is-current-user" : ""}`}
              >
                <div className="leaderboard-row-left">
                  <span className={`leaderboard-rank-num ${getRankClass(st.rank)}`}>
                    #{st.rank}
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
