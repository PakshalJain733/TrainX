import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  CircleDot,
  Lock,
  BookOpen,
  RefreshCw,
  Cpu,
  Target,
  Award,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  BookMarked,
  Code2,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  AlertTriangle,
  ExternalLink,
  FileText,
  Layers,
  Globe,
  Clock,
  Link2,
  GraduationCap,
  Terminal,
  Play,
  Copy,
  CheckSquare,
  HelpCircle,
  Video,
  FileCode2,
  BookOpenCheck,
  ChevronRight,
  Plus,
  Eye,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import CustomSelect from "../../../components/ui/CustomSelect";
import MonacoCodeEditor from "../../../components/ui/MonacoCodeEditor";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import apiFetch, { getApiBaseUrl, getAuthToken } from "../../../utils/api";
import "../Styles/ST_AiRoadmap.css";

const COMPILER_LANGUAGE_OPTIONS = [
  { value: "python", label: "Python 3.10 (Docker)" },
  { value: "node", label: "Node.js 18 (Docker)" },
  { value: "java", label: "Java 17 (Docker)" },
  { value: "cpp", label: "C++ 20 (Docker)" },
  { value: "c", label: "C (C11 - Docker)" },
  { value: "sql", label: "SQL (SQLite3 - Docker)" },
  { value: "go", label: "Go 1.21 (Docker)" },
  { value: "react", label: "React (JSX Live Preview)" },
  { value: "html", label: "HTML5 / CSS3 Preview" },
];

const STARTER_TEMPLATES = {
  python: `# Write your Python solution here\nimport sys\n\ndef main():\n    # Read input from standard input\n    # lines = sys.stdin.read().splitlines()\n    pass\n\nif __name__ == '__main__':\n    main()\n`,
  node: `// Write your JavaScript (Node.js) solution here\nconst fs = require('fs');\n\nfunction main() {\n    // const input = fs.readFileSync(0, 'utf-8').trim();\n}\n\nmain();\n`,
  cpp: `// Write your C++ solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    return 0;\n}\n`,
  c: `// Write your C solution here\n#include <stdio.h>\n\nint main() {\n    return 0;\n}\n`,
  java: `// Write your Java solution here\nimport java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}\n`,
  sql: `-- Write your SQL query here\nSELECT * FROM solution;\n`,
  go: `// Write your Go solution here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
  react: `// React Interactive Component\nimport React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div style={{ padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>\n      <h2>Interactive React Preview</h2>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>+ Increment</button>\n    </div>\n  );\n}\n`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; padding: 20px; background: #0f172a; color: #fff; }\n  </style>\n</head>\n<body>\n  <h1>Web Preview</h1>\n  <p>Write HTML & CSS here.</p>\n</body>\n</html>\n`,
};

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

function getPreviewDocument(lang, code) {
  if (lang === "react") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      const { useState, useEffect, useRef, useMemo, useCallback } = React;
      ${code || `function App() { return <div style={{padding: 20, textAlign: 'center'}}><h2>Write your React Component</h2><p style={{color: '#94a3b8'}}>Create a function App() &#123; return &lt;h1&gt;Hello React&lt;/h1&gt;; &#125; in the editor to see it live!</p></div>; }`}

      let TargetComponent = null;
      if (typeof App !== 'undefined') TargetComponent = App;
      else if (typeof Component !== 'undefined') TargetComponent = Component;
      else if (typeof Main !== 'undefined') TargetComponent = Main;
      else if (typeof Root !== 'undefined') TargetComponent = Root;

      if (TargetComponent) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<TargetComponent />);
      } else {
        document.getElementById('root').innerHTML = '<div style="padding: 16px; background: #1e293b; border-radius: 8px; color: #94a3b8; font-size: 13px;">⚠️ Define a React component named <code>function App() { ... }</code> to render preview.</div>';
      }
    } catch(err) {
      document.getElementById('root').innerHTML = '<div style="padding: 14px; background: #450a0a; border: 1px solid #dc2626; border-radius: 8px; color: #fecaca; font-family: monospace; font-size: 12.5px;"><strong>🔴 React Render Error:</strong><br/>' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
  }

  // HTML / CSS preview
  return code || `<!DOCTYPE html><html><body style="background:#0f172a;color:#94a3b8;padding:20px;font-family:sans-serif;"><p>Write HTML & CSS in the editor to see live web preview.</p></body></html>`;
}

/* ── Topic & Resource Helpers ── */
function getTopicsForMilestone(m, targetRole) {
  if (Array.isArray(m?.topics) && m.topics.length > 0) {
    return m.topics;
  }
  if (Array.isArray(m?.tags) && m.tags.length > 0) {
    return [
      `Core concepts & fundamentals of ${m.tags.slice(0, 2).join(" & ")}`,
      `Practical hands-on implementation focusing on ${m.tags[2] || m.tags[0] || targetRole}`,
      `Advanced workflow patterns, performance & code quality standards`,
      `Real-world lab project build and competency assessment`,
    ];
  }
  const cleanTitle = (m?.title || targetRole || "Topic").replace(/^Milestone\s*\d+\s*:\s*/i, "");
  return [
    `Foundational mechanics & syntax of ${cleanTitle}`,
    `Core data structures, functions & control structures for ${cleanTitle}`,
    `Advanced patterns, optimization & diagnostics for ${cleanTitle}`,
    `Hands-on practical capstone project build for ${cleanTitle}`,
  ];
}

function resolveEmbeddableVideoId(cleanTitle = "", targetRole = "", milestoneTitle = "") {
  const text = `${cleanTitle} ${targetRole || ""} ${milestoneTitle || ""}`.toLowerCase();

  if (text.includes("comprehension") || text.includes("pythonic")) return "3dt4OGnU5sM";
  if (text.includes("typing") || text.includes("type hint")) return "kqtD5dpn9C8";
  if (text.includes("pip") || text.includes("venv") || text.includes("environment")) return "N5vscPJsOJ8";
  if (text.includes("fastapi") || text.includes("flask")) return "7t2alSnE2-I";
  if (text.includes("python") || text.includes("pandas") || text.includes("numpy")) return "rfscVS0vtbw";

  if (text.includes("html") || text.includes("css") || text.includes("flexbox") || text.includes("grid")) return "gQujLPbHMUG";
  if (text.includes("hook") || text.includes("usestate") || text.includes("useeffect") || text.includes("jsx")) return "bMknFK15FiU";
  if (text.includes("router") || text.includes("routing") || text.includes("axios")) return "0cSVJX8URl0";
  if (text.includes("react") || text.includes("frontend") || text.includes("vue") || text.includes("angular")) return "w7ejDZ8SWv8";

  if (text.includes("spring") || text.includes("microservice")) return "9SGDpanrc8U";
  if (text.includes("java") || text.includes("oop") || text.includes("inheritance")) return "eIrMbAQSU34";

  if (text.includes("c++") || text.includes("cpp") || text.includes("pointer") || text.includes("stl")) return "1Rs2ND1ryYc";
  if (text.includes("structure") || text.includes("algorithm") || text.includes("dsa") || text.includes("tree") || text.includes("graph")) return "8jLOx1hD3_o";

  if (text.includes("sql") || text.includes("postgres") || text.includes("database") || text.includes("query") || text.includes("mongo")) return "HXV3zeQKqGY";
  if (text.includes("docker") || text.includes("container")) return "fqMOX6JJhGo";
  if (text.includes("kubernetes") || text.includes("k8s")) return "X48VuDVv0do";
  if (text.includes("aws") || text.includes("cloud") || text.includes("devops")) return "ulprqHHWlng";

  if (text.includes("security") || text.includes("cyber") || text.includes("auth") || text.includes("jwt")) return "SqcY0GlETPk";
  if (text.includes("machine learning") || text.includes("deep learning") || text.includes("ai")) return "i_LwzRVP7bg";
  if (text.includes("git") || text.includes("github")) return "zOjov-2OZ0E";
  if (text.includes("node") || text.includes("express") || text.includes("backend") || text.includes("api")) return "Oe421EPjeBE";

  return "rfscVS0vtbw";
}

function getVideoForMilestone(m, targetRole) {
  const cleanTitle = (m?.title || targetRole || "Tutorial").replace(/^Milestone\s*\d+\s*:\s*/i, "");
  const query = `${cleanTitle} tutorial ${targetRole || ""}`.trim();
  const vId = resolveEmbeddableVideoId(cleanTitle, targetRole, m?.title);

  return {
    id: `v-${m?.id || 1}`,
    title: `${cleanTitle} - Video Tutorial & Lecture`,
    channel: "YouTube Tech Educator",
    duration: "25 mins",
    videoId: vId !== "rfscVS0vtbw" ? vId : null,
    embedUrl: vId && vId !== "rfscVS0vtbw"
      ? `https://www.youtube-nocookie.com/embed/${vId}?rel=0`
      : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}`,
    searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    topicsCovered: cleanTitle,
  };
}

function resolveLanguageForRole(roleStr = "", milestoneTitle = "", promptText = "") {
  const combined = `${milestoneTitle || ""} ${roleStr || ""} ${promptText || ""}`.toLowerCase();

  // React JSX priority
  if (combined.includes("react") || combined.includes("jsx")) {
    return "react";
  }

  // HTML & CSS Web UI priority
  if (
    combined.includes("html") ||
    combined.includes("css") ||
    combined.includes("web design") ||
    combined.includes("web layout") ||
    combined.includes("dom") ||
    combined.includes("flexbox") ||
    combined.includes("grid") ||
    combined.includes("markup") ||
    combined.includes("web page") ||
    combined.includes("website") ||
    (combined.includes("frontend") && !combined.includes("vue") && !combined.includes("angular"))
  ) {
    return "html";
  }

  if (combined.includes("typescript") || combined.includes("ts")) return "typescript";
  if (combined.includes("python") || combined.includes("ai") || combined.includes("data")) return "python";
  if (combined.includes("java") || combined.includes("spring")) return "java";
  if (combined.includes("c++") || combined.includes("cpp")) return "cpp";
  if (combined.includes("c language") || (combined.includes(" c ") && !combined.includes("c++"))) return "c";
  if (combined.includes("go") || combined.includes("golang")) return "go";
  if (combined.includes("sql") || combined.includes("database") || combined.includes("query")) return "sql";
  return "node";
}

function getStarterCodeForTopic() {
  return "";
}

function isTechnicalCodingRole(roleStr = "", milestoneTitle = "") {
  const combined = `${roleStr || ""} ${milestoneTitle || ""}`.toLowerCase();
  const techKeywords = [
    "python", "java", "c++", "cpp", "javascript", "js", "typescript", "ts", "react", "node",
    "html", "css", "sql", "database", "backend", "frontend", "fullstack", "software",
    "dsa", "algorithm", "data science", "machine learning", "ai engineer", "devops",
    "docker", "kubernetes", "aws", "cloud", "api", "git", "web development", "coding", "developer", "programmer", "engineer"
  ];
  return techKeywords.some(kw => combined.includes(kw));
}

function extractPointsFromSection(sec) {
  if (Array.isArray(sec?.points) && sec.points.length > 0) {
    return sec.points;
  }
  if (typeof sec?.explanation === "string" && sec.explanation.trim()) {
    const rawSentences = sec.explanation
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 8);
    if (rawSentences.length > 1) {
      return rawSentences;
    }
    return [sec.explanation.trim()];
  }
  return [];
}

function getTheoryForMilestone(m, targetRole) {
  const role = targetRole || "Software Engineering";
  const title = (m?.title || "Milestone Topic").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
  const topics = getTopicsForMilestone(m, targetRole);
  const lang = resolveLanguageForRole(role);
  const lowerRole = `${title} ${role}`.toLowerCase();
  const isTech = isTechnicalCodingRole(role, title);

  let overview;
  let sections;

  if (lowerRole.includes("python") || lowerRole.includes("ai") || lowerRole.includes("data") || lowerRole.includes("ml")) {
    overview = `In-depth technical curriculum for ${title} within ${role}. This curriculum progresses step-by-step from foundational syntax and object models to CPython bytecode compilation, memory reference counting, and high-performance data processing pipelines.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Core Concept, Mental Model & Syntax for ${title}`,
        explanation: `${title} provides clean, expressive abstractions in Python. Python treats everything as first-class objects, utilizing dynamic typing and intuitive semantics.`,
        points: [
          `Core Definition: Understand the fundamental purpose and role of ${title} within Python programs.`,
          `Syntax & Types: Dynamic assignment, primitive data types, and indentation-delimited code blocks.`,
          `Mental Model: Variables are pointers to objects stored on the heap rather than fixed memory cells.`,
          `Identity vs Equality: Distinguish between value equality (==) and object identity comparison (is).`
        ],
        takeaway: `Understand that Python variables are references bound to objects in memory, not rigid storage boxes.`
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Operational Execution Flow, Data Structures & Lifecycle`,
        explanation: `Python source translates dynamically into bytecode (.pyc), executing through the CPython interpreter with rich built-in collections and comprehension mechanics.`,
        points: [
          `List Comprehensions & Generators: Vectorized iterations evaluate at C-speed inside CPython, reducing interpreter loop overhead.`,
          `Hash Table Lookups: Python dictionaries utilize open-addressed hash tables with amortized O(1) key lookups.`,
          `Scope Resolution (LEGB): Names resolve sequentially through Local, Enclosing, Global, and Built-in namespaces.`,
          `Context Managers: Deploy 'with' statements to guarantee deterministic resource cleanup for files and sockets.`
        ],
        takeaway: `Prefer generator expressions over massive list comprehensions when streaming large datasets to conserve RAM.`
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `CPython Engine: Bytecode, Reference Counting, GC & GIL`,
        explanation: `Under the hood, CPython uses reference counting combined with a generational cyclic garbage collector and a Global Interpreter Lock.`,
        points: [
          `Reference Counting: Every PyObject tracks ob_refcnt; memory is immediately freed when reference count reaches zero.`,
          `Cyclic Garbage Collector: A generational GC periodically detects and reclaims circular references that reference counting misses.`,
          `Global Interpreter Lock (GIL): Mutex that prevents multiple native threads from executing bytecode concurrently in CPython.`,
          `Time & Space Bounds: List appends amortize to O(1); dictionary resizing rehashes entries when load factor reaches 2/3.`
        ],
        takeaway: `Deploy asyncio for I/O-bound workflows and multiprocessing to bypass GIL constraints for CPU-bound computations.`
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Optimization, Anti-Patterns & Production Resilience`,
        explanation: `Production Python applications require strict type hinting, memory profiling, resilient exception handling, and clean modular boundaries.`,
        points: [
          `Memory Optimization with __slots__: Use __slots__ in data classes to eliminate __dict__ overhead and save up to 40% RAM per instance.`,
          `Anti-Pattern to Avoid: Never use mutable default arguments (e.g. def func(arr=[])); use None as a sentinel value instead.`,
          `Defensive Validation: Validate external inputs using explicit type hints or schema validators to catch invalid inputs early.`,
          `Production Profiling: Profile execution bottlenecks using cProfile and trace memory allocations with tracemalloc.`
        ],
        takeaway: `Annotate functions with explicit type hints, use None sentinels for default arguments, and profile memory under peak load.`
      }
    ];
  } else if (lowerRole.includes("java") || lowerRole.includes("spring") || lowerRole.includes("backend") || lowerRole.includes("oop")) {
    overview = `Enterprise architecture guide for ${title} in ${role}. Java delivers strong type safety, robust Object-Oriented design, JVM platform independence, and high-concurrency memory management required for mission-critical enterprise platforms.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Core Concept, Mental Model & Syntax for ${title}`,
        explanation: `${title} establishes the foundational structural building blocks in Java. Java enforces strong static typing, structured class definitions, and object encapsulation.`,
        points: [
          `Core Definition: Understand the fundamental purpose and role of ${title} within Java programs.`,
          `Syntax & Primitives: How variables, access modifiers, and method definitions are declared.`,
          `Mental Model: Objects represent state (fields) and behavior (methods) modeled after real-world domain entities.`,
          `Type Safety: The Java compiler verifies static types at compile time before generating bytecode.`
        ],
        takeaway: `Master fundamental syntax and access modifiers (private, protected, public) before designing complex class hierarchies.`
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Operational Execution Flow, Method Dispatch & Lifecycle`,
        explanation: `When a Java program executes, class definitions are loaded dynamically, instances are created via constructors, and methods execute via virtual method invocation.`,
        points: [
          `Constructor Execution: Memory is reserved, default fields initialized, and constructor chains (super) execute sequentially.`,
          `Pass-by-Value Semantics: Java passes all arguments strictly by value (passing copies of primitive values or copies of object references).`,
          `Polymorphic Method Dispatch: The JVM resolves virtual methods at runtime via the vtable based on the actual object instance.`,
          `Interface Contracts: Decouple client code from concrete implementations using interface contracts.`
        ],
        takeaway: `Favor Interface-based programming and Composition over deep, fragile class inheritance.`
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `JVM Memory Model: Heap, Stack, Bytecode & GC Algorithms`,
        explanation: `The JVM manages execution across distinct memory regions: Stack frames for thread execution and Heap spaces for dynamic object allocation.`,
        points: [
          `Stack vs Heap: Primitive local variables live in fast thread-specific Stack frames; object instances live in the JVM Heap.`,
          `Generational Garbage Collection: Young Generation (Eden, Survivor spaces) reclaims transient instances quickly; Old Generation handles persistent data.`,
          `JIT Compilation: The HotSpot JIT compiler profiles execution and compiles hot bytecode methods directly into native machine code.`,
          `Time & Space Bounds: Standard array and reference access operates in O(1) time; dynamic allocations introduce GC tracking overhead.`
        ],
        takeaway: `Minimize transient object allocations inside high-frequency loop executions to prevent JVM pause spikes.`
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Optimization, Critical Anti-Patterns & Resilience`,
        explanation: `Production Java applications require thread safety, proper connection pooling, defensive input handling, and rigorous memory leak prevention.`,
        points: [
          `Memory Leak Prevention: Prevent hidden memory leaks caused by static collections, unclosed streams, or lingering thread locals.`,
          `Concurrency & Immutability: Use immutable classes (e.g. Java Records) and concurrent collections (ConcurrentHashMap) for thread safety.`,
          `Anti-Pattern to Avoid: Never swallow generic Throwable or Exception; catch specific exceptions and preserve the original cause.`,
          `Performance Tuning: Monitor heap allocation rates with JFR (Java Flight Recorder) and tune GC ergonomics for low-latency throughput.`
        ],
        takeaway: `Catch specific exception types explicitly, close resources via try-with-resources, and profile heap usage under production load.`
      }
    ];
  } else if (lowerRole.includes("react") || lowerRole.includes("frontend") || lowerRole.includes("html") || lowerRole.includes("css") || lowerRole.includes("web") || lowerRole.includes("javascript")) {
    overview = `Modern UI engineering principles for ${title} in ${role}. Web engineering revolves around declarative UI rendering, Virtual DOM Fiber reconciliation, state synchronization, and modular component architecture.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Core Concept, Mental Model & Declarative Syntax for ${title}`,
        explanation: `${title} provides declarative UI patterns for building responsive web applications. Instead of imperative DOM manipulation, components describe what the UI should look like for a given state.`,
        points: [
          `Core Definition: Understand the role of ${title} in structuring interactive, scalable web interfaces.`,
          `Declarative vs Imperative: Write predictable UI code driven by state rather than manually mutating browser DOM nodes.`,
          `Component Mental Model: Components are pure functions that accept inputs (props) and return renderable UI hierarchies (JSX/HTML).`,
          `Unidirectional Data Flow: Data flows cleanly top-down from parent components to child components.`
        ],
        takeaway: `Master declarative state representation and keep component boundaries clean and focused on a single responsibility.`
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Operational Execution Flow, Reactive Hooks & Event Dispatch`,
        explanation: `When state changes, the component function executes, computing new outputs. Hooks manage local state, subscriptions, and memoized values across render cycles.`,
        points: [
          `State Updates & Re-renders: Calling state setters schedules a re-render; state values remain stable within the current execution frame.`,
          `Effect Synchronization: useEffect runs after DOM mutations, handling side-effects like network calls, timers, and cleanup listeners.`,
          `Event Dispatch Mechanics: Synthetic events pool browser events and dispatch them through React's root listener delegator.`,
          `Lifting State Up: Share state across sibling components by hoisting state to their closest common ancestor.`
        ],
        takeaway: `Keep component state localized, lifting it up only when required by sibling components to avoid unnecessary re-render cascades.`
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `Virtual DOM, Fiber Reconciliation & Browser Render Pipeline`,
        explanation: `Under the hood, React builds a lightweight Virtual DOM Fiber tree. When updates occur, the Fiber reconciler calculates minimal DOM patches.`,
        points: [
          `Fiber Diffing Algorithm: React reconciles trees in O(N) heuristic time by comparing element types and unique keys.`,
          `Browser Critical Rendering Path: Minimizes costly layout reflows and repaints by batching multiple DOM updates in a single tick.`,
          `Event Loop & Microtasks: State updates queue microtasks, ensuring all synchronous code finishes before browser paint occurs.`,
          `Memory Layout & Closures: Stale closures occur when effect hooks capture old state references without proper dependency declarations.`
        ],
        takeaway: `Supply unique, stable keys when rendering dynamic element lists to optimize Fiber reconciliation and prevent state corruption.`
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Optimization, Anti-Patterns & Bundle Tuning`,
        explanation: `Production web applications require code splitting, memoization, layout shift prevention, and defensive error boundaries.`,
        points: [
          `Performance Memoization: Use useMemo and useCallback strategically for expensive calculations and stable callback references.`,
          `Anti-Pattern to Avoid: Never mutate state directly (e.g. state.items.push()); always produce new immutable references.`,
          `Code Splitting: Deploy dynamic imports (React.lazy / Suspense) to split bundles and achieve fast First Contentful Paint (FCP).`,
          `Error Boundaries: Wrap feature trees in Error Boundaries to gracefully catch rendering errors without crashing the entire app.`
        ],
        takeaway: `Treat state as strictly immutable, audit dependency arrays in hooks, and split route bundles for optimal Core Web Vitals.`
      }
    ];
  } else if (lowerRole.includes("c++") || lowerRole.includes("cpp") || lowerRole.includes("dsa") || lowerRole.includes("algorithm")) {
    overview = `Systems engineering and algorithmic mastery of ${title} in ${role}. C++ offers low-level memory control, zero-cost abstractions, RAII resource management, and deterministic performance for high-speed algorithmic computing.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Core Concept, Pointers & Elementary Syntax for ${title}`,
        explanation: `${title} in C++ provides precise control over computer hardware and system resources without runtime overhead.`,
        points: [
          `Core Definition: Understand the fundamental purpose and role of ${title} in systems programming.`,
          `Syntax & Primitive Types: Static typing, memory sizes (sizeof), value declarations, and reference aliases (&).`,
          `Pointer Basics: Direct memory addresses, the address-of operator (&), and pointer dereferencing (*).`,
          `Mental Model: Programs execute directly on hardware without virtual machines or garbage collectors.`
        ],
        takeaway: `Master pointer syntax and reference mechanics before implementing complex data structures.`
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `STL Containers, Iterators & Operational Mechanics`,
        explanation: `The C++ Standard Template Library provides standardized container implementations and algorithm patterns.`,
        points: [
          `Contiguous Memory: std::vector provides contiguous heap storage with amortized O(1) push_back and fast index access.`,
          `Tree & Hash Tables: std::map implements Red-Black trees (O(log n)); std::unordered_map utilizes hash buckets (O(1) average).`,
          `Iterator Invalidation: Inserting or erasing elements from dynamic containers can invalidate active iterator references.`,
          `Algorithmic Efficiency: Leverage std::sort (IntroSort O(n log n)) and std::lower_bound for optimal performance.`
        ],
        takeaway: `Prefer std::vector for contiguous memory cache locality and std::unordered_map for O(1) average lookups.`
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `Memory Layout: Stack vs Heap, RAII, Cache & Big-O Bounds`,
        explanation: `Under the hood, C++ execution relies on stack frames, heap allocators, CPU cache line hierarchies, and asymptotic efficiency.`,
        points: [
          `Direct Memory Addressing: Pointer dereferencing operates directly on memory addresses with zero abstraction overhead.`,
          `RAII Principle: Resource Acquisition Is Initialization binds heap memory, file handles, and mutexes to object lifecycles.`,
          `Smart Pointers: Use std::unique_ptr for exclusive ownership and std::shared_ptr for reference-counted ownership.`,
          `Cache Locality: Stack memory benefits from CPU cache line locality; fragmented heap allocations increase cache misses.`
        ],
        takeaway: `Use std::unique_ptr to enforce single-ownership semantics and eliminate memory leaks.`
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Undefined Behavior Prevention, Move Semantics & Anti-Patterns`,
        explanation: `Production C++ requires strict prevention of undefined behavior, dangling pointers, memory corruption, and cache misses.`,
        points: [
          `Move Semantics & rvalue References: Use std::move to transfer resource ownership without deep copying memory buffers.`,
          `Anti-Pattern to Avoid: Dangling pointers and double-free errors caused by manually invoking delete on shared pointers.`,
          `Undefined Behavior: Always initialize variables before use and verify container bounds to prevent buffer overflows.`,
          `Inner Loop Tuning: Avoid redundant allocations, function call overhead, and memory branching inside critical loops.`
        ],
        takeaway: `Analyze worst-case Big-O bounds, eliminate undefined behavior, and leverage move semantics for performance.`
      }
    ];
  } else if (lowerRole.includes("sql") || lowerRole.includes("database") || lowerRole.includes("postgres") || lowerRole.includes("mongo")) {
    overview = `Data architecture and relational database mechanics for ${title} in ${role}. Efficient database management relies on relational normalization, B-Tree index structures, ACID transaction guarantees, and optimized query execution plans.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Relational Concepts, Tables & Elementary Syntax for ${title}`,
        explanation: `${title} forms the relational data backbone. Relational databases structure data into tables with typed columns, primary keys, and relations.`,
        points: [
          `Core Definition: Understand the fundamental purpose and role of ${title} within relational storage.`,
          `DDL & DML Syntax: CREATE, ALTER, SELECT, INSERT, UPDATE, and DELETE statement structure.`,
          `Mental Model: Data is stored as structured records (rows) inside strictly typed relational schemas (tables).`,
          `Primary & Foreign Keys: Guarantee entity uniqueness and establish verifiable relationships across tables.`
        ],
        takeaway: `Define clear primary keys and relational constraints when establishing schema structures.`
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Query Execution Order, JOINs & Aggregation Mechanics`,
        explanation: `SQL queries execute in a strict logical processing order: FROM ➔ JOIN ➔ WHERE ➔ GROUP BY ➔ HAVING ➔ SELECT ➔ ORDER BY.`,
        points: [
          `Logical Execution Order: Understanding that WHERE filters rows before GROUP BY aggregation occurs.`,
          `JOIN Mechanics: INNER JOIN, LEFT OUTER JOIN, and CROSS JOIN match records across relational foreign keys.`,
          `Aggregation & Windowing: Group rows with GROUP BY and compute running metrics using OVER (PARTITION BY) window functions.`,
          `Transaction Boundaries: Group atomic operations within BEGIN TRANSACTION and COMMIT blocks.`
        ],
        takeaway: `Structure queries according to SQL logical execution order to write efficient filtering and join conditions.`
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `B-Tree Indexes, Buffer Pools, EXPLAIN Plans & ACID`,
        explanation: `Under the hood, database storage engines store data in fixed-size disk pages, cached in memory buffer pools with B-Tree indexes.`,
        points: [
          `B-Tree Index Structure: Self-balancing search trees provide O(log n) searches, range scans, and sorted ordering.`,
          `Composite Indexes: Align multi-column index order with the leftmost prefix rule in WHERE and ORDER BY clauses.`,
          `Execution Plan Analysis: Run EXPLAIN ANALYZE to identify costly sequential table scans and missing indexes.`,
          `ACID & Isolation Levels: Understand dirty reads (Read Uncommitted), non-repeatable reads (Read Committed), and serializable transactions.`
        ],
        takeaway: `Index high-frequency filtering and join columns while avoiding over-indexing on write-heavy tables.`
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Query Tuning, Critical Anti-Patterns & Scaling`,
        explanation: `Production database systems require lock contention mitigation, connection pooling, and prevention of N+1 query traps.`,
        points: [
          `Anti-Pattern to Avoid: N+1 query anti-pattern; always batch fetch related records using JOINs or IN clauses.`,
          `Lock Contention & Deadlocks: Always access and modify tables in consistent order across concurrent application services.`,
          `Strategic Denormalization: Pre-aggregate or combine tables selectively in read-intensive analytics dashboards.`,
          `Connection Pooling: Deploy connection poolers (HikariCP, PgBouncer) to prevent database process exhaustion under load.`
        ],
        takeaway: `Use explicit transaction blocks, eliminate N+1 query patterns, and monitor execution plans with EXPLAIN ANALYZE.`
      }
    ];
  } else {
    overview = `Comprehensive curriculum for ${title} in ${role}. This professional guide progresses step-by-step from fundamental principles and core mental models to operational execution, low-level mechanics, and enterprise production standards.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Foundational Principles & Mental Model of ${title}`,
        explanation: `${title} establishes the foundational bedrock within ${role}. Understanding what it represents and the problem it solves creates a clear mental model.`,
        points: [
          `Core Concept: Understand the fundamental definition and scope of ${title}.`,
          `Problem Addressed: The key challenges and inefficiencies that ${title} solves.`,
          `Elementary Standards: Initial steps, essential tools, and terminology used in practice.`,
          `Mental Model: An intuitive framework for reasoning about ${title} reliably.`
        ],
        takeaway: `Build a rock-solid grasp of core definitions and purpose before advancing to complex workflows.`
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Operational Execution Workflow & Daily Patterns`,
        explanation: `Examine how ${title} is applied step-by-step in professional practice, including input validation, lifecycle stages, and standardized procedures.`,
        points: [
          `Workflow Sequence: Step-by-step procedures followed from initiation to completion.`,
          `Input Processing: Validating parameters, requirements, and domain criteria.`,
          `Standard Methods: Daily best practices and industry-accepted patterns.`,
          `Quality Gates: Verification milestones to ensure accuracy throughout the lifecycle.`
        ],
        takeaway: `Follow structured operational sequences and validate requirements at every milestone.`
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `Deep Structural Mechanics, Resource Dynamics & Standards`,
        explanation: `A deep-dive into the underlying architecture, resource allocation models, latency considerations, and structural dependencies governing ${title}.`,
        points: [
          `Structural Architecture: Underlying mechanisms and structural dependencies.`,
          `Resource Allocation: Managing capacity, throughput, and operational efficiency.`,
          `Bottleneck Analysis: Identifying performance choke points and friction factors.`,
          `Systemic Governance: Industry compliance standards and regulatory frameworks.`
        ],
        takeaway: `Master the underlying architectural mechanisms to anticipate bottlenecks and optimize system performance.`
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Optimization, Critical Anti-Patterns & Risk Mitigation`,
        explanation: `Mastering enterprise deployment standards, identifying high-risk anti-patterns, and implementing fault-tolerant safeguards for ${title}.`,
        points: [
          `High-Impact Optimization: Advanced techniques to achieve maximum throughput and quality.`,
          `Critical Anti-Patterns: Common operational missteps, shortcuts, and systemic risks to avoid.`,
          `Defensive Contingency: Fault tolerance and emergency recovery protocols.`,
          `Production Checklist: Verification criteria for mission-critical releases.`
        ],
        takeaway: `Implement proactive risk controls, avoid dangerous anti-patterns, and enforce rigorous quality checks.`
      }
    ];
  }

  return {
    title: `Comprehensive Theory & Core Guide: ${title}`,
    overview,
    difficultyProgression: "Foundations (Basic) ➔ Working Mechanics (Intermediate) ➔ Core Internals (Deep Dive) ➔ Production Mastery (Advanced)",
    sections,
    codeExample: getStarterCodeForTopic(title, lang, role),
    bestPractices: [
      `Master core fundamentals before implementing advanced structural designs.`,
      `Implement defensive validation to catch invalid inputs at system boundaries.`,
      `Profile memory, runtime complexity, and resource allocation under heavy workloads.`,
      `Avoid common anti-patterns by strictly adhering to modern industry standards.`
    ]
  };
}

function getPracticeQuestionForMilestone(m, targetRole) {
  const title = (m?.title || "Topic Practice").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
  const role = targetRole || "Software Engineering";
  const lang = resolveLanguageForRole(role, title);
  const lower = `${title} ${role}`.toLowerCase();

  if (lang === "react" || lower.includes("react") || lower.includes("hook") || lower.includes("component")) {
    return {
      title: `Hands-on React Challenge: Build an Interactive Component for ${title}`,
      prompt: `Develop a functional React component demonstrating ${title}. Implement state management using React hooks, handle user interactions (like increment, decrement, and reset), and verify the live interactive UI in the Live Preview pane.`,
      sampleInput: `Interactive button clicks & user input state transitions`,
      sampleOutput: `Live Web Preview: Renders responsive styled React component with real-time state feedback`,
      starterCode: `// React Interactive Playground for: ${title}
import React, { useState } from 'react';

export default function InteractiveApp() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState([]);

  const handleUpdate = (delta) => {
    const newCount = count + delta;
    setCount(newCount);
    setHistory(prev => [...prev.slice(-4), \`Updated to \${newCount} at \${new Date().toLocaleTimeString()}\`]);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: '400px', margin: '20px auto', background: '#ffffff', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>${title}</h3>
      <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px' }}>Current State: <strong style={{ color: '#4f46e5', fontSize: '18px' }}>{count}</strong></p>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => handleUpdate(1)} style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Increment</button>
        <button onClick={() => handleUpdate(-1)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>- Decrement</button>
        <button onClick={() => { setCount(0); setHistory([]); }} style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>STATE EVENT LOG:</span>
        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#475569' }}>
          {history.length === 0 ? <li>No actions yet. Click a button!</li> : history.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}`,
      language: "react"
    };
  }

  if (lang === "html" || lower.includes("html") || lower.includes("css") || lower.includes("flexbox") || lower.includes("grid")) {
    return {
      title: `Hands-on Web Design Challenge: ${title}`,
      prompt: `Write clean HTML5 markup and modern CSS3 styles for ${title}. Structure the page elements with semantic tags, apply Flexbox or Grid for alignment, and preview your layout live in the Live Web Preview pane.`,
      sampleInput: `HTML5 semantic markup with CSS Flexbox styles`,
      sampleOutput: `Live Web Preview: Displays a polished, responsive styled UI card with hover effects`,
      starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      margin: 0;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      max-width: 360px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 30px rgba(79, 70, 229, 0.12);
    }
    .badge {
      display: inline-block;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    h2 { margin: 0 0 8px; color: #0f172a; font-size: 20px; }
    p { margin: 0 0 16px; color: #64748b; font-size: 14px; line-height: 1.5; }
    .btn {
      display: block;
      width: 100%;
      text-align: center;
      background: #4f46e5;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 0;
      border-radius: 8px;
      text-decoration: none;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <article class="card">
    <span class="badge">TOPIC MODULE</span>
    <h2>${title}</h2>
    <p>Semantic HTML5 and CSS3 styling demonstration for ${role}. Flexbox provides flexible alignment across viewport sizes.</p>
    <a href="#" class="btn">Explore Module</a>
  </article>
</body>
</html>`,
      language: "html"
    };
  }

  if (lower.includes("sql") || lower.includes("database") || lower.includes("query") || lower.includes("join")) {
    return {
      title: `Hands-on SQL Challenge: Relational Queries for ${title}`,
      prompt: `Write a database manipulation algorithm for ${title}. Perform an inner join between sample users and orders datasets, calculating total order amounts per user.`,
      sampleInput: `users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}], orders = [{userId: 1, amount: 250}, {userId: 1, amount: 150}, {userId: 2, amount: 400}]`,
      sampleOutput: `Expected: [{ userId: 1, name: 'Alice', totalSpent: 400 }, { userId: 2, name: 'Bob', totalSpent: 400 }]`,
      starterCode: `// Relational Data Query Challenge for: ${title}

function executeRelationalJoin(users, orders) {
  // Aggregate orders by user ID
  return users.map(user => {
    const userOrders = orders.filter(o => o.userId === user.id);
    const total = userOrders.reduce((acc, curr) => acc + curr.amount, 0);
    return {
      userId: user.id,
      name: user.name,
      orderCount: userOrders.length,
      totalSpent: total
    };
  });
}

// Test Execution
const users = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
const orders = [{ userId: 1, amount: 250 }, { userId: 1, amount: 150 }, { userId: 2, amount: 400 }];

console.log("Executing Query for: ${title}...");
const result = executeRelationalJoin(users, orders);
console.log("Query Result:", JSON.stringify(result, null, 2));
`,
      language: "node"
    };
  }

  if (lower.includes("python") || lower.includes("ai") || lower.includes("data") || lower.includes("ml")) {
    return {
      title: `Hands-on Python Challenge: ${title}`,
      prompt: `Implement a clean Python data processing function for ${title}. Your code should validate input entries, compute statistical aggregations, and return a structured summary.`,
      sampleInput: `values = [15, 22, 15, 45, 22, 15, 60, 30]`,
      sampleOutput: `{'topic': '${title}', 'total_count': 8, 'average': 28.0, 'status': 'SUCCESS'}`,
      starterCode: `# Python Implementation for: ${title}
from typing import List, Dict, Any

def process_metrics_pipeline(values: List[int]) -> Dict[str, Any]:
    if not values:
        return {"status": "EMPTY", "count": 0}

    total = sum(values)
    avg = total / len(values)

    return {
        "topic": "${title}",
        "total_count": len(values),
        "total_sum": total,
        "average": round(avg, 2),
        "status": "SUCCESS"
    }

# Test execution:
test_data = [15, 22, 15, 45, 22, 15, 60, 30]
print("Running Python Pipeline for: ${title}...")
result = process_metrics_pipeline(test_data)
print("Result Summary:", result)
`,
      language: "python"
    };
  }

  return {
    title: `Practice Challenge: Implement ${title} Logic`,
    prompt: `Write a program that processes data applying the core principles of ${title} for ${role}. Your code should handle edge cases, calculate metrics, and return structured results.`,
    sampleInput: `Input: [12, 45, 7, 23, 56, 89, 34]`,
    sampleOutput: `Expected: { topic: "${title}", processedCount: 7, minValue: 7, maxValue: 89, status: "VERIFIED" }`,
    starterCode: `// Algorithmic Challenge for: ${title}
// Target Role: ${role}

function executeModuleTask(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { status: "EMPTY", items: [] };
  }

  const sorted = [...items].sort((a, b) => a - b);

  return {
    topic: "${title}",
    processedCount: items.length,
    minValue: sorted[0],
    maxValue: sorted[sorted.length - 1],
    sortedList: sorted,
    status: "VERIFIED"
  };
}

// Sample execution
const testInput = [12, 45, 7, 23, 56, 89, 34];
console.log("Executing task for ${title}...");
const output = executeModuleTask(testInput);
console.log("Output Result:", JSON.stringify(output, null, 2));
`,
    language: lang
  };
}

function getQuizQuestionsForMilestone(m, targetRole) {
  const title = (m?.title || "Milestone").replace(/^Milestone\s*\d+\s*:\s*/i, "");
  const role = targetRole || "Software Engineering";

  return [
    {
      id: 1,
      question: `What is the primary architectural purpose of ${title} in ${role}?`,
      options: [
        `To provide foundational structural logic, clean readability, and scalable execution`,
        `To eliminate the need for memory management completely`,
        `To bypass compile-time syntax verification`,
        `To compress source files for web delivery`
      ],
      correctAnswer: 0,
      explanation: `${title} provides foundational structural logic and clean architectural abstraction.`
    },
    {
      id: 2,
      question: `Which of the following represents an industry best practice when working with ${title}?`,
      options: [
        `Ignoring error logging and exception handling`,
        `Structuring modular code with clear scoping and robust error handling`,
        `Hardcoding all dynamic variables into global state`,
        `Disabling type checks and static analysis`
      ],
      correctAnswer: 1,
      explanation: `Structuring modular code with clear scoping ensures long-term reliability and maintainability.`
    },
    {
      id: 3,
      question: `What is the expected time complexity or runtime behavior for standard linear operations in ${title}?`,
      options: [
        `O(1) or O(N) depending on algorithm structure`,
        `Always O(N^3) regardless of data size`,
        `O(2^N) for basic assignments`,
        `Undefined runtime behavior`
      ],
      correctAnswer: 0,
      explanation: `Standard linear or constant operations execute efficiently in O(1) or O(N) time.`
    },
    {
      id: 4,
      question: `How should edge cases and runtime failures be managed in modern ${role} applications?`,
      options: [
        `By using try-catch blocks/error boundaries and validating inputs before processing`,
        `Allowing the thread to terminate silently`,
        `Deleting failing test assertions`,
        `Restarting the application process indefinitely`
      ],
      correctAnswer: 0,
      explanation: `Input validation and structured error handling prevent runtime crashes.`
    },
    {
      id: 5,
      question: `What outcome is achieved upon successfully passing the assessment quiz for ${title}?`,
      options: [
        `Milestone completion is recorded (100%), unlocking the subsequent milestone`,
        `Progress is reset to zero`,
        `System shuts down`,
        `No change in status`
      ],
      correctAnswer: 0,
      explanation: `Passing the quiz completes the milestone and automatically unlocks the next milestone in sequence!`
    }
  ];
}

/* ── Theory Formatters & VS Code Code Highlighting ── */
function renderFormattedTheoryText(textStr = "") {
  if (!textStr) return null;
  const parts = String(textStr).split(/(`[^`]+`)/g);

  return parts.map((part, pIdx) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const codeVal = part.slice(1, -1);
      return (
        <code key={pIdx} className="roadmap-inline-keyword kw-indigo">
          {codeVal}
        </code>
      );
    }
    return part;
  });
}

/* ── VS Code Theme Code Syntax & Editor Component ── */
function highlightCodeSyntax(codeStr = "") {
  return <VSCodeCodeHighlighter code={codeStr} />;
}

function VSCodeCodeHighlighter({ code }) {
  if (!code) return <div className="vscode-code-line"><span className="vscode-token-plain">&nbsp;</span></div>;
  const lines = String(code).split("\n");

  return (
    <div className="vscode-editor-content">
      {lines.map((line, lIdx) => {
        if (/^\s*(\/\/|#|--|\/\*)/.test(line)) {
          return (
            <div key={lIdx} className="vscode-code-line">
              <span className="vscode-token-comment">{line || " "}</span>
            </div>
          );
        }

        const tokens = line.split(/(".*?"|'.*?'|`.*?`|\/\/.*$|#.*$|\b\d+\b|[\s()[\]{},;:.=+\-*\/<>!%&^|]+)/g);

        return (
          <div key={lIdx} className="vscode-code-line">
            {tokens.length === 0 || line === "" ? (
              <span className="vscode-token-plain">&nbsp;</span>
            ) : (
              tokens.map((tok, tIdx) => {
                if (!tok) return null;

                if (tok.startsWith("//") || tok.startsWith("#")) {
                  return <span key={tIdx} className="vscode-token-comment">{tok}</span>;
                }
                if ((tok.startsWith('"') && tok.endsWith('"')) || (tok.startsWith("'") && tok.endsWith("'")) || (tok.startsWith('`') && tok.endsWith('`'))) {
                  return <span key={tIdx} className="vscode-token-string">{tok}</span>;
                }
                if (/^\d+$/.test(tok)) {
                  return <span key={tIdx} className="vscode-token-number">{tok}</span>;
                }
                if (/^(return|if|else|for|while|do|switch|case|try|catch|finally|throw|break|continue|await|yield)$/i.test(tok)) {
                  return <span key={tIdx} className="vscode-token-control">{tok}</span>;
                }
                if (/^(def|function|const|let|var|import|from|export|default|class|public|private|protected|static|void|int|double|float|long|boolean|char|SELECT|FROM|WHERE|GROUP|BY|ORDER|HAVING|INSERT|UPDATE|DELETE)$/i.test(tok)) {
                  return <span key={tIdx} className="vscode-token-keyword">{tok}</span>;
                }
                if (/^(print|console|log|sum|len|accumulate|reduce|map|filter|main|Solution|std|cout|endl|sys|Math|parseInt|parseFloat|push|pop|length)$/i.test(tok)) {
                  return <span key={tIdx} className="vscode-token-function">{tok}</span>;
                }
                if (/^(String|Integer|Boolean|Array|Object|List|HashMap|Vector|Promise|Set|Map|Error)$/i.test(tok)) {
                  return <span key={tIdx} className="vscode-token-type">{tok}</span>;
                }

                return <span key={tIdx} className="vscode-token-plain">{tok}</span>;
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

function VSCodeEditor({ value, onChange, language = "node", height = "240px", readOnly = false }) {
  const lineCount = Math.max(1, (value || "").split("\n").length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="vscode-editor-container" style={{ height }}>
      <div className="vscode-line-numbers">
        {lineNumbers.map(n => (
          <div key={n} className="vscode-line-num">{n}</div>
        ))}
      </div>

      <div className="vscode-code-area">
        <div className="vscode-highlight-layer">
          <VSCodeCodeHighlighter code={value} language={language} />
        </div>

        {!readOnly && (
          <textarea
            value={value}
            onChange={onChange}
            className="vscode-textarea-layer"
            placeholder="Write your code here..."
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        )}
      </div>
    </div>
  );
}



const POPULAR_PRESETS = [
  { title: "Java Fullstack Developer", role: "Java Fullstack Developer", tag: "Backend & Web", icon: "☕" },
  { title: "React Frontend Engineer", role: "React Frontend Engineer", tag: "Frontend UI", icon: "⚛️" },
  { title: "Python & Data Science", role: "Python & Data Science", tag: "AI & Data", icon: "🐍" },
  { title: "DSA & Problem Solving", role: "Data Structures & Algorithms", tag: "Core CS", icon: "⚡" },
  { title: "Fullstack Web & AI", role: "Fullstack Web & AI", tag: "Modern Stack", icon: "🚀" },
];

export default function AIRoadmap() {
  const { isModuleActive, getModuleConfig } = useSystemMaintenance();
  const [goalInput, setGoalInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Roadmaps list & Active Selection
  const [allRoadmaps, setAllRoadmaps] = useState([]);
  const [currentRoadmap, setCurrentRoadmap] = useState(null);
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(null);

  // View state: 'overview' (all roadmaps list) vs 'milestones' (selected roadmap detail)
  const [viewMode, setViewMode] = useState("overview");
  const [mobileMilestonesOpen, setMobileMilestonesOpen] = useState(false);

  // Active section inside milestone detail: 'theory' | 'video' | 'practice' | 'quiz'
  const [activeSection, setActiveSection] = useState("theory");

  // AI Generated Theory Cache & Loading State
  const [aiTheoryCache, setAiTheoryCache] = useState({});
  const [isTheoryLoading, setIsTheoryLoading] = useState(false);

  // Interactive Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Practice Challenge Completion & Combined Passing State (50% Gate)
  const [practiceScores, setPracticeScores] = useState({}); // { [mKey]: 100 }
  const [milestoneCombinedResults, setMilestoneCombinedResults] = useState({}); // { [mKey]: { practiceScore, quizScore, combinedScore, isPassed } }

  // Compiler State (Docker Sandbox)
  const [compilerLanguage, setCompilerLanguage] = useState("python");
  const [compilerCode, setCompilerCode] = useState("");
  const [compilerOutput, setCompilerOutput] = useState("");
  const [compilerStatus, setCompilerStatus] = useState("idle");
  const [compilerActiveTab, setCompilerActiveTab] = useState("terminal"); // 'terminal' | 'input' | 'preview'
  const [customInput, setCustomInput] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);

  // YouTube Video Cache & Loading State
  const [milestoneVideosCache, setMilestoneVideosCache] = useState({});
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Dynamic AI Practice Challenge Cache & Loading State
  const [aiPracticeCache, setAiPracticeCache] = useState({});
  const [isPracticeLoading, setIsPracticeLoading] = useState(false);

  // Dynamic AI Assessment Quiz Cache & Loading State
  const [aiQuizCache, setAiQuizCache] = useState({});
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  const [aiSource, setAiSource] = useState(null);
  const [error, setError] = useState(null);

  // Load all saved student roadmaps on mount
  useEffect(() => {
    loadAllRoadmaps();
  }, []);

  const milestones = currentRoadmap?.milestones || [];
  const activeMilestone = activeMilestoneIdx !== null ? milestones[activeMilestoneIdx] : null;

  // Fetch AI Theory, Video, Practice Challenge & Quiz whenever active milestone changes
  useEffect(() => {
    if (activeMilestone) {
      const role = currentRoadmap?.targetRole || goalInput || "";
      const title = activeMilestone.title || "";

      loadAITheoryForMilestone(title, role);
      loadMilestoneVideo(title, role);
      loadAIPracticeForMilestone(title, role);
      loadAIQuizForMilestone(title, role);

      // Auto-detect and set appropriate language & starter code for this milestone practice
      const practice = getPracticeQuestionForMilestone(activeMilestone, role);
      const promptText = practice?.prompt || "";
      const lang = resolveLanguageForRole(role, title, promptText);
      setCompilerLanguage(lang);
      setCompilerCode("");
      setCompilerOutput("");
      setCompilerStatus("idle");
      if (lang === "html" || lang === "react") {
        setCompilerActiveTab("preview");
      } else {
        setCompilerActiveTab("terminal");
      }
    }
  }, [activeMilestoneIdx, currentRoadmap]);

  const loadAITheoryForMilestone = async (milestoneTitle, targetRole, forceRefresh = false) => {
    if (!milestoneTitle) return;
    const cleanTitle = String(milestoneTitle).replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;

    if (!forceRefresh && aiTheoryCache[cacheKey]) {
      return;
    }

    setIsTheoryLoading(true);
    try {
      const res = await apiFetch("/roadmaps/theory/generate", {
        method: "POST",
        body: JSON.stringify({
          milestoneTitle: cleanTitle,
          targetRole: cleanRole || currentRoadmap?.targetRole || goalInput,
          forceRefresh: Boolean(forceRefresh)
        })
      });

      if (res && res.data && Array.isArray(res.data.sections) && res.data.sections.length > 0) {
        setAiTheoryCache((prev) => ({
          ...prev,
          [cacheKey]: res.data
        }));
      }
    } catch (err) {
      console.warn("AI Theory fetch warning:", err);
    } finally {
      setIsTheoryLoading(false);
    }
  };

  const loadMilestoneVideo = async (milestoneTitle, targetRole) => {
    if (!milestoneTitle) return;
    const cleanTitle = String(milestoneTitle).replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(targetRole || "").trim();
    const query = `${cleanTitle} tutorial ${cleanRole}`.trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;

    if (milestoneVideosCache[cacheKey] !== undefined) {
      return;
    }

    setIsVideoLoading(true);
    try {
      const res = await apiFetch(`/roadmaps/video?q=${encodeURIComponent(query)}`);
      setMilestoneVideosCache((prev) => ({
        ...prev,
        [cacheKey]: (res && res.data && (res.data.videoId || res.data.embedUrl)) ? res.data : null
      }));
    } catch (err) {
      console.warn("Milestone video fetch warning:", err);
      setMilestoneVideosCache((prev) => ({
        ...prev,
        [cacheKey]: null
      }));
    } finally {
      setIsVideoLoading(false);
    }
  };

  const loadAIPracticeForMilestone = async (milestoneTitle, targetRole, forceRefresh = false) => {
    if (!milestoneTitle) return;
    const cleanTitle = String(milestoneTitle).replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;

    if (!forceRefresh && aiPracticeCache[cacheKey]) {
      return;
    }

    setIsPracticeLoading(true);
    try {
      const res = await apiFetch("/roadmaps/practice/generate", {
        method: "POST",
        body: JSON.stringify({
          milestoneTitle: cleanTitle,
          targetRole: cleanRole || currentRoadmap?.targetRole || goalInput,
          topic: cleanTitle,
          forceRefresh: Boolean(forceRefresh),
        }),
      });

      if (res && res.data && res.data.title && res.data.prompt) {
        setAiPracticeCache((prev) => ({
          ...prev,
          [cacheKey]: res.data,
        }));
        if (res.data.language) {
          setCompilerLanguage(res.data.language);
        }
        if (res.data.starterCode) {
          setCompilerCode((prevCode) => (prevCode ? prevCode : res.data.starterCode));
        }
        if (res.data.sampleInput) {
          setCustomInput(res.data.sampleInput);
        }
      }
    } catch (err) {
      console.warn("AI Practice challenge fetch warning:", err);
    } finally {
      setIsPracticeLoading(false);
    }
  };

  const loadAIQuizForMilestone = async (milestoneTitle, targetRole, forceRefresh = false) => {
    if (!milestoneTitle) return;
    const cleanTitle = String(milestoneTitle).replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;

    if (!forceRefresh && aiQuizCache[cacheKey]) {
      return;
    }

    setIsQuizLoading(true);
    try {
      const res = await apiFetch("/roadmaps/quiz/generate", {
        method: "POST",
        body: JSON.stringify({
          topicTitle: cleanTitle,
          targetRole: cleanRole || currentRoadmap?.targetRole || goalInput,
        }),
      });

      if (res && res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        setAiQuizCache((prev) => ({
          ...prev,
          [cacheKey]: res.data,
        }));
      }
    } catch (err) {
      console.warn("AI Quiz questions fetch warning:", err);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const enforceSequentialMilestoneLocks = (milestones) => {
    if (!Array.isArray(milestones) || milestones.length === 0) return [];

    let previousCompleted = true; // Milestone 1 is always unlocked

    return milestones.map((m, idx) => {
      if (idx === 0) {
        const isCompleted = m.status === "completed" || m.progress === 100;
        previousCompleted = isCompleted;
        return {
          ...m,
          status: isCompleted ? "completed" : "in-progress",
          progress: isCompleted ? 100 : (typeof m.progress === "number" ? m.progress : 0),
        };
      }

      if (previousCompleted) {
        const isCompleted = m.status === "completed" || m.progress === 100;
        previousCompleted = isCompleted;
        return {
          ...m,
          status: isCompleted ? "completed" : (m.status === "locked" ? "in-progress" : m.status || "in-progress"),
          progress: isCompleted ? 100 : (typeof m.progress === "number" ? m.progress : 0),
        };
      } else {
        previousCompleted = false;
        return {
          ...m,
          status: "locked",
          progress: 0,
          completedTopics: [],
        };
      }
    });
  };

  const calculateRoadmapProgress = (milestonesList = []) => {
    if (!Array.isArray(milestonesList) || milestonesList.length === 0) return 0;
    const sum = milestonesList.reduce(
      (acc, m) => acc + (typeof m.progress === "number" ? m.progress : (m.status === "completed" ? 100 : 0)),
      0
    );
    return Math.round(sum / milestonesList.length);
  };

  const getStorageKey = (role, id) => {
    const cleanRole = role ? String(role).trim().toLowerCase() : (id ? `rm_${id}` : 'default');
    return `roadmap_progress_cache_${cleanRole}`;
  };

  const mergeCachedProgress = (rm) => {
    if (!rm) return rm;
    const storageKey = getStorageKey(rm.targetRole, rm.id);
    let cached = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) cached = JSON.parse(raw);
    } catch (e) {}

    let milestones = rm.milestones || [];
    if (cached && Array.isArray(cached.milestones) && cached.milestones.length > 0) {
      milestones = milestones.map((m, idx) => {
        const cachedM = cached.milestones[idx] || cached.milestones.find((cm) => cm.id === m.id || cm.title === m.title);
        if (!cachedM) return m;
        const isCompleted = m.status === 'completed' || cachedM.status === 'completed';
        const higherProgress = Math.max(m.progress || 0, cachedM.progress || 0);
        return {
          ...m,
          status: isCompleted ? 'completed' : (cachedM.status || m.status),
          progress: isCompleted ? 100 : higherProgress,
        };
      });
    }

    const enforced = enforceSequentialMilestoneLocks(milestones);
    return {
      ...rm,
      milestones: enforced,
    };
  };

  const saveProgressToServer = async (targetRoadmap, updatedMilestones, activeItemId, activeProgress, activeStatus) => {
    const rm = targetRoadmap || currentRoadmap;
    if (!rm) return;

    // 1. Immediately cache in localStorage for instant recall on page reload or re-login
    try {
      const storageKey = getStorageKey(rm.targetRole, rm.id);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          roadmapId: rm.id,
          targetRole: rm.targetRole,
          milestones: updatedMilestones,
          updatedAt: Date.now(),
        })
      );
    } catch (e) {
      console.warn("Local storage cache warning:", e);
    }

    // 2. Persist full roadmap progress to backend DB
    try {
      if (rm.id) {
        await apiFetch(`/roadmaps/${rm.id}/progress`, {
          method: "PUT",
          body: JSON.stringify({
            milestones: updatedMilestones,
          }),
        });
      } else {
        await apiFetch(`/roadmaps/progress`, {
          method: "POST",
          body: JSON.stringify({
            roadmapId: rm.id,
            targetRole: rm.targetRole,
            milestones: updatedMilestones,
          }),
        });
      }
    } catch (err) {
      console.warn("Full roadmap progress save warning:", err);
    }

    // 3. Also patch active milestone item as fallback
    try {
      const itemIdToPatch = activeItemId || (activeMilestoneIdx !== null ? activeMilestoneIdx + 1 : 1);
      await apiFetch(`/roadmaps/items/${itemIdToPatch}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: activeStatus,
          progress: activeProgress,
        }),
      });
    } catch (err) {
      console.warn("Milestone patch backup warning:", err);
    }
  };

  const loadAllRoadmaps = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/roadmaps/all");
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const processed = res.data.map((rm) => mergeCachedProgress(rm));
        setAllRoadmaps(processed);
        // Default select latest roadmap and set active milestone to Milestone 1
        setCurrentRoadmap(processed[0]);
        if (processed[0]?.milestones?.length > 0) {
          setActiveMilestoneIdx(0);
        }
      } else {
        // Fetch active single roadmap
        const resSingle = await apiFetch("/roadmaps");
        if (resSingle && resSingle.data && resSingle.data.milestones) {
          const rm = mergeCachedProgress(resSingle.data);
          setAllRoadmaps([rm]);
          setCurrentRoadmap(rm);
          if (rm.milestones?.length > 0) {
            setActiveMilestoneIdx(0);
          }
        }
      }
    } catch (err) {
      console.error("Error loading roadmaps:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoadmap = (rm) => {
    const processed = mergeCachedProgress(rm);
    setCurrentRoadmap(processed);
    setActiveMilestoneIdx(0);
    setViewMode("milestones");
    setActiveSection("theory");
    resetQuizState();
  };

  const handleSelectMilestone = (index) => {
    const targetM = milestones[index];

    if (!targetM) return;

    if (targetM.status === "locked") {
      const prevTitle = milestones[index - 1]?.title || `Milestone ${index}`;
      setError(`🔒 Milestone ${index + 1} ("${targetM.title}") is locked! You must achieve at least 50% combined score across both the Practice Challenge and Assessment Quiz in Milestone ${index} ("${prevTitle}") to unlock it.`);
      return;
    }

    setActiveMilestoneIdx(index);
    setActiveSection("theory");
    setMobileMilestonesOpen(false);
    resetQuizState();
    setError(null);

    // Initialize compiler code for the selected milestone topic
    const role = currentRoadmap?.targetRole || goalInput || "Topic Practice";
    const title = targetM.title || "Topic";
    const cleanTitle = String(title).replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(role).trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
    const cachedPractice = aiPracticeCache[cacheKey];
    const practice = cachedPractice || getPracticeQuestionForMilestone(targetM, role);
    const lang = practice?.language || resolveLanguageForRole(role, title, practice?.prompt);
    setCompilerLanguage(lang);
    setCompilerCode(practice?.starterCode || STARTER_TEMPLATES[lang] || "");
    setCompilerOutput("");
    setCompilerStatus("idle");
    setCustomInput(practice?.sampleInput || "");
    setUseCustomInput(false);
    if (lang === "html" || lang === "react") {
      setCompilerActiveTab("preview");
    } else {
      setCompilerActiveTab("terminal");
    }
  };

  const handleCompilerLanguageChange = (newLang) => {
    setCompilerLanguage(newLang);
    const activeM = milestones[activeMilestoneIdx];
    const cleanTitle = String(activeM?.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(currentRoadmap?.targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
    const currentPractice = aiPracticeCache[cacheKey] || (activeM ? getPracticeQuestionForMilestone(activeM, currentRoadmap?.targetRole) : null);

    if (currentPractice?.language === newLang && currentPractice?.starterCode) {
      setCompilerCode(currentPractice.starterCode);
    } else {
      setCompilerCode(STARTER_TEMPLATES[newLang] || "");
    }
    setCompilerOutput("");
    setCompilerStatus("idle");
    if (newLang === "html" || newLang === "react") {
      setCompilerActiveTab("preview");
    } else {
      setCompilerActiveTab("terminal");
    }
  };

  const handleResetCompilerCode = () => {
    const activeM = milestones[activeMilestoneIdx];
    const cleanTitle = String(activeM?.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(currentRoadmap?.targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
    const currentPractice = aiPracticeCache[cacheKey] || (activeM ? getPracticeQuestionForMilestone(activeM, currentRoadmap?.targetRole) : null);

    if (currentPractice?.language === compilerLanguage && currentPractice?.starterCode) {
      setCompilerCode(currentPractice.starterCode);
    } else {
      setCompilerCode(STARTER_TEMPLATES[compilerLanguage] || "");
    }
    setCompilerOutput("");
    setCompilerStatus("idle");
  };

  const resetQuizState = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleRetakeQuiz = () => {
    resetQuizState();
  };

  const recordPracticeSuccess = async () => {
    const activeM = milestones[activeMilestoneIdx];
    const mKey = activeM?.id || `m_${activeMilestoneIdx}`;
    setPracticeScores((prev) => ({ ...prev, [mKey]: 100 }));

    if (activeM && activeM.status !== "completed") {
      const newProgress = Math.max(activeM.progress || 0, 50);
      const updatedMilestonesRaw = milestones.map((m, idx) =>
        idx === activeMilestoneIdx
          ? {
              ...m,
              progress: newProgress,
              status: "in-progress",
            }
          : m
      );
      const updatedMilestones = enforceSequentialMilestoneLocks(updatedMilestonesRaw);
      setCurrentRoadmap((prev) => ({ ...prev, milestones: updatedMilestones }));
      setAllRoadmaps((prev) =>
        prev.map((r) => (r.id === currentRoadmap?.id ? { ...r, milestones: updatedMilestones } : r))
      );

      saveProgressToServer(currentRoadmap, updatedMilestones, activeM.id, newProgress, "in-progress");
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!goalInput.trim()) return;
    executeGeneration(goalInput.trim());
  };

  const executeGeneration = async (targetRole) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await apiFetch("/roadmaps/generate", {
        method: "POST",
        body: JSON.stringify({ targetRole: targetRole }),
      });

      if (response && response.data) {
        const genData = {
          ...response.data,
          milestones: enforceSequentialMilestoneLocks(response.data.milestones || []),
        };

        // Add to allRoadmaps list
        setAllRoadmaps((prev) => [genData, ...prev.filter((r) => r.id !== genData.id)]);
        setCurrentRoadmap(genData);
        setActiveMilestoneIdx(0);
        setViewMode("milestones");
        setActiveSection("theory");
        resetQuizState();
        if (genData.aiSource) setAiSource(genData.aiSource);
      } else if (response && response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error("Roadmap generation error:", err);
      setError(err.message || "Failed to generate AI roadmap.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuizAnswer = (qIdx, optionIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [qIdx]: optionIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    const activeM = milestones[activeMilestoneIdx];
    if (!activeM) return;

    const mKey = activeM.id || `m_${activeMilestoneIdx}`;
    const cleanTitle = String(activeM.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(currentRoadmap?.targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
    const rawQuestions = aiQuizCache[cacheKey]?.questions || getQuizQuestionsForMilestone(activeM, currentRoadmap?.targetRole);
    const questions = rawQuestions.map((q, idx) => ({
      id: q.id || idx + 1,
      correctAnswer: q.correctAnswer ?? q.correctAnswerIndex ?? 0,
    }));
    let correctCount = 0;

    questions.forEach((q, qIdx) => {
      if (quizAnswers[qIdx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const quizPct = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
    const practicePct = practiceScores[mKey] !== undefined ? practiceScores[mKey] : (compilerStatus === "success" ? 100 : 0);
    const combinedScore = Math.round((practicePct + quizPct) / 2);
    const isPassed = combinedScore >= 50;

    setQuizScore(correctCount);
    setQuizSubmitted(true);
    setMilestoneCombinedResults((prev) => ({
      ...prev,
      [mKey]: {
        practiceScore: practicePct,
        quizScore: quizPct,
        quizCorrectCount: correctCount,
        quizTotalCount: questions.length,
        combinedScore,
        isPassed,
      },
    }));

    if (isPassed) {
      setIsUpdatingStatus(true);

      // Update milestone status to COMPLETED & 100% progress
      const updatedMilestonesRaw = milestones.map((m, idx) =>
        idx === activeMilestoneIdx
          ? {
              ...m,
              status: "completed",
              progress: 100,
              completedTopics: getTopicsForMilestone(m, currentRoadmap?.targetRole).map((_, i) => i),
            }
          : m
      );

      // Enforce unlocking next milestone M(activeMilestoneIdx + 1)
      const updatedMilestones = enforceSequentialMilestoneLocks(updatedMilestonesRaw);
      setCurrentRoadmap({ ...currentRoadmap, milestones: updatedMilestones });

      // Also update in allRoadmaps list
      setAllRoadmaps((prev) =>
        prev.map((r) => (r.id === currentRoadmap.id ? { ...r, milestones: updatedMilestones } : r))
      );

      saveProgressToServer(currentRoadmap, updatedMilestones, activeM.id, 100, "completed");
      setIsUpdatingStatus(false);
    } else {
      // Failed passing score (< 50% combined score) -> Next milestone remains LOCKED!
      const currentCombined = Math.max(combinedScore, 10);
      const updatedMilestonesRaw = milestones.map((m, idx) =>
        idx === activeMilestoneIdx
          ? {
              ...m,
              status: "in-progress",
              progress: currentCombined,
            }
          : m
      );
      const updatedMilestones = enforceSequentialMilestoneLocks(updatedMilestonesRaw);
      setCurrentRoadmap({ ...currentRoadmap, milestones: updatedMilestones });
      setAllRoadmaps((prev) =>
        prev.map((r) => (r.id === currentRoadmap.id ? { ...r, milestones: updatedMilestones } : r))
      );

      saveProgressToServer(currentRoadmap, updatedMilestones, activeM.id, currentCombined, "in-progress");
    }
  };

  const handleProceedToNextMilestone = () => {
    if (activeMilestoneIdx + 1 < milestones.length) {
      handleSelectMilestone(activeMilestoneIdx + 1);
    }
  };

  const handleRunCompiler = async () => {
    if (!isModuleActive("codingCompiler")) {
      setCompilerStatus("error");
      setCompilerOutput(`⚠️ Compiler service disabled:\n${getModuleConfig("codingCompiler")?.message || "Docker Sandbox is currently undergoing maintenance."}`);
      return;
    }
    const currentCode = (typeof compilerCode === "string" ? compilerCode : String(compilerCode ?? "")).trim();
    if (!currentCode) {
      setCompilerOutput("⚠️ Write some code before running.");
      setCompilerStatus("error");
      return;
    }

    if (compilerLanguage === "html" || compilerLanguage === "react") {
      setCompilerStatus("success");
      setCompilerOutput(`✅ Live ${compilerLanguage === "react" ? "React JSX" : "HTML/CSS"} Preview Rendered Successfully! Check the Preview tab.`);
      setCompilerActiveTab("preview");
      return;
    }

    setCompilerStatus("running");
    setCompilerOutput("Executing code in Docker sandbox container...");
    setCompilerActiveTab("terminal");
    const startTime = Date.now();

    const activeM = milestones[activeMilestoneIdx];
    const cleanTitle = String(activeM?.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(currentRoadmap?.targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
    const currentPractice = aiPracticeCache[cacheKey] || (activeM ? getPracticeQuestionForMilestone(activeM, currentRoadmap?.targetRole) : null);

    const stdin = useCustomInput ? customInput : (currentPractice?.sampleInput || "");

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/code/run`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          language: compilerLanguage,
          code: compilerCode,
          stdin: typeof stdin === "string" ? stdin : String(stdin ?? "")
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCompilerStatus("error");
        if (data?.message?.includes("Docker") || data?.message?.includes("unavailable")) {
          setCompilerOutput(`⚠️ Docker compiler sandbox is currently unavailable. Please verify Docker Desktop is running.`);
        } else {
          setCompilerOutput(`❌ Execution Error: ${data.message || "Execution failed"}`);
        }
        return;
      }

      const result = data.data || data;

      if (result.compilationError) {
        setCompilerStatus("ce");
        setCompilerOutput(`🔴 Compilation Error\n\n${result.stderr || "Check your syntax."}`);
      } else if (result.timedOut) {
        setCompilerStatus("tle");
        setCompilerOutput(`⏱️ Time Limit Exceeded (${result.executionTime || 5000}ms)`);
      } else if (result.exitCode !== 0 && result.exitCode !== undefined) {
        setCompilerStatus("error");
        setCompilerOutput(
          `🔴 Runtime Error (exit code ${result.exitCode})\n\n${result.stderr ? `Stderr:\n${result.stderr}` : ""}${result.stdout ? `\nStdout (partial):\n${result.stdout}` : ""}`
        );
      } else {
        setCompilerStatus("success");
        const outputText = result.stdout?.trim() || "(Execution completed with no console output)";
        const expectedText = currentPractice?.sampleOutput?.trim() || null;
        let verdict = "";
        if (expectedText && expectedText !== "null") {
          const match = outputText.toLowerCase().includes(expectedText.toLowerCase()) || outputText === expectedText;
          verdict = match ? "\n\n✅ Output matches sample expectation!" : `\n\nSample Expected:\n${expectedText}\n\nActual Got:\n${outputText}`;
        }
        setCompilerOutput(
          `✅ Execution successful (${result.executionTime || 0}ms - Docker Sandbox)\n\n${outputText}${verdict}`
        );
      }
    } catch (err) {
      setCompilerStatus("error");
      setCompilerOutput(`❌ Network error executing Docker container: ${err.message}`);
    }
  };

  const submitPracticeRef = useRef(null);
  const hasAutoSubmittedPracticeRef = useRef(false);

  const handleSubmitPractice = async (opts = {}) => {
    const isAuto = opts?.isAutoSubmit === true;
    if (!isAuto && !isModuleActive("codingCompiler")) {
      setCompilerStatus("error");
      setCompilerOutput(`⚠️ Compiler service disabled:\n${getModuleConfig("codingCompiler")?.message || "Code submission is currently undergoing maintenance."}`);
      return;
    }
    let currentCode = (typeof compilerCode === "string" ? compilerCode : String(compilerCode ?? "")).trim();
    if (!currentCode) {
      if (isAuto) {
        currentCode = STARTER_TEMPLATES[compilerLanguage] || "// Auto-submitted due to tab switch";
      } else {
        setCompilerOutput("⚠️ Write some code before submitting your solution.");
        setCompilerStatus("error");
        return;
      }
    }

    const activeM = milestones[activeMilestoneIdx];
    const cleanTitle = String(activeM?.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(currentRoadmap?.targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
    const currentPractice = aiPracticeCache[cacheKey] || (activeM ? getPracticeQuestionForMilestone(activeM, currentRoadmap?.targetRole) : null);

    if (compilerLanguage === "html" || compilerLanguage === "react") {
      recordPracticeSuccess();
      setCompilerStatus("success");
      setCompilerOutput(`✅ Practice Challenge Solution Accepted!\nScore: 100% on Hands-on Challenge for "${activeM?.title || 'Milestone'}".\nMilestone progress updated dynamically! This earns 50% towards unlocking the next milestone. Complete the Assessment Quiz in Part 4 to pass.`);
      return;
    }

    setCompilerStatus("running");
    if (isAuto) {
      setCompilerOutput("⚠️ Tab switch detected! Solution automatically submitted as per exam guidelines. Evaluating in Docker sandbox...");
    } else {
      setCompilerOutput("Evaluating solution in Docker sandbox container...");
    }
    setCompilerActiveTab("terminal");

    const stdin = useCustomInput ? customInput : (currentPractice?.sampleInput || "");

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/code/run`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          language: compilerLanguage,
          code: currentCode,
          stdin: typeof stdin === "string" ? stdin : String(stdin ?? "")
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCompilerStatus("error");
        setCompilerOutput(`❌ Submission Error: ${data.message || "Execution failed"}`);
        return;
      }

      const result = data.data || data;

      if (result.compilationError) {
        setCompilerStatus("ce");
        setCompilerOutput(`🔴 ${isAuto ? "Auto-Submitted Solution (Compilation Error)" : "Cannot Submit Solution: Compilation Error"}\n\n${result.stderr || "Check your syntax."}`);
        return;
      }
      if (result.timedOut) {
        setCompilerStatus("tle");
        setCompilerOutput(`⏱️ ${isAuto ? "Auto-Submitted Solution (Time Limit Exceeded)" : "Cannot Submit Solution: Time Limit Exceeded"} (${result.executionTime || 5000}ms)`);
        return;
      }
      if (result.exitCode !== 0 && result.exitCode !== undefined) {
        setCompilerStatus("error");
        setCompilerOutput(`🔴 ${isAuto ? "Auto-Submitted Solution (Runtime Error)" : "Cannot Submit Solution: Runtime Error"} (exit code ${result.exitCode})\n\n${result.stderr || "Execution failed."}`);
        return;
      }

      // Execution passed cleanly in Docker container!
      recordPracticeSuccess();
      setCompilerStatus("success");
      const outputText = result.stdout?.trim() || "(No console output)";
      setCompilerOutput(
        `✅ Solution Verified & Accepted via Docker Sandbox (${result.executionTime || 0}ms)!\n\nStandard Output:\n${outputText}\n\nScore: 100% on Hands-on Challenge for "${activeM?.title || 'Milestone'}".\nMilestone progress updated dynamically! Complete the Assessment Quiz in the next part to unlock the next milestone.`
      );
    } catch (err) {
      setCompilerStatus("error");
      setCompilerOutput(`❌ Network error submitting to Docker sandbox: ${err.message}`);
    }
  };

  useEffect(() => {
    submitPracticeRef.current = handleSubmitPractice;
  });

  useEffect(() => {
    if (activeSection !== "practice") return;

    const activeM = milestones[activeMilestoneIdx];
    const mKey = activeM?.id || `m_${activeMilestoneIdx}`;
    const isAlreadyPassed = practiceScores[mKey] === 100;

    const triggerTabSwitchAutoSubmit = () => {
      if (!isAlreadyPassed && !hasAutoSubmittedPracticeRef.current) {
        hasAutoSubmittedPracticeRef.current = true;
        if (submitPracticeRef.current && compilerStatus !== "running") {
          submitPracticeRef.current({ isAutoSubmit: true, reason: "tab_switch" });
        }
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        triggerTabSwitchAutoSubmit();
      }
    };

    const handleWindowBlur = () => {
      triggerTabSwitchAutoSubmit();
    };

    const preventCopy = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setCompilerStatus("error");
      setCompilerOutput("⚠️ Copying, cutting, and pasting is strictly disabled in the compiler! Please write your code manually.");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("copy", preventCopy, true);
    document.addEventListener("cut", preventCopy, true);
    document.addEventListener("paste", preventCopy, true);
    document.addEventListener("contextmenu", preventCopy, true);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("copy", preventCopy, true);
      document.removeEventListener("cut", preventCopy, true);
      document.removeEventListener("paste", preventCopy, true);
      document.removeEventListener("contextmenu", preventCopy, true);
    };
  }, [activeSection, activeMilestoneIdx, milestones, practiceScores, compilerStatus]);

  const overallProgress = calculateRoadmapProgress(milestones);

  return (
    <div className="roadmap-container stack-6">
      {/* ── Top Generator Header ── */}
      <div className="student-header-box">
        <div className="roadmap-header-row">
          <h2 className="student-header-title roadmap-header-title-flex">
            <Sparkles size={24} className="roadmap-header-icon" />
            <span>AI Learning & Career Roadmaps</span>
          </h2>
          {aiSource && (
            <span className="roadmap-ai-engine-badge">
              <Cpu size={12} /> Adaptive AI Engine
            </span>
          )}
        </div>
        <p className="student-header-desc mt-1.5">
          Select a roadmap or generate a new custom role to access sequential milestone theory, video tutorials, practice exercises, and assessment quizzes.
        </p>
      </div>

      {/* ── Generator & Search Bar ── */}
      <div className="roadmap-generator-card">
        <form onSubmit={handleGenerate} className="roadmap-form-wrap">
          <div className="roadmap-input-row">
            <div className="roadmap-input-field-wrap">
              <Search size={18} className="roadmap-input-search-icon" />
              <input
                type="text"
                className="roadmap-select-input"
                placeholder="Type any technology or target role (e.g. Java Fullstack, Python Data Science, React Engineer)..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                required
              />
              {goalInput && (
                <button
                  type="button"
                  className="roadmap-input-clear-btn"
                  onClick={() => setGoalInput("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="roadmap-gen-btn"
              disabled={isGenerating || !goalInput.trim()}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Generating AI Path...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Roadmap</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="roadmap-error-alert">
              <div className="roadmap-error-content">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="roadmap-error-close-btn"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ── VIEW MODE 1: PREVIOUS / AVAILABLE ROADMAPS OVERVIEW ── */}
      {viewMode === "overview" && (
        <div className="stack-6">
          {/* Preset Buttons */}
          <div className="roadmap-presets-row">
            {POPULAR_PRESETS.map((preset) => (
              <button
                key={preset.role}
                type="button"
                onClick={() => {
                  setGoalInput(preset.role);
                  executeGeneration(preset.role);
                }}
                className="roadmap-preset-btn"
              >
                <span>{preset.icon}</span>
                <span>{preset.title}</span>
                <span className="roadmap-preset-tag">{preset.tag}</span>
              </button>
            ))}
          </div>

          {/* Previous Roadmaps Grid */}
          <div className="roadmap-previous-container">
            <div className="roadmap-previous-header">
              <h3 className="roadmap-previous-title">
                <BookMarked size={20} className="roadmap-icon-indigo" />
                <span>Your Previous & Available Roadmaps</span>
              </h3>
              <span className="roadmap-previous-count">
                {allRoadmaps.length} Roadmap{allRoadmaps.length !== 1 ? "s" : ""} Available
              </span>
            </div>

            {isLoading ? (
              <div className="roadmap-loading-state">
                <RefreshCw size={32} className="roadmap-icon-indigo roadmap-spin-loader" />
                <p className="roadmap-meta-text">Loading your saved roadmaps...</p>
              </div>
            ) : allRoadmaps.length === 0 ? (
              <div className="roadmap-empty-state">
                <Compass size={40} className="roadmap-icon-indigo roadmap-mb-12" />
                <h4 className="roadmap-empty-title">No Saved Roadmaps Found</h4>
                <p className="roadmap-empty-desc">
                  Select a popular track above or type your target technology in the search box to build your first roadmap.
                </p>
              </div>
            ) : (
              <div className="roadmap-grid-layout">
                {allRoadmaps.map((rm) => {
                  const ms = rm.milestones || [];
                  const doneCount = ms.filter((m) => m.status === "completed").length;
                  const prog = calculateRoadmapProgress(ms);

                  return (
                    <div
                      key={rm.id}
                      onClick={() => handleSelectRoadmap(rm)}
                      className="roadmap-card-item"
                    >
                      <div>
                        <div className="roadmap-card-top">
                          <span className="roadmap-card-badge">
                            {ms.length} Milestones
                          </span>
                          <span className={prog === 100 ? "roadmap-card-status-done" : "roadmap-card-status-progress"}>
                            {prog === 100 ? "Completed ✓" : prog > 0 ? `${prog}% In Progress` : "Fresh Start"}
                          </span>
                        </div>
                        <h4 className="roadmap-card-title">
                          {rm.targetRole || "Career Roadmap"}
                        </h4>
                        <p className="roadmap-card-sub">
                          {doneCount} of {ms.length} milestones completed
                        </p>
                      </div>

                      <div>
                        <div className="roadmap-card-progress-row">
                          <span>Overall Progress</span>
                          <span>{prog}%</span>
                        </div>
                        <div className="roadmap-card-progress-track">
                          <div className="roadmap-card-progress-fill" style={{ width: `${prog}%` }} />
                        </div>

                        <div className="roadmap-card-footer">
                          <span className="roadmap-card-date">
                            {rm.updatedAt ? new Date(rm.updatedAt).toLocaleDateString() : "Saved"}
                          </span>
                          <span className="roadmap-card-open-link">
                            Open Roadmap <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW MODE 2: MILESTONES SIDEBAR & SEQUENTIAL CONTENT VIEW ── */}
      {viewMode === "milestones" && currentRoadmap && (
        <div className="roadmap-split-layout">
          
          {/* ── LEFT SIDEBAR: MILESTONES NAVIGATION LIST ── */}
          <div className="roadmap-sidebar-panel">
            
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setViewMode("overview")}
              className="roadmap-back-btn"
            >
              <ArrowLeft size={15} />
              <span>All Roadmaps</span>
            </button>

            {/* Selected Roadmap Title */}
            <div>
              <span className="roadmap-sidebar-active-tag">
                Active Roadmap
              </span>
              <h3 className="roadmap-sidebar-active-title">
                {currentRoadmap.targetRole}
              </h3>
              <div className="mt-2">
                <div className="roadmap-sidebar-prog-row">
                  <span>Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="roadmap-card-progress-track">
                  <div className="roadmap-card-progress-fill" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
            </div>

            <hr className="roadmap-card-divider" />

            {/* Milestones Vertical List Header with Mobile Toggle */}
            <div className="roadmap-sidebar-header-row">
              <span className="roadmap-sidebar-heading">Milestones ({milestones.length})</span>
              <button
                type="button"
                className="roadmap-mobile-milestone-toggle"
                onClick={() => setMobileMilestonesOpen(prev => !prev)}
                aria-label="Toggle Milestones"
              >
                <span>{mobileMilestonesOpen ? "Hide" : "Switch Milestone"}</span>
                {mobileMilestonesOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {/* Milestones Vertical List */}
            <div className={`roadmap-sidebar-list ${mobileMilestonesOpen ? 'roadmap-sidebar-list--mobile-open' : ''}`}>
              {milestones.map((m, idx) => {
                const isActive = activeMilestoneIdx === idx;
                const isCompleted = m.status === "completed";
                const isLocked = m.status === "locked";

                let btnClass = "roadmap-sidebar-item-btn ";
                if (isActive) btnClass += "active";
                else if (isLocked) btnClass += "locked";
                else btnClass += "inactive";

                let badgeBg = isCompleted ? "#ecfdf5" : isActive ? "#6366f1" : isLocked ? "#f1f5f9" : "#e0e7ff";
                let badgeColor = isCompleted ? "#059669" : isActive ? "#ffffff" : isLocked ? "#94a3b8" : "#4338ca";

                return (
                  <div key={m.id || idx} className="roadmap-milestone-item">
                    {/* Milestone Card Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectMilestone(idx)}
                      disabled={isLocked}
                      className={btnClass}
                    >
                      <div className="roadmap-sidebar-badge-num" style={{ background: badgeBg, color: badgeColor }}>
                        {isCompleted ? "✓" : isLocked ? <Lock size={12} /> : `M${idx + 1}`}
                      </div>

                      <div className="roadmap-milestone-info">
                        <div className={`roadmap-milestone-title ${isActive ? 'active' : ''}`}>
                          {m.title}
                        </div>
                        <div className="roadmap-milestone-sub">
                          {isCompleted ? "Completed (100%) ✓" : isLocked ? "Locked 🔒" : m.progress > 0 ? `${m.progress}% In Progress` : isActive ? "Active Now" : "Unlocked"}
                        </div>
                      </div>
                    </button>

                    {/* Numbered Sub-List under Active / Unlocked Milestone */}
                    {isActive && !isLocked && (() => {
                      const mCleanTitle = String(m.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
                      const mCleanRole = String(currentRoadmap?.targetRole || "").trim();
                      const mVideoKey = `${mCleanTitle.toLowerCase()}__${mCleanRole.toLowerCase()}`;
                      const mVideo = milestoneVideosCache[mVideoKey];
                      const mHasVideo = Boolean(mVideo && mVideo.videoId && mVideo.embedUrl);

                      return (
                        <div className="roadmap-sidebar-sublist">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection("theory");
                              setMobileMilestonesOpen(false);
                            }}
                            className={`roadmap-sidebar-sub-btn ${activeSection === "theory" ? "active" : "inactive"}`}
                          >
                            <span className="font-extrabold opacity-90">1.</span>
                            <span>Theory & Concepts</span>
                          </button>

                          {mHasVideo && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSection("video");
                                setMobileMilestonesOpen(false);
                              }}
                              className={`roadmap-sidebar-sub-btn ${activeSection === "video" ? "active" : "inactive"}`}
                            >
                              <span className="font-extrabold opacity-90">2.</span>
                              <span>YT Video Tutorial</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection("practice");
                              setMobileMilestonesOpen(false);
                            }}
                            className={`roadmap-sidebar-sub-btn ${activeSection === "practice" ? "active" : "inactive"}`}
                          >
                            <span className="font-extrabold opacity-90">{mHasVideo ? "3." : "2."}</span>
                            <span>Practice Question</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection("quiz");
                              setMobileMilestonesOpen(false);
                            }}
                            className={`roadmap-sidebar-sub-btn ${activeSection === "quiz" ? "active" : "inactive"}`}
                          >
                            <span className="font-extrabold opacity-90">{mHasVideo ? "4." : "3."}</span>
                            <span>Assessment Quiz</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT MAIN PANEL: ACTIVE MILESTONE CONTENT ── */}
          {activeMilestone ? (() => {
            const activeCleanTitle = String(activeMilestone.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
            const activeCleanRole = String(currentRoadmap?.targetRole || "").trim();
            const activeVideoKey = `${activeCleanTitle.toLowerCase()}__${activeCleanRole.toLowerCase()}`;
            const activeFetchedVid = milestoneVideosCache[activeVideoKey];
            const hasActiveVideo = Boolean(activeFetchedVid && activeFetchedVid.videoId && activeFetchedVid.embedUrl);

            return (
            <div className="roadmap-main-panel">
              
              {/* Milestone Banner Header */}
              <div className="roadmap-banner-card">
                <div className="roadmap-banner-top">
                  <div>
                    <span className="roadmap-step-pill-badge">
                      Milestone {activeMilestoneIdx + 1} of {milestones.length}
                    </span>
                    <h2 className="roadmap-banner-title">
                      {activeMilestone.title}
                    </h2>
                    <p className="roadmap-banner-desc">
                      {activeMilestone.desc}
                    </p>
                  </div>

                  <span className={activeMilestone.status === "completed" ? "roadmap-status-badge-done" : "roadmap-status-badge-progress"}>
                    {activeMilestone.status === "completed" ? "Milestone Completed ✓" : "Milestone In Progress"}
                  </span>
                </div>

                {/* Sequential Numbered Navigation Steps (Hides YT Video if unavailable) */}
                <div className="roadmap-step-tabs-row">
                  <button
                    type="button"
                    onClick={() => setActiveSection("theory")}
                    className={`roadmap-step-tab-btn ${activeSection === "theory" ? "active" : "inactive"}`}
                  >
                    <span className="roadmap-step-badge-num">1</span>
                    <span>Theory</span>
                  </button>

                  {hasActiveVideo && (
                    <button
                      type="button"
                      onClick={() => setActiveSection("video")}
                      className={`roadmap-step-tab-btn ${activeSection === "video" ? "active" : "inactive"}`}
                    >
                      <span className="roadmap-step-badge-num">2</span>
                      <span>YT Video</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveSection("practice")}
                    className={`roadmap-step-tab-btn ${activeSection === "practice" ? "active" : "inactive"}`}
                  >
                    <span className="roadmap-step-badge-num">{hasActiveVideo ? 3 : 2}</span>
                    <span>Practice Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection("quiz")}
                    className={`roadmap-step-tab-btn ${activeSection === "quiz" ? "active" : "inactive"}`}
                  >
                    <span className="roadmap-step-badge-num">{hasActiveVideo ? 4 : 3}</span>
                    <span>Assessment Quiz</span>
                  </button>
                </div>
              </div>

              {/* ── PART 1: THEORY SECTION ── */}
              {activeSection === "theory" && (() => {
                const cleanTitle = String(activeMilestone.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
                const cleanRole = String(currentRoadmap?.targetRole || "").trim();
                const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
                const fetchedTheory = aiTheoryCache[cacheKey];
                const immediateTheory = getTheoryForMilestone(activeMilestone, cleanRole);
                const theoryData = fetchedTheory || immediateTheory;

                if (!theoryData) {
                  return (
                    <div className="roadmap-section-card roadmap-theory-loading">
                      <div className="roadmap-loading-orb-wrap">
                        <Sparkles size={36} className="roadmap-icon-amber roadmap-spin-pulse" />
                      </div>
                      <h4 className="roadmap-empty-title">
                        Generating Educational Theory for "{cleanTitle}"...
                      </h4>
                      <p className="roadmap-empty-desc">
                        Synthesizing authentic, topic-specific curriculum from foundational basics to working mechanics, practical code, and senior best practices.
                      </p>
                      <div className="roadmap-loading-steps-pills">
                        <span className="roadmap-load-step-chip">L1: Intuition & Concepts</span>
                        <span className="roadmap-load-step-chip">L2: Working Mechanics</span>
                        <span className="roadmap-load-step-chip">L3: Core Internals</span>
                        <span className="roadmap-load-step-chip">L4: Senior Best Practices</span>
                      </div>
                      {!isTheoryLoading && (
                        <button
                          type="button"
                          onClick={() => loadAITheoryForMilestone(cleanTitle, cleanRole, true)}
                          className="roadmap-retry-ai-btn"
                        >
                          <RefreshCw size={14} />
                          <span>Generate Now with AI</span>
                        </button>
                      )}
                    </div>
                  );
                }

                const sectionsList = theoryData.sections || [];

                return (
                  <div className="roadmap-section-card">
                    {/* Live Background AI Generation Notification Banner */}
                    {!fetchedTheory && isTheoryLoading && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 16px",
                          marginBottom: "16px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(99, 102, 241, 0.12))",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          color: "#d97706",
                          fontSize: "13px",
                          fontWeight: 500
                        }}
                      >
                        <Sparkles size={16} className="roadmap-icon-amber roadmap-spin-pulse" style={{ flexShrink: 0 }} />
                        <span>
                          <strong>Live AI Curriculum Generator:</strong> Synthesizing live personalized deep theory for "{cleanTitle}" in the background... You can start reading the structured guide below immediately!
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="roadmap-part-header-bar">
                        <span className="roadmap-part-pill">
                          PART 1 OF {hasActiveVideo ? 4 : 3}
                        </span>
                        <span className="roadmap-ai-tag-pill">
                          <Sparkles size={12} className="roadmap-icon-emerald" />
                          <span>{fetchedTheory ? "100% Live AI Generated Theory" : "Comprehensive Educational Guide"}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => loadAITheoryForMilestone(cleanTitle, cleanRole, true)}
                          disabled={isTheoryLoading}
                          className="roadmap-refresh-theory-btn"
                          title="Regenerate this topic's theory fresh with AI"
                        >
                          <RefreshCw size={12} className={isTheoryLoading ? "roadmap-spin-loader" : ""} />
                          <span>{isTheoryLoading ? "Generating AI Theory..." : "Regenerate with AI"}</span>
                        </button>
                      </div>
                      <h3 className="roadmap-section-heading">
                        {theoryData.title || `Comprehensive Technical Guide: ${cleanTitle}`}
                      </h3>
                      <p className="roadmap-theory-overview-box">
                        {renderFormattedTheoryText(theoryData.overview)}
                      </p>
                    </div>

                    <div className="roadmap-key-concepts">
                      <div className="roadmap-theory-level-bar">
                        <div className="roadmap-theory-level-title">
                          <Sparkles size={15} className="roadmap-icon-amber" />
                          <span>Curriculum Track: {theoryData.difficultyProgression || "Intuition & Concept ➔ Working Mechanics ➔ Core Internals ➔ Senior Best Practices"}</span>
                        </div>
                        <div className="roadmap-theory-level-steps">
                          <div className="roadmap-theory-step-pill step-lvl-1">
                            <span className="step-num">L1</span>
                            <span className="step-lbl">Intuition</span>
                          </div>
                          <span className="roadmap-theory-step-arrow">→</span>
                          <div className="roadmap-theory-step-pill step-lvl-2">
                            <span className="step-num">L2</span>
                            <span className="step-lbl">Mechanics</span>
                          </div>
                          <span className="roadmap-theory-step-arrow">→</span>
                          <div className="roadmap-theory-step-pill step-lvl-3">
                            <span className="step-num">L3</span>
                            <span className="step-lbl">Internals</span>
                          </div>
                          <span className="roadmap-theory-step-arrow">→</span>
                          <div className="roadmap-theory-step-pill step-lvl-4">
                            <span className="step-num">L4</span>
                            <span className="step-lbl">Best Practices</span>
                          </div>
                        </div>
                      </div>

                      <h4 className="roadmap-section-subheading">
                        {isTechnicalCodingRole(currentRoadmap?.targetRole, activeMilestone?.title) 
                          ? "Step-by-Step Educational Curriculum & Under-the-Hood Mechanics" 
                          : "Core Methodology & Practical Framework"}
                      </h4>

                      {sectionsList.map((sec, sIdx) => {
                        const points = extractPointsFromSection(sec);
                        const lvlTier = sIdx % 4;
                        const levelConfig = [
                          { label: "Level 1: Core Concept & Real-World Intuition", badge: "Intuition", colorClass: "lvl-emerald", Icon: BookOpen },
                          { label: "Level 2: Working Mechanics & Step-by-Step Flow", badge: "Mechanics", colorClass: "lvl-sky", Icon: Cpu },
                          { label: "Level 3: Deep Core Internals & Architecture", badge: "Core Internals", colorClass: "lvl-indigo", Icon: Layers },
                          { label: "Level 4: Common Pitfalls & Senior Best Practices", badge: "Senior Best Practices", colorClass: "lvl-amber", Icon: ShieldCheck }
                        ][lvlTier];

                        const sectionLevel = sec.level || levelConfig.label;
                        const SectionIcon = levelConfig.Icon;

                        return (
                          <div key={sIdx} className={`roadmap-theory-subcard ${levelConfig.colorClass}-card`}>
                            <div className="roadmap-theory-subcard-header">
                              <span className={`roadmap-theory-level-pill ${levelConfig.colorClass}`}>
                                <SectionIcon size={13} />
                                <span>{sectionLevel}</span>
                              </span>
                            </div>
                            <h5 className="roadmap-theory-subhead">
                              <span>{renderFormattedTheoryText(sec.title)}</span>
                            </h5>
                            {sec.explanation && points.length > 1 && (
                              <p className="roadmap-subcard-explanation">
                                {renderFormattedTheoryText(sec.explanation)}
                              </p>
                            )}
                            <ul className="roadmap-theory-points-list">
                              {points.map((pt, pIdx) => (
                                <li key={pIdx} className="roadmap-theory-point-item">
                                  <span className={`roadmap-point-bullet ${levelConfig.colorClass}-bullet`}>{pIdx + 1}</span>
                                  <span>{renderFormattedTheoryText(pt)}</span>
                                </li>
                              ))}
                            </ul>
                            {sec.takeaway && (
                              <div className={`roadmap-theory-takeaway ${levelConfig.colorClass}-takeaway`}>
                                💡 Industry Takeaway: {renderFormattedTheoryText(sec.takeaway)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Code / Workflow Syntax Block */}
                    {theoryData.codeExample && (
                      <div>
                        <h4 className="roadmap-section-subheading">
                          {isTechnicalCodingRole(currentRoadmap?.targetRole, activeMilestone?.title) 
                            ? "Working Syntax & Execution Pattern" 
                            : "Practical Workflow & Domain Case Study"}
                        </h4>
                        <div className="vscode-editor-container roadmap-editor-padded">
                          <VSCodeCodeHighlighter code={theoryData.codeExample} />
                        </div>
                      </div>
                    )}

                    {/* Best Practices */}
                    {Array.isArray(theoryData.bestPractices) && theoryData.bestPractices.length > 0 && (
                      <div className="roadmap-takeaway-box">
                        <h5 className="roadmap-takeaway-title">
                          Industry Best Practices:
                        </h5>
                        <ul className="roadmap-takeaway-list">
                          {theoryData.bestPractices.map((bp, bIdx) => (
                            <li key={bIdx}>{renderFormattedTheoryText(bp)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Next */}
                    <div className="roadmap-action-row">
                      {hasActiveVideo ? (
                        <button
                          type="button"
                          onClick={() => setActiveSection("video")}
                          className="roadmap-proceed-btn"
                        >
                          <span>Proceed to Video Tutorial</span>
                          <ArrowRight size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveSection("practice")}
                          className="roadmap-proceed-btn"
                        >
                          <span>Proceed to Practice Question</span>
                          <ArrowRight size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── PART 2: YT VIDEO SECTION ── */}
              {activeSection === "video" && (() => {
                const cleanTitle = String(activeMilestone.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
                const cleanRole = String(currentRoadmap?.targetRole || "").trim();
                const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
                const fallbackVid = getVideoForMilestone(activeMilestone, currentRoadmap.targetRole);
                const fetchedVid = milestoneVideosCache[cacheKey];
                const vid = fetchedVid || fallbackVid;

                return (
                  <div className="roadmap-section-card">
                    <div>
                      <div className="roadmap-part-header-bar">
                        <span className="roadmap-part-pill">PART 2 OF 4</span>
                        <span className="roadmap-video-tag-pill">
                          <Video size={13} />
                          <span>YouTube Video Lecture</span>
                        </span>
                      </div>
                      <h3 className="roadmap-section-heading">
                        Video Tutorial: {vid.title}
                      </h3>
                      <p className="roadmap-meta-text">
                        Channel: <strong>{vid.channel || "Curated YouTube Educator"}</strong> • Watch this video lecture to master concepts visually before the practice problem.
                      </p>
                    </div>

                    {/* Embedded Video */}
                    {isVideoLoading && !fetchedVid ? (
                      <div className="roadmap-video-embed-box roadmap-video-loading">
                        <RefreshCw size={30} className="roadmap-icon-indigo roadmap-spin-loader" />
                        <span className="roadmap-meta-text">Fetching YouTube lecture for "{cleanTitle}"...</span>
                      </div>
                    ) : (
                      <div className="roadmap-video-embed-box">
                        <iframe
                          src={vid.embedUrl}
                          title={vid.title}
                          className="roadmap-video-iframe"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <a href={vid.searchUrl} target="_blank" rel="noopener noreferrer" className="roadmap-video-search-link">
                        Search More Tutorials on YouTube <ExternalLink size={13} />
                      </a>

                      <button
                        type="button"
                        onClick={() => setActiveSection("practice")}
                        className="roadmap-proceed-btn"
                      >
                        <span>Proceed to Practice Question</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── PART 3: PRACTICE QUESTION & LIVE COMPILER ── */}
              {activeSection === "practice" && (() => {
                const cleanTitle = String(activeMilestone.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
                const cleanRole = String(currentRoadmap?.targetRole || "").trim();
                const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
                const aiPractice = aiPracticeCache[cacheKey];
                const practice = aiPractice || getPracticeQuestionForMilestone(activeMilestone, currentRoadmap.targetRole);
                return (
                  <div className="roadmap-section-card">
                    <div>
                      <div className="roadmap-part-header-bar">
                        <span className="roadmap-part-pill">
                          PART {hasActiveVideo ? 3 : 2} OF {hasActiveVideo ? 4 : 3}
                        </span>
                        <span className="roadmap-practice-tag-pill">
                          <Code2 size={13} />
                          <span>{aiPractice ? "AI Tailored Practice Challenge" : "Hands-on Practice & Compiler"}</span>
                        </span>
                        {isPracticeLoading && !aiPractice && (
                          <span className="roadmap-meta-text" style={{ fontSize: "11px", color: "#818cf8" }}>
                            Generating AI challenge for this topic...
                          </span>
                        )}
                      </div>
                      <h3 className="roadmap-section-heading">
                        {practice.title}
                      </h3>
                      <p className="roadmap-prompt-text">
                        {practice.prompt}
                      </p>
                    </div>

                    <div className="roadmap-sample-box">
                      <div className="roadmap-sample-input">{practice.sampleInput}</div>
                      <div className="roadmap-sample-output">{practice.sampleOutput}</div>
                    </div>

                    {/* Upgraded Spacious Code IDE & Live Web Preview Box */}
                    <div className="compiler-ide-box">
                      {/* Top Toolbar */}
                      <div className="compiler-top-toolbar">
                        <div className="compiler-toolbar-left">
                          <Terminal size={14} className="compiler-terminal-icon" />
                          <span className="compiler-toolbar-title">
                            {isTechnicalCodingRole(currentRoadmap?.targetRole, activeMilestone?.title) 
                              ? "LIVE CODE IDE & PLAYGROUND" 
                              : "PRACTICE WORKFLOW PLAYGROUND"}
                          </span>
                        </div>

                        <div className="compiler-toolbar-right">
                          <button
                            type="button"
                            onClick={handleResetCompilerCode}
                            className="compiler-reset-btn"
                            title="Reset code to challenge template"
                          >
                            <RotateCcw size={13} />
                            <span>Reset Code</span>
                          </button>

                          <div className="compiler-select-wrapper">
                            <CustomSelect
                              value={compilerLanguage}
                              options={COMPILER_LANGUAGE_OPTIONS}
                              onChange={handleCompilerLanguageChange}
                              placeholder="Select Language"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Big Spacious Monaco Code Editor */}
                      <MonacoCodeEditor
                        value={compilerCode}
                        onChange={(val) => setCompilerCode(val)}
                        language={compilerLanguage}
                        height="400px"
                      />

                      {/* Action Bar with Run button, Submit Solution, and Output tab switchers */}
                      <div className="compiler-actions-bar">
                        <div className="compiler-actions-left">
                          <button
                            type="button"
                            onClick={handleRunCompiler}
                            disabled={compilerStatus === "running"}
                            className="compiler-run-btn"
                          >
                            {compilerStatus === "running" ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Play size={14} />
                            )}
                            <span>{compilerStatus === "running" ? "Running in Docker..." : "Run Code"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleSubmitPractice}
                            disabled={compilerStatus === "running"}
                            className={`compiler-submit-practice-btn ${practiceScores[activeMilestone?.id || `m_${activeMilestoneIdx}`] === 100 ? "submitted" : ""}`}
                          >
                            <CheckCircle2 size={14} />
                            <span>{practiceScores[activeMilestone?.id || `m_${activeMilestoneIdx}`] === 100 ? "Practice Submitted (100%)" : "Submit Practice Solution"}</span>
                          </button>

                          <div className="compiler-tabs-group">
                            <button
                              type="button"
                              onClick={() => setCompilerActiveTab("terminal")}
                              className={`compiler-tab-btn ${compilerActiveTab === "terminal" ? "active" : ""}`}
                            >
                              <Terminal size={13} />
                              <span>Terminal Output</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCompilerActiveTab("input")}
                              className={`compiler-tab-btn ${compilerActiveTab === "input" ? "active" : ""}`}
                            >
                              <FileText size={13} />
                              <span>Custom Input</span>
                            </button>

                            {(compilerLanguage === "react" || compilerLanguage === "html") && (
                              <button
                                type="button"
                                onClick={() => setCompilerActiveTab("preview")}
                                className={`compiler-tab-btn ${compilerActiveTab === "preview" ? "active" : ""}`}
                              >
                                <Eye size={13} />
                                <span>{compilerLanguage === "react" ? "Live React Preview" : "Live Web Preview"}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="compiler-actions-right">
                          {compilerStatus === "running" && (
                            <span className="compiler-status-badge warning">
                              <RefreshCw size={13} className="animate-spin" /> Running in Docker...
                            </span>
                          )}
                          {practiceScores[activeMilestone?.id || `m_${activeMilestoneIdx}`] === 100 ? (
                            <span className="compiler-status-badge success">
                              <CheckCircle2 size={13} /> Practice Score: 100%
                            </span>
                          ) : compilerStatus === "success" ? (
                            <span className="compiler-status-badge success">
                              <CheckCircle2 size={13} /> Execution Succeeded
                            </span>
                          ) : null}
                          {compilerStatus === "error" && (
                            <span className="compiler-status-badge error">Runtime Error</span>
                          )}
                          {compilerStatus === "ce" && (
                            <span className="compiler-status-badge warning">Compilation Error</span>
                          )}
                          {compilerStatus === "tle" && (
                            <span className="compiler-status-badge warning">Time Limit Exceeded</span>
                          )}
                        </div>
                      </div>

                      {/* Output Section: Terminal Output, Custom Input, or Live Web Preview iframe */}
                      <div className="compiler-output-section">
                        {compilerActiveTab === "input" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#cbd5e1", fontWeight: 600, cursor: "pointer" }}>
                              <input 
                                type="checkbox" 
                                checked={useCustomInput} 
                                onChange={(e) => setUseCustomInput(e.target.checked)} 
                                style={{ accentColor: "#6366f1", width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              <span>Test against custom stdin input</span>
                            </label>
                            <textarea 
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              placeholder={useCustomInput ? "Type standard input (stdin) for your program here..." : `Default sample input: ${practice.sampleInput || '(none)'}`}
                              style={{ 
                                width: "100%", minHeight: "130px", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b", 
                                fontFamily: "'Fira Code', Consolas, monospace", fontSize: "13px", resize: "vertical",
                                background: "#0b1120", color: "#f8fafc", outline: "none", boxSizing: "border-box"
                              }}
                            />
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              {useCustomInput ? "Using custom input for Docker sandbox execution." : "Custom input is disabled. Docker execution will use the milestone's sample input."}
                            </span>
                          </div>
                        ) : compilerActiveTab === "preview" && (compilerLanguage === "html" || compilerLanguage === "react") ? (
                          <iframe
                            key={`${compilerLanguage}-${compilerCode.length}`}
                            title="Live Code Preview"
                            className="compiler-web-preview-frame"
                            srcDoc={getPreviewDocument(compilerLanguage, compilerCode)}
                            sandbox="allow-scripts allow-modals"
                          />
                        ) : (
                          <div>
                            {compilerOutput ? (
                              <pre className="compiler-terminal-view">
                                <span className="compiler-output-prefix">$ docker execution output:{"\n"}</span>
                                {compilerOutput}
                              </pre>
                            ) : (
                              <div className="compiler-empty-output">
                                Click "Run Code" above to execute inside the isolated Docker sandbox container.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="roadmap-action-row">
                      <button
                        type="button"
                        onClick={() => setActiveSection("quiz")}
                        className="roadmap-proceed-btn"
                      >
                        <span>Proceed to Assessment Quiz</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── PART 4: ASSESSMENT QUIZ & UNLOCKING M2 ── */}
              {activeSection === "quiz" && (() => {
                const mKey = activeMilestone.id || `m_${activeMilestoneIdx}`;
                const cleanTitle = String(activeMilestone.title || "").replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
                const cleanRole = String(currentRoadmap?.targetRole || "").trim();
                const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;
                const rawQuestions = aiQuizCache[cacheKey]?.questions || getQuizQuestionsForMilestone(activeMilestone, currentRoadmap.targetRole);
                const isDynamicQuiz = Boolean(aiQuizCache[cacheKey]?.questions);
                const questions = rawQuestions.map((q, idx) => ({
                  id: q.id || idx + 1,
                  question: q.question,
                  options: q.options || [],
                  correctAnswer: q.correctAnswer ?? q.correctAnswerIndex ?? 0,
                  explanation: q.explanation || `Core concept of ${cleanTitle} verified.`
                }));
                const currentPracticeScore = practiceScores[mKey] !== undefined ? practiceScores[mKey] : (compilerStatus === "success" ? 100 : 0);

                return (
                  <div className="roadmap-section-card">
                    <div>
                      <div className="roadmap-part-header-bar">
                        <span className="roadmap-part-pill">
                          PART {hasActiveVideo ? 4 : 3} OF {hasActiveVideo ? 4 : 3}
                        </span>
                        <span className="roadmap-quiz-tag-pill">
                          <CheckCircle2 size={13} />
                          <span>{isDynamicQuiz ? "AI Topic Assessment Quiz" : "Milestone Assessment Quiz"}</span>
                        </span>
                        {isQuizLoading && !isDynamicQuiz && (
                          <span className="roadmap-meta-text" style={{ fontSize: "11px", color: "#818cf8" }}>
                            Generating AI quiz questions for "{cleanTitle}"...
                          </span>
                        )}
                      </div>
                      <h3 className="roadmap-section-heading">
                        Milestone Assessment Quiz: {cleanTitle}
                      </h3>
                      <p className="roadmap-meta-text">
                        Complete this 5-question assessment quiz to verify your understanding of <strong>{cleanTitle}</strong> and unlock Milestone {activeMilestoneIdx + 2}!
                      </p>
                    </div>

                    {/* Unlocking Requirement Notice Banner */}
                    <div className="roadmap-quiz-criteria-box">
                      <div className="roadmap-quiz-criteria-header">
                        <span className="roadmap-quiz-criteria-title">
                          <ShieldCheck size={16} color="#6366f1" />
                          <span>Unlocking Requirement: 50% Combined Score Across Practice & Quiz</span>
                        </span>
                        <div className="roadmap-quiz-criteria-badges">
                          <span className={`roadmap-score-chip-sm ${currentPracticeScore === 100 ? "success" : "warning"}`}>
                            {currentPracticeScore === 100 ? (
                              <>
                                <CheckCircle2 size={12} />
                                <span>Practice Problem: 100% (Completed)</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={12} />
                                <span>Practice Problem: 0% (Pending Run/Submit)</span>
                              </>
                            )}
                          </span>
                          <span className="roadmap-score-chip-sm info">
                            <HelpCircle size={12} />
                            <span>Quiz Weight: 50%</span>
                          </span>
                        </div>
                      </div>
                      <p className="roadmap-meta-text" style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
                        Milestone {activeMilestoneIdx + 2} will unlock only when your combined score <code>(Practice Score % + Quiz Score %) / 2</code> reaches at least <strong>50%</strong>.
                      </p>
                    </div>

                    {/* Quiz Questions */}
                    <div className="roadmap-quiz-container">
                      {questions.map((q, qIdx) => (
                        <div key={q.id} className="roadmap-quiz-qcard">
                          <h4 className="roadmap-quiz-q-title">
                            Q{qIdx + 1}. {q.question}
                          </h4>

                          <div className="roadmap-quiz-options-grid">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = quizAnswers[qIdx] === oIdx;
                              const isCorrect = oIdx === q.correctAnswer;
                              let optionStateClass = "option-default";
                              if (quizSubmitted) {
                                if (isCorrect) {
                                  optionStateClass = "option-correct";
                                } else if (isSelected) {
                                  optionStateClass = "option-incorrect";
                                }
                              } else if (isSelected) {
                                optionStateClass = "option-selected";
                              }

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => handleQuizAnswer(qIdx, oIdx)}
                                  disabled={quizSubmitted}
                                  className={`roadmap-quiz-option-btn ${optionStateClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <p className="roadmap-quiz-explanation">
                              💡 Explanation: {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Quiz Controls & Results */}
                    {!quizSubmitted ? (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizAnswers).length < questions.length}
                        className={`roadmap-quiz-submit-btn ${Object.keys(quizAnswers).length === questions.length ? "btn-ready" : "btn-disabled"}`}
                      >
                        Submit Quiz & Verify Unlocking
                      </button>
                    ) : (() => {
                      const mResult = milestoneCombinedResults[mKey] || {
                        practiceScore: currentPracticeScore,
                        quizScore: Math.round((quizScore / Math.max(questions.length, 1)) * 100),
                        quizCorrectCount: quizScore,
                        quizTotalCount: questions.length,
                        combinedScore: Math.round((currentPracticeScore + Math.round((quizScore / Math.max(questions.length, 1)) * 100)) / 2),
                        isPassed: Math.round((currentPracticeScore + Math.round((quizScore / Math.max(questions.length, 1)) * 100)) / 2) >= 50
                      };
                      const { practiceScore, quizScore: qPct, combinedScore, isPassed } = mResult;

                      return isPassed ? (
                        <div className="roadmap-quiz-result-banner">
                          <div className="roadmap-quiz-result-score">
                            🎉 Passed! Combined Score: {combinedScore}% (≥ 50% Required to Unlock Next Milestone)
                          </div>

                          {/* Score Breakdown Cards */}
                          <div className="roadmap-score-breakdown-grid">
                            <div className="roadmap-score-metric-card">
                              <div className="roadmap-score-metric-label">Practice Challenge</div>
                              <div className="roadmap-score-metric-val">{practiceScore}%</div>
                            </div>
                            <div className="roadmap-score-metric-card">
                              <div className="roadmap-score-metric-label">Assessment Quiz</div>
                              <div className="roadmap-score-metric-val">{qPct}% ({quizScore}/{questions.length})</div>
                            </div>
                            <div className="roadmap-score-metric-card highlight passed">
                              <div className="roadmap-score-metric-label">Combined Score</div>
                              <div className="roadmap-score-metric-val">{combinedScore}%</div>
                            </div>
                          </div>

                          <p className="roadmap-quiz-result-desc">
                            Milestone {activeMilestoneIdx + 1} ("{activeMilestone.title}") is completed (100%)!
                            {activeMilestoneIdx + 1 < milestones.length
                              ? ` Milestone ${activeMilestoneIdx + 2} ("${milestones[activeMilestoneIdx + 1]?.title}") is now UNLOCKED!`
                              : " You have completed all milestones in this roadmap!"}
                          </p>

                          {activeMilestoneIdx + 1 < milestones.length && (
                            <button
                              type="button"
                              onClick={handleProceedToNextMilestone}
                              className="roadmap-proceed-btn roadmap-btn-centered"
                            >
                              <span>Proceed to Milestone {activeMilestoneIdx + 2}</span>
                              <ArrowRight size={16} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="roadmap-quiz-result-banner failed">
                          <div className="roadmap-quiz-result-score">
                            ⚠️ Passing Criteria Not Reached: Combined Score {combinedScore}% (&lt; 50% Required)
                          </div>

                          {/* Score Breakdown Cards */}
                          <div className="roadmap-score-breakdown-grid">
                            <div className="roadmap-score-metric-card">
                              <div className="roadmap-score-metric-label">Practice Challenge</div>
                              <div className="roadmap-score-metric-val">{practiceScore}%</div>
                            </div>
                            <div className="roadmap-score-metric-card">
                              <div className="roadmap-score-metric-label">Assessment Quiz</div>
                              <div className="roadmap-score-metric-val">{qPct}% ({quizScore}/{questions.length})</div>
                            </div>
                            <div className="roadmap-score-metric-card highlight failed">
                              <div className="roadmap-score-metric-label">Combined Score</div>
                              <div className="roadmap-score-metric-val">{combinedScore}%</div>
                            </div>
                          </div>

                          <p className="roadmap-quiz-result-desc">
                            Milestone {activeMilestoneIdx + 2} remains locked until you achieve at least 50% combined score.
                            {practiceScore === 0 ? " You currently have 0% on the Hands-on Practice Problem. Running and submitting your practice solution will award 100% practice marks, instantly lifting your combined score to 50%+ and unlocking the next milestone!" : " You can re-attempt the quiz or re-run the practice challenge to reach 50% combined score."}
                          </p>

                          <div className="roadmap-quiz-actions-row">
                            {practiceScore === 0 && (
                              <button
                                type="button"
                                onClick={() => setActiveSection("practice")}
                                className="roadmap-btn-warning"
                              >
                                <Code2 size={15} />
                                <span>Go to Practice Challenge (Earn 100%)</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleRetakeQuiz}
                              className="roadmap-btn-secondary"
                            >
                              <RotateCcw size={15} />
                              <span>Retake Assessment Quiz</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          ); })() : null}
        </div>
      )}
    </div>
  );
}
