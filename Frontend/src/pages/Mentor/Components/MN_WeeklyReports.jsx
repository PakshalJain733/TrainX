import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../utils/api';
import { FileCheck2, Plus, Download, RefreshCw } from 'lucide-react';
import "../Styles/MN_WeeklyReports.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getReports = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reports)) return payload.reports;
  return [];
};

export default function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/mentor/weekly-reports");
      const list = getReports(res);
      setReports(list);
    } catch (e) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await apiFetch("/mentor/weekly-reports", { method: "POST" });
      loadReports();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleRefresh = () => {
    loadReports();
  };

  return (
    <div className="mentor-weeklyreports-container">
      <div className="mentor-page-header-wr">
        <div>
          <h2 className="mentor-page-title">
            <FileCheck2 size={20} color="#4f46e5" />
            <span>Weekly Batch Progress & Governance Reports</span>
          </h2>
          <p className="mentor-page-subtitle">Submit and review weekly batch audit reports saved in database</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="mentor-btn-primary" onClick={handleGenerateReport} disabled={generating}>
            {generating ? <RefreshCw size={16} className="spin" /> : <Plus size={16} />}
            <span>{generating ? "Generating..." : "Generate Weekly Report"}</span>
          </button>
          <button type="button" className="mentor-btn-secondary" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading weekly reports...</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <FileCheck2 size={36} color="#94a3b8" />
              <h4 style={{ margin: 0, color: "#1e293b", fontSize: "15px", fontWeight: 700 }}>No Weekly Reports Available Yet</h4>
              <p style={{ margin: 0, fontSize: "13px" }}>
                Click "Generate Weekly Report" above to compile batch performance metrics.
              </p>
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
