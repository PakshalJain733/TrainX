import React, { useState } from "react";
import {
  Bot,
  Lightbulb,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/AiInterview.css";

const questionsList = [
  {
    id: 1,
    question:
      "Explain the difference between INNER JOIN and LEFT JOIN with an example.",
    topic: "SQL Optimisation",
  },
  {
    id: 2,
    question:
      "How do RESTful APIs handle idempotency, and which HTTP methods are inherently idempotent?",
    topic: "API Design",
  },
  {
    id: 3,
    question:
      "Explain how Python handles memory management and garbage collection internally.",
    topic: "Python Core",
  },
  {
    id: 4,
    question:
      "What is the difference between an Array and a Linked List in terms of time complexity for insertions and lookups?",
    topic: "Data Structures",
  },
  {
    id: 5,
    question:
      "How would you optimize a database query that is experiencing full table scans on a table with 5 million records?",
    topic: "SQL Optimisation",
  },
];

const skillGaps = [
  { skill: "SQL Optimisation", current: 58, target: 80 },
  { skill: "API Design", current: 64, target: 85 },
  { skill: "Data Structures", current: 71, target: 85 },
  { skill: "Python Core", current: 88, target: 90 },
  { skill: "Communication", current: 76, target: 85 },
];

const pastInterviews = [
  {
    id: 1,
    role: "Python Backend Intern",
    date: "10 Aug 2026",
    score: 72,
    technical: 68,
    problemSolving: 71,
    communication: 76,
    tags: ["Database indexing", "API versioning"],
  },
  {
    id: 2,
    role: "Software Trainee",
    date: "27 Jul 2026",
    score: 64,
    technical: 58,
    problemSolving: 63,
    communication: 70,
    tags: ["OOP depth", "Time complexity"],
  },
];

export default function AIInterview() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentQ = questionsList[currentIdx];
  const progressPercent = ((currentIdx + 1) / questionsList.length) * 100;

  const handleNext = () => {
    if (!answer.trim()) return;

    setIsEvaluating(true);
    setTimeout(() => {
      setSubmittedAnswers((prev) => ({
        ...prev,
        [currentIdx]: answer,
      }));

      setIsEvaluating(false);
      setFeedback({
        score: Math.floor(Math.random() * 20 + 75),
        feedbackText:
          "Good clarity on definitions and examples. Make sure to specify edge case handling and indexes in production scenarios.",
      });

      if (currentIdx < questionsList.length - 1) {
        setCurrentIdx((i) => i + 1);
        setAnswer("");
        setFeedback(null);
      }
    }, 600);
  };

  return (
    <div className="ai-interview-page">
      <div className="ai-interview-split-grid">
        {/* Practice Arena */}
        <div className="interview-practice-card">
          <div className="interview-card-header">
            <Bot size={20} className="text-blue-600" />
            <span>Technical interview practice</span>
          </div>

          <div className="interview-question-tracker">
            Question {currentIdx + 1} of {questionsList.length}
          </div>

          <div className="interview-progress-bar">
            <div
              className="interview-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="interview-prompt-box">{currentQ.question}</div>

          <textarea
            className="interview-textarea"
            placeholder="Type your structured answer here (include code/logic examples if applicable)..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <div className="interview-action-row">
            <button
              className="interview-next-btn"
              onClick={handleNext}
              disabled={isEvaluating || !answer.trim()}
            >
              {isEvaluating ? (
                "Evaluating Answer..."
              ) : currentIdx === questionsList.length - 1 ? (
                <>Submit & Finish <ChevronRight size={16} /></>
              ) : (
                <>Next question <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>

        {/* Skill Gap Analysis */}
        <div className="skill-gap-card">
          <div className="skill-gap-header">
            <Lightbulb size={20} className="text-amber-500" />
            <span>Skill gap analysis</span>
          </div>
          <p className="skill-gap-subtitle">Current score vs target benchmarks</p>

          <div className="skill-gap-items">
            {skillGaps.map((item) => (
              <div key={item.skill} className="skill-gap-item-row">
                <div className="skill-gap-item-meta">
                  <span>{item.skill}</span>
                  <span className="skill-gap-score-target">
                    {item.current} / {item.target}
                  </span>
                </div>
                <div className="skill-gap-bar">
                  <div
                    className="skill-gap-fill"
                    style={{ width: `${(item.current / item.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past Interviews History */}
      <div className="past-interviews-card">
        <h3 className="past-interviews-header">Past interviews</h3>
        <p className="past-interviews-subtitle">AI evaluation history & diagnostic notes</p>

        <div className="past-interviews-grid">
          {pastInterviews.map((item) => (
            <div key={item.id} className="past-interview-item">
              <div className="past-interview-top">
                <div>
                  <h4 className="past-interview-title">{item.role}</h4>
                  <p className="past-interview-date">{item.date}</p>
                </div>
                <span className="past-interview-score-pill">{item.score}%</span>
              </div>

              <div className="past-interview-scores-row">
                <div className="past-score-box">
                  <div className="past-score-val">{item.technical}</div>
                  <div className="past-score-label">Technical</div>
                </div>
                <div className="past-score-box">
                  <div className="past-score-val">{item.problemSolving}</div>
                  <div className="past-score-label">Problem solving</div>
                </div>
                <div className="past-score-box">
                  <div className="past-score-val">{item.communication}</div>
                  <div className="past-score-label">Communication</div>
                </div>
              </div>

              <div className="past-interview-tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="past-tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
