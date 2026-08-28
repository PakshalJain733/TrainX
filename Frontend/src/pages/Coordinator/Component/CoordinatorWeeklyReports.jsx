import React, { useState } from "react";
import {
  FileCheck2,
  Filter,
  Check,
  Star,
  ChevronRight,
  BookOpen,
  ArrowLeft
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import "../Style/CoordinatorWeeklyReports.css";

const initialReports = [
  {
    id: 1,
    student: "Ganesh Shinde",
    rollNo: "ECS-042",
    batch: "Python Backend (PY-BE)",
    week: "Week 5 (Oct 01 - Oct 07)",
    topics: "FastAPI OAuth2, Pydantic Schema validations, custom database connection pooling.",
    challenges: "Encountered circular dependencies when import schemas; resolved by refactoring router directory.",
    hoursLogged: 12,
    status: "Pending",
    grade: "",
    remarks: ""
  },
  {
    id: 2,
    student: "Riya Shah",
    rollNo: "ECS-001",
    batch: "Python Backend (PY-BE)",
    week: "Week 5 (Oct 01 - Oct 07)",
    topics: "React Hooks deep dive (useEffect dependency cleanup, custom hooks for fetching).",
    challenges: "Handling memory leak errors in websocket connections; solved using cleanup functions.",
    hoursLogged: 15,
    status: "Graded",
    grade: "9",
    remarks: "Excellent implementation of websockets. Very detailed documentation of challenges."
  },
  {
    id: 3,
    student: "Kabir Menon",
    rollNo: "COMPS-015",
    batch: "DSA Algorithms (DSA-ADV)",
    week: "Week 5 (Oct 01 - Oct 07)",
    topics: "Graph traversal techniques, DFS/BFS implementation, Dijkstra short path routing.",
    challenges: "Trouble optimizing Dijkstra space complexity; still trying to implement indexed priority queue.",
    hoursLogged: 10,
    status: "Pending",
    grade: "",
    remarks: ""
  }
];

export default function CoordinatorWeeklyReports() {
  const [reports, setReports] = useState(initialReports);
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  
  const [gradeInput, setGradeInput] = useState("");
  const [remarksInput, setRemarksInput] = useState("");

  const handleSelectReport = (rep) => {
    setSelectedReport(rep);
    setGradeInput(rep.grade || "");
    setRemarksInput(rep.remarks || "");
  };

  const handleGradeSubmit = (e) => {
    e.preventDefault();
    if (!gradeInput) return;

    setReports(
      reports.map((r) =>
        r.id === selectedReport.id
          ? { ...r, grade: gradeInput, remarks: remarksInput, status: "Graded" }
          : r
      )
    );

    setSelectedReport({
      ...selectedReport,
      grade: gradeInput,
      remarks: remarksInput,
      status: "Graded"
    });
    alert("Report graded successfully!");
  };

  const filteredReports = reports.filter((r) => {
    const batchMatch = filterBatch === "all" || r.batch.includes(filterBatch);
    const statusMatch = filterStatus === "all" || r.status === filterStatus;
    return batchMatch && statusMatch;
  });

  return (
    <div className="student-page-inner stack-6 reports-wrapper">
      {selectedReport ? (
        <div className="stack-6 animate-fade-in">
          {/* Header */}
          <div className="report-detail-header">
            <button className="back-btn" onClick={() => setSelectedReport(null)}>
              <ArrowLeft size={16} /> Back to Reports
            </button>
            <div className="report-detail-meta">
              <h1 className="report-detail-title">Weekly Log Review</h1>
              <p className="report-detail-sub">
                {selectedReport.student} · {selectedReport.week}
              </p>
            </div>
          </div>

          <div className="report-detail-grid">
            {/* Left Content Card */}
            <div className="report-content-card shadow-sm stack-5">
              <div className="report-meta-info-row">
                <div className="meta-block">
                  <span className="info-label">Batch Code</span>
                  <span className="info-value">{selectedReport.batch}</span>
                </div>
                <div className="meta-block">
                  <span className="info-label">Hours Logged</span>
                  <span className="info-value">{selectedReport.hoursLogged} Hours</span>
                </div>
                <div className="meta-block">
                  <span className="info-label">Review Status</span>
                  <span className={`status-tag ${selectedReport.status === "Graded" ? "status-tag--success" : "status-tag--warning"}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              <div className="detail-section stack-2">
                <span className="info-label">Topics Studied & Tasks Completed</span>
                <p className="detail-text-value">{selectedReport.topics}</p>
              </div>

              <div className="detail-section stack-2">
                <span className="info-label">Challenges & Roadblocks Encountered</span>
                <p className="detail-text-value">{selectedReport.challenges}</p>
              </div>
            </div>

            {/* Right Grading Panel Card */}
            <div className="grading-panel-card shadow-sm stack-4">
              <h3 className="panel-title">Assessment & Grading</h3>
              <div className="divider"></div>

              <form onSubmit={handleGradeSubmit} className="stack-4">
                <div className="form-group">
                  <label>Assign Grade (1 to 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    placeholder="Enter grade"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Review Feedback / Remarks</label>
                  <textarea
                    rows={4}
                    placeholder="Provide constructive feedback..."
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                  />
                </div>
                <Button type="submit" className="btn-submit-grade">
                  Submit Evaluation
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header Row */}
          <div>
            <h1 className="reports-page-title">Review Student Weekly Reports</h1>
            <p className="reports-page-subtitle">Track log hours, evaluate submissions and provide guidance feedback</p>
          </div>

          {/* Filters Bar */}
          <div className="filters-bar shadow-sm">
            <div className="filter-item">
              <Filter size={14} />
              <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
                <option value="all">All Batches</option>
                <option value="Python">Python Backend</option>
                <option value="DSA">DSA Algorithms</option>
              </select>
            </div>
            <div className="filter-item">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Graded">Graded</option>
              </select>
            </div>
          </div>

          {/* Submissions List Card */}
          <div className="reports-list-card shadow-sm">
            <div className="reports-list-header">
              <h3 className="list-title">Submissions Directory</h3>
            </div>
            <div className="reports-list stack-2">
              {filteredReports.length === 0 ? (
                <div className="empty-reports-view">
                  No submissions match the selected filters.
                </div>
              ) : (
                filteredReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="report-list-row"
                    onClick={() => handleSelectReport(rep)}
                  >
                    <div className="row-left-wrap">
                      <div className="report-avatar">
                        {rep.student.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h4 className="row-student-name">{rep.student}</h4>
                        <p className="row-meta-desc">
                          {rep.rollNo} · {rep.batch} · {rep.week}
                        </p>
                      </div>
                    </div>
                    <div className="row-right-wrap">
                      {rep.status === "Graded" ? (
                        <div className="row-grade-badge">
                          <Star size={13} fill="#eab308" stroke="#eab308" />
                          <span>Grade: {rep.grade}/10</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="badge-pending">Pending Review</Badge>
                      )}
                      <ChevronRight size={16} className="chevron" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
