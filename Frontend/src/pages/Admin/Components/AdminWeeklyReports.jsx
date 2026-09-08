import React, { useState } from "react";
import { FileCheck2, Download, TrendingUp, Users, Trophy, Settings2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminWeeklyReports.css";

const reports = [];

export default function AdminWeeklyReports() {
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  return (
    <div className="admin-reports-container">
      <SectionHeader
        title="Weekly Reports"
        description="Batch-wise weekly performance summaries and analytics."
        action={
          <div className="reports-actions-group">
            <label className="reports-auto-label">
              <input 
                type="checkbox" 
                checked={autoGenerate} 
                onChange={(e) => setAutoGenerate(e.target.checked)} 
                className="reports-auto-checkbox"
              />
              Auto-generate every Monday
            </label>
            <button className="reports-generate-btn" onClick={handleGenerate}>
              <FileCheck2 size={16} /> Generate Now
            </button>
          </div>
        }
      />

      {generated && (
        <div className="reports-success-banner">
          <CheckCircle2 size={18} />
          Report generation started. You will be notified when it's ready.
        </div>
      )}

      <div className="reports-grid">
        {reports.length === 0 ? (
          <div className="admin-empty-state-card">
            <FileCheck2 size={36} className="admin-empty-state-icon" />
            <p className="admin-empty-state-title">No weekly reports generated yet</p>
            <p className="admin-empty-state-sub">Click "Generate Now" to trigger report generation for your batches.</p>
          </div>
        ) : (
          reports.map(r => (
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
          ))
        )}
      </div>
    </div>
  );
}
