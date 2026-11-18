import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { GraduationCap, Clock, CalendarDays, CheckCircle2, PlayCircle, AlertCircle, Timer, Trophy, Target, ArrowLeft, ArrowRight, ChevronLeft, Send, RotateCcw, X, CheckCheck, Circle, Flag, Lock, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import "../Styles/ST_AcademicQuiz.css";
import { getSharedQuizzes, EVENTS } from "../../../utils/sharedStore";

import { getApiBaseUrl, getAuthToken } from "../../../utils/api.js";

/* ─── Fetch quizzes from Database ─────────────────────────────── */
const API_BASE = getApiBaseUrl();

function getAuthHeaders() {
  let token = getAuthToken();
  if (!token) {
    try {
      const uSession = JSON.parse(
        sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
      );
      token = uSession.token || uSession.authToken || uSession.auth_token || uSession.accessToken || uSession.jwt || "";
    } catch (e) {}
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function formatScoreDisplay(scoreVal, totalQs = 5, totalMarks = null) {
  const safeTotal = typeof totalQs === "number" && totalQs > 0 ? totalQs : parseInt(totalQs, 10) || 5;
  if (!scoreVal || String(scoreVal).trim() === "") {
    return `Score: --/${safeTotal}`;
  }
  if (String(scoreVal).toLowerCase() === "completed" || String(scoreVal).toLowerCase() === "score: completed") {
    return "Completed";
  }
  const clean = String(scoreVal).trim();
  if (/Score:\s*\d+\s*\/\s*\d+/i.test(clean)) {
    return clean;
  }
  if (/^\d+\s*\/\s*\d+/.test(clean)) {
    return `Score: ${clean}`;
  }
  const digits = clean.match(/\d+(\.\d+)?/g);
  if (digits && digits.length >= 2) {
    return `Score: ${digits[0]}/${digits[1]}`;
  } else if (digits && digits.length === 1) {
    const num = Number(digits[0]);
    if (num <= safeTotal) {
      return `Score: ${num}/${safeTotal}`;
    }
    const marksTotal = parseInt(totalMarks, 10) || (safeTotal * 10) || 100;
    return `Score: ${num}/${marksTotal}`;
  }
  return `Score: ${safeTotal}/${safeTotal}`;
}

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

    const calculateScoreString = (pastAttempt, qTotalQs, qTotalMarks, qId) => {
      const totalQs = pastAttempt?.total_questions || qTotalQs || 5;
      const rawScoreText = pastAttempt?.score_text || '';
      if (rawScoreText && rawScoreText.toLowerCase() !== 'completed' && rawScoreText.toLowerCase() !== 'score: completed' && rawScoreText.includes('/')) {
        return rawScoreText.startsWith('Score:') ? rawScoreText : `Score: ${rawScoreText}`;
      }
      if (pastAttempt && pastAttempt.correct_count !== undefined && pastAttempt.correct_count !== null) {
        const safeCorrect = Math.min(Math.max(Number(pastAttempt.correct_count), 0), totalQs);
        return `Score: ${safeCorrect}/${totalQs}`;
      }
      if (pastAttempt && pastAttempt.correct_answers !== undefined && pastAttempt.correct_answers !== null) {
        const safeCorrect = Math.min(Math.max(Number(pastAttempt.correct_answers), 0), totalQs);
        return `Score: ${safeCorrect}/${totalQs}`;
      }
      if (pastAttempt && pastAttempt.marks_obtained !== undefined && pastAttempt.marks_obtained !== null) {
        const obtained = Number(pastAttempt.marks_obtained);
        const marksTotal = Number(pastAttempt.total_marks || qTotalMarks || (totalQs * 10));
        if (obtained <= totalQs) {
          return `Score: ${obtained}/${totalQs}`;
        }
        return `Score: ${obtained}/${marksTotal}`;
      }
      if (pastAttempt && pastAttempt.score !== undefined && pastAttempt.score !== null && !isNaN(Number(pastAttempt.score))) {
        const s = Number(pastAttempt.score);
        if (s <= totalQs) {
          return `Score: ${s}/${totalQs}`;
        }
        const marksTotal = Number(qTotalMarks || (totalQs * 10));
        return `Score: ${s}/${marksTotal}`;
      }
      if (typeof window !== 'undefined' && qId) {
        const cached = localStorage.getItem(`quiz_score_${qId}`);
        if (cached && cached.toLowerCase() !== 'completed' && cached.toLowerCase() !== 'score: completed' && cached.includes('/')) {
          return cached.startsWith('Score:') ? cached : `Score: ${cached}`;
        }
      }
      return `Score: --/${totalQs}`;
    };

    // Map assessment DB shape -> student quiz shape
    const dbList = list.map((q) => {
      const pastAttempt = attemptMap[String(q.id)];
      const localCompleted = typeof window !== 'undefined' && localStorage.getItem(`quiz_completed_${q.id}`) === 'true';
      const isCompleted = Boolean(pastAttempt) || localCompleted;
      const totalQs = pastAttempt?.total_questions || q.total_questions || (q.questions ? q.questions.length : 5);
      const scoreStr = isCompleted ? calculateScoreString(pastAttempt, totalQs, q.total_marks, q.id) : null;

      return {
        id: q.id,
        title: q.title,
        subject: q.category === "AI Generated" ? "AI Generated" : q.category || "Custom Quiz",
        topic: q.batch_name || "General",
        date: q.created_at ? new Date(q.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "Today",
        duration: `${parseInt(q.duration_minutes || q.duration || 15, 10) || 15} mins`,
        durationSecs: (parseInt(q.duration_minutes || q.duration || 15, 10) || 15) * 60,
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

    const existingIds = new Set(dbList.map(q => String(q.id)));

    const shared = await getSharedQuizzes([]);
    const sharedMapped = shared
      .filter(s => !existingIds.has(String(s.id)))
      .map(s => {
        const pastAttempt = attemptMap[String(s.id)];
        const localCompleted = typeof window !== 'undefined' && localStorage.getItem(`quiz_completed_${s.id}`) === 'true';
        const isCompleted = Boolean(pastAttempt) || localCompleted || s.status === 'Completed';
        const totalQs = pastAttempt?.total_questions || s.data?.questionsCount || (s.data?.questions ? s.data.questions.length : 10);
        const scoreStr = isCompleted ? calculateScoreString(pastAttempt, totalQs, s.data?.totalMarks, s.id) : null;

        return {
          id: s.id,
          title: s.title,
          subject: s.data?.subject || s.subject || "Custom Quiz",
          topic: s.batch_name || s.data?.batch || "General",
          date: "Today",
          duration: `${parseInt(s.data?.duration_minutes || s.data?.timeLimit || s.data?.duration || 15, 10) || 15} mins`,
          durationSecs: (parseInt(s.data?.duration_minutes || s.data?.timeLimit || s.data?.duration || 15, 10) || 15) * 60,
          marks: `${s.data?.totalMarks || 100} Marks`,
          status: isCompleted ? "Completed" : "Upcoming",
          score: scoreStr,
          difficulty: "Medium",
          questions: totalQs,
          questionsList: s.data?.questions || [],
          source: "shared"
        };
      });

    // Preserve every quiz distinctly by its unique ID
    const seenIds = new Set();
    const uniqueList = [];
    for (const q of [...dbList, ...sharedMapped]) {
      const idKey = String(q.id);
      if (!seenIds.has(idKey)) {
        seenIds.add(idKey);
        uniqueList.push(q);
      }
    }

    return uniqueList;
  } catch (err) {
    console.error("Failed to load API quizzes:", err);
    const shared = await getSharedQuizzes([]);
    return shared.map(s => {
      const localCompleted = typeof window !== 'undefined' && localStorage.getItem(`quiz_completed_${s.id}`) === 'true';
      const isCompleted = localCompleted || s.status === 'Completed';
      const totalQs = s.data?.questionsCount || (s.data?.questions ? s.data.questions.length : 10);
      const cached = typeof window !== 'undefined' ? localStorage.getItem(`quiz_score_${s.id}`) : null;
      const scoreStr = isCompleted ? (cached && cached.includes('/') ? cached : `Score: ${totalQs}/${totalQs}`) : null;

      return {
        id: s.id,
        title: s.title,
        subject: s.data?.subject || s.subject || "Custom Quiz",
        topic: s.batch_name || s.data?.batch || "General",
        date: "Today",
        duration: `${parseInt(s.data?.duration_minutes || s.data?.timeLimit || s.data?.duration || 15, 10) || 15} mins`,
        durationSecs: (parseInt(s.data?.duration_minutes || s.data?.timeLimit || s.data?.duration || 15, 10) || 15) * 60,
        marks: `${s.data?.totalMarks || 100} Marks`,
        status: isCompleted ? "Completed" : "Upcoming",
        score: scoreStr,
        difficulty: "Medium",
        questions: totalQs,
        questionsList: s.data?.questions || [],
        source: "shared"
      };
    });
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
function isAnswerCorrect(userAnswerIndex, qItem) {
  if (userAnswerIndex === null || userAnswerIndex === undefined) return false;
  if (typeof qItem?.correct === "number") {
    return userAnswerIndex === qItem.correct;
  }
  const optKeys = ["a", "b", "c", "d"];
  const selectedKey = optKeys[userAnswerIndex];
  const targetKey = String(qItem?.correct ?? "").trim().toLowerCase();
  if (selectedKey === targetKey) return true;
  if (String(userAnswerIndex) === targetKey) return true;
  if (Array.isArray(qItem?.options) && qItem.options[userAnswerIndex]) {
    return String(qItem.options[userAnswerIndex]).trim().toLowerCase() === targetKey;
  }
  return false;
}

function normalizeAdminQuestion(q, idx) {
  if (!q) return defaultQuizQuestions[0];

  let optionsArr = [];
  if (Array.isArray(q.options) && q.options.length > 0) {
    optionsArr = q.options.filter(v => v !== null && v !== undefined && v !== 'N/A' && String(v).trim() !== '');
  } else if (q.options && typeof q.options === 'object') {
    const rawOpts = q.options;
    optionsArr = [
      rawOpts.a ?? rawOpts.A ?? rawOpts.option_a ?? q.option_a ?? '',
      rawOpts.b ?? rawOpts.B ?? rawOpts.option_b ?? q.option_b ?? '',
      rawOpts.c ?? rawOpts.C ?? rawOpts.option_c ?? q.option_c ?? '',
      rawOpts.d ?? rawOpts.D ?? rawOpts.option_d ?? q.option_d ?? '',
    ].filter(v => v !== null && v !== undefined && v !== 'N/A' && String(v).trim() !== '');
  } else if (q.option_a || q.option_b) {
    optionsArr = [
      q.option_a || '',
      q.option_b || '',
      q.option_c || '',
      q.option_d || '',
    ].filter(v => v !== null && v !== undefined && v !== 'N/A' && String(v).trim() !== '');
  }

  if (optionsArr.length === 0) {
    optionsArr = ["Option A", "Option B", "Option C", "Option D"];
  }

  const optKeys = ['a', 'b', 'c', 'd'];
  const rawCorrect = (q.correct_option ?? q.correct ?? q.correctOptionVerified ?? q.answer ?? 'a').toString().trim().toLowerCase();

  let correctIdx = 0;
  if (rawCorrect === 'a' || rawCorrect === '0' || rawCorrect === 'option a' || rawCorrect === 'option 1') {
    correctIdx = 0;
  } else if (rawCorrect === 'b' || rawCorrect === '1' || rawCorrect === 'option b' || rawCorrect === 'option 2') {
    correctIdx = 1;
  } else if (rawCorrect === 'c' || rawCorrect === '2' || rawCorrect === 'option c' || rawCorrect === 'option 3') {
    correctIdx = 2;
  } else if (rawCorrect === 'd' || rawCorrect === '3' || rawCorrect === 'option d' || rawCorrect === 'option 4') {
    correctIdx = 3;
  } else {
    const textIdx = optionsArr.findIndex(o => String(o).trim().toLowerCase() === rawCorrect);
    if (textIdx >= 0) {
      correctIdx = textIdx;
    } else {
      const parsedNum = parseInt(rawCorrect, 10);
      if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < optionsArr.length) {
        correctIdx = parsedNum;
      }
    }
  }

  const optLetter = optKeys[correctIdx] ? optKeys[correctIdx].toUpperCase() : 'A';
  return {
    id: q.id || idx + 1,
    question: q.question_text || q.text || q.question || `Question ${idx + 1}`,
    options: optionsArr,
    correct: correctIdx,
    explanation: q.explanation || `The correct answer is Option ${optLetter}: "${optionsArr[correctIdx] || ''}".`
  };
}

const defaultQuizQuestions = [
  {
    id: "default-1",
    question: "What is the primary purpose of Object-Oriented Programming (OOP)?",
    options: ["Data encapsulation and modularity", "Compiling code faster", "Direct hardware manipulation", "Replacing all databases"],
    correct: 0,
    explanation: "OOP organizes code into reusable objects with data encapsulation and modularity."
  }
];

function QuizPlatform({ quiz = {}, mode, onExit }) {
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
  const builtinQs = (quiz.questions?.length ? quiz.questions.map(normalizeAdminQuestion) : null);
  const questions = adminQs || builtinQs || defaultQuizQuestions;

  const isReview = mode === "review";
  const savedAnswers = isReview ? (quiz.savedAnswers || []) : [];

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

  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [isProctorActive, setIsProctorActive] = useState(() => Boolean(document.fullscreenElement));
  const [proctorTerminated, setProctorTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [clipboardWarning, setClipboardWarning] = useState("");
  const [proctorConfirmModal, setProctorConfirmModal] = useState(null); // { title, message, onConfirm, isDanger }

  const proctorArmedRef = useRef(false);
  const proctorViolationsRef = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const hasAutoSubmittedRef = useRef(false);
  const submitRef = useRef(null);

  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const { display: timeDisplay, secs: timeLeft } = useTimer(
    isReview ? 0 : quiz.durationSecs,
    () => !isReview && (submitRef.current ? submitRef.current() : handleSubmit())
  );

  const [attemptId, setAttemptId] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  // Scoped key generator for quiz proctoring strikes in sessionStorage
  const getProctorStorageKey = (attId = attemptId) => {
    const sId = user?.userId || user?.id || "guest";
    const qId = String(quiz?.id || "unknown");
    const aId = attId || (typeof window !== "undefined" && sessionStorage.getItem(`quiz_active_attempt_${sId}_${qId}`)) || "active";
    return `proctor_strikes_quiz_${sId}_${qId}_${aId}`;
  };

  const getProctorAttemptInitKey = (attId = attemptId) => {
    const sId = user?.userId || user?.id || "guest";
    const qId = String(quiz?.id || "unknown");
    const aId = attId || (typeof window !== "undefined" && sessionStorage.getItem(`quiz_active_attempt_${sId}_${qId}`)) || "active";
    return `proctor_initialized_quiz_${sId}_${qId}_${aId}`;
  };

  const getStoredProctorStrikes = (attId = attemptId) => {
    try {
      const val = sessionStorage.getItem(getProctorStorageKey(attId));
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 ? num : 0;
    } catch {
      return 0;
    }
  };

  const setStoredProctorStrikes = (count, attId = attemptId) => {
    try {
      sessionStorage.setItem(getProctorStorageKey(attId), String(count));
    } catch {}
  };

  const clearStoredProctorStrikes = (attId = attemptId) => {
    try {
      sessionStorage.removeItem(getProctorStorageKey(attId));
      sessionStorage.removeItem(getProctorAttemptInitKey(attId));
    } catch {}
  };

  // Sync ref with persisted storage on mount/quiz start
  useEffect(() => {
    if (!isReview && quiz?.id) {
      const initKey = getProctorAttemptInitKey();
      if (!sessionStorage.getItem(initKey)) {
        if (!submitted) {
          clearStoredProctorStrikes();
        }
        sessionStorage.setItem(initKey, "1");
      }
      proctorViolationsRef.current = getStoredProctorStrikes();
    }
  }, [quiz?.id, isReview, attemptId]);

  const showToast = (msg) => {
    setClipboardWarning(msg);
    setTimeout(() => setClipboardWarning(""), 3500);
  };

  const endQuizDueToViolation = (reason, description) => {
    if (hasAutoSubmittedRef.current || submitted) return;
    hasAutoSubmittedRef.current = true;
    proctorArmedRef.current = false;
    setProctorTerminated(true);
    setTerminationReason(reason);

    if (submitRef.current) {
      submitRef.current({ isAutoSubmit: true, reason });
    } else {
      handleSubmit({ isAutoSubmit: true, reason });
    }
  };

  const handleProctorViolation = (reason, description) => {
    if (isReview || submitted || !proctorArmedRef.current) return;
    if (reason !== "exit_fullscreen") return;

    // Debounce to prevent duplicate strikes when blur and visibilitychange fire simultaneously
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1500) {
      return;
    }
    lastViolationTimeRef.current = now;

    const currentStrikes = getStoredProctorStrikes() + 1;
    proctorViolationsRef.current = currentStrikes;
    setStoredProctorStrikes(currentStrikes);

    if (currentStrikes < 3) {
      const remaining = 3 - currentStrikes;
      showToast(
        `⚠️ Warning ${currentStrikes}/2: ${description} You have ${remaining} chance${remaining === 1 ? '' : 's'} left before automatic submission.`
      );
    } else {
      clearStoredProctorStrikes();
      endQuizDueToViolation(reason, `${description} Maximum violation limit (2 warnings) reached.`);
    }
  };

  const exitFullscreenSafely = () => {
    try {
      if (typeof document !== "undefined") {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
          (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen)?.call(document).catch(() => {});
        }
      }
    } catch (_) {}
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
      if (!isReview) setIsProctorActive(true);
    } else {
      exitFullscreenSafely();
    }
  };

  const handleEnterFullscreenAndStart = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setIsProctorActive(true);
    } catch (err) {
      console.warn("Fullscreen permission error:", err);
      setIsFullscreen(true);
      setIsProctorActive(true);
    }
  };

  const handleToggleFullscreenClick = () => {
    if (!isReview && !submitted) {
      const strikes = getStoredProctorStrikes();
      const nextStrike = strikes + 1;
      if (nextStrike < 3) {
        setProctorConfirmModal({
          title: "Exit Full-Screen Mode?",
          message: `Exiting full-screen is an examination violation. This action will count as Warning ${nextStrike}/2. Are you sure you want to proceed?`,
          isDanger: false,
          onConfirm: () => {
            setProctorConfirmModal(null);
            if (document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
            handleProctorViolation("exit_fullscreen", "Full-screen mode was exited!");
          }
        });
      } else {
        setProctorConfirmModal({
          title: "Final Warning: Submission Will Trigger",
          message: "Exiting full-screen now will exceed your 2 allowed warnings. Your quiz will be ended and current answers will be automatically submitted. Proceed?",
          isDanger: true,
          onConfirm: () => {
            setProctorConfirmModal(null);
            if (document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
            handleProctorViolation("exit_fullscreen", "Full-screen mode was exited!");
          }
        });
      }
      return;
    }
    toggleFullscreen();
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);

      if (!isReview && !submitted && proctorArmedRef.current && !isFs) {
        handleProctorViolation("exit_fullscreen", "Full-screen mode was exited!");
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, [isReview, submitted]);

  // Tab switching, blur, and anti-cheat keyboard shortcuts
  useEffect(() => {
    if (isReview || submitted) return;

    let armTimer = null;
    if (isProctorActive && isFullscreen) {
      armTimer = setTimeout(() => {
        proctorArmedRef.current = true;
      }, 2500);
    } else {
      proctorArmedRef.current = false;
    }

    const handleTabSwitchEvent = () => {
      if (proctorArmedRef.current && !submitted) {
        endQuizDueToViolation("tab_switch", "Tab switch or leaving the quiz window detected!");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && proctorArmedRef.current && !submitted) {
        handleTabSwitchEvent();
      }
    };

    const handleWindowBlur = () => {
      // Only count window blur as a violation when the window is actually hidden
      if (document.hidden && proctorArmedRef.current && !submitted) {
        handleTabSwitchEvent();
      }
    };

    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;
      const key = (e.key || "").toLowerCase();
      const code = e.code || "";

      if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        showToast("⚠️ Alt key navigation is disabled during proctored assessments.");
        return;
      }

      if (isMod && (key === "tab" || code === "Tab" || key === "w" || key === "t" || key === "n")) {
        e.preventDefault();
        e.stopPropagation();
        showToast("⚠️ Tab switching shortcuts are disabled during this assessment.");
        return;
      }

      if (key === "f11" || code === "F11" || key === "f12" || code === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      if (armTimer) clearTimeout(armTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isReview, submitted, isProctorActive, isFullscreen]);

  // Initialize or start assessment attempt with API
  useEffect(() => {
    const isRealQuiz = quiz.id && (quiz.source === "admin" || !isNaN(Number(quiz.id)));
    if (isRealQuiz && !isReview) {
      apiFetch(`/assessments/${quiz.id}/start`, { method: "POST" })
        .then((data) => {
          console.log("[Quiz Start Response]", data);
          let foundAttemptId = null;
          // Success path: attempt just created
          if (data.success && data.data?.attempt?.id) {
            foundAttemptId = data.data.attempt.id;
          } else if (data.data?.attemptId) {
            foundAttemptId = data.data.attemptId;
          } else if (data.data?.attempt_id) {
            foundAttemptId = data.data.attempt_id;
          }
          // 409 = already attempted — grab the attemptId from error detail
          else if (!data.success && data.details) {
            const hint = Array.isArray(data.details) ? data.details[0]?.hint : data.details;
            if (hint) {
              const match = String(hint).match(/(\d+)/);
              if (match) foundAttemptId = parseInt(match[1], 10);
            }
          }
          if (foundAttemptId) {
            setAttemptId(foundAttemptId);
            const sId = user?.userId || user?.id || "guest";
            const qId = String(quiz?.id || "unknown");
            sessionStorage.setItem(`quiz_active_attempt_${sId}_${qId}`, String(foundAttemptId));
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
  const [finalScoreText, setFinalScoreText] = useState(null);

  async function handleSubmit(opts = {}) {
    const isAuto = Boolean(opts && opts.isAutoSubmit === true);
    if (submitted && !isAuto) return;
    setSubmitted(true);
    setWasSubmitted(true);
    proctorArmedRef.current = false;
    setIsProctorActive(false);

    // After the user clicks on submit, only then leave full screen
    if (!isAuto) {
      exitFullscreenSafely();
    }

    const calculatedScore = questions.reduce(
      (acc, qItem, i) => acc + (isAnswerCorrect(answers[i], qItem) ? 1 : 0),
      0
    );
    const scoreText = `Score: ${calculatedScore}/${questions.length}`;
    setFinalScoreText(scoreText);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`quiz_score_${quiz.id}`, scoreText);
        localStorage.setItem(`quiz_completed_${quiz.id}`, "true");
      }
      // Record quiz completion in MySQL DB (device-independent sync)
      await fetch(`${API_BASE}/assessments/mark-completed`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          score: calculatedScore,
          total: questions.length,
          score_text: scoreText
        }),
      }).catch(() => {});
      window.dispatchEvent(new Event('quizCompletedUpdated'));
      window.dispatchEvent(new Event(EVENTS.QUIZ_UPDATED));
      window.dispatchEvent(new Event('portal_quiz_updated'));
    } catch (e) {}

    if (quiz.source === "practice" && isNaN(Number(quiz.id))) return; // builtin static practice doesn't need backend

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

  submitRef.current = handleSubmit;

  const answered = answers.filter((a) => a !== null).length;
  const safeCurrent = Math.min(Math.max(0, current), questions.length - 1);
  const q = questions[safeCurrent] || questions[0] || defaultQuizQuestions[0];
  const userAnswer = answers[safeCurrent];

  const score = submitted
    ? questions.reduce((acc, qItem, i) => acc + (isAnswerCorrect(answers[i], qItem) ? 1 : 0), 0)
    : 0;

  // Determine status for review sidebar
  function qStatus(idx) {
    if (!submitted) {
      if (reviewMarks[idx]) return "review";
      return answers[idx] !== null ? "completed" : "unattempted";
    }
    return isAnswerCorrect(answers[idx], questions[idx]) ? "correct" : "wrong";
  }

  return createPortal(
    <div className="qp-overlay">
      {/* Header */}
      <div className="qp-header">
        <div className="qp-header-left">
          <button
            className="qp-back-btn"
            onClick={() => {
              if (!isReview && !submitted) {
                setProctorConfirmModal({
                  title: "Leave Proctored Assessment?",
                  message: "Leaving this page will exit the proctored quiz. Are you sure you want to return to the quizzes list?",
                  isDanger: true,
                  onConfirm: () => {
                    setProctorConfirmModal(null);
                    proctorArmedRef.current = false;
                    if (document.fullscreenElement) {
                      document.exitFullscreen?.().catch(() => {});
                    }
                    onExit(wasSubmitted, finalScoreText || `Score: ${score}/${questions.length}`);
                  }
                });
                return;
              }
              onExit(wasSubmitted, finalScoreText || `Score: ${score}/${questions.length}`);
            }}
          >
            <ChevronLeft size={18} /> Back
          </button>
          <div className="qp-header-title-block">
            <span className="qp-header-quiz-name">{quiz.title}</span>
            <span className="qp-header-meta">{quiz.subject} · {quiz.topic}</span>
          </div>
        </div>

        <div className="qp-header-right">
          {!isReview && (
            <div className="cp-proctor-live-badge" title="This assessment is actively proctored. Exiting full-screen or switching tabs will trigger violation warnings.">
              <span className="cp-proctor-live-pulse" />
              <span>Proctored Quiz</span>
            </div>
          )}

          {!isReview && !submitted && (
            <div className={`qp-timer ${timeLeft <= 120 ? "qp-timer--urgent" : ""}`}>
              <Timer size={15} />
              {timeDisplay}
            </div>
          )}

          {!isReview && (
            <button
              type="button"
              className="cp-fs-toggle-btn"
              onClick={handleToggleFullscreenClick}
              title={isFullscreen ? (!submitted ? "Locked Full-Screen (Exiting Triggers Warning)" : "Exit Full Screen") : "Full Screen"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
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
                className="qp-nav-arrow qp-nav-arrow--submit qp-nav-arrow--finish"
                onClick={() => {
                  try {
                    if (typeof document !== "undefined" && (document.fullscreenElement || document.webkitFullscreenElement)) {
                      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document).catch(() => {});
                    }
                  } catch (_) {}
                  onExit(true);
                }}
              >
                <CheckCircle2 size={16} /> Finish & Return to Dashboard
              </button>
            ) : (
              <button
                className="qp-nav-arrow qp-nav-arrow--submit"
                onClick={() => {
                  exitFullscreenSafely();
                  handleSubmit({ userInitiated: true });
                }}
              >
                <Send size={16} /> Submit Quiz
              </button>
            )}
          </div>
        </main>
      </div>

      {/* ── Anti-Cheat / Proctor Violation Toast ── */}
      {clipboardWarning && (
        <div className="cp-clipboard-toast">
          <span>{clipboardWarning}</span>
        </div>
      )}

      {/* ── Proctored Full-Screen Gate Overlay ── */}
      {!isReview && !submitted && !isFullscreen && !proctorTerminated && (
        <div className="proctor-fullscreen-gate-overlay">
          <div className="proctor-gate-card">
            <div className="proctor-gate-badge">
              <Lock size={14} /> PROCTORED ACADEMIC ASSESSMENT
            </div>
            <h2 className="proctor-gate-title">Full-Screen Mode Required</h2>
            <p className="proctor-gate-subtitle">
              This academic assessment is monitored under examination mode. Once started, strict proctoring is enforced:
            </p>
            <div className="proctor-gate-rules">
              <div className="proctor-rule-item">
                <span className="proctor-rule-icon">🖥️</span>
                <div>
                  <strong>Full-Screen is Mandatory:</strong> Exiting full-screen will trigger warnings; on the 3rd exit your quiz is automatically submitted and closed.
                </div>
              </div>
              <div className="proctor-rule-item">
                <span className="proctor-rule-icon">🚫</span>
                <div>
                  <strong>Tab Switching Disabled:</strong> Leaving the quiz window, switching tabs, or minimizing will trigger warnings and count toward auto-submission.
                </div>
              </div>
              <div className="proctor-rule-item">
                <span className="proctor-rule-icon">⏱️</span>
                <div>
                  <strong>Timed Evaluation:</strong> The timer runs continuously. Auto-submission occurs if time expires or if 3 violations occur.
                </div>
              </div>
              <div className="proctor-rule-item">
                <span className="proctor-rule-icon">🔒</span>
                <div>
                  <strong>Single Attempt Locked:</strong> Once submitted or ended due to violations, answers and marks are locked.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleEnterFullscreenAndStart}
              className="proctor-gate-btn"
            >
              <Maximize2 size={18} />
              <span>Enter Full-Screen & Start Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Proctored Violation / Termination Modal ── */}
      {proctorTerminated && (
        <div className="proctor-termination-modal-overlay">
          <div className="proctor-termination-card">
            <div className="proctor-termination-icon-wrap">
              <AlertCircle size={38} color="#dc2626" />
            </div>
            <h3 className="proctor-term-title">Quiz Ended — Exam Policy Violation</h3>
            <p className="proctor-term-desc">
              {terminationReason === "exit_fullscreen"
                ? "You exited full-screen mode during this proctored quiz. As per examination guidelines, your quiz has been ended and your current answers were automatically submitted."
                : "Tab switching or leaving the examination window was detected. As per examination guidelines, your quiz has been ended and your current answers were automatically submitted."}
            </p>
            <div className="proctor-term-status-box">
              <span>🔒 The assessment is now locked. Your answers have been recorded and your score is calculated.</span>
            </div>
            <div className="proctor-term-btn-row">
              <button
                type="button"
                onClick={() => setProctorTerminated(false)}
                className="proctor-term-btn-review"
              >
                Review Answers & Explanations
              </button>
              <button
                type="button"
                onClick={() => onExit(true, finalScoreText || `Score: ${score}/${questions.length}`)}
                className="proctor-term-btn-exit"
              >
                Return to Quizzes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom In-App Proctor Confirmation Dialog ── */}
      {proctorConfirmModal && (
        <div className="proctor-termination-modal-overlay" style={{ zIndex: 1000001 }}>
          <div className="proctor-termination-card" style={{ borderColor: proctorConfirmModal.isDanger ? "#fecaca" : "#fed7aa" }}>
            <div className="proctor-termination-icon-wrap" style={{ background: proctorConfirmModal.isDanger ? "#fee2e2" : "#ffedd5", borderColor: proctorConfirmModal.isDanger ? "#fca5a5" : "#fdba74" }}>
              <AlertCircle size={36} color={proctorConfirmModal.isDanger ? "#dc2626" : "#ea580c"} />
            </div>
            <h3 className="proctor-term-title" style={{ color: proctorConfirmModal.isDanger ? "#991b1b" : "#9a3412" }}>
              {proctorConfirmModal.title}
            </h3>
            <p className="proctor-term-desc">
              {proctorConfirmModal.message}
            </p>
            <div className="proctor-term-btn-row">
              <button
                type="button"
                onClick={() => setProctorConfirmModal(null)}
                className="proctor-term-btn-review"
              >
                Cancel / Stay in Exam
              </button>
              <button
                type="button"
                onClick={proctorConfirmModal.onConfirm}
                className="proctor-term-btn-exit"
                style={{ background: proctorConfirmModal.isDanger ? "#dc2626" : "#ea580c" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
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
        onExit={(wasSubmitted, calculatedScoreText) => {
          if (wasSubmitted) {
            const scoreToUse = calculatedScoreText || (activeQuiz ? localStorage.getItem(`quiz_score_${activeQuiz.id}`) : null) || `Score: ${activeQuiz?.questions || 5}/${activeQuiz?.questions || 5}`;
            // Immediately update local state so the card shows "Completed" and exact score instantly
            setAllQuizzes((prev) =>
              prev.map((q) =>
                q.id === activeQuiz.id
                  ? { ...q, status: "Completed", score: scoreToUse }
                  : q
              )
            );
            setTimeout(() => refreshQuizzes(), 600);
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
          <GraduationCap size={24} style={{ color: "#2563eb", flexShrink: 0, marginRight: "10px" }} />
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

      {displayedQuizzes.length === 0 ? (
        <div className="quiz-empty-card">
          <div className="quiz-empty-icon-wrap">
            <GraduationCap size={36} color="#4f46e5" />
          </div>
          <h3 className="quiz-empty-title">
            {activeTab === "Upcoming"
              ? "No Upcoming Quizzes"
              : activeTab === "Completed"
              ? "No Completed Quizzes Yet"
              : "No Academic or Practice Quizzes"}
          </h3>
          <p className="quiz-empty-desc">
            {activeTab === "Upcoming"
              ? "You're all caught up! No scheduled quizzes are pending for your batch."
              : activeTab === "Completed"
              ? "Quizzes you attempt and complete will appear here with detailed performance reviews."
              : "No quizzes have been published for your cohort yet. Check back soon for new assessments."}
          </p>
        </div>
      ) : (
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
                      <Trophy size={15} color="#854d0e" />
                      <span>{formatScoreDisplay(quiz.score, quiz.questions || 5, quiz.marks)}</span>
                    </div>
                  )}
                </div>

                <div className="quiz-main-info">
                  <h3 className="quiz-title">
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'ui-monospace, monospace',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      padding: '1.5px 6px',
                      borderRadius: '5px',
                      marginRight: '6px'
                    }}>ID #{quiz.id}</span>
                    {quiz.title}
                  </h3>
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
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
