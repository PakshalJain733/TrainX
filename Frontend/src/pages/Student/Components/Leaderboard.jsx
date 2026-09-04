import React, { useState } from "react";
import { Trophy, Medal, Award, Flame, Users, Sparkles } from "lucide-react";
import "../Styles/Leaderboard.css";

const leaderboardData = {
  overall: [
    { rank: 1, initials: "SP", name: "Sneha Patil", sub: "CS · 7 milestones", score: 94, isCurrentUser: false },
    { rank: 2, initials: "AV", name: "Aman Verma", sub: "IT · 7 milestones", score: 92, isCurrentUser: false },
    { rank: 3, initials: "RS", name: "Riya Shah", sub: "AIML · 6 milestones", score: 90, isCurrentUser: false },
    { rank: 4, initials: "KM", name: "Karan Mehta", sub: "ECS · 6 milestones", score: 88, isCurrentUser: false },
    { rank: 5, initials: "NJ", name: "Neha Joshi", sub: "CS · 6 milestones", score: 86, isCurrentUser: false },
    { rank: 12, initials: "P", name: "Pakshal", sub: "ECS · 2 milestones", score: 78, isCurrentUser: true },
  ],
  department: [
    { rank: 1, initials: "KM", name: "Karan Mehta", sub: "ECS · 6 milestones", score: 88, isCurrentUser: false },
    { rank: 2, initials: "TD", name: "Tanvi Deshmukh", sub: "ECS · 4 milestones", score: 82, isCurrentUser: false },
    { rank: 3, initials: "P", name: "Pakshal", sub: "ECS · 2 milestones", score: 78, isCurrentUser: true },
    { rank: 4, initials: "RK", name: "Rohan Kulkarni", sub: "ECS · 2 milestones", score: 74, isCurrentUser: false },
  ],
  milestone: [
    { rank: 1, initials: "SP", name: "Sneha Patil", sub: "7 milestones completed", score: 98, isCurrentUser: false },
    { rank: 2, initials: "AV", name: "Aman Verma", sub: "7 milestones completed", score: 96, isCurrentUser: false },
    { rank: 7, initials: "P", name: "Pakshal", sub: "2 milestones completed", score: 82, isCurrentUser: true },
  ],
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
          {students.map((st) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
