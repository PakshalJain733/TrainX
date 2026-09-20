import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../Styles/WeeklyReports.css";

export default function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [openWeek, setOpenWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await apiFetch("/reports/weekly");
        if (res && res.success && Array.isArray(res.data)) {
          setReports(res.data);
          if (res.data.length > 0) setOpenWeek(res.data[0].id);
        } else {
          setReports([]);
        }
      } catch (err) {
        console.warn("Failed to load weekly reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const toggleWeek = (id) => {
    setOpenWeek((prev) => (prev === id ? null : id));
  };

  const handleDownload = (reportTitle) => {
    alert(`Downloading ${reportTitle} dossier summary (PDF)...`);
  };

  const pct = (v) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  };

  const fmt = (v) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? `${Math.round(n)}%` : "N/A";
  };

  const tags = (items) => (Array.isArray(items) ? items : []);

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
          Reviewed by Faculty Mentors · Department Training Coordinators
        </p>
        <div className="weekly-status-pills">
          <span className="weekly-track-badge">On Track</span>
          <span className="weekly-track-note">
            Weekly evaluation active and updated.
          </span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="weekly-reports-list">
        {loading ? (
          <div className="weekly-empty-state">Loading weekly reports...</div>
        ) : reports.length === 0 ? (
          <div className="weekly-empty-state">
            <FileCheck2 size={32} className="text-slate-300 mb-2" />
            <h4>No weekly reports generated yet</h4>
            <p>
              No faculty mentor scorecards are available for your account yet. Reports appear here once mentors
              publish weekly evaluations.
            </p>
          </div>
        ) : (
        reports.map((report) => {
          const isOpen = openWeek === report.id;
          const skillGapTags = tags(report.skillGaps);
          const nextStepItems = tags(report.nextSteps);
          return (
            <div
              key={report.id}
              className={`weekly-report-card ${
                isOpen ? "weekly-report-card--open" : ""
              }`}
            >
              {/* Header */}
              <div
                className="weekly-card-header"
                onClick={() => toggleWeek(report.id)}
                role="button"
                tabIndex={0}
              >
                <div className="weekly-header-info">
                  <h3 className="weekly-card-title">{report.title}</h3>
                  <div className="weekly-meta-row">
                    <span className="weekly-meta-pill">Score: {fmt(report.score)}</span>
                    <span className="weekly-meta-pill">
                      Attendance: {fmt(report.attendance)}
                    </span>
                    <span className="weekly-meta-pill">Quiz: {fmt(report.quiz)}</span>
                    <span className="weekly-meta-pill">Coding: N/A</span>
                    <span className="weekly-meta-pill">Interview: N/A</span>
                  </div>
                </div>

                <div className="weekly-header-actions">
                  <button
                    type="button"
                    className="weekly-download-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(report.title);
                    }}
                    title="Download weekly summary"
                  >
                    <Download size={15} />
                    <span>Dossier</span>
                  </button>
                  <button type="button" className="weekly-toggle-btn">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Expandable Body */}
              {isOpen && (
                <div className="weekly-card-body">
                  <div className="weekly-metrics-grid">
                    <div className="weekly-metric-item">
                      <span className="weekly-metric-label">Attendance</span>
                      <div className="weekly-metric-bar-bg">
                        <div
                          className="weekly-metric-bar-fill"
                          style={{
                            width: `${pct(report.attendance)}%`,
                            background:
                              pct(report.attendance) >= 85
                                ? "var(--color-primary-green)"
                                : "var(--color-accent-gold)",
                          }}
                        />
                      </div>
                      <span className="weekly-metric-val">
                        {fmt(report.attendance)}
                      </span>
                    </div>

                    <div className="weekly-metric-item">
                      <span className="weekly-metric-label">Quiz Accuracy</span>
                      <div className="weekly-metric-bar-bg">
                        <div
                          className="weekly-metric-bar-fill"
                          style={{
                            width: `${pct(report.quiz)}%`,
                            background: "var(--color-primary-navy)",
                          }}
                        />
                      </div>
                      <span className="weekly-metric-val">{fmt(report.quiz)}</span>
                    </div>

                    <div className="weekly-metric-item">
                      <span className="weekly-metric-label">Coding Drills</span>
                      <div className="weekly-metric-bar-bg">
                        <div
                          className="weekly-metric-bar-fill"
                          style={{
                            width: "0%",
                            background: "#8b5cf6",
                          }}
                        />
                      </div>
                      <span className="weekly-metric-val weekly-metric-na">N/A</span>
                    </div>

                    <div className="weekly-metric-item">
                      <span className="weekly-metric-label">Interview Eval</span>
                      <div className="weekly-metric-bar-bg">
                        <div
                          className="weekly-metric-bar-fill"
                          style={{
                            width: "0%",
                            background: "#06b6d4",
                          }}
                        />
                      </div>
                      <span className="weekly-metric-val weekly-metric-na">
                        N/A
                      </span>
                    </div>
                  </div>

                  <div className="weekly-two-col">
                    {/* Milestones info */}
                    <div className="weekly-section-box">
                      <h4 className="weekly-section-title">Milestones</h4>
                      <p className="weekly-section-sub">{report.milestones || "N/A"}</p>
                    </div>

                    {/* Skill Gaps Identified */}
                    <div className="weekly-section-box">
                      <h4 className="weekly-section-title">
                        Identified Skill Gaps
                      </h4>
                      {skillGapTags.length > 0 ? (
                        <div className="weekly-tags-row">
                          {skillGapTags.map((gap) => (
                            <span key={gap} className="weekly-gap-tag">
                              <AlertTriangle size={12} className="text-amber-600" />
                              {gap}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="weekly-section-sub">N/A</p>
                      )}
                    </div>
                  </div>

                  {/* Mentor Next Steps */}
                  <div className="weekly-section-box weekly-steps-box">
                    <h4 className="weekly-section-title">
                      Mentor Action Steps for Upcoming Sprint
                    </h4>
                    {nextStepItems.length > 0 ? (
                      <ul className="weekly-steps-list">
                        {nextStepItems.map((step, idx) => (
                          <li key={idx} className="weekly-step-item">
                            <CheckCircle
                              size={14}
                              className="text-emerald-600 flex-shrink-0"
                            />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="weekly-section-sub">N/A</p>
                    )}
                  </div>
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
