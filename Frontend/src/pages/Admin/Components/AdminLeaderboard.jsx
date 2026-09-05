import React from "react";
import { Trophy, Flame, Medal, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminLeaderboard.css";

const topStudents = [];
const topBatches = [];

const getRankClass = (r) => r === 1 ? "admin-rank-1" : r === 2 ? "admin-rank-2" : r === 3 ? "admin-rank-3" : "";

export default function AdminLeaderboard() {
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
              topStudents.map(s => (
                <div key={s.rank} className="lb-item">
                  <span className={`lb-rank ${getRankClass(s.rank)}`}>#{s.rank}</span>
                  <Avatar size="34"><AvatarFallback>{s.initials}</AvatarFallback></Avatar>
                  <div className="lb-info">
                    <span className="lb-name">{s.name}</span>
                    <span className="lb-sub">{s.batch}</span>
                  </div>
                  <div className="lb-xp-pill">
                    <Flame size={12} className="lb-flame-icon" />
                    <span>{s.score}</span>
                  </div>
                </div>
              ))
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
              topBatches.map(b => (
                <div key={b.rank} className="lb-item">
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
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
