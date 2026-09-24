import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
import "../Styles/ST_AcademicQuiz.css";
import { getSharedQuizzes, EVENTS } from "../../../utils/sharedStore";

/* ─── Fetch quizzes from Database via central API client ──────── */
import apiFetch from "../../../utils/api";

async function fetchApiQuizzes() {
  try {
    const [availData, attemptsData] = await Promise.all([
      apiFetch("/assessments/available"),
      apiFetch("/assessments/my-attempts"),
    ]);

    const list = availData && availData.success && Array.isArray(availData.data) ? availData.data : [];
    const userAttempts = attemptsData && attemptsData.success && Array.isArray(attemptsData.data) ? attemptsData.data : [];

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
    const dbList = list.map((q) => {
      const pastAttempt = attemptMap[String(q.id)];
      const isCompleted = Boolean(pastAttempt);
      const totalQs = pastAttempt?.total_questions || q.total_questions || (q.questions ? q.questions.length : 5);
      const correctCount = pastAttempt ? (pastAttempt.correct_count !== undefined && pastAttempt.correct_count !== null ? pastAttempt.correct_count : Math.round((pastAttempt.marks_obtained || 0) / 10)) : 0;
      const safeCorrect = Math.min(Math.max(correctCount, 0), totalQs);
      const scoreStr = isCompleted ? `Score: ${safeCorrect}/${totalQs}` : null;

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

    const shared = await getSharedQuizzes([]);
    const existingIds = new Set(dbList.map(q => String(q.id)));
    const sharedMapped = shared
      .filter(s => !existingIds.has(String(s.id)))
      .map(s => ({
        id: s.id,
        title: s.title,
        subject: s.data?.subject || s.subject || "Custom Quiz",
        topic: s.batch_name || s.data?.batch || "General",
        date: "Today",
        duration: s.data?.duration || "30 mins",
        durationSecs: 1800,
        marks: `${s.data?.totalMarks || 100} Marks`,
        status: s.status || "Upcoming",
        score: null,
        difficulty: "Medium",
        questions: s.data?.questionsCount || 10,
        questionsList: s.data?.questions || [],
        source: "shared"
      }));

    return [...sharedMapped, ...dbList];
  } catch (err) {
    console.error("Failed to load API quizzes:", err);
    const shared = await getSharedQuizzes([]);
    return shared.map(s => ({
      id: s.id,
      title: s.title,
      subject: s.data?.subject || s.subject || "Custom Quiz",
      topic: s.batch_name || s.data?.batch || "General",
      date: "Today",
      duration: s.data?.duration || "30 mins",
      durationSecs: 1800,
      marks: `${s.data?.totalMarks || 100} Marks`,
      status: "Upcoming",
      score: null,
      difficulty: "Medium",
      questions: s.data?.questionsCount || 10,
      questionsList: s.data?.questions || [],
      source: "shared"
    }));
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

const defaultQuizQuestions = [];

function QuizPlatform({ quiz, mode, onExit }) {
  const [loadedQuestions, setLoadedQuestions] = useState(null);
  const [fetchingQs, setFetchingQs] = useState(false);

  // Fetch full assessment details if questionsList is missing or incomplete
  useEffect(() => {
    if (quiz.source === "admin" && quiz.id && (!quiz.questionsList || quiz.questionsList.length === 0)) {
      setFetchingQs(true);
      fetch(`${API_BASE}/assessments/${quiz.id}`, { headers: getAuthHeaders() })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && Array.isArray(data.data.questions)) {
            const parsedList = data.data.questions.map((item) => ({
              id: item.id,
              text: item.question_text || item.text || "Question",
              options: item.options ? item.options : {
                a: item.option_a || "",
                b: item.option_b || "",
                c: item.option_c || "N/A",
                d: item.option_d || "N/A"
              },
              correct: (item.correct_option || item.correct || "a").toString().toLowerCase().trim()
            }));
            setLoadedQuestions(parsedList.map(normalizeAdminQuestion));
          }
        })
        .catch((err) => console.error("Failed to fetch full assessment questions:", err))
        .finally(() => setFetchingQs(false));
    }
  }, [quiz.id, quiz.source, quiz.questionsList]);

  // Normalize questions from admin DB, practice preset, or fallback
  const adminQs = loadedQuestions || (quiz.questionsList?.length ? quiz.questionsList.map(normalizeAdminQuestion) : null);
  const builtinQs = (quizQuestions[quiz.id] && quizQuestions[quiz.id].length) ? quizQuestions[quiz.id] : null;
  const questions = adminQs || builtinQs || defaultQuizQuestions;

  const isReview = mode === "review";
  const savedAnswers = isReview ? completedAnswers[quiz.id] || [] : [];

  const [answers, setAnswers] = useState(isReview ? savedAnswers : Array(questions.length).fill(null));
  const [reviewMarks, setReviewMarks] = useState(Array(questions.length).fill(false));

  // Sync answers and reviewMarks length whenever questions list is loaded asynchronously
  useEffect(() => {
    if (questions && questions.length > 0) {
      setAnswers(Array(questions.length).fill(null));
      setReviewMarks(Array(questions.length).fill(false));
    }
  }, [questions.length]);

  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(isReview);

  const { display: timeDisplay, secs: timeLeft } = useTimer(
    isReview ? 0 : quiz.durationSecs,
    () => !isReview && handleSubmit()
  );

  const [attemptId, setAttemptId] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  // Initialize or start assessment attempt with API
  useEffect(() => {
    if (quiz.source === "admin" && !isReview && quiz.id) {
      apiFetch(`/assessments/${quiz.id}/start`, { method: "POST" })
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
      // Record quiz completion in the database (device-independent sync)
      await fetch(`${API_BASE}/assessments/mark-completed`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ quiz_id: quiz.id, quiz_title: quiz.title }),
      }).catch(() => {});
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
        selected_option: selectedOptKey ? selectedOptKey.toUpperCase() : null,
      };
    });

    setResultLoading(true);
    try {
      let submitAttemptId = attemptId;
      let resultData = null;

      if (submitAttemptId) {
        const data = await apiFetch(
          `/assessments/attempts/${submitAttemptId}/submit`,
          {
            method: "POST",
            body: JSON.stringify({ answers: formattedAnswers }),
          }
        );
        console.log("[Quiz Submit Response]", data);
        if (data && data.success && data.data) {
          resultData = data.data;
        } else {
          console.warn("[Quiz Submit] Backend error:", data && data.message);
        }
      } else {
        console.warn("[Quiz Submit] No attemptId — using legacy submit endpoint");
        const data = await apiFetch(
          `/assessments/${quiz.id}/submit`,
          {
            method: "POST",
            body: JSON.stringify({ answers: formattedAnswers }),
          }
        );
        console.log("[Quiz Submit Fallback Response]", data);
        if (data && data.success && data.data) {
          resultData = data.data;
          submitAttemptId = data.data.attemptId;
        }
      }

      // Fetch full result with per-question breakdown
      if (submitAttemptId) {
        try {
          const resultJson = await apiFetch(
            `/assessments/attempts/${submitAttemptId}/result`
          );
          if (resultJson && resultJson.success && resultJson.data) {
            setApiResult(resultJson.data);
          } else if (resultData) {
            setApiResult(resultData);
          }
        } catch (_) {
          if (resultData) setApiResult(resultData);
        }
      } else if (resultData) {
        setApiResult(resultData);
      }
    } catch (err) {
      console.error("[Quiz Submit] Network error:", err);
    } finally {
      setResultLoading(false);
    }
  }

  const answered = answers.filter((a) => a !== null).length;
  const safeCurrent = Math.min(Math.max(0, current), questions.length - 1);
  const q = questions[safeCurrent] || questions[0] || defaultQuizQuestions[0];
  const userAnswer = answers[safeCurrent];

  const score = submitted
    ? questions.reduce((acc, qItem, i) => acc + (answers[i] === qItem.correct ? 1 : 0), 0)
    : 0;

  // Determine status for review sidebar
  function qStatus(idx) {
    if (!submitted) {
      if (reviewMarks[idx]) return "review";
      return answers[idx] !== null ? "completed" : "unattempted";
    }
    return answers[idx] === questions[idx]?.correct ? "correct" : "wrong";
  }

  return createPortal(
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
            {current < questions.length - 1 ? (
              <button
                className="qp-nav-arrow qp-nav-arrow--next"
                onClick={() => setCurrent((c) => c + 1)}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : submitted ? (
              <button
                className="qp-nav-arrow qp-nav-arrow--submit"
                onClick={() => onExit(true)}
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                <CheckCircle2 size={16} /> Finish & Return to Dashboard
              </button>
            ) : (
              <button
                className="qp-nav-arrow qp-nav-arrow--submit"
                onClick={handleSubmit}
              >
                <Send size={16} /> Submit Quiz
              </button>
            )}
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
}

const practiceQuizzes = [];

/* ─── Main AcademicQuiz page ───────────────────────────────────── */
export default function AcademicQuiz() {
  const [activeTab, setActiveTab] = useState("All");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizMode, setQuizMode] = useState(null); // "take" | "review"
  const [allQuizzes, setAllQuizzes] = useState([]);

  // Fetch admin-created DB quizzes when page mounts
  const refreshQuizzes = () => {
    fetchApiQuizzes().then((apiQuizzes) => {
      setAllQuizzes(apiQuizzes || []);
    });
  };

  useEffect(() => {
    refreshQuizzes();
    const handleQuizUpdated = () => refreshQuizzes();
    window.addEventListener(EVENTS.QUIZ_UPDATED, handleQuizUpdated);
    return () => window.removeEventListener(EVENTS.QUIZ_UPDATED, handleQuizUpdated);
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
      <div className="student-header-box">
        <h2 className="student-header-title">
          <GraduationCap size={22} style={{ color: "#4f46e5" }} />
          <span>Academic & Practice Quizzes</span>
        </h2>
        <p className="student-header-desc">
          Attempt your scheduled faculty assessments, evaluate core technical concepts, and review past test scores.
        </p>
      </div>

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
