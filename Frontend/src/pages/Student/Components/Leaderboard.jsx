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
  const [deptStudents, setDeptStudents] = useState([]);
  const [milestoneStudents, setMilestoneStudents] = useState([]);
  const [userDept, setUserDept] = useState("Computer Engineering & IT");
  const [myRank, setMyRank] = useState("#—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u && (u.department || u.studentProfile?.department)) {
        setUserDept(u.department || u.studentProfile?.department);
      }
    } catch (e) {}

    // Fetch real leaderboard rankings from the leaderboard API
    apiFetch("/leaderboards")
      .then((res) => {
        const data = (res && res.data) || {};
        const overall = Array.isArray(data.overall) ? data.overall : [];
        const department = Array.isArray(data.department) ? data.department : [];
        const milestone = Array.isArray(data.milestone) ? data.milestone : [];

        const fmt = (list) =>
          list.map((item) => ({
            rank: item.rank,
            name: item.name,
            score: `${item.score}%`,
            initials: item.initials || getInitials(item.name),
            department: item.sub || userDept,
            sub: item.isCurrentUser ? "Your Account" : (item.sub || "Enrolled Student"),
            isCurrentUser: item.isCurrentUser,
          }));

        setAllStudents(fmt(overall));
        setDeptStudents(fmt(department));
        setMilestoneStudents(fmt(milestone));

        const list = activeTab === "department" ? department : activeTab === "milestone" ? milestone : overall;
        const currentUser = list.find((s) => s.isCurrentUser);
        if (currentUser) {
          setMyRank(`#${currentUser.rank}`);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab]);

  const displayedStudents =
    activeTab === "department" ? deptStudents : activeTab === "milestone" ? milestoneStudents : allStudents;

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
            <p className="leaderboard-kpi-val">{myRank}</p>
            <p className="leaderboard-kpi-sub">of {allStudents.length || 1} enrolled students</p>
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
          <p className="leaderboard-list-desc">Ranked by real attendance (40%) and assessment (60%) performance</p>
        </div>

        <div className="leaderboard-items-list">
          {loading ? (
            <div className="leaderboard-empty-state">Loading rankings…</div>
          ) : displayedStudents.length === 0 ? (
            <div className="leaderboard-empty-state">
              No students found with performance data yet.
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