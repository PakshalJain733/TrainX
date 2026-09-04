import React, { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Clock,
  CalendarDays,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  Timer,
  Trophy,
  Target,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Send,
  RotateCcw,
  X,
  CheckCheck,
  Circle,
  Flag,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import "../Styles/AcademicQuiz.css";

/* ─── Admin-provided questions (mock) ─────────────────────────── */
const quizQuestions = {
  1: [
    {
      id: 1,
      question: "What is the time complexity of accessing an element in an array by index?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      correct: 2,
      explanation: "Array element access by index is O(1) because the memory address is computed directly as base_address + index × element_size.",
    },
    {
      id: 2,
      question: "Which data structure follows the LIFO (Last In, First Out) principle?",
      options: ["Queue", "Stack", "Linked List", "Binary Tree"],
      correct: 1,
      explanation: "A Stack follows LIFO. The last element pushed is the first one to be popped.",
    },
    {
      id: 3,
      question: "In a singly linked list, what does the 'next' pointer of the last node point to?",
      options: ["The first node", "Itself", "NULL", "Previous node"],
      correct: 2,
      explanation: "The last node's 'next' pointer points to NULL to indicate the end of the list.",
    },
    {
      id: 4,
      question: "What is the height of a complete binary tree with n nodes?",
      options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
      correct: 2,
      explanation: "A complete binary tree with n nodes has a height of floor(log₂(n)), which is O(log n).",
    },
    {
      id: 5,
      question: "Which traversal of a Binary Search Tree gives elements in sorted order?",
      options: ["Pre-order", "Post-order", "In-order", "Level-order"],
      correct: 2,
      explanation: "In-order traversal (Left → Root → Right) of a BST produces elements in ascending sorted order.",
    },
  ],
  2: [
    {
      id: 1,
      question: "What is a process in an operating system?",
      options: [
        "A program stored on disk",
        "A program in execution with its own memory space",
        "A set of CPU instructions",
        "A file in the filesystem",
      ],
      correct: 1,
      explanation: "A process is a program in execution. It includes the program code, current activity, and its own memory space.",
    },
    {
      id: 2,
      question: "Which scheduling algorithm can cause starvation?",
      options: ["Round Robin", "FCFS", "Priority Scheduling", "SJF (non-preemptive)"],
      correct: 2,
      explanation: "Priority Scheduling can cause starvation as low-priority processes may never get CPU time if high-priority processes keep arriving.",
    },
    {
      id: 3,
      question: "What is a thread?",
      options: [
        "A heavy-weight process",
        "A lightweight unit of execution within a process",
        "An I/O operation",
        "A memory block",
      ],
      correct: 1,
      explanation: "A thread is the smallest unit of CPU execution within a process. Multiple threads within a process share the same memory space.",
    },
  ],
  3: [
    {
      id: 1,
      question: "Which normal form eliminates partial dependencies?",
      options: ["1NF", "2NF", "3NF", "BCNF"],
      correct: 1,
      explanation: "Second Normal Form (2NF) eliminates partial dependencies — every non-key attribute must be fully dependent on the primary key.",
    },
    {
      id: 2,
      question: "A relation is in 1NF if:",
      options: [
        "It has no repeating groups and all attributes are atomic",
        "It has no transitive dependencies",
        "Every determinant is a candidate key",
        "It has no partial dependencies",
      ],
      correct: 0,
      explanation: "1NF requires that all column values are atomic (indivisible) and there are no repeating groups or arrays.",
    },
    {
      id: 3,
      question: "What does BCNF stand for?",
      options: [
        "Binary Canonical Normal Form",
        "Boyce-Codd Normal Form",
        "Basic Canonical Normal Form",
        "Boolean Codd Normal Form",
      ],
      correct: 1,
      explanation: "BCNF stands for Boyce-Codd Normal Form, named after Raymond Boyce and Edgar Codd. It is a stronger version of 3NF.",
    },
  ],
};

/* ─── Mock completed answers (for review mode) ────────────────── */
const completedAnswers = {
  2: [1, 2, 1],          // answers for quiz 2
  3: [0, 0, 1],          // answers for quiz 3
};

const quizzes = [
  {
    id: 1,
    title: "Mid-Term Evaluation: Data Structures",
    subject: "Computer Science",
    topic: "Arrays, Linked Lists, Trees",
    date: "August 28, 2026",
    duration: "5 mins",
    durationSecs: 5 * 60,
    marks: "50 Marks",
    status: "Upcoming",
    difficulty: "Medium",
    questions: 5,
  },
  {
    id: 2,
    title: "Operating Systems Core Concepts",
    subject: "Computer Science",
    topic: "Processes, Threads, Scheduling",
    date: "August 25, 2026",
    duration: "30 mins",
    durationSecs: 30 * 60,
    marks: "30 Marks",
    status: "Completed",
    score: "26/30",
    difficulty: "Hard",
    questions: 3,
  },
  {
    id: 3,
    title: "Database Normalization Quiz",
    subject: "Database Management",
    topic: "1NF, 2NF, 3NF, BCNF",
    date: "August 20, 2026",
    duration: "20 mins",
    durationSecs: 20 * 60,
    marks: "20 Marks",
    status: "Completed",
    score: "18/20",
    difficulty: "Medium",
    questions: 3,
  },
];

/* ─── Timer hook ───────────────────────────────────────────────── */
function useTimer(initialSecs, onExpire) {
  const [secs, setSecs] = useState(initialSecs);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(ref.current);
          onExpire && onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { display: fmt(secs), secs };
}

/* ─── Quiz Platform (Google-Forms style) ──────────────────────── */
function QuizPlatform({ quiz, mode, onExit }) {
  const questions = quizQuestions[quiz.id] || [];
  const isReview = mode === "review";
  const savedAnswers = isReview ? completedAnswers[quiz.id] || [] : [];

  const [answers, setAnswers] = useState(isReview ? savedAnswers : Array(questions.length).fill(null));
  const [reviewMarks, setReviewMarks] = useState(Array(questions.length).fill(false));
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(isReview);

  const { display: timeDisplay, secs: timeLeft } = useTimer(
    isReview ? 0 : quiz.durationSecs,
    () => !isReview && handleSubmit()
  );

  function handleSelect(optIdx) {
    if (submitted) return;
    setAnswers((a) => {
      const copy = [...a];
      copy[current] = optIdx;
      return copy;
    });
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  const answered = answers.filter((a) => a !== null).length;
  const q = questions[current];
  const userAnswer = answers[current];

  const score = submitted
    ? questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
    : 0;

  // Determine status for review sidebar
  function qStatus(idx) {
    if (!submitted) {
      if (reviewMarks[idx]) return "review";
      return answers[idx] !== null ? "completed" : "unattempted";
    }
    return answers[idx] === questions[idx].correct ? "correct" : "wrong";
  }

  return (
    <div className="qp-overlay">
      {/* Header */}
      <div className="qp-header">
        <div className="qp-header-left">
          <button className="qp-back-btn" onClick={onExit}>
            <ChevronLeft size={18} /> Back
          </button>
          <div className="qp-header-title-block">
            <span className="qp-header-quiz-name">{quiz.title}</span>
            <span className="qp-header-meta">{quiz.subject} · {quiz.topic}</span>
          </div>
        </div>

        <div className="qp-header-right">
          {!isReview && !submitted && (
            <div className={`qp-timer ${timeLeft <= 120 ? "qp-timer--urgent" : ""}`}>
              <Timer size={15} />
              {timeDisplay}
            </div>
          )}
          {submitted && !isReview && (
            <div className="qp-score-pill">
              <Trophy size={15} /> Score: {score}/{questions.length}
            </div>
          )}
          {isReview && (
            <div className="qp-review-pill">
              <CheckCheck size={15} /> Review Mode
            </div>
          )}
        </div>
      </div>

      <div className="qp-body">
        {/* Left panel: question nav */}
        <aside className="qp-sidebar">
          <div className="qp-sidebar-title">Questions</div>
          <div className="qp-nav-grid">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`qp-nav-btn qp-nav-${qStatus(i)} ${current === i ? "qp-nav-current" : ""}`}
                onClick={() => setCurrent(i)}
                title={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="qp-legend">
            {submitted ? (
              <>
                <div className="qp-legend-item"><span className="qp-leg-dot qp-leg-correct" /> Correct</div>
                <div className="qp-legend-item"><span className="qp-leg-dot qp-leg-wrong" /> Wrong</div>
              </>
            ) : (
              <div className="qp-legend-buttons">
                <div className="qp-leg-btn qp-leg-btn-review">Review</div>
                <div className="qp-leg-btn qp-leg-btn-completed">Completed</div>
                <div className="qp-leg-btn qp-leg-btn-unattempted">Not attempted</div>
              </div>
            )}
          </div>

          {!submitted && (
            <div className="qp-sidebar-progress">
              <span>{answered}/{questions.length} answered</span>
              <div className="qp-sidebar-bar">
                <div className="qp-sidebar-bar-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Submit button removed from here, moved to nav row */}
        </aside>

        {/* Main: question card */}
        <main className="qp-main">
          {/* Result banner after submit */}
          {submitted && !isReview && (
            <div className={`qp-result-banner ${score / questions.length >= 0.6 ? "pass" : "fail"}`}>
              <Trophy size={20} />
              <div>
                <strong>Quiz Submitted!</strong> You scored <strong>{score}/{questions.length}</strong> ({Math.round((score / questions.length) * 100)}%)
              </div>
            </div>
          )}
          {isReview && (
            <div className="qp-result-banner pass">
              <CheckCheck size={20} />
              <div>
                <strong>Reviewing your answers</strong> — Correct answers and explanations are highlighted below.
              </div>
            </div>
          )}

          {/* Question card (Google Forms style) */}
          <div className="qp-form-card">
            {/* Card top accent bar */}
            <div className="qp-form-card-accent" />

            <div className="qp-form-card-body">
              <div className="qp-question-meta">
                <div>
                  <span className="qp-question-num">Question {current + 1} of {questions.length}</span>
                  <span className="qp-question-pts">2 pts</span>
                </div>
                {!submitted && !isReview && (
                  <button 
                    className={`qp-mark-review-btn ${reviewMarks[current] ? 'active' : ''}`}
                    onClick={() => {
                      const newMarks = [...reviewMarks];
                      newMarks[current] = !newMarks[current];
                      setReviewMarks(newMarks);
                    }}
                  >
                    <Flag size={14} /> {reviewMarks[current] ? 'Marked for Review' : 'Mark for Review'}
                  </button>
                )}
              </div>

              <p className="qp-question-text">{q.question}</p>

              <div className="qp-options-list">
                {q.options.map((opt, i) => {
                  let cls = "qp-option";
                  if (submitted || isReview) {
                    if (i === q.correct) cls += " qp-option--correct";
                    else if (i === userAnswer && userAnswer !== q.correct) cls += " qp-option--wrong";
                    else cls += " qp-option--disabled";
                  } else {
                    if (userAnswer === i) cls += " qp-option--selected";
                  }

                  return (
                    <label key={i} className={cls} onClick={() => handleSelect(i)}>
                      <span className="qp-option-radio">
                        {(submitted || isReview) ? (
                          i === q.correct ? (
                            <CheckCircle2 size={18} className="qp-radio-correct" />
                          ) : i === userAnswer && userAnswer !== q.correct ? (
                            <X size={18} className="qp-radio-wrong" />
                          ) : (
                            <Circle size={18} className="qp-radio-neutral" />
                          )
                        ) : (
                          <span className={`qp-radio-circle ${userAnswer === i ? "qp-radio-circle--on" : ""}`} />
                        )}
                      </span>
                      <span className="qp-option-text">{opt}</span>
                    </label>
                  );
                })}
              </div>

              {/* Explanation (shown after submit/review) */}
              {(submitted || isReview) && (
                <div className="qp-explanation">
                  <span className="qp-explanation-label">Explanation</span>
                  <p className="qp-explanation-text">{q.explanation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="qp-nav-row">
            <button
              className="qp-nav-arrow"
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
            >
              <ArrowLeft size={16} /> Previous
            </button>
            {current === questions.length - 1 && !submitted ? (
              <button
                className="qp-nav-arrow qp-nav-arrow--submit"
                onClick={handleSubmit}
              >
                <Send size={16} /> Submit Quiz
              </button>
            ) : (
              <button
                className="qp-nav-arrow qp-nav-arrow--next"
                disabled={current === questions.length - 1}
                onClick={() => setCurrent((c) => c + 1)}
              >
                Next <ArrowRight size={16} />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Main AcademicQuiz page ───────────────────────────────────── */
export default function AcademicQuiz() {
  const [activeTab, setActiveTab] = useState("All");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizMode, setQuizMode] = useState(null); // "take" | "review"

  const upcomingQuizzes = quizzes.filter((q) => q.status === "Upcoming");
  const completedQuizzes = quizzes.filter((q) => q.status === "Completed");
  const displayedQuizzes =
    activeTab === "All" ? quizzes : activeTab === "Upcoming" ? upcomingQuizzes : completedQuizzes;

  if (activeQuiz) {
    return (
      <QuizPlatform
        quiz={activeQuiz}
        mode={quizMode}
        onExit={() => { setActiveQuiz(null); setQuizMode(null); }}
      />
    );
  }

  return (
    <div className="academic-quiz-page stack-6">
      <div className="quiz-filters">
        <button className={`quiz-filter-btn ${activeTab === "All" ? "active" : ""}`} onClick={() => setActiveTab("All")}>
          All Quizzes
        </button>
        <button className={`quiz-filter-btn ${activeTab === "Upcoming" ? "active" : ""}`} onClick={() => setActiveTab("Upcoming")}>
          Upcoming <span className="quiz-filter-badge">{upcomingQuizzes.length}</span>
        </button>
        <button className={`quiz-filter-btn ${activeTab === "Completed" ? "active" : ""}`} onClick={() => setActiveTab("Completed")}>
          Completed <span className="quiz-filter-badge">{completedQuizzes.length}</span>
        </button>
      </div>

      <div className="quiz-grid">
        {displayedQuizzes.map((quiz) => (
          <Card key={quiz.id} className={`quiz-card ${quiz.status === "Upcoming" ? "quiz-card-highlight" : ""}`}>
            <CardContent className="quiz-card-content">
              <div className="quiz-card-header">
                <Badge variant={quiz.status === "Upcoming" ? "primary" : "success"}>{quiz.status}</Badge>
                {quiz.status === "Completed" && (
                  <div className="quiz-score-badge">
                    <Trophy size={14} className="text-yellow-500" />
                    <span>{quiz.score}</span>
                  </div>
                )}
              </div>

              <div className="quiz-main-info">
                <h3 className="quiz-title">{quiz.title}</h3>
                <p className="quiz-subject">{quiz.subject} • {quiz.topic}</p>
              </div>

              <div className="quiz-meta-grid">
                <div className="quiz-meta-item"><CalendarDays size={14} className="quiz-meta-icon" /><span>{quiz.date}</span></div>
                <div className="quiz-meta-item"><Timer size={14} className="quiz-meta-icon" /><span>{quiz.duration}</span></div>
                <div className="quiz-meta-item"><Target size={14} className="quiz-meta-icon" /><span>{quiz.marks}</span></div>
                <div className="quiz-meta-item"><AlertCircle size={14} className="quiz-meta-icon" /><span>{quiz.questions} Qs</span></div>
              </div>

              <div className="quiz-card-footer">
                {quiz.status === "Upcoming" ? (
                  <Button
                    className="w-full quiz-start-btn"
                    onClick={() => { setActiveQuiz(quiz); setQuizMode("take"); }}
                  >
                    <PlayCircle size={16} /> Start Quiz
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full quiz-review-btn"
                    onClick={() => { setActiveQuiz(quiz); setQuizMode("review"); }}
                  >
                    <CheckCircle2 size={16} /> Review Answers
``                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
