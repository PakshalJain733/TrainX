import React, { useState, useEffect } from "react";
import { TrendingUp, Users, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import apiFetch from "../../../utils/api";
import "../Styles/AdminProgress.css";

const getInitials = (name) =>
  name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ST";

export default function AdminProgress() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await apiFetch("/admin/performance");
        const studentUsers = (data.success && Array.isArray(data.data?.students)) ? data.data.students : [];
        const batchNames = (data.success && Array.isArray(data.data?.batches))
          ? data.data.batches.map(b => b.name)
          : Array.from(new Set(studentUsers.map(s => s.batch).filter(Boolean)));

        setBatches(batchNames.map(name => ({ id: name, name })));
        setStudents(studentUsers.map((s) => ({
          id: s.id || s.studentId,
          name: s.name,
          initials: getInitials(s.name),
          batch: s.batch || "General Batch",
          quizAvg: s.quiz || 0,
          attendance: s.attendance || 0,
          overallScore: s.overallScore || 0,
          progress: s.progress || 0,
          status: s.status || "Average",
        })));
      } catch (err) {
        console.error("Failed to load student progress:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = selectedBatch === "All Batches" ? students : students.filter(s => s.batch === selectedBatch);

  return (
    <div className="admin-progress-container">
      <SectionHeader
        title="Student Progress & Assessment Performance"
        description="Monitor real student quiz scores, attendance, and overall assessment analytics."
        action={
          <select className="progress-batch-filter" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
            <option value="All Batches">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        }
      />

      <Card className="progress-table-card">
        <CardContent className="progress-table-body">
          {loading ? (
            <div className="admin-table-empty-cell">Loading progress data…</div>
          ) : (
            <table className="progress-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Batch</th>
                  <th>Quiz Avg</th>
                  <th>Attendance</th>
                  <th>Overall</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty-cell">
                      No student progress records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(s => (
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
                      <td><span className={`progress-score ${s.overallScore >= 80 ? "score-high" : s.overallScore >= 60 ? "score-mid" : "score-low"}`}>{s.overallScore}%</span></td>
                      <td><span className="progress-xp">{s.status}</span></td>
                      <td>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar-fill" style={{ width: `${Math.min(s.progress, 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}