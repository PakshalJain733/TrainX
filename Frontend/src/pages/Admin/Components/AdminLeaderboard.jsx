import React, { useState, useEffect } from "react";
import { Trophy, Flame, Medal, Users, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminLeaderboard.css";

const getRankClass = (r) => r === 1 ? "admin-rank-1" : r === 2 ? "admin-rank-2" : r === 3 ? "admin-rank-3" : "";

export default function AdminLeaderboard() {
  const [data, setData] = useState({ overall: [], topBatches: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/leaderboards")
      .then((res) => {
        if (res && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch leaderboard data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-leaderboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#64748b' }}>
        <RefreshCw size={28} style={{ animation: 'spin 1.2s linear infinite', color: '#4f46e5', marginBottom: 14 }} />
        <p>Loading leaderboard rankings...</p>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  const topStudents = data.overall || [];
  const topBatches = data.topBatches || [];

  return (
    <div className="admin-leaderboard-container">
      <SectionHeader
        title="Leaderboard"
        description="Campus-wide rankings of students and batches."
      />

      <div className="leaderboard-split-grid">
        {/* Students */}
        <Card className="lb-card">
          <CardHeader className="lb-card-header">
            <div className="lb-header-icon lb-header-icon--trophy">
              <Trophy size={18} />
            </div>
            <div>
              <CardTitle>Top Students</CardTitle>
              <CardDescription>By total XP earned across all tasks</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="lb-list">
            {topStudents.length === 0 ? (
              <div className="admin-empty-state-card">
                <Trophy size={32} className="admin-empty-state-icon" />
                <p className="admin-empty-state-title">No student rankings recorded yet</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                  <div style={{ width: '40px', paddingRight: '8px' }}>Rank</div>
                  <div style={{ flex: 1, paddingLeft: '4px' }}>Student</div>
                  <div style={{ paddingLeft: '16px' }}>Score</div>
                </div>
                {topStudents.map(s => (
                  <div key={s.rank + s.name} className="lb-item">
                    <span className={`lb-rank ${getRankClass(s.rank)}`}>#{s.rank}</span>
                    <Avatar size="34"><AvatarFallback>{s.initials}</AvatarFallback></Avatar>
                    <div className="lb-info">
                      <span className="lb-name">{s.name}</span>
                      <span className="lb-sub">{s.sub}</span>
                    </div>
                    <div className="lb-xp-pill">
                      <Flame size={12} className="lb-flame-icon" />
                      <span>{s.score}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Batches */}
        <Card className="lb-card">
          <CardHeader className="lb-card-header">
            <div className="lb-header-icon lb-header-icon--medal">
              <Medal size={18} />
            </div>
            <div>
              <CardTitle>Top Batches</CardTitle>
              <CardDescription>Aggregate batch performance rankings</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="lb-list">
            {topBatches.length === 0 ? (
              <div className="admin-empty-state-card">
                <Medal size={32} className="admin-empty-state-icon" />
                <p className="admin-empty-state-title">No batch rankings available yet</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                  <div style={{ width: '40px', paddingRight: '8px' }}>Rank</div>
                  <div style={{ flex: 1, paddingLeft: '4px' }}>Batch</div>
                  <div style={{ paddingLeft: '16px' }}>Score</div>
                </div>
                {topBatches.map(b => (
                  <div key={b.rank + b.name} className="lb-item">
                    <span className={`lb-rank ${getRankClass(b.rank)}`}>#{b.rank}</span>
                    <Avatar size="34"><AvatarFallback>{b.initials}</AvatarFallback></Avatar>
                    <div className="lb-info">
                      <span className="lb-name">{b.name}</span>
                      <span className="lb-sub">{b.students} students enrolled</span>
                    </div>
                    <div className="lb-xp-pill">
                      <Flame size={12} className="lb-flame-icon" />
                      <span>{b.score}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

