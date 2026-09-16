import React from 'react';
import { mentorSkillGaps } from '../../../data/mentorMockData';
import { AlertTriangle, Sparkles } from 'lucide-react';
import '../Styles/Students.css';
import '../Styles/SkillGaps.css';

export default function SkillGaps() {
  const getPriorityClass = (priority) => {
    if (priority === 'High') return 'mentor-priority-badge--high';
    if (priority === 'Medium') return 'mentor-priority-badge--medium';
    return 'mentor-priority-badge--low';
  };

  return (
    <div className="mentor-skillgaps-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <AlertTriangle size={20} color="#4f46e5" />
            <span>AI Skill Gap Diagnostics</span>
          </h2>
          <p className="mentor-page-subtitle">Automated AI detection of concept weaknesses and remedial assignment triggers</p>
        </div>

        <button className="mentor-btn-primary">
          <Sparkles size={16} />
          <span>Trigger Remedial Assignment</span>
        </button>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Topic / Concept Area</th>
                <th>Affected Batch</th>
                <th>Deficiency Rate</th>
                <th>Avg Test Score</th>
                <th>Remedial Priority</th>
              </tr>
            </thead>
            <tbody>
              {mentorSkillGaps.map((g) => (
                <tr key={g.id}>
                  <td className="mentor-skillgap-topic">{g.topic}</td>
                  <td className="mentor-skillgap-batch">{g.batch}</td>
                  <td className="mentor-skillgap-deficiency">{g.deficiencyRate}</td>
                  <td className="mentor-skillgap-score">{g.avgScore}</td>
                  <td>
                    <span className={`mentor-priority-badge ${getPriorityClass(g.priority)}`}>
                      {g.priority} Priority
                    </span>
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
