import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { Trophy, Flame } from 'lucide-react';
import "../Styles/CO_Leaderboard.css";

export default function CoordinatorLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/leaderboards")
      .then((res) => {
        let list = [];
        if (res && res.data) {
          list = Array.isArray(res.data) ? res.data : (res.data.leaderboard || res.data.topPerformers || []);
        } else if (res && Array.isArray(res)) {
          list = res;
        }
        setLeaderboard(list);
      })
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="coordinator-leaderboard-container page-fade-in">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Trophy size={20} color="#4f46e5" />
            <span>Batch Leaderboard & Rankings</span>
          </h2>
          <p className="mentor-page-subtitle">Student coding points, solved problem counts, and active streaks fetched live from database</p>
        </div>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading leaderboard...</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
              No leaderboard student records found in database.
            </div>
          ) : (
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
                {leaderboard.map((lb, idx) => (
                  <tr key={lb.id || idx}>
                    <td className="co-lb-rank">#{lb.rank || idx + 1}</td>
                    <td className="co-lb-name">{lb.name || lb.student_name}</td>
                    <td className="co-lb-batch">{lb.batch || lb.batch_name || "ECS"}</td>
                    <td className="co-lb-points">{lb.points || lb.overall_score || lb.score || 0} pts</td>
                    <td className="co-lb-solved">{lb.solved || lb.solvedCount || 0}</td>
                    <td>
                      <span className="co-lb-streak">
                        <Flame size={14} color="#f59e0b" fill="#f59e0b" /> {lb.streak || "3 Days"}
                      </span>
                    </td>
                    <td>
                      <span className="co-lb-badge">
                        {lb.badge || (idx < 3 ? "Gold Member" : "Active Member")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
