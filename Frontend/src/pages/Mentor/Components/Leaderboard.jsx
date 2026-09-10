import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Medal, RefreshCw, Users, Award } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/Leaderboard.css';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('overall'); // 'overall' | 'department' | 'milestone' | 'batches'
  const [leaderboardData, setLeaderboardData] = useState({
    overall: [],
    department: [],
    milestone: [],
    topBatches: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = () => {
    setLoading(true);
    apiFetch('/leaderboards')
      .then((res) => {
        if (res && res.data) {
          setLeaderboardData(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch mentor leaderboard data:', err);
      })
      .finally(() => setLoading(false));
  };

  let currentList = [];
  if (activeTab === 'overall') currentList = leaderboardData.overall || [];
  else if (activeTab === 'department') currentList = leaderboardData.department || [];
  else if (activeTab === 'milestone') currentList = leaderboardData.milestone || [];
  else if (activeTab === 'batches') currentList = leaderboardData.topBatches || [];

  return (
    <div className="mentor-leaderboard-container">
      <div className="mentor-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="mentor-page-title">
            <Trophy size={20} color="#4f46e5" />
            <span>Leaderboard & Cohort Standings</span>
          </h2>
          <p className="mentor-page-subtitle">Real-time student performance, milestone progress, and batch rankings</p>
        </div>
        <button
          onClick={fetchLeaderboardData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overall')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            border: activeTab === 'overall' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeTab === 'overall' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'overall' ? '#ffffff' : '#64748b'
          }}
        >
          Overall Ranking
        </button>
        <button
          onClick={() => setActiveTab('department')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            border: activeTab === 'department' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeTab === 'department' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'department' ? '#ffffff' : '#64748b'
          }}
        >
          Department Ranking
        </button>
        <button
          onClick={() => setActiveTab('milestone')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            border: activeTab === 'milestone' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeTab === 'milestone' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'milestone' ? '#ffffff' : '#64748b'
          }}
        >
          Milestone Velocity
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            border: activeTab === 'batches' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeTab === 'batches' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'batches' ? '#ffffff' : '#64748b'
          }}
        >
          Top Batches
        </button>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', marginRight: 10 }} />
              <span>Loading leaderboard data...</span>
              <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            </div>
          ) : currentList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No records found for this view.
            </div>
          ) : (
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>{activeTab === 'batches' ? 'Batch Name' : 'Student Name'}</th>
                  <th>{activeTab === 'batches' ? 'Enrolled Count' : 'Department / Batch'}</th>
                  <th>College</th>
                  <th>Overall Score</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((lb, idx) => (
                  <tr key={lb.id || lb.rank || idx}>
                    <td className="mentor-lb-rank font-extrabold text-indigo-600">#{lb.rank || idx + 1}</td>
                    <td className="mentor-lb-name font-bold text-slate-800 dark:text-white">{lb.name}</td>
                    <td className="mentor-lb-batch">{activeTab === 'batches' ? `${lb.students} Students` : (lb.department || lb.sub || lb.batch || 'General')}</td>
                    <td>{lb.college || 'PVPPCOE'}</td>
                    <td className="mentor-lb-points font-extrabold text-indigo-600">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Flame size={14} color="#ea580c" />
                        <span>{lb.score !== undefined ? lb.score : lb.overall_score || 0} {activeTab === 'milestone' ? '%' : 'pts'}</span>
                      </div>
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
