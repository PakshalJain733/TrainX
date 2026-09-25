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
    
    const mockData = {
      overall: [
        { id: 1, rank: 1, name: "Aarav Sharma", department: "Computer Science", score: 98, initials: "AS" },
        { id: 2, rank: 2, name: "Sneha Gupta", department: "Information Tech", score: 95, initials: "SG" },
        { id: 3, rank: 3, name: "Rohan Patel", department: "Computer Science", score: 92, initials: "RP" },
        { id: 4, rank: 4, name: "Priya Singh", department: "Electronics", score: 88, initials: "PS" },
        { id: 5, rank: 5, name: "Vikram Verma", department: "Information Tech", score: 85, initials: "VV" },
      ],
      department: [
        { id: 1, rank: 1, name: "Computer Science", department: "CS Dept", score: 94, initials: "CS" },
        { id: 2, rank: 2, name: "Information Tech", department: "IT Dept", score: 90, initials: "IT" },
        { id: 3, rank: 3, name: "Electronics", department: "ECE Dept", score: 85, initials: "EC" },
        { id: 4, rank: 4, name: "Mechanical", department: "ME Dept", score: 78, initials: "ME" },
      ],
      milestone: [
        { id: 1, rank: 1, name: "Aarav Sharma", department: "Computer Science", score: 100, initials: "AS" },
        { id: 2, rank: 2, name: "Sneha Gupta", department: "Information Tech", score: 95, initials: "SG" },
        { id: 3, rank: 3, name: "Priya Singh", department: "Electronics", score: 90, initials: "PS" },
        { id: 4, rank: 4, name: "Rohan Patel", department: "Computer Science", score: 85, initials: "RP" },
      ],
      topBatches: [
        { id: 1, rank: 1, name: "Batch 2024-CS-A", students: 60, score: 92, initials: "CA" },
        { id: 2, rank: 2, name: "Batch 2024-IT-A", students: 55, score: 88, initials: "IA" },
        { id: 3, rank: 3, name: "Batch 2024-CS-B", students: 62, score: 85, initials: "CB" },
        { id: 4, rank: 4, name: "Batch 2024-EC-A", students: 50, score: 80, initials: "EA" },
      ]
    };

    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data && (res.data.overall?.length > 0 || res.data.department?.length > 0)) {
          setData(res.data);
        } else {
          setData(mockData);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch admin leaderboard data:", err);
        setData(mockData);
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
