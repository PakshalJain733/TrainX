import React, { useState, useEffect } from "react";
import { Trophy, Flame, Medal, Users, RefreshCw, Award } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminLeaderboard.css";

const getRankClass = (r) => r === 1 ? "admin-rank-1" : r === 2 ? "admin-rank-2" : r === 3 ? "admin-rank-3" : "";

export default function AdminLeaderboard() {
  const [activeTab, setActiveTab] = useState("overall"); // 'overall' | 'department' | 'milestone' | 'batches'
  const [data, setData] = useState({ overall: [], department: [], milestone: [], topBatches: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = () => {
    setLoading(true);
    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch admin leaderboard data:", err);
      })
      .finally(() => setLoading(false));
  };

  let currentList = [];
  if (activeTab === "overall") currentList = data.overall || [];
  else if (activeTab === "department") currentList = data.department || [];
  else if (activeTab === "milestone") currentList = data.milestone || [];
  else if (activeTab === "batches") currentList = data.topBatches || [];

  return (
    <div className="admin-leaderboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <SectionHeader
          title="Leaderboard & Rankings"
          description="Campus-wide student overall standings, department level performance, and milestone rankings."
        />
        <button
          onClick={fetchLeaderboard}
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

      <Card className="lb-card">
        <CardHeader className="lb-card-header">
          <div className="lb-header-icon lb-header-icon--trophy">
            <Trophy size={18} />
          </div>
          <div>
            <CardTitle>
              {activeTab === 'overall' && 'Top Students (Overall)'}
              {activeTab === 'department' && 'Department Rankings'}
              {activeTab === 'milestone' && 'Milestone Velocity Rankings'}
              {activeTab === 'batches' && 'Top Batches Rankings'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'milestone' ? 'Ranked by completed roadmap items & progress percentage' : 'Ranked by overall composite score across assessments, coding, and interviews'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="lb-list">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', marginRight: 10 }} />
              <span>Loading rankings...</span>
              <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            </div>
          ) : currentList.length === 0 ? (
            <div className="admin-empty-state-card">
              <Trophy size={32} className="admin-empty-state-icon" />
              <p className="admin-empty-state-title">No leaderboard entries found for this category</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                <div style={{ width: '50px', paddingRight: '8px' }}>Rank</div>
                <div style={{ flex: 1, paddingLeft: '4px' }}>{activeTab === 'batches' ? 'Batch' : 'Student'}</div>
                <div style={{ paddingLeft: '16px' }}>Score</div>
              </div>
              {currentList.map((s, idx) => (
                <div key={s.id || s.rank || idx} className="lb-item">
                  <span className={`lb-rank ${getRankClass(s.rank || idx + 1)}`}>#{s.rank || idx + 1}</span>
                  <Avatar size="34"><AvatarFallback>{s.initials || 'ST'}</AvatarFallback></Avatar>
                  <div className="lb-info">
                    <span className="lb-name">{s.name}</span>
                    <span className="lb-sub">{activeTab === 'batches' ? `${s.students} Enrolled Students` : (s.department || s.sub || s.college || 'Enrolled Student')}</span>
                  </div>
                  <div className="lb-xp-pill">
                    <Flame size={12} className="lb-flame-icon" />
                    <span>{s.score !== undefined ? s.score : s.overall_score || 0} {activeTab === 'milestone' ? '%' : 'pts'}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
