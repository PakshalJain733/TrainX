import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { Trophy, Flame } from 'lucide-react';
import "../Styles/MN_Leaderboard.css";

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data) {
          const list = res.data.overall || res.data.department || (Array.isArray(res.data) ? res.data : []);
          setLeaderboardData(list);
        } else {
          setLeaderboardData([]);
        }
      })
      .catch(() => setLeaderboardData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mentor-leaderboard-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Trophy size={20} color="#4f46e5" />
            <span>Batch Leaderboard & Rankings</span>
          </h2>
          <p className="mentor-page-subtitle">Student coding points, solved problem counts, and active streaks</p>
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
      </div>
    </div>
  );
}
