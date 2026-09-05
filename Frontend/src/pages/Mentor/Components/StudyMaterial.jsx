import React from 'react';
import { mentorStudyMaterial } from '../../../data/mentorMockData';
import { BookOpen, Plus, Download } from 'lucide-react';
import '../Styles/Students.css';
import '../Styles/SkillGaps.css';
import '../Styles/StudyMaterial.css';

export default function StudyMaterial() {
  return (
    <div className="mentor-studymaterial-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <BookOpen size={20} color="#4f46e5" />
            <span>Study Material & Resources Library</span>
          </h2>
          <p className="mentor-page-subtitle">Publish lecture decks, code repositories, cheatsheets, and PDF study guides</p>
        </div>

        <button className="mentor-btn-primary">
          <Plus size={16} />
          <span>Upload New Study Material</span>
        </button>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Resource Title</th>
                <th>Target Batch</th>
                <th>Category</th>
                <th>Published Date</th>
                <th>Total Downloads</th>
                <th className="mentor-actions-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {mentorStudyMaterial.map((m) => (
                <tr key={m.id}>
                  <td className="mentor-material-title">{m.title}</td>
                  <td className="mentor-material-batch">{m.batch}</td>
                  <td>
                    <span className="mentor-material-tag">
                      {m.category}
                    </span>
                  </td>
                  <td className="mentor-material-date">{m.date}</td>
                  <td className="mentor-material-downloads">{m.downloads} downloads</td>
                  <td className="mentor-actions-cell">
                    <button className="mentor-btn-download">
                      <Download size={14} /> Download
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
