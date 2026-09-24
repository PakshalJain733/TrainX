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

const getVoice = (fallbackText) => {
  const utterance = new SpeechSynthesisUtterance(fallbackText);
  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const englishVoice =
    voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Microsoft") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel") ||
          v.name.includes("Zira"))
    ) || voices.find((v) => v.lang.startsWith("en"));
  if (englishVoice) utterance.voice = englishVoice;
  return utterance;
};

export default function AIInterview() {
  const [phase, setPhase] = useState("setup"); // setup | live | result
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [topic, setTopic] = useState(TOPIC_OPTIONS[0]);

  // Camera state
  const [cameraState, setCameraState] = useState("idle"); // idle | on | denied | unsupported
  const cameraStreamRef = useRef(null);
  const videoRef = useRef(null);

  // Speech support detection
  const SpeechRecognitionCtor =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  // Socket
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Question / conversation
  const [question, setQuestion] = useState(null); // {index,total,question,topic,hint,sessionId}
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState([]);
  const conversationEndRef = useRef(null);
  const sessionIdRef = useRef(null);
  const questionIndexRef = useRef(0);

  // Timer
  const [remaining, setRemaining] = useState(INTERVIEW_SECONDS);
  const [timerReady, setTimerReady] = useState(false);
  const startedAtRef = useRef(null);
  const timerRef = useRef(null);
  const completedRef = useRef(false);
  const endRequestedRef = useRef(false);
  const firstQuestionRef = useRef(false);

  // Voice (TTS)
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // Result
  const [result, setResult] = useState(null);

  // Errors
  const [errorMsg, setErrorMsg] = useState("");
  const [warningShown, setWarningShown] = useState(false);

  // Past interviews (real data from backend)
  const [pastInterviews, setPastInterviews] = useState([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [pastError, setPastError] = useState("");

  const studentName =
    typeof window !== "undefined" && window.localStorage
      ? JSON.parse(window.localStorage.getItem("user") || "{}")?.name
      : "";

  const stopCamera = useCallback(() => {
    if (videoRef.current) videoRef.current.srcObject = null;
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraState("idle");
  }, []);

  // Attach the live stream to the <video> element whenever it is mounted.
  // The camera can be enabled from the setup screen (no <video> yet), so the
  // stream is attached here once the live phase renders the element.
  useEffect(() => {
    if (cameraState === "on" && cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraState, phase]);

  const areSpeakersUsed = () =>
    typeof window !== "undefined" && "speechSynthesis" in window;

  // ---------- Text To Speech ----------
  const stopSpeaking = useCallback(() => {
    if (areSpeakersUsed()) window.speechSynthesis.cancel();
    setIsAiSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text) => {
      if (!voiceEnabled) return;
      if (!areSpeakersUsed()) {
        setIsAiSpeaking(true);
        window.setTimeout(() => setIsAiSpeaking(false), 2500);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = getVoice(text);
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  // ---------- Speech To Text ----------
  const recognitionRef = useRef(null);

  const stopRecognition = useCallback(() => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecognition();
      return;
    }
    if (!SpeechRecognitionCtor) return;

    stopSpeaking();
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
        setErrorMsg("Microphone permission denied. You can still type your answer.");
      }
    };
    setIsRecording(true);
    try {
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  }, [isRecording, SpeechRecognitionCtor, stopSpeaking, stopRecognition]);

  // ---------- Camera ----------
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
      setErrorMsg("Camera permission was denied. You can continue without video.");
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameraState === "on") {
      stopCamera();
    } else {
      enableCamera();
    }
  }, [cameraState, enableCamera, stopCamera]);

  // ---------- Socket ----------
  const connectAndStart = useCallback(() => {
    const token = window.localStorage.getItem("token") || "";
    const apiBase = getApiBaseUrl();
    const base = apiBase.replace(/\/api\/v1\/?$/, "") || "";

    const socket = io(`${base}/interviews`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setErrorMsg("");
    });
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("connect_error", (e) => {
      setSocketConnected(false);
      const msg = e?.message || "Connection failed";
      const tokenIssue =
        /token|unauthor|forbidden|401|expired/i.test(msg) ||
        /invalid.*token/i.test(msg);
      setErrorMsg(
        tokenIssue
          ? "Socket authentication failed. Please log in again, then retry the interview."
          : `Socket connection failed: ${msg}`
      );
      // If the first question never arrived, the live phase is not a real
      // interview yet — abort to setup instead of leaving a stuck live screen.
      if (!firstQuestionRef.current) {
        try {
          socket.disconnect();
        } catch { /* ignore */ }
        socketRef.current = null;
        setSocketConnected(false);
        setPhase("setup");
      }
    });

    socket.on("interview:question", (q) => {
      setIsEvaluating(false);
      sessionIdRef.current = q.sessionId;
      questionIndexRef.current = q.index;
      if (!firstQuestionRef.current) {
        firstQuestionRef.current = true;
        // Countdown begins only once the first real question is in hand.
        startedAtRef.current = Date.now();
        setRemaining(INTERVIEW_SECONDS);
        setWarningShown(false);
        setTimerReady(true);
      }
      setQuestion(q);
      setConversation((prev) => [
        ...prev,
        { type: "q", index: q.index, text: q.question, topic: q.topic },
      ]);
      if (voiceEnabled) speakText(q.question);
    });

    socket.on("interview:feedback", (f) => {
      setIsEvaluating(false);
      setConversation((prev) => [...prev, { type: "feedback", text: f.feedback || "Answer evaluated.", score: f.score }]);
    });

    socket.on("interview:complete", (summary) => finishInterview(summary, socket));

    socket.on("interview:error", (e) => {
      setIsEvaluating(false);
      setErrorMsg(e.message);
    });

    socket.emit("interview:start", {
      sessionId: `student-${token.split(".")[0]}-${Date.now()}`,
      role,
      topic,
      difficulty: "Medium",
      totalQuestions: 12,
    });
  }, [role, topic, voiceEnabled, speakText]);

  // ---------- Start ----------
  const startInterview = () => {
    if (!role.trim()) {
      setErrorMsg("Please choose a target role to begin.");
      return;
    }
    completedRef.current = false;
    endRequestedRef.current = false;
    firstQuestionRef.current = false;
    setWarningShown(false);
    setErrorMsg("");
    setQuestion(null);
    setConversation([]);
    setAnswer("");
    setPhase("live");
    startedAtRef.current = Date.now();
    setTimerReady(false);
    setRemaining(INTERVIEW_SECONDS);
    connectAndStart();
  };

  // ---------- Timer ----------
  useEffect(() => {
    // Timer must NOT run until the first Gemini question has actually arrived.
    if (phase !== "live" || !timerReady) return undefined;
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const left = Math.max(0, INTERVIEW_SECONDS - elapsed);
      setRemaining(left);
      if (left <= WARNING_SECONDS && left > 0 && !warningShown) {
        setWarningShown(true);
      }
      if (left <= 0) {
        endInterview();
      }
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timerReady, warningShown]);

  // ---------- Send Answer ----------
  const sendAnswer = () => {
    const trimmed = answer.trim();
    if (isEvaluating || !trimmed) return;
    if (!socketRef.current || !socketConnected) {
      setErrorMsg("Not connected to interview. Please wait or restart.");
      return;
    }
    if (completedRef.current) return;

    setIsEvaluating(true);
    stopSpeaking();
    setConversation((prev) => [...prev, { type: "a", text: trimmed }]);
    socketRef.current.emit("interview:answer", {
      sessionId: sessionIdRef.current,
      answer: trimmed,
    });
    setAnswer("");
  };

  // ---------- Finish ----------
  const finishInterview = useCallback(
    (summary, socket) => {
      if (completedRef.current) return;
      completedRef.current = true;
      endRequestedRef.current = true;
      firstQuestionRef.current = false;
      setTimerReady(false);
      stopRecognition();
      stopCamera();
      stopSpeaking();
      if (timerRef.current) window.clearInterval(timerRef.current);
      const { scorecard, evaluationHistory, durationSeconds, questionsAnswered } = summary || {};
      setResult({
        scorecard: scorecard || null,
        questionsAnswered:
          questionsAnswered ?? (evaluationHistory?.length ?? questionIndexRef.current),
        durationSeconds: durationSeconds ?? Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000),
        evaluationHistory: evaluationHistory || [],
      });
      setSocketConnected(false);
      if (socket) socket.disconnect();
      socketRef.current = null;
      setPhase("result");
    },
    [stopRecognition, stopCamera, stopSpeaking]
  );

  const endInterview = useCallback(() => {
    if (completedRef.current || endRequestedRef.current) return;
    endRequestedRef.current = true;

    const socket = socketRef.current;
    if (socket && socketConnected && sessionIdRef.current) {
      socket.emit("interview:end", { sessionId: sessionIdRef.current });
      // Fallback: if the server does not respond, finalize locally with an honest summary
      window.setTimeout(() => {
        if (phase !== "result") {
          finishInterview(null, socket);
        }
      }, 8000);
    } else {
      finishInterview(null, socket);
    }
  }, [socketConnected, phase, finishInterview]);

  // ---------- Reset ----------
  const resetInterview = () => {
    stopRecognition();
    stopCamera();
    stopSpeaking();
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    completedRef.current = false;
    endRequestedRef.current = false;
    firstQuestionRef.current = false;
    sessionIdRef.current = null;
    setSocketConnected(false);
    setTimerReady(false);
    setQuestion(null);
    setConversation([]);
    setAnswer("");
    setResult(null);
    setErrorMsg("");
    setRemaining(INTERVIEW_SECONDS);
    setWarningShown(false);
    setPhase("setup");
  };

  // Speak new question when voice toggled while idle
  const replayQuestion = () => {
    if (question?.question) speakText(question.question);
  };

  // TTS cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopRecognition();
      stopCamera();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [stopSpeaking, stopRecognition, stopCamera]);

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conversation]);

  // Load real past interviews from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPastLoading(true);
      const res = await apiFetch("/interviews");
      if (cancelled) return;
      setPastLoading(false);
      if (res && Array.isArray(res.data)) {
        setPastInterviews(res.data);
      } else if (res && res.error) {
        setPastError(res.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const isVoiceUnsupported = !areSpeakersUsed();

  return (
    <div className="ai-interview-page stack-6">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <Bot size={22} style={{ color: "#4f46e5" }} />
          <span>Live AI Interview Simulation</span>
        </h2>
        <p className="student-header-desc">
          5-minute voice-driven technical interview with real-time AI questions, speech recognition and instant evaluation.
        </p>
      </div>

      {phase === "setup" && (
        <div className="interview-practice-card ai-welcome-landing-card ai-setup-card">
          <div className="ai-welcome-content">
            <div className="ai-bot-graphic">
              <div className="ai-bot-circle">
                <Bot size={54} className="ai-bot-icon" />
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
                  <div className="ai-meta-lbl">Single timed session</div>
                </div>
              </div>
              <div className={`ai-meta-item ${cameraState === "denied" ? "ai-meta-warn" : ""}`}>
                <div className="ai-meta-icon">
                  {cameraState === "on" ? <Video size={18} /> : <CameraOff size={18} />}
                </div>
                <div>
                  <div className="ai-meta-val">
                    Camera {cameraState === "on" ? "Active" : cameraState === "denied" ? "Blocked" : cameraState === "unsupported" ? "Unavailable" : "Standby"}
                  </div>
                  <div className="ai-meta-lbl">
                    {cameraState === "on" ? "Live video preview" : "Turn on for interview experience"}
                  </div>
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
                className={`ai-mic-btn ai-camera-btn ${cameraState === "on" ? "recording" : ""}`}
                onClick={toggleCamera}
              >
                {cameraState === "on" ? <Camera size={16} /> : <CameraOff size={16} />}
                {cameraState === "on" ? "Camera Off" : "Enable Camera"}
              </button>

              <button
                type="button"
                className="ai-start-interview-btn"
                onClick={startInterview}
                disabled={cameraState === "on" && !cameraStreamRef.current}
              >
                <Play size={18} fill="currentColor" /> Start Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "live" && (
        <>
          {/* Timer / Header bar */}
          <div className={`ai-timer-bar ${warningShown ? "ai-time-warning-bar" : ""}`}>
            <div className="ai-timer-left">
              <Timer size={18} />
              <span className={`ai-timer-value ${remaining <= WARNING_SECONDS ? "ai-timer-critical" : ""}`}>
                {fmtTime(remaining)}
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
                className="ai-speaker-play-btn"
                onClick={() => {
                  if (voiceEnabled) {
                    setVoiceEnabled(false);
                    stopSpeaking();
                  } else {
                    setVoiceEnabled(true);
                    replayQuestion();
                  }
                }}
                title={voiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
              >
                {voiceEnabled ? <Volume2 size={18} className="ai-speak-icon" /> : <VolumeX size={18} className="muted-icon" />}
              </button>

              <button type="button" className="ai-mic-btn ai-end-btn" onClick={endInterview}>
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
            {/* LEFT COLUMN (40%): Camera + Answer Box */}
            <div className="ai-left-column">
              {/* Camera */}
              <div className={`ai-camera-panel ${cameraState === "on" ? "" : "ai-camera-off-panel"}`}>
                <div className="ai-camera-header">
                  <span className="ai-camera-title">
                    {cameraState === "on" ? <Camera size={15} /> : <CameraOff size={15} />}
                    {cameraState === "on" ? "Live Camera" : "Camera Off"}
                  </span>
                  <button type="button" className="ai-mini-toggle" onClick={toggleCamera}>
                    {cameraState === "on" ? "Turn Off" : "Turn On"}
                  </button>
                </div>
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
                        <span>Camera not supported in this browser</span>
                      </>
                    ) : (
                      <>
                        <Video size={32} />
                        <span>Camera Off</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Answer Box */}
              <div className="ai-answer-card">
                <div className="ai-answer-header">
                  <span className="ai-answer-title">
                    {question ? `Question ${question.index}` : "Your Answer"}
                  </span>
                  {question && <span className="interview-topic-badge">{question.topic}</span>}
                </div>

                <textarea
                  className="interview-textarea ai-answer-textarea"
                  placeholder={
                    SpeechRecognitionCtor
                      ? "Speak using the microphone, or type your answer here..."
                      : "Voice input is not supported in this browser. Please type your answer."
                  }
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!question || isEvaluating}
                />

                <div className="interview-action-row">
                  <button
                    type="button"
                    className={`ai-mic-btn ${isRecording ? "recording" : ""}`}
                    onClick={toggleRecording}
                    disabled={!question || isEvaluating || !SpeechRecognitionCtor}
                    title={SpeechRecognitionCtor ? "Use voice" : "Voice not supported"}
                  >
                    {isRecording ? <Mic size={16} /> : <MicOff size={16} />}
                    {isRecording ? "Listening..." : "Voice Answer"}
                  </button>

                  <button
                    type="button"
                    className="interview-next-btn"
                    onClick={sendAnswer}
                    disabled={!answer.trim() || isEvaluating || !socketConnected}
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 size={15} className="ai-spin" /> Evaluating...
                      </>
                    ) : (
                      <>Send Answer <Send size={15} /></>
                    )}
                  </button>
                </div>

                {isRecording && (
                  <div className="ai-listening-indicator">
                    <span className="ai-listening-dot" /> Listening — speak now...
                  </div>
                )}
                {!SpeechRecognitionCtor && (
                  <div className="ai-unsupported-note">
                    Voice input is not supported in this browser. Please type your answer.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (60%): AI Interviewer */}
            <div className="interview-practice-card ai-interviewer-card">
              <div className="ai-interviewer-head">
                <div className="ai-interviewer-avatar">
                  <Bot size={26} className="ai-bot-icon" />
                  {isAiSpeaking && <span className="ai-avatar-speaking" />}
                </div>
                <div>
                  <div className="ai-interviewer-name">AI Interviewer</div>
                  <div className="ai-interviewer-sub">
                    {isAiSpeaking ? (
                      <span className="ai-speaking-lbl">Speaking...</span>
                    ) : (
                      <span className="ai-waves-lbl">
                        {question ? "Listening for your answer" : "Starting the interview..."}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={`ai-speaker-play-btn ${!voiceEnabled ? "voice-disabled" : ""}`}
                  onClick={() => {
                    if (voiceEnabled) {
                      setVoiceEnabled(false);
                      stopSpeaking();
                    } else {
                      setVoiceEnabled(true);
                      replayQuestion();
                    }
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

              {isVoiceUnsupported && (
                <div className="ai-unsupported-note">
                  Text-to-speech is not supported in this browser. Questions will be shown as text.
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
                      Question {question.index} {question.total && <>/ {question.total}</>}
                      {question.topic && <span className="ai-q-topic"> {question.topic}</span>}
                    </div>
                    <p className="ai-q-text">{question.question}</p>
                    {question.hint && <p className="ai-q-hint">Hint: {question.hint}</p>}
                    <button type="button" className="ai-replay-btn" onClick={replayQuestion} title="Replay question">
                      <Volume2 size={14} /> Replay
                    </button>
                  </>
                ) : (
                  <div className="ai-q-empty">
                    <Loader2 size={20} className="ai-spin" /> Waiting for the first question...
                  </div>
                )}
              </div>

              {/* Conversation history */}
              <div className="ai-conversation">
                <div className="ai-conv-title">Conversation</div>
                {conversation.length === 0 ? (
                  <div className="ai-conv-empty">
                    The interviewer will ask your first question shortly.
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
                      return (
                        <div className="ai-feedback-row" key={idx}>
                          <Sparkles size={14} />
                          <span>
                            Score {c.score}/10 — {c.text}
                          </span>
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

      {phase === "result" && (
        <div className="interview-practice-card ai-result-card">
          {result?.scorecard ? (
            <>
              <div className="ai-scorecard-hero">
                <Award size={44} className="ai-award-icon" />
                <h2 className="ai-scorecard-title">AI Interview Completed</h2>
                <p className="ai-scorecard-subtitle">
                  {result.durationSeconds ? `Duration: ${Math.floor(result.durationSeconds / 60)}m ${result.durationSeconds % 60}s` : ""}
                  {result.questionsAnswered ? `  •  Questions Answered: ${result.questionsAnswered}` : ""}
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
                      {result.scorecard.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.scorecard.improvementAreas) && result.scorecard.improvementAreas.length > 0 && (
                  <div className="ai-diagnostic-box">
                    <h4 className="ai-diagnostic-title">Weak Areas</h4>
                    <ul className="ai-list">
                      {result.scorecard.improvementAreas.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.scorecard.recommendedTopics) && result.scorecard.recommendedTopics.length > 0 && (
                  <div className="ai-diagnostic-box">
                    <h4 className="ai-diagnostic-title">Skill Gaps & Recommendations</h4>
                    <ul className="ai-list">
                      {result.scorecard.recommendedTopics.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
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
                <h2 className="ai-scorecard-title">AI Interview Ended</h2>
                <p className="ai-scorecard-subtitle">
                  The session could not reach the evaluation server. Your interview progress is preserved below.
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

      {/* Past Interviews (real data) */}
      <div className="past-interviews-card">
        <h3 className="past-interviews-header">Past interviews</h3>
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