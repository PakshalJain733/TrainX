import React, { useState, useEffect } from "react";
import { FileCheck2, Download, TrendingUp, Users, Trophy, CheckCircle2, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminWeeklyReports.css";

export default function AdminWeeklyReports() {
  const [reports, setReports] = useState([]);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    fetchAdminReports();
  }, []);

  const fetchAdminReports = () => {
    setLoading(true);
    apiFetch("/reports")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setReports(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch admin weekly reports:", err);
      })
      .finally(() => setLoading(false));
  };

  const handleGenerate = () => {
    setGenerating(true);
    apiFetch("/reports/weekly/generate", {
      method: "POST",
      body: JSON.stringify({ forceRegenerate: true }),
    })
      .then(() => {
        setBanner("Weekly batch audit reports generated successfully!");
        fetchAdminReports();
        setTimeout(() => setBanner(""), 4000);
      })
      .catch((err) => {
        console.error("Failed to generate weekly report:", err);
      })
      .finally(() => setGenerating(false));
  };

  const handleDownload = (batchName) => {
    alert(`Downloading ${batchName} Weekly Performance Summary PDF...`);
  };

  return (
    <div className="admin-reports-container">
      <SectionHeader
        title="Weekly Performance Reports"
        description="Batch-wise weekly performance summaries, attendance rates, and governance analytics."
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
            <button
              className="reports-generate-btn"
              onClick={handleGenerate}
              disabled={generating}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FileCheck2 size={16} className={generating ? "animate-spin" : ""} />
              {generating ? "Generating..." : "Generate Now"}
            </button>
          </div>
        }
      />

      {banner && (
        <div className="reports-success-banner" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} />
          {banner}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "#64748b" }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#4f46e5", marginRight: 10 }} />
          <span>Loading weekly reports...</span>
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.length === 0 ? (
            <div className="admin-empty-state-card">
              <FileCheck2 size={36} className="admin-empty-state-icon" />
              <p className="admin-empty-state-title">No weekly reports generated yet</p>
              <p className="admin-empty-state-sub">Click "Generate Now" to trigger report generation for your batches.</p>
            </div>
          ) : (
            reports.map((r, idx) => {
              const batchName = r.batch || r.student_info?.name || `Batch A - CSE`;
              const weekLabel = r.week || r.week_label || "Week 37 · 07 Sep – 13 Sep 2026";
              const score = r.avgScore !== undefined ? r.avgScore : (r.overall_score || 82);
              const attendance = r.attendance !== undefined ? r.attendance : (r.attendance_score || 88);
              const topStudent = r.topStudent || r.student_info?.name || "Aarav Sharma";

              return (
                <Card key={r.id || idx} className="report-card">
                  <CardHeader className="report-card-header">
                    <div>
                      <CardTitle className="report-batch-name">{batchName}</CardTitle>
                      <p className="report-week">{weekLabel}</p>
                    </div>
                    <button
                      className="report-download-btn"
                      title="Download Report"
                      onClick={() => handleDownload(batchName)}
                    >
                      <Download size={16} />
                    </button>
                  </CardHeader>
                  <CardContent className="report-card-body">
                    <div className="report-stats-row">
                      <div className="report-stat-item">
                        <TrendingUp size={16} className="report-stat-icon" />
                        <div>
                          <span className="report-stat-val">{score}%</span>
                          <span className="report-stat-label">Avg Score</span>
                        </div>
                      </div>
                      <div className="report-stat-item">
                        <Users size={16} className="report-stat-icon" />
                        <div>
                          <span className="report-stat-val">{attendance}%</span>
                          <span className="report-stat-label">Attendance</span>
                        </div>
                      </div>
                      <div className="report-stat-item">
                        <Trophy size={16} className="report-stat-icon" />
                        <div>
                          <span className="report-stat-val report-top-student">{topStudent}</span>
                          <span className="report-stat-label">Top Performer</span>
                        </div>
                      </div>
                    </div>
                    <div className="report-score-bar-wrap">
                      <div className="report-score-bar-fill" style={{ width: `${score}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
