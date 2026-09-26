import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { Trophy, Flame } from 'lucide-react';

import "../Styles/MN_Leaderboard.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getEntries = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.entries)) return payload.entries;
  return [];
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const firstValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getNumber = (source, keys) => asNumber(firstValue(source, keys));

const formatMetric = (value, suffix = "") => {
  if (value === undefined || value === null || value === "") return "N/A";
  return `${value}${suffix}`;
};

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch("/mentor/leaderboard")
      .then((res) => {
        if (!mounted) return;
        const list = res?.data?.overall || res?.data?.department || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        setLeaderboardData(list);
        setEntries(list);
      })
      .catch(() => {
        if (mounted) {
          setLeaderboardData([]);
          setEntries([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mentor-leaderboard-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Trophy size={20} color="#4f46e5" />
            <span>Batch Leaderboard & Rankings</span>
          </h2>
          <p className="mentor-page-subtitle">Student rankings and activity values returned by the mentor service</p>
        </div>
      </div>

      <div className="mentor-table-card">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading rankings...</div>
        ) : leaderboardData.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
            No leaderboard rankings found in database.
          </div>
        ) : (
          <div className="mentor-table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Cohort</th>
                  <th>Coding Points</th>
                  <th>Solved Problems</th>
                  <th>Active Streak</th>
                  <th>Badge</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((lb, idx) => (
                  <tr key={lb.id || idx}>
                    <td className="mentor-lb-rank">#{lb.rank || idx + 1}</td>
                    <td className="mentor-lb-name">{lb.name}</td>
                    <td className="mentor-lb-batch">{lb.department || lb.college || lb.batch || 'Batch'}</td>
                    <td className="mentor-lb-points">{lb.score || lb.points || 0} pts</td>
                    <td className="mentor-lb-solved">{lb.quizzes || lb.solved || 0}</td>
                    <td>
                      <span className="mentor-lb-streak">
                        <Flame size={14} color="#f59e0b" fill="#f59e0b" /> {lb.streak || 0}
                      </span>
                    </td>
                    <td>
                      <span className="mentor-lb-badge">
                        {lb.badge || (lb.score > 90 ? 'Expert' : lb.score > 70 ? 'Advanced' : 'Intermediate')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Coding Points</th>
                <th>Solved Problems</th>
                <th>Active Streak</th>
                <th>Badge</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="mentor-lb-empty">Loading leaderboard...</div></td></tr>
              ) : entries.length > 0 ? (
                entries.map((entry, index) => {
                  const rank = getNumber(entry, ["rank", "position"]) ?? index + 1;
                  const name = textValue(firstValue(entry, ["name", "studentName", "student_name"])) || "N/A";
                  const batch = textValue(firstValue(entry, ["batch", "batchName", "batch_name", "batch"])) || "N/A";
                  const points = getNumber(entry, ["points", "xp", "codingPoints", "coding_points", "totalPoints"]);
                  const solved = getNumber(entry, ["solved", "solvedProblems", "solved_problems", "problemsSolved"]);
                  const streak = getNumber(entry, ["streak", "activeStreak", "active_streak"]);
                  const badge = textValue(firstValue(entry, ["badge", "achievement", "title"])) || "N/A";
                  return (
                    <tr key={textValue(firstValue(entry, ["id", "studentId", "student_id", "userId"])) || index}>
                      <td className="mentor-lb-rank">#{rank}</td>
                      <td className="mentor-lb-name">{name}</td>
                      <td className="mentor-lb-batch">{batch}</td>
                      <td className="mentor-lb-points">{formatMetric(points, " pts")}</td>
                      <td className="mentor-lb-solved">{formatMetric(solved)}</td>
                      <td>
                        <span className="mentor-lb-streak">
                          <Flame size={14} color="#f59e0b" fill="#f59e0b" /> {formatMetric(streak)}
                        </span>
                      </td>
                      <td><span className="mentor-lb-badge">{badge}</span></td>
                    </tr>
                  );
                })
              ) : (
                  <td colSpan={7}>
                    <div className="mentor-lb-empty">
                      <Trophy size={28} />
                      <p>No records yet</p>
                    </div>
                  </td>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
