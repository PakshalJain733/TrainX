import React from 'react';
import { mentorLeaderboard } from '../../../data/mentorMockData';
import { Trophy, Flame } from 'lucide-react';
import "../Styles/MN_Leaderboard.css";

export default function Leaderboard() {
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
              {mentorLeaderboard.map((lb) => (
                <tr key={lb.rank}>
                  <td className="mentor-lb-rank">#{lb.rank}</td>
                  <td className="mentor-lb-name">{lb.name}</td>
                  <td className="mentor-lb-batch">{lb.batch}</td>
                  <td className="mentor-lb-points">{lb.points} pts</td>
                  <td className="mentor-lb-solved">{lb.solved}</td>
                  <td>
                    <span className="mentor-lb-streak">
                      <Flame size={14} color="#f59e0b" fill="#f59e0b" /> {lb.streak}
                    </span>
                  </td>
                  <td>
                    <span className="mentor-lb-badge">
                      {lb.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
