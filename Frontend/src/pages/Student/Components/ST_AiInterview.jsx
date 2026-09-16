import React, { useState } from "react";
import {
  Bot,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  Play,
  RotateCcw,
  X,
  Award,
  Zap,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/ST_AiInterview.css";

const questionsList = [
  {
    id: 1,
    question:
      "Explain the difference between INNER JOIN and LEFT JOIN with an example.",
    topic: "SQL Optimisation",
    sampleAnswer:
      "INNER JOIN returns only matching records present in both tables. LEFT JOIN returns all records from the left table and matching rows from the right table, defaulting unmatched right-hand values to NULL.",
  },
  {
    id: 2,
    question:
      "How do RESTful APIs handle idempotency, and which HTTP methods are inherently idempotent?",
    topic: "API Design",
    sampleAnswer:
      "Idempotency guarantees that executing a request multiple times leaves the system state identical to executing it once. GET, PUT, and DELETE are idempotent, while POST creates new resources each time.",
  },
  {
    id: 3,
    question:
      "Explain how Python handles memory management and garbage collection internally.",
    topic: "Python Core",
    sampleAnswer:
      "Python utilizes reference counting for real-time memory deallocation and a cyclic generational garbage collector (Generations 0, 1, 2) to collect unreachable reference loops.",
  },
  {
    id: 4,
    question:
      "What is the difference between an Array and a Linked List in terms of time complexity for insertions and lookups?",
    topic: "Data Structures",
    sampleAnswer:
      "Arrays allow O(1) direct index lookups but require O(N) memory re-shifts for insertions. Linked Lists require O(N) traversal for lookups but enable O(1) node insertion once position is reached.",
  },
  {
    id: 5,
    question:
      "How would you optimize a database query that is experiencing full table scans on a table with 5 million records?",
    topic: "SQL Optimisation",
    sampleAnswer:
      "I would examine the EXPLAIN query execution plan, add B-Tree or composite indexes on WHERE/JOIN predicates, avoid leading wildcards in LIKE queries, and implement Redis query result caching.",
  },
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
  
  // Live AI Modal State
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [overallScorecard, setOverallScorecard] = useState(null);

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

      if (currentIdx < questionsList.length - 1) {
        setCurrentIdx((i) => i + 1);
        setAnswer("");
      } else {
        // Finished all questions!
        generateScorecard();
      }
    }, 600);
  };

  const handleOpenLiveModal = () => {
    setIsLiveModalOpen(true);
    setIsAiSpeaking(true);
    setTimeout(() => setIsAiSpeaking(false), 2500);
  };

  const handleAutoFillSample = () => {
    setAnswer(currentQ.sampleAnswer);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setAnswer(currentQ.sampleAnswer);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const generateScorecard = () => {
    const finalReport = {
      score: 86,
      technical: 88,
      problemSolving: 84,
      communication: 86,
      feedback:
        "Outstanding technical explanation of database indexing and REST principles. High problem-solving structure demonstrated with optimal time complexity awareness.",
      strengths: [
        "Clear distinction of INNER vs LEFT joins",
        "Accurate HTTP method idempotency specification",
        "Strong query optimization approach with EXPLAIN plans",
      ],
    };
    setOverallScorecard(finalReport);
    setIsInterviewFinished(true);
  };

  const resetInterview = () => {
    setCurrentIdx(0);
    setAnswer("");
    setSubmittedAnswers({});
    setIsInterviewFinished(false);
    setOverallScorecard(null);
    setIsLiveModalOpen(false);
  };

  return (
    <div className="ai-interview-page stack-6">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <Bot size={22} style={{ color: "#4f46e5" }} />
          <span>AI Mock Interview Arena</span>
        </h2>
        <p className="student-header-desc">Practice real-time technical interview questions with instant AI feedback and voice evaluation.</p>
      </div>

      <div className="ai-interview-split-grid">
        {/* Practice Arena */}
        <div className="interview-practice-card">
          <div className="interview-card-header">
            <Bot size={20} className="text-blue-600" />
            <span>Technical interview practice</span>
          </div>

          <div className="interview-question-tracker">
            Question {currentIdx + 1} of {questionsList.length} • {currentQ.topic}
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
            placeholder="Type your structured answer here or click the AI Robot to launch live voice mode..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <div className="interview-action-row">
            <button
              type="button"
              className="ai-autofill-btn"
              onClick={handleAutoFillSample}
              title="Auto-fill sample response"
            >
              <Zap size={14} /> Auto-fill Sample Answer
            </button>

            <button
              className="interview-next-btn"
              onClick={handleNext}
              disabled={isEvaluating || !answer.trim()}
            >
              {isEvaluating ? (
                "Evaluating..."
              ) : currentIdx === questionsList.length - 1 ? (
                <>Submit & Finish <ChevronRight size={16} /></>
              ) : (
                <>Next question <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>

        {/* AI Bot Visual Card (Clickable Robot Trigger) */}
        <div
          className="ai-bot-visual-card"
          onClick={handleOpenLiveModal}
          title="Click to launch interactive Live AI Interview phase"
        >
          <div className="ai-bot-graphic">
            <div className="ai-bot-circle">
              <Bot size={54} className="ai-bot-icon" />
            </div>
            <div className="ai-bot-pulse"></div>
          </div>
          <h3 className="ai-bot-title">AI Interviewer Active</h3>
          <p className="ai-bot-desc">
            Click here to launch the interactive live voice & simulation phase. Analyzes accuracy, problem solving & clarity.
          </p>
          <div className="ai-bot-launch-badge">
            <Play size={16} fill="currentColor" /> Start Live AI Interview
          </div>
        </div>
      </div>

      {/* Past Interviews History */}
      <div className="past-interviews-card">
        <h3 className="past-interviews-header">Past interviews</h3>
        <p className="past-interviews-subtitle">
          AI evaluation history & diagnostic notes
        </p>

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

      {/* LIVE AI INTERVIEW MODAL / ARENA */}
      {isLiveModalOpen && (
        <div className="ai-modal-overlay">
          <div className="ai-modal-container">
            <div className="ai-modal-header">
              <div className="ai-modal-title-wrap">
                <div className="ai-modal-icon-badge">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="ai-modal-heading">
                    Live AI Technical Interview Simulation
                  </h3>
                  <span className="ai-modal-subheading">
                    Interactive Voice & Coding Drill Phase
                  </span>
                </div>
              </div>
              <button
                className="ai-modal-close-btn"
                onClick={() => setIsLiveModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ai-modal-body">
              {!isInterviewFinished ? (
                <>
                  {/* AI Interviewer Audio Visualizer */}
                  <div className="ai-speak-bubble">
                    <Volume2 size={22} className="ai-speak-icon" />
                    <div className="ai-speak-content">
                      <div className="ai-speak-label">
                        {isAiSpeaking ? "AI INTERVIEWER SPEAKING..." : "AI INTERVIEWER PROMPT"}
                      </div>
                      <div>{currentQ.question}</div>
                    </div>
                    {isAiSpeaking && (
                      <div className="ai-voice-waves">
                        <span className="ai-wave-bar"></span>
                        <span className="ai-wave-bar"></span>
                        <span className="ai-wave-bar"></span>
                        <span className="ai-wave-bar"></span>
                        <span className="ai-wave-bar"></span>
                      </div>
                    )}
                  </div>

                  {/* Question & Answer Inputs */}
                  <div className="ai-qa-box">
                    <div className="ai-qa-header">
                      <span>Your Response (Question {currentIdx + 1} of {questionsList.length})</span>
                      <span className="ai-qa-topic">{currentQ.topic}</span>
                    </div>

                    <textarea
                      className="interview-textarea interview-textarea-min"
                      placeholder="Speak using the mic button below or type your answer..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />

                    <div className="ai-modal-controls">
                      <div className="ai-controls-btn-group">
                        <button
                          type="button"
                          className={`ai-mic-btn ${isRecording ? "recording" : ""}`}
                          onClick={toggleRecording}
                        >
                          {isRecording ? <Mic size={16} /> : <MicOff size={16} />}
                          {isRecording ? "Listening (3s)..." : "Simulate Speech Input"}
                        </button>
                        <button
                          type="button"
                          className="ai-autofill-btn"
                          onClick={handleAutoFillSample}
                        >
                          <Zap size={14} /> Auto-fill Sample Answer
                        </button>
                      </div>

                      <button
                        className="interview-next-btn"
                        onClick={handleNext}
                        disabled={isEvaluating || !answer.trim()}
                      >
                        {isEvaluating ? (
                          "Evaluating..."
                        ) : currentIdx === questionsList.length - 1 ? (
                          <>Submit & View Scorecard <Award size={16} /></>
                        ) : (
                          <>Next Question <ChevronRight size={16} /></>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* FINAL DIAGNOSTIC SCORECARD REPORT */
                <div className="ai-scorecard-column">
                  <div className="ai-scorecard-hero">
                    <Award size={48} className="ai-award-icon" />
                    <h2 className="ai-scorecard-title">
                      Live AI Interview Completed!
                    </h2>
                    <p className="ai-scorecard-subtitle">
                      Overall Technical Evaluation & Readiness Score
                    </p>
                    <div className="ai-score-big">{overallScorecard?.score}%</div>

                    <div className="ai-score-breakdown-grid">
                      <div className="ai-score-mini-card">
                        <div className="ai-mini-score-val-green">
                          {overallScorecard?.technical}%
                        </div>
                        <div className="ai-mini-score-label">Technical Depth</div>
                      </div>
                      <div className="ai-score-mini-card">
                        <div className="ai-mini-score-val-blue">
                          {overallScorecard?.problemSolving}%
                        </div>
                        <div className="ai-mini-score-label">Problem Solving</div>
                      </div>
                      <div className="ai-score-mini-card">
                        <div className="ai-mini-score-val-purple">
                          {overallScorecard?.communication}%
                        </div>
                        <div className="ai-mini-score-label">Communication</div>
                      </div>
                    </div>
                  </div>

                  <div className="ai-diagnostic-box">
                    <h4 className="ai-diagnostic-title">
                      <TrendingUp size={16} className="text-blue-600" /> AI Diagnostic Feedback
                    </h4>
                    <p className="ai-diagnostic-text">
                      {overallScorecard?.feedback}
                    </p>
                  </div>

                  <div className="ai-action-row">
                    <button
                      type="button"
                      className="ai-autofill-btn ai-retake-btn"
                      onClick={resetInterview}
                    >
                      <RotateCcw size={16} /> Retake AI Interview
                    </button>
                    <button
                      type="button"
                      className="interview-next-btn"
                      onClick={() => setIsLiveModalOpen(false)}
                    >
                      <CheckCircle2 size={16} /> Close & Save Results
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
