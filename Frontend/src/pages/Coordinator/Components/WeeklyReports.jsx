import { useState, useEffect } from "react";
import { Download, FileText } from "lucide-react";
import apiFetch from "../../../utils/api";
import "../Styles/WeeklyReports.css";

export default function CoordinatorWeeklyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    apiFetch("/coordinator/weekly-reports")
      .then((data) => {
        if (!mounted) return;
        setReports(data?.reports || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load reports");
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="coord-page-card" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading reports...</div>;
  }

  if (error) {
    return <div className="coord-page-card" style={{ padding: "48px", textAlign: "center", color: "#e11d48" }}>{error}</div>;
  }

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Governance & Audit Reports</h1>
          <p className="coord-page-sub">
            Weekly department training governance logs, defaulter counseling audits, and PDF compliance reports.
          </p>
        </div>
        <button
          className="coord-btn coord-btn--primary"
          onClick={() => alert("PDF generation is not available yet. Please visit the Reports section for generated governance reports.")}
        >
          <Download size={16} /> Generate Audit PDF
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="coord-report-card" style={{ padding: "36px", textAlign: "center", color: "#94a3b8" }}>
          No weekly reports have been generated for your department yet.
        </div>
      ) : (
        <div className="coord-reports-list">
          {reports.map((rep) => (
            <div key={rep.id} className="coord-report-card">
              <div className="coord-report-card__left">
                <div className="coord-report-card__icon">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="coord-report-card__title">{rep.title}</div>
                  <div className="coord-report-card__sub">
                    Target: {rep.batch} · Date: {rep.date} · Attendance: {rep.attendance}% · Avg Quiz: {rep.quiz}%
                  </div>
                  {rep.summary && (
                    <div className="coord-report-card__sub" style={{ marginTop: "4px", maxWidth: "560px" }}>
                      {rep.summary}
                    </div>
                  )}
                </div>
              </div>

              <div className="coord-report-card__right">
                <span className="coord-report-card__status">
                  {rep.status}
                </span>
                <button
                  className="coord-btn coord-report-card__download-btn"
                  onClick={() => alert("PDF downloads are not available yet. Weekly report data is shown above.")}
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}