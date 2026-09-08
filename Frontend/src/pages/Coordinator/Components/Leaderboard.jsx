import { useState } from "react";
import { Trophy, Medal, Award, Search, ArrowUp, Star } from "lucide-react";
import "../Styles/Students.css";

export default function CoordinatorLeaderboard() {
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");

  const leaderboardData = [
    { rank: 1, name: "Aarav Sharma", rollNo: "CSE-2026-001", batch: "CSE-2026-A", score: 2840, problemsSolved: 142, attendance: 98, badge: "🥇 Rank 1", avatar: "AS" },
    { rank: 2, name: "Ananya Iyer", rollNo: "IT-2026-031", batch: "IT-2026-Beta", score: 2710, problemsSolved: 135, attendance: 96, badge: "🥈 Rank 2", avatar: "AI" },
    { rank: 3, name: "Riya Patel", rollNo: "CSE-2026-014", batch: "CSE-2026-A", score: 2590, problemsSolved: 128, attendance: 94, badge: "🥉 Rank 3", avatar: "RP" },
    { rank: 4, name: "Rohan Kulkarni", rollNo: "CSE-2026-045", batch: "CSE-2026-B", score: 2420, problemsSolved: 119, attendance: 92, badge: "Top 5%", avatar: "RK" },
    { rank: 5, name: "Siddharth Verma", rollNo: "AI-2026-009", batch: "AI-DS-2026-Alpha", score: 2310, problemsSolved: 112, attendance: 88, badge: "Top 5%", avatar: "SV" },
    { rank: 6, name: "Neha Gupta", rollNo: "CSE-2026-022", batch: "CSE-2026-A", score: 2190, problemsSolved: 104, attendance: 91, badge: "Top 10%", avatar: "NG" },
  ];

  const filteredLeaderboard = leaderboardData.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === "All" || s.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">
            <Trophy size={22} className="coord-header-icon" color="#f59e0b" />
            Department Student Leaderboard
          </h1>
          <p className="coord-page-sub">
            Real-time gamified XP points, coding problems solved, and weekly rank standings across all batches.
          </p>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="coord-stats-grid">
        <div className="coord-stat-card" style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
          <div className="coord-stat-label">🥇 Rank 1 · Department Champion</div>
          <div className="coord-stat-value" style={{ color: "#d97706" }}>Aarav Sharma</div>
          <div className="coord-stat-subtext">2,840 XP · 142 Problems Solved</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">🥈 Rank 2 · Runner Up</div>
          <div className="coord-stat-value" style={{ color: "#475569" }}>Ananya Iyer</div>
          <div className="coord-stat-subtext">2,710 XP · 135 Problems Solved</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">🥉 Rank 3 · Second Runner Up</div>
          <div className="coord-stat-value" style={{ color: "#b45309" }}>Riya Patel</div>
          <div className="coord-stat-subtext">2,590 XP · 128 Problems Solved</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="coord-filter-bar">
        <div className="coord-search-wrap">
          <Search size={16} className="coord-search-icon" />
          <input
            type="text"
            className="coord-search-input coord-search-input--with-icon"
            placeholder="Search student or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="coord-select"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="All">All Batches</option>
          <option value="CSE-2026-A">CSE-2026-A</option>
          <option value="AI-DS-2026-Alpha">AI-DS-2026-Alpha</option>
          <option value="IT-2026-Beta">IT-2026-Beta</option>
          <option value="CSE-2026-B">CSE-2026-B</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="coord-table-card">
        <table className="coord-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Batch</th>
              <th>Total XP</th>
              <th>Problems Solved</th>
              <th>Attendance</th>
              <th>Standing Badge</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboard.map((s) => (
              <tr key={s.rank}>
                <td>
                  <span style={{ fontWeight: 800, fontSize: "14px", color: s.rank <= 3 ? "#d97706" : "#64748b" }}>
                    #{s.rank}
                  </span>
                </td>
                <td>
                  <div className="coord-cell-user">
                    <div className="coord-avatar-sm">{s.avatar}</div>
                    <div>
                      <div className="coord-cell-bold">{s.name}</div>
                      <div className="coord-cell-meta">{s.rollNo}</div>
                    </div>
                  </div>
                </td>
                <td><span className="coord-badge coord-badge--batch">{s.batch}</span></td>
                <td><span className="coord-cell-bold" style={{ color: "#4f46e5" }}>{s.score.toLocaleString()} XP</span></td>
                <td><span className="coord-cell-bold">{s.problemsSolved} Solved</span></td>
                <td><span className="coord-cell-bold">{s.attendance}%</span></td>
                <td><span className="coord-badge coord-badge--primary">{s.badge}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
