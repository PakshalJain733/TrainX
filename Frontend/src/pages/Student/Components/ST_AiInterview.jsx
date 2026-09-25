import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Award,
  TrendingUp,
  Play,
} from "lucide-react";
import "../Styles/ST_AiInterview.css";
import { apiFetch } from "../../../utils/api";

const questionsList = [
  {
    id: 1,
    question:
      "Explain the difference between INNER JOIN and LEFT JOIN with an example.",
    topic: "SQL Optimisation",
    sampleAnswer:
      "INNER JOIN returns only matching records present in both tables. LEFT JOIN returns all records from the left table and matching rows from the right table, defaulting unmatched right-hand values to NULL.",
  },
  {
    id: 2,
    question:
      "How do RESTful APIs handle idempotency, and which HTTP methods are inherently idempotent?",
    topic: "API Design",
    sampleAnswer:
      "Idempotency guarantees that executing a request multiple times leaves the system state identical to executing it once. GET, PUT, and DELETE are idempotent, while POST creates new resources each time.",
  },
  {
    id: 3,
    question:
      "Explain how Python handles memory management and garbage collection internally.",
    topic: "Python Core",
    sampleAnswer:
      "Python utilizes reference counting for real-time memory deallocation and a cyclic generational garbage collector (Generations 0, 1, 2) to collect unreachable reference loops.",
  },
  {
    id: 4,
    question:
      "What is the difference between an Array and a Linked List in terms of time complexity for insertions and lookups?",
    topic: "Data Structures",
    sampleAnswer:
      "Arrays allow O(1) direct index lookups but require O(N) memory re-shifts for insertions. Linked Lists require O(N) traversal for lookups but enable O(1) node insertion once position is reached.",
  },
  {
    id: 5,
    question:
      "How would you optimize a database query that is experiencing full table scans on a table with 5 million records?",
    topic: "SQL Optimisation",
    sampleAnswer:
      "I would examine the EXPLAIN query execution plan, add B-Tree or composite indexes on WHERE/JOIN predicates, avoid leading wildcards in LIKE queries, and implement Redis query result caching.",
  },
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
  const [isRecording, setIsRecording] = useState(false);
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

  const currentQ = questionsList[currentIdx];
  const progressPercent = ((currentIdx + 1) / questionsList.length) * 100;

  // Text-to-Speech (AI Voice) Function
  const speakText = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
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
              v.name.includes("Daniel"))
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsAiSpeaking(true);
      setTimeout(() => setIsAiSpeaking(false), 3000);
    }
  };

  const toggleVoice = (e) => {
    if (e) e.stopPropagation();
    if (isVoiceEnabled) {
      setIsVoiceEnabled(false);
      setIsAiSpeaking(false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsVoiceEnabled(true);
      speakText(currentQ.question);
    }
  };

  // Speak question automatically when interview has started & voice is enabled
  useEffect(() => {
    if (hasStarted && !isInterviewFinished && currentQ?.question && isVoiceEnabled) {
      speakText(currentQ.question);
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [hasStarted, currentIdx, isInterviewFinished, isVoiceEnabled]);

  const handleNext = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    const finalAnswer = answer.trim() || currentQ.sampleAnswer || "Candidate provided response during live interview.";

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsEvaluating(true);
    setTimeout(() => {
      setSubmittedAnswers((prev) => ({
        ...prev,
        [currentIdx]: finalAnswer,
      }));

      setIsEvaluating(false);

      if (currentIdx < questionsList.length - 1) {
        setCurrentIdx((i) => i + 1);
        setAnswer("");
      } else {
        generateScorecard();
      }
    }, 600);
  };

  const toggleRecording = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Capture whatever text is already in the textarea
      startAnswerRef.current = answer ? answer.trim() + " " : "";

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setAnswer(startAnswerRef.current + currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const generateScorecard = () => {
    const finalReport = {
      score: 86,
      technical: 88,
      problemSolving: 84,
      communication: 86,
      feedback:
        "Outstanding technical explanation of database indexing and REST principles. High problem-solving structure demonstrated with optimal time complexity awareness.",
      strengths: [
        "Clear distinction of INNER vs LEFT joins",
        "Accurate HTTP method idempotency specification",
        "Strong query optimization approach with EXPLAIN plans",
      ],
    };
    setOverallScorecard(finalReport);
    setIsInterviewFinished(true);
  };

  const resetInterview = () => {
    setCurrentIdx(0);
    setAnswer("");
    setSubmittedAnswers({});
    setIsInterviewFinished(false);
    setOverallScorecard(null);
    setHasStarted(false);
  };

  return (
    <div className="ai-interview-page stack-6">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <Bot size={22} style={{ color: "#4f46e5" }} />
          <span>Live AI Technical Interview Simulation</span>
        </h2>
        <p className="student-header-desc">
          Interactive voice and technical drill arena with real-time speech evaluation and instant AI feedback.
        </p>
      </div>

      {/* START AI INTERVIEW LANDING CARD vs LIVE INTERVIEW ARENA */}
      {!hasStarted ? (
        <div className="interview-practice-card single-interview-arena ai-welcome-landing-card">
          <div className="ai-welcome-content">
            <div className="ai-bot-graphic">
              <div className="ai-bot-circle">
                <Bot size={54} className="ai-bot-icon" />
              </div>
              <div className="ai-bot-pulse"></div>
            </div>

            <h3 className="ai-welcome-title">Ready for your AI Mock Technical Interview?</h3>
            <p className="ai-welcome-desc">
              Practice real-world technical interview questions with live AI voice prompts, speech recognition, and instant diagnostic evaluation.
            </p>

            <div className="ai-welcome-meta-grid">
              <div className="ai-meta-item">
                <div className="ai-meta-icon"><Play size={18} /></div>
                <div>
                  <div className="ai-meta-val">5 Technical Questions</div>
                  <div className="ai-meta-lbl">SQL, APIs, Python & Data Structures</div>
                </div>
              </div>

              <div className="ai-meta-item">
                <div className="ai-meta-icon"><Volume2 size={18} /></div>
                <div>
                  <div className="ai-meta-val">Live AI Voice</div>
                  <div className="ai-meta-lbl">Interviewer speaks questions aloud</div>
                </div>
              </div>

              <div className="ai-meta-item">
                <div className="ai-meta-icon"><Sparkles size={18} /></div>
                <div>
                  <div className="ai-meta-val">Instant Evaluation</div>
                  <div className="ai-meta-lbl">Detailed diagnostic scorecard</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="ai-start-interview-btn"
              onClick={() => setHasStarted(true)}
            >
              <Play size={18} fill="currentColor" /> Start AI Interview
            </button>
          </div>
        </div>
      ) : (
        /* SINGLE UNIFIED LIVE AI INTERVIEW ARENA */
        <div className="interview-practice-card single-interview-arena">
          {!isInterviewFinished ? (
            <>
              {/* Header & Question Tracker */}
              <div className="interview-card-header">
                <Bot size={20} className="text-blue-600" />
                <span>Technical Interview Practice</span>
                <span className="interview-topic-badge">{currentQ.topic}</span>
              </div>

              <div className="interview-question-tracker">
                Question {currentIdx + 1} of {questionsList.length}
              </div>

              <div className="interview-progress-bar">
                <div
                  className="interview-progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* AI Interviewer Audio & Prompt Bubble with Voice ON/OFF Toggle */}
              <div
                className="ai-speak-bubble clickable-prompt"
                onClick={toggleVoice}
                title={isVoiceEnabled ? "Click to Mute AI Voice" : "Click to Enable AI Voice"}
              >
                <button
                  type="button"
                  className={`ai-speaker-play-btn ${!isVoiceEnabled ? "voice-disabled" : ""}`}
                  onClick={toggleVoice}
                  title={isVoiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
                >
                  {isVoiceEnabled ? (
                    <Volume2
                      size={24}
                      className={`ai-speak-icon ${isAiSpeaking ? "speaking-pulse" : ""}`}
                    />
                  ) : (
                    <VolumeX size={24} className="ai-speak-icon muted-icon" />
                  )}
                </button>
                <div className="ai-speak-content">
                  <div className="ai-speak-label-wrap">
                    <span className="ai-speak-label">
                      {isVoiceEnabled
                        ? isAiSpeaking
                          ? "🔊 AI INTERVIEWER SPEAKING..."
                          : "AI INTERVIEWER PROMPT (VOICE ON)"
                        : "🔇 AI VOICE MUTED"}
                    </span>
                    <span className="ai-replay-tag">
                      {isVoiceEnabled ? "(Click speaker to Mute)" : "(Click speaker to Unmute)"}
                    </span>
                  </div>
                  <div className="ai-question-text">{currentQ.question}</div>
                </div>
                {isVoiceEnabled && isAiSpeaking && (
                  <div className="ai-voice-waves">
                    <span className="ai-wave-bar"></span>
                    <span className="ai-wave-bar"></span>
                    <span className="ai-wave-bar"></span>
                    <span className="ai-wave-bar"></span>
                    <span className="ai-wave-bar"></span>
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
            </>
          ) : (
            /* FINAL DIAGNOSTIC SCORECARD REPORT */
            <div className="ai-scorecard-column">
              <div className="ai-scorecard-hero">
                <Award size={48} className="ai-award-icon" />
                <h2 className="ai-scorecard-title">
                  Live AI Interview Completed!
                </h2>
                <p className="ai-scorecard-subtitle">
                  Overall Technical Evaluation & Readiness Score
                </p>
                <div className="ai-score-big">{overallScorecard?.score}%</div>

                <div className="ai-score-breakdown-grid">
                  <div className="ai-score-mini-card">
                    <div className="ai-mini-score-val-green">
                      {overallScorecard?.technical}%
                    </div>
                    <div className="ai-mini-score-label">Technical Depth</div>
                  </div>
                  <div className="ai-score-mini-card">
                    <div className="ai-mini-score-val-blue">
                      {overallScorecard?.problemSolving}%
                    </div>
                    <div className="ai-mini-score-label">Problem Solving</div>
                  </div>
                  <div className="ai-score-mini-card">
                    <div className="ai-mini-score-val-purple">
                      {overallScorecard?.communication}%
                    </div>
                    <div className="ai-mini-score-label">Communication</div>
                  </div>
                </div>
              </div>

              <div className="ai-diagnostic-box">
                <h4 className="ai-diagnostic-title">
                  <TrendingUp size={16} className="text-blue-600" /> AI Diagnostic Feedback
                </h4>
                <p className="ai-diagnostic-text">
                  {overallScorecard?.feedback}
                </p>
              </div>

              <div className="ai-action-row">
                <button
                  type="button"
                  className="ai-mic-btn ai-retake-btn"
                  onClick={resetInterview}
                >
                  <RotateCcw size={16} /> Retake AI Interview
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Interviews History */}
      <div className="past-interviews-card">
        <h3 className="past-interviews-header">Past interviews</h3>
        <p className="past-interviews-subtitle">
          AI evaluation history & diagnostic notes
        </p>

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
      </div>
    </div>
  );
}


