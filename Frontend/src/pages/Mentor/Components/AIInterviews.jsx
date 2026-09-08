import React from 'react';
import { Bot } from 'lucide-react';
import '../Styles/Students.css';
import '../Styles/AIInterviews.css';

export default function AIInterviews() {
  const reviews = [];

  return (
    <div className="mentor-ai-interviews-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Bot size={20} color="#4f46e5" />
            <span>AI Mock Interview Student Diagnostics</span>
          </h2>
          <p className="mentor-page-subtitle">Review automated AI mock interview evaluations and student weak spots</p>
        </div>
      </div>

      {/* Evaluation List */}
      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Target Role</th>
                <th>Tech Score</th>
                <th>Behavioral Score</th>
                <th>Overall Score</th>
                <th>Weak Spot Area</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="mentor-empty-table-cell">
                    No AI mock interview evaluations recorded yet.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <p className="mentor-student-name">{r.name}</p>
                      <p className="mentor-student-college">{r.batch}</p>
                    </td>
                    <td className="mentor-interview-role">{r.role}</td>
                    <td className="mentor-interview-score">{r.techScore}</td>
                    <td className="mentor-interview-score">{r.behavioralScore}</td>
                    <td className="mentor-interview-overall">{r.overall}</td>
                    <td className="mentor-interview-weakness">{r.weakness}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
