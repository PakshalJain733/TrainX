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
import { SectionHeader } from "../../../components/ui/SectionHeader";
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


/* ─── Fetch quizzes from Database ─────────────────────────────── */
const API_BASE = "http://localhost:5000/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchApiQuizzes() {
  try {
    const [availRes, attemptsRes] = await Promise.all([
      fetch(`${API_BASE}/assessments/available`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/assessments/my-attempts`, { headers: getAuthHeaders() }).catch(() => ({ json: () => ({ success: false }) }))
    ]);

    const availData = await availRes.json();
    const attemptsData = await attemptsRes.json ? await attemptsRes.json() : { success: false };

    const list = availData.success && Array.isArray(availData.data) ? availData.data : [];
    const userAttempts = attemptsData.success && Array.isArray(attemptsData.data) ? attemptsData.data : [];

    // Create a map of completed attempt results by assessment_id
    const attemptMap = {};
    userAttempts.forEach(att => {
      const qId = String(att.assessment_id);
      const isFinished = att.status === 'completed' || att.status === 'finished' || att.status === 'passed' || att.status === 'failed' || (att.submitted_at !== null && att.submitted_at !== undefined);
      if (isFinished) {
        // Keep the attempt with the highest score / finished status
        if (!attemptMap[qId] || attemptMap[qId].status === 'in_progress') {
          attemptMap[qId] = att;
        }
      }
    });

    // Map assessment DB shape -> student quiz shape
    return list.map((q) => {
      const pastAttempt = attemptMap[String(q.id)];
      const isCompleted = Boolean(pastAttempt);
      const totalQs = q.total_questions || (q.questions ? q.questions.length : 5);
      const correctCount = pastAttempt ? (pastAttempt.correct_count !== undefined && pastAttempt.correct_count !== null ? pastAttempt.correct_count : Math.round((pastAttempt.marks_obtained || 0) / 10)) : 0;
      const scoreStr = isCompleted ? `Score: ${correctCount}/${totalQs}` : null;

      return {
        id: q.id,
        title: q.title,
        subject: q.category === "AI Generated" ? "AI Generated" : q.category || "Custom Quiz",
        topic: q.batch_name || "General",
        date: q.created_at ? new Date(q.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "Today",
        duration: `${q.duration_minutes || 30} mins`,
        durationSecs: (q.duration_minutes || 30) * 60,
        marks: `${q.total_marks || (q.total_questions || 0) * 10} Marks`,
        status: isCompleted ? "Completed" : "Upcoming",
        score: scoreStr,
        difficulty: "Medium",
        questions: q.total_questions || q.question_count || (q.questions ? q.questions.length : 0),
        questionsList: (q.questions || []).map((item) => ({
          id: item.id,
          text: item.question_text || item.text || "Question",
          options: item.options ? item.options : {
            a: item.option_a || "",
            b: item.option_b || "",
            c: item.option_c || "N/A",
            d: item.option_d || "N/A"
          },
          correct: (item.correct_option || item.correct || "a").toString().toLowerCase().trim()
        })),
        source: "admin"
      };
    });
  } catch (err) {
    console.error("Failed to load API quizzes:", err);
    return [];
  }
}


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
function normalizeAdminQuestion(q, idx) {
  // Admin questions: { id, text, options: {a,b,c,d}, correct: 'a' }
  // -> standard: { id, question, options: [], correct: index, explanation }
  const optKeys = ['a', 'b', 'c', 'd'];
  const optionsArr = optKeys.map(k => q.options[k] || '').filter(v => v && v !== 'N/A');
  const correctIdx = optKeys.indexOf(q.correct);
  return {
    id: q.id || idx + 1,
    question: q.text || `Question ${idx + 1}`,
    options: optionsArr,
    correct: correctIdx >= 0 ? correctIdx : 0,
    explanation: `The correct answer is Option ${(q.correct || 'A').toUpperCase()}.`
  };
}

function QuizPlatform({ quiz, mode, onExit }) {
  // For admin quizzes use quiz.questionsList; for built-in use quizQuestions lookup
  const rawQuestions = quiz.source === "admin" && quiz.questionsList?.length
    ? quiz.questionsList.map(normalizeAdminQuestion)
    : (quizQuestions[quiz.id] || []);
  const questions = rawQuestions;
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

  const [attemptId, setAttemptId] = useState(null);

  // Initialize or start assessment attempt with API
  useEffect(() => {
    if (quiz.source === "admin" && !isReview && quiz.id) {
      fetch(`${API_BASE}/assessments/${quiz.id}/start`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("[Quiz Start Response]", data);
          // Success path: attempt just created
          if (data.success && data.data?.attempt?.id) {
            setAttemptId(data.data.attempt.id);
          } else if (data.data?.attemptId) {
            setAttemptId(data.data.attemptId);
          } else if (data.data?.attempt_id) {
            setAttemptId(data.data.attempt_id);
          }
          // 409 = already attempted — grab the attemptId from error detail
          else if (!data.success && data.details) {
            const hint = Array.isArray(data.details) ? data.details[0]?.hint : data.details;
            if (hint) {
              const match = String(hint).match(/(\d+)/);
              if (match) setAttemptId(parseInt(match[1], 10));
            }
          }
        })
        .catch((err) => console.error("Failed to start attempt:", err));
    }
  }, [quiz.id, quiz.source, isReview]);

  function handleSelect(optIdx) {
    if (submitted) return;
    setAnswers((a) => {
      const copy = [...a];
      copy[current] = optIdx;
      return copy;
    });
  }

  const [wasSubmitted, setWasSubmitted] = useState(false);

  async function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    setWasSubmitted(true); // Always mark as submitted locally

    try {
      const stored = JSON.parse(localStorage.getItem('student_completed_quizzes') || '[]');
      if (!stored.includes(String(quiz.id))) {
        stored.push(String(quiz.id));
        stored.push(String(quiz.title || '').toLowerCase());
        localStorage.setItem('student_completed_quizzes', JSON.stringify(stored));
      }
      window.dispatchEvent(new Event('quizCompletedUpdated'));
    } catch (e) {}

    if (quiz.source !== "admin") return; // builtin quizzes don't need backend

    const optKeys = ["a", "b", "c", "d"];
    const formattedAnswers = questions.map((q, idx) => {
      const selectedIndex = answers[idx];
      const selectedOptKey =
        selectedIndex !== null && selectedIndex !== undefined ? optKeys[selectedIndex] : null;
      return {
        question_id: q.id || idx + 1,
        selected_option: selectedOptKey ? selectedOptKey.toUpperCase() : "A",
      };
    });

    try {
      if (attemptId) {
        // Primary path: use the attempt ID from /start
        const res = await fetch(
          `${API_BASE}/assessments/attempts/${attemptId}/submit`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ answers: formattedAnswers }),
          }
        );
        const data = await res.json();
        console.log("[Quiz Submit Response]", data);
        if (!data.success) {
          console.warn("[Quiz Submit] Backend error:", data.message);
        }
      } else {
        // Fallback path: use legacy /:id/submit if no attemptId
        console.warn("[Quiz Submit] No attemptId — using legacy submit endpoint");
        const res = await fetch(
          `${API_BASE}/assessments/${quiz.id}/submit`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ answers: formattedAnswers }),
          }
        );
        const data = await res.json();
        console.log("[Quiz Submit Fallback Response]", data);
      }
    } catch (err) {
      console.error("[Quiz Submit] Network error:", err);
    }
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
          <button className="qp-back-btn" onClick={() => onExit(wasSubmitted)}>
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
            {submitted ? (
              <button
                className="qp-nav-arrow qp-nav-arrow--submit"
                onClick={() => onExit(true)}
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                <CheckCircle2 size={16} /> Finish & Return to Dashboard
              </button>
            ) : current === questions.length - 1 ? (
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

const practiceQuizzes = [
  {
    id: "p1",
    title: "Data Structures: Arrays & Linked Lists Drill",
    subject: "Core Computer Science",
    topic: "Arrays, Pointers, Linked Lists",
    date: "Available Now",
    duration: "15 mins",
    durationSecs: 15 * 60,
    marks: "30 Marks",
    status: "Upcoming",
    difficulty: "Medium",
    questions: 3,
    questionsList: [
      {
        id: 101,
        text: "What is the time complexity of accessing an element in an array by index?",
        options: { a: "O(n)", b: "O(log n)", c: "O(1)", d: "O(n²)" },
        correct: "c"
      },
      {
        id: 102,
        text: "Which data structure follows the LIFO (Last In, First Out) principle?",
        options: { a: "Queue", b: "Stack", c: "Linked List", d: "Binary Tree" },
        correct: "b"
      },
      {
        id: 103,
        text: "What is the primary advantage of a Doubly Linked List over a Singly Linked List?",
        options: { a: "Requires less memory", b: "Faster element lookup", c: "Bidirectional traversal", d: "Constant time sorting" },
        correct: "c"
      }
    ],
    source: "practice"
  },
  {
    id: "p2",
    title: "Web Development: React & ES6 Essentials",
    subject: "Full Stack Development",
    topic: "Hooks, Virtual DOM, Promises",
    date: "Available Now",
    duration: "20 mins",
    durationSecs: 20 * 60,
    marks: "40 Marks",
    status: "Upcoming",
    difficulty: "Medium",
    questions: 3,
    questionsList: [
      {
        id: 201,
        text: "Which React Hook is primarily used for managing side effects in functional components?",
        options: { a: "useState", b: "useContext", c: "useEffect", d: "useReducer" },
        correct: "c"
      },
      {
        id: 202,
        text: "What concept does React use to minimize direct DOM manipulations for optimal rendering performance?",
        options: { a: "Real DOM", b: "Virtual DOM", c: "Shadow DOM", d: "HTML Template DOM" },
        correct: "b"
      },
      {
        id: 203,
        text: "Which ES6 keyword declares a block-scoped variable that cannot be reassigned?",
        options: { a: "var", b: "let", c: "const", d: "static" },
        correct: "c"
      }
    ],
    source: "practice"
  },
  {
    id: "p3",
    title: "SQL Databases & Indexing Practice",
    subject: "Database Management",
    topic: "SELECT, JOINs, B-Trees, Normalization",
    date: "Available Now",
    duration: "10 mins",
    durationSecs: 10 * 60,
    marks: "20 Marks",
    status: "Upcoming",
    difficulty: "Easy",
    questions: 3,
    questionsList: [
      {
        id: 301,
        text: "Which SQL clause is used to filter records resulting from a GROUP BY statement?",
        options: { a: "WHERE", b: "HAVING", c: "ORDER BY", d: "LIKE" },
        correct: "b"
      },
      {
        id: 302,
        text: "What type of JOIN returns all records when there is a match in either left or right table?",
        options: { a: "INNER JOIN", b: "LEFT JOIN", c: "FULL OUTER JOIN", d: "RIGHT JOIN" },
        correct: "c"
      },
      {
        id: 303,
        text: "Which normal form requires eliminating partial dependency of non-key attributes on candidate keys?",
        options: { a: "1NF", b: "2NF", c: "3NF", d: "BCNF" },
        correct: "b"
      }
    ],
    source: "practice"
  }
];

/* ─── Main AcademicQuiz page ───────────────────────────────────── */
export default function AcademicQuiz() {
  const [activeTab, setActiveTab] = useState("All");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizMode, setQuizMode] = useState(null); // "take" | "review"
  const [allQuizzes, setAllQuizzes] = useState([]);

  // Fetch admin-created DB quizzes when page mounts
  const refreshQuizzes = () => {
    fetchApiQuizzes().then((apiQuizzes) => {
      const completedQuizIds = new Set(
        JSON.parse(localStorage.getItem("student_completed_quizzes") || "[]").map(String)
      );

      let merged = [...apiQuizzes];
      if (merged.length === 0) {
        // Fallback to practice quizzes catalog
        merged = practiceQuizzes.map((pq) => {
          const isDone = completedQuizIds.has(String(pq.id));
          return {
            ...pq,
            status: isDone ? "Completed" : "Upcoming",
            score: isDone ? "Score: 3/3" : null,
          };
        });
      } else {
        // Check practice quizzes not covered by API
        const apiIds = new Set(apiQuizzes.map((q) => String(q.id)));
        const extraPractice = practiceQuizzes
          .filter((pq) => !apiIds.has(String(pq.id)))
          .map((pq) => {
            const isDone = completedQuizIds.has(String(pq.id));
            return {
              ...pq,
              status: isDone ? "Completed" : "Upcoming",
              score: isDone ? "Score: 3/3" : null,
            };
          });
        merged = [...merged, ...extraPractice];
      }

      setAllQuizzes(merged);
    });
  };

  useEffect(() => {
    refreshQuizzes();
  }, []);



  const upcomingQuizzes = allQuizzes.filter((q) => q.status === "Upcoming");
  const completedQuizzes = allQuizzes.filter((q) => q.status === "Completed");
  const displayedQuizzes =
    activeTab === "All" ? allQuizzes : activeTab === "Upcoming" ? upcomingQuizzes : completedQuizzes;

  if (activeQuiz) {
    return (
      <QuizPlatform
        quiz={activeQuiz}
        mode={quizMode}
        onExit={(wasSubmitted) => {
          if (wasSubmitted) {
            // Immediately update local state so the card shows "Completed" instantly
            setAllQuizzes((prev) =>
              prev.map((q) =>
                q.id === activeQuiz.id
                  ? { ...q, status: "Completed", score: q.score || "Completed" }
                  : q
              )
            );
            // Delay refresh to give backend time to commit transaction
            setTimeout(() => refreshQuizzes(), 1000);
          } else {
             refreshQuizzes();
          }
          setActiveQuiz(null);
          setQuizMode(null);
        }}
      />
    );
  }

  return (
    <div className="academic-quiz-page stack-6">
      <SectionHeader
        eyebrow="ACADEMIC EVALUATION"
        title="Academic & Practice Quizzes"
        description="Attempt your scheduled faculty assessments, evaluate core technical concepts, and review past test scores."
      />

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
                <Badge variant={quiz.status === "Completed" ? "success" : "primary"}>
                  {quiz.status}
                </Badge>
                {quiz.status === "Completed" && (
                  <div className="quiz-score-badge">
                    <Trophy size={15} style={{ color: '#854d0e', shrink: 0 }} />
                    <span>{quiz.score && quiz.score.startsWith("Score:") ? quiz.score : `Score: ${quiz.score || "Completed"}`}</span>
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
