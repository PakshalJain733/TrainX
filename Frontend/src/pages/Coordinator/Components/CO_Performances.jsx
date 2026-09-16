import { useState } from "react";
import { Code, BookOpen, Bot } from "lucide-react";
import CodingPerformance from "./CO_CodingPerformance";
import QuizPerformance from "./CO_QuizPerformance";
import InterviewPerformance from "./CO_InterviewPerformance";
import "../Styles/CO_CodingPerformance.css";

export default function CoordinatorPerformances() {
  const [activeTab, setActiveTab] = useState("coding");

  return (
    <div className="coord-perf-container">
      {/* Header & Sub-Tab Switcher */}
      <div className="coord-perf-header-bar">
        <div className="coord-perf-header-left">
          <h1 className="coord-perf-title">
            Performances Governance
          </h1>
          <p className="coord-perf-sub">
            Comprehensive unified analytics for student coding practice metrics, MCQ quiz scorecards, and AI mock interview evaluations.
          </p>
        </div>

        <div className="coord-perf-tabs-nav">
          <button
            type="button"
            onClick={() => setActiveTab("coding")}
            className={`coord-perf-tab-btn ${activeTab === "coding" ? "coord-perf-tab-btn--active" : ""}`}
          >
            <Code size={16} /> Coding Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`coord-perf-tab-btn ${activeTab === "quiz" ? "coord-perf-tab-btn--active" : ""}`}
          >
            <BookOpen size={16} /> Quiz Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interview")}
            className={`coord-perf-tab-btn ${activeTab === "interview" ? "coord-perf-tab-btn--active" : ""}`}
          >
            <Bot size={16} /> AI Interview Performance
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "coding" && <CodingPerformance />}
      {activeTab === "quiz" && <QuizPerformance />}
      {activeTab === "interview" && <InterviewPerformance />}
    </div>
  );
}
