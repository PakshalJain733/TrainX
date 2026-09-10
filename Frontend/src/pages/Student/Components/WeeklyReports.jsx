import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/WeeklyReports.css";

export default function WeeklyReports() {
  const [reportsData, setReportsData] = useState([]);
  const [openWeek, setOpenWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    setLoading(true);
    apiFetch("/reports")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setReportsData(res.data);
          setOpenWeek(res.data[0].id || res.data[0].week_label);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch student weekly reports:", err);
      })
      .finally(() => setLoading(false));
  };

  const toggleWeek = (id) => {
    setOpenWeek((prev) => (prev === id ? null : id));
  };

  const handleDownload = (reportTitle) => {
    alert(`Downloading ${reportTitle} dossier summary (PDF)...`);
  };

  const getTrendBadge = (status, delta) => {
    if (status === "Improved") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "12px", background: "#ecfdf5", color: "#059669", fontSize: "12px", fontWeight: 700 }}>
          <TrendingUp size={14} /> {delta || "+5%"} Improved
        </span>
      );
    }
    if (status === "Declined") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "12px", background: "#fef2f2", color: "#dc2626", fontSize: "12px", fontWeight: 700 }}>
          <TrendingDown size={14} /> {delta || "-3%"} Declined
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "12px", background: "#f8fafc", color: "#64748b", fontSize: "12px", fontWeight: 600 }}>
        <Minus size={14} /> Stable
      </span>
    );
  };

  return (
    <div className="weekly-reports-page stack-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SectionHeader
          eyebrow="GOVERNANCE & AUDIT"
          title="Weekly Performance Reports"
          description="Review weekly mentor scorecards, attendance logs, technical evaluation notes, and recommended action steps."
        />
        <button
          onClick={fetchReports}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            color: "#334155",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Reviewer / Current Status Banner */}
      <div className="weekly-status-banner">
        <div className="weekly-status-header">
          <FileCheck2 size={20} className="text-blue-600" />
          <span>Current Governance Status</span>
        </div>
        <p className="weekly-status-desc">
          Reviewed by Mentor Ms. R. Kulkarni · Coordinator Prof. A. Deshmukh (Computer Engineering / IT)
        </p>
        <div className="weekly-status-pills">
          <span className="weekly-track-badge">On Track</span>
          <span className="weekly-track-note">
            Weekly automated progress analysis active.
          </span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="weekly-reports-list">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "#64748b" }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#4f46e5", marginRight: 10 }} />
            <span>Generating & loading weekly performance reports...</span>
            <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
          </div>
        ) : reportsData.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "12px" }}>
            No weekly reports available yet.
          </div>
        ) : (
          reportsData.map((report) => {
            const reportId = report.id || report.week_label;
            const isOpen = openWeek === reportId;
            const title = report.week_label || report.title || "Weekly Performance Summary";
            const overallScore = report.overall_score !== undefined ? `${report.overall_score}%` : (report.score || "80%");
            const attendance = report.attendance_score !== undefined ? report.attendance_score : (report.attendance || 90);
            const quiz = report.quiz_score !== undefined ? report.quiz_score : (report.quiz || 80);
            const coding = report.coding_score !== undefined ? report.coding_score : (report.coding || 85);
            const interview = report.interview_score !== undefined ? report.interview_score : (report.interview || 75);
            const milestones = report.milestones_summary || report.milestones || "2 completed · 2 in progress";
            const skillGaps = report.weak_areas || report.skillGaps || ["MySQL Indexing", "API Integration"];
            const nextSteps = report.suggestions || report.nextSteps || [
              "Complete Database Indexing & Query Optimization drills in Practice Arena",
              "Re-attempt Unit 2 Technical Quiz to improve score above 80%",
            ];

            return (
              <div
                key={reportId}
                className={`weekly-report-card ${isOpen ? "open" : ""}`}
              >
                <button
                  className="weekly-report-header-btn"
                  onClick={() => toggleWeek(reportId)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h3 className="weekly-report-title" style={{ margin: 0 }}>{title}</h3>
                    {getTrendBadge(report.trend_status, report.score_delta)}
                  </div>
                  <div className="weekly-report-right">
                    <span className="weekly-report-score-pill">
                      {overallScore}
                    </span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="weekly-report-content">
                    {/* 4 Metric Bars */}
                    <div className="weekly-metrics-grid">
                      <div className="weekly-metric-item">
                        <div className="weekly-metric-top">
                          <span>Attendance</span>
                          <span className="weekly-metric-pct">{attendance}%</span>
                        </div>
                        <div className="weekly-metric-bar">
                          <div
                            className="weekly-metric-fill"
                            style={{ width: `${attendance}%` }}
                          />
                        </div>
                      </div>

                      <div className="weekly-metric-item">
                        <div className="weekly-metric-top">
                          <span>Quiz performance</span>
                          <span className="weekly-metric-pct">{quiz}%</span>
                        </div>
                        <div className="weekly-metric-bar">
                          <div
                            className="weekly-metric-fill"
                            style={{ width: `${quiz}%` }}
                          />
                        </div>
                      </div>

                      <div className="weekly-metric-item">
                        <div className="weekly-metric-top">
                          <span>Coding performance</span>
                          <span className="weekly-metric-pct">{coding}%</span>
                        </div>
                        <div className="weekly-metric-bar">
                          <div
                            className="weekly-metric-fill"
                            style={{ width: `${coding}%` }}
                          />
                        </div>
                      </div>

                      <div className="weekly-metric-item">
                        <div className="weekly-metric-top">
                          <span>AI interview</span>
                          <span className="weekly-metric-pct">{interview}%</span>
                        </div>
                        <div className="weekly-metric-bar">
                          <div
                            className="weekly-metric-fill"
                            style={{ width: `${interview}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Milestones info */}
                    <div className="weekly-info-section">
                      <h4 className="weekly-section-title">Milestones Progress</h4>
                      <p className="weekly-section-sub">{milestones}</p>
                    </div>

                    {/* Skill Gaps / Weak Areas */}
                    <div className="weekly-info-section">
                      <h4 className="weekly-section-title">Identified Skill Gaps & Focus Areas</h4>
                      <div className="weekly-gaps-tags">
                        {skillGaps.map((gap, idx) => (
                          <span key={idx} className="weekly-gap-pill">
                            {gap}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Next Steps */}
                    <div className="weekly-info-section">
                      <h4 className="weekly-section-title">Targeted Improvement Actions</h4>
                      <ul className="weekly-steps-list">
                        {nextSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      className="weekly-download-btn"
                      onClick={() => handleDownload(title)}
                    >
                      <Download size={15} />
                      Download Weekly Dossier (PDF)
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
