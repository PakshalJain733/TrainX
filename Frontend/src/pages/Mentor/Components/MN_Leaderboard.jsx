import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '../../../utils/api';
import {
  Trophy,
  Flame,
  Crown,
  Medal,
  Search,
  Sparkles,
  Zap,
  Code2,
  RefreshCw,
  Star,
  Filter
} from "lucide-react";
import "../Styles/MN_Leaderboard.css";

const getInitials = (name) => {
  if (!name) return 'ST';
  const parts = String(name).trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarGradient = (index) => {
  const gradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #8b5cf6, #d946ef)',
  ];
  return gradients[index % gradients.length];
};

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [sortBy, setSortBy] = useState("rank"); // 'rank', 'points', 'solved', 'streak'
  const [refreshing, setRefreshing] = useState(false);

  const isApprovedActiveStudent = (item) => {
    if (!item) return false;
    if (item.is_approved !== undefined && item.is_approved !== null) {
      if (item.is_approved === 0 || item.is_approved === false || item.is_approved === '0') return false;
    }
    if (item.is_active !== undefined && item.is_active !== null) {
      if (item.is_active === 0 || item.is_active === false || item.is_active === '0') return false;
    }
    const st = String(item.status || item.approval_status || '').toLowerCase().trim();
    if (st === 'rejected' || st === 'inactive' || st === 'disabled' || st === 'pending') return false;
    return true;
  };

  const fetchLeaderboard = useCallback((showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    else setLoading(true);

    apiFetch("/mentor/leaderboard")
      .then((res) => {
        const data = res?.data || res;
        const rawList = data?.leaderboard || data?.entries || data?.overall || data?.department || (Array.isArray(data) ? data : []);
        const list = rawList.filter(isApprovedActiveStudent);
        setEntries(list);
        if (data?.stats) {
          setStats(data.stats);
        }
      })
      .catch((err) => {
        console.warn("[Leaderboard Fetch Error]", err);
        setEntries([]);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch("/mentor/leaderboard")
      .then((res) => {
        if (!active) return;
        const data = res?.data || res;
        const rawList = data?.leaderboard || data?.entries || data?.overall || data?.department || (Array.isArray(data) ? data : []);
        const list = rawList.filter(isApprovedActiveStudent);
        setEntries(list);
        if (data?.stats) {
          setStats(data.stats);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.warn("[Leaderboard Fetch Error]", err);
        setEntries([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);


  // Distinct batches for filter tabs
  const batches = useMemo(() => {
    const set = new Set();
    entries.forEach(e => {
      const b = e.batch || e.batch_name || e.batchName;
      if (b && b !== 'N/A') set.add(b);
    });
    return Array.from(set);
  }, [entries]);

  // Filtered & sorted entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => {
        const name = (e.name || e.student_name || "").toLowerCase();
        const roll = (e.rollNo || e.roll_number || "").toLowerCase();
        const batch = (e.batch || "").toLowerCase();
        return name.includes(q) || roll.includes(q) || batch.includes(q);
      });
    }

    if (selectedBatch !== "all") {
      result = result.filter(e => (e.batch || e.batch_name) === selectedBatch);
    }

    if (sortBy === "points") {
      result.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else if (sortBy === "solved") {
      result.sort((a, b) => (b.solved || 0) - (a.solved || 0));
    } else if (sortBy === "streak") {
      result.sort((a, b) => (b.activeStreak || b.streak || 0) - (a.activeStreak || a.streak || 0));
    } else {
      result.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    }

    return result;
  }, [entries, searchQuery, selectedBatch, sortBy]);

  // Derived KPI Stats
  const displayStats = useMemo(() => {
    if (stats) return stats;
    const total = entries.length;
    const topPerformer = entries[0]?.name || "N/A";
    const topScore = entries[0]?.points || 0;
    const totalPoints = entries.reduce((acc, curr) => acc + (curr.points || 0), 0);
    const avgScore = total > 0 ? Math.round(totalPoints / total) : 0;
    const totalSolved = entries.reduce((acc, curr) => acc + (curr.solved || 0), 0);
    const activeStreaksCount = entries.filter(s => (s.activeStreak || s.streak || 0) >= 3).length;

    return {
      totalStudents: total,
      topPerformer,
      topScore,
      avgScore,
      totalSolved,
      activeStreaksCount,
    };
  }, [entries, stats]);

  // Top 3 for Podium
  const topThree = useMemo(() => {
    if (entries.length < 3) return null;
    return [entries[1], entries[0], entries[2]]; // Order: 2nd, 1st, 3rd
  }, [entries]);

  return (
    <div className="mentor-leaderboard-container">
      {/* Header with Title and Refresh */}
      <div className="mentor-lb-header">
        <div className="mentor-lb-title-wrap">
          <div className="mentor-lb-icon-badge">
            <Trophy size={24} className="trophy-gold" />
          </div>
          <div>
            <h1 className="mentor-lb-title">Batch Leaderboard & Rankings</h1>
            <p className="mentor-lb-subtitle">
              Live student coding points, problems conquered, and active learning streaks across your assigned batches.
            </p>
          </div>
        </div>
        <button
          className={`mentor-lb-refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={() => fetchLeaderboard(true)}
          disabled={loading || refreshing}
          title="Refresh rankings"
        >
          <RefreshCw size={16} />
          <span>{refreshing ? 'Updating...' : 'Sync Ranks'}</span>
        </button>
      </div>

      {/* KPI Highlight Metric Cards */}
      <div className="mentor-lb-metrics-grid">
        <div className="mentor-lb-metric-card top-performer-card">
          <div className="metric-glow"></div>
          <div className="metric-header">
            <span className="metric-label">Leading Performer</span>
            <div className="metric-icon-wrap crown-glow">
              <Crown size={18} />
            </div>
          </div>
          <div className="metric-main">
            <div className="metric-value-highlight">{displayStats.topPerformer}</div>
            <div className="metric-badge-pill">
              <Sparkles size={13} /> {displayStats.topScore} pts
            </div>
          </div>
          <p className="metric-footer">Top rank in current evaluation cycle</p>
        </div>

        <div className="mentor-lb-metric-card">
          <div className="metric-header">
            <span className="metric-label">Batch Average XP</span>
            <div className="metric-icon-wrap zap-glow">
              <Zap size={18} />
            </div>
          </div>
          <div className="metric-main">
            <div className="metric-value">{displayStats.avgScore} <span className="metric-unit">pts</span></div>
          </div>
          <div className="metric-progress-wrap">
            <div className="metric-progress-bar" style={{ width: `${Math.min(100, displayStats.avgScore)}%` }}></div>
          </div>
          <p className="metric-footer">Calculated across {displayStats.totalStudents || 0} mentee records</p>
        </div>

        <div className="mentor-lb-metric-card">
          <div className="metric-header">
            <span className="metric-label">Problems Solved</span>
            <div className="metric-icon-wrap code-glow">
              <Code2 size={18} />
            </div>
          </div>
          <div className="metric-main">
            <div className="metric-value">{displayStats.totalSolved}</div>
            <span className="metric-sublabel">tasks completed</span>
          </div>
          <p className="metric-footer">Practice exercises & coding submissions</p>
        </div>

        <div className="mentor-lb-metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Streaks</span>
            <div className="metric-icon-wrap flame-glow">
              <Flame size={18} />
            </div>
          </div>
          <div className="metric-main">
            <div className="metric-value">{displayStats.activeStreaksCount}</div>
            <span className="metric-sublabel">students (3+ days)</span>
          </div>
          <p className="metric-footer">Maintaining continuous daily study momentum</p>
        </div>
      </div>

      {/* Top 3 Podium (Shown when at least 3 students are loaded) */}
      {!loading && topThree && (
        <div className="mentor-lb-podium-card">
          <div className="podium-card-header">
            <div className="podium-title">
              <Medal size={18} color="#f59e0b" />
              <span>Honor Roll Podium</span>
            </div>
            <span className="podium-badge">Top 3 Contenders</span>
          </div>

          <div className="podium-display">
            {/* Rank 2 - Silver */}
            {topThree[0] && (
              <div className="podium-step step-two">
                <div className="podium-avatar-wrap silver-ring">
                  <div className="podium-avatar" style={{ background: getAvatarGradient(1) }}>
                    {getInitials(topThree[0].name)}
                  </div>
                  <div className="podium-rank-tag silver">2</div>
                </div>
                <div className="podium-student-name">{topThree[0].name}</div>
                <div className="podium-batch-text">{topThree[0].batch || "Cohort"}</div>
                <div className="podium-score-pill">
                  <Star size={12} fill="#94a3b8" color="#94a3b8" />
                  <span>{topThree[0].points || 0} pts</span>
                </div>
                <div className="podium-pillar pillar-two">
                  <span>SILVER</span>
                </div>
              </div>
            )}

            {/* Rank 1 - Gold (Elevated Center) */}
            {topThree[1] && (
              <div className="podium-step step-one">
                <div className="crown-badge-floating">
                  <Crown size={22} fill="#eab308" color="#ca8a04" />
                </div>
                <div className="podium-avatar-wrap gold-ring">
                  <div className="podium-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                    {getInitials(topThree[1].name)}
                  </div>
                  <div className="podium-rank-tag gold">1</div>
                </div>
                <div className="podium-student-name highlight">{topThree[1].name}</div>
                <div className="podium-batch-text">{topThree[1].batch || "Cohort"}</div>
                <div className="podium-score-pill gold">
                  <Star size={13} fill="#eab308" color="#ca8a04" />
                  <span>{topThree[1].points || 0} pts</span>
                </div>
                <div className="podium-pillar pillar-one">
                  <span>CHAMPION</span>
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {topThree[2] && (
              <div className="podium-step step-three">
                <div className="podium-avatar-wrap bronze-ring">
                  <div className="podium-avatar" style={{ background: getAvatarGradient(2) }}>
                    {getInitials(topThree[2].name)}
                  </div>
                  <div className="podium-rank-tag bronze">3</div>
                </div>
                <div className="podium-student-name">{topThree[2].name}</div>
                <div className="podium-batch-text">{topThree[2].batch || "Cohort"}</div>
                <div className="podium-score-pill">
                  <Star size={12} fill="#b45309" color="#b45309" />
                  <span>{topThree[2].points || 0} pts</span>
                </div>
                <div className="podium-pillar pillar-three">
                  <span>BRONZE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mentor-lb-controls-card">
        <div className="mentor-lb-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search mentee by name, roll number, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div className="mentor-lb-filters-right">
          {batches.length > 0 && (
            <div className="mentor-lb-batch-select-wrap">
              <Filter size={14} className="filter-icon" />
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="mentor-lb-batch-select"
              >
                <option value="all">All Batches ({entries.length})</option>
                {batches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mentor-lb-sort-group">
            <span className="sort-label">Sort by:</span>
            <button
              className={`sort-pill ${sortBy === 'rank' ? 'active' : ''}`}
              onClick={() => setSortBy('rank')}
            >
              Rank
            </button>
            <button
              className={`sort-pill ${sortBy === 'points' ? 'active' : ''}`}
              onClick={() => setSortBy('points')}
            >
              Points
            </button>
            <button
              className={`sort-pill ${sortBy === 'solved' ? 'active' : ''}`}
              onClick={() => setSortBy('solved')}
            >
              Problems
            </button>
            <button
              className={`sort-pill ${sortBy === 'streak' ? 'active' : ''}`}
              onClick={() => setSortBy('streak')}
            >
              Streak
            </button>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="mentor-table-card">
        <div className="mentor-table-header-bar">
          <div className="table-header-left">
            <h3 className="table-header-title">Assigned Mentees Rankings Roster</h3>
            <span className="table-count-badge">{filteredEntries.length} mentees</span>
          </div>
          <div className="table-header-legend">
            <span className="legend-item"><span className="legend-dot gold"></span> Top Performer</span>
            <span className="legend-item"><span className="legend-dot blue"></span> Consistent</span>
            <span className="legend-item"><span className="legend-dot amber"></span> Needs Support</span>
          </div>
        </div>

        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                <th>Student</th>
                <th>Batch</th>
                <th>Coding Points</th>
                <th>Solved Tasks</th>
                <th>Active Streak</th>
                <th>Status Badge</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="mentor-lb-loading-state">
                      <div className="spinner"></div>
                      <p>Calculating live leaderboard rankings...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEntries.length > 0 ? (
                filteredEntries.map((student, index) => {
                  const rank = student.rank || index + 1;
                  const name = student.name || "Student";
                  const rollNo = student.rollNo || student.roll_number || "N/A";
                  const batch = student.batch || student.batch_name || "Assigned Batch";
                  const points = student.points ?? student.codingPoints ?? 0;
                  const solved = student.solved ?? student.solvedProblems ?? 0;
                  const streak = student.activeStreak ?? student.streak ?? 1;
                  const badge = student.badge || (rank === 1 ? 'Top Performer' : rank <= 3 ? 'Champion' : 'Consistent');

                  let rankPillClass = "rank-default";
                  let rankIcon = null;
                  if (rank === 1) {
                    rankPillClass = "rank-gold";
                    rankIcon = "🥇";
                  } else if (rank === 2) {
                    rankPillClass = "rank-silver";
                    rankIcon = "🥈";
                  } else if (rank === 3) {
                    rankPillClass = "rank-bronze";
                    rankIcon = "🥉";
                  }

                  let badgeColorClass = "badge-consistent";
                  if (badge.toLowerCase().includes("top") || badge.toLowerCase().includes("champion")) {
                    badgeColorClass = "badge-top";
                  } else if (badge.toLowerCase().includes("support") || badge.toLowerCase().includes("risk")) {
                    badgeColorClass = "badge-support";
                  } else if (badge.toLowerCase().includes("achiever")) {
                    badgeColorClass = "badge-achiever";
                  }

                  return (
                    <tr key={student.userId || student.id || index} className={rank <= 3 ? `top-row top-row-${rank}` : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <div className={`mentor-rank-pill ${rankPillClass}`}>
                          {rankIcon && <span className="rank-emoji">{rankIcon}</span>}
                          <span>#{rank}</span>
                        </div>
                      </td>
                      <td>
                        <div className="mentor-student-profile-cell">
                          <div className="mentor-avatar-initials" style={{ background: getAvatarGradient(index) }}>
                            {getInitials(name)}
                          </div>
                          <div className="mentor-student-info">
                            <span className="mentor-student-name">{name}</span>
                            <span className="mentor-student-sub">{rollNo}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="mentor-batch-tag">{batch}</span>
                      </td>
                      <td>
                        <div className="mentor-points-cell">
                          <Star size={14} className="star-icon" />
                          <span className="points-bold">{points}</span>
                          <span className="points-unit">pts</span>
                        </div>
                      </td>
                      <td>
                        <div className="mentor-solved-cell">
                          <span className="solved-count">{solved}</span>
                          <span className="solved-label">problems</span>
                        </div>
                      </td>
                      <td>
                        <div className="mentor-streak-pill">
                          <Flame size={15} color="#f59e0b" fill="#f59e0b" />
                          <span>{streak} Days</span>
                        </div>
                      </td>
                      <td>
                        <span className={`mentor-status-badge ${badgeColorClass}`}>
                          {badge}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="mentor-lb-empty-state">
                      <div className="empty-trophy-glow">
                        <Trophy size={42} />
                      </div>
                      <h4 className="empty-title">
                        {searchQuery ? "No matching assigned students found" : "No Mentees Assigned to You Yet"}
                      </h4>
                      <p className="empty-desc">
                        {searchQuery
                          ? `No assigned mentee matched your search "${searchQuery}". Try clearing your search.`
                          : "This leaderboard exclusively displays students assigned to your mentor profile. Once an administrator assigns students or a batch to you, their live rankings, points, and problems solved will appear here."}
                      </p>
                      {searchQuery && (
                        <button className="empty-reset-btn" onClick={() => { setSearchQuery(""); setSelectedBatch("all"); }}>
                          Clear Search Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
