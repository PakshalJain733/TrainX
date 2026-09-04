import React, { useState } from "react";
import { TrendingUp, Users, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import "../Styles/AdminProgress.css";

const students = [
  { id: 1, name: "Priya Sharma", initials: "PS", batch: "Python Backend", quizAvg: 84, attendance: 95, codingRank: 7, xp: 2050 },
  { id: 2, name: "Kabir Menon", initials: "KM", batch: "React Frontend", quizAvg: 91, attendance: 89, codingRank: 2, xp: 2415 },
  { id: 3, name: "Ananya Rao", initials: "AR", batch: "Full Stack", quizAvg: 78, attendance: 92, codingRank: 3, xp: 2390 },
  { id: 4, name: "Riya Shah", initials: "RS", batch: "Python Backend", quizAvg: 96, attendance: 97, codingRank: 1, xp: 2480 },
  { id: 5, name: "Rohan Deshmukh", initials: "RD", batch: "Data Science", quizAvg: 72, attendance: 81, codingRank: 6, xp: 2120 },
];

export default function AdminProgress() {
  const [selectedBatch, setSelectedBatch] = useState("All Batches");

  const filtered = selectedBatch === "All Batches" ? students : students.filter(s => s.batch === selectedBatch);

  return (
    <div className="admin-progress-container">
      <div className="progress-header-row">
        <div>
          <h2 className="progress-title">Student Progress</h2>
          <p className="progress-subtitle">Monitor individual student performance across all metrics.</p>
        </div>
        <select className="progress-batch-filter" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
          <option>All Batches</option>
          <option>Python Backend</option>
          <option>React Frontend</option>
          <option>Full Stack</option>
          <option>Data Science</option>
        </select>
      </div>

      <Card className="progress-table-card">
        <CardContent className="progress-table-body">
          <table className="progress-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Batch</th>
                <th>Quiz Avg</th>
                <th>Attendance</th>
                <th>Coding Rank</th>
                <th>XP Points</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="progress-row">
                  <td>
                    <div className="progress-student-cell">
                      <Avatar size="32"><AvatarFallback>{s.initials}</AvatarFallback></Avatar>
                      <span className="progress-student-name">{s.name}</span>
                    </div>
                  </td>
                  <td><span className="progress-batch-pill">{s.batch}</span></td>
                  <td><span className={`progress-score ${s.quizAvg >= 85 ? "score-high" : s.quizAvg >= 70 ? "score-mid" : "score-low"}`}>{s.quizAvg}%</span></td>
                  <td><span className={`progress-score ${s.attendance >= 90 ? "score-high" : s.attendance >= 75 ? "score-mid" : "score-low"}`}>{s.attendance}%</span></td>
                  <td><span className="progress-rank">#{s.codingRank}</span></td>
                  <td><span className="progress-xp">{s.xp.toLocaleString()} XP</span></td>
                  <td>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(s.xp / 25, 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
