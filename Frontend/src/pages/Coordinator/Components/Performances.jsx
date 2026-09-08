import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Code, BookOpen, Bot } from "lucide-react";
import CodingPerformance from "./CodingPerformance";
import QuizPerformance from "./QuizPerformance";
import InterviewPerformance from "./InterviewPerformance";

export default function CoordinatorPerformances() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("coding");

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Performances
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Comprehensive unified analytics for student coding practice metrics, MCQ quiz scorecards, and AI mock interview evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto border border-slate-200/80 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("coding")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === "coding"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code size={16} /> Coding Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === "quiz"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen size={16} /> Quiz Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === "interview"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
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
