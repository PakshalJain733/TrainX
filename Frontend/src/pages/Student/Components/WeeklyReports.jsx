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

const defaultReports = [
  {
    id: "week-32",
    title: "Week 32 · 10–16 Aug 2026",
    score: "78%",
    attendance: 86,
    quiz: 79,
    coding: 68,
    interview: 72,
    milestones: "2 completed · 2 in progress",
    skillGaps: ["SQL indexing", "API versioning"],
    nextSteps: [
      "Finish Transactions & ACID material",
      "Attempt Database Indexing quiz",
      "Solve 3 medium SQL problems in Practice Arena",
    ],
  },
  {
    id: "week-31",
    title: "Week 31 · 03–09 Aug 2026",
    score: "74%",
    attendance: 90,
    quiz: 75,
    coding: 62,
    interview: 68,
    milestones: "2 completed · 1 in progress",
    skillGaps: ["FastAPI Validation", "Query Optimization"],
    nextSteps: [
      "Review Pydantic request models",
      "Practice multi-table JOIN problem sets",
    ],
  },
  {
    id: "week-30",
    title: "Week 30 · 27 Jul–02 Aug 2026",
    score: "70%",
    attendance: 88,
    quiz: 70,
    coding: 60,
    interview: 64,
    milestones: "1 completed · 1 in progress",
    skillGaps: ["OOP Magic Methods", "Error Handling"],
    nextSteps: [
      "Solidify Python OOP inheritance and encapsulation drills",
      "Re-attempt Unit 2 Quiz",
    ],
  },
];

export default function WeeklyReports() {
  const [reports, setReports] = useState(defaultReports);
  const [openWeek, setOpenWeek] = useState("week-32");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await apiFetch("/reports/weekly");
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setReports(res.data);
          setOpenWeek(res.data[0].id);
        }
      } catch (err) {
        console.warn("Failed to load weekly reports:", err);
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
        {reports.map((report) => {
          const isOpen = openWeek === report.id;
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
                    <span className="weekly-meta-pill">Score: {report.score}</span>
                    <span className="weekly-meta-pill">
                      Attendance: {report.attendance}%
                    </span>
                    <span className="weekly-meta-pill">Quiz: {report.quiz}%</span>
                    <span className="weekly-meta-pill">Coding: {report.coding}%</span>
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
                            width: `${report.attendance}%`,
                            background:
                              report.attendance >= 85
                                ? "var(--color-primary-green)"
                                : "var(--color-accent-gold)",
                          }}
                        />
                      </div>
                      <span className="weekly-metric-val">
                        {report.attendance}%
                      </span>
                    </div>

                    <div className="weekly-metric-item">
                      <span className="weekly-metric-label">Quiz Accuracy</span>
                      <div className="weekly-metric-bar-bg">
                        <div
                          className="weekly-metric-bar-fill"
                          style={{
                            width: `${report.quiz}%`,
                            background: "var(--color-primary-navy)",
                          }}
                        />
                      </div>
                      <span className="weekly-metric-val">{report.quiz}%</span>
                    </div>

                    <div className="weekly-metric-item">
                      <span className="weekly-metric-label">Coding Drills</span>
                      <div className="weekly-metric-bar-bg">
                        <div
                          className="weekly-metric-bar-fill"
                          style={{
                            width: `${report.coding}%`,
                            background: "#8b5cf6",
                          }}
                        />
                      </div>
                      <span className="weekly-metric-val">{report.coding}%</span>
                    </div>

                    <div className="weekly-metric-item">
                      <span className="weekly-metric-label">Interview Eval</span>
                      <div className="weekly-metric-bar-bg">
                        <div
                          className="weekly-metric-bar-fill"
                          style={{
                            width: `${report.interview}%`,
                            background: "#06b6d4",
                          }}
                        />
                      </div>
                      <span className="weekly-metric-val">
                        {report.interview}%
                      </span>
                    </div>
                  </div>

                  <div className="weekly-two-col">
                    {/* Milestones info */}
                    <div className="weekly-section-box">
                      <h4 className="weekly-section-title">Milestones</h4>
                      <p className="weekly-section-sub">{report.milestones}</p>
                    </div>

                    {/* Skill Gaps Identified */}
                    <div className="weekly-section-box">
                      <h4 className="weekly-section-title">
                        Identified Skill Gaps
                      </h4>
                      <div className="weekly-tags-row">
                        {report.skillGaps.map((gap) => (
                          <span key={gap} className="weekly-gap-tag">
                            <AlertTriangle size={12} className="text-amber-600" />
                            {gap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mentor Next Steps */}
                  <div className="weekly-section-box weekly-steps-box">
                    <h4 className="weekly-section-title">
                      Mentor Action Steps for Upcoming Sprint
                    </h4>
                    <ul className="weekly-steps-list">
                      {report.nextSteps.map((step, idx) => (
                        <li key={idx} className="weekly-step-item">
                          <CheckCircle
                            size={14}
                            className="text-emerald-600 flex-shrink-0"
                          />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
