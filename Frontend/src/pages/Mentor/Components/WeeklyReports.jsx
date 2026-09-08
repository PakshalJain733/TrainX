import React from 'react';
import { mentorWeeklyReports } from '../../../data/mentorMockData';
import { FileCheck2, Plus, Download } from 'lucide-react';
import '../Styles/Students.css';
import '../Styles/SkillGaps.css';
import '../Styles/StudyMaterial.css';
import '../Styles/WeeklyReports.css';

export default function WeeklyReports() {
  return (
    <div className="mentor-weeklyreports-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <FileCheck2 size={20} color="#4f46e5" />
            <span>Weekly Batch Progress & Governance Reports</span>
          </h2>
          <p className="mentor-page-subtitle">Submit weekly batch audit reports to Super Admin and Department HODs</p>
        </div>

        <button className="mentor-btn-primary">
          <Plus size={16} />
          <span>Submit Weekly Report</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
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
              {mentorWeeklyReports.map((r) => (
                <tr key={r.id}>
                  <td className="mentor-report-title">{r.title}</td>
                  <td className="mentor-report-batch">{r.batch}</td>
                  <td className="mentor-report-date">{r.submittedAt}</td>
                  <td>
                    <span className="mentor-report-status">
                      {r.status}
                    </span>
                  </td>
                  <td className="mentor-actions-cell">
                    <button className="mentor-btn-download">
                      <Download size={14} /> Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
