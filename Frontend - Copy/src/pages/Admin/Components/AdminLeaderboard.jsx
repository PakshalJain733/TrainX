import React from "react";
import { Trophy, Flame, Medal, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import "../Styles/AdminLeaderboard.css";

const topStudents = [
  { rank: 1, name: "Riya Shah", score: "2,480 XP", batch: "Python Backend", initials: "RS" },
  { rank: 2, name: "Kabir Menon", score: "2,415 XP", batch: "React Frontend", initials: "KM" },
  { rank: 3, name: "Ananya Rao", score: "2,390 XP", batch: "Full Stack", initials: "AR" },
  { rank: 4, name: "Siddharth Verma", score: "2,260 XP", batch: "Python Backend", initials: "SV" },
  { rank: 5, name: "Neha Kulkarni", score: "2,190 XP", batch: "React Frontend", initials: "NK" },
  { rank: 6, name: "Rohan Deshmukh", score: "2,120 XP", batch: "Full Stack", initials: "RD" },
  { rank: 7, name: "Priya Sharma", score: "2,050 XP", batch: "Data Science", initials: "PS" },
  { rank: 8, name: "Vikram Joshi", score: "1,980 XP", batch: "Python Backend", initials: "VJ" },
  { rank: 9, name: "Aditya Mehta", score: "1,940 XP", batch: "Full Stack", initials: "AM" },
  { rank: 10, name: "Tanvi Saxena", score: "1,910 XP", batch: "React Frontend", initials: "TS" },
];

const topBatches = [
  { rank: 1, name: "Python Backend - Cohort A", score: "14,250 XP", students: 42, initials: "PY" },
  { rank: 2, name: "React Frontend - Cohort C", score: "12,980 XP", students: 38, initials: "RE" },
  { rank: 3, name: "Full Stack - Cohort B", score: "11,840 XP", students: 45, initials: "FS" },
  { rank: 4, name: "Data Science - Cohort A", score: "9,560 XP", students: 30, initials: "DS" },
];

const getRankClass = (r) => r === 1 ? "admin-rank-1" : r === 2 ? "admin-rank-2" : r === 3 ? "admin-rank-3" : "";

export default function AdminLeaderboard() {
  return (
    <div className="admin-leaderboard-container">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">Leaderboard</h2>
        <p className="leaderboard-subtitle">Campus-wide rankings of students and batches.</p>
      </div>

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
            {topStudents.map(s => (
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
            ))}
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
            {topBatches.map(b => (
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
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
