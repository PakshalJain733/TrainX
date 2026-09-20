import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Award, Star, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/Leaderboard.css';

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/mentor/leaderboard")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.leaderboard)) {
          setBoard(res.data.leaderboard);
        }
      })
      .catch(() => setBoard([]))
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
          <p className="mentor-page-subtitle">Rankings computed from real attendance and assessment performance</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b', gap: 12 }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
          <p style={{ fontSize: 13 }}>Loading leaderboard...</p>
        </div>
      ) : (
        <div className="mentor-table-card">
          <div className="mentor-table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Cohort</th>
                  <th>Performance Score</th>
                  <th>Attendance</th>
                  <th>Assessments</th>
                  <th>Badge</th>
                </tr>
              </thead>
              <tbody>
                {board.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="mentor-empty-table-cell">
                      No leaderboard data available yet.
                    </td>
                  </tr>
                ) : (
                  board.map((lb) => (
                    <tr key={lb.rank}>
                      <td className="mentor-lb-rank font-extrabold text-indigo-600">#{lb.rank}</td>
                      <td className="mentor-lb-name font-bold text-slate-800 dark:text-white">{lb.name}</td>
                      <td className="mentor-lb-batch">{lb.batch}</td>
                      <td className="mentor-lb-points font-extrabold text-indigo-600">
                        {lb.score == null ? "N/A" : `${lb.score}`} pts
                      </td>
                      <td className="mentor-lb-solved font-bold">
                        {lb.attendance != null && lb.attendance > 0 ? `${lb.attendance}%` : "No records"}
                      </td>
                      <td className="mentor-lb-solved font-bold">
                        {lb.assessment == null ? "N/A" : `${lb.assessment}%`}
                      </td>
                      <td>
                        <span className="mentor-lb-badge px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {lb.badge}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}