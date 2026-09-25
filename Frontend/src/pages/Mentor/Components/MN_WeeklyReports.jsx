import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { FileCheck2, Plus, Download, RefreshCw } from 'lucide-react';
import "../Styles/MN_WeeklyReports.css";

export default function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadReports = () => {
    setLoading(true);
    apiFetch("/reports/mentor/batch-reports")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setReports(res.data);
        } else if (res && Array.isArray(res)) {
          setReports(res);
        } else {
          setReports([]);
        }
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await apiFetch("/reports/weekly/generate", {
        method: "POST",
        body: JSON.stringify({ batch_id: 1, weekLabel: `Week ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` }),
      });
      loadReports();
    } catch (e) {
      console.warn("Failed to generate report in DB:", e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mentor-weeklyreports-container">
      {/* Header */}
      <div className="mentor-page-header-wr">
        <div>
          <h2 className="mentor-page-title">
            <FileCheck2 size={20} color="#4f46e5" />
            <span>Weekly Batch Progress & Governance Reports</span>
          </h2>
          <p className="mentor-page-subtitle">Submit and review weekly batch audit reports saved in database</p>
        </div>

        <button className="mentor-btn-primary" onClick={handleGenerateReport} disabled={generating}>
          {generating ? <RefreshCw size={16} className="spin" /> : <Plus size={16} />}
          <span>{generating ? "Generating..." : "Generate Weekly Report"}</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading weekly reports...</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
              No weekly reports found in database. Click "Generate Weekly Report" above to compile batch metrics.
            </div>
          ) : (
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Covered Batch</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th className="mentor-actions-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td className="mentor-report-title">{r.title || r.week_label || `Weekly Performance Audit #${r.id}`}</td>
                    <td className="mentor-report-batch">{r.batch || r.batch_name || "All Batches"}</td>
                    <td className="mentor-report-date">{r.created_at ? new Date(r.created_at).toLocaleDateString() : r.submittedAt || "Recent"}</td>
                    <td>
                      <span className="mentor-report-status">
                        {r.trend_status || r.status || "Completed"}
                      </span>
                    </td>
                    <td className="mentor-actions-cell">
                      <button className="mentor-btn-download" onClick={() => alert(`Report Summary: Overall Score ${r.overall_score || 78}%, Attendance ${r.attendance_score || '82%'}`)}>
                        <Download size={14} /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
