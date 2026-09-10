import React, { useState } from "react";
import {
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/WeeklyReports.css";

const reportsData = [];

export default function WeeklyReports() {
  const [openWeek, setOpenWeek] = useState("week-32");

  const toggleWeek = (id) => {
    setOpenWeek((prev) => (prev === id ? null : id));
  };

  const handleDownload = (reportTitle) => {
    alert(`Downloading ${reportTitle} dossier summary (PDF)...`);
  };

  return (
    <div className="weekly-reports-page stack-6">
      <SectionHeader
        eyebrow="GOVERNANCE & AUDIT"
        title="Weekly Performance Reports"
        description="Review weekly mentor scorecards, attendance logs, technical evaluation notes, and recommended action steps."
      />

      {/* Reviewer / Current Status Banner */}
      <div className="weekly-status-banner">
        <div className="weekly-status-header">
          <FileCheck2 size={20} className="text-blue-600" />
          <span>Current status</span>
        </div>
        <p className="weekly-status-desc">
          Reviewed by Mentor Ms. R. Kulkarni · Coordinator Prof. A. Deshmukh (ECS / IT)
        </p>
        <div className="weekly-status-pills">
          <span className="weekly-track-badge">On Track</span>
          <span className="weekly-track-note">
            No mentor intervention required this week.
          </span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="weekly-reports-list">
        {reportsData.length === 0 ? (
          <div className="admin-empty-state-card" style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <FileCheck2 size={36} className="text-slate-400" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No weekly reports available</h3>
            <p style={{ color: '#64748b' }}>Your weekly performance reports will appear here once generated.</p>
          </div>
        ) : (
          reportsData.map((report) => {
            const isOpen = openWeek === report.id;
            return (
              <div
                key={report.id}
                className={`weekly-report-card ${isOpen ? "open" : ""}`}
              >
                <button
                  className="weekly-report-header-btn"
                  onClick={() => toggleWeek(report.id)}
                >
                  <h3 className="weekly-report-title">{report.title}</h3>
                  <div className="weekly-report-right">
                    <span className="weekly-report-score-pill">
                      {report.score}
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
                          <span className="weekly-metric-pct">{report.attendance}%</span>
                        </div>
                        <div className="weekly-metric-bar">
                          <div
                            className="weekly-metric-fill"
                            style={{ width: `${report.attendance}%` }}
                          />
                        </div>
                      </div>

                      <div className="weekly-metric-item">
                        <div className="weekly-metric-top">
                          <span>Quiz performance</span>
                          <span className="weekly-metric-pct">{report.quiz}%</span>
                        </div>
                        <div className="weekly-metric-bar">
                          <div
                            className="weekly-metric-fill"
                            style={{ width: `${report.quiz}%` }}
                          />
                        </div>
                      </div>

                      <div className="weekly-metric-item">
                        <div className="weekly-metric-top">
                          <span>Coding performance</span>
                          <span className="weekly-metric-pct">{report.coding}%</span>
                        </div>
                        <div className="weekly-metric-bar">
                          <div
                            className="weekly-metric-fill"
                            style={{ width: `${report.coding}%` }}
                          />
                        </div>
                      </div>

                      <div className="weekly-metric-item">
                        <div className="weekly-metric-top">
                          <span>AI interview</span>
                          <span className="weekly-metric-pct">{report.interview}%</span>
                        </div>
                        <div className="weekly-metric-bar">
                          <div
                            className="weekly-metric-fill"
                            style={{ width: `${report.interview}%` }}
                          />
                        </div>
                      </div>
                    </div>

                  {/* Milestones info */}
                  <div className="weekly-info-section">
                    <h4 className="weekly-section-title">Milestones</h4>
                    <p className="weekly-section-sub">{report.milestones}</p>
                  </div>

                  {/* Skill Gaps */}
                  <div className="weekly-info-section">
                    <h4 className="weekly-section-title">Skill gaps</h4>
                    <div className="weekly-gaps-tags">
                      {report.skillGaps.map((gap) => (
                        <span key={gap} className="weekly-gap-pill">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Next Steps */}
                  <div className="weekly-info-section">
                    <h4 className="weekly-section-title">Recommended next steps</h4>
                    <ul className="weekly-steps-list">
                      {report.nextSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className="weekly-download-btn"
                    onClick={() => handleDownload(report.title)}
                  >
                    <Download size={15} />
                    Download report
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
