import { useState } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, Code, Sparkles, Layers } from "lucide-react";
import CoordinatorAssessments from "./CO_Assessments";
import CodingPractice from "./CO_CodingPractice";

export default function CoordinatorQuizzesAndCodes() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes("practice") || location.hash === "#coding") {
      return "coding";
    }
    return "quizzes";
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Quizzes and Codes
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Unified portal for publishing MCQ quiz tests, creating coding practice challenges, managing problem test cases, and auditing live student submissions.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("quizzes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === "quizzes"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen size={16} /> MCQ Quizzes & Assessments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coding")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === "coding"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
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
