import React, { useState } from "react";
import { FileCheck2, Download, TrendingUp, Users, Trophy, Settings2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import "../Styles/AdminWeeklyReports.css";

const reports = [
  { id: 1, week: "Week 4 (19–25 Aug 2026)", batch: "Python Backend - Cohort A", avgScore: 78, attendance: 91, topStudent: "Priya Sharma" },
  { id: 2, week: "Week 4 (19–25 Aug 2026)", batch: "React Frontend - Cohort C", avgScore: 82, attendance: 88, topStudent: "Kabir Menon" },
  { id: 3, week: "Week 3 (12–18 Aug 2026)", batch: "Full Stack - Cohort B", avgScore: 74, attendance: 85, topStudent: "Ananya Rao" },
  { id: 4, week: "Week 3 (12–18 Aug 2026)", batch: "Python Backend - Cohort A", avgScore: 76, attendance: 90, topStudent: "Riya Shah" },
];

export default function AdminWeeklyReports() {
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  return (
    <div className="admin-reports-container">
      <div className="reports-header-row">
        <div>
          <h2 className="reports-title">Weekly Reports</h2>
          <p className="reports-subtitle">Batch-wise weekly performance summaries and analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoGenerate} 
              onChange={(e) => setAutoGenerate(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
            />
            Auto-generate every Monday
          </label>
          <button className="reports-generate-btn" onClick={handleGenerate}>
            <FileCheck2 size={16} /> Generate Now
          </button>
        </div>
      </div>

      {generated && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
          <CheckCircle2 size={18} />
          Report generation started. You will be notified when it's ready.
        </div>
      )}

      <div className="reports-grid">
        {reports.map(r => (
          <Card key={r.id} className="report-card">
            <CardHeader className="report-card-header">
              <div>
                <CardTitle className="report-batch-name">{r.batch}</CardTitle>
                <p className="report-week">{r.week}</p>
              </div>
              <button className="report-download-btn" title="Download Report">
                <Download size={16} />
              </button>
            </CardHeader>
            <CardContent className="report-card-body">
              <div className="report-stats-row">
                <div className="report-stat-item">
                  <TrendingUp size={16} className="report-stat-icon" />
                  <div>
                    <span className="report-stat-val">{r.avgScore}%</span>
                    <span className="report-stat-label">Avg Score</span>
                  </div>
                </div>
                <div className="report-stat-item">
                  <Users size={16} className="report-stat-icon" />
                  <div>
                    <span className="report-stat-val">{r.attendance}%</span>
                    <span className="report-stat-label">Attendance</span>
                  </div>
                </div>
                <div className="report-stat-item">
                  <Trophy size={16} className="report-stat-icon" />
                  <div>
                    <span className="report-stat-val report-top-student">{r.topStudent}</span>
                    <span className="report-stat-label">Top Student</span>
                  </div>
                </div>
              </div>
              <div className="report-score-bar-wrap">
                <div className="report-score-bar-fill" style={{ width: `${r.avgScore}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
