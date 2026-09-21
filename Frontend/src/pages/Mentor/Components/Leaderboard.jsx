import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Award, Star } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/Leaderboard.css';

const defaultLeaderboard = [
  { rank: 1, name: "Rahul Verma", batch: "BE-CS-2026-A", points: "2,450", solved: 142, streak: "14 Days", badge: "Legendary" },
  { rank: 2, name: "Pooja Deshmukh", batch: "TE-IT-2026-B", points: "2,280", solved: 135, streak: "12 Days", badge: "Grandmaster" },
  { rank: 3, name: "Ananya Patel", batch: "BE-CS-2026-A", points: "2,150", solved: 128, streak: "9 Days", badge: "Master" },
  { rank: 4, name: "Siddharth Rao", batch: "TE-IT-2026-B", points: "1,840", solved: 96, streak: "5 Days", badge: "Expert" },
  { rank: 5, name: "Vikas Patil", batch: "BE-EXTC-2026-C", points: "1,620", solved: 84, streak: "3 Days", badge: "Specialist" },
];

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data && res.data.overall) {
          const sorted = res.data.overall.map((s, idx) => ({
            rank: s.rank || idx + 1,
            name: s.name,
            batch: s.batch || "Unassigned",
            points: s.score || 0,
            solved: Math.floor(s.progress / 10), // Mocked for now based on progress
            streak: s.progress ? `${Math.floor(s.progress / 5)} Days` : "0 Days",
            badge: idx === 0 ? "Legendary" : idx === 1 ? "Grandmaster" : idx === 2 ? "Master" : "Expert",
          }));
          setBoard(sorted);
        }
      })
      .catch((err) => console.error("Error fetching mentor leaderboard:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mentor-leaderboard-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Trophy size={20} color="#4f46e5" />
            <span>Assigned Batches Leaderboard</span>
          </h2>
          <p className="mentor-page-subtitle">Rankings and scores for students in your assigned batches</p>
        </div>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Cohort</th>
                <th>Overall Score</th>
                <th>Assessments</th>
                <th>Active Streak</th>
                <th>Badge</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>Loading leaderboard...</td>
                </tr>
              ) : board.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>No students found in your assigned batches.</td>
                </tr>
              ) : (
                board.map((lb) => (
                  <tr key={lb.rank}>
                    <td className="mentor-lb-rank font-extrabold text-indigo-600">#{lb.rank}</td>
                    <td className="mentor-lb-name font-bold text-slate-800 dark:text-white">{lb.name}</td>
                    <td className="mentor-lb-batch">{lb.batch}</td>
                    <td className="mentor-lb-points font-extrabold text-indigo-600">{lb.points.toLocaleString()} XP</td>
                    <td className="mentor-lb-solved font-bold">{lb.solved}</td>
                    <td>
                      <span className="mentor-lb-streak flex items-center gap-1 font-semibold text-amber-500">
                        <Flame size={14} color="#f59e0b" fill="#f59e0b" /> {lb.streak}
                      </span>
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
    </div>
  );
}
