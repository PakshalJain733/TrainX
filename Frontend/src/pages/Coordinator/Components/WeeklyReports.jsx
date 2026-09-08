import { useState } from "react";
import { FileSpreadsheet, Download, CheckCircle, FileText } from "lucide-react";
import { coordinatorWeeklyReports } from "../../../data/coordinatorMockData";
import "../Styles/WeeklyReports.css";

export default function CoordinatorWeeklyReports() {
  const [reports] = useState(coordinatorWeeklyReports);

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
          onClick={() => alert("Generating & Downloading Week 36 Governance PDF Audit Report...")}
        >
          <Download size={16} /> Generate Audit PDF
        </button>
      </div>

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
                  Target: {rep.batch} · Date: {rep.date} · Size: {rep.fileSize}
                </div>
              </div>
            </div>

            <div className="coord-report-card__right">
              <span className="coord-report-card__status">
                {rep.status}
              </span>
              <button
                className="coord-btn coord-report-card__download-btn"
                onClick={() => alert(`Downloading ${rep.title}`)}
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
