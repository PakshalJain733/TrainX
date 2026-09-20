import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Search, ArrowUp, Star } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/Students.css";

export default function CoordinatorLeaderboard() {
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/leaderboards")
      .then((res) => {
        const data = (res && res.data) || {};
        const overall = Array.isArray(data.overall) ? data.overall : [];
        const batches = Array.isArray(data.topBatches) ? data.topBatches : [];
        setBatchFilter("All");
        setLeaderboardData(overall.map((s, idx) => ({
          rank: s.rank || idx + 1,
          name: s.name,
          rollNo: `#${s.id || ''}`.trim(),
          batch: s.sub || "Engineering",
          score: s.score || 0,
          problemsSolved: 0,
          attendance: Math.round(s.score || 0),
          badge: (s.rank === 1 && "🥇 Rank 1") || (s.rank === 2 && "🥈 Rank 2") || (s.rank === 3 && "🥉 Rank 3") || (s.rank <= 5 && "Top 5%") || (s.rank <= 10 && "Top 10%") || "Contender",
          avatar: s.initials || (s.name ? s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?"),
          batchList: batches,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const batchOptions = Array.from(new Set(leaderboardData.map((s) => s.batch).filter(Boolean)));

  const filteredLeaderboard = leaderboardData.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === "All" || s.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  const top3 = leaderboardData.slice(0, 3);

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">
            <Trophy size={22} className="coord-header-icon" color="#f59e0b" />
            Department Student Leaderboard
          </h1>
          <p className="coord-page-sub">
            Real ranking computed from assessment (60%) and attendance (40%) performance across enrolled students.
          </p>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="coord-stats-grid">
        {top3.length === 0 ? (
          <div className="coord-stat-card">
            <div className="coord-stat-value" style={{ color: "#475569" }}>No rankings yet</div>
            <div className="coord-stat-subtext">Ranks appear once students complete assessments or attend sessions.</div>
          </div>
        ) : (
          top3.map((s, i) => (
            <div key={s.rank} className="coord-stat-card" style={i === 0 ? { borderColor: "#fde68a", background: "#fffbeb" } : {}}>
              <div className="coord-stat-label">{s.badge}</div>
              <div className="coord-stat-value" style={{ color: i === 0 ? "#d97706" : i === 1 ? "#475569" : "#b45309" }}>
                {s.name}
              </div>
              <div className="coord-stat-subtext">{s.score}% Performance Score</div>
            </div>
          ))
        )}
      </div>

      {/* Filter Bar */}
      <div className="coord-filter-bar">
        <div className="coord-search-wrap">
          <Search size={16} className="coord-search-icon" />
          <input
            type="text"
            className="coord-search-input coord-search-input--with-icon"
            placeholder="Search student..."
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
          {batchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Table Card */}
      <div className="coord-table-card">
        {loading ? (
          <div className="coord-empty-state" style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading leaderboard…</div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="coord-empty-state" style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            No students with performance data yet.
          </div>
        ) : (
          <table className="coord-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Department / Batch</th>
                <th>Performance Score</th>
                <th>Attendance Index</th>
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
                  <td><span className="coord-cell-bold" style={{ color: "#4f46e5" }}>{s.score}%</span></td>
                  <td><span className="coord-cell-bold">{s.attendance}%</span></td>
                  <td><span className="coord-badge coord-badge--primary">{s.badge}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}