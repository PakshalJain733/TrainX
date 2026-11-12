import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, CheckCircle2, Terminal, Code2, FileText, Check, Settings, Layout, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, Lock, AlertCircle, ShieldAlert, User, LogOut, BookOpen, ExternalLink, Sparkles, HelpCircle, X, Award, RotateCcw } from "lucide-react";
import MonacoCodeEditor from "../../../components/ui/MonacoCodeEditor";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import { EVENTS } from "../../../utils/sharedStore";
import "../Styles/ST_CodingPlatform.css";

/* ── Inline dropdown for Coding Platform (CSS: CodingPlatform.css .student-cp-select-*) ── */
function StudentCpSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, disabled = false, disabledTooltip = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const safeOptions = Array.isArray(options) ? options : [];
  const selected = safeOptions.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`student-cp-select-wrap${isOpen ? ' student-cp-select-wrap--open' : ''}${disabled ? ' student-cp-select-wrap--disabled' : ''}`} ref={ref} title={disabled ? (disabledTooltip || 'Language locked for this assignment') : ''}>
      <button 
        type="button" 
        onClick={() => { if (!disabled) setIsOpen(v => !v); }} 
        className={`student-cp-select-trigger${isOpen ? ' student-cp-select-trigger--open' : ''}`}
        disabled={disabled}
        style={disabled ? { opacity: 0.9, cursor: 'not-allowed', background: '#f8fafc', borderColor: '#cbd5e1' } : {}}
      >
        {Icon && <Icon className="student-cp-select-icon" />}
        <span className="student-cp-select-text">{selected ? selected.label : <span className="student-cp-select-placeholder">{placeholder}</span>}</span>
        {disabled ? (
          <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Lock size={10} /> Assigned
          </span>
        ) : (
          <ChevronDown className={`student-cp-select-arrow${isOpen ? ' student-cp-select-arrow--rotate' : ''}`} />
        )}
      </button>
      {isOpen && !disabled && (
        <div className="student-cp-select-dropdown">
          {safeOptions.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`student-cp-select-option${isSel ? ' student-cp-select-option--selected' : ''}`}>
                <span className="student-cp-select-option-label">{opt.label}</span>
                {isSel && <Check className="student-cp-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { getApiBaseUrl, getAuthToken } from "../../../utils/api.js";

const API_BASE = getApiBaseUrl();

function getAuthHeaders() {
  let token = getAuthToken();
  if (!token) {
    try {
      const uSession = JSON.parse(
        sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
      );
      token = uSession.token || uSession.authToken || uSession.auth_token || uSession.accessToken || uSession.jwt;
    } catch (e) {}
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getDynamicProblemDescription(title = "Coding Problem", topic = "Algorithms", originalDesc = "") {
  if (originalDesc && originalDesc.trim() && !originalDesc.includes("No problem description provided")) {
    return originalDesc;
  }

  const cleanTitle = (title || "").trim();
  const lower = cleanTitle.toLowerCase();
  
  if (lower.includes("return first element")) {
    return `Given an array of integers, write a program or function that returns the very first element of the array.\n\nInput Format:\n- Line 1: An integer N representing the size of the array.\n- Line 2: N space-separated integers.\n\nOutput Format:\n- Print a single integer representing the first element of the input array.\n\nConstraints:\n- 1 <= N <= 10^5\n- -10^9 <= Array[i] <= 10^9`;
  }
  
  if (lower.includes("multiply two numbers")) {
    return `Write a program that takes two integers as input and prints their product.\n\nInput Format:\n- A single line containing two space-separated integers A and B.\n\nOutput Format:\n- Print the product of A and B as a single integer.\n\nConstraints:\n- -10^6 <= A, B <= 10^6`;
  }

  if (lower.includes("even") || lower.includes("odd")) {
    return `Write a program to determine whether a given integer N is Even or Odd.\n\nInput Format:\n- A single integer N.\n\nOutput Format:\n- Print 'Even' if N is divisible by 2, otherwise print 'Odd'.\n\nConstraints:\n- -10^9 <= N <= 10^9`;
  }

  return `Write an optimal solution for '${cleanTitle}' in the domain of ${topic}.\n\nProblem Statement:\nImplement a program to process standard input according to the problem requirements for '${cleanTitle}' and print the evaluated output.\n\nInput Format:\n- Standard input formatted as required for ${cleanTitle}.\n\nOutput Format:\n- Output the calculated answer.`;
}

function getDynamicSampleTestCases(title = "", existingCases = []) {
  if (existingCases && existingCases.length > 0) {
    return existingCases.filter(tc => !(tc.is_hidden === true || tc.is_hidden === 1 || String(tc.is_hidden).toLowerCase() === 'true' || tc.isHidden === true || String(tc.isHidden) === 'true'));
  }
  
  const lower = (title || "").toLowerCase();

  if (lower.includes("return first element")) {
    return [
      { input: "3\n5 1 2", expected_output: "5", is_hidden: false },
      { input: "4\n42 10 9 3", expected_output: "42", is_hidden: false }
    ];
  }
  if (lower.includes("multiply two numbers")) {
    return [
      { input: "4 5", expected_output: "20", is_hidden: false },
      { input: "-3 7", expected_output: "-21", is_hidden: false }
    ];
  }
  if (lower.includes("even") || lower.includes("odd")) {
    return [
      { input: "4", expected_output: "Even", is_hidden: false },
      { input: "7", expected_output: "Odd", is_hidden: false }
    ];
  }

  return [];
}

function isDeadlinePassed(deadline) {
  if (!deadline) return false;
  const clean = String(deadline).replace(/^due\s+/i, '').trim();
  if (!clean || clean.toLowerCase() === 'no deadline' || clean.toLowerCase() === 'flexible deadline' || clean.toLowerCase() === 'none') return false;
  const d = new Date(clean);
  if (isNaN(d.getTime())) return false;
  if (!clean.includes(':') && !clean.includes('T')) {
    d.setHours(23, 59, 59, 999);
  }
  return d.getTime() < Date.now();
}

const STARTER_TEMPLATES = {
  python: `# Write your Python solution here\nimport sys\n\ndef main():\n    # Read input from standard input\n    # lines = sys.stdin.read().splitlines()\n    pass\n\nif __name__ == '__main__':\n    main()\n`,
  node: `// Write your JavaScript (Node.js) solution here\nconst fs = require('fs');\n\nfunction main() {\n    // const input = fs.readFileSync(0, 'utf-8').trim();\n}\n\nmain();\n`,
  cpp: `// Write your C++ solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    return 0;\n}\n`,
  c: `// Write your C solution here\n#include <stdio.h>\n\nint main() {\n    return 0;\n}\n`,
  java: `// Write your Java solution here\nimport java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}\n`,
  sql: `-- Write your SQL query here\nSELECT * FROM solution;\n`
};

function normalizeLanguageKey(lang = "") {
  if (!lang) return null;
  const l = String(lang).toLowerCase().trim();
  if (l === "any" || l === "any language" || l === "all" || l === "none" || l === "") return null;
  if (l.includes("py")) return "python";
  if (l.includes("java") && !l.includes("script")) return "java";
  if (l.includes("c++") || l.includes("cpp")) return "cpp";
  if (l === "c") return "c";
  if (l.includes("node") || l.includes("js") || l.includes("script") || l.includes("ts") || l.includes("type")) return "node";
  if (l.includes("sql")) return "sql";
  return null;
}

const ALL_LANGUAGE_OPTIONS = [
  { value: "python", label: "Python 3.10" },
  { value: "node", label: "Node.js 18" },
  { value: "java", label: "Java 17" },
  { value: "cpp", label: "C++ 20" },
  { value: "c", label: "C (C11)" },
  { value: "sql", label: "SQL (SQLite3)" },
];

export default function CodingPlatform() {
  const { taskId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isPractice = Boolean(
    location.state?.source === 'practice' ||
    location.state?.task?.source === 'practice_problem' ||
    String(taskId || '').startsWith('practice-')
  );

  const isRetakeRequested = Boolean(
    location.state?.task?.retakeAvailable ||
    location.state?.isRetake ||
    location.state?.task?.isRetake
  );

  const initialTask = location.state?.task ? {
    ...location.state.task,
    language: location.state?.task?.language || location.state?.task?.lang || "",
    source: location.state?.source || location.state?.task?.source || (location.state?.task?.batch_id ? 'batch_task' : 'practice_problem'),
    description: getDynamicProblemDescription(location.state.task.title, location.state.task.topic || location.state.task.category, location.state.task.description),
    testCases: getDynamicSampleTestCases(location.state.task.title, location.state.task.testCases || location.state.task.test_cases || []),
    alreadySubmitted: isRetakeRequested
      ? false
      : (isPractice
          ? Boolean(location.state?.task?.attemptsCount >= 3)
          : Boolean(location.state?.task?.alreadySubmitted || location.state?.task?.status === 'Completed' || location.state?.task?.status === 'submitted')),
    retakeAvailable: isRetakeRequested || Boolean(location.state?.task?.retakeAvailable)
  } : null;

  const { isModuleActive, getModuleConfig } = useSystemMaintenance();
  const [taskData, setTaskData] = useState(initialTask);
  const [loading, setLoading] = useState(!initialTask);
  const [notFound, setNotFound] = useState(false);
  const initialLangKey = normalizeLanguageKey(initialTask?.language) || "java";
  const [selectedLang, setSelectedLang] = useState(initialLangKey);
  const [code, setCode] = useState(() => STARTER_TEMPLATES[initialLangKey] || STARTER_TEMPLATES.java || "");
  const [hasSubmitted, setHasSubmitted] = useState(() => Boolean(initialTask?.alreadySubmitted && !initialTask?.retakeAvailable));
  const [consoleOutput, setConsoleOutput] = useState("");
  const [consoleStatus, setConsoleStatus] = useState("");
  const [consoleTab, setConsoleTab] = useState("output");
  const [customInput, setCustomInput] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [mobileView, setMobileView] = useState("problem");
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
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
  const hasInitializedAttemptRef = useRef(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const isBatchCoursework = Boolean(
    location.state?.fromBatchCoursework ||
    location.state?.task?.batch_id ||
    taskData?.source === 'batch_task' ||
    taskData?.batch_id ||
    String(taskId || '').toLowerCase().startsWith('task-')
  );

  const isPracticeProblem = Boolean(
    location.state?.source === 'practice' ||
    location.state?.task?.source === 'practice_problem' ||
    taskData?.source === 'practice_problem' ||
    String(taskId || '').toLowerCase().startsWith('practice')
  );

  const isPracticeArena = !isBatchCoursework && Boolean(
    String(taskId || '').toLowerCase().startsWith('practice-') ||
    taskData?.source === 'practice' ||
    location.state?.source === 'practice' ||
    taskId
  );

  const isBatch = isBatchCoursework;

  // Both Batch Coursework and Practice Problems are monitored under examination proctoring
  const isProctoredSession = Boolean(isBatchCoursework || isPracticeProblem || isPracticeArena);

  // Helper to determine if current session was launched via browser page reload (F5 / Ctrl+R)
  const isPageReload = () => {
    try {
      const navEntries = window.performance?.getEntriesByType?.('navigation');
      if (navEntries && navEntries.length > 0) {
        return navEntries[0].type === 'reload';
      }
      return window.performance?.navigation?.type === 1;
    } catch {
      return false;
    }
  };

  // Scoped key generator for proctoring strikes in sessionStorage
  const getProctorStorageKey = () => {
    const sId = user?.userId || user?.id || "guest";
    const tId = String(taskId || taskData?.id || "unknown");
    return isPracticeArena
      ? `proctor_strikes_practice_${sId}_${tId}`
      : `proctor_strikes_${sId}_${tId}`;
  };

  const getProctorAttemptInitKey = () => {
    const sId = user?.userId || user?.id || "guest";
    const tId = String(taskId || taskData?.id || "unknown");
    return isPracticeArena
      ? `proctor_initialized_practice_${sId}_${tId}`
      : `proctor_initialized_${sId}_${tId}`;
  };

  const getStoredProctorStrikes = () => {
    try {
      const val = sessionStorage.getItem(getProctorStorageKey());
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0 ? num : 0;
    } catch {
      return 0;
    }
  };

  const setStoredProctorStrikes = (count) => {
    try {
      sessionStorage.setItem(getProctorStorageKey(), String(count));
    } catch {}
  };

  const clearStoredProctorStrikes = () => {
    try {
      sessionStorage.removeItem(getProctorStorageKey());
      sessionStorage.removeItem(getProctorAttemptInitKey());
    } catch {}
  };

  // Fix 1: Sync ref with persisted storage on mount/task change.
  // - If this is a page reload (F5) within the same active attempt, preserve strikes.
  // - If this is a genuinely new task or practice attempt (navigation), reset stale strikes to zero.
  // - Do not reset strikes merely because React re-renders or the component remounts during the same attempt.
  useEffect(() => {
    if (isProctoredSession) {
      proctorViolationsRef.current = getStoredProctorStrikes();
    }
  }, [taskId, isProctoredSession]);

  const handleProctorViolation = (reason, description) => {
    if (!isProctoredSession || hasSubmitted || !proctorArmedRef.current) return;

    // Fix 2: Only genuine fullscreen exits increment the 3-strike submission counter
    if (reason !== "exit_fullscreen") {
      showClipboardToast(`⚠️ Notice: ${description}`);
      return;
    }

    // Fix 2: Check actual fullscreen state before processing violations.
    // Screen sleep, workstation lock or focus events without an actual exit must not count.
    const isFsNow = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    if (isFsNow) {
      return;
    }

    // Debounce to prevent duplicate strikes (1500ms duplicate event protection)
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
      showClipboardToast(
        `⚠️ Warning ${currentStrikes}/2: ${description} You have ${remaining} chance${remaining === 1 ? '' : 's'} left before automatic submission.`
      );
    } else {
      clearStoredProctorStrikes();
      endTaskDueToViolation(reason, `${description} Maximum violation limit (2 warnings) reached.`);
    }
  };

  // Batch tasks list from navigation state (guaranteed isolated from practice problems)
  const batchTasksList = Array.isArray(location.state?.batchTasks) ? location.state.batchTasks : [];

  const currentBatchIndex = isBatchCoursework && batchTasksList.length > 0
    ? batchTasksList.findIndex((bt) => {
        const slug = String(bt.taskNumber || '').replace(/\s+/g, '-').toLowerCase();
        return slug === String(taskId || '').toLowerCase() || `task-${bt.id}` === String(taskId || '').toLowerCase() || String(bt.id) === String(taskData?.id);
      })
    : -1;

  const canNavigatePrev = isBatchCoursework
    ? (currentBatchIndex > 0)
    : (parseInt(String(taskId || '').replace(/[^0-9]/g, '') || '1', 10) > 1);

  const canNavigateNext = isBatchCoursework
    ? (currentBatchIndex >= 0 && currentBatchIndex < batchTasksList.length - 1)
    : false;

  const handlePrevNavigation = () => {
    clearStoredProctorStrikes();
    proctorViolationsRef.current = 0;
    if (isBatchCoursework) {
      if (canNavigatePrev && currentBatchIndex > 0) {
        const prevTask = batchTasksList[currentBatchIndex - 1];
        navigate(`/student/coding-platform/task-${prevTask.id}`, {
          state: {
            task: prevTask,
            batchTasks: batchTasksList,
            batchId: location.state?.batchId || taskData?.batch_id,
            fromBatchCoursework: true,
            enterFullscreen: true,
          }
        });
      }
    } else {
      const num = parseInt(String(taskId || '').replace(/[^0-9]/g, '') || '1', 10);
      navigate(`/student/coding-platform/practice-${Math.max(1, num - 1)}`, {
        state: { source: 'practice' }
      });
    }
  };

  const handleNextNavigation = () => {
    clearStoredProctorStrikes();
    proctorViolationsRef.current = 0;
    if (isBatchCoursework) {
      if (canNavigateNext && currentBatchIndex >= 0 && currentBatchIndex < batchTasksList.length - 1) {
        const nextTask = batchTasksList[currentBatchIndex + 1];
        navigate(`/student/coding-platform/task-${nextTask.id}`, {
          state: {
            task: nextTask,
            batchTasks: batchTasksList,
            batchId: location.state?.batchId || taskData?.batch_id,
            fromBatchCoursework: true,
            enterFullscreen: true,
          }
        });
      }
    }
  };

  const showClipboardToast = (msg) => {
    setClipboardWarning(msg);
    setTimeout(() => setClipboardWarning(""), 3500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
      if (isProctoredSession) setIsProctorActive(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
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
    if (isProctoredSession && !hasSubmitted) {
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
            } else {
              handleProctorViolation("exit_fullscreen", "Full-screen mode was exited!");
            }
          }
        });
      } else {
        setProctorConfirmModal({
          title: "Final Warning: Submission Will Trigger",
          message: "Exiting full-screen now will exceed your 2 allowed warnings. Your task will be ended and your current code will be automatically submitted. Proceed?",
          isDanger: true,
          onConfirm: () => {
            setProctorConfirmModal(null);
            if (document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            } else {
              handleProctorViolation("exit_fullscreen", "Full-screen mode was exited!");
            }
          }
        });
      }
      return;
    }
    toggleFullscreen();
  };

  const endTaskDueToViolation = (reason, description) => {
    if (hasAutoSubmittedRef.current || hasSubmitted) return;
    hasAutoSubmittedRef.current = true;
    proctorArmedRef.current = false;
    setProctorTerminated(true);
    setTerminationReason(reason);
    setHasSubmitted(true);

    setConsoleStatus("error");
    const reasonLabel = reason === "exit_fullscreen"
      ? "⚠️ Full-screen exited! Solution automatically submitted as per exam guidelines."
      : "⚠️ Tab switch detected! Solution automatically submitted as per exam guidelines.";
    setConsoleOutput(`${reasonLabel}\nEvaluating test cases in Docker sandbox...`);

    if (submitRef.current && !isSubmitting) {
      submitRef.current({ isAutoSubmit: true, reason });
    }

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);

      if (isProctoredSession && !hasSubmitted && proctorArmedRef.current && !isFs) {
        handleProctorViolation("exit_fullscreen", "Full-screen mode was exited!");
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
    };
  }, [isProctoredSession, hasSubmitted]);

  // Tab switching, blur, and anti-cheat keyboard shortcuts
  useEffect(() => {
    if (!isProctoredSession || hasSubmitted) return;

    let armTimer = null;
    if (isProctorActive && isFullscreen) {
      armTimer = setTimeout(() => {
        proctorArmedRef.current = true;
      }, 2500);
    } else {
      proctorArmedRef.current = false;
    }

    const handleTabSwitchEvent = () => {
      showClipboardToast("⚠️ Tab switching / Alt+Tab is detected during proctored tasks.");
    };

    const handleVisibilityChange = () => {
      if (document.hidden && proctorArmedRef.current && !hasSubmitted) {
        handleTabSwitchEvent();
      }
    };

    const handleWindowBlur = () => {
      // Ordinary window blur, workstation lock or screen sleep:
      // Show notification only; do NOT increment fullscreen strike counter or auto-submit
      if (document.hidden && proctorArmedRef.current && !hasSubmitted) {
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
        showClipboardToast("⚠️ Alt key navigation is disabled during proctored tasks.");
        return;
      }

      if (isMod && (key === "tab" || code === "Tab" || key === "w" || key === "t" || key === "n")) {
        e.preventDefault();
        e.stopPropagation();
        showClipboardToast("⚠️ Tab switching shortcuts are disabled during this task.");
        return;
      }

      if (key === "f11" || code === "F11" || key === "f12" || code === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (
        (isMod && (key === "v" || code === "KeyV" || key === "c" || code === "KeyC" || key === "x" || code === "KeyX")) ||
        (e.shiftKey && (key === "insert" || code === "Insert"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showClipboardToast("⚠️ Copying, cutting, and pasting is disabled in the compiler! Type your code manually.");
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
  }, [isProctoredSession, hasSubmitted, isProctorActive, isFullscreen]);

  // Global clipboard and drag/drop blockers (strict compiler anti-cheat)
  useEffect(() => {
    const blockClipboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
      showClipboardToast("⚠️ Copying, cutting, and pasting is strictly disabled in the compiler! You must type your solution manually.");
    };

    const blockContext = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const blockDragDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("copy", blockClipboard, true);
    document.addEventListener("cut", blockClipboard, true);
    document.addEventListener("paste", blockClipboard, true);
    document.addEventListener("contextmenu", blockContext, true);
    document.addEventListener("dragstart", blockDragDrop, true);
    document.addEventListener("drop", blockDragDrop, true);

    return () => {
      document.removeEventListener("copy", blockClipboard, true);
      document.removeEventListener("cut", blockClipboard, true);
      document.removeEventListener("paste", blockClipboard, true);
      document.removeEventListener("contextmenu", blockContext, true);
      document.removeEventListener("dragstart", blockDragDrop, true);
      document.removeEventListener("drop", blockDragDrop, true);
    };
  }, []);

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "ST";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true);
      setNotFound(false);
      const requested = String(taskId || '');
      const numeric = requested.replace(/[^0-9]/g, '');

      // Strict determination: Batch Coursework Task vs Practice Problem
      const isBatchTarget = Boolean(
        location.state?.fromBatchCoursework ||
        location.state?.task?.batch_id ||
        taskData?.source === 'batch_task' ||
        taskData?.batch_id ||
        requested.toLowerCase().startsWith('task-')
      );

      try {
        if (isBatchTarget) {
          // ── 1. STRICT BATCH TASK PIPELINE ──
          // Never touch practice problems and never fallback to practice problems
          try {
            const res = await fetch(`${API_BASE}/batches/tasks/detail/${taskId}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (res.ok && data?.success && data?.data) {
              const t = data.data;
              const rawCases = t.testCases || t.test_cases || [];
              const taskLang = t.language || "";
              const taskNormKey = normalizeLanguageKey(taskLang);
              if (taskNormKey) {
                setSelectedLang(taskNormKey);
                setCode((prevCode) => {
                  const prev = typeof prevCode === "string" ? prevCode : "";
                  return prev.trim() ? prev : (STARTER_TEMPLATES[taskNormKey] || "");
                });
              }
              const isRetakeActive = Boolean(t.retakeAvailable);
              if (t.alreadySubmitted && !isRetakeActive) {
                setHasSubmitted(true);
                const prevCode = t.submission?.submitted_code || t.submission?.code_submission || t.submission?.code;
                if (prevCode) {
                  setCode(prevCode);
                }
              } else {
                setHasSubmitted(false);
              }
              setTaskData({
                id: t.id,
                batch_id: t.batch_id,
                title: t.title,
                topic: t.topic || "General Assignment",
                difficulty: t.difficulty || "Medium",
                points: t.points || 100,
                deadline: t.deadline || "",
                description: getDynamicProblemDescription(t.title, t.topic, t.description || t.desc),
                testCases: getDynamicSampleTestCases(t.title, rawCases),
                source: "batch_task",
                language: taskLang,
                alreadySubmitted: Boolean(t.alreadySubmitted),
                retakeAvailable: isRetakeActive,
                retakePermission: t.retakePermission || null,
                submissions: Array.isArray(t.submissions) ? t.submissions : (t.submission ? [t.submission] : []),
                isExpired: Boolean(t.isExpired),
              });
              return;
            }
          } catch (err) {
            console.warn("Failed fetching batch task detail:", err);
          }

          if (initialTask && (initialTask.source === 'batch_task' || initialTask.batch_id || isBatchTarget)) {
            setTaskData(initialTask);
            return;
          }

          // If the batch task is not found, show Not Found! DO NOT fall back to practice problems!
          setNotFound(true);
          return;
        }

        // ── 2. STRICT PRACTICE PROBLEM PIPELINE ──
        if (numeric) {
          try {
            const probRes = await fetch(`${API_BASE}/student/practice-problems/${numeric}`, { headers: getAuthHeaders() });
            const probData = await probRes.json();
            if (probRes.ok && probData.success && probData.data) {
              const p = probData.data;
              const rawCases = p.testCases || p.cases || p.test_cases || [];
              const taskLang = p.language || "";
              const taskNormKey = normalizeLanguageKey(taskLang);
              if (taskNormKey) {
                setSelectedLang(taskNormKey);
                setCode((prevCode) => {
                  const prev = typeof prevCode === "string" ? prevCode : "";
                  return prev.trim() ? prev : (STARTER_TEMPLATES[taskNormKey] || "");
                });
              }
              const isRetakeActive = Boolean(p.retakeAvailable);
              if (isRetakeActive) {
                setHasSubmitted(false);
              }
              setTaskData({
                id: p.id,
                title: p.title,
                topic: p.category || p.topic || "General DSA",
                difficulty: p.difficulty || "Medium",
                points: p.points || 100,
                deadline: p.due_date ? new Date(p.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : (p.dueDate || ""),
                description: getDynamicProblemDescription(p.title, p.category || p.topic, p.description),
                testCases: getDynamicSampleTestCases(p.title, rawCases),
                source: "practice_problem",
                language: taskLang,
                retakeAvailable: isRetakeActive,
                isExpired: Boolean(p.isExpired || p.is_expired),
              });
              return;
            }
          } catch (err) {
            console.warn("Failed fetching practice problem details:", err);
          }
        }

        if (initialTask && initialTask.source === 'practice_problem') {
          setTaskData(initialTask);
          return;
        }

        setNotFound(true);
      } catch (err) {
        console.error("Failed to fetch task details:", err);
        if (initialTask) {
          setTaskData(initialTask);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  // Line numbers array (safely guarded against any non-string values)
  const safeCode = typeof code === "string" ? code : String(code ?? "");
  const lineCount = safeCode.split('\n').length;
  const lines = Array.from({ length: Math.max(15, lineCount) }, (_, i) => i + 1);

  const currentTaskNum = taskId ? parseInt(taskId.replace(/[^0-9]/g, '')) || 1 : 1;

  const assignedLangKey = normalizeLanguageKey(taskData?.language || location.state?.task?.language);
  const isLanguageLocked = Boolean(assignedLangKey);

  const rawDeadline = taskData?.deadline || location.state?.task?.deadline || location.state?.task?.dueDate || location.state?.task?.due;
  const isRetakeActive = Boolean(taskData?.retakeAvailable);
  const isDeadlinePassedVal = isDeadlinePassed(rawDeadline);
  const isTaskExpired = !isRetakeActive && Boolean(
    taskData?.isExpired ||
    location.state?.task?.isExpired ||
    (isDeadlinePassedVal && !hasSubmitted)
  );
  const isCompilerLocked = (hasSubmitted || isTaskExpired) && !isRetakeActive;

  const handleLanguageChange = (newLang) => {
    if (isLanguageLocked && newLang !== assignedLangKey) {
      return;
    }
    setSelectedLang(newLang);
    setCode((prevCode) => {
      const prev = typeof prevCode === "string" ? prevCode : "";
      if (!prev.trim() || Object.values(STARTER_TEMPLATES).some((t) => t.trim() === prev.trim())) {
        return STARTER_TEMPLATES[newLang] || "";
      }
      return prev;
    });
  };
  
  const handleRun = async () => {
    if (isRunning || isSubmitting) return;
    if (isTaskExpired) {
      setConsoleStatus("error");
      setConsoleOutput("🔒 Deadline Expired: The submission deadline for this task has ended. Code execution and submissions are closed.");
      return;
    }
    if (hasSubmitted && !isRetakeActive) {
      setConsoleStatus("error");
      setConsoleOutput(
        isBatch
          ? "🔒 You have already submitted this batch task. The compiler is locked."
          : "🔒 Maximum submission limit reached (3 attempts allowed per problem)."
      );
      return;
    }
    if (!isModuleActive("codingCompiler")) {
      setConsoleStatus("error");
      setConsoleOutput(`⚠️ Compiler service disabled:\n${getModuleConfig("codingCompiler")?.message || "Code Execution is currently undergoing maintenance."}`);
      return;
    }
    const currentCode = (typeof code === "string" ? code : String(code ?? "")).trim();
    if (!currentCode) {
      setConsoleOutput("⚠️  Write some code before running.");
      setConsoleStatus("error");
      return;
    }
    setIsRunning(true);
    setConsoleStatus("running");
    setConsoleOutput("Running code...");
    setMobileView("code");

    // Use custom input if enabled, else the first visible (non-hidden) test case's input, or empty
    const sampleTc = (taskData?.testCases || taskData?.test_cases || [])
      .find((tc) => !(tc.is_hidden === true || tc.is_hidden === 1 || String(tc.is_hidden).toLowerCase() === 'true' || tc.isHidden === true || String(tc.isHidden) === 'true'));
    const stdin = useCustomInput ? customInput : (sampleTc?.input ?? "");

    try {
      const res = await fetch(`${API_BASE}/code/run`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ language: selectedLang, code: typeof code === "string" ? code : String(code ?? ""), stdin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setConsoleStatus("error");
        if (data?.message?.includes("Docker") || data?.message?.includes("unavailable")) {
          setConsoleOutput(`⚠️ Compiler service is currently unavailable. Please try again later.`);
        } else {
          setConsoleOutput(`❌ Error: ${data.message || "Unknown error"}`);
        }
        return;
      }

      const result = data.data || data;

      if (result.compilationError) {
        setConsoleStatus("ce");
        setConsoleOutput(`🔴 Compilation Error\n\n${result.stderr || "Check your syntax."}`);
      } else if (result.timedOut) {
        setConsoleStatus("tle");
        setConsoleOutput(`⏱️  Time Limit Exceeded (${result.executionTime}ms)`);
      } else if (result.exitCode !== 0) {
        setConsoleStatus("error");
        setConsoleOutput(
          `🔴 Runtime Error (exit code ${result.exitCode})\n\n${result.stderr ? `Stderr:\n${result.stderr}` : ""}${result.stdout ? `\nStdout (partial):\n${result.stdout}` : ""}`
        );
      } else {
        setConsoleStatus("success");
        const outputText = result.stdout?.trim() || "(no output)";
        const expectedText = sampleTc?.expected_output?.trim() ?? sampleTc?.expectedOutput?.trim() ?? null;
        let verdict = "";
        if (expectedText !== null) {
          const match = outputText === expectedText;
          verdict = match ? "\n\n✅ Output matches expected!" : `\n\n❌ Expected:\n${expectedText}\n\nGot:\n${outputText}`;
        }
        setConsoleOutput(
          `✅ Execution successful (${result.executionTime}ms)\n\nOutput:\n${outputText}${verdict}`
        );
      }
    } catch (err) {
      setConsoleStatus("error");
      setConsoleOutput(`❌ Network error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async (opts = {}) => {
    const isAuto = opts?.isAutoSubmit === true;

    if (isSubmitting || isRunning) return;
    if (isTaskExpired) {
      setConsoleStatus("error");
      setConsoleOutput("🔒 Deadline Expired: The submission deadline for this task has ended. Submissions are closed.");
      return;
    }
    if (hasSubmitted && !isAuto && !isRetakeActive) {
      setConsoleStatus("error");
      setConsoleOutput(
        isBatch
          ? "🔒 You have already submitted this batch task. The compiler is locked and reattempts are not allowed."
          : "🔒 Maximum submission limit reached (3 attempts allowed per problem)."
      );
      return;
    }
    if (!isAuto && !isModuleActive("codingCompiler")) {
      setConsoleStatus("error");
      setConsoleOutput(`⚠️ Compiler service disabled:\n${getModuleConfig("codingCompiler")?.message || "Code Execution and Submission is currently undergoing maintenance."}`);
      return;
    }
    let currentCode = (typeof code === "string" ? code : String(code ?? "")).trim();
    if (!currentCode) {
      if (isAuto) {
        currentCode = STARTER_TEMPLATES[selectedLang] || "// Auto-submitted due to tab switch";
      } else {
        setConsoleOutput("⚠️  Write some code before submitting.");
        setConsoleStatus("error");
        return;
      }
    }
    if (!taskData?.id) {
      setConsoleOutput("⚠️  No problem ID found. Cannot submit.");
      setConsoleStatus("error");
      return;
    }

    if (isBatch && (submissions.length >= 1 || taskData?.alreadySubmitted) && !isRetakeActive) {
      setHasSubmitted(true);
      setConsoleOutput("🔒 You have already submitted this batch task. The compiler is locked and reattempts are not allowed.");
      setConsoleStatus("error");
      return;
    }

    if (!isBatch && submissions.length >= 3 && !isRetakeActive) {
      setHasSubmitted(true);
      setConsoleOutput("🔒 Maximum submission limit reached (3/3 attempts used). You cannot submit again for this problem.");
      setConsoleStatus("error");
      return;
    }
    setIsSubmitting(true);
    setConsoleStatus("running");
    if (isAuto) {
      setConsoleOutput("⚠️ Tab switch detected! Solution automatically submitted as per exam guidelines. Evaluating test xases in sandbox...");
    } else {
      setConsoleOutput("Evaluating all test cases in sandbox...");
    }
    setMobileView("code");

    try {
      const res = await fetch(`${API_BASE}/code/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          language: selectedLang,
          code: currentCode,
          problem_id: taskData.id,
          task_id: taskId,
          source: isBatch ? 'batch_task' : 'practice_problem',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setConsoleStatus("error");
        const msg = String(data?.message || "");
        const isMaxLimit = msg.toLowerCase().includes("maximum submission limit") || Boolean(data?.attemptsUsed >= 3);
        const isBatchLocked = isBatch && (msg.toLowerCase().includes("already") || Boolean(data?.isBatchLocked));
        if (isMaxLimit || isBatchLocked) {
          setHasSubmitted(true);
          setConsoleOutput(`🔒 ${msg || "Maximum submission limit reached."}`);
        } else if (msg.includes("Docker") || msg.includes("unavailable")) {
          setConsoleOutput(`⚠️ Compiler service is currently unavailable. Please try again later.`);
        } else {
          setConsoleOutput(`❌ Submission failed: ${msg || "Unknown error"}`);
        }
        return;
      }

      const result = data.data || data;
      const passed = result.passed_tests ?? 0;
      const total = result.total_tests ?? 0;
      const status = result.status || "";

      // Build summary header
      let header = "";
      if (result.compilation_error) {
        setConsoleStatus("ce");
        header = `🔴 Compilation Error\n`;
      } else if (result.timed_out) {
        setConsoleStatus("tle");
        header = `⏱️  Time Limit Exceeded\n`;
      } else if (passed === total && total > 0) {
        setConsoleStatus("success");
        header = `✅ ${passed} / ${total} test cases passed  —  ACCEPTED\n`;
      } else if (passed > 0) {
        setConsoleStatus("warning");
        header = `⚠️ ${passed} / ${total} test cases passed  —  PARTIALLY ACCEPTED\n`;
      } else {
        setConsoleStatus("error");
        header = `❌ ${passed} / ${total} test cases passed  —  WRONG ANSWER\n`;
      }

      const scoreVal = result.marks ?? result.score ?? 0;
      const totalMarksVal = result.total_marks ?? taskData?.points ?? 100;
      const scoreLine = `Marks: ${scoreVal} / ${totalMarksVal} pts  (${result.percentage ?? 0}%)\n`;
      const timeLine = result.execution_time_ms != null ? `Execution Time: ${result.execution_time_ms}ms\n` : "";

      // Per-test-case breakdown
      const tcLines = (result.test_results || []).map((tc) => {
        const isHidden = tc.is_hidden === true || tc.is_hidden === 1 || String(tc.is_hidden).toLowerCase() === 'true' || tc.isHidden === true || String(tc.isHidden) === 'true';
        const icon = tc.passed ? "✅" : tc.timed_out ? "⏱️" : tc.not_evaluated ? "⏭️" : "❌";
        let line = `  ${icon} Test ${tc.test_case_number}${isHidden ? " [Hidden]" : ""}${
          tc.passed ? " PASS" : tc.not_evaluated ? " Not evaluated" : tc.timed_out ? " TLE" : " FAIL"
        }`;
        if (!isHidden && !tc.passed && !tc.not_evaluated && tc.actual_output !== undefined) {
          line += `\n     Expected: ${String(tc.expected_output ?? "").trim() || "(empty)"}\n     Got:      ${String(tc.actual_output ?? "").trim() || "(empty)"}`;
          if (tc.stderr && tc.stderr.trim()) line += `\n     Stderr:   ${tc.stderr.trim().slice(0, 200)}`;
        }
        return line;
      });

      setConsoleOutput(
        [header, scoreLine, timeLine, "\nTest Cases:", ...tcLines].filter(Boolean).join("\n")
      );

      // Lock task: Batch tasks strictly lock after 1 submission; practice problems lock at 3 submissions or after retake attempt
      const attemptsCount = result.attempts_used ?? (submissions.length + 1);
      if (isBatch || attemptsCount >= 3 || taskData?.retakeAvailable || isRetakeActive) {
        setHasSubmitted(true);
        setTaskData(prev => prev ? { ...prev, retakeAvailable: false } : prev);
        clearStoredProctorStrikes();
        proctorViolationsRef.current = 0;
      } else {
        setHasSubmitted(false);
        // Reset Practice Arena strikes after each successful manual submission, before the next attempt
        clearStoredProctorStrikes();
        proctorViolationsRef.current = 0;
      }
      setActiveTab("submissions");
      loadSubmissions();

      // Dispatch global events to update dashboard & practice problems progress bars
      window.dispatchEvent(new CustomEvent("codeSubmitted", { detail: result }));
      window.dispatchEvent(new Event("codeSubmitted"));
      window.dispatchEvent(new Event(EVENTS.CODING_UPDATED));
      window.dispatchEvent(new Event("portal_coding_updated"));
    } catch (err) {
      setConsoleStatus("error");
      setConsoleOutput(`❌ Network error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/code/submissions/my`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data?.data?.submissions) {
        const problemId = String(taskData?.id || "");
        const matched = data.data.submissions.filter((s) => String(s.problem_id) === problemId);
        setSubmissions(matched);

        const isRetake = Boolean(taskData?.retakeAvailable || isRetakeActive);

        let combined = matched;
        if (isBatch && matched.length === 0 && Array.isArray(taskData?.submissions) && taskData.submissions.length > 0) {
          combined = taskData.submissions.map((sub, idx) => ({
            id: sub.id,
            status: (sub.status || '').toLowerCase(),
            marks: sub.score ?? sub.marks_obtained ?? 0,
            score: sub.score ?? sub.marks_obtained ?? 0,
            percentage: sub.status === 'Passed' ? 100 : 0,
            passed_test_cases: sub.status === 'Passed' ? (taskData.testCases?.length || 1) : 0,
            total_test_cases: taskData.testCases?.length || 1,
            language: taskData.language || 'Java',
            submitted_at: sub.submitted_at,
            attempt_number: sub.attempt_number || (idx + 1),
            is_retake: Boolean(sub.is_retake),
            feedback: sub.feedback,
          }));
        }
        setSubmissions(combined);

        if (isRetake) {
          setHasSubmitted(false);
        } else if (isBatch) {
          if (combined.length > 0 || taskData?.alreadySubmitted) {
            setHasSubmitted(true);
          }
        } else {
          if (combined.length >= 3) {
            setHasSubmitted(true);
          } else {
            setHasSubmitted(false);
          }
        }
      }
    } catch { /* ignore */ } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (taskData?.id) loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskData?.id, activeTab]);

  
  const submitRef = useRef(null);
  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  const testCasesList = taskData?.testCases || taskData?.test_cases || [];

  return (
    <div className="student-page-inner student-page-inner--coding">
      <div className={`coding-platform-container ${isFullscreen ? 'is-fullscreen' : ''}`}>
        {notFound && (
          <div className="cp-not-found" style={{ padding: "40px 24px", textAlign: "center" }}>
            <h2 style={{ marginBottom: "10px", fontSize: "18px" }}>Problem not found</h2>
            <p style={{ color: "#64748b", marginBottom: "16px" }}>
              This task or problem is not available. It may have been deleted.
            </p>
            <Link to={isBatchCoursework ? "/student/batches" : "/student/practice"} className="cp-back-btn">
              {isBatchCoursework ? "← Back to My Batches" : "← Back to Practice"}
            </Link>
          </div>
        )}
        {!notFound && (
        <>
        {/* IDE Header */}
        <div className="cp-header">
          <div className="cp-header-left">
            <button 
              type="button" 
              onClick={() => {
                if (isProctoredSession && !hasSubmitted) {
                  setProctorConfirmModal({
                    title: isBatchCoursework ? "Leave Proctored Coursework?" : "Leave Proctored Practice?",
                    message: isBatchCoursework
                      ? "Leaving this page will exit the proctored coursework environment. Are you sure you want to return to My Batches?"
                      : "Leaving this page will exit the proctored practice arena. Are you sure you want to return to Practice?",
                    isDanger: true,
                    onConfirm: () => {
                      setProctorConfirmModal(null);
                      proctorArmedRef.current = false;
                      clearStoredProctorStrikes();
                      proctorViolationsRef.current = 0;
                      if (document.fullscreenElement) {
                        document.exitFullscreen?.().catch(() => {});
                      }
                      if (isBatchCoursework) {
                        navigate('/student/batches');
                      } else if (window.history.length > 2) {
                        navigate(-1);
                      } else {
                        navigate('/student/practice');
                      }
                    }
                  });
                  return;
                }
                proctorArmedRef.current = false;
                clearStoredProctorStrikes();
                proctorViolationsRef.current = 0;
                if (document.fullscreenElement) {
                  document.exitFullscreen?.().catch(() => {});
                }
                if (isBatchCoursework) {
                  navigate('/student/batches');
                } else if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate('/student/practice');
                }
              }} 
              className="cp-back-btn"
              title={isBatchCoursework ? "Back to Coursework" : "Back to Problems"}
            >
              <ArrowLeft size={15} />
              <span>{isBatchCoursework ? "Coursework" : "Problems"}</span>
            </button>

            <div className="cp-header-divider" />

            <div className="cp-task-title-group">
              <h1 className="cp-task-title">
                {taskData?.title || (taskId ? `Task ${taskId.toUpperCase()}` : "Coding Problem")}
              </h1>
              {(() => {
                const diffStr = String(taskData?.difficulty || taskData?.level || "Easy").toUpperCase();
                const cls = diffStr.includes("HARD") ? "cp-badge-hard" : diffStr.includes("MED") ? "cp-badge-med" : "cp-badge-easy";
                const label = diffStr.includes("HARD") ? "Hard" : diffStr.includes("MED") ? "Medium" : "Easy";
                return <span className={`cp-task-badge ${cls}`}>{label}</span>;
              })()}
            </div>

            {(!isBatchCoursework || batchTasksList.length > 1) && (
              <div className="cp-header-nav-group">
                <button 
                  type="button"
                  className="cp-nav-btn" 
                  onClick={handlePrevNavigation}
                  disabled={!canNavigatePrev}
                  title={canNavigatePrev ? "Previous Task" : "No Previous Task"}
                  style={!canNavigatePrev ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  type="button"
                  className="cp-nav-btn" 
                  onClick={handleNextNavigation}
                  disabled={!canNavigateNext}
                  title={canNavigateNext ? "Next Task" : "No Next Task"}
                  style={!canNavigateNext ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
          
          <div className="cp-header-right">
            <StudentCpSelect
              value={selectedLang}
              options={
                isLanguageLocked
                  ? ALL_LANGUAGE_OPTIONS.filter((o) => o.value === assignedLangKey).map((o) => ({
                      ...o,
                      label: `${o.label} (Assigned)`,
                    }))
                  : ALL_LANGUAGE_OPTIONS
              }
              onChange={handleLanguageChange}
              disabled={isLanguageLocked}
              disabledTooltip={`Language is strictly locked to ${taskData?.language || 'assigned language'} for this task.`}
            />
            
            <button
              type="button"
              className={`cp-run-btn ${!isModuleActive("codingCompiler") || isCompilerLocked ? 'cp-btn--off' : ''}`}
              onClick={handleRun}
              disabled={!isModuleActive("codingCompiler") || isRunning || isSubmitting || isCompilerLocked}
              title={
                isTaskExpired
                  ? "Deadline Expired: Submissions and code execution are closed."
                  : (hasSubmitted && !isRetakeActive)
                  ? (isBatch 
                      ? "This batch task has been submitted. Compiler execution is locked." 
                      : "Maximum submission limit reached (3/3 attempts used).")
                  : (!isModuleActive("codingCompiler") ? "Code execution is currently disabled by administrator" : "Run Code")
              }
              style={(!isModuleActive("codingCompiler") || isCompilerLocked) ? { opacity: 0.55, cursor: "not-allowed" } : {}}
            >
              {isTaskExpired ? (
                <span>Run (Expired)</span>
              ) : (hasSubmitted && !isRetakeActive) ? (
                <span>Run (Locked)</span>
              ) : isRunning ? (
                <span>Running...</span>
              ) : (
                <><Play size={13} fill="currentColor" /> <span>{isModuleActive("codingCompiler") ? "Run" : "Run (Off)"}</span></>
              )}
            </button>
            
            <button
              type="button"
              className={`cp-submit-btn ${!isModuleActive("codingCompiler") || isCompilerLocked ? 'cp-btn--off' : ''}`}
              onClick={handleSubmit}
              disabled={!isModuleActive("codingCompiler") || isSubmitting || isRunning || isCompilerLocked}
              title={
                isTaskExpired
                  ? "Deadline Expired: The submission deadline for this task has passed."
                  : isRetakeActive
                  ? "Submit Code (Retake Attempt - 1 attempt remaining)"
                  : hasSubmitted 
                  ? (isBatch 
                      ? "This batch task has already been submitted. Reattempts are strictly disabled." 
                      : `Maximum submission limit reached (${Math.min(submissions.length || 3, 3)}/3 attempts used).`)
                  : (!isModuleActive("codingCompiler") 
                      ? "Code submission is currently disabled by administrator" 
                      : (isBatch 
                          ? "Submit Batch Task (Single Attempt Allowed)" 
                          : `Submit Code (${Math.max(0, 3 - submissions.length)} attempts remaining)`))
              }
              style={(!isModuleActive("codingCompiler") || isCompilerLocked) ? { opacity: 0.55, cursor: "not-allowed" } : {}}
            >
              {isTaskExpired ? (
                <><Lock size={14} /> <span>Deadline Expired</span></>
              ) : isRetakeActive ? (
                <><CheckCircle2 size={14} /> <span>Submit Retake (1 chance)</span></>
              ) : hasSubmitted ? (
                <><CheckCircle2 size={14} /> <span>{isBatch ? "Submitted (Locked)" : `${Math.min(submissions.length || 3, 3)}/3 Submitted (Locked)`}</span></>
              ) : isSubmitting ? (
                <span>Evaluating...</span>
              ) : (
                <><CheckCircle2 size={14} /> <span>{isModuleActive("codingCompiler") ? (isBatch ? "Submit Task" : `Submit (${Math.min(submissions.length, 3)}/3)`) : "Submit (Off)"}</span></>
              )}
            </button>

            {isProctoredSession && (
              <div className="cp-proctor-live-badge" title="This task is actively proctored. Exiting full-screen or switching tabs will immediately end your task.">
                <span className="cp-proctor-live-pulse" />
                <span>{isBatchCoursework ? "Proctored Task (Anti-Cheat Active)" : "Proctored Practice (Anti-Cheat Active)"}</span>
              </div>
            )}

            <div className="cp-header-divider" />

            <button
              type="button"
              className="cp-fs-toggle-btn"
              onClick={handleToggleFullscreenClick}
              title={isFullscreen ? (isProctoredSession && !hasSubmitted ? "Locked Full-Screen (Exiting Ends Task)" : "Exit Full Screen") : "Full Screen"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {user?.name && (
              <div className="cp-user-menu-wrap" ref={userMenuRef}>
                <button
                  type="button"
                  className={`cp-user-profile-btn ${userMenuOpen ? "active" : ""}`}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  title={`${user.name} • Student Account (${user.email || "TrainX"})`}
                  aria-expanded={userMenuOpen}
                >
                  <div className="cp-user-avatar">
                    {getInitials(user.name)}
                  </div>
                  <div className="cp-user-meta">
                    <span className="cp-user-name">{user.name}</span>
                    <span className="cp-user-role">STUDENT</span>
                  </div>
                  <ChevronDown size={14} className={`cp-user-chevron ${userMenuOpen ? "rotated" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="cp-user-dropdown-popover">
                    <div className="cp-user-popover-header">
                      <div className="cp-popover-avatar">
                        {getInitials(user.name)}
                      </div>
                      <div className="cp-popover-user-info">
                        <div className="cp-popover-name">{user.name}</div>
                        <div className="cp-popover-email">{user.email || "student@trainx.internal"}</div>
                        <span className="cp-popover-role-pill">
                          <CheckCircle2 size={11} /> Verified Student
                        </span>
                      </div>
                    </div>

                    <div className="cp-popover-divider" />

                    <div className="cp-popover-actions">
                      <button
                        type="button"
                        className="cp-popover-action-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (isProctoredSession && !hasSubmitted) {
                            if (window.confirm("You are currently inside a proctored session. Navigating away may mark your attempt as finished. Are you sure you want to view profile?")) {
                              navigate("/student/profile");
                            }
                          } else {
                            navigate("/student/profile");
                          }
                        }}
                      >
                        <User size={15} />
                        <span>View Student Profile</span>
                      </button>

                      <div className="cp-popover-divider" />

                      <button
                        type="button"
                        className="cp-popover-action-item cp-popover-action-item--danger"
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (isProctoredSession && !hasSubmitted) {
                            if (!window.confirm("You have an active proctored task. Signing out will terminate the session. Proceed to sign out?")) {
                              return;
                            }
                          }
                          sessionStorage.clear();
                          localStorage.removeItem("token");
                          localStorage.removeItem("user");
                          navigate("/login");
                        }}
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Segmented View Switcher */}
        <div className="cp-mobile-tab-bar">
          <button
            type="button"
            className={`cp-mobile-tab ${mobileView === 'problem' ? 'active' : ''}`}
            onClick={() => setMobileView('problem')}
          >
            <FileText size={15} /> Problem Statement
          </button>
          <button
            type="button"
            className={`cp-mobile-tab ${mobileView === 'code' ? 'active' : ''}`}
            onClick={() => setMobileView('code')}
          >
            <Code2 size={15} /> Code & Console
          </button>
        </div>

        {/* Split Workspace */}
        <div className="cp-workspace">
          {/* Left Pane: Description */}
          <div className={`cp-problem-pane ${mobileView === 'problem' ? 'cp-pane-mobile-active' : 'cp-pane-mobile-hidden'}`}>
            <div className="cp-pane-tabs">
              <div 
                className={`cp-pane-tab ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                <FileText size={15} /> Description
              </div>
              <div 
                className={`cp-pane-tab ${activeTab === 'submissions' ? 'active' : ''}`}
                onClick={() => setActiveTab('submissions')}
              >
                <Check size={15} /> Submissions
              </div>
            </div>

            <div className="cp-problem-content">
              {loading ? (
                <div style={{ padding: "30px", color: "#64748b", textAlign: "center" }}>
                  Loading problem statement...
                </div>
              ) : activeTab === 'description' ? (
                <>
                  <div className="cp-problem-header">
                    <h2 className="cp-problem-main-title">
                      {taskData?.title || "Problem Description"}
                    </h2>
                    <div className="cp-problem-meta-row">
                      {(() => {
                        const diffStr = String(taskData?.difficulty || taskData?.level || "Easy").toUpperCase();
                        const cls = diffStr.includes("HARD") ? "cp-badge-hard" : diffStr.includes("MED") ? "cp-badge-med" : "cp-badge-easy";
                        const label = diffStr.includes("HARD") ? "Hard" : diffStr.includes("MED") ? "Medium" : "Easy";
                        return <span className={`cp-task-badge ${cls}`}>{label}</span>;
                      })()}
                      <span className="cp-meta-pill">Score: {taskData?.points || 100} pts</span>
                      {taskData?.topic && <span className="cp-meta-pill">{taskData.topic}</span>}
                    </div>
                  </div>

                  <div className="cp-problem-desc">
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {taskData?.description || taskData?.desc || "Write a clean and optimized solution to solve this problem statement."}
                    </p>
                  </div>
                  
                  <div className="cp-examples-container">
                    <h4 className="cp-examples-title">Sample Test Cases</h4>
                    {testCasesList && testCasesList.length > 0 ? (
                      testCasesList
                        .filter(tc => !(tc.is_hidden === true || tc.is_hidden === 1 || String(tc.is_hidden).toLowerCase() === 'true' || tc.isHidden === true || String(tc.isHidden) === 'true'))
                        .map((tc, idx) => (
                        <div key={idx} className="cp-example-card">
                          <div className="cp-example-header">Example {idx + 1}</div>
                          <div className="cp-example-body">
                            {tc.input && (
                              <div className="cp-example-row">
                                <span className="cp-example-key">Input:</span>
                                <span className="cp-example-code">{tc.input}</span>
                              </div>
                            )}
                            {(tc.expected_output || tc.expectedOutput || tc.output) && (
                              <div className="cp-example-row">
                                <span className="cp-example-key">Output:</span>
                                <span className="cp-example-code">{tc.expected_output || tc.expectedOutput || tc.output}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="cp-no-examples">
                        No sample test cases specified for this task.
                      </p>
                    )}
                  </div>

                  {taskData?.deadline && (
                    <div className="cp-deadline-notice" style={isTaskExpired ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' } : {}}>
                      <span className="cp-deadline-label">{isTaskExpired ? 'Deadline (Expired):' : 'Submission Deadline:'}</span>
                      <span className="cp-deadline-val">{taskData.deadline} {isTaskExpired && '(Closed)'}</span>
                    </div>
                  )}
                </>
              ) : (
                /* ─── Submissions Tab ──────────────────────────────── */
                submissionsLoading ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading submissions...</div>
                ) : submissions.length === 0 ? (
                  <div className="cp-no-submissions">
                    <CheckCircle2 size={32} className="cp-no-submissions-icon" />
                    <p>No previous submissions for this problem.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "4px 0" }}>
                    {submissions.map((s, i) => {
                      const isAccepted = s.status === "accepted" || s.status === "passed";
                      const isPartial = s.status === "partial" || (!isAccepted && (s.passed_test_cases ?? 0) > 0);
                      const statusColor = isAccepted ? "#16a34a" : isPartial ? "#d97706" : s.status === "compilation_error" ? "#9333ea" : s.status === "time_limit_exceeded" ? "#d97706" : "#dc2626";
                      const statusLabel = isAccepted ? "✅ Accepted" : isPartial ? "⚠️ Partially Accepted" : s.status === "compilation_error" ? "🔴 Compilation Error" : s.status === "time_limit_exceeded" ? "⏱️ Time Limit Exceeded" : "❌ Wrong Answer";
                      const marksVal = s.marks ?? s.score ?? 0;
                      const attemptNum = submissions.length - i;
                      return (
                        <div key={s.id || i} style={{ border: `1.5px solid ${isAccepted ? '#86efac' : isPartial ? '#fde68a' : '#e2e8f0'}`, borderRadius: "10px", padding: "12px 16px", background: isAccepted ? "#f0fdf4" : isPartial ? "#fffbeb" : "#fff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 700, color: statusColor, textTransform: "uppercase", fontSize: "12px" }}>
                                {statusLabel}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  background: s.is_retake ? "rgba(245, 158, 11, 0.15)" : "#f1f5f9",
                                  color: s.is_retake ? "#b45309" : "#475569",
                                  border: s.is_retake ? "1px solid #fde68a" : "none",
                                }}
                              >
                                {s.is_retake
                                  ? `Attempt #${s.attempt_number || attemptNum} (Retake)`
                                  : (submissions.some(sub => sub.is_retake) || submissions.length > 1)
                                  ? `Attempt #${s.attempt_number || attemptNum} (Original)`
                                  : `Attempt #${attemptNum}`}
                              </span>
                            </div>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {s.language} &bull; {s.passed_test_cases ?? 0}/{s.total_test_cases ?? 0} tests passed
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#475569" }}>
                            Marks: <strong>{marksVal}</strong> / {taskData?.points || 100} pts &nbsp;|&nbsp;
                            {s.percentage ?? 0}% &nbsp;|&nbsp;
                            {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ""}
                          </div>
                          {s.feedback && (
                            <div style={{ marginTop: "10px", padding: "8px 12px", background: "#f8fafc", borderLeft: "3px solid #6366f1", borderRadius: "6px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "#4f46e5", marginBottom: "3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span>💬 Feedback {s.feedback_by ? `(by ${s.feedback_by})` : ""}:</span>
                                {s.feedback_at && <span style={{ fontWeight: 400, color: "#94a3b8" }}>{new Date(s.feedback_at).toLocaleDateString()}</span>}
                              </div>
                              <div style={{ fontSize: "12px", color: "#334155", whiteSpace: "pre-wrap" }}>
                                {s.feedback}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Pane: Code Editor & Console */}
          <div className={`cp-editor-pane ${mobileView === 'code' ? 'cp-pane-mobile-active' : 'cp-pane-mobile-hidden'}`}>
            {isTaskExpired ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                background: '#fef2f2',
                borderBottom: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                <Lock size={15} color="#dc2626" />
                <span>
                  🔒 Deadline Expired ({taskData?.deadline || 'Past Due'}) — Submissions and compiler execution have ended.
                </span>
              </div>
            ) : isRetakeActive ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: '#fffbeb',
                borderBottom: '1.5px solid #fde68a',
                color: '#92400e',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={16} color="#d97706" />
                  <span>
                    ⚡ <strong>Retake Active:</strong> You have 1 opportunity to solve, test, and submit this {isBatch ? 'batch task' : 'practice problem'}. The compiler is active and unlocked.
                  </span>
                </div>
                <span
                  style={{
                    padding: '5px 12px',
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)',
                  }}
                >
                  <RotateCcw size={12} /> 1 Attempt Allowed
                </span>
              </div>
            ) : hasSubmitted ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                background: '#fef2f2',
                borderBottom: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                <Lock size={15} color="#dc2626" />
                <span>
                  {taskData?.source === 'batch_task' || taskData?.batch_id
                    ? 'Batch Task Submitted — The compiler is locked. You cannot edit code or submit again.'
                    : 'Maximum Attempts Reached (3/3 submitted) — Submission locked for this problem.'}
                </span>
              </div>
            ) : null}
            <div className="cp-editor-area cp-editor-area--monaco">
              <MonacoCodeEditor
                value={typeof code === "string" ? code : String(code ?? "")}
                onChange={(val) => {
                  if (isCompilerLocked) return;
                  const strVal = typeof val === "string" ? val : (val?.target?.value ?? "");
                  setCode(strVal);
                }}
                language={selectedLang}
                height="100%"
                readOnly={isCompilerLocked}
                preventCopyPaste={true}
                options={{
                  fontSize: 13,
                  padding: { top: 12, bottom: 12 },
                  readOnly: isCompilerLocked,
                  contextmenu: false,
                  formatOnPaste: false,
                }}
              />
            </div>
            
            <div className="cp-console">
              <div className="cp-console-header">
                <div className="cp-console-title" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={14} />
                    <span 
                      onClick={() => setConsoleTab("output")} 
                      style={{ cursor: "pointer", color: consoleTab === "output" ? "#0f172a" : "#64748b", borderBottom: consoleTab === "output" ? "2px solid #0f172a" : "2px solid transparent", paddingBottom: "2px" }}
                    >
                      Output
                    </span>
                    <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span>
                    <span 
                      onClick={() => setConsoleTab("input")} 
                      style={{ cursor: "pointer", color: consoleTab === "input" ? "#0f172a" : "#64748b", borderBottom: consoleTab === "input" ? "2px solid #0f172a" : "2px solid transparent", paddingBottom: "2px" }}
                    >
                      Custom Input
                    </span>
                  </div>
                  {consoleStatus === "running" && <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}>● Running...</span>}
                  {consoleStatus === "success" && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>● Success</span>}
                  {consoleStatus === "error" && <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>● Failed</span>}
                  {consoleStatus === "ce" && <span style={{ fontSize: 11, color: "#9333ea", fontWeight: 700 }}>● Compilation Error</span>}
                  {consoleStatus === "tle" && <span style={{ fontSize: 11, color: "#d97706", fontWeight: 700 }}>● Time Limit Exceeded</span>}
                </div>
                <div className="cp-console-actions">
                  <Layout size={14} style={{ cursor: "pointer" }} onClick={() => { setConsoleOutput(""); setConsoleStatus(""); }} title="Clear console" />
                </div>
              </div>
              <div className={`cp-console-output ${consoleTab === "output" && !consoleOutput ? 'empty' : ''}`}
                style={{
                  borderTop: consoleStatus === "success" ? "2px solid #16a34a" :
                             consoleStatus === "error" || consoleStatus === "ce" ? "2px solid #dc2626" :
                             consoleStatus === "tle" ? "2px solid #d97706" : undefined,
                  display: 'flex', flexDirection: 'column'
                }}
              >
                {consoleTab === "output" ? (
                  consoleOutput ? (
                    <pre className="cp-pre-output">{consoleOutput}</pre>
                  ) : (
                    <span style={{ margin: 'auto' }}>Run your code to see output here.</span>
                  )
                ) : (
                  <div className="cp-custom-input-box">
                    <label className="cp-custom-input-label">
                      <input 
                        type="checkbox" 
                        checked={useCustomInput} 
                        onChange={(e) => setUseCustomInput(e.target.checked)} 
                      />
                      Test against custom input
                    </label>
                    <textarea 
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Type your custom input here..."
                      style={{ 
                        flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', 
                        fontFamily: "'Fira Code', monospace", fontSize: '13px', resize: 'none',
                        background: '#ffffff', color: '#0f172a', outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* ── Anti-Cheat Clipboard Alert Toast ── */}
        {clipboardWarning && (
          <div className="cp-clipboard-toast">
            <span>{clipboardWarning}</span>
          </div>
        )}

        {/* ── Proctored Full-Screen Gate Overlay ── */}
        {isProctoredSession && !hasSubmitted && !isFullscreen && !proctorTerminated && (
          <div className="proctor-fullscreen-gate-overlay">
            <div className="proctor-gate-card">
              <div className="proctor-gate-badge">
                <Lock size={14} /> {isBatchCoursework ? "PROCTORED COURSEWORK ASSESSMENT" : "PROCTORED PRACTICE ASSESSMENT"}
              </div>
              <h2 className="proctor-gate-title">Full-Screen Mode Required</h2>
              <p className="proctor-gate-subtitle">
                This {isBatchCoursework ? "batch task" : "practice problem"} is monitored under examination mode. Once started, strict proctoring is enforced:
              </p>
              <div className="proctor-gate-rules">
                <div className="proctor-rule-item">
                  <span className="proctor-rule-icon">🖥️</span>
                  <div>
                    <strong>Full-Screen is Mandatory:</strong> Exiting full-screen will trigger warnings; on the 3rd exit your code is automatically submitted and the session ends.
                  </div>
                </div>
                <div className="proctor-rule-item">
                  <span className="proctor-rule-icon">🚫</span>
                  <div>
                    <strong>Tab Switching Disabled:</strong> Switching tabs, leaving the window, or minimizing will trigger warnings and count toward automatic submission.
                  </div>
                </div>
                <div className="proctor-rule-item">
                  <span className="proctor-rule-icon">📋</span>
                  <div>
                    <strong>Copy / Paste Blocked:</strong> Copying, cutting, or pasting code into the compiler is strictly disabled. You must type your solution manually.
                  </div>
                </div>
                <div className="proctor-rule-item">
                  <span className="proctor-rule-icon">🔒</span>
                  <div>
                    <strong>Submission Attempt:</strong> Once submitted or ended due to violations, further changes are locked.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEnterFullscreenAndStart}
                className="proctor-gate-btn"
              >
                <Maximize2 size={18} />
                <span>{isBatchCoursework ? "Enter Full-Screen & Start Task" : "Enter Full-Screen & Start Practice"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Proctored Violation / Termination Modal ── */}
        {proctorTerminated && (
          <div className="proctor-termination-modal-overlay">
            <div className="proctor-termination-card">
              <div className="proctor-termination-icon-wrap">
                <ShieldAlert size={36} color="#dc2626" />
              </div>
              <h3 className="proctor-term-title">Session Ended — Proctoring Policy Violation</h3>
              <p className="proctor-term-desc">
                {terminationReason === "exit_fullscreen"
                  ? "You exited full-screen mode during this proctored task. As per examination guidelines, your task has been ended and your current solution was automatically submitted."
                  : "Tab switching or leaving the examination window was detected. As per examination guidelines, your task has been ended and your current solution was automatically submitted."}
              </p>
              <div className="proctor-term-status-box">
                <div className="proctor-term-status-header">
                  <Lock size={15} className="proctor-term-status-icon" />
                  <span>Compiler Locked & Auto-Submitted</span>
                </div>
                <p className="proctor-term-status-sub">
                  Your code has been submitted to the Docker evaluation sandbox. Your results and marks will be recorded on your batch dashboard.
                </p>
              </div>
              <div className="proctor-term-btn-row">
                <button
                  type="button"
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen?.().catch(() => {});
                    }
                    navigate(isBatchCoursework ? '/student/batches' : '/student/practice');
                  }}
                  className="proctor-term-btn-exit"
                >
                  <ArrowLeft size={16} />
                  <span>{isBatchCoursework ? "Back to My Batches" : "Back to Practice"}</span>
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
      </div>
    </div>
  );
}
