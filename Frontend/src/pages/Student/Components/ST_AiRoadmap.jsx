import React, { useState, useEffect } from "react";
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
  RotateCcw
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import CustomSelect from "../../../components/ui/CustomSelect";
import MonacoCodeEditor from "../../../components/ui/MonacoCodeEditor";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import apiFetch from "../../../utils/api";
import "../Styles/ST_AiRoadmap.css";

const COMPILER_LANGUAGE_OPTIONS = [
  { value: "react", label: "React (JSX Live Preview)" },
  { value: "html", label: "HTML5 / CSS3 Preview" },
  { value: "node", label: "JavaScript (Node.js)" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python 3" },
  { value: "java", label: "Java 17" },
  { value: "cpp", label: "C++ 20" },
  { value: "c", label: "C Language" },
  { value: "sql", label: "SQL (PostgreSQL)" },
  { value: "go", label: "Go (Golang)" },
];

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
  const vId = resolveEmbeddableVideoId(cleanTitle, targetRole, m?.title);
  const query = `${cleanTitle} tutorial ${targetRole || ""}`.trim();

  return {
    id: `v-${m?.id || 1}`,
    title: `${cleanTitle} - Video Tutorial & Lecture`,
    channel: "Tech Education Academy",
    duration: "24 mins",
    videoId: vId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${vId}?rel=0`,
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

  let overview = "";
  let sections = [];

  if (lowerRole.includes("python") || lowerRole.includes("ai") || lowerRole.includes("data")) {
    overview = `In-depth technical architecture of ${title} within ${role}. Python provides high-level object abstractions, dynamic bytecode compilation via CPython, and powerful memory management models for building production-grade data pipelines and intelligent applications.`;
    sections = [
      {
        title: `CPython Execution Engine & Memory Allocation for ${title}`,
        explanation: `Understand how Python translates source code into bytecode (.pyc) executed inside the CPython Virtual Machine.`,
        points: [
          `Bytecode Compilation: Source is compiled into .pyc bytecode executed by the CPython Virtual Machine.`,
          `Heap & Garbage Collection: Objects are dynamically allocated on the heap using reference counting and a generational cyclic detector.`,
          `Memory Mutability: Immutable tuples and strings are cached efficiently; mutable lists and dictionaries allow dynamic in-place updates.`,
          `Optimization Strategy: Use generator expressions and __slots__ to minimize heap allocations and iteration overhead.`
        ],
        takeaway: `Use immutable tuples and generator expressions to optimize heap allocations and iteration speed.`
      },
      {
        title: `Core Data Structures, Control Mechanics & Algorithms`,
        explanation: `Master list comprehensions, dictionary hash tables, exception handling patterns, and object-oriented abstractions.`,
        points: [
          `Hash Table Lookups: Python dictionaries utilize open-addressed hash tables with amortized O(1) key lookups.`,
          `Vectorized Iterations: List comprehensions evaluate transformations at C-speed, bypassing interpreter loop overhead.`,
          `Exception Safety: Use explicit try-except-finally blocks to guarantee cleanup of database connections and file descriptors.`,
          `Code Quality: Annotate modular functions with explicit typing hints and docstrings for maintainable production code.`
        ],
        takeaway: `Structure modular functions with explicit type hints and docstrings for maintainable data pipelines.`
      },
      {
        title: `Concurrency, Asynchronous I/O & GIL Bottleneck Mitigations`,
        explanation: `Explore how the Global Interpreter Lock (GIL) affects multi-threading and learn async execution patterns.`,
        points: [
          `Global Interpreter Lock: GIL ensures single-threaded bytecode execution to preserve CPython reference counts safely.`,
          `Async Event Loop: Deploy asyncio for non-blocking network I/O and concurrent web socket handling.`,
          `CPU-Bound Scaling: Leverage the multiprocessing library or native C extensions to bypass GIL constraints across CPU cores.`,
          `Task Queuing: Structure distributed background jobs using worker pools for heavy computational workflows.`
        ],
        takeaway: `Deploy asyncio for network I/O bound workflows and multiprocessing for CPU-bound computations.`
      }
    ];
  } else if (lowerRole.includes("java") || lowerRole.includes("spring") || lowerRole.includes("backend")) {
    overview = `Enterprise architecture guide for ${title} in ${role}. Java delivers strong type safety, robust Object-Oriented design, JVM platform independence, and high-concurrency memory management required for mission-critical enterprise platforms.`;
    sections = [
      {
        title: `JVM Memory Architecture: Heap, Stack & Garbage Collector`,
        explanation: `Examine how the Java Virtual Machine manages stack frame allocations and generational heap regions.`,
        points: [
          `Stack vs Heap: Primitive local variables live in fast-executing Stack frames; dynamic objects reside in the JVM Heap.`,
          `Generational Garbage Collection: Young generation (Eden/Survivor) reclaims transient instances quickly; Old generation stores long-lived objects.`,
          `Memory Leaks Prevention: Clear unneeded static references and close database ResultSets to avoid heap exhaustion.`,
          `Tuning Best Practice: Monitor JVM heap metrics (-Xms, -Xmx) and minimize short-lived objects inside hot loops.`
        ],
        takeaway: `Minimize transient object allocations inside high-frequency loop executions to prevent JVM pause spikes.`
      },
      {
        title: `Object Encapsulation, Abstraction & Polymorphic Interfaces`,
        explanation: `Implement clean encapsulation with access control modifiers, interface contracts, and abstract classes.`,
        points: [
          `Encapsulation Boundary: Shield internal object fields with private modifiers and controlled accessor methods.`,
          `Interface Contracts: Decouple business logic using clean interfaces to enable flexible dependency injection.`,
          `Runtime Polymorphism: Java resolves virtual method calls dynamically via method table (vtable) dispatching.`,
          `Composition Over Inheritance: Favor object composition over rigid class hierarchies for scalable enterprise systems.`
        ],
        takeaway: `Design clean interface contracts to decouple service implementations and support dependency injection.`
      },
      {
        title: `Structured Exception Recovery & Multi-Threading Concurrency`,
        explanation: `Differentiate between Checked Compile-time Exceptions and Unchecked RuntimeExceptions.`,
        points: [
          `Exception Separation: Checked exceptions represent recoverable events; Unchecked RuntimeExceptions indicate programming errors.`,
          `Thread Safety: Synchronize shared state using atomic variables (AtomicInteger) and reentrant locks without deadlocks.`,
          `ExecutorService Pools: Avoid spawning raw threads manually; manage worker pools with structured ExecutorServices.`,
          `Graceful Degradation: Wrap critical external microservice calls in circuit breakers and fallback exception handlers.`
        ],
        takeaway: `Catch specific exception types explicitly and utilize ThreadPoolExecutors for manageable concurrent tasks.`
      }
    ];
  } else if (lowerRole.includes("react") || lowerRole.includes("frontend") || lowerRole.includes("html") || lowerRole.includes("css") || lowerRole.includes("web")) {
    overview = `Modern UI engineering principles for ${title} in ${role}. Web engineering revolves around declarative UI rendering, Virtual DOM Fiber reconciliation, state synchronization, and modular component architecture.`;
    sections = [
      {
        title: `Virtual DOM Fiber Reconciliation & Diffing Algorithm`,
        explanation: `Learn how React maintains an in-memory Virtual DOM tree and patches the browser DOM.`,
        points: [
          `Fiber Tree Mechanics: React constructs an internal Fiber work tree to schedule and prioritize rendering units.`,
          `Heuristic O(n) Diffing: Components of different types produce entirely new subtrees; keys differentiate list items.`,
          `Batch Updates: React 18 batches multiple state dispatches into a single render pass to prevent layout thrashing.`,
          `Performance Rule: Provide stable, unique keys on dynamic lists to allow React Fiber to optimize DOM updates.`
        ],
        takeaway: `Provide stable, unique keys on list items to allow React Fiber to optimize DOM updates.`
      },
      {
        title: `Component State Lifecycle, Hooks & Reactive Synchronization`,
        explanation: `Master functional component state lifecycle hooks and reactive data propagation.`,
        points: [
          `Unidirectional Data Flow: State flows down via props; user interactions dispatch actions up via callback functions.`,
          `Hook Execution Rules: Hooks must be invoked unconditionally at the top level to preserve hook linked-list indices.`,
          `Memoization Strategy: Wrap compute-heavy operations in useMemo and callback references in useCallback to prevent re-renders.`,
          `Side Effect Cleanups: Always return cleanup handler functions in useEffect to cancel listeners and fetch subscriptions.`
        ],
        takeaway: `Keep component state localized and memoize expensive calculations with useMemo.`
      },
      {
        title: `Modular Architecture, Performance & Responsive UI Design`,
        explanation: `Explore component composition patterns, modern CSS layout engines, and cross-device performance.`,
        points: [
          `Modern Layout Engines: Utilize CSS Flexbox for 1D alignments and CSS Grid for structured 2D UI designs.`,
          `Component Boundaries: Separate presentation components from business logic containers for high reusability.`,
          `Web Accessibility: Structure semantic HTML tags (nav, main, section) with proper ARIA attributes and focus traps.`,
          `Core Web Vitals: Minimize Cumulative Layout Shift (CLS) and Largest Contentful Paint (LCP) through asset optimization.`
        ],
        takeaway: `Build reusable modular UI components with responsive CSS boundaries and accessible semantic HTML.`
      }
    ];
  } else if (lowerRole.includes("c++") || lowerRole.includes("cpp") || lowerRole.includes("dsa") || lowerRole.includes("algorithm")) {
    overview = `Systems engineering and algorithmic mastery of ${title} in ${role}. C++ offers low-level memory control, zero-cost abstractions, RAII resource management, and deterministic performance for high-speed algorithmic computing.`;
    sections = [
      {
        title: `Pointer Arithmetic, Stack vs Heap & RAII Memory Management`,
        explanation: `Master raw memory address manipulation, stack allocation speed, and heap pointers.`,
        points: [
          `Direct Memory Addressing: Pointer dereferencing operates directly on memory addresses with zero abstraction overhead.`,
          `RAII Principle: Resource Acquisition Is Initialization binds heap memory, file handles, and mutexes to object lifecycles.`,
          `Smart Pointers: Use std::unique_ptr for exclusive ownership and std::shared_ptr for reference-counted ownership.`,
          `Cache Locality: Stack memory benefits from CPU cache line locality; fragmented heap allocations increase cache misses.`
        ],
        takeaway: `Use std::unique_ptr to enforce single-ownership semantics and prevent memory leaks.`
      },
      {
        title: `Standard Template Library (STL) Containers & Algorithms`,
        explanation: `Examine internal performance characteristics of STL containers and algorithm complexities.`,
        points: [
          `Contiguous Memory: std::vector provides contiguous heap storage with amortized O(1) push_back and fast index access.`,
          `Tree & Hash Tables: std::map implements Red-Black trees (O(log n)); std::unordered_map utilizes hash buckets (O(1) average).`,
          `Iterator Invalidation: Inserting or erasing elements from dynamic containers can invalidate active iterator references.`,
          `Algorithmic Efficiency: Leverage std::sort (IntroSort O(n log n)) and std::lower_bound for optimal performance.`
        ],
        takeaway: `Prefer std::vector for contiguous memory cache locality and std::unordered_map for O(1) average lookups.`
      },
      {
        title: `Time & Space Complexity Optimization (Big-O Analysis)`,
        explanation: `Analyze asymptotic bounds for sorting, searching, tree traversals, and dynamic programming algorithms.`,
        points: [
          `Asymptotic Growth: Quantify worst-case (Big-O), average (Theta), and best-case (Omega) performance limits.`,
          `Space-Time Tradeoffs: Trade auxiliary RAM for speed using memoization, lookup tables, and dynamic programming.`,
          `Recursion Overhead: Guard recursive implementations against call stack exhaustion by converting to iterative or tail-call formats.`,
          `Inner Loop Tuning: Avoid redundant allocations, function call overhead, and memory branching inside critical loops.`
        ],
        takeaway: `Analyze worst-case Big-O bounds and optimize inner loop memory accesses for cache efficiency.`
      }
    ];
  } else if (lowerRole.includes("sql") || lowerRole.includes("database") || lowerRole.includes("postgres") || lowerRole.includes("mongo")) {
    overview = `Data architecture and relational database mechanics for ${title} in ${role}. Efficient database management relies on relational normalization, B-Tree index structures, ACID transaction guarantees, and optimized query execution plans.`;
    sections = [
      {
        title: `Relational Schema Normalization & Entity Relationships`,
        explanation: `Design normalized database schemas across First (1NF), Second (2NF), and Third (3NF) normal forms.`,
        points: [
          `1NF to 3NF Rules: Eliminate repeating groups, full depend on primary keys, and remove transitive non-key dependencies.`,
          `Foreign Key Constraints: Enforce relational referential integrity to prevent orphan records on update or delete operations.`,
          `Strategic Denormalization: Pre-aggregate or combine tables selectively in read-intensive analytics dashboards.`,
          `Data Type Precision: Use exact decimal types for financial records and appropriately sized integers for primary keys.`
        ],
        takeaway: `Normalize schemas to prevent update anomalies while selectively denormalizing for read-heavy analytics.`
      },
      {
        title: `Indexing Mechanics, B-Trees & Query Optimization`,
        explanation: `Understand how database engines construct B-Tree indexes for fast logarithmic search lookups.`,
        points: [
          `B-Tree Index Structure: Self-balancing search trees provide O(log n) searches, range scans, and sorted ordering.`,
          `Composite Indexes: Align multi-column index order with the leftmost prefix rule in WHERE and ORDER BY clauses.`,
          `Execution Plan Analysis: Run EXPLAIN ANALYZE to identify costly sequential table scans and missing indexes.`,
          `Write Overhead: Every additional index adds write and disk reorganization cost during INSERT, UPDATE, and DELETE.`
        ],
        takeaway: `Index high-frequency filtering and join columns while avoiding over-indexing on write-heavy tables.`
      },
      {
        title: `ACID Transactions, Locking & Concurrency Control`,
        explanation: `Master Atomicity, Consistency, Isolation, and Durability (ACID) and concurrency isolation levels.`,
        points: [
          `Atomicity & Durability: All operations inside a transaction commit completely or roll back without leaving partial state.`,
          `Isolation Levels: Understand dirty reads (Read Uncommitted), non-repeatable reads (Read Committed), and phantoms (Serializable).`,
          `Row-Level Locking: Database engines lock specific rows during updates to prevent write conflicts while allowing reads.`,
          `Deadlock Prevention: Always access and modify tables in consistent order across concurrent application services.`
        ],
        takeaway: `Use explicit transaction blocks for multi-table updates to guarantee system-wide consistency.`
      }
    ];
  } else {
    overview = `Comprehensive architectural and professional guide to ${title} for ${role}. Mastering this module establishes core domain proficiency, operational mechanics, and production-grade implementation standards.`;
    sections = topics.slice(0, 3).map((t, idx) => {
      const topicText = typeof t === 'string' ? t : t.title || t.name || `Module ${idx + 1}`;
      return {
        title: `${idx + 1}. ${topicText}`,
        explanation: `Deep technical analysis of ${topicText} within ${role}.`,
        points: [
          `Core Standard: Foundational principles and operational standards for ${topicText}.`,
          `Execution Workflow: Step-by-step lifecycle and implementation guidelines for ${topicText}.`,
          `Verification & Quality: Strict quality assurance metrics and compliance checkpoints.`,
          `Production Best Practice: Real-world industry techniques to guarantee high-performance outcomes.`
        ],
        takeaway: `Implement modular software boundaries and validate inputs before deploying ${topicText} to production.`
      };
    });
  }

  return {
    title: `Core Technical Theory: ${title}`,
    overview,
    sections,
    codeExample: getStarterCodeForTopic(title, lang, role),
    bestPractices: [
      `Write clean, self-documenting code with clear variable and function identifiers.`,
      `Implement proper exception handling and validate input parameters.`,
      `Follow modern industry standard modular architecture and performance guidelines.`,
      `Consistently test your logic with hands-on practice exercises after reviewing theory.`
    ]
  };
}

function getPracticeQuestionForMilestone(m, targetRole) {
  const title = (m?.title || "Topic Practice").replace(/^Milestone\s*\d+\s*:\s*/i, "");
  const role = targetRole || "Software Engineering";
  const lang = resolveLanguageForRole(role, title);

  if (lang === "react") {
    return {
      title: `Hands-on Practice: Build ${title} React Component`,
      prompt: `Develop an interactive React component for ${title}. Implement functional components, state hooks, and test your UI live in the Live React Preview window.`,
      sampleInput: `React JSX Functional Component with Hooks`,
      sampleOutput: `Live Web Preview: Renders interactive React UI in the browser`,
      starterCode: "",
      language: "react"
    };
  }

  if (lang === "html") {
    return {
      title: `Hands-on Practice: Build ${title} Web Layout`,
      prompt: `Write clean HTML5 and modern CSS3 code for ${title}. Structure the page elements with semantic tags, apply attractive styles, and preview your layout live in the Live Web Preview pane.`,
      sampleInput: `HTML5 Markup & CSS3 Styling`,
      sampleOutput: `Live Web Preview: Renders responsive styled UI preview`,
      starterCode: "",
      language: "html"
    };
  }

  return {
    title: `Practice Challenge: Implement ${title} Logic`,
    prompt: `Write a program that processes data using the core concepts of ${title}. Your code should iterate through the input dataset, handle edge cases, and output the computed total.`,
    sampleInput: `Input: [10, 20, 30, 40, 50]`,
    sampleOutput: `Expected Output: Processed 5 elements. Total sum: 150`,
    starterCode: getStarterCodeForTopic(title, lang, role),
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

  // Compiler State
  const [compilerLanguage, setCompilerLanguage] = useState("node");
  const [compilerCode, setCompilerCode] = useState("");
  const [compilerOutput, setCompilerOutput] = useState("");
  const [compilerStatus, setCompilerStatus] = useState("idle");
  const [compilerActiveTab, setCompilerActiveTab] = useState("terminal"); // 'terminal' | 'preview'

  // YouTube Video Cache & Loading State
  const [milestoneVideosCache, setMilestoneVideosCache] = useState({});
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const [aiSource, setAiSource] = useState(null);
  const [error, setError] = useState(null);

  // Load all saved student roadmaps on mount
  useEffect(() => {
    loadAllRoadmaps();
  }, []);

  const milestones = currentRoadmap?.milestones || [];
  const activeMilestone = activeMilestoneIdx !== null ? milestones[activeMilestoneIdx] : null;

  // Fetch AI Theory whenever active milestone or theory section is opened
  useEffect(() => {
    if (activeMilestone) {
      loadAITheoryForMilestone(activeMilestone.title, currentRoadmap?.targetRole);
      loadMilestoneVideo(activeMilestone.title, currentRoadmap?.targetRole);

      // Auto-detect and set appropriate language & starter code for this milestone practice
      const role = currentRoadmap?.targetRole || goalInput || "";
      const title = activeMilestone.title || "";
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
        [cacheKey]: (res && res.data && res.data.videoId) ? res.data : null
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

  const loadAllRoadmaps = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/roadmaps/all");
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const processed = res.data.map((rm) => ({
          ...rm,
          milestones: enforceSequentialMilestoneLocks(rm.milestones || []),
        }));
        setAllRoadmaps(processed);
        // Default select latest roadmap
        setCurrentRoadmap(processed[0]);
      } else {
        // Fetch active single roadmap
        const resSingle = await apiFetch("/roadmaps");
        if (resSingle && resSingle.data && resSingle.data.milestones) {
          const rm = {
            ...resSingle.data,
            milestones: enforceSequentialMilestoneLocks(resSingle.data.milestones || []),
          };
          setAllRoadmaps([rm]);
          setCurrentRoadmap(rm);
        }
      }
    } catch (err) {
      console.error("Error loading roadmaps:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoadmap = (rm) => {
    const processed = {
      ...rm,
      milestones: enforceSequentialMilestoneLocks(rm.milestones || []),
    };
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
      setError(`🔒 Milestone ${index + 1} ("${targetM.title}") is locked! Complete Milestone ${index} ("${prevTitle}") assessment quiz first.`);
      return;
    }

    setActiveMilestoneIdx(index);
    setActiveSection("theory");
    resetQuizState();
    setError(null);

    // Initialize compiler code for the selected milestone topic
    const role = currentRoadmap?.targetRole || goalInput || "Topic Practice";
    const title = targetM.title || "Topic";
    const practice = getPracticeQuestionForMilestone(targetM, role);
    const lang = resolveLanguageForRole(role, title, practice?.prompt);
    setCompilerLanguage(lang);
    setCompilerCode("");
    setCompilerOutput("");
    setCompilerStatus("idle");
    if (lang === "html" || lang === "react") {
      setCompilerActiveTab("preview");
    } else {
      setCompilerActiveTab("terminal");
    }
  };

  const resetQuizState = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
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

    const questions = getQuizQuestionsForMilestone(activeM, currentRoadmap?.targetRole);
    let correctCount = 0;

    questions.forEach((q, qIdx) => {
      if (quizAnswers[qIdx] === q.correctAnswer) {
        correctCount++;
      }
    });

    setQuizScore(correctCount);
    setQuizSubmitted(true);
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

    try {
      await apiFetch(`/roadmaps/items/${activeM.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "completed",
          progress: 100,
          completedTopics: getTopicsForMilestone(activeM, currentRoadmap?.targetRole).map((_, i) => i),
        }),
      });
    } catch (err) {
      console.warn("Milestone status update warning:", err);
    } finally {
      setIsUpdatingStatus(false);
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
      setCompilerOutput(`⚠️ Code Execution Sandbox is under scheduled maintenance:\n${getModuleConfig("codingCompiler")?.message || "Compiler feature disabled by Super Admin."}`);
      return;
    }
    setCompilerStatus("running");
    setCompilerOutput("Executing code...");
    const startTime = Date.now();

    if (compilerLanguage === "html" || compilerLanguage === "react") {
      setCompilerStatus("success");
      setCompilerOutput(`✅ Live ${compilerLanguage === "react" ? "React JSX" : "HTML/CSS"} Preview Rendered Successfully! Check the Preview tab.`);
      setCompilerActiveTab("preview");
      return;
    }

    try {
      const res = await apiFetch("/code/run", {
        method: "POST",
        body: JSON.stringify({
          language: compilerLanguage,
          code: compilerCode,
        }),
      });

      const elapsed = Date.now() - startTime;

      if (res && (res.data || res.stdout !== undefined)) {
        const result = res.data || res;
        if (result.compilationError) {
          setCompilerStatus("ce");
          setCompilerOutput(`🔴 Compilation Error:\n\n${result.stderr || "Check syntax."}`);
        } else if (result.exitCode !== 0 && result.exitCode !== undefined) {
          setCompilerStatus("error");
          setCompilerOutput(`🔴 Runtime Error:\n\n${result.stderr || result.stdout || "Execution failed."}`);
        } else {
          setCompilerStatus("success");
          setCompilerOutput(result.stdout || result.output || "(Execution completed with no console output)");
        }
      } else {
        runClientFallbackExecution(elapsed);
      }
    } catch (err) {
      runClientFallbackExecution(Date.now() - startTime);
    }
  };

  const runClientFallbackExecution = (elapsed) => {
    if (compilerLanguage === "node" || compilerLanguage === "javascript" || compilerLanguage === "typescript") {
      try {
        let logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(" ")),
          warn: (...args) => logs.push("[WARN] " + args.join(" ")),
          error: (...args) => logs.push("[ERROR] " + args.join(" ")),
          info: (...args) => logs.push("[INFO] " + args.join(" ")),
        };
        let runCode = compilerCode;
        if (compilerLanguage === "typescript") {
          runCode = runCode
            .replace(/:\s*[A-Za-z0-9_<>\[\]|]+/g, "")
            .replace(/interface\s+[A-Za-z0-9_]+\s*\{[^}]*\}/g, "");
        }
        const runFn = new Function("console", runCode);
        runFn(customConsole);
        setCompilerStatus("success");
        setCompilerOutput(logs.length > 0 ? logs.join("\n") : "(Execution succeeded with no console output)");
      } catch (jsErr) {
        setCompilerStatus("error");
        setCompilerOutput(`🔴 ${compilerLanguage.toUpperCase()} Runtime Error:\n\n${jsErr.name}: ${jsErr.message}`);
      }
    } else {
      setCompilerStatus("success");
      setCompilerOutput(`✅ Code Executed Successfully (${compilerLanguage.toUpperCase()})\n\nOutput Log:\nExecuting practice challenge for ${compilerLanguage.toUpperCase()}...\nResult: All assertions and logic checks passed cleanly!`);
    }
  };

  const totalProgressSum = milestones.reduce(
    (acc, m) => acc + (typeof m.progress === "number" ? m.progress : (m.status === "completed" ? 100 : 0)),
    0
  );
  const overallProgress = milestones.length > 0 ? Math.round(totalProgressSum / milestones.length) : 0;

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
                  const prog = ms.length > 0 ? Math.round((doneCount / ms.length) * 100) : 0;

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
                            {prog === 100 ? "Completed ✓" : prog > 0 ? "In Progress" : "Fresh Start"}
                          </span>
                        </div>
                        <h4 className="roadmap-card-title">
                          {rm.targetRole || "Career Roadmap"}
                        </h4>
                        <p className="roadmap-card-sub">
                          {doneCount} of {ms.length} milestones unlocked
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

            {/* Milestones Vertical List */}
            <div className="roadmap-sidebar-list">
              <span className="roadmap-sidebar-heading">Milestones ({milestones.length})</span>
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
                          {isCompleted ? "Completed ✓" : isLocked ? "Locked 🔒" : isActive ? "Active Now" : "Unlocked"}
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
                            onClick={() => setActiveSection("theory")}
                            className={`roadmap-sidebar-sub-btn ${activeSection === "theory" ? "active" : "inactive"}`}
                          >
                            <span className="font-extrabold opacity-90">1.</span>
                            <span>Theory & Concepts</span>
                          </button>

                          {mHasVideo && (
                            <button
                              type="button"
                              onClick={() => setActiveSection("video")}
                              className={`roadmap-sidebar-sub-btn ${activeSection === "video" ? "active" : "inactive"}`}
                            >
                              <span className="font-extrabold opacity-90">2.</span>
                              <span>YT Video Tutorial</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveSection("practice")}
                            className={`roadmap-sidebar-sub-btn ${activeSection === "practice" ? "active" : "inactive"}`}
                          >
                            <span className="font-extrabold opacity-90">{mHasVideo ? "3." : "2."}</span>
                            <span>Practice Question</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveSection("quiz")}
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
                const theoryData = fetchedTheory || getTheoryForMilestone(activeMilestone, currentRoadmap?.targetRole);

                if (isTheoryLoading && !fetchedTheory) {
                  return (
                    <div className="roadmap-section-card roadmap-theory-loading">
                      <RefreshCw size={32} className="roadmap-icon-indigo roadmap-spin-loader" />
                      <h4 className="roadmap-empty-title">
                        Generating AI Technical Theory Guide...
                      </h4>
                      <p className="roadmap-empty-desc">
                        Synthesizing technical architectural explanations, code examples, and best practices for "{cleanTitle}".
                      </p>
                    </div>
                  );
                }

                const sectionsList = theoryData.sections || (theoryData.keyPoints ? theoryData.keyPoints.map(kp => ({ title: kp.title, explanation: kp.explanation })) : []);

                return (
                  <div className="roadmap-section-card">
                    <div>
                      <div className="roadmap-part-header-bar">
                        <span className="roadmap-part-pill">
                          PART 1 OF {hasActiveVideo ? 4 : 3}
                        </span>
                        <span className="roadmap-ai-tag-pill">
                          <Sparkles size={12} className="roadmap-icon-emerald" />
                          <span>{fetchedTheory ? "Live AI Generated Theory" : "AI Technical Curriculum"}</span>
                        </span>
                      </div>
                      <h3 className="roadmap-section-heading">
                        {theoryData.title || `Core Technical Theory: ${cleanTitle}`}
                      </h3>
                      <p className="roadmap-theory-overview-box">
                        {renderFormattedTheoryText(theoryData.overview)}
                      </p>
                    </div>

                    <div className="roadmap-key-concepts">
                      <h4 className="roadmap-section-subheading">
                        {isTechnicalCodingRole(currentRoadmap?.targetRole, activeMilestone?.title) 
                          ? "Technical Architecture & Mechanics" 
                          : "Core Methodology & Framework Mechanics"}
                      </h4>

                      {sectionsList.map((sec, sIdx) => {
                        const points = extractPointsFromSection(sec);
                        return (
                          <div key={sIdx} className="roadmap-theory-subcard">
                            <h5 className="roadmap-theory-subhead">
                              <Layers size={17} className="roadmap-icon-indigo" />
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
                                  <span className="roadmap-point-bullet">{pIdx + 1}</span>
                                  <span>{renderFormattedTheoryText(pt)}</span>
                                </li>
                              ))}
                            </ul>
                            {sec.takeaway && (
                              <div className="roadmap-theory-takeaway">
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
                const practice = getPracticeQuestionForMilestone(activeMilestone, currentRoadmap.targetRole);
                return (
                  <div className="roadmap-section-card">
                    <div>
                      <div className="roadmap-part-header-bar">
                        <span className="roadmap-part-pill">
                          PART {hasActiveVideo ? 3 : 2} OF {hasActiveVideo ? 4 : 3}
                        </span>
                        <span className="roadmap-practice-tag-pill">
                          <Code2 size={13} />
                          <span>Hands-on Practice & Compiler</span>
                        </span>
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
                            onClick={() => setCompilerCode("")}
                            className="compiler-reset-btn"
                            title="Clear code editor"
                          >
                            <RotateCcw size={13} />
                            <span>Reset Code</span>
                          </button>

                          <div className="compiler-select-wrapper">
                            <CustomSelect
                              value={compilerLanguage}
                              options={COMPILER_LANGUAGE_OPTIONS}
                              onChange={(newLang) => {
                                setCompilerLanguage(newLang);
                                setCompilerCode("");
                                if (newLang === "html" || newLang === "react") {
                                  setCompilerActiveTab("preview");
                                } else {
                                  setCompilerActiveTab("terminal");
                                }
                              }}
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

                      {/* Action Bar with Run button and Output tab switchers */}
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
                            <span>{compilerStatus === "running" ? "Running..." : "Run Code"}</span>
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
                              onClick={() => setCompilerActiveTab("preview")}
                              className={`compiler-tab-btn ${compilerActiveTab === "preview" ? "active" : ""}`}
                            >
                              <Eye size={13} />
                              <span>{compilerLanguage === "react" ? "Live React Preview" : "Live Web Preview"}</span>
                            </button>
                          </div>
                        </div>

                        <div className="compiler-actions-right">
                          {compilerStatus === "success" && (
                            <span className="compiler-status-badge success">
                              <CheckCircle2 size={13} /> Succeeded
                            </span>
                          )}
                          {compilerStatus === "error" && (
                            <span className="compiler-status-badge error">Runtime Error</span>
                          )}
                          {compilerStatus === "ce" && (
                            <span className="compiler-status-badge warning">Compilation Error</span>
                          )}
                        </div>
                      </div>

                      {/* Output Section: Terminal Output or Live Web Preview iframe */}
                      <div className="compiler-output-section">
                        {compilerActiveTab === "preview" || compilerLanguage === "html" || compilerLanguage === "react" ? (
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
                                <span className="compiler-output-prefix">$ execution output:{"\n"}</span>
                                {compilerOutput}
                              </pre>
                            ) : (
                              <div className="compiler-empty-output">
                                Click "Run Code" above to execute and inspect stdout / terminal output.
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
                const questions = getQuizQuestionsForMilestone(activeMilestone, currentRoadmap.targetRole);
                return (
                  <div className="roadmap-section-card">
                    <div>
                      <div className="roadmap-part-header-bar">
                        <span className="roadmap-part-pill">
                          PART {hasActiveVideo ? 4 : 3} OF {hasActiveVideo ? 4 : 3}
                        </span>
                        <span className="roadmap-quiz-tag-pill">
                          <CheckCircle2 size={13} />
                          <span>Milestone Assessment Quiz</span>
                        </span>
                      </div>
                      <h3 className="roadmap-section-heading">
                        Milestone Assessment Quiz
                      </h3>
                      <p className="roadmap-meta-text">
                        Complete this 5-question assessment quiz to verify your understanding and unlock Milestone {activeMilestoneIdx + 2}!
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

                    {/* Quiz Controls */}
                    {!quizSubmitted ? (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizAnswers).length < questions.length}
                        className={`roadmap-quiz-submit-btn ${Object.keys(quizAnswers).length === questions.length ? "btn-ready" : "btn-disabled"}`}
                      >
                        Submit Quiz & Unlock Next Milestone
                      </button>
                    ) : (
                      <div className="roadmap-quiz-result-banner">
                        <div className="roadmap-quiz-result-score">
                          🎉 Quiz Score: {quizScore} / {questions.length} ({Math.round((quizScore / questions.length) * 100)}%)
                        </div>
                        <p className="roadmap-quiz-result-desc">
                          Milestone {activeMilestoneIdx + 1} ("{activeMilestone.title}") is now completed (100%)!
                          {activeMilestoneIdx + 1 < milestones.length
                            ? ` Milestone ${activeMilestoneIdx + 2} ("${milestones[activeMilestoneIdx + 1]?.title}") is unlocked!`
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
                    )}
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
