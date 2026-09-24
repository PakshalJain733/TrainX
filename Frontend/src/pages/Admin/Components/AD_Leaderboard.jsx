import React, { useState, useEffect } from "react";
import { Trophy, Flame, Medal, Users, RefreshCw, Award } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AD_Leaderboard.css";

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
      <SectionHeader
        icon={Trophy}
        title="Leaderboard & Rankings"
        description="Campus-wide student overall standings, department level performance, and milestone rankings."
        action={
          <button onClick={fetchLeaderboard} className="admin-refresh-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Tabs */}
      <div className="admin-lb-tabs">
        <button
          onClick={() => setActiveTab('overall')}
          className={`admin-lb-tab-btn ${activeTab === 'overall' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          Overall Ranking
        </button>
        <button
          onClick={() => setActiveTab('department')}
          className={`admin-lb-tab-btn ${activeTab === 'department' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          Department Ranking
        </button>
        <button
          onClick={() => setActiveTab('milestone')}
          className={`admin-lb-tab-btn ${activeTab === 'milestone' ? 'admin-lb-tab-btn--active' : ''}`}
        >
          Milestone Velocity
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`admin-lb-tab-btn ${activeTab === 'batches' ? 'admin-lb-tab-btn--active' : ''}`}
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
            <div className="admin-lb-loading">
              <RefreshCw size={24} className="animate-spin" style={{ color: '#4f46e5', marginRight: 10 }} />
              <span>Loading rankings...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="admin-empty-state-card">
              <Trophy size={32} className="admin-empty-state-icon" />
              <p className="admin-empty-state-title">No leaderboard entries found for this category</p>
            </div>
          ) : (
            <>
              <div className="admin-lb-table-head">
                <div className="admin-lb-head-rank">Rank</div>
                <div className="admin-lb-head-entity">{activeTab === 'batches' ? 'Batch' : 'Student'}</div>
                <div className="admin-lb-head-score">Score</div>
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
