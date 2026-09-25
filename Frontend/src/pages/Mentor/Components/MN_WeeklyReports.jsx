import { useCallback, useEffect, useState } from "react";
import { FileCheck2, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../utils/api";
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

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const firstValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

export default function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(() => apiFetch("/mentor/weekly-reports").then(getReports), []);

  useEffect(() => {
    let mounted = true;
    loadReports()
      .then((next) => {
        if (mounted) setReports(next);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadReports]);

  const handleRefresh = () => {
    setLoading(true);
    loadReports()
      .then(setReports)
      .finally(() => setLoading(false));
  };

  return (
    <div className="mentor-weeklyreports-container">
      <div className="mentor-page-header-wr">
        <div>
          <h2 className="mentor-page-title">
            <FileCheck2 size={20} color="#4f46e5" />
            <span>Weekly Batch Progress & Governance Reports</span>
          </h2>
          <p className="mentor-page-subtitle">Weekly reports returned by the mentor service</p>
        </div>
        <button type="button" className="mentor-btn-secondary" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Report Title</th>
                <th>Covered Batch</th>
                <th>Submission Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><div className="mentor-report-empty"><FileCheck2 size={28} /><p>Loading weekly reports...</p></div></td></tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="mentor-report-empty">
                      <FileCheck2 size={28} />
                      <p>No weekly reports available yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report, index) => {
                  const title = textValue(firstValue(report, ["title", "reportTitle", "weekLabel", "week"])) || "N/A";
                  const batch = textValue(firstValue(report, ["batch", "batchName", "batch_name"])) || "N/A";
                  const submittedAt = formatDate(firstValue(report, ["submittedAt", "submitted_at", "createdAt", "created_at", "date"]));
                  const status = textValue(firstValue(report, ["status", "state"])) || "N/A";
                  return (
                    <tr key={textValue(firstValue(report, ["id", "reportId", "report_id"])) || index}>
                      <td className="mentor-report-title">{title}</td>
                      <td className="mentor-report-batch">{batch}</td>
                      <td className="mentor-report-date">{submittedAt}</td>
                      <td><span className="mentor-report-status">{status}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
