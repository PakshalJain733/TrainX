import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { io } from "socket.io-client";

import { Bot, Camera, CameraOff, Mic, MicOff, Volume2, VolumeX, Send, Timer, Award, Sparkles, RotateCcw, Play, Video, XCircle, AlertTriangle, Loader2, ShieldAlert, Eye, UserX, Users, Flag, ArrowLeft } from "lucide-react";
import { apiFetch, getApiBaseUrl, getAuthToken } from "../../../utils/api";
import "../Styles/ST_AiInterview.css";

import aiInterviewerRef from "../../../assets/images/ai-interviewer-reference.png";
import CustomSelect from "../../../components/ui/CustomSelect";


const INTERVIEW_SECONDS = 5 * 60; // 5 minutes
const WARNING_SECONDS = 60;

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

  // Speech recognition
  const SpeechRecognitionCtor =
    typeof window !== "undefined"
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
  const consecutiveViolationsRef = useRef({ noFace: 0, device: 0, lookingAway: 0 });

  useEffect(() => {
    if (cameraState === "on") {
      hasCameraBeenTurnedOnRef.current = true;
    }
  }, [cameraState]);

  const triggerProctoringWarning = useCallback((type = "SUSPICIOUS_BEHAVIOR", customMsg = "") => {
    const nowMs = Date.now();

    // 5-second startup grace period: no false-positive warnings during initial stream setup
    if (nowMs - livePhaseStartTimeRef.current < 5000) {
      return;
    }

    const lastTimeMs = lastWarningTypeTimestampRef.current[type] || 0;
    if (nowMs - lastTimeMs < 6000) {
      return;
    }
    lastWarningTypeTimestampRef.current[type] = nowMs;

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
            endInterviewRef.current();
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

    const d = sessionData.details || {};
    const sc = d.scorecard || {};
    const overallScore = Number(sessionData.overall_score ?? d.overallScore ?? sc.overallScore ?? 0);
    const technical = Number(d.technical ?? sc.technical ?? overallScore);
    const communication = Number(d.communication ?? sc.communication ?? overallScore);
    const problemSolving = Number(d.problemSolving ?? sc.problemSolving ?? overallScore);

    const strengths = d.strengths || sc.strengths || (sessionData.feedback || d.feedback ? [sessionData.feedback || d.feedback] : []);
    const improvementAreas = d.weaknesses || d.improvementAreas || sc.improvementAreas || d.recommendations || [];
    const recommendedTopics = d.skillGaps || d.recommendedTopics || sc.recommendedTopics || [sessionData.interview_type || "General Technical Practice"];
    const feedback = sessionData.feedback || d.feedback || sc.feedback || "Interview completed successfully.";
    const readiness = d.readiness || sc.readiness || sessionData.grade || (overallScore >= 70 ? "Interview Ready" : "Practice Needed");
    const grade = sessionData.grade || sc.grade || (overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : "Needs Improvement");

    const scorecard = {
      overallScore,
      technical,
      communication,
      problemSolving,
      strengths,
      improvementAreas,
      recommendedTopics,
      feedback,
      readiness,
      grade,
    };

    let history = d.evaluationHistory || sc.evaluationHistory || [];
    if (history.length === 0 && Array.isArray(d.questions)) {
      history = d.questions.map((q, idx) => ({
        question: q,
        answer: Array.isArray(d.answers) ? d.answers[idx] : "",
        score: Array.isArray(d.questionScores) ? d.questionScores[idx] : null,
        feedback: Array.isArray(d.questionFeedbacks) ? d.questionFeedbacks[idx] : "Recorded answer.",
        modelAnswer: Array.isArray(d.modelAnswers) ? d.modelAnswers[idx] : null,
      }));
    }

    setResult({
      scorecard,
      questionsAnswered: d.questionsAnswered ?? history.length,
      durationSeconds: d.durationSeconds ?? null,
      evaluationHistory: history,
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

  // Auto-start camera automatically as soon as interview page loads
  useEffect(() => {
    if ((phase === "setup" || phase === "live") && cameraState === "idle") {
      enableCamera();
    }
  }, [phase, cameraState, enableCamera]);

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

  // Real-Time Camera Proctoring & Gaze / Device Detection Monitor
  useEffect(() => {
    if (cameraState !== "on" || phase !== "live") return;

    // 400ms sampling interval for smooth, accurate, non-erratic proctoring
    const intervalId = setInterval(() => {
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
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frameData.data;

        let totalSum = 0;
        let skinPixels = 0;
        let topSkinPixels = 0;
        let bottomSkinPixels = 0;
        let activeScreenGlowPixels = 0;
        let roiPixelCount = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;

          totalSum += brightness;

          const pixelIndex = i / 4;
          const x = pixelIndex % 160;
          const y = Math.floor(pixelIndex / 160);

          // Active central region where candidate's face & eyes/head appear
          if (x >= 20 && x <= 140 && y >= 10 && y <= 110) {
            roiPixelCount++;

            // 1. Strict human skin tone detection
            const isSkin = r > 50 && g > 30 && b > 20 && r > g && r > b && (r - g) >= 8;
            if (isSkin) {
              skinPixels++;
              if (y < 65) topSkinPixels++;
              else bottomSkinPixels++;
            }

            // 2. Mobile Phone Screen Glow / Active Electronic Display:
            // High-luminance screen light (r,g,b > 210) in front of face
            if (r > 210 && g > 210 && b > 210) {
              activeScreenGlowPixels++;
            }
          }
        }

        const avgBrightness = totalSum / pixelCount;
        const skinRatio = roiPixelCount > 0 ? skinPixels / roiPixelCount : 0;
        const screenGlowRatio = roiPixelCount > 0 ? activeScreenGlowPixels / roiPixelCount : 0;
        const now = Date.now();

        // 10-second startup grace period (gives user time to settle in before any checks activate)
        if (now - livePhaseStartTimeRef.current < 10000) return;

        // Enforce 8 seconds cooldown between consecutive warnings
        if (now - lastWarningTimeRef.current < 8000) return;

        // ─── CHECK A: Eye Gaze / Head Turned Away continuously (LOOKING_AWAY) ───
        const isLookingAway = skinRatio > 0.06 && (topSkinPixels < 5 || bottomSkinPixels / (topSkinPixels + 1) > 5.0);

        if (isLookingAway) {
          consecutiveViolationsRef.current.lookingAway += 1;
          if (consecutiveViolationsRef.current.lookingAway >= 9) { // 9 ticks x 400ms = 3.6s continuous looking away
            lastWarningTimeRef.current = now;
            consecutiveViolationsRef.current.lookingAway = 0;
            triggerProctoringWarning(
              "LOOKING_AWAY",
              "Candidate continuously looking away from camera screen!"
            );
          }
        } else {
          consecutiveViolationsRef.current.lookingAway = Math.max(0, consecutiveViolationsRef.current.lookingAway - 1);
        }

        // ─── CHECK B: Electronic Device / Active Screen Glow (DEVICE_DETECTED) ───
        const isDeviceInView = screenGlowRatio > 0.15;

        if (isDeviceInView) {
          consecutiveViolationsRef.current.device += 1;
          if (consecutiveViolationsRef.current.device >= 7) { // 7 ticks x 400ms = 2.8s continuous device display
            lastWarningTimeRef.current = now;
            consecutiveViolationsRef.current.device = 0;
            triggerProctoringWarning(
              "DEVICE_DETECTED",
              "Mobile phone or electronic copying device detected in camera frame!"
            );
          }
        } else {
          consecutiveViolationsRef.current.device = Math.max(0, consecutiveViolationsRef.current.device - 1);
        }

        // ─── CHECK C: Face Covered / No Face in View (NO_FACE) ───
        const isFaceObscured = (skinRatio < 0.025 && !isDeviceInView) || avgBrightness < 4;

        if (isFaceObscured) {
          consecutiveViolationsRef.current.noFace += 1;
          if (consecutiveViolationsRef.current.noFace >= 10) { // 10 ticks x 400ms = 4.0s continuous no-face
            lastWarningTimeRef.current = now;
            consecutiveViolationsRef.current.noFace = 0;
            triggerProctoringWarning(
              "NO_FACE",
              "Face not detected in camera view! Please look at the camera."
            );
          }
        } else {
          consecutiveViolationsRef.current.noFace = Math.max(0, consecutiveViolationsRef.current.noFace - 1);
        }
      } catch (e) {
        console.warn("Proctoring frame warning:", e);
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
        if (endInterviewRef.current) endInterviewRef.current();
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer]);

  // ─── Finish interview ────────────────────────────────────────────────────────
  const finishInterview = useCallback(
    (summary) => {
      if (completedRef.current) return;
      completedRef.current = true;
      endRequestedRef.current = true;
      firstQuestionRef.current = false;
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
      const finalResult = {
        scorecard: scorecard || null,
        questionsAnswered: questionsAnswered ?? (evaluationHistory?.length ?? 0),
        durationSeconds: durationSeconds ?? Math.round((Date.now() - (timerStartRef.current ?? Date.now())) / 1000),
        evaluationHistory: evaluationHistory || [],
      };
      setResult(finalResult);
      setPhase("result");

      // Save via REST as fail-safe if needed, then refresh past interviews
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

      // Exit full screen when interview finishes
      if (typeof document !== "undefined" && document.fullscreenElement) {
        document.exitFullscreen().catch((err) => console.log(err));
      }
    },
    [stopTimer, stopRecognition, stopCamera, stopSpeaking, role, topic, fetchPastInterviews]
  );

  // ─── End interview ───────────────────────────────────────────────────────────
  const endInterview = useCallback(() => {
    if (completedRef.current || endRequestedRef.current) return;
    endRequestedRef.current = true;
    stopRecognition();
    stopTimer();
    stopSpeaking();

    const socket = socketRef.current;
    if (socket && socket.connected && sessionIdRef.current) {
      socket.emit("interview:end", { sessionId: sessionIdRef.current });
      // Timeout fallback if server doesn't respond
      setTimeout(() => {
        if (phaseRef.current !== "result") finishInterview(null);
      }, 8000);
    } else {
      finishInterview(null);
    }
  }, [stopRecognition, stopTimer, stopSpeaking, finishInterview]);

  // Wire endInterview into ref so startTimer can call it
  useEffect(() => {
    endInterviewRef.current = endInterview;
  }, [endInterview]);

  // ─── Anti-Cheat: Tab switch auto-submit + copy-paste block ──────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && phaseRef.current === "live" && !endRequestedRef.current) {
        triggerProctoringWarning("TAB_SWITCH", "Tab switching or window minimizing detected during live interview!");
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
        e.preventDefault();
        triggerProctoringWarning("RIGHT_CLICK", "Right-click context menu opened during live interview!");
      }
    });

    return () => {
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

    const apiBase = getApiBaseUrl();
    let base = apiBase.replace(/\/api\/v1\/?$/, "") || "";
    if (!base.startsWith("http://") && !base.startsWith("https://")) {
      if (typeof window !== "undefined") {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        base = `${protocol}//${hostname}:5000`;
      } else {
        base = "http://localhost:5000";
      }
    }

    const socket = io(`${base}/interviews`, {
      auth: { token },
      query: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 500,
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
    lastWarningTimeRef.current = startNow + 5000;
    consecutiveViolationsRef.current = { noFace: 0, device: 0, lookingAway: 0 };
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

    // Request full screen when starting
    if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    }

    // Connect socket — must happen after phase change so UI renders
    setTimeout(() => connectAndStart(), 50);
  }, [role, topic, customTopic, compatibility, stopTimer, connectAndStart]);

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

  // ─── Escape Key & Fullscreen Exit Handler (Stop & Return to Setup Screen) ─
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && phaseRef.current === "live") {
        e.preventDefault();
        resetInterview();
      }
    };

    const handleFullscreenChange = () => {
      if (typeof document !== "undefined" && !document.fullscreenElement && phaseRef.current === "live") {
        resetInterview();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [resetInterview]);

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
                  {cameraState === "on" ? <Video size={18} /> : <CameraOff size={18} />}
                </div>
                <div>
                  <div className="ai-meta-val">
                    Camera {cameraState === "on" ? "Active" : cameraState === "denied" ? "Blocked" : "Standby"}
                  </div>
                  <div className="ai-meta-lbl">Mandatory Proctoring Stream</div>
                </div>
              </div>
              <div className={`ai-meta-item ${SpeechRecognitionCtor ? "" : "ai-meta-warn"}`}>
                <div className="ai-meta-icon"><Mic size={18} /></div>
                <div>
                  <div className="ai-meta-val">
                    Microphone {SpeechRecognitionCtor ? "Supported" : "Unavailable"}
                  </div>
                  <div className="ai-meta-lbl">
                    {SpeechRecognitionCtor ? "Voice-to-text ready" : "Typing fallback will be used"}
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
              <div className="ai-error-banner">
                <AlertTriangle size={15} /> {errorMsg}
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
            <Award size={18} className="text-indigo-600 shrink-0" />
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
                  <button type="button" className="view-suggestions-btn">
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
                {firstQuestionRef.current ? fmtTime(remaining) : "Waiting..."}
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
                onClick={endInterview}
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
                    <ShieldAlert size={14} className="text-amber-500 shrink-0" />
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
        return (
          <div className="ai-result-wrapper">

            {/* ── HERO SCORECARD ── */}
            <div className="ai-report-hero">
              <div className="ai-report-hero-bg" />
              <div className="ai-report-top-nav">
                <button type="button" className="ai-back-nav-btn" onClick={resetInterview} title="Return to Interview Setup">
                  <ArrowLeft size={16} /> Back to Setup
                </button>
              </div>
              <div className="ai-report-label">Interview Report</div>
              <h2 className="ai-report-title">AI Interview Completed</h2>
              <p className="ai-report-meta">
                {result?.durationSeconds ? `${Math.floor(result.durationSeconds / 60)}m ${result.durationSeconds % 60}s` : ""}
                {result?.questionsAnswered ? `  •  ${result.questionsAnswered} Question${result.questionsAnswered !== 1 ? "s" : ""} Answered` : ""}
              </p>

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
                  </div>
                </div>
                <span className="ai-score-grade-pill">
                  {result?.scorecard?.grade ?? "N/A"}
                </span>
              </div>

              {/* 4-metric breakdown */}
              <div className="ai-metrics-grid">
                {[
                  { label: "Technical", value: result?.scorecard?.technical ?? 0, type: "tech" },
                  { label: "Communication", value: result?.scorecard?.communication ?? 0, type: "comm" },
                  { label: "Problem Solving", value: result?.scorecard?.problemSolving ?? 0, type: "prob" },
                  { label: "Confidence Level", value: result?.scorecard?.confidence ?? (overallScore === 0 ? 0 : Math.min(100, Math.round((overallScore * 0.9) + 10))), type: "conf" },
                ].map(({ label, value, type }) => (
                  <div key={label} className={`ai-metric-card ai-metric-${type}`}>
                    <div className="ai-metric-val">{value}%</div>
                    <div className="ai-metric-label">{label}</div>
                    <div className="ai-metric-track">
                      <div className="ai-metric-fill" style={{ width: `${value}%` }} />
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
            {result?.evaluationHistory && result.evaluationHistory.length > 0 && (
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
                              {score >= 7 ? "✅ AI Feedback" : score >= 4 ? "⚠️ AI Feedback" : "❌ Where You Went Wrong"}
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
                                <div className="ai-q-model-ans-lbl">💡 Key Concepts & Core Takeaways</div>
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
            )}

            {/* ── STRENGTHS + IMPROVE + TOPICS ── */}
            <div className="ai-summary-3grid">
              {result?.scorecard?.strengths?.length > 0 && (
                <div className="ai-summary-card ai-card-strengths">
                  <div className="ai-summary-card-title">✅ Strengths</div>
                  <ul className="ai-summary-card-list">
                    {result.scorecard.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {result?.scorecard?.improvementAreas?.length > 0 && (
                <div className="ai-summary-card ai-card-improve">
                  <div className="ai-summary-card-title">❌ Areas to Improve</div>
                  <ul className="ai-summary-card-list">
                    {result.scorecard.improvementAreas.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {result?.scorecard?.recommendedTopics?.length > 0 && (
                <div className="ai-summary-card ai-card-topics">
                  <div className="ai-summary-card-title">📚 Study These Topics</div>
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