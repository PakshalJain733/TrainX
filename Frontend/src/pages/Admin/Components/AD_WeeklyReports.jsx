import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Eye,
  Plus,
  RefreshCw,
  X,
  FileText
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_WeeklyReports.css";

const MOCK_ADMIN_REPORTS = [
  {
    id: 1,
    title: "CSE 2026 Batch - Week 8 Governance & Audit",
    batch: "CSE 2026 Cohort",
    department: "Computer Science",
    author: "Prof. Anubhav Shukla",
    submittedAt: "2026-09-22",
    attendanceRate: "92%",
    complianceScore: "95/100",
    status: "Approved",
    summary: "High participation in Java & Data Structures sprint. 3 defaulters flagged and assigned remediation tasks."
  },
  {
    id: 2,
    title: "Fullstack Specialization - Sprint 4 Progress",
    batch: "Fullstack Specialization",
    department: "Information Technology",
    author: "Priya Sharma",
    submittedAt: "2026-09-20",
    attendanceRate: "88%",
    complianceScore: "89/100",
    status: "Approved",
    summary: "React SPA development modules completed. All capstone projects evaluated on time."
  },
  {
    id: 3,
    title: "AIDS Alpha - Machine Learning Lab Review",
    batch: "AIDS 2025 Alpha",
    department: "AI & Data Science",
    author: "Dr. Rajesh K.",
    submittedAt: "2026-09-18",
    attendanceRate: "79%",
    complianceScore: "76/100",
    status: "Pending Review",
    summary: "Attendance dropped below threshold during mid-term submission window. Follow-up required with Department HOD."
  },
  {
    id: 4,
    title: "Cyber Security - Ethical Hacking Module Report",
    batch: "CyberSec 2026",
    department: "Cyber Security",
    author: "Neha Verma",
    submittedAt: "2026-09-15",
    attendanceRate: "94%",
    complianceScore: "98/100",
    status: "Approved",
    summary: "Network vulnerability lab simulations completed. 100% submission rate on practical assessments."
  }
];

export default function AdminWeeklyReports() {
  const [reports, setReports] = useState(MOCK_ADMIN_REPORTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    setLoading(true);
    apiFetch("/reports")
      .then((res) => {
        const dataList = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(dataList) && dataList.length > 0) {
          const mapped = dataList.map((item, index) => ({
            id: item.id || index + 1,
            title: item.title || item.report_name || `Weekly Progress Report #${item.id || index + 1}`,
            batch: item.batch_name || item.batch || "CSE 2026 Cohort",
            department: item.department || "Computer Engineering",
            author: item.mentorName || item.author || "Department Coordinator",
            submittedAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : "2026-09-22",
            attendanceRate: item.attendance_score || "89%",
            complianceScore: `${Math.round(item.overall_score || 90)}/100`,
            status: item.status || "Approved",
            summary: item.summary || item.suggestions || "Weekly batch performance and governance assessment completed."
          }));
          setReports(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load reports from API, using default list:", err);
      })
      .finally(() => setLoading(false));
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const approvedCount = reports.filter((r) => r.status === "Approved").length;
  const pendingCount = reports.filter((r) => r.status === "Pending Review").length;

  const handleDownloadPDF = (report) => {
    alert(`Downloading PDF report dossier for "${report.title}"...`);
  };

  return (
    <div className="ad-wr-container">
      {/* Header Banner */}
      <div className="ad-wr-header">
        <div>
          <div className="ad-wr-header-title-row">
            <div className="ad-wr-header-icon">
              <FileCheck2 size={24} />
            </div>
            <div>
              <h1 className="ad-wr-title">Weekly Progress & Governance Reports</h1>
              <p className="ad-wr-subtitle">Audit, review, and archive weekly batch performance & trainer governance reports</p>
            </div>
          </div>
        </div>

        <div className="ad-wr-actions">
          <button className="ad-wr-btn ad-wr-btn-secondary" onClick={fetchReports}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            className="ad-wr-btn ad-wr-btn-primary"
            onClick={() => alert("Weekly report auto-compiler triggered!")}
          >
            <Plus size={16} />
            <span>Generate Governance Report</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="ad-wr-stats-grid">
        <div className="ad-wr-stat-card">
          <div className="ad-wr-stat-info">
            <h4>Total Reports</h4>
            <div className="ad-wr-stat-val">{reports.length}</div>
            <div className="ad-wr-stat-sub">Across All Batches</div>
          </div>
          <div className="ad-wr-stat-icon-wrap indigo">
            <FileText size={24} />
          </div>
        </div>

        <div className="ad-wr-stat-card">
          <div className="ad-wr-stat-info">
            <h4>Approved Reports</h4>
            <div className="ad-wr-stat-val">{approvedCount}</div>
            <div className="ad-wr-stat-sub">Verified Compliance</div>
          </div>
          <div className="ad-wr-stat-icon-wrap emerald">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="ad-wr-stat-card">
          <div className="ad-wr-stat-info">
            <h4>Pending Reviews</h4>
            <div className="ad-wr-stat-val">{pendingCount}</div>
            <div className="ad-wr-stat-sub">Awaiting Audit</div>
          </div>
          <div className="ad-wr-stat-icon-wrap amber">
            <Clock size={24} />
          </div>
        </div>

        <div className="ad-wr-stat-card">
          <div className="ad-wr-stat-info">
            <h4>Avg Compliance Rate</h4>
            <div className="ad-wr-stat-val">91.4%</div>
            <div className="ad-wr-stat-sub">+2.3% this month</div>
          </div>
          <div className="ad-wr-stat-icon-wrap rose">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ad-wr-filter-bar">
        <div className="ad-wr-search-box">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search report title, batch, or trainer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="ad-wr-filter-group">
          <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>Status:</label>
          <select
            className="ad-wr-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending Review">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="ad-wr-table-card">
        <table className="ad-wr-table">
          <thead>
            <tr>
              <th>Report Dossier Title</th>
              <th>Covered Batch & Dept</th>
              <th>Author / Mentor</th>
              <th>Submitted Date</th>
              <th>Compliance Score</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  <AlertCircle size={32} style={{ margin: "0 auto 0.5rem", color: "#94a3b8" }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No governance reports match your search criteria.</p>
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div className="ad-wr-report-title-cell">
                      <FileText size={16} color="#4f46e5" />
                      <span>{report.title}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{report.batch}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{report.department}</div>
                  </td>
                  <td>{report.author}</td>
                  <td>{report.submittedAt}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: "#047857" }}>{report.complianceScore}</span>
                  </td>
                  <td>
                    <span
                      className={`ad-wr-badge ${
                        report.status === "Approved" ? "approved" : "pending"
                      }`}
                    >
                      {report.status === "Approved" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {report.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button
                        className="ad-wr-action-btn"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        className="ad-wr-action-btn"
                        onClick={() => handleDownloadPDF(report)}
                      >
                        <Download size={13} /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Detail Modal */}
      {selectedReport && (
        <div className="ad-wr-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="ad-wr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-wr-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileCheck2 size={20} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                  Weekly Report Dossier
                </h3>
              </div>
              <button
                style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
                onClick={() => setSelectedReport(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ad-wr-modal-body">
              <div>
                <h4 style={{ margin: "0 0 0.25rem", color: "#0f172a" }}>{selectedReport.title}</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Submitted by {selectedReport.author} on {selectedReport.submittedAt}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Batch</span>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedReport.batch}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Department</span>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedReport.department}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Attendance Rate</span>
                  <div style={{ fontWeight: 600, color: "#059669" }}>{selectedReport.attendanceRate}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Audit Score</span>
                  <div style={{ fontWeight: 600, color: "#4f46e5" }}>{selectedReport.complianceScore}</div>
                </div>
              </div>

              <div>
                <h5 style={{ margin: "0 0 0.5rem", color: "#334155" }}>Executive Summary & Audit Notes</h5>
                <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6, background: "#fff", padding: "0.875rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {selectedReport.summary}
                </p>
              </div>
            </div>

            <div className="ad-wr-modal-footer">
              <button
                className="ad-wr-btn ad-wr-btn-secondary"
                style={{ background: "#f1f5f9", color: "#334155" }}
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>
              <button
                className="ad-wr-btn ad-wr-btn-primary"
                onClick={() => {
                  handleDownloadPDF(selectedReport);
                  setSelectedReport(null);
                }}
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
