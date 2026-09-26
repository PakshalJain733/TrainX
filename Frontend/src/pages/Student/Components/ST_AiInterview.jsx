import React, { useState, useEffect, useRef, useCallback } from "react";
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
import apiFetch, { getApiBaseUrl } from "../../../utils/api";
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

export default function AIInterview() {
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
  const recognitionRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  // Socket
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Interview state
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
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
  }, [phase]);

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

  // ─── Camera ─────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (videoRef.current) videoRef.current.srcObject = null;
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraState("idle");
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
            {/* ── LEFT COLUMN: Webcam + Answer Box ── */}
            <div className="ai-left-column">
              {/* Webcam panel with controls INSIDE at bottom */}
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

                {/* Controls INSIDE / at bottom of webcam panel */}
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

                  {SpeechRecognitionCtor && (
                    <button
                      type="button"
                      className={`ai-cam-ctrl-btn ${isRecording ? "active recording" : ""}`}
                      onClick={toggleRecording}
                      disabled={!question || isEvaluating}
                      title={isRecording ? "Stop Microphone" : "Start Microphone"}
                    >
                      {isRecording ? <Mic size={14} /> : <MicOff size={14} />}
                      <span>{isRecording ? "Mic ON" : "Mic OFF"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Answer Box */}
              <div className="ai-answer-card">
                <div className="ai-answer-header">
                  <span className="ai-answer-title">
                    {question ? `Answer – Q${question.index}` : "Your Answer"}
                  </span>
                  {question && <span className="interview-topic-badge">{question.topic}</span>}
                </div>

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

                {isRecording && (
                  <div className="ai-listening-indicator">
                    <span className="ai-listening-dot" /> Listening — speak now...
                  </div>
                )}

                <div className="interview-action-row" style={{ justifyContent: "flex-end", gap: "12px" }}>
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
                      <>
                        <Loader2 size={15} className="ai-spin" /> Evaluating...
                      </>
                    ) : (
                      <>Submit Answer <Send size={15} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: AI Interviewer ── */}
            <div className="interview-practice-card ai-interviewer-card">
              <div className="ai-interviewer-head">
                <div className="ai-interviewer-avatar">
                  <Bot size={24} color="#ffffff" />
                  {isAiSpeaking && <span className="ai-avatar-speaking" />}
                </div>
                <div>
                  <div className="ai-interviewer-name">AI Interviewer</div>
                  <div className="ai-interviewer-sub">
                    {isEvaluating ? (
                      <span className="ai-speaking-lbl">
                        <Loader2 size={12} className="ai-spin" /> Thinking...
                      </span>
                    ) : isAiSpeaking ? (
                      <span className="ai-speaking-lbl">Speaking...</span>
                    ) : question ? (
                      <span className="ai-waves-lbl">Listening for your answer</span>
                    ) : (
                      <span className="ai-waves-lbl">Starting interview...</span>
                    )}
                  </div>
                </div>

                {/* Single TTS toggle — right side of header */}
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
                    <Volume2 size={18} className={`ai-speak-icon ${isAiSpeaking ? "speaking-pulse" : ""}`} />
                  ) : (
                    <VolumeX size={18} className="muted-icon" />
                  )}
                </button>
              </div>

              {!hasTTS && (
                <div className="ai-unsupported-note">
                  Text-to-speech is not supported in this browser. Questions will be shown as text only.
                </div>
              )}

              {isAiSpeaking && (
                <div className="ai-voice-waves ai-waves-inline">
                  <span className="ai-wave-bar" />
                  <span className="ai-wave-bar" />
                  <span className="ai-wave-bar" />
                  <span className="ai-wave-bar" />
                  <span className="ai-wave-bar" />
                </div>
              )}

              {/* Current question */}
              <div className="ai-current-question">
                {question ? (
                  <>
                    <div className="ai-q-meta">
                      Question {question.index}
                      {question.total && <> / {question.total}</>}
                      {question.topic && <span className="ai-q-topic"> {question.topic}</span>}
                    </div>
                    <p className="ai-q-text">{question.question}</p>
                    {question.hint && <p className="ai-q-hint">💡 Hint: {question.hint}</p>}
                    <button
                      type="button"
                      className="ai-replay-btn"
                      onClick={replayQuestion}
                      title="Replay question aloud"
                    >
                      <Volume2 size={14} /> Replay
                    </button>
                  </>
                ) : (
                  <div className="ai-q-empty">
                    <Loader2 size={20} className="ai-spin" />
                    Waiting for the first question...
                  </div>
                )}
              </div>

              {/* Conversation history */}
              <div className="ai-conversation">
                <div className="ai-conv-title">Conversation</div>
                {conversation.length === 0 ? (
                  <div className="ai-conv-empty">The interviewer will ask your first question shortly.</div>
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
                      return (
                        <div className="ai-feedback-row" key={idx}>
                          <Sparkles size={14} />
                          <span>Score {c.score}/10 — {c.text}</span>
                        </div>
                      );
                    })}
                    <div ref={conversationEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── RESULT PHASE ────────────────────────────────────────────────────── */}
      {phase === "result" && (
        <div className="interview-practice-card ai-result-card">
          {result?.scorecard ? (
            <>
              <div className="ai-scorecard-hero">
                <Award size={44} className="ai-award-icon" />
                <h2 className="ai-scorecard-title">AI Interview Completed</h2>
                <p className="ai-scorecard-subtitle">
                  {result.durationSeconds
                    ? `Duration: ${Math.floor(result.durationSeconds / 60)}m ${result.durationSeconds % 60}s`
                    : ""}
                  {result.questionsAnswered
                    ? `  •  Questions Answered: ${result.questionsAnswered}`
                    : ""}
                </p>
                <div className="ai-score-big">{result.scorecard.overallScore}%</div>
                <div className="ai-grade-pill">{result.scorecard.grade}</div>

                <div className="ai-score-breakdown-grid">
                  <div className="ai-score-mini-card">
                    <div className="ai-mini-score-val-blue">{result.scorecard.technical ?? "—"}%</div>
                    <div className="ai-mini-score-label">Technical</div>
                  </div>
                  <div className="ai-score-mini-card">
                    <div className="ai-mini-score-val-green">{result.scorecard.communication ?? "—"}%</div>
                    <div className="ai-mini-score-label">Communication</div>
                  </div>
                  <div className="ai-score-mini-card">
                    <div className="ai-mini-score-val-purple">{result.scorecard.problemSolving ?? "—"}%</div>
                    <div className="ai-mini-score-label">Problem Solving</div>
                  </div>
                </div>
              </div>

              <div className="ai-result-grid">
                <div className="ai-diagnostic-box">
                  <h4 className="ai-diagnostic-title">AI Feedback</h4>
                  <p className="ai-diagnostic-text">{result.scorecard.feedback}</p>
                </div>

                {Array.isArray(result.scorecard.strengths) && result.scorecard.strengths.length > 0 && (
                  <div className="ai-diagnostic-box">
                    <h4 className="ai-diagnostic-title">Strengths</h4>
                    <ul className="ai-list">
                      {result.scorecard.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.scorecard.improvementAreas) && result.scorecard.improvementAreas.length > 0 && (
                  <div className="ai-diagnostic-box">
                    <h4 className="ai-diagnostic-title">Areas to Improve</h4>
                    <ul className="ai-list">
                      {result.scorecard.improvementAreas.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.scorecard.recommendedTopics) && result.scorecard.recommendedTopics.length > 0 && (
                  <div className="ai-diagnostic-box">
                    <h4 className="ai-diagnostic-title">Recommended Topics</h4>
                    <ul className="ai-list">
                      {result.scorecard.recommendedTopics.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="ai-action-row">
                <button type="button" className="ai-mic-btn ai-retake-btn" onClick={resetInterview}>
                  <RotateCcw size={16} /> Take Another Interview
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="ai-scorecard-hero">
                <Award size={44} className="ai-award-icon" />
                <h2 className="ai-scorecard-title">Interview Session Ended</h2>
                <p className="ai-scorecard-subtitle">
                  {result?.questionsAnswered
                    ? `You answered ${result.questionsAnswered} question${result.questionsAnswered !== 1 ? "s" : ""}.`
                    : "Your session has been saved."}
                </p>
              </div>
              <div className="ai-result-stats">
                <div className="past-score-box">
                  <div className="past-score-val">{result?.questionsAnswered ?? 0}</div>
                  <div className="past-score-label">Questions Answered</div>
                </div>
                <div className="past-score-box">
                  <div className="past-score-val">{fmtTime(result?.durationSeconds ?? 0)}</div>
                  <div className="past-score-label">Duration</div>
                </div>
              </div>
              <div className="ai-action-row">
                <button type="button" className="ai-mic-btn ai-retake-btn" onClick={resetInterview}>
                  <RotateCcw size={16} /> Start Over
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Past Interviews */}
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
                <div className="past-interview-top">
                  <div>
                    <h4 className="past-interview-title">{item.interview_type}</h4>
                    <p className="past-interview-date">
                      {item.conducted_date ? new Date(item.conducted_date).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className="past-interview-score-pill">{item.overall_score ?? 0}%</span>
                </div>
                <div className="past-interview-scores-row">
                  <div className="past-score-box">
                    <div className="past-score-val">{item.overall_score ?? "—"}</div>
                    <div className="past-score-label">Overall</div>
                  </div>
                  <div className="past-score-box">
                    <div className="past-score-val">{item.grade}</div>
                    <div className="past-score-label">Grade</div>
                  </div>
                  <div className="past-score-box">
                    <div className="past-score-val">{item.status}</div>
                    <div className="past-score-label">Status</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}