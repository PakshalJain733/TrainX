import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Flame, Users, Sparkles, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/Leaderboard.css";

const defaultLeaderboardData = {
  overall: [],
  department: [],
  milestone: [],
};

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("overall");
  const [data, setData] = useState(defaultLeaderboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load leaderboard:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const students = data[activeTab] || [];

  const getRankClass = (r) => {
    if (r === 1) return "rank-1";
    if (r === 2) return "rank-2";
    if (r === 3) return "rank-3";
    return "";
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#64748b' }}>
        <RefreshCw size={28} style={{ animation: 'spin 1.2s linear infinite', color: '#4f46e5', marginBottom: 14 }} />
        <p>Loading leaderboard rankings...</p>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

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
            <p className="leaderboard-kpi-val">#{data.overall.find(s => s.isCurrentUser)?.rank || '--'}</p>
            <p className="leaderboard-kpi-sub">College-wide ranking</p>
          </div>
        </div>

        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap leaderboard-kpi-icon-wrap--emerald">
            <Medal size={22} />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Department Rank</div>
            <p className="leaderboard-kpi-val">#{data.department.find(s => s.isCurrentUser)?.rank || '--'}</p>
            <p className="leaderboard-kpi-sub">Within your department</p>
          </div>
        </div>

        <div className="leaderboard-kpi-card">
          <div className="leaderboard-kpi-icon-wrap leaderboard-kpi-icon-wrap--purple">
            <Award size={22} />
          </div>
          <div>
            <div className="leaderboard-kpi-label">Milestone Rank</div>
            <p className="leaderboard-kpi-val">#{data.milestone.find(s => s.isCurrentUser)?.rank || '--'}</p>
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
            <>
              {/* Header Row for clarity */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px 10px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                <div style={{ width: '40px', paddingRight: '8px' }}>Rank</div>
                <div style={{ flex: 1 }}>Student</div>
                <div style={{ paddingLeft: '20px' }}>Score</div>
              </div>
              
              {students.map((st) => (
                <div
                  key={st.name + st.rank}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

