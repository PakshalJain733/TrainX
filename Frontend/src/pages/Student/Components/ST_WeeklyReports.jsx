import React, { useState, useEffect } from "react";
import { FileCheck2, ChevronDown, ChevronUp, Download, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import { apiFetch } from "../../../utils/api";
import "../Styles/ST_WeeklyReports.css";

export default function WeeklyReports() {
  const { isModuleActive } = useSystemMaintenance();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openWeek, setOpenWeek] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/student/weekly-reports");
        const data = res?.data || (Array.isArray(res) ? res : []);
        if (isMounted) {
          setReports(data);
          if (data && data.length > 0) {
            setOpenWeek(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch student weekly reports:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleWeek = (id) => {
    setOpenWeek((prev) => (prev === id ? null : id));
  };

  const handleDownload = (reportTitle) => {
    if (!isModuleActive("studentPdfDownloader")) {
      alert("PDF download service is currently offline for maintenance.");
      return;
    }
    alert(`Downloading ${reportTitle} dossier summary (PDF)...`);
  };

  const hasReports = reports && reports.length > 0;
  const activeMentor = hasReports ? (reports[0]?.mentor || "Assigned Faculty Mentor") : "Assigned Faculty Mentor";
  const activeTrend = hasReports ? (reports[0]?.trendStatus || "On Track") : "Pending Review";

  return (
    <div className="weekly-reports-page stack-6">
      <div className="ui-section-header-ST">
        <div className="ui-section-main-ST">
          <div>
            <h2 className="ui-section-title">
              <FileCheck2 size={22} className="ui-section-title-icon" />
              <span>Weekly Performance Reports</span>
            </h2>
            <p className="ui-section-desc">
              Review weekly mentor scorecards, attendance logs, technical evaluation notes, and recommended action steps.
            </p>
          </div>
        </div>
      </div>

      {/* Reviewer / Current Status Banner */}
      <div className="weekly-status-banner">
        <div className="weekly-status-header">
          <FileCheck2 size={20} className="weekly-status-icon" />
          <span>Current status</span>
        </div>
        <p className="weekly-status-desc">
          {hasReports ? (
            <>Supervised by Mentor: <strong>{activeMentor}</strong> · Academic Oversight: ECS / Training Cell</>
          ) : (
            <>Weekly evaluation scorecards submitted by your faculty mentor will appear here for each training cycle.</>
          )}
        </p>
        <div className="weekly-status-pills">
          <span className="weekly-track-badge" style={!hasReports ? { background: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0' } : {}}>
            {hasReports ? activeTrend : "Pending Mentor Review"}
          </span>
          <span className="weekly-track-note">
            {hasReports
              ? (activeTrend === "On Track" ? "Progress aligned with target placement readiness." : "Attention recommended on highlighted skill gaps.")
              : "No weekly report has been submitted by your mentor for this week yet."}
          </span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="weekly-reports-list">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Loader2 size={32} className="spinning" style={{ margin: '0 auto 12px auto', color: '#4f46e5', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Loading weekly performance dossier...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="admin-empty-state-card" style={{ padding: '48px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
            <FileCheck2 size={38} className="weekly-empty-icon" style={{ margin: '0 auto 12px auto', color: '#94a3b8' }} />
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>No Weekly Reports Available Yet</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0, maxWidth: '460px', marginInline: 'auto' }}>
              Your weekly performance evaluations will appear here once your assigned faculty mentor completes and submits the weekly mentor evaluation form.
            </p>
          </div>
        ) : (
          reports.map((report) => {
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
                      {(report.skillGaps || []).map((gap) => (
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
                      {(report.nextSteps || []).map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className="weekly-download-btn"
                    onClick={() => handleDownload(report.title)}
                    disabled={!isModuleActive("studentPdfDownloader")}
                    style={!isModuleActive("studentPdfDownloader") ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                    title={!isModuleActive("studentPdfDownloader") ? "PDF download disabled by administrator" : "Download report"}
                  >
                    <Download size={15} />
                    {isModuleActive("studentPdfDownloader") ? "Download report" : "Download (Disabled)"}
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
