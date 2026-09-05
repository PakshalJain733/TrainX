import React, { useState } from "react";
import { CheckCircle2, XCircle, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminAttendance.css";

const batches = [];
const students = [];

export default function AdminAttendance() {
  const [selectedBatch, setSelectedBatch] = useState(batches[0] || "");
  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);

  const toggle = (id) => {
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const markAll = (val) => {
    const all = {};
    students.forEach(s => { all[s.id] = val; });
    setAttendance(all);
    setSaved(false);
  };

  const handleSave = () => setSaved(true);

  const present = students.filter(s => attendance[s.id]).length;

  return (
    <div className="admin-attendance-container">
      <SectionHeader
        title="Track Attendance"
        description="Mark attendance for batch sessions by date."
        action={
          <div className="attendance-filters">
            <select 
              className="attendance-select" 
              value={selectedBatch} 
              onChange={e => setSelectedBatch(e.target.value)}
              disabled={batches.length === 0}
            >
              {batches.length === 0 ? (
                <option value="">No batches available</option>
              ) : (
                batches.map(b => <option key={b} value={b}>{b}</option>)
              )}
            </select>
            <input type="date" className="attendance-date-input" defaultValue={new Date().toISOString().split("T")[0]} />
          </div>
        }
      />

      <div className="attendance-stats-row">
        <div className="attendance-stat-card">
          <span className="att-stat-val">{students.length}</span>
          <span className="att-stat-label">Total</span>
        </div>
        <div className="attendance-stat-card att-present">
          <span className="att-stat-val">{present}</span>
          <span className="att-stat-label">Present</span>
        </div>
        <div className="attendance-stat-card att-absent">
          <span className="att-stat-val">{students.length - present}</span>
          <span className="att-stat-label">Absent</span>
        </div>
        <div className="attendance-stat-card att-rate">
          <span className="att-stat-val">{students.length ? Math.round((present / students.length) * 100) : 0}%</span>
          <span className="att-stat-label">Rate</span>
        </div>
      </div>

      <Card className="attendance-table-card">
        <CardHeader className="att-table-header">
          <CardTitle>Student Attendance {selectedBatch ? `- ${selectedBatch}` : ""}</CardTitle>
          <div className="att-bulk-actions">
            <button className="att-mark-btn att-mark-all" onClick={() => markAll(true)} disabled={students.length === 0}>
              Mark All Present
            </button>
            <button className="att-mark-btn att-mark-none" onClick={() => markAll(false)} disabled={students.length === 0}>
              Mark All Absent
            </button>
          </div>
        </CardHeader>
        <CardContent className="att-table-body">
          <table className="att-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="admin-table-empty-cell">
                    No students enrolled in this batch.
                  </td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className={attendance[s.id] ? "att-row-present" : "att-row-absent"}>
                    <td className="att-roll">{s.rollNo}</td>
                    <td className="att-name">{s.name}</td>
                    <td>
                      <span className={`att-status-pill ${attendance[s.id] ? "att-pill-present" : "att-pill-absent"}`}>
                        {attendance[s.id] ? "Present" : "Absent"}
                      </span>
                    </td>
                    <td>
                      <button className="att-toggle-btn" onClick={() => toggle(s.id)}>
                        {attendance[s.id]
                          ? <CheckCircle2 size={20} className="att-icon-present" />
                          : <XCircle size={20} className="att-icon-absent" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="att-save-row">
            <button className="att-save-btn" onClick={handleSave} disabled={students.length === 0}>
              {saved ? "✓ Attendance Saved!" : "Save Attendance"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
