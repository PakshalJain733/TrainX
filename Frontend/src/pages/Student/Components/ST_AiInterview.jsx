import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { io } from "socket.io-client";

import { Bot, Camera, CameraOff, Mic, MicOff, Volume2, VolumeX, Send, Timer, Award, Sparkles, RotateCcw, Play, Video, XCircle, AlertTriangle, Loader2, ShieldAlert, Eye, UserX, Users, Flag, ArrowLeft, Code2, MessageSquare, BrainCircuit, Activity, CheckCircle2 } from "lucide-react";
import { apiFetch, getApiBaseUrl, getBackendOrigin, getAuthToken } from "../../../utils/api";
import "../Styles/ST_AiInterview.css";

import aiInterviewerRef from "../../../assets/images/ai-interviewer-reference.png";
import CustomSelect from "../../../components/ui/CustomSelect";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";


const INTERVIEW_SECONDS = 15 * 60; // 15 minutes (ample duration so candidate is never cut off prematurely)
const WARNING_SECONDS = 90;

const ROLE_OPTIONS = [
  "Software Engineer Intern",
  "Full Stack Developer",
  "Backend Developer",
  "Data Analyst",
  "Frontend Developer",
  "QA / Testing Engineer",
  "DevOps Trainee",
];

const ROLE_TOPIC_MAP = {
  "Data Analyst": {
    keywords: [
      "sql", "database", "databases", "python", "data analytics", "analytics",
      "pandas", "numpy", "tableau", "powerbi", "power bi", "excel",
      "statistics", "visualization", "bigquery", "data engineering", "dsa",
      "data structures", "algorithms"
    ],
    recommendedTopics: ["SQL / Databases", "Python", "Data Structures & Algorithms"],
    description: "Data Analyst roles focus on SQL, Python, Statistics, Data Visualization (Tableau/PowerBI), and Excel rather than Web UI or JavaScript application development.",
    suggestedRoles: ["Full Stack Developer", "Backend Developer", "Frontend Developer"],
  },
  "Frontend Developer": {
    keywords: [
      "javascript", "js", "react", "html", "css", "typescript", "ts", "frontend",
      "web", "vue", "angular", "nextjs", "next.js", "tailwind", "ui", "ux",
      "browser", "dom", "dsa", "data structures", "algorithms"
    ],
    recommendedTopics: ["JavaScript", "React", "Data Structures & Algorithms"],
    description: "Frontend Developer roles focus on JavaScript, React, TypeScript, HTML/CSS, and Web Performance.",
    suggestedRoles: ["Full Stack Developer", "Software Engineer Intern"],
  },
  "Backend Developer": {
    keywords: [
      "node", "nodejs", "node.js", "express", "java", "python", "sql", "database",
      "databases", "mongodb", "postgres", "mysql", "redis", "system design",
      "rest", "api", "microservices", "dsa", "data structures", "algorithms",
      "c++", "cpp", "go", "golang", "django", "fastapi", "spring", "springboot"
    ],
    recommendedTopics: ["Node.js", "Java", "SQL / Databases", "System Design Basics", "Data Structures & Algorithms", "Python"],
    description: "Backend Developer roles focus on Node.js, Java, Python, SQL/Databases, System Design, and REST APIs.",
    suggestedRoles: ["Full Stack Developer", "Software Engineer Intern"],
  },
  "Full Stack Developer": {
    keywords: [
      "javascript", "js", "react", "node", "nodejs", "node.js", "python", "java",
      "sql", "database", "databases", "fullstack", "full stack", "dsa",
      "data structures", "algorithms", "system design", "html", "css", "express", "mongodb"
    ],
    recommendedTopics: ["JavaScript", "React", "Node.js", "SQL / Databases", "Data Structures & Algorithms", "Python", "Java", "System Design Basics"],
    description: "Full Stack roles cover both Frontend (JS/React) and Backend (Node/Java/SQL).",
    suggestedRoles: ["Backend Developer", "Frontend Developer"],
  },
  "QA / Testing Engineer": {
    keywords: [
      "testing", "qa", "selenium", "cypress", "junit", "testng", "automation",
      "api testing", "postman", "jest", "unit testing", "playwright", "cucumber",
      "pytest", "python", "java", "javascript", "sql", "database"
    ],
    recommendedTopics: ["Java", "Python", "SQL / Databases", "JavaScript"],
    description: "QA & Testing roles focus on Automation Testing (Selenium/Cypress), Unit/API Testing, Python/Java, and SQL.",
    suggestedRoles: ["Software Engineer Intern"],
  },
  "DevOps Trainee": {
    keywords: [
      "devops", "docker", "kubernetes", "k8s", "ci/cd", "cicd", "jenkins",
      "linux", "bash", "shell", "aws", "cloud", "terraform", "ansible", "git",
      "python", "system design", "sql"
    ],
    recommendedTopics: ["System Design Basics", "Python", "SQL / Databases"],
    description: "DevOps roles focus on Docker, Kubernetes, Linux/Shell, CI/CD, Infrastructure & Cloud Services.",
    suggestedRoles: ["Backend Developer"],
  },
  "Software Engineer Intern": {
    keywords: [
      "dsa", "data structures", "algorithms", "java", "python", "c++", "cpp",
      "javascript", "sql", "database", "databases", "oops", "object oriented",
      "react", "node", "system design"
    ],
    recommendedTopics: ["Data Structures & Algorithms", "Java", "Python", "JavaScript", "SQL / Databases", "React", "Node.js", "System Design Basics"],
    description: "Software Engineer Intern roles cover Core CS (DSA, OOP, System Design, SQL, Programming Languages).",
    suggestedRoles: ["Full Stack Developer", "Backend Developer"],
  },
};

function checkRoleTopicCompatibility(selectedRole, selectedTopic, customTopicText = "") {
  if (!selectedRole) return { isMismatch: false };
  const roleInfo = ROLE_TOPIC_MAP[selectedRole];
  if (!roleInfo) return { isMismatch: false };

  const effectiveTopic = (selectedTopic === "Other / Custom Topic..." || selectedTopic === "Custom Topic")
    ? (customTopicText ? customTopicText.trim() : "")
    : selectedTopic;

  if (!effectiveTopic) return { isMismatch: false, effectiveTopic: "" };

  // 1. Direct match with recommended topics for the selected role
  const isDirectlyRecommended = roleInfo.recommendedTopics.some(
    (rt) => rt.toLowerCase() === effectiveTopic.toLowerCase()
  );
  if (isDirectlyRecommended) {
    return { isMismatch: false, effectiveTopic };
  }

  // 2. Strict word boundary regex matching for custom topics / keywords
  const topicLower = effectiveTopic.toLowerCase();

  const hasKeywordMatch = roleInfo.keywords.some((kw) => {
    const kwLower = kw.toLowerCase();
    const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i");
    return regex.test(topicLower);
  });

  if (!hasKeywordMatch) {
    return {
      isMismatch: true,
      role: selectedRole,
      topic: effectiveTopic,
      description: roleInfo.description,
      recommendedTopics: roleInfo.recommendedTopics,
      suggestedRoles: roleInfo.suggestedRoles,
      reason: `'${effectiveTopic}' is not a valid interview topic for a '${selectedRole}' role.`
    };
  }

  return { isMismatch: false, effectiveTopic };
}

export default function AIInterview() {
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const recognitionRef = useRef(null);

  // Speech & Interview State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const TOPIC_OPTIONS = [
    "JavaScript",
    "Python",
    "SQL / Databases",
    "Data Structures & Algorithms",
    "React",
    "Node.js",
    "Java",
    "System Design Basics",
  ];

  const fmtTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  function pickVoice() {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Microsoft") ||
            v.name.includes("Samantha") ||
            v.name.includes("Zira"))
      ) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  }

  function speakNow(text, onEnd) {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) {
      onEnd && onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => onEnd && onEnd();
    utterance.onerror = () => onEnd && onEnd();
    window.speechSynthesis.speak(utterance);
  }

  function getToken() {
    let token = getAuthToken();
    if (!token) {
      try {
        const uSession = JSON.parse(
          sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
        );
        token =
          uSession.token ||
          uSession.authToken ||
          uSession.auth_token ||
          uSession.accessToken ||
          uSession.jwt;
      } catch (e) { }
    }
    if (!token) return "";
    return String(token).replace(/^Bearer\s+/i, "").trim();
  }

  const [phase, setPhase] = useState("setup"); // setup | live | result
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [topic, setTopic] = useState(TOPIC_OPTIONS[0]);
  const [customTopic, setCustomTopic] = useState("");

  const compatibility = useCallback(() => {
    return checkRoleTopicCompatibility(role, topic, customTopic);
  }, [role, topic, customTopic])();

  // Camera
  const [cameraState, setCameraState] = useState("idle"); // idle | on | denied | unsupported
  const cameraStreamRef = useRef(null);
  const videoRef = useRef(null);

  // Maintenance & Feature switch
  const { isModuleActive } = useSystemMaintenance();
  const speechEnabled = isModuleActive("studentSpeechToText");

  // Speech recognition
  const SpeechRecognitionCtor =
    typeof window !== "undefined" && speechEnabled
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const [isRecording, setIsRecording] = useState(false);

  // Socket
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Interview state
  const [question, setQuestion] = useState(null);
  const [conversation, setConversation] = useState([]);
  const conversationEndRef = useRef(null);
  const sessionIdRef = useRef(null);
  const existingAnswerRef = useRef("");

  // Timer — only starts after first question arrives
  const [remaining, setRemaining] = useState(INTERVIEW_SECONDS);
  const timerActiveRef = useRef(false);
  const timerStartRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const [warningShown, setWarningShown] = useState(false);

  // TTS
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [overallScorecard, setOverallScorecard] = useState(null);
  const [pastInterviewsList, setPastInterviewsList] = useState([]);

  const fetchPastInterviews = useCallback(() => {
    apiFetch("/interviews/history")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setPastInterviewsList(res.data.slice(0, 10));
        } else {
          setPastInterviewsList([]);
        }
      })
      .catch(() => setPastInterviewsList([]));
  }, []);

  useEffect(() => {
    fetchPastInterviews();
  }, [fetchPastInterviews]);

  const voiceEnabledRef = useRef(true); // kept in sync for use inside socket callbacks


  // Flow control
  const completedRef = useRef(false);
  const endRequestedRef = useRef(false);
  const firstQuestionRef = useRef(false);
  const phaseRef = useRef("setup");

  // Result
  const [result, setResult] = useState(null);

  // Errors
  const [errorMsg, setErrorMsg] = useState("");

  // Proctoring & Anti-Cheating Camera Violation Monitor
  const [proctoringWarnings, setProctoringWarnings] = useState([]);
  const [activeProctoringModal, setActiveProctoringModal] = useState(null);
  const [isInterviewFlagged, setIsInterviewFlagged] = useState(false);
  const lastWarningTimeRef = useRef(0);
  const livePhaseStartTimeRef = useRef(0);
  const lastWarningTypeTimestampRef = useRef({});
  const proctoringCanvasRef = useRef(null);
  const hasCameraBeenTurnedOnRef = useRef(false);
  const consecutiveViolationsRef = useRef({ noFace: 0, lookingAway: 0, multipleFaces: 0 });
  const endReasonRef = useRef("");
  const proctoringWarningsRef = useRef([]);
  const aiFaceDetectorRef = useRef(null);

  // Initialize Native AI FaceDetector if supported in candidate's browser
  useEffect(() => {
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        aiFaceDetectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
      } catch (err) {
        aiFaceDetectorRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (cameraState === "on") {
      hasCameraBeenTurnedOnRef.current = true;
    }
  }, [cameraState]);

  const triggerProctoringWarning = useCallback((type = "SUSPICIOUS_BEHAVIOR", customMsg = "") => {
    const nowMs = Date.now();

    // 25-second startup grace period: prevents any false positives while candidate settles in
    if (nowMs - livePhaseStartTimeRef.current < 25000) {
      return;
    }

    // Do not penalize candidate strikes for right clicks
    if (type === "RIGHT_CLICK") {
      return;
    }

    // Enforce 15-second cooldown between warnings to avoid rapid penalty stacking
    const lastTimeMs = lastWarningTypeTimestampRef.current[type] || 0;
    if (nowMs - lastTimeMs < 15000 || nowMs - lastWarningTimeRef.current < 12000) {
      return;
    }
    lastWarningTypeTimestampRef.current[type] = nowMs;
    lastWarningTimeRef.current = nowMs;

    const timestamp = new Date().toLocaleTimeString();
    const defaultMsgs = {
      MULTIPLE_PERSONS: "Multiple persons / background occupants detected in camera feed!",
      DEVICE_DETECTED: "Mobile phone or electronic copying device detected in camera view!",
      LOOKING_AWAY: "Candidate looking away from screen (possible copying attempt)!",
      NO_FACE: "Face not detected in camera frame! Please remain in front of camera.",
      BACKGROUND_PERSON: "Background occupant or secondary person detected!",
      TAB_SWITCH: "Tab switching or window focus lost during live interview!",
      COPY_PASTE: "Copy or paste shortcut attempt detected on interview screen!",
      RIGHT_CLICK: "Right-click context menu opened during live interview!",
    };

    const baseMsg = customMsg || defaultMsgs[type] || "Suspicious proctoring violation detected.";

    setProctoringWarnings((prev) => {
      const warningCount = prev.length + 1;
      const updated = [...prev, { id: Date.now(), type, message: baseMsg, timestamp, warningCount }];
      proctoringWarningsRef.current = updated;

      // Broadcast flag to socket server for audit tracking
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        socketRef.current.emit("interview:flag", {
          sessionId: sessionIdRef.current,
          type,
          message: baseMsg,
          timestamp,
        });
      }

      if (warningCount === 1) {
        // Warning 1 of 3
        setActiveProctoringModal({
          level: 1,
          warningCount: 1,
          maxWarnings: 3,
          title: "Proctoring Violation Warning (1/3)",
          type,
          message: baseMsg,
          subtext: "Please remain alone in front of your camera and do not switch tabs or use external devices. You have 2 warnings remaining before auto-submission.",
          timestamp,
        });
        setIsInterviewFlagged(true);
        speakNow("Warning 1 of 3. Suspicious activity detected on camera.");
      } else if (warningCount === 2) {
        // Warning 2 of 3
        setActiveProctoringModal({
          level: 2,
          warningCount: 2,
          maxWarnings: 3,
          title: "Serious Proctoring Warning (2/3)",
          type,
          message: baseMsg,
          subtext: "FINAL CAUTION: One more violation will automatically terminate and submit your interview evaluation!",
          timestamp,
        });
        setIsInterviewFlagged(true);
        speakNow("Warning 2 of 3. Final warning before interview termination.");
      } else if (warningCount >= 3) {
        // Warning 3 of 3 (Termination & Auto-submit!)
        const strikesSummary = updated.map((v, i) => `Strike ${i + 1}: ${v.message} (${v.timestamp})`).join("; ");
        const terminationReason = `Auto-Submitted: Maximum Proctoring Warnings Exceeded (3 Strikes). Violations: ${strikesSummary}`;
        endReasonRef.current = terminationReason;

        setActiveProctoringModal({
          level: 3,
          warningCount: 3,
          maxWarnings: 3,
          title: "Interview Terminated & Auto-Submitted (3/3)",
          type,
          message: `Exceeded 3 Warning Limit: ${baseMsg}`,
          subtext: "Your interview has been automatically terminated and submitted due to repeated proctoring violations.",
          timestamp,
        });
        setIsInterviewFlagged(true);
        setIsInterviewFinished(true);
        speakNow("Maximum 3 warnings exceeded. Interview terminated and auto submitted.");

        setTimeout(() => {
          if (endInterviewRef.current) {
            endInterviewRef.current(terminationReason, updated);
          }
        }, 1500);
      }

      return updated;
    });
  }, []);

  const dismissProctoringModal = useCallback(() => {
    setActiveProctoringModal(null);
  }, []);

  const viewPastResult = useCallback(async (pastSession) => {
    if (!pastSession) return;
    let sessionData = pastSession;
    if (pastSession.id) {
      try {
        const res = await apiFetch(`/interviews/${pastSession.id}`);
        if (res && res.data) {
          sessionData = res.data;
        }
      } catch (err) {
        console.warn("Could not fetch interview details by ID:", err);
      }
    }

    let d = sessionData.details || {};
    while (typeof d === "string") {
      try { d = JSON.parse(d); } catch (e) { break; }
    }
    // Unwrap nested details if stored via REST wrapper
    if (d && d.details && typeof d.details === "object") {
      d = { ...d, ...d.details };
    }

    let sc = d?.scorecard || {};
    while (typeof sc === "string") {
      try { sc = JSON.parse(sc); } catch (e) { break; }
    }

    const parseNum = (val, fallback = 0) => {
      if (typeof val === "number" && !isNaN(val)) return Math.round(val);
      if (typeof val === "string") {
        const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
        if (!isNaN(n)) return Math.round(n);
      }
      return Math.round(fallback);
    };

    const overallScore = parseNum(sessionData.overall_score ?? d.overallScore ?? sc.overallScore, 0);
    const technical = parseNum(d.technical ?? sc.technical, overallScore);
    const communication = parseNum(d.communication ?? sc.communication, overallScore);
    const problemSolving = parseNum(d.problemSolving ?? sc.problemSolving, overallScore);
    const defaultConf = overallScore === 0 ? 0 : Math.min(100, Math.round(overallScore * 0.9 + 10));
    const confidence = parseNum(d.confidence ?? sc.confidence, defaultConf);

    const ensureArr = (val) => {
      if (Array.isArray(val) && val.length > 0) return val;
      if (typeof val === "string" && val.trim()) return [val.trim()];
      return [];
    };

    const strengths = ensureArr(d.strengths || sc.strengths);
    const improvementAreas = ensureArr(d.weaknesses || d.improvementAreas || sc.improvementAreas || d.recommendations);
    const recommendedTopics = ensureArr(d.skillGaps || d.recommendedTopics || sc.recommendedTopics);
    const feedback = sessionData.feedback || d.feedback || sc.feedback || (overallScore === 0 ? "No answer data evaluated." : "Interview completed.");
    const readiness = d.readiness || sc.readiness || (overallScore >= 70 ? "Interview Ready" : overallScore >= 40 ? "Needs Practice" : "Not Ready");
    const grade = sessionData.grade || sc.grade || d.grade || (overallScore >= 80 ? "Excellent" : overallScore >= 70 ? "Good" : "Needs Improvement");

    const scorecard = {
      overallScore,
      technical,
      communication,
      problemSolving,
      confidence,
      strengths: strengths.length > 0 ? strengths : (overallScore < 50 ? ["Attempted interview session"] : ["Conceptual clarity in core areas"]),
      improvementAreas: improvementAreas.length > 0 ? improvementAreas : ["Review topic fundamentals", "Practice answering with concise technical precision"],
      recommendedTopics: recommendedTopics.length > 0 ? recommendedTopics : [sessionData.interview_type || "Technical Fundamentals"],
      feedback,
      readiness,
      grade,
    };

    let history = Array.isArray(d.evaluationHistory) && d.evaluationHistory.length > 0
      ? d.evaluationHistory
      : Array.isArray(sc.evaluationHistory) && sc.evaluationHistory.length > 0
      ? sc.evaluationHistory
      : [];

    if (history.length === 0 && Array.isArray(d.questions) && d.questions.length > 0) {
      history = d.questions.map((q, idx) => ({
        question: q,
        answer: Array.isArray(d.answers) ? (d.answers[idx] || "") : "",
        score: Array.isArray(d.questionScores) ? (typeof d.questionScores[idx] === "number" ? d.questionScores[idx] : 0) : 0,
        feedback: Array.isArray(d.questionFeedbacks) ? (d.questionFeedbacks[idx] || "Recorded answer.") : "Recorded answer.",
        modelAnswer: Array.isArray(d.modelAnswers) ? d.modelAnswers[idx] : null,
      }));
    }

    // Clean and normalize history items
    history = history.map((h, i) => ({
      question: h.question || h.q || `Question ${i + 1}`,
      answer: h.answer || h.a || "",
      score: typeof h.score === "number" ? h.score : 0,
      feedback: h.feedback || h.f || "No detailed feedback generated.",
      modelAnswer: h.modelAnswer || h.ma || "",
    }));

    setResult({
      scorecard,
      questionsAnswered: d.questionsAnswered ?? (history.length || (overallScore > 0 ? 1 : 0)),
      durationSeconds: d.durationSeconds ?? sessionData.duration_seconds ?? null,
      evaluationHistory: history,
      endReason: d.endReason || sc.endReason || sessionData.end_reason || (overallScore > 0 ? "Completed: All questions evaluated" : "Interview session ended"),
      proctoringWarnings: d.proctoringWarnings || sc.proctoringWarnings || [],
    });
    setPhase("result");
  }, []);

  const studentName =
    typeof window !== "undefined"
      ? (() => {
        try {
          return JSON.parse(
            sessionStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
          )?.name || "";
        } catch {
          return "";
        }
      })()
      : "";

  // Keep refs in sync with state
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);
  useEffect(() => {
    phaseRef.current = phase;
    // Signal layout to enter/exit fullscreen interview mode
    if (phase === "live") {
      window.dispatchEvent(new Event("interviewLive"));
    } else {
      window.dispatchEvent(new Event("interviewEnded"));
    }
  }, [phase]);

  // ─── TTS helpers ────────────────────────────────────────────────────────────
  const autoMicTimeoutRef = useRef(null);
  const startRecognitionRef = useRef(null);

  const stopSpeaking = useCallback(() => {
    if (autoMicTimeoutRef.current) {
      clearTimeout(autoMicTimeoutRef.current);
      autoMicTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
  }, []);

  const speakQuestion = useCallback((text) => {
    if (autoMicTimeoutRef.current) {
      clearTimeout(autoMicTimeoutRef.current);
      autoMicTimeoutRef.current = null;
    }
    if (!voiceEnabledRef.current) {
      autoMicTimeoutRef.current = setTimeout(() => {
        if (phaseRef.current === "live" && !endRequestedRef.current && startRecognitionRef.current) {
          startRecognitionRef.current();
        }
      }, 2000);
      return;
    }
    setIsAiSpeaking(true);
    speakNow(text, () => {
      setIsAiSpeaking(false);
      // AI voice stopped -> auto start candidate mic after 2 seconds delay!
      if (autoMicTimeoutRef.current) {
        clearTimeout(autoMicTimeoutRef.current);
      }
      autoMicTimeoutRef.current = setTimeout(() => {
        if (phaseRef.current === "live" && !endRequestedRef.current && startRecognitionRef.current) {
          startRecognitionRef.current();
        }
      }, 2000);
    });
  }, []);

  const replayQuestion = useCallback(() => {
    if (question?.question) speakQuestion(question.question);
  }, [question, speakQuestion]);

  // ─── Camera & Webcam Mic ──────────────────────────────────────────────────
  const [camMicOn, setCamMicOn] = useState(false);

  const stopCamera = useCallback(() => {
    if (videoRef.current) videoRef.current.srcObject = null;
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraState("idle");
    setCamMicOn(false);
  }, []);

  const enableCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraState("on");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { });
      }
    } catch {
      setCameraState("denied");
      setErrorMsg("Camera permission denied. You can continue without video.");
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameraState === "on") {
      stopCamera();
      if (phaseRef.current === "live" && hasCameraBeenTurnedOnRef.current) {
        const now = Date.now();
        lastWarningTimeRef.current = now;
        triggerProctoringWarning(
          "CAMERA_OFF",
          "Camera turned off or disabled during live interview!"
        );
      }
    } else {
      enableCamera();
    }
  }, [cameraState, enableCamera, stopCamera, triggerProctoringWarning]);

  // Auto-start camera ONLY when the interview becomes live (never on setup screen)
  useEffect(() => {
    if (phase === "live" && cameraState === "idle") {
      enableCamera();
    } else if (phase !== "live" && cameraState === "on") {
      stopCamera();
    }
  }, [phase, cameraState, enableCamera, stopCamera]);

  // Monitor camera off / disabled state during live interview
  useEffect(() => {
    if (phase !== "live") return;
    const now = Date.now();
    if (now - livePhaseStartTimeRef.current < 6000) return;

    if (
      (cameraState === "idle" || cameraState === "denied" || cameraState === "unsupported") &&
      hasCameraBeenTurnedOnRef.current
    ) {
      if (now - lastWarningTimeRef.current > 20000) {
        lastWarningTimeRef.current = now;
        triggerProctoringWarning(
          "NO_FACE",
          "Mandatory camera feed interrupted or disabled during live interview!"
        );
      }
    }
  }, [cameraState, phase, triggerProctoringWarning]);

  const toggleCamMic = useCallback(async () => {
    if (camMicOn) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
          cameraStreamRef.current.removeTrack(track);
        });
      }
      setCamMicOn(false);
    } else {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          if (cameraStreamRef.current) {
            cameraStreamRef.current.addTrack(audioTrack);
          } else {
            cameraStreamRef.current = audioStream;
          }
        }
        setCamMicOn(true);
      } catch {
        setErrorMsg("Webcam microphone access denied.");
      }
    }
  }, [camMicOn]);

  // Attach stream when videoRef mounts
  useEffect(() => {
    if (cameraState === "on" && cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => { });
    }
  }, [cameraState, phase]);

  // Real-Time AI Camera Proctoring & Face/Gaze Recognition Engine
  useEffect(() => {
    if (cameraState !== "on" || phase !== "live") return;

    // 400ms sampling interval for smooth, non-erratic proctoring
    const intervalId = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        if (!proctoringCanvasRef.current) {
          proctoringCanvasRef.current = document.createElement("canvas");
        }
        const canvas = proctoringCanvasRef.current;
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const now = Date.now();

        // 25-second startup grace period (gives user time to settle in and read initial question)
        if (now - livePhaseStartTimeRef.current < 25000) return;

        // Enforce 15 seconds cooldown between warnings to avoid rapid penalty stacking
        if (now - lastWarningTimeRef.current < 15000) return;

        let detectedFacesCount = -1; // -1 means use vision contrast heuristics
        let faceBox = null;

        // ── 1. Native Browser AI Face Recognition (FaceDetector API) ──
        if (aiFaceDetectorRef.current) {
          try {
            const detected = await aiFaceDetectorRef.current.detect(canvas);
            detectedFacesCount = detected.length;
            if (detected.length > 0) {
              faceBox = detected[0].boundingBox;
            }
          } catch {
            detectedFacesCount = -1;
          }
        }

        // ── 2. Fallback AI Vision Contrast & Spatial Analysis (if FaceDetector unavailable) ──
        if (detectedFacesCount === -1) {
          const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frameData.data;

          let totalBrightness = 0;
          let centerLumaSum = 0;
          let centerCount = 0;
          let leftQuadrantMotion = 0;
          let rightQuadrantMotion = 0;

          // Compute luminance and spatial feature variance
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += luma;

            const pixelIdx = i / 4;
            const x = pixelIdx % 160;
            const y = Math.floor(pixelIdx / 160);

            // Center ROI (x: 35-125, y: 15-105)
            if (x >= 35 && x <= 125 && y >= 15 && y <= 105) {
              centerLumaSum += luma;
              centerCount++;
            } else if (x < 35 && y >= 20 && y <= 100) {
              leftQuadrantMotion += luma;
            } else if (x > 125 && y >= 20 && y <= 100) {
              rightQuadrantMotion += luma;
            }
          }

          const avgBrightness = totalBrightness / (canvas.width * canvas.height);
          const avgCenterLuma = centerCount > 0 ? centerLumaSum / centerCount : 0;

          // Second pass: feature contrast variance in central ROI (faces contain high feature variance)
          let centerSqDiff = 0;
          for (let y = 20; y <= 100; y += 4) {
            for (let x = 40; x <= 120; x += 4) {
              const idx = (y * 160 + x) * 4;
              const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
              centerSqDiff += Math.abs(luma - avgCenterLuma);
            }
          }
          const centerVariance = centerSqDiff / (21 * 21);

          // If frame is completely black or camera covered, or zero feature variance
          const isFaceAbsent = avgBrightness < 10 || (avgCenterLuma < 12 && centerVariance < 3.5) || centerVariance < 2.5;

          if (isFaceAbsent) {
            detectedFacesCount = 0;
          } else {
            detectedFacesCount = 1;
            const leftAvg = leftQuadrantMotion / (35 * 81);
            const rightAvg = rightQuadrantMotion / (35 * 81);
            if (Math.abs(leftAvg - rightAvg) > 65 && centerVariance > 25) {
              detectedFacesCount = 2; // Secondary background activity
            }
          }
        }

        // ── 3. Process AI Recognition Results ──
        if (detectedFacesCount === 0) {
          // No face in frame
          consecutiveViolationsRef.current.noFace = (consecutiveViolationsRef.current.noFace || 0) + 1;
          consecutiveViolationsRef.current.multipleFaces = 0;
          consecutiveViolationsRef.current.lookingAway = Math.max(0, (consecutiveViolationsRef.current.lookingAway || 0) - 1);

          if (consecutiveViolationsRef.current.noFace >= 25) { // 25 ticks x 400ms = 10s continuous
            lastWarningTimeRef.current = now;
            consecutiveViolationsRef.current.noFace = 0;
            triggerProctoringWarning(
              "NO_FACE",
              "AI Face Recognition: Candidate face not detected in camera frame! Please sit facing your camera."
            );
          }
        } else if (detectedFacesCount > 1) {
          // Multiple faces detected
          consecutiveViolationsRef.current.multipleFaces = (consecutiveViolationsRef.current.multipleFaces || 0) + 1;
          consecutiveViolationsRef.current.noFace = Math.max(0, (consecutiveViolationsRef.current.noFace || 0) - 2);

          if (consecutiveViolationsRef.current.multipleFaces >= 20) { // 20 ticks x 400ms = 8s continuous
            lastWarningTimeRef.current = now;
            consecutiveViolationsRef.current.multipleFaces = 0;
            triggerProctoringWarning(
              "MULTIPLE_PERSONS",
              `AI Face Recognition: Multiple persons (${detectedFacesCount} faces) detected in camera view! Candidate must be alone.`
            );
          }
        } else {
          // Exactly 1 face detected -> Candidate present and active
          consecutiveViolationsRef.current.noFace = Math.max(0, (consecutiveViolationsRef.current.noFace || 0) - 3);
          consecutiveViolationsRef.current.multipleFaces = Math.max(0, (consecutiveViolationsRef.current.multipleFaces || 0) - 3);

          if (faceBox) {
            const centerX = (faceBox.x + faceBox.width / 2) / canvas.width;
            if (centerX < 0.12 || centerX > 0.88) {
              consecutiveViolationsRef.current.lookingAway = (consecutiveViolationsRef.current.lookingAway || 0) + 1;
              if (consecutiveViolationsRef.current.lookingAway >= 25) { // 10s continuous
                lastWarningTimeRef.current = now;
                consecutiveViolationsRef.current.lookingAway = 0;
                triggerProctoringWarning(
                  "LOOKING_AWAY",
                  "AI Gaze Monitor: Candidate looking completely away from the interview screen!"
                );
              }
            } else {
              consecutiveViolationsRef.current.lookingAway = Math.max(0, (consecutiveViolationsRef.current.lookingAway || 0) - 2);
            }
          } else {
            consecutiveViolationsRef.current.lookingAway = Math.max(0, (consecutiveViolationsRef.current.lookingAway || 0) - 2);
          }
        }
      } catch (e) {
        console.warn("AI Proctoring frame processing warning:", e);
      }
    }, 400);

    return () => clearInterval(intervalId);
  }, [cameraState, phase, triggerProctoringWarning]);

  // ─── Speech Recognition ─────────────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    } catch { /* ignore */ }
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  const startRecognition = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setErrorMsg("Voice input is not supported in this browser. Please type your answer.");
      return;
    }
    stopSpeaking(); // stop TTS before listening
    existingAnswerRef.current = answer; // Preserve existing typed/spoken text
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const base = existingAnswerRef.current ? existingAnswerRef.current.trim() : "";
      const cleanTranscript = transcript.trim();
      const fullText = base ? (cleanTranscript ? `${base} ${cleanTranscript}` : base) : cleanTranscript;
      setAnswer(fullText);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event) => {
      setIsRecording(false);
      if (event.error === "not-allowed") {
        setErrorMsg("Microphone permission denied. Please type your answer.");
      }
    };
    setIsRecording(true);
    try { recognition.start(); } catch { setIsRecording(false); }
  }, [SpeechRecognitionCtor, stopSpeaking, answer]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecognition();
    else startRecognition();
  }, [isRecording, stopRecognition, startRecognition]);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  // ─── Timer ───────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    timerActiveRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // endInterview forward declaration — defined after finishInterview
  const endInterviewRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerActiveRef.current) return; // already running
    timerActiveRef.current = true;
    timerStartRef.current = Date.now();
    setRemaining(INTERVIEW_SECONDS);
    setWarningShown(false);
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
      const left = Math.max(0, INTERVIEW_SECONDS - elapsed);
      setRemaining(left);
      if (left <= WARNING_SECONDS && left > 0 && !warningShown) {
        setWarningShown(true);
      }
      if (left <= 0) {
        stopTimer();
        const timeReason = `Auto-Submitted: Allocated interview duration (${Math.round(INTERVIEW_SECONDS / 60)} minutes) completed.`;
        endReasonRef.current = timeReason;
        if (endInterviewRef.current) endInterviewRef.current(timeReason);
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer]);

  // ─── Finish interview ────────────────────────────────────────────────────────
  const finishInterview = useCallback(
    (summary, explicitReason, explicitWarnings) => {
      if (completedRef.current) return;
      completedRef.current = true;
      endRequestedRef.current = true;
      firstQuestionRef.current = false;
      setIsEvaluating(false);
      stopTimer();
      stopRecognition();
      stopCamera();
      stopSpeaking();
      const socket = socketRef.current;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      const { scorecard, evaluationHistory, durationSeconds, questionsAnswered } = summary || {};
      const finalEndReason =
        explicitReason ||
        summary?.endReason ||
        endReasonRef.current ||
        "Completed: All Questions Answered";
      const finalWarnings =
        explicitWarnings ||
        summary?.proctoringWarnings ||
        proctoringWarningsRef.current ||
        [];

      const finalResult = {
        scorecard: scorecard || null,
        questionsAnswered: questionsAnswered ?? (evaluationHistory?.length ?? 0),
        durationSeconds: durationSeconds ?? Math.round((Date.now() - (timerStartRef.current ?? Date.now())) / 1000),
        evaluationHistory: evaluationHistory || [],
        endReason: finalEndReason,
        proctoringWarnings: finalWarnings,
      };
      setResult(finalResult);
      setPhase("result");

      // Only save via REST if socket did not already save the session
      if (!summary?.sessionId) {
        const payloadDetails = {
          role,
          topic,
          durationSeconds: finalResult.durationSeconds,
          questionsAnswered: finalResult.questionsAnswered,
          overallScore: finalResult.scorecard?.overallScore ?? 0,
          technical: finalResult.scorecard?.technical ?? 0,
          communication: finalResult.scorecard?.communication ?? 0,
          problemSolving: finalResult.scorecard?.problemSolving ?? 0,
          strengths: finalResult.scorecard?.strengths || [],
          weaknesses: finalResult.scorecard?.improvementAreas || [],
          skillGaps: finalResult.scorecard?.recommendedTopics || [],
          feedback: finalResult.scorecard?.feedback || "",
          readiness: finalResult.scorecard?.readiness || "Completed",
          grade: finalResult.scorecard?.grade || "Average",
          evaluationHistory: finalResult.evaluationHistory,
          scorecard: finalResult.scorecard,
          endReason: finalEndReason,
          proctoringWarnings: finalWarnings,
        };

        apiFetch("/interviews", {
          method: "POST",
          body: JSON.stringify({
            details: payloadDetails,
            interviewType: topic || role || "Technical Mock",
            overallScore: payloadDetails.overallScore,
            grade: payloadDetails.grade,
            feedback: payloadDetails.feedback,
          }),
        })
          .then(() => fetchPastInterviews())
          .catch(() => fetchPastInterviews());
      } else {
        fetchPastInterviews();
      }

      // Exit full screen when interview finishes
      if (typeof document !== "undefined" && document.fullscreenElement) {
        document.exitFullscreen().catch((err) => console.log(err));
      }
    },
    [stopTimer, stopRecognition, stopCamera, stopSpeaking, role, topic, fetchPastInterviews]
  );

  // ─── End interview ───────────────────────────────────────────────────────────
  const endInterview = useCallback(
    (explicitReason, explicitWarnings) => {
      if (completedRef.current || endRequestedRef.current) return;
      endRequestedRef.current = true;
      stopRecognition();
      stopTimer();
      stopSpeaking();

      const finalReason = explicitReason || endReasonRef.current || "Completed: Candidate voluntarily ended the interview";
      endReasonRef.current = finalReason;
      const finalWarnings = explicitWarnings || proctoringWarningsRef.current || [];

      const socket = socketRef.current;
      if (socket && socket.connected && sessionIdRef.current) {
        setIsEvaluating(true);
        socket.emit("interview:end", {
          sessionId: sessionIdRef.current,
          reason: finalReason,
          proctoringWarnings: finalWarnings,
        });
        // Generous fallback timeout if network disconnects before complete arrives
        setTimeout(() => {
          if (phaseRef.current !== "result" && !completedRef.current) {
            finishInterview(null, finalReason, finalWarnings);
          }
        }, 45000);
      } else {
        finishInterview(null, finalReason, finalWarnings);
      }
    },
    [stopRecognition, stopTimer, stopSpeaking, finishInterview]
  );

  // Wire endInterview into ref so startTimer can call it
  useEffect(() => {
    endInterviewRef.current = endInterview;
  }, [endInterview]);

  // ─── Anti-Cheat: Tab switch auto-submit + copy-paste block ──────────────────
  useEffect(() => {
    let tabSwitchTimeout = null;

    const handleVisibility = () => {
      if (document.hidden) {
        if (phaseRef.current === "live" && !endRequestedRef.current) {
          // 2.5s debounce: ignore momentary system dialogs, alt-tab slips, or notifications
          tabSwitchTimeout = setTimeout(() => {
            if (document.hidden && phaseRef.current === "live" && !endRequestedRef.current) {
              triggerProctoringWarning("TAB_SWITCH", "Tab switching or window minimizing detected during live interview!");
            }
          }, 2500);
        }
      } else {
        if (tabSwitchTimeout) {
          clearTimeout(tabSwitchTimeout);
          tabSwitchTimeout = null;
        }
      }
    };

    const preventCopy = (e) => {
      if (phaseRef.current === "live") {
        e.preventDefault();
        triggerProctoringWarning("COPY_PASTE", "Copy/paste attempt detected on interview screen!");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("contextmenu", (e) => {
      if (phaseRef.current === "live") {
        e.preventDefault(); // Silently block context menu without issuing false strike
      }
    });

    return () => {
      if (tabSwitchTimeout) clearTimeout(tabSwitchTimeout);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
    };
  }, [triggerProctoringWarning]);



  // ─── Send Answer ─────────────────────────────────────────────────────────────
  const sendAnswer = useCallback(() => {
    const trimmed = answer.trim();
    if (isEvaluating || !trimmed) return;
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setErrorMsg("Not connected to interview server. Please wait and retry.");
      return;
    }
    if (completedRef.current) return;
    stopRecognition();
    setIsEvaluating(true);
    stopSpeaking();
    setConversation((prev) => [...prev, { type: "a", text: trimmed }]);
    socket.emit("interview:answer", {
      sessionId: sessionIdRef.current,
      answer: trimmed,
    });
    setAnswer("");
  }, [answer, isEvaluating, stopRecognition, stopSpeaking]);

  // ─── Socket connection ───────────────────────────────────────────────────────
  const connectAndStart = useCallback(() => {
    // Tear down any existing socket first
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const token = getToken();
    if (!token) {
      setErrorMsg("You are not logged in. Please log in and try again.");
      setPhase("setup");
      return;
    }

    const backendHost = getBackendOrigin();
    const socketTarget = `${backendHost.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")}/interviews`;

    const socket = io(socketTarget, {
      auth: { token },
      query: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 25000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setErrorMsg("");
    });

    socket.on("disconnect", (reason) => {
      setSocketConnected(false);
      if (!completedRef.current && !endRequestedRef.current && reason !== "io client disconnect") {
        setErrorMsg(`Network connection interrupted (${reason}). Reconnecting...`);
      }
    });

    socket.on("connect_error", (e) => {
      setSocketConnected(false);
      const msg = e?.message || "Connection failed";
      const isAuthError = /token|unauthor|forbidden|401|expired|invalid/i.test(msg);
      setErrorMsg(
        isAuthError
          ? "Socket authentication failed — please log out and log in again."
          : `Could not connect to interview server: ${msg}`
      );
      if (!firstQuestionRef.current) {
        socket.disconnect();
        socketRef.current = null;
        setPhase("setup");
      }
    });

    socket.on("interview:question", (q) => {
      setIsEvaluating(false);
      sessionIdRef.current = q.sessionId;

      if (!firstQuestionRef.current) {
        firstQuestionRef.current = true;
        // Start timer ONLY when first real question arrives
        startTimer();
      }

      // Clean plain-text question (strip any backticks or code fences for clear voice readout)
      const cleanText = String(q?.question || "")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`/g, "")
        .trim();
      const sanitizedQ = { ...q, question: cleanText };

      setQuestion(sanitizedQ);
      setAnswer("");
      setConversation((prev) => [
        ...prev,
        { type: "q", index: q.index, text: cleanText, topic: q.topic },
      ]);

      // Auto-speak the question
      if (voiceEnabledRef.current) {
        speakQuestion(cleanText);
      }
    });

    socket.on("interview:feedback", (f) => {
      setIsEvaluating(false);
      setConversation((prev) => [
        ...prev,
        {
          type: "feedback",
          text: f.feedback || f.evaluation?.feedback || "Answer evaluated.",
          score: f.score,
        },
      ]);
    });

    socket.on("interview:complete", (summary) => {
      finishInterview(summary);
    });

    socket.on("interview:error", (e) => {
      setIsEvaluating(false);
      setErrorMsg(e?.message || "Interview error occurred.");
    });

    // Tell server to start
    const effectiveTopic = (topic === "Other / Custom Topic..." || topic === "Custom Topic")
      ? (customTopic.trim() || "General Technical")
      : topic;

    const sessionId = `student-${Date.now()}`;
    socket.emit("interview:start", {
      sessionId,
      role,
      topic: effectiveTopic,
      difficulty: "Medium",
      totalQuestions: 10,
      clientHour: new Date().getHours(),
    });
  }, [role, topic, customTopic, startTimer, speakQuestion, finishInterview]);

  // ─── Start Interview ─────────────────────────────────────────────────────────
  const startInterview = useCallback(() => {
    if (!role.trim()) {
      setErrorMsg("Please choose a target role to begin.");
      return;
    }

    if ((topic === "Other / Custom Topic..." || topic === "Custom Topic") && !customTopic.trim()) {
      setErrorMsg("Please type your custom interview topic (e.g. Docker, Next.js, System Architecture).");
      return;
    }

    if (compatibility.isMismatch) {
      setErrorMsg(`Domain Mismatch Blocked: Topic '${compatibility.topic}' does not match target role '${role}'. Please select a recommended topic for ${role} above.`);
      return;
    }

    // Reset all state & initialize startup grace period
    const startNow = Date.now();
    livePhaseStartTimeRef.current = startNow;
    lastWarningTimeRef.current = startNow + 25000; // 25s initial grace period
    consecutiveViolationsRef.current = { noFace: 0, lookingAway: 0 };
    completedRef.current = false;
    endRequestedRef.current = false;
    firstQuestionRef.current = false;
    timerActiveRef.current = false;
    hasCameraBeenTurnedOnRef.current = false;
    stopTimer();
    setWarningShown(false);
    setProctoringWarnings([]);
    setActiveProctoringModal(null);
    setIsInterviewFlagged(false);
    setErrorMsg("");
    setQuestion(null);
    setConversation([]);
    setAnswer("");
    setResult(null);
    setRemaining(INTERVIEW_SECONDS);
    setPhase("live");
    enableCamera();

    // Request full screen when starting
    if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    }

    // Connect socket — must happen after phase change so UI renders
    setTimeout(() => connectAndStart(), 50);
  }, [role, topic, customTopic, compatibility, stopTimer, connectAndStart, enableCamera]);

  // ─── Reset ───────────────────────────────────────────────────────────────────
  const resetInterview = useCallback(() => {
    stopTimer();
    stopRecognition();
    stopCamera();
    stopSpeaking();
    const socket = socketRef.current;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    }
    completedRef.current = false;
    endRequestedRef.current = false;
    firstQuestionRef.current = false;
    timerActiveRef.current = false;
    hasCameraBeenTurnedOnRef.current = false;
    sessionIdRef.current = null;
    setSocketConnected(false);
    setQuestion(null);
    setConversation([]);
    setAnswer("");
    setResult(null);
    setErrorMsg("");
    setRemaining(INTERVIEW_SECONDS);
    setWarningShown(false);
    setPhase("setup");
    fetchPastInterviews();

    // Exit full screen if resetting
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  }, [stopTimer, stopRecognition, stopCamera, stopSpeaking, fetchPastInterviews]);

  // ─── Fullscreen & Focus Monitor ───────────────────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (typeof document !== "undefined" && !document.fullscreenElement && phaseRef.current === "live" && !endRequestedRef.current) {
        triggerProctoringWarning("TAB_SWITCH", "Fullscreen mode exited during live interview! Please stay in fullscreen.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [triggerProctoringWarning]);

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopRecognition();
      stopCamera();
      stopTimer();
      const socket = socketRef.current;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [stopSpeaking, stopRecognition, stopCamera, stopTimer]);

  // ─── Auto-scroll conversation ─────────────────────────────────────────────────
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conversation]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="ai-interview-page stack-6">
      {phase === "setup" && (
        <div className="student-header-box">
          <h2 className="student-header-title">
            <Bot size={24} style={{ color: "#2563eb", flexShrink: 0, marginRight: "10px" }} />
            <span>Live AI Interview Simulation</span>
          </h2>
          <p className="student-header-desc">
            5-minute voice-driven technical interview with real-time AI questions, speech recognition and instant evaluation.
          </p>
        </div>
      )}

      {/* ─── SETUP PHASE ─────────────────────────────────────────────────────── */}
      {phase === "setup" && (
        <div className="interview-practice-card ai-welcome-landing-card ai-setup-card">
          <div className="ai-welcome-content">
            <div className="ai-bot-graphic">
              <div className="ai-bot-circle">
                <Bot size={44} className="ai-bot-icon" />
              </div>
              <div className="ai-bot-pulse" />
            </div>

            <h3 className="ai-welcome-title">AI Interview</h3>
            <p className="ai-welcome-desc">
              {studentName ? `Welcome, ${studentName}. ` : ""}
              Answer questions by typing or voice. The AI interviewer adapts to your responses and evaluates each answer.
            </p>

            <div className="ai-welcome-meta-grid">
              <div className="ai-meta-item">
                <div className="ai-meta-icon"><Timer size={18} /></div>
                <div>
                  <div className="ai-meta-val">Duration: 5 Minutes</div>
                  <div className="ai-meta-lbl">Timer starts on first question</div>
                </div>
              </div>
              <div className={`ai-meta-item ${cameraState === "denied" ? "ai-meta-warn" : ""}`}>
                <div className="ai-meta-icon">
                  <Video size={18} />
                </div>
                <div>
                  <div className="ai-meta-val">
                    Camera {cameraState === "on" ? "Active" : cameraState === "denied" ? "Blocked" : "Standby"}
                  </div>
                  <div className="ai-meta-lbl">
                    {cameraState === "on" ? "Proctoring stream live" : "Starts on interview launch"}
                  </div>
                </div>
              </div>
              <div className={`ai-meta-item ${SpeechRecognitionCtor && speechEnabled ? "" : "ai-meta-warn"}`}>
                <div className="ai-meta-icon"><Mic size={18} /></div>
                <div>
                  <div className="ai-meta-val">
                    Microphone {!speechEnabled ? "Disabled by Admin" : SpeechRecognitionCtor ? "Supported" : "Unavailable"}
                  </div>
                  <div className="ai-meta-lbl">
                    {!speechEnabled ? "Admin policy: typing fallback active" : SpeechRecognitionCtor ? "Voice-to-text ready" : "Typing fallback will be used"}
                  </div>
                </div>
              </div>
            </div>

            <div className="ai-setup-fields">
              <div className="ai-setup-field">
                <span>Target Role</span>
                <CustomSelect
                  value={role}
                  onChange={(val) => setRole(val)}
                  options={ROLE_OPTIONS}
                  placeholder="Select Target Role"
                />
              </div>
              <div className="ai-setup-field">
                <span>Interview Topic</span>
                <CustomSelect
                  value={topic}
                  onChange={(val) => setTopic(val)}
                  options={[...TOPIC_OPTIONS, "Other / Custom Topic..."]}
                  placeholder="Select Interview Topic"
                />
              </div>
              {(topic === "Other / Custom Topic..." || topic === "Custom Topic") && (
                <div className="ai-setup-field" style={{ width: "100%" }}>
                  <span>Type Custom Interview Topic</span>
                  <input
                    type="text"
                    placeholder="e.g. Docker, Next.js, System Architecture, WebSockets, Go..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      outline: "none",
                      backgroundColor: "#fff",
                      color: "#1e293b",
                      marginTop: "4px",
                    }}
                  />
                </div>
              )}
            </div>

            {compatibility.isMismatch && (
              <div className="ai-mismatch-banner">
                <div className="ai-mismatch-header">
                  <Sparkles size={18} className="ai-mismatch-icon" />
                  <div>
                    <h4 className="ai-mismatch-title">
                      Topic Alignment Notice: <strong>{compatibility.role}</strong> vs <strong>{compatibility.topic}</strong>
                    </h4>
                    <p className="ai-mismatch-desc">
                      {compatibility.reason} {compatibility.description}
                    </p>
                  </div>
                </div>

                <div className="ai-mismatch-actions">
                  <span className="ai-mismatch-recommend-label">Recommended Topics for {compatibility.role}:</span>
                  <div className="ai-mismatch-pills">
                    {compatibility.recommendedTopics?.map((recTop) => (
                      <button
                        key={recTop}
                        type="button"
                        className="ai-recommend-pill-btn"
                        onClick={() => {
                          setTopic(recTop);
                          setCustomTopic("");
                          setErrorMsg("");
                        }}
                      >
                        <Sparkles size={12} /> Switch Topic to <strong>{recTop}</strong>
                      </button>
                    ))}
                  </div>
                  <div className="ai-mismatch-blocked-notice">
                    <span>Select a recommended topic above to unlock interview start for <strong>{compatibility.role}</strong>.</span>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="ai-error-banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={15} /> {errorMsg}
                </span>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      startInterview();
                    }}
                    style={{
                      padding: "4px 10px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = "/";
                    }}
                    style={{
                      padding: "4px 10px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Log In Again
                  </button>
                </div>
              </div>
            )}

            <div className="ai-setup-buttons">
              <button
                type="button"
                className={`ai-start-interview-btn ${compatibility.isMismatch ? "ai-start-btn-disabled" : ""}`}
                onClick={startInterview}
                disabled={compatibility.isMismatch}
              >
                <Play size={18} fill="currentColor" /> {compatibility.isMismatch ? "Select Matching Topic to Start" : "Start Interview"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Interview History & Saved Evaluations */}
      {phase === "setup" && pastInterviewsList && pastInterviewsList.length > 0 && (
        <div className="interview-practice-card past-interviews-card">
          <div className="past-interviews-header">
            <Award size={18} className="ai-icon-indigo" />
            <div>
              <h3 className="past-interviews-title">Stored Interview Evaluations & AI Suggestions</h3>
              <p className="past-interviews-subtitle">
                Click any previous interview session to review full scorecards, feedback, and suggestions saved in database.
              </p>
            </div>
          </div>

          <div className="past-interviews-grid">
            {pastInterviewsList.slice(0, 10).map((item) => {
              const score = item.overall_score || 0;
              const dateStr = item.conducted_date ? new Date(item.conducted_date).toLocaleDateString() : (item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent");
              return (
                <div
                  key={item.id}
                  className="past-interview-item-card"
                  onClick={() => viewPastResult(item)}
                >
                  <div className="past-item-top">
                    <span className="past-topic-badge">{item.interview_type || "Technical Mock"}</span>
                    <span className="past-date-tag">{dateStr}</span>
                  </div>
                  <div className="past-item-middle">
                    <span className="past-score-val">{score}%</span>
                    <span className="past-grade-pill">{item.grade || "Completed"}</span>
                  </div>
                  {item.feedback && (
                    <p className="past-item-feedback-snippet">{item.feedback}</p>
                  )}
                  <button
                    type="button"
                    className="view-suggestions-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewPastResult(item);
                    }}
                  >
                    <Sparkles size={13} /> View Feedback
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── LIVE PHASE ──────────────────────────────────────────────────────── */}
      {phase === "live" && (
        <>
          {/* Timer / Header bar */}
          <div className={`ai-timer-bar ${warningShown ? "ai-time-warning-bar" : ""}`}>
            <div className="ai-timer-left">
              <Timer size={18} />
              <span className={`ai-timer-value ${remaining <= WARNING_SECONDS ? "ai-timer-critical" : ""}`}>
                {question ? fmtTime(remaining) : "Waiting..."}
              </span>
              {warningShown && remaining > 0 && (
                <span className="ai-time-lbl">1 minute remaining</span>
              )}
            </div>

            <div className="ai-timer-right">
              <span className={`ai-socket-dot ${socketConnected ? "ai-socket-on" : ""}`} />
              <span className="ai-socket-lbl">{socketConnected ? "Connected" : "Connecting..."}</span>

              <button
                type="button"
                className="ai-mic-btn ai-end-btn"
                onClick={() => {
                  if (window.confirm("Are you sure you want to end and submit your interview? Your responses will be evaluated.")) {
                    endInterview("Completed: Candidate voluntarily ended the interview");
                  }
                }}
              >
                End Interview
              </button>
            </div>
          </div>

          {/* ─── PROCTORING WARNING MODAL OVERLAY ──────────────────────────── */}
          {activeProctoringModal &&
            createPortal(
              <div className="ai-proctoring-modal-overlay">
                <div className={`ai-proctoring-modal-card level-${activeProctoringModal.level}`}>
                  <div className={`ai-pmodal-badge level-${activeProctoringModal.level}`}>
                    <ShieldAlert size={14} />
                    <span>WARNING {activeProctoringModal.warningCount} OF {activeProctoringModal.maxWarnings}</span>
                  </div>

                  <div className={`ai-pmodal-icon-circle level-${activeProctoringModal.level}`}>
                    <ShieldAlert size={36} className="ai-pmodal-icon" />
                    <div className="ai-pmodal-icon-pulse" />
                  </div>

                  <h3 className="ai-pmodal-title">{activeProctoringModal.title}</h3>
                  <div className={`ai-pmodal-reason-box level-${activeProctoringModal.level}`}>
                    <AlertTriangle size={18} className="reason-icon" />
                    <span className="reason-text">{activeProctoringModal.message}</span>
                  </div>
                  <p className="ai-pmodal-subtext">{activeProctoringModal.subtext}</p>

                  <div className="ai-pmodal-tracker">
                    <div className={`tracker-step ${activeProctoringModal.warningCount >= 1 ? "active level-1" : ""}`}>
                      <span className="step-num">1</span>
                      <span className="step-lbl">Warning 1</span>
                    </div>
                    <div className="tracker-line" />
                    <div className={`tracker-step ${activeProctoringModal.warningCount >= 2 ? "active level-2" : ""}`}>
                      <span className="step-num">2</span>
                      <span className="step-lbl">Warning 2</span>
                    </div>
                    <div className="tracker-line" />
                    <div className={`tracker-step ${activeProctoringModal.warningCount >= 3 ? "active level-3" : ""}`}>
                      <span className="step-num">3</span>
                      <span className="step-lbl">Auto-Submit</span>
                    </div>
                  </div>

                  {activeProctoringModal.level < 3 ? (
                    <button
                      type="button"
                      className={`ai-pmodal-action-btn level-${activeProctoringModal.level}`}
                      onClick={dismissProctoringModal}
                    >
                      <span>I Understand & Resume Interview</span>
                    </button>
                  ) : (
                    <div className="ai-pmodal-terminating-banner">
                      <Loader2 size={16} className="ai-spin" /> Submitting interview evaluation...
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}

          {errorMsg && (
            <div className="ai-error-banner">
              <AlertTriangle size={15} /> {errorMsg}
            </div>
          )}

          <div className="ai-live-grid">
            {/* ── LEFT COLUMN: Webcam + AI status ── */}
            <div className="ai-left-column">
              <div className={`ai-camera-panel ${cameraState === "on" ? "" : "ai-camera-off-panel"}`}>
                <div className="ai-camera-top-overlay">
                  <span className="ai-cam-live-indicator">
                    <span className={`ai-live-dot ${cameraState === "on" ? "green" : "red"}`} />
                    LIVE PROCTORING STREAM
                  </span>
                </div>

                {cameraState === "on" ? (
                  <video ref={videoRef} className="ai-camera-video" autoPlay playsInline muted />
                ) : (
                  <div className="ai-camera-placeholder">
                    <div className="ai-cam-placeholder-graphic">
                      <Video size={32} />
                      <div className="ai-cam-pulse-ring" />
                    </div>
                    <div className="ai-cam-placeholder-title">
                      {cameraState === "denied"
                        ? "Camera Permission Denied"
                        : cameraState === "unsupported"
                          ? "Camera Unsupported"
                          : "Initializing HD Proctoring Camera..."}
                    </div>
                    <div className="ai-cam-placeholder-sub">
                      {cameraState === "denied"
                        ? "Please allow camera access in your browser to enable live AI proctoring."
                        : "Video proctoring feed active."}
                    </div>
                  </div>
                )}
                <div className="ai-camera-controls-bar">
                  <div className="ai-cam-live-status-pill">
                    <span className={`ai-live-dot ${cameraState === "on" ? "green" : "red"}`} />
                    <span>{cameraState === "on" ? "AI Proctoring Active" : "Camera Initializing..."}</span>
                  </div>
                </div>
              </div>

              {/* AI status strip under camera */}
              <div className="ai-status-strip">
                <div className="ai-interviewer-avatar ai-status-avatar">
                  <Bot size={16} color="#ffffff" />
                  {isAiSpeaking && <span className="ai-avatar-speaking" />}
                </div>
                <div className="ai-status-info">
                  <div className="ai-status-name">AI Interviewer</div>
                  <div className="ai-status-state">
                    {isEvaluating ? <span className="ai-state-thinking"><Loader2 size={10} className="ai-spin" /> Thinking...</span>
                      : isAiSpeaking ? <span className="ai-state-speaking">Speaking...</span>
                        : question ? <span className="ai-state-listening">Listening for answer</span>
                          : <span>Starting interview...</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className={`ai-speaker-play-btn ${!voiceEnabled ? "voice-disabled" : ""}`}
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    voiceEnabledRef.current = next;
                    if (!next) stopSpeaking();
                    else if (question?.question) speakQuestion(question.question);
                  }}
                  title={voiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
                >
                  {voiceEnabled ? (
                    <Volume2 size={16} className={`ai-speak-icon ${isAiSpeaking ? "speaking-pulse" : ""}`} />
                  ) : (
                    <VolumeX size={16} className="muted-icon" />
                  )}
                </button>
              </div>

              {/* Proctoring Warning Violations Log */}
              {proctoringWarnings.length > 0 && (
                <div className={`ai-proctoring-log-card ${isInterviewFlagged ? "flagged-border" : ""}`}>
                  <div className="proctoring-log-header">
                    <ShieldAlert size={14} className="ai-icon-amber" />
                    <span>Proctoring Violations Log ({proctoringWarnings.length})</span>
                    {isInterviewFlagged && (
                      <span className="proctoring-flagged-tag">FLAGGED FOR REVIEW</span>
                    )}
                  </div>
                  <ul className="proctoring-log-list">
                    {proctoringWarnings.map((warn) => (
                      <li key={warn.id} className="proctoring-log-item">
                        <span className="log-time">{warn.timestamp}</span>
                        <span className="log-msg">{warn.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Unified chat thread ── */}
            <div className="interview-practice-card ai-interviewer-card">
              {/* Scrollable chat history */}
              <div className="ai-conversation">
                <div className="ai-conv-title">Conversation</div>
                {conversation.length === 0 ? (
                  <div className="ai-conv-empty">
                    <Loader2 size={20} className="ai-spin ai-conv-spin-icon" />
                    Waiting for the first question...
                  </div>
                ) : (
                  <div className="ai-conv-list">
                    {conversation.map((c, idx) => {
                      if (c.type === "q") {
                        return (
                          <div className="ai-bubble ai-bubble-ai" key={idx}>
                            <span className="ai-bubble-tag">Q{c.index}</span>
                            <span>{c.text}</span>
                          </div>
                        );
                      }
                      if (c.type === "a") {
                        return (
                          <div className="ai-bubble ai-bubble-user" key={idx}>
                            {c.text}
                          </div>
                        );
                      }
                      return null;
                    })}
                    <div ref={conversationEndRef} />
                  </div>
                )}
              </div>



              {/* Inline answer input at the bottom */}
              <div className="ai-answer-input-container">
                {isRecording && (
                  <div className="ai-listening-indicator">
                    <span className="ai-listening-dot" /> Listening — speak now...
                  </div>
                )}
                <textarea
                  className="interview-textarea ai-answer-textarea"
                  placeholder={
                    !question
                      ? "Waiting for the AI question..."
                      : SpeechRecognitionCtor
                        ? "Speak via mic or type your answer here..."
                        : "Type your answer here..."
                  }
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!question || isEvaluating}
                />
                <div className="interview-action-row ai-action-row">
                  {SpeechRecognitionCtor && (
                    <button
                      type="button"
                      className={`ai-mic-btn ${isRecording ? "recording" : ""}`}
                      onClick={toggleRecording}
                      disabled={!question || isEvaluating}
                      title={isRecording ? "Stop Listening" : "Start Voice Typing"}
                    >
                      {isRecording ? <Mic size={15} /> : <MicOff size={15} />}
                      <span>{isRecording ? "Listening..." : "Voice Input"}</span>
                    </button>

                  )}
                  <button
                    type="button"
                    id="submit-answer-btn"
                    className="interview-next-btn"
                    onClick={sendAnswer}
                    disabled={!answer.trim() || isEvaluating || !socketConnected || !question}
                  >
                    {isEvaluating ? (
                      <><Loader2 size={15} className="ai-spin" /> Evaluating...</>
                    ) : (
                      <>Submit Answer <Send size={15} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {/* ─── RESULT PHASE ──────────────────────────────────────────────────────────────────────── */}
      {phase === "result" && (() => {
        const overallScore = result?.scorecard?.overallScore ?? 0;
        const scoreTier = overallScore >= 70 ? "pass" : overallScore >= 40 ? "warn" : "fail";
        const reasonStr = (result?.endReason || "").toLowerCase();
        const isAutoSubmitted = reasonStr.includes("auto-submit") || reasonStr.includes("proctoring") || reasonStr.includes("warning");
        const isTimeExpired = reasonStr.includes("time expired") || reasonStr.includes("duration");
        const warningsList = result?.proctoringWarnings || [];

        return (
          <div className="ai-result-wrapper">

            {/* ── INTERVIEW SUBMISSION & STATUS REPORT BANNER ── */}
            <div className={`ai-report-status-banner ${isAutoSubmitted ? "banner-terminated" : isTimeExpired ? "banner-time-expired" : "banner-completed"}`}>
              <div className="status-banner-left">
                <div className={`status-banner-icon-box ${isAutoSubmitted ? "icon-box-terminated" : isTimeExpired ? "icon-box-warn" : "icon-box-success"}`}>
                  {isAutoSubmitted ? (
                    <ShieldAlert size={26} />
                  ) : isTimeExpired ? (
                    <Timer size={26} />
                  ) : (
                    <CheckCircle2 size={26} />
                  )}
                </div>
                <div className="status-banner-text">
                  <div className="status-banner-headline">
                    {isAutoSubmitted
                      ? "Interview Auto-Submitted: Proctoring Violations Limit Reached"
                      : isTimeExpired
                        ? "Interview Auto-Submitted: Session Time Limit Reached"
                        : "Interview Successfully Completed & Evaluated"}
                  </div>
                  <div className="status-banner-desc">
                    <span className="status-banner-desc-label">Termination & Submission Reason:</span>{" "}
                    <span className="status-banner-desc-text">
                      {result?.endReason || (overallScore > 0 ? "Completed: All interview questions evaluated." : "Interview session concluded.")}
                    </span>
                  </div>
                </div>
              </div>
              {isAutoSubmitted && (
                <div className="status-banner-pill-danger">
                  <AlertTriangle size={15} /> 3 Strikes Auto-Submit
                </div>
              )}
            </div>

            {/* Proctoring Audit Log if any strikes/warnings were recorded */}
            {warningsList.length > 0 && (
              <div className="ai-proctoring-audit-card">
                <div className="ai-proctoring-audit-header">
                  <ShieldAlert size={18} className="audit-alert-icon" />
                  <span className="audit-header-title">Proctoring AI Audit Log & Incident Details</span>
                  <span className="audit-count-badge">
                    {warningsList.length} Incident{warningsList.length !== 1 ? "s" : ""} Recorded
                  </span>
                </div>
                <div className="ai-proctoring-audit-list">
                  {warningsList.map((warn, wIdx) => (
                    <div key={wIdx} className="ai-proctoring-audit-row">
                      <span className="audit-strike-badge">Strike {warn.warningCount || (wIdx + 1)}</span>
                      <span className="audit-type-tag">{warn.type?.replace(/_/g, " ")}</span>
                      <span className="audit-msg-text">{warn.message}</span>
                      <span className="audit-timestamp">{warn.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── HERO SCORECARD ── */}
            <div className="ai-report-hero">
              <div className="ai-report-top-nav">
                <button type="button" className="ai-back-nav-btn" onClick={resetInterview} title="Return to Interview Setup">
                  <ArrowLeft size={15} /> Back to Setup
                </button>
                <div className="ai-report-date-badge">
                  <Bot size={13} /> AI Proctored Session
                </div>
              </div>

              <div className="ai-report-label">
                <Sparkles size={13} /> PERFORMANCE REPORT
              </div>
              <h2 className="ai-report-title">AI Interview Completed</h2>
              
              <div className="ai-report-meta-row">
                {result?.durationSeconds ? (
                  <span className="ai-report-meta-pill">
                    <Timer size={13} /> {Math.floor(result.durationSeconds / 60)}m {result.durationSeconds % 60}s Duration
                  </span>
                ) : null}
                {result?.questionsAnswered ? (
                  <span className="ai-report-meta-pill">
                    <CheckCircle2 size={13} /> {result.questionsAnswered} Question{result.questionsAnswered !== 1 ? "s" : ""} Evaluated
                  </span>
                ) : null}
              </div>

              {/* Score ring */}
              <div className="ai-score-ring-wrap">
                <div
                  className={`ai-score-ring-outer score-tier-${scoreTier}`}
                  style={{ "--score-deg": `${overallScore * 3.6}deg` }}
                >
                  <div className="ai-score-ring-inner">
                    <span className={`ai-score-percent-val score-tier-${scoreTier}`}>
                      {overallScore}%
                    </span>
                    <span className="ai-score-ring-sub">OVERALL SCORE</span>
                  </div>
                </div>
                <span className={`ai-score-grade-pill grade-tier-${scoreTier}`}>
                  {result?.scorecard?.grade ?? (overallScore >= 70 ? "Good Performance" : overallScore >= 40 ? "Needs Refinement" : "Needs Improvement")}
                </span>
              </div>

              {/* 4-metric breakdown */}
              <div className="ai-metrics-grid">
                {[
                  { label: "Technical", value: result?.scorecard?.technical ?? 0, type: "tech", icon: Code2, desc: "Syntax & Core Knowledge" },
                  { label: "Communication", value: result?.scorecard?.communication ?? 0, type: "comm", icon: MessageSquare, desc: "Clarity & Articulation" },
                  { label: "Problem Solving", value: result?.scorecard?.problemSolving ?? 0, type: "prob", icon: BrainCircuit, desc: "Logic & Analytical Flow" },
                  { label: "Confidence", value: result?.scorecard?.confidence ?? (overallScore === 0 ? 0 : Math.min(100, Math.round((overallScore * 0.9) + 10))), type: "conf", icon: Activity, desc: "Delivery & Assurance" },
                ].map(({ label, value, type, icon: IconComp, desc }) => (
                  <div key={label} className={`ai-metric-card ai-metric-${type}`}>
                    <div className="ai-metric-card-top">
                      <div className={`ai-metric-icon-wrap ai-metric-icon-${type}`}>
                        <IconComp size={16} />
                      </div>
                      <span className="ai-metric-val">{value}%</span>
                    </div>
                    <div className="ai-metric-label">{label}</div>
                    <div className="ai-metric-sub">{desc}</div>
                    <div className="ai-metric-track">
                      <div className="ai-metric-fill" style={{ width: `${Math.max(4, value)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── OVERALL FEEDBACK ── */}
            {result?.scorecard?.feedback && (
              <div className="ai-overall-feedback-card">
                <div className="ai-overall-feedback-title">Overall Feedback</div>
                <p className="ai-overall-feedback-text">{result.scorecard.feedback}</p>
              </div>
            )}

            {/* ── PER-QUESTION BREAKDOWN ── */}
            {result?.evaluationHistory && result.evaluationHistory.length > 0 ? (
              <div className="ai-q-breakdown-card">
                <div className="ai-q-breakdown-title">Question-by-Question Breakdown</div>
                <div className="ai-q-breakdown-list">
                  {result.evaluationHistory.map((item, idx) => {
                    const score = item.score ?? 0;
                    const itemTier = score >= 7 ? "pass" : score >= 4 ? "warn" : "fail";
                    return (
                      <div key={idx} className="ai-q-item">
                        {/* Question header */}
                        <div className="ai-q-item-header">
                          <div className="ai-q-item-header-left">
                            <span className="ai-q-badge">Q{idx + 1}</span>
                            <span className="ai-q-text">{item.question || item.q}</span>
                          </div>
                          <div className={`ai-q-score-box score-tier-${itemTier}`}>
                            <span className="ai-q-score-num">{score}</span>
                            <span className="ai-q-score-total">/10</span>
                          </div>
                        </div>

                        <div className="ai-q-item-body">
                          {/* Student answer */}
                          <div>
                            <div className="ai-q-sub-lbl muted">Your Answer</div>
                            <div className="ai-q-user-ans-box">
                              {item.answer || item.a || <em className="ai-q-user-ans-empty">No answer provided</em>}
                            </div>
                          </div>

                          {/* AI Feedback */}
                          <div className={`ai-q-feedback-box score-tier-${itemTier}`}>
                            <div className="ai-q-sub-lbl">
                              {score >= 7 ? "AI Feedback" : score >= 4 ? "Areas to Refine" : "Where You Went Wrong"}
                            </div>
                            <div className="ai-q-feedback-text">{item.feedback || item.f || "No feedback available."}</div>
                          </div>

                          {/* Key concepts & takeaways */}
                          {(() => {
                            const rawModelAns = item.modelAnswer || item.ma || "";
                            const questionText = item.question || item.q || "";
                            if (!rawModelAns || rawModelAns === "AI evaluation unavailable. Review the topic independently.") return null;

                            let cleanModelAns = rawModelAns;
                            if (questionText && cleanModelAns.includes(questionText)) {
                              cleanModelAns = cleanModelAns.replace(questionText, "").replace(/["“”'']/g, "").trim();
                            }
                            cleanModelAns = cleanModelAns
                              .replace(/^a\s+(proper|technical|correct|gold-standard)\s+answer\s+to\s+.*?\s+covering/i, "Key concepts:")
                              .replace(/^a\s+(proper|technical|correct|gold-standard)\s+response\s+should\s+explain/i, "Key concepts:")
                              .replace(/^a\s+proper\s+technical\s+answer\s+to\b/i, "Key concepts:")
                              .replace(/^covering\s+core\s+concepts\s+in\s+/i, "Key concepts in ")
                              .trim();

                            if (!cleanModelAns || cleanModelAns.length < 10 || /^key concepts:?$/i.test(cleanModelAns)) return null;

                            return (
                              <div className="ai-q-model-ans-box">
                                <div className="ai-q-model-ans-lbl">Key Concepts & Core Takeaways</div>
                                <div className="ai-q-model-ans-text">{cleanModelAns}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="ai-q-breakdown-card">
                <div className="ai-q-breakdown-title">Question-by-Question Breakdown</div>
                <div style={{ padding: "28px 20px", textAlign: "center", color: "#64748b", fontSize: "0.95rem", background: "#f8fafc", borderRadius: "10px", margin: "14px 0" }}>
                  {result?.questionsAnswered > 0 
                    ? "Detailed individual question breakdown was not archived for this session."
                    : "No questions were answered during this session. To get detailed question evaluations, complete questions during your live mock interview."}
                </div>
              </div>
            )}

            {/* ── STRENGTHS + IMPROVE + TOPICS ── */}
            <div className="ai-summary-3grid">
              {Array.isArray(result?.scorecard?.strengths) && result.scorecard.strengths.length > 0 && (
                <div className="ai-summary-card ai-card-strengths">
                  <div className="ai-summary-card-title">Strengths</div>
                  <ul className="ai-summary-card-list">
                    {result.scorecard.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(result?.scorecard?.improvementAreas) && result.scorecard.improvementAreas.length > 0 && (
                <div className="ai-summary-card ai-card-improve">
                  <div className="ai-summary-card-title">Areas to Improve</div>
                  <ul className="ai-summary-card-list">
                    {result.scorecard.improvementAreas.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(result?.scorecard?.recommendedTopics) && result.scorecard.recommendedTopics.length > 0 && (
                <div className="ai-summary-card ai-card-topics">
                  <div className="ai-summary-card-title">Recommended Study Topics</div>
                  <ul className="ai-summary-card-list">
                    {result.scorecard.recommendedTopics.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* ── READINESS + RETAKE ── */}
            <div className="ai-readiness-bar">
              {result?.scorecard?.readiness ? (
                <div>
                  <div className="ai-readiness-lbl">Interview Readiness</div>
                  <div className="ai-readiness-val">{result.scorecard.readiness}</div>
                </div>
              ) : <div />}
              <button type="button" className="ai-mic-btn ai-retake-btn" onClick={resetInterview}>
                <RotateCcw size={16} /> Take Another Interview
              </button>
            </div>

          </div>
        );
      })()}
    </div>
  );
}