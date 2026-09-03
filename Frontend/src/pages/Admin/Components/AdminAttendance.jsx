import React, { useState } from "react";
import { CheckCircle2, XCircle, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import "../Styles/AdminAttendance.css";

const batches = ["Python Backend - Cohort A", "React Frontend - Cohort C", "Full Stack - Cohort B"];
const students = [
  { id: 1, name: "Priya Sharma", rollNo: "CS-001" },
  { id: 2, name: "Rahul Mehta", rollNo: "CS-002" },
  { id: 3, name: "Ananya Rao", rollNo: "CS-003" },
  { id: 4, name: "Kabir Menon", rollNo: "CS-004" },
  { id: 5, name: "Riya Shah", rollNo: "CS-005" },
];

export default function AdminAttendance() {
  const [selectedBatch, setSelectedBatch] = useState(batches[0]);
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
      <div className="attendance-header-row">
        <div>
          <h2 className="attendance-title">Track Attendance</h2>
          <p className="attendance-subtitle">Mark attendance for batch sessions by date.</p>
        </div>
        <div className="attendance-filters">
          <select className="attendance-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
            {batches.map(b => <option key={b}>{b}</option>)}
          </select>
          <input type="date" className="attendance-date-input" defaultValue={new Date().toISOString().split("T")[0]} />
        </div>
      </div>

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
          <CardTitle>Student Attendance - {selectedBatch}</CardTitle>
          <div className="att-bulk-actions">
            <button className="att-mark-btn att-mark-all" onClick={() => markAll(true)}>Mark All Present</button>
            <button className="att-mark-btn att-mark-none" onClick={() => markAll(false)}>Mark All Absent</button>
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
              {students.map(s => (
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
              ))}
            </tbody>
          </table>
          <div className="att-save-row">
            <button className="att-save-btn" onClick={handleSave}>
              {saved ? "✓ Attendance Saved!" : "Save Attendance"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
