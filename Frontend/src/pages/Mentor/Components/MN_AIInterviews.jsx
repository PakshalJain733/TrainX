import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  AlertTriangle,
  Bot,
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";
import { getApiBaseUrl } from "../../../utils/api";
import "../Styles/MN_AIInterviews.css";

const ROLE_OPTIONS = [
  "Software Engineer",
  "Full Stack Developer",
  "Backend Developer",
  "Frontend Developer",
  "Data Analyst",
  "DevOps Engineer",
];

const TOPIC_OPTIONS = [
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "SQL / Databases",
  "Data Structures & Algorithms",
  "System Design",
];

const getRecognitionConstructor = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const getSpeechSynthesis = () => {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis || null;
};

const getSpeechUtteranceConstructor = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechSynthesisUtterance || null;
};

const getErrorMessage = (error, fallback) => {
  if (typeof error === "string" && error.trim()) return error;
  if (error?.message && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
};

const getSocketBaseUrl = () => {
  const apiBase = getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
  return `${apiBase}/interviews`;
};

const getStateCopy = (status, isListening, isSubmitting) => {
  if (status === "starting") {
    return {
      label: "Starting",
      description: "Connecting to the interview service and requesting the first real question.",
    };
  }
  if (status === "speaking") {
    return {
      label: "Speaking",
      description: "The interviewer is reading the current question aloud.",
    };
  }
  if (status === "error") {
    return {
      label: "Error",
      description: "The interview service could not continue. Review the error and try again.",
    };
  }
  if (status === "complete") {
    return {
      label: "Complete",
      description: "This interview session has ended.",
    };
  }
  if (status === "active" && isListening) {
    return {
      label: "Active",
      description: "The microphone is listening. Only recognized speech will be added to your answer.",
    };
  }
  if (status === "active" && isSubmitting) {
    return {
      label: "Active",
      description: "Your answer is being evaluated by the interview service.",
    };
  }
  if (status === "active") {
    return {
      label: "Active",
      description: "Answer the current question using your voice or the answer field.",
    };
  }
  return {
    label: "Idle",
    description: "Start a session to request a question from the live AI interviewer.",
  };
};

export default function AIInterviews() {
  const recognitionConstructor = getRecognitionConstructor();
  const recognitionSupported = Boolean(recognitionConstructor);
  const [ttsSupported, setTtsSupported] = useState(() => {
    return Boolean(getSpeechSynthesis() && getSpeechUtteranceConstructor());
  });

  const [status, setStatus] = useState("idle");
  const [connectionState, setConnectionState] = useState("disconnected");
  const [cameraState, setCameraState] = useState("idle");
  const [cameraMessage, setCameraMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [topic, setTopic] = useState(TOPIC_OPTIONS[0]);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [micMessage, setMicMessage] = useState("");
  const [ttsMessage, setTtsMessage] = useState("");

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraRequestRef = useRef(0);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const utteranceRef = useRef(null);
  const socketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const mountedRef = useRef(true);
  const statusRef = useRef("idle");
  const submittingRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);

  const updateStatus = useCallback((nextStatus) => {
    statusRef.current = nextStatus;
    if (mountedRef.current) setStatus(nextStatus);
  }, []);

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.abort();
      } catch (error) {
        try {
          recognition.stop();
        } catch (stopError) {
          void stopError;
        }
        void error;
      }
    }
    if (mountedRef.current) setIsListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    const utterance = utteranceRef.current;
    utteranceRef.current = null;
    if (utterance) {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
    }
    const synthesis = getSpeechSynthesis();
    if (synthesis) {
      try {
        synthesis.cancel();
      } catch (error) {
        void error;
      }
    }
    if (mountedRef.current) setIsSpeaking(false);
  }, []);

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1;
    if (videoRef.current) videoRef.current.srcObject = null;
    const stream = cameraStreamRef.current;
    cameraStreamRef.current = null;
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          void error;
        }
      });
    }
    if (mountedRef.current) {
      setCameraState("idle");
      setCameraMessage("");
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      if (mountedRef.current) {
        setCameraState("error");
        setCameraMessage("Camera access is not supported in this browser.");
      }
      return;
    }

    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;
    setCameraMessage("");
    setCameraState("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current || requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const previousStream = cameraStreamRef.current;
      if (previousStream) {
        previousStream.getTracks().forEach((track) => track.stop());
      }
      cameraStreamRef.current = stream;
      setCameraState("on");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (error) {
          void error;
        }
      }
    } catch (error) {
      if (!mountedRef.current || requestId !== cameraRequestRef.current) return;
      setCameraState("error");
      setCameraMessage(
        error?.name === "NotAllowedError"
          ? "Camera permission was denied. You can continue without video."
          : "The camera could not be started. Check your browser camera settings."
      );
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameraState === "on") {
      stopCamera();
    } else if (cameraState !== "starting") {
      startCamera();
    }
  }, [cameraState, startCamera, stopCamera]);

  const speakQuestion = useCallback(
    (text) => {
      const synthesis = getSpeechSynthesis();
      const Utterance = getSpeechUtteranceConstructor();
      if (!synthesis || !Utterance) {
        setTtsSupported(false);
        setTtsMessage("Speech synthesis is not supported in this browser. Questions are shown as text.");
        updateStatus("active");
        return;
      }

      stopSpeaking();
      setTtsMessage("");
      const utterance = new Utterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.94;
      utterance.pitch = 1;
      try {
        const voices = synthesis.getVoices();
        const englishVoice =
          voices.find((voice) => voice.lang?.toLowerCase().startsWith("en") && /natural|google|microsoft|samantha|daniel|zira/i.test(voice.name || "")) ||
          voices.find((voice) => voice.lang?.toLowerCase().startsWith("en"));
        if (englishVoice) utterance.voice = englishVoice;
      } catch (error) {
        void error;
      }

      utterance.onstart = () => {
        if (utteranceRef.current !== utterance) return;
        if (mountedRef.current) {
          setIsSpeaking(true);
          updateStatus("speaking");
        }
      };
      utterance.onend = () => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        if (mountedRef.current) {
          setIsSpeaking(false);
          if (sessionActiveRef.current && statusRef.current !== "error") updateStatus("active");
        }
      };
      utterance.onerror = () => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        if (mountedRef.current) {
          setIsSpeaking(false);
          setTtsMessage("Speech synthesis could not play this question. The question remains available as text.");
          if (sessionActiveRef.current && statusRef.current !== "error") updateStatus("active");
        }
      };
      utteranceRef.current = utterance;
      try {
        synthesis.speak(utterance);
      } catch (error) {
        utteranceRef.current = null;
        setIsSpeaking(false);
        setTtsMessage(getErrorMessage(error, "Speech synthesis could not play this question."));
        updateStatus("active");
      }
    },
    [stopSpeaking, updateStatus]
  );

  const disconnectSocket = useCallback((updateConnectionState = true) => {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      try {
        socket.removeAllListeners();
        socket.disconnect();
      } catch (error) {
        void error;
      }
    }
    sessionActiveRef.current = false;
    submittingRef.current = false;
    if (mountedRef.current && updateConnectionState) {
      setConnectionState("disconnected");
      setIsSubmitting(false);
    }
  }, []);

  const startInterview = useCallback(() => {
    const trimmedRole = role.trim();
    const trimmedTopic = topic.trim();
    if (!trimmedRole || !trimmedTopic) {
      setErrorMessage("Choose a target role and interview topic before starting.");
      updateStatus("error");
      return;
    }

    const token = ((sessionStorage.getItem("token") || localStorage.getItem("token")) || "");
    if (!token) {
      setErrorMessage("An authenticated session is required to start the interview.");
      updateStatus("error");
      return;
    }

    stopRecognition();
    stopSpeaking();
    stopCamera();
    intentionalDisconnectRef.current = false;
    disconnectSocket(false);

    const sessionId = `mentor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionIdRef.current = sessionId;
    sessionActiveRef.current = true;
    submittingRef.current = false;
    setQuestion(null);
    setAnswer("");
    setSubmittedAnswer("");
    setFeedback("");
    setErrorMessage("");
    setMicMessage("");
    setTtsMessage("");
    setIsSubmitting(false);
    setIsComplete(false);
    setConnectionState("connecting");
    updateStatus("starting");

    const socket = io(getSocketBaseUrl(), {
      auth: { token },
      autoConnect: false,
      reconnection: false,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (socketRef.current !== socket) return;
      setConnectionState("connected");
      setErrorMessage("");
      socket.emit("interview:start", {
        sessionId,
        role: trimmedRole,
        topic: trimmedTopic,
        difficulty: "Medium",
        totalQuestions: 5,
      });
    });

    socket.on("connect_error", (error) => {
      if (socketRef.current !== socket) return;
      sessionActiveRef.current = false;
      setConnectionState("error");
      setErrorMessage(getErrorMessage(error, "The interview service could not be reached."));
      updateStatus("error");
    });

    socket.on("disconnect", () => {
      if (socketRef.current !== socket || intentionalDisconnectRef.current) return;
      sessionActiveRef.current = false;
      setConnectionState("disconnected");
      setErrorMessage("The interview connection was lost before the next response arrived.");
      updateStatus("error");
    });

    socket.on("interview:question", (payload) => {
      if (socketRef.current !== socket) return;
      if (payload?.sessionId && payload.sessionId !== sessionIdRef.current) return;
      const questionText = typeof payload?.question === "string" ? payload.question.trim() : "";
      if (!questionText) {
        setErrorMessage("The interview service returned an invalid question. No question was added.");
        updateStatus("error");
        return;
      }

      sessionActiveRef.current = true;
      setQuestion({
        index: payload.index,
        total: payload.total,
        question: questionText,
        topic: payload.topic || trimmedTopic,
        hint: typeof payload.hint === "string" ? payload.hint : "",
      });
      setAnswer("");
      setFeedback("");
      setErrorMessage("");
      setMicMessage("");
      setIsSubmitting(false);
      submittingRef.current = false;
      updateStatus("active");
      speakQuestion(questionText);
    });

    socket.on("interview:feedback", (payload) => {
      if (socketRef.current !== socket) return;
      if (payload?.sessionId && payload.sessionId !== sessionIdRef.current) return;
      const receivedFeedback =
        typeof payload?.evaluation?.feedback === "string"
          ? payload.evaluation.feedback
          : typeof payload?.feedback === "string"
            ? payload.feedback
            : "";
      setFeedback(receivedFeedback);
      setIsSubmitting(false);
      submittingRef.current = false;
      updateStatus("active");
    });

    socket.on("interview:error", (payload) => {
      if (socketRef.current !== socket) return;
      const message = getErrorMessage(payload, "The AI interview service returned an error.");
      stopRecognition();
      stopSpeaking();
      sessionActiveRef.current = false;
      setIsSubmitting(false);
      submittingRef.current = false;
      setErrorMessage(message);
      setConnectionState("error");
      updateStatus("error");
      intentionalDisconnectRef.current = true;
      disconnectSocket(true);
    });

    socket.on("interview:complete", () => {
      if (socketRef.current !== socket) return;
      stopRecognition();
      stopSpeaking();
      stopCamera();
      sessionActiveRef.current = false;
      setIsSubmitting(false);
      submittingRef.current = false;
      setIsComplete(true);
      setConnectionState("disconnected");
      updateStatus("complete");
      intentionalDisconnectRef.current = true;
      disconnectSocket(true);
    });

    socket.connect();
  }, [
    disconnectSocket,
    role,
    speakQuestion,
    stopCamera,
    stopRecognition,
    stopSpeaking,
    topic,
    updateStatus,
  ]);

  const toggleRecognition = useCallback(() => {
    if (isListening) {
      stopRecognition();
      return;
    }

    if (!recognitionConstructor) {
      setMicMessage("Speech recognition is not supported in this browser. Type your answer instead.");
      return;
    }
    if (!question || !socketRef.current?.connected || isSubmitting || statusRef.current === "complete") {
      setMicMessage("Start the interview and wait for a real question before using the microphone.");
      return;
    }

    stopSpeaking();
    setMicMessage("");
    setErrorMessage("");
    updateStatus("active");
    transcriptRef.current = "";
    let recognitionFailed = false;
    const recognition = new recognitionConstructor();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (recognitionRef.current !== recognition) return;
      if (mountedRef.current) setIsListening(true);
    };
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const results = Array.from(event.results || []);
      const recognizedText = results
        .map((result) => result?.[0]?.transcript || "")
        .join("")
        .trim();
      if (!recognizedText) return;
      transcriptRef.current = recognizedText;
      if (mountedRef.current) setAnswer(recognizedText);
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      if (mountedRef.current) {
        setIsListening(false);
        if (!recognitionFailed && !transcriptRef.current.trim()) {
          setMicMessage("No speech was recognized. Nothing was added to your answer.");
        }
      }
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      recognitionFailed = true;
      const errorCode = event?.error || "unknown";
      const messages = {
        "not-allowed": "Microphone permission was denied. Allow microphone access or type your answer.",
        "service-not-allowed": "Microphone access is blocked by this browser. Type your answer instead.",
        "audio-capture": "No microphone was found. Connect a microphone or type your answer.",
        network: "Speech recognition lost its network connection.",
        "no-speech": "No speech was recognized. Nothing was added to your answer.",
      };
      if (mountedRef.current) {
        setIsListening(false);
        setMicMessage(messages[errorCode] || "Speech recognition failed. Type your answer or try again.");
      }
    };

    try {
      recognition.start();
    } catch (error) {
      recognitionFailed = true;
      recognitionRef.current = null;
      if (mountedRef.current) {
        setIsListening(false);
        setMicMessage(getErrorMessage(error, "The microphone could not be started."));
      }
    }
  }, [
    isListening,
    isSubmitting,
    question,
    recognitionConstructor,
    stopRecognition,
    stopSpeaking,
    updateStatus,
  ]);

  const submitAnswer = useCallback(() => {
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer || !question || !socketRef.current?.connected || submittingRef.current) return;
    if (!sessionIdRef.current) {
      setErrorMessage("The interview session is not ready. Start the interview again.");
      updateStatus("error");
      return;
    }

    stopRecognition();
    stopSpeaking();
    setErrorMessage("");
    setMicMessage("");
    setIsSubmitting(true);
    submittingRef.current = true;
    setSubmittedAnswer(trimmedAnswer);
    updateStatus("active");
    socketRef.current.emit("interview:answer", {
      sessionId: sessionIdRef.current,
      answer: trimmedAnswer,
    });
    setAnswer("");
  }, [answer, question, stopRecognition, stopSpeaking, updateStatus]);

  const endInterview = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.connected && sessionIdRef.current) {
      socket.emit("interview:end", { sessionId: sessionIdRef.current });
    }
    intentionalDisconnectRef.current = true;
    stopRecognition();
    stopSpeaking();
    stopCamera();
    disconnectSocket(true);
    sessionActiveRef.current = false;
    setIsSubmitting(false);
    submittingRef.current = false;
    setIsComplete(true);
    updateStatus("complete");
  }, [disconnectSocket, stopCamera, stopRecognition, stopSpeaking, updateStatus]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRecognition();
      stopSpeaking();
      stopCamera();
      intentionalDisconnectRef.current = true;
      disconnectSocket(false);
    };
  }, [disconnectSocket, stopCamera, stopRecognition, stopSpeaking]);

  const stateCopy = getStateCopy(status, isListening, isSubmitting);
  const isSessionRunning = status === "starting" || status === "active" || status === "speaking";
  const canStartAgain = isComplete || status === "error";
  const canSubmit = Boolean(question && answer.trim() && connectionState === "connected" && !isSubmitting);

  return (
    <div className="mentor-ai-interviews-container">
      <div className="mentor-page-header mentor-ai-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Bot size={20} color="#4f46e5" />
            <span>AI Interview Studio</span>
          </h2>
          <p className="mentor-page-subtitle">Run a live, voice-enabled interview with a real AI question generator</p>
        </div>
        <div className={`mentor-ai-header-state mentor-ai-header-state--${status}`} aria-live="polite">
          <span className="mentor-ai-header-state-dot" />
          <span>{stateCopy.label}</span>
        </div>
      </div>

      <section className="mentor-ai-session-card" aria-label="Live AI interview workspace">
        <div className="mentor-ai-session-toolbar">
          <div className="mentor-ai-session-config">
            <label className="mentor-ai-field" htmlFor="mentor-ai-role">
              <span>Target role</span>
              <select id="mentor-ai-role" value={role} onChange={(event) => setRole(event.target.value)} disabled={isSessionRunning}>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="mentor-ai-field" htmlFor="mentor-ai-topic">
              <span>Interview topic</span>
              <select id="mentor-ai-topic" value={topic} onChange={(event) => setTopic(event.target.value)} disabled={isSessionRunning}>
                {TOPIC_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {isSessionRunning ? (
            <div className="mentor-ai-session-progress">
              <span className="mentor-ai-live-dot" />
              Live session
            </div>
          ) : (
            <button type="button" className="mentor-ai-start-button" onClick={startInterview} disabled={status === "starting"}>
              {canStartAgain ? <RotateCcw size={16} /> : <Play size={16} fill="currentColor" />}
              {canStartAgain ? "Start again" : "Start interview"}
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mentor-ai-alert mentor-ai-alert--error" role="alert">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
        {micMessage && (
          <div className="mentor-ai-alert mentor-ai-alert--warning" role="status">
            <MicOff size={16} />
            <span>{micMessage}</span>
          </div>
        )}
        {!ttsSupported && (
          <div className="mentor-ai-alert mentor-ai-alert--info" role="status">
            <AlertTriangle size={16} />
            <span>Speech synthesis is unavailable. Questions will remain visible as text.</span>
          </div>
        )}
        {ttsMessage && (
          <div className="mentor-ai-alert mentor-ai-alert--info" role="status">
            <AlertTriangle size={16} />
            <span>{ttsMessage}</span>
          </div>
        )}

        <div className="mentor-ai-interview-grid">
          <section className="mentor-ai-camera-panel" aria-label="Webcam and answer panel">
            <div className="mentor-ai-panel-heading">
              <div>
                <span className="mentor-ai-eyebrow">Candidate view</span>
                <h3>Webcam</h3>
              </div>
              <span className={`mentor-ai-camera-badge mentor-ai-camera-badge--${cameraState}`}>
                {cameraState === "on" ? "Live" : cameraState === "starting" ? "Starting" : cameraState === "error" ? "Unavailable" : "Off"}
              </span>
            </div>

            <div className="mentor-ai-camera-stage">
              <video ref={videoRef} className="mentor-ai-camera-video" autoPlay playsInline muted aria-label="Webcam preview" />
              {cameraState !== "on" && (
                <div className="mentor-ai-camera-placeholder">
                  <div className="mentor-ai-camera-placeholder-icon">
                    {cameraState === "error" ? <CameraOff size={30} /> : <Camera size={30} />}
                  </div>
                  <strong>{cameraState === "error" ? "Camera unavailable" : "Camera is off"}</strong>
                  <span>{cameraMessage || "Turn on your webcam when you are ready."}</span>
                </div>
              )}
              {cameraState === "starting" && (
                <div className="mentor-ai-camera-loading">
                  <Loader2 size={20} className="mentor-ai-spin" />
                  <span>Starting camera...</span>
                </div>
              )}
              {cameraState === "on" && <span className="mentor-ai-camera-live-label">Camera on</span>}
            </div>

            {cameraMessage && cameraState === "error" && <p className="mentor-ai-panel-message mentor-ai-panel-message--error">{cameraMessage}</p>}

            <div className="mentor-ai-camera-controls" aria-label="Camera and microphone controls">
              <button
                type="button"
                className={`mentor-ai-control-button ${cameraState === "on" ? "is-active" : ""}`}
                onClick={toggleCamera}
                disabled={cameraState === "starting"}
                aria-pressed={cameraState === "on"}
                title={cameraState === "on" ? "Turn camera off" : "Turn camera on"}
              >
                {cameraState === "on" ? <CameraOff size={17} /> : <Camera size={17} />}
                <span>{cameraState === "on" ? "Camera off" : "Camera on"}</span>
              </button>
              <button
                type="button"
                className={`mentor-ai-control-button ${isListening ? "is-listening" : ""}`}
                onClick={toggleRecognition}
                disabled={!recognitionSupported || isSubmitting || status === "complete"}
                aria-pressed={isListening}
                title={recognitionSupported ? (isListening ? "Stop microphone" : "Start microphone") : "Speech recognition is not supported"}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                <span>{isListening ? "Stop mic" : "Use mic"}</span>
              </button>
            </div>
            {!recognitionSupported && <p className="mentor-ai-support-note">Speech recognition is not supported here; the answer field remains available.</p>}

            <div className="mentor-ai-answer-section">
              <div className="mentor-ai-answer-heading">
                <label htmlFor="mentor-ai-answer">Your answer</label>
                <span>{isListening ? "Listening..." : "Voice or typed response"}</span>
              </div>
              <textarea
                id="mentor-ai-answer"
                className="mentor-ai-answer-input"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder={question ? "Speak or type your response..." : "A real question will appear here when the interview starts."}
                disabled={!question || isSubmitting}
                aria-label="Interview answer"
              />
              <div className="mentor-ai-answer-footer">
                <span className="mentor-ai-answer-hint">Nothing is added unless your browser recognizes or you type it.</span>
                <button type="button" className="mentor-ai-send-button" onClick={submitAnswer} disabled={!canSubmit}>
                  {isSubmitting ? <Loader2 size={15} className="mentor-ai-spin" /> : <Send size={15} />}
                  {isSubmitting ? "Sending" : "Submit answer"}
                </button>
              </div>
            </div>
          </section>

          <section className="mentor-ai-interviewer-panel" aria-label="AI interviewer panel">
            <div className="mentor-ai-interviewer-header">
              <div className="mentor-ai-robot" aria-hidden="true">
                <span className="mentor-ai-robot-ring mentor-ai-robot-ring--one" />
                <span className="mentor-ai-robot-ring mentor-ai-robot-ring--two" />
                <span className="mentor-ai-robot-face">
                  <Bot size={34} />
                </span>
                {isSpeaking && <span className="mentor-ai-robot-speaking-dot" />}
              </div>
              <div className="mentor-ai-interviewer-identity">
                <span className="mentor-ai-eyebrow">TrainX AI interviewer</span>
                <h3>Live interview room</h3>
                <p>Questions are generated by the interview service.</p>
              </div>
              <span className={`mentor-ai-status-pill mentor-ai-status-pill--${status}`}>{stateCopy.label}</span>
            </div>

            <div className={`mentor-ai-state-banner mentor-ai-state-banner--${status}`} aria-live="polite">
              <span className="mentor-ai-state-indicator">
                {status === "error" ? <AlertTriangle size={16} /> : status === "speaking" ? <Bot size={16} /> : status === "complete" ? <CheckCircle2 size={16} /> : <span />}
              </span>
              <div>
                <strong>{stateCopy.label}</strong>
                <p>{stateCopy.description}</p>
              </div>
            </div>

            <div className="mentor-ai-question-card" aria-live="polite">
              <div className="mentor-ai-question-meta">
                <span>Current question</span>
                {question?.index && (
                  <span>
                    {question.index} / {question.total || "—"}
                  </span>
                )}
              </div>
              {question ? (
                <>
                  <p className="mentor-ai-question-text">{question.question}</p>
                  <div className="mentor-ai-question-topic">
                    <span>Topic</span>
                    {question.topic}
                  </div>
                  {question.hint && <p className="mentor-ai-question-hint">Guidance: {question.hint}</p>}
                </>
              ) : (
                <div className="mentor-ai-question-empty">
                  {status === "starting" ? <Loader2 size={22} className="mentor-ai-spin" /> : <Bot size={22} />}
                  <span>{status === "error" ? "No question was generated." : "Waiting for the first real question."}</span>
                </div>
              )}
            </div>

            <div className="mentor-ai-response-card">
              <div className="mentor-ai-response-heading">
                <span>Latest response</span>
                {isSpeaking && <span className="mentor-ai-speaking-label">Speaking now</span>}
              </div>
              {answer || submittedAnswer ? (
                <p className="mentor-ai-response-text">{answer || submittedAnswer}</p>
              ) : (
                <p className="mentor-ai-response-empty">Your submitted answer will appear here after you send it.</p>
              )}
              {feedback && (
                <div className="mentor-ai-feedback">
                  <strong>Interviewer feedback</strong>
                  <p>{feedback}</p>
                </div>
              )}
            </div>

            <div className="mentor-ai-panel-footer">
              <div className={`mentor-ai-connection mentor-ai-connection--${connectionState}`}>
                {connectionState === "connected" ? <Wifi size={15} /> : <WifiOff size={15} />}
                <span>{connectionState === "connected" ? "Service connected" : connectionState === "connecting" ? "Connecting to service" : "Service disconnected"}</span>
              </div>
              {isSessionRunning && (
                <button type="button" className="mentor-ai-end-button" onClick={endInterview}>
                  End session
                </button>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
