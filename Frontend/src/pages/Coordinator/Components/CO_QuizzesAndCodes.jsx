import { useState } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, Code, Sparkles, Layers, GraduationCap } from "lucide-react";
import CoordinatorAssessments from "./CO_Assessments";
import CodingPractice from "./CO_CodingPractice";
import "../Styles/CO_QuizzesAndCodes.css";

export default function CoordinatorQuizzesAndCodes() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes("practice") || location.hash === "#coding") {
      return "coding";
    }
    return "quizzes";
  });

  return (
    <div className="coord-qnc-container">
      {/* Header & Sub-Tab Switcher */}
      <div className="coord-qnc-header">
        <div className="coord-qnc-header-content">
          <h1 className="coord-qnc-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <GraduationCap size={24} className="ui-section-title-icon" />
            <span>Quizzes and Codes</span>
          </h1>
          <p className="coord-qnc-subtitle">
            Unified portal for publishing MCQ quiz tests, creating coding practice challenges, managing problem test cases, and auditing live student submissions.
          </p>
        </div>

        <div className="coord-qnc-switcher">
          <button
            type="button"
            onClick={() => setActiveTab("quizzes")}
            className={`coord-qnc-tab-btn ${activeTab === "quizzes" ? "active" : ""}`}
          >
            <BookOpen size={16} /> MCQ Quizzes & Assessments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coding")}
            className={`coord-qnc-tab-btn ${activeTab === "coding" ? "active" : ""}`}
          >
            <Code size={16} /> Coding Practice
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "quizzes" ? <CoordinatorAssessments /> : <CodingPractice />}
    </div>
  );
}
