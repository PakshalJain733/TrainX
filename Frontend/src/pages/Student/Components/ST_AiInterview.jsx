import React, { useState, useEffect, useRef } from "react";

import { io } from "socket.io-client";

import {
  Bot,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Timer,
  Award,
  Sparkles,
  RotateCcw,
  Play,
  Video,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { apiFetch, getApiBaseUrl } from "../../../utils/api";
import "../Styles/ST_AiInterview.css";

import aiInterviewerRef from "../../../assets/images/ai-interviewer-reference.png";


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

export default function AIInterview() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const recognitionRef = useRef(null);
  const startAnswerRef = useRef("");
  
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
  return sessionStorage.getItem("token") || localStorage.getItem("token") || "";
}

  const [phase, setPhase] = useState("setup"); // setup | live | result
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [topic, setTopic] = useState(TOPIC_OPTIONS[0]);

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

  useEffect(() => {
    // Fetch user past interview evaluations
    apiFetch("/interviews/history")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setPastInterviewsList(res.data);
        } else {
          setPastInterviewsList([]);
        }
      })
      .catch(() => setPastInterviewsList([]));
  }, []);

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

  // Past interviews
  const [pastInterviews, setPastInterviews] = useState([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [pastError, setPastError] = useState("");

  const studentName =
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(
              localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
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

  const handleNext = async () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsRecording(false);
    }
    const currentQ = questionsList[currentIdx] || {};
    const userAns = answer.trim() || "Candidate provided verbal answer.";

    setIsEvaluating(true);

    let evalResult = {
      score: 78,
      feedback: "Structured explanation demonstrating solid understanding of concepts.",
      strengths: ["Clear terminology", "Direct answer to prompt"],
      improvements: ["Include more specific real-world implementation details"],
    };

    try {
      const res = await apiFetch("/ai-interview/evaluate", {
        method: "POST",
        body: JSON.stringify({
          question: currentQ?.question || "",
          answer: userAns,
          jobRole: selectedRole || "Software Engineer",
        }),
      });
      if (res && (res.data || res.evaluation)) {
        evalResult = res.data || res.evaluation;
      }
    } catch (e) {
      console.warn("AI evaluation fallback:", e.message);
    }

    const updatedAnswers = [
      ...answers,
      {
        questionId: currentQ?.id || currentIdx,
        question: currentQ?.question || "",
        userAnswer: userAns,
        evaluation: evalResult,
      },
    ];
    setAnswers(updatedAnswers);
    setAnswer("");
    setIsEvaluating(false);

    if (currentIdx + 1 < questionsList.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setPhase("completed");
    }
  };

  // ─── TTS helpers ────────────────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {

      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
  }, []);

  const speakQuestion = useCallback((text) => {
    if (!voiceEnabledRef.current) return;
    setIsAiSpeaking(true);
    speakNow(text, () => setIsAiSpeaking(false));
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
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraState("denied");
      setErrorMsg("Camera permission denied. You can continue without video.");
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameraState === "on") stopCamera();
    else enableCamera();
  }, [cameraState, enableCamera, stopCamera]);

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
      videoRef.current.play().catch(() => {});
    }
  }, [cameraState, phase]);

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
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(transcript);
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
  }, [SpeechRecognitionCtor, stopSpeaking]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecognition();
    else startRecognition();
  }, [isRecording, stopRecognition, startRecognition]);

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
      setResult({
        scorecard: scorecard || null,
        questionsAnswered: questionsAnswered ?? (evaluationHistory?.length ?? 0),
        durationSeconds: durationSeconds ?? Math.round((Date.now() - (timerStartRef.current ?? Date.now())) / 1000),
        evaluationHistory: evaluationHistory || [],
      });
      setPhase("result");
      
      // Exit full screen when interview finishes
      if (typeof document !== "undefined" && document.fullscreenElement) {
        document.exitFullscreen().catch((err) => console.log(err));
      }
    },
    [stopTimer, stopRecognition, stopCamera, stopSpeaking]
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
      // Only trigger during a live interview that hasn't already ended
      if (document.hidden && phaseRef.current === "live" && !endRequestedRef.current) {
        // endInterview emits interview:end to the socket server.
        // The server will compute the final scorecard and emit back,
        // which triggers finishInterview() with the full report.
        if (endInterviewRef.current) endInterviewRef.current();
      }
    };

    const preventCopy = (e) => {
      if (phaseRef.current === "live") {
        e.preventDefault();
        alert("Copying and pasting is disabled during the AI interview.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("contextmenu", (e) => {
      if (phaseRef.current === "live") e.preventDefault();
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const base = apiBase.replace(/\/api\/v1\/?$/, "") || "";

    const socket = io(`${base}/interviews`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: false, // we handle reconnection manually
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setErrorMsg("");
    });

    socket.on("disconnect", (reason) => {
      setSocketConnected(false);
      if (!completedRef.current && !endRequestedRef.current) {
        setErrorMsg(`Connection lost (${reason}). Your answers so far are preserved.`);
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

      setQuestion(q);
      setAnswer("");
      setConversation((prev) => [
        ...prev,
        { type: "q", index: q.index, text: q.question, topic: q.topic },
      ]);

      // Auto-speak the question
      if (voiceEnabledRef.current) {
        speakQuestion(q.question);
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
    const sessionId = `student-${Date.now()}`;
    socket.emit("interview:start", {
      sessionId,
      role,
      topic,
      difficulty: "Medium",
      totalQuestions: 12,
    });
  }, [role, topic, startTimer, speakQuestion, finishInterview]);

  // ─── Start Interview ─────────────────────────────────────────────────────────
  const startInterview = useCallback(() => {
    if (!role.trim()) {
      setErrorMsg("Please choose a target role to begin.");
      return;
    }
    // Reset all state
    completedRef.current = false;
    endRequestedRef.current = false;
    firstQuestionRef.current = false;
    timerActiveRef.current = false;
    stopTimer();
    setWarningShown(false);
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
  }, [role, stopTimer, connectAndStart]);

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
    
    // Exit full screen if resetting
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer, stopRecognition, stopCamera, stopSpeaking]);

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

  // ─── Load past interviews ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPastLoading(true);
    apiFetch("/interviews").then((res) => {
      if (cancelled) return;
      setPastLoading(false);
      if (res && Array.isArray(res.data)) setPastInterviews(res.data);
      else if (res?.error) setPastError(res.error);
    });
    return () => { cancelled = true; };
  }, [phase]);

  const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="ai-interview-page stack-6">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <span>Live AI Interview Simulation</span>
        </h2>
        <p className="student-header-desc">
          5-minute voice-driven technical interview with real-time AI questions, speech recognition and instant evaluation.
        </p>
      </div>

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
                  <div className="ai-meta-lbl">Optional video preview</div>
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
              <label className="ai-setup-field">
                <span>Target Role</span>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="ai-setup-field">
                <span>Interview Topic</span>
                <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {TOPIC_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>

            {errorMsg && (
              <div className="ai-error-banner">
                <AlertTriangle size={15} /> {errorMsg}
              </div>
            )}

            <div className="ai-setup-buttons">
              <button
                type="button"
                className="ai-start-interview-btn"
                onClick={startInterview}
              >
                <Play size={18} fill="currentColor" /> Start Interview
              </button>
            </div>
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

          {errorMsg && (
            <div className="ai-error-banner">
              <AlertTriangle size={15} /> {errorMsg}
            </div>
          )}

          <div className="ai-live-grid">
            {/* ── LEFT COLUMN: Webcam + AI status ── */}
            <div className="ai-left-column">
              <div className={`ai-camera-panel ${cameraState === "on" ? "" : "ai-camera-off-panel"}`}>
                {cameraState === "on" ? (
                  <video ref={videoRef} className="ai-camera-video" autoPlay playsInline muted />
                ) : (
                  <div className="ai-camera-placeholder">
                    {cameraState === "denied" ? (
                      <>
                        <XCircle size={32} />
                        <span>Camera permission denied</span>
                      </>
                    ) : cameraState === "unsupported" ? (
                      <>
                        <XCircle size={32} />
                        <span>Camera not supported</span>
                      </>
                    ) : (
                      <>
                        <Video size={32} />
                        <span>Camera Off</span>
                      </>
                    )}
                  </div>
                )}
                <div className="ai-camera-controls-bar">
                  <button
                    type="button"
                    className={`ai-cam-ctrl-btn ${cameraState === "on" ? "active" : ""}`}
                    onClick={toggleCamera}
                    title={cameraState === "on" ? "Turn Camera Off" : "Turn Camera On"}
                  >
                    {cameraState === "on" ? <Camera size={14} /> : <CameraOff size={14} />}
                    <span>{cameraState === "on" ? "Camera ON" : "Camera OFF"}</span>
                  </button>
                  <button
                    type="button"
                    className={`ai-cam-ctrl-btn ${camMicOn ? "active recording" : ""}`}
                    onClick={toggleCamMic}
                    title={camMicOn ? "Mute Webcam Mic" : "Unmute Webcam Mic"}
                  >
                    {camMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                    <span>{camMicOn ? "Mic ON" : "Mic OFF"}</span>
                  </button>
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

              {/* Response Area */}
              <textarea
                className="interview-textarea"
                placeholder="Speak using the mic button below or type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />

              {/* Action Bar: Mic Button + Next/Submit Button */}
              <div className="interview-action-row">
                <button
                  type="button"
                  className={`ai-mic-btn ${isRecording ? "recording" : ""}`}
                  onClick={toggleRecording}
                >
                  {isRecording ? <Mic size={16} /> : <MicOff size={16} />}
                  {isRecording ? "Listening... (Click to Stop)" : "Start Voice Answer"}
                </button>

                <button
                  className="interview-next-btn"
                  onClick={handleNext}
                  disabled={isEvaluating}
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


        <div className="past-interviews-grid">
          {pastInterviewsList.length === 0 ? (
            <div className="past-interviews-empty">
              No past AI interview evaluations found.
            </div>
          ) : (
            pastInterviewsList.map((item, idx) => (
              <div key={item.id || idx} className="past-interview-item">
                <div className="past-interview-top">
                  <div>
                    <h4 className="past-interview-title">{item.role || item.title || "AI Mock Interview"}</h4>
                    <p className="past-interview-date">{item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent")}</p>
                  </div>
                  <span className="past-interview-score-pill">{item.score || item.overallScore || 0}%</span>
                </div>

                <div className="past-interview-scores-row">
                  <div className="past-score-box">
                    <div className="past-score-val">{item.technical || item.technicalScore || 0}</div>
                    <div className="past-score-label">Technical</div>
                  </div>
                  <div className="past-score-box">
                    <div className="past-score-val">{item.problemSolving || item.problemSolvingScore || 0}</div>
                    <div className="past-score-label">Problem solving</div>
                  </div>
                  <div className="past-score-box">
                    <div className="past-score-val">{item.communication || item.communicationScore || 0}</div>
                    <div className="past-score-label">Communication</div>
                  </div>
                </div>

                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="past-interview-tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="past-tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      {/* ─── RESULT PHASE ──────────────────────────────────────────────────────────────────────── */}
      {phase === "result" && (() => {
        const overallScore = result?.scorecard?.overallScore ?? 0;
        const overallScoreColor = overallScore >= 70 ? "#10b981" : overallScore >= 40 ? "#f59e0b" : "#ef4444";
        return (
          <div className="ai-result-wrapper">

            {/* ── HERO SCORECARD ── */}
            <div className="ai-report-hero">
              <div className="ai-report-hero-bg" />
              <div className="ai-report-label">Interview Report</div>
              <h2 className="ai-report-title">AI Interview Completed</h2>
              <p className="ai-report-meta">
                {result?.durationSeconds ? `${Math.floor(result.durationSeconds / 60)}m ${result.durationSeconds % 60}s` : ""}
                {result?.questionsAnswered ? `  •  ${result.questionsAnswered} Question${result.questionsAnswered !== 1 ? "s" : ""} Answered` : ""}
              </p>

              {/* Score ring */}
              <div className="ai-score-ring-wrap">
                <div
                  className="ai-score-ring-outer"
                  style={{
                    background: `conic-gradient(${overallScoreColor} ${overallScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
                  }}
                >
                  <div className="ai-score-ring-inner">
                    <span className="ai-score-percent-val" style={{ color: overallScoreColor }}>
                      {overallScore}%
                    </span>
                  </div>
                </div>
                <span className="ai-score-grade-pill">
                  {result?.scorecard?.grade ?? "N/A"}
                </span>
              </div>

              {/* 3-metric breakdown */}
              <div className="ai-metrics-grid">
                {[
                  { label: "Technical", value: result?.scorecard?.technical ?? 0, color: "#3b82f6" },
                  { label: "Communication", value: result?.scorecard?.communication ?? 0, color: "#10b981" },
                  { label: "Problem Solving", value: result?.scorecard?.problemSolving ?? 0, color: "#a855f7" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="ai-metric-card">
                    <div className="ai-metric-val" style={{ color }}>{value}%</div>
                    <div className="ai-metric-label">{label}</div>
                    <div className="ai-metric-track">
                      <div className="ai-metric-fill" style={{ width: `${value}%`, background: color }} />
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
                    const scoreColor = score >= 7 ? "#10b981" : score >= 4 ? "#f59e0b" : "#ef4444";
                    const scoreBg = score >= 7 ? "#ecfdf5" : score >= 4 ? "#fffbeb" : "#fef2f2";
                    const scoreBorder = score >= 7 ? "#a7f3d0" : score >= 4 ? "#fde68a" : "#fecaca";
                    return (
                      <div key={idx} className="ai-q-item">
                        {/* Question header */}
                        <div className="ai-q-item-header">
                          <div className="ai-q-item-header-left">
                            <span className="ai-q-badge">Q{idx + 1}</span>
                            <span className="ai-q-text">{item.question || item.q}</span>
                          </div>
                          <div className="ai-q-score-box" style={{ background: scoreBg, border: `1.5px solid ${scoreBorder}` }}>
                            <span className="ai-q-score-num" style={{ color: scoreColor }}>{score}</span>
                            <span className="ai-q-score-total" style={{ color: scoreColor }}>/10</span>
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
                          <div className="ai-q-feedback-box" style={{ borderLeft: `4px solid ${scoreColor}` }}>
                            <div className="ai-q-sub-lbl" style={{ color: scoreColor }}>
                              {score >= 7 ? "✅ AI Feedback" : score >= 4 ? "⚠️ AI Feedback" : "❌ Where You Went Wrong"}
                            </div>
                            <div className="ai-q-feedback-text">{item.feedback || item.f || "No feedback available."}</div>
                          </div>

                          {/* Model answer */}
                          {item.modelAnswer && item.modelAnswer !== "AI evaluation unavailable. Review the topic independently." && (
                            <div className="ai-q-model-ans-box">
                              <div className="ai-q-model-ans-lbl">💡 Model Answer</div>
                              <div className="ai-q-model-ans-text">{item.modelAnswer}</div>
                            </div>
                          )}
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

      {/* Past Interviews */}
      {phase !== "live" && (
      <div className="past-interviews-card">
        <h3 className="past-interviews-header">Past Interviews</h3>
        <p className="past-interviews-subtitle">Your saved AI evaluation history</p>

        {pastLoading ? (
          <div className="ai-conv-empty">Loading interview history...</div>
        ) : pastError ? (
          <div className="ai-conv-empty">Could not load history ({pastError})</div>
        ) : pastInterviews.length === 0 ? (
          <div className="ai-conv-empty">
            No interviews yet. Complete your first AI interview to see results here.
          </div>
        ) : (
          <div className="past-interviews-grid">
            {pastInterviews.map((item) => (
              <div key={item.id} className="past-interview-item">
                <div className="past-interview-header">
                  <h4 className="past-interview-title">{item.interview_type}</h4>
                  <p className="past-interview-date">
                    {item.conducted_date ? new Date(item.conducted_date).toLocaleDateString() : "—"}
                  </p>
                </div>
                <span className="past-interview-score-pill">{item.overall_score ?? 0}%</span>
                <div className="past-interview-details">
                  <div className="past-score-box">
                    <div className="past-score-val">{item.overall_score ?? "—"}</div>
                    <div className="past-score-label">Overall</div>
                  </div>
                  <div className="past-score-box">
                    <div className="past-score-val">{item.grade || "—"}</div>
                    <div className="past-score-label">Grade</div>
                  </div>
                  <div className="past-score-box">
                    <div className="past-score-val">{item.status || "—"}</div>
                    <div className="past-score-label">Status</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      )}
    </div>
  );
}