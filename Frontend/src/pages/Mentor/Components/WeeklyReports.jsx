import React, { useState, useEffect } from 'react';
import { FileCheck2, Plus, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/SkillGaps.css';
import '../Styles/StudyMaterial.css';
import '../Styles/WeeklyReports.css';

export default function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMentorReports();
  }, []);

  const fetchMentorReports = () => {
    setLoading(true);
    apiFetch('/reports')
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setReports(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch mentor weekly reports:', err);
      })
      .finally(() => setLoading(false));
  };

  const handleGenerateReport = () => {
    setGenerating(true);
    apiFetch('/reports/weekly/generate', {
      method: 'POST',
      body: JSON.stringify({ student_id: 6, forceRegenerate: true }),
    })
      .then(() => {
        setMessage('Weekly audit summary generated successfully!');
        fetchMentorReports();
        setTimeout(() => setMessage(''), 3500);
      })
      .catch((err) => {
        console.error('Failed to generate weekly report:', err);
      })
      .finally(() => setGenerating(false));
  };

  const handleDownload = (title) => {
    alert(`Downloading ${title} PDF report...`);
  };

  return (
    <div className="mentor-weeklyreports-container">
      {/* Header */}
      <div className="mentor-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="mentor-page-title">
            <FileCheck2 size={20} color="#4f46e5" />
            <span>Weekly Batch Progress & Governance Reports</span>
          </h2>
          <p className="mentor-page-subtitle">Submit weekly batch audit reports to Super Admin and Department HODs</p>
        </div>

        <button
          className="mentor-btn-primary"
          onClick={handleGenerateReport}
          disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {generating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
          <span>{generating ? 'Generating...' : 'Submit Weekly Report'}</span>
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* Reports Table */}
      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#64748b' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', marginRight: 10 }} />
              <span>Loading batch weekly reports...</span>
              <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No weekly batch reports generated yet. Click "Submit Weekly Report" above.
            </div>
          ) : (
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Covered Batch / Student</th>
                  <th>Weekly Score</th>
                  <th>Status</th>
                  <th className="mentor-actions-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td className="mentor-report-title">{r.week_label || r.title || 'Week 37 Report'}</td>
                    <td className="mentor-report-batch">{r.student_info?.name || r.batch || 'Batch A - CSE'}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#4f46e5' }}>
                        {r.overall_score !== undefined ? `${r.overall_score}%` : (r.score || '82%')}
                      </span>
                    </td>
                    <td>
                      <span className="mentor-report-status" style={{ background: '#ecfdf5', color: '#047857', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                        {r.trend_status || 'Verified'}
                      </span>
                    </td>
                    <td className="mentor-actions-cell">
                      <button
                        className="mentor-btn-download"
                        onClick={() => handleDownload(r.week_label || r.title || 'Weekly Report')}
                      >
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
