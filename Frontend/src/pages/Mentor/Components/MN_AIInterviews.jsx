import React, { useState, useEffect } from 'react';
import { Bot, Search } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import "../Styles/MN_AIInterviews.css";

const defaultReviews = [];

export default function AIInterviews() {
  const [reviews, setReviews] = useState(defaultReviews);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    apiFetch("/mentor/ai-interviews")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setReviews(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredReviews = reviews.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.rollNo && r.rollNo.toLowerCase().includes(term)) ||
      (r.role && r.role.toLowerCase().includes(term)) ||
      (r.batch && r.batch.toLowerCase().includes(term)) ||
      (r.weakness && r.weakness.toLowerCase().includes(term))
    );
  });

  const getOverallClass = (scoreStr) => {
    const num = parseInt(scoreStr, 10) || 0;
    if (num >= 75) return "mentor-interview-overall-badge--green";
    if (num >= 60) return "mentor-interview-overall-badge--blue";
    return "mentor-interview-overall-badge--red";
  };

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

      {/* Search Bar */}
      <div className="mentor-search-wrapper">
        <Search size={16} className="mentor-search-icon" />
        <input
          type="text"
          placeholder="Search student name, roll number, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mentor-search-input"
        />
      </div>

      {/* Evaluation List */}
      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Student Name & Roll No</th>
                <th>Target Role</th>
                <th>Tech Score</th>
                <th>Behavioral Score</th>
                <th>Overall Score</th>
                <th>Weak Spot Area</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="mentor-empty-table-cell">
                    No AI mock interview evaluations found matching search.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="mentor-student-cell">
                        <p className="mentor-student-name">{r.name}</p>
                        <p className="mentor-student-college">{r.rollNo || "CSE26-001"} · {r.batch}</p>
                      </div>
                    </td>
                    <td className="mentor-interview-role">{r.role}</td>
                    <td className="mentor-interview-score">{r.techScore}</td>
                    <td className="mentor-interview-score">{r.behavioralScore}</td>
                    <td>
                      <span className={`mentor-interview-overall-badge ${getOverallClass(r.overall)}`}>
                        {r.overall}
                      </span>
                    </td>
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
