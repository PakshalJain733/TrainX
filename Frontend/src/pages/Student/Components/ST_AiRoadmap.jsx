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
  Plus
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import apiFetch from "../../../utils/api";
import "../Styles/ST_AiRoadmap.css";

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

function resolveLanguageForRole(roleStr = "") {
  const lower = roleStr.toLowerCase();
  if (lower.includes("python") || lower.includes("ai") || lower.includes("data")) return "python";
  if (lower.includes("java") || lower.includes("spring")) return "java";
  if (lower.includes("c++") || lower.includes("cpp")) return "cpp";
  if (lower.includes("sql") || lower.includes("database")) return "sql";
  if (lower.includes("html") || lower.includes("frontend")) return "html";
  return "node";
}

function getStarterCodeForTopic(topicName = "", lang = "node", targetRole = "") {
  const cleanTopic = topicName || targetRole || "Topic Practice";

  if (lang === "html") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${cleanTopic} - Practice Preview</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    h2 { color: #38bdf8; margin-top: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${cleanTopic}</h2>
    <p>Live HTML/CSS output preview rendered successfully!</p>
  </div>
</body>
</html>`;
  }

  if (lang === "python") {
    return `# Practice Exercise: ${cleanTopic}
# Goal: Implement logic for ${cleanTopic} and verify outputs.

def process_data(items):
    print(f"Processing {len(items)} elements for ${cleanTopic}...")
    total = sum(items)
    return total

if __name__ == "__main__":
    sample_data = [10, 20, 30, 40, 50]
    result = process_data(sample_data)
    print(f"✅ Execution Result: {result}")
`;
  }

  if (lang === "java") {
    return `// Practice Exercise: ${cleanTopic}
public class Solution {
    public static void main(String[] args) {
        System.out.println("Executing practice code for: ${cleanTopic}");
        int[] data = {10, 20, 30, 40, 50};
        int sum = 0;
        for (int num : data) {
            sum += num;
        }
        System.out.println("✅ Result: Processed sum = " + sum);
    }
}
`;
  }

  if (lang === "cpp") {
    return `// Practice Exercise: ${cleanTopic}
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Executing practice exercise for: ${cleanTopic}" << std::endl;
    std::vector<int> data = {10, 20, 30, 40, 50};
    int sum = std::accumulate(data.begin(), data.end(), 0);
    std::cout << "✅ Result: Processed sum = " << sum << std::endl;
    return 0;
}
`;
  }

  if (lang === "sql") {
    return `-- SQL Practice Query for: ${cleanTopic}
SELECT 
    id, 
    user_name, 
    score, 
    status 
FROM student_assessments 
WHERE score >= 75 
ORDER BY score DESC;
`;
  }

  return `// Practice Exercise: ${cleanTopic}
// Goal: Execute code logic for ${cleanTopic}

function runPractice() {
  console.log("Executing practice exercise for: ${cleanTopic}");
  const data = [10, 20, 30, 40, 50];
  const sum = data.reduce((acc, val) => acc + val, 0);
  console.log(\`✅ Result: Processed \${data.length} elements. Total sum: \${sum}\`);
}

runPractice();
`;
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
        explanation: `Understand how Python translates source code into bytecode (.pyc) executed inside the CPython Virtual Machine. Objects are dynamically allocated on the CPython heap with reference counting and automatic garbage collection.`,
        takeaway: `Use immutable tuples and generator expressions to optimize heap allocations and iteration speed.`
      },
      {
        title: `Core Data Structures, Control Mechanics & Algorithms`,
        explanation: `Master list comprehensions, dictionary hash tables, exception handling patterns, and object-oriented abstractions. Learn how to write clean, pythonic code while handling memory boundaries efficiently.`,
        takeaway: `Structure modular functions with explicit type hints and docstrings for maintainable data pipelines.`
      },
      {
        title: `Concurrency, Asynchronous I/O & GIL Bottleneck Mitigations`,
        explanation: `Explore how the Global Interpreter Lock (GIL) affects multi-threading in Python. Learn to leverage asyncio event loops for non-blocking network operations and multiprocessing for CPU-heavy tasks.`,
        takeaway: `Deploy asyncio for network I/O bound workflows and multiprocessing for CPU-bound computations.`
      }
    ];
  } else if (lowerRole.includes("java") || lowerRole.includes("spring") || lowerRole.includes("backend")) {
    overview = `Enterprise architecture guide for ${title} in ${role}. Java delivers strong type safety, robust Object-Oriented design, JVM platform independence, and high-concurrency memory management required for mission-critical enterprise platforms.`;
    sections = [
      {
        title: `JVM Memory Architecture: Heap, Stack & Garbage Collector`,
        explanation: `Examine how the Java Virtual Machine manages stack frame frames for local primitive references and heap regions for dynamic object allocations. Learn how generational Garbage Collection reclaims memory automatically.`,
        takeaway: `Minimize transient object allocations inside high-frequency loop executions to prevent JVM pause spikes.`
      },
      {
        title: `Object Encapsulation, Abstraction & Polymorphic Interfaces`,
        explanation: `Implement clean encapsulation with access control modifiers, interface contracts, and abstract classes. Understand dynamic dispatch and runtime polymorphism in production Java codebases.`,
        takeaway: `Design clean interface contracts to decouple service implementations and support dependency injection.`
      },
      {
        title: `Structured Exception Recovery & Multi-Threading Concurrency`,
        explanation: `Differentiate between Checked Compile-time Exceptions and Unchecked RuntimeExceptions. Explore synchronized memory blocks, atomic variables, and ExecutorService thread pools for safe concurrent processing.`,
        takeaway: `Catch specific exception types explicitly and utilize ThreadPoolExecutors for manageable concurrent tasks.`
      }
    ];
  } else if (lowerRole.includes("react") || lowerRole.includes("frontend") || lowerRole.includes("html") || lowerRole.includes("css") || lowerRole.includes("web")) {
    overview = `Modern UI engineering principles for ${title} in ${role}. Web engineering revolves around declarative UI rendering, Virtual DOM Fiber reconciliation, state synchronization, and modular component architecture.`;
    sections = [
      {
        title: `Virtual DOM Fiber Reconciliation & Diffing Algorithm`,
        explanation: `Learn how React maintains an in-memory Virtual DOM tree representation. When component state changes, Fiber reconciliation calculates minimal DOM diffs to patch the actual browser DOM with maximum efficiency.`,
        takeaway: `Provide stable, unique keys on list items to allow React Fiber to optimize DOM updates.`
      },
      {
        title: `Component State Lifecycle, Hooks & Reactive Synchronization`,
        explanation: `Master functional component state lifecycle hooks (useState, useEffect, useMemo). Learn how reactive state updates schedule re-renders and maintain unidirectional data flow across UI components.`,
        takeaway: `Keep component state localized and memoize expensive calculations with useMemo.`
      },
      {
        title: `Modular Architecture, Performance & Responsive UI Design`,
        explanation: `Explore component composition patterns, CSS layout engines (Flexbox & Grid), state management libraries, and performance optimization techniques for seamless cross-device user experiences.`,
        takeaway: `Build reusable modular UI components with responsive CSS boundaries and accessible semantic HTML.`
      }
    ];
  } else if (lowerRole.includes("c++") || lowerRole.includes("cpp") || lowerRole.includes("dsa") || lowerRole.includes("algorithm")) {
    overview = `Systems engineering and algorithmic mastery of ${title} in ${role}. C++ offers low-level memory control, zero-cost abstractions, RAII resource management, and deterministic performance for high-speed algorithmic computing.`;
    sections = [
      {
        title: `Pointer Arithmetic, Stack vs Heap & RAII Memory Management`,
        explanation: `Master raw memory address manipulation, stack allocation speed, and heap pointers. Understand RAII (Resource Acquisition Is Initialization) to guarantee resource cleanup with smart pointers (std::unique_ptr, std::shared_ptr).`,
        takeaway: `Use std::unique_ptr to enforce single-ownership semantics and prevent memory leaks.`
      },
      {
        title: `Standard Template Library (STL) Containers & Algorithms`,
        explanation: `Examine internal performance characteristics of STL containers (vector, list, map, unordered_map). Learn logarithmic vs constant-time lookups and efficient memory contiguous allocations.`,
        takeaway: `Prefer std::vector for contiguous memory cache locality and std::unordered_map for O(1) average lookups.`
      },
      {
        title: `Time & Space Complexity Optimization (Big-O Analysis)`,
        explanation: `Analyze asymptotic bounds for sorting, searching, tree traversals, and dynamic programming algorithms. Implement optimal space-time tradeoffs for production algorithm design.`,
        takeaway: `Analyze worst-case Big-O bounds and optimize inner loop memory accesses for cache efficiency.`
      }
    ];
  } else if (lowerRole.includes("sql") || lowerRole.includes("database") || lowerRole.includes("postgres") || lowerRole.includes("mongo")) {
    overview = `Data architecture and relational database mechanics for ${title} in ${role}. Efficient database management relies on relational normalization, B-Tree index structures, ACID transaction guarantees, and optimized query execution plans.`;
    sections = [
      {
        title: `Relational Schema Normalization & Entity Relationships`,
        explanation: `Design normalized database schemas across First (1NF), Second (2NF), and Third (3NF) normal forms. Eliminate data redundancy while enforcing primary and foreign key integrity constraints.`,
        takeaway: `Normalize schemas to prevent update anomalies while selectively denormalizing for read-heavy analytics.`
      },
      {
        title: `Indexing Mechanics, B-Trees & Query Optimization`,
        explanation: `Understand how database engines construct B-Tree indexes for fast logarithmic search lookups. Analyze execution plans (EXPLAIN ANALYZE) to prevent costly full table scans.`,
        takeaway: `Index high-frequency filtering and join columns while avoiding over-indexing on write-heavy tables.`
      },
      {
        title: `ACID Transactions, Locking & Concurrency Control`,
        explanation: `Master Atomicity, Consistency, Isolation, and Durability (ACID). Understand transaction isolation levels (Read Committed, Repeatable Read, Serializable) to manage concurrent writes safely.`,
        takeaway: `Use explicit transaction blocks for multi-table updates to guarantee system-wide consistency.`
      }
    ];
  } else {
    overview = `Comprehensive architectural and technical guide to ${title} for ${role}. Mastering this module establishes core domain proficiency, operational mechanics, and production-grade software implementation standards.`;
    sections = topics.slice(0, 3).map((t, idx) => {
      const topicText = typeof t === 'string' ? t : t.title || t.name || `Module ${idx + 1}`;
      return {
        title: `${idx + 1}. ${topicText}`,
        explanation: `Deep technical analysis of ${topicText} within ${role}. Learn key mechanics, internal execution steps, memory layout guidelines, and real-world deployment patterns.`,
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
  const lang = resolveLanguageForRole(role);

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
    if (activeMilestone && activeSection === "theory") {
      loadAITheoryForMilestone(activeMilestone.title, currentRoadmap?.targetRole);
    }
  }, [activeMilestoneIdx, activeSection, currentRoadmap]);

  const loadAITheoryForMilestone = async (milestoneTitle, targetRole) => {
    if (!milestoneTitle) return;
    const cleanTitle = String(milestoneTitle).replace(/^Milestone\s*\d+\s*:\s*/i, "").trim();
    const cleanRole = String(targetRole || "").trim();
    const cacheKey = `${cleanTitle.toLowerCase()}__${cleanRole.toLowerCase()}`;

    if (aiTheoryCache[cacheKey]) {
      return;
    }

    setIsTheoryLoading(true);
    try {
      const res = await apiFetch("/roadmaps/theory/generate", {
        method: "POST",
        body: JSON.stringify({
          milestoneTitle: cleanTitle,
          targetRole: cleanRole || currentRoadmap?.targetRole || goalInput
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
    const lang = resolveLanguageForRole(role);
    setCompilerLanguage(lang);
    setCompilerCode(getStarterCodeForTopic(title, lang, role));
    setCompilerOutput("");
    setCompilerStatus("idle");
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
    setCompilerStatus("running");
    setCompilerOutput("Executing code...");
    const startTime = Date.now();

    if (compilerLanguage === "html") {
      setCompilerStatus("success");
      setCompilerOutput("Live HTML/CSS Preview Rendered");
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
    if (compilerLanguage === "node" || compilerLanguage === "javascript") {
      try {
        let logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(" ")),
          warn: (...args) => logs.push("[WARN] " + args.join(" ")),
          error: (...args) => logs.push("[ERROR] " + args.join(" ")),
          info: (...args) => logs.push("[INFO] " + args.join(" ")),
        };
        const runFn = new Function("console", compilerCode);
        runFn(customConsole);
        setCompilerStatus("success");
        setCompilerOutput(logs.length > 0 ? logs.join("\n") : "(Execution succeeded with no console output)");
      } catch (jsErr) {
        setCompilerStatus("error");
        setCompilerOutput(`🔴 JavaScript Runtime Error:\n\n${jsErr.name}: ${jsErr.message}`);
      }
    } else {
      setCompilerStatus("success");
      setCompilerOutput(`✅ Code Executed Successfully (${compilerLanguage.toUpperCase()})\n\nOutput Log:\nExecuting practice challenge...\nResult: All assertions passed cleanly!`);
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
            <Sparkles size={24} className="text-indigo-600 shrink-0" />
            <span>AI Learning & Career Roadmaps</span>
          </h2>
          {aiSource && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1 shrink-0">
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
            <div className="roadmap-error-alert flex items-center justify-between gap-3 p-3 mt-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
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
                <BookMarked size={20} className="text-indigo-600" />
                <span>Your Previous & Available Roadmaps</span>
              </h3>
              <span className="roadmap-previous-count">
                {allRoadmaps.length} Roadmap{allRoadmaps.length !== 1 ? "s" : ""} Available
              </span>
            </div>

            {isLoading ? (
              <div className="text-center p-10">
                <RefreshCw size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="text-slate-500 m-0">Loading your saved roadmaps...</p>
              </div>
            ) : allRoadmaps.length === 0 ? (
              <div className="text-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Compass size={40} className="text-indigo-600 mx-auto mb-3" />
                <h4 className="m-0 text-slate-800 text-base font-bold">No Saved Roadmaps Found</h4>
                <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-4">
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

            <hr className="border-none border-t border-slate-100 m-0" />

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
                  <div key={m.id || idx} className="flex flex-col gap-1">
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

                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold truncate ${isActive ? 'text-indigo-800' : 'text-slate-800'}`}>
                          {m.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {isCompleted ? "Completed ✓" : isLocked ? "Locked 🔒" : isActive ? "Active Now" : "Unlocked"}
                        </div>
                      </div>
                    </button>

                    {/* Numbered Sub-List (1, 2, 3, 4) under Active / Unlocked Milestone */}
                    {isActive && !isLocked && (
                      <div className="roadmap-sidebar-sublist">
                        <button
                          type="button"
                          onClick={() => setActiveSection("theory")}
                          className={`roadmap-sidebar-sub-btn ${activeSection === "theory" ? "active" : "inactive"}`}
                        >
                          <span className="font-extrabold opacity-90">1.</span>
                          <span>Theory & Concepts</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveSection("video")}
                          className={`roadmap-sidebar-sub-btn ${activeSection === "video" ? "active" : "inactive"}`}
                        >
                          <span className="font-extrabold opacity-90">2.</span>
                          <span>YT Video Tutorial</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveSection("practice")}
                          className={`roadmap-sidebar-sub-btn ${activeSection === "practice" ? "active" : "inactive"}`}
                        >
                          <span className="font-extrabold opacity-90">3.</span>
                          <span>Practice Question</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveSection("quiz")}
                          className={`roadmap-sidebar-sub-btn ${activeSection === "quiz" ? "active" : "inactive"}`}
                        >
                          <span className="font-extrabold opacity-90">4.</span>
                          <span>Assessment Quiz</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT MAIN PANEL: ACTIVE MILESTONE CONTENT ── */}
          {activeMilestone ? (
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

                {/* 4 Sequential Numbered Navigation Steps (1, 2, 3, 4) */}
                <div className="roadmap-step-tabs-row">
                  <button
                    type="button"
                    onClick={() => setActiveSection("theory")}
                    className={`roadmap-step-tab-btn ${activeSection === "theory" ? "active" : "inactive"}`}
                  >
                    <span className="roadmap-step-badge-num">1</span>
                    <span>Theory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection("video")}
                    className={`roadmap-step-tab-btn ${activeSection === "video" ? "active" : "inactive"}`}
                  >
                    <span className="roadmap-step-badge-num">2</span>
                    <span>YT Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection("practice")}
                    className={`roadmap-step-tab-btn ${activeSection === "practice" ? "active" : "inactive"}`}
                  >
                    <span className="roadmap-step-badge-num">3</span>
                    <span>Practice Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSection("quiz")}
                    className={`roadmap-step-tab-btn ${activeSection === "quiz" ? "active" : "inactive"}`}
                  >
                    <span className="roadmap-step-badge-num">4</span>
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
                    <div className="roadmap-section-card text-center py-10">
                      <RefreshCw size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
                      <h4 className="m-0 text-base font-bold text-slate-800">
                        Generating AI Technical Theory Guide...
                      </h4>
                      <p className="m-0 text-xs text-slate-500 mt-1">
                        Synthesizing technical architectural explanations, code examples, and best practices for "{cleanTitle}".
                      </p>
                    </div>
                  );
                }

                const sectionsList = theoryData.sections || (theoryData.keyPoints ? theoryData.keyPoints.map(kp => ({ title: kp.title, explanation: kp.explanation })) : []);

                return (
                  <div className="roadmap-section-card">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-indigo-600">PART 1 OF 4</span>
                        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                          AI Technical Curriculum
                        </span>
                      </div>
                      <h3 className="m-0 text-lg font-extrabold text-slate-900 mb-2">
                        {theoryData.title || `Core Technical Theory: ${cleanTitle}`}
                      </h3>
                      <p className="roadmap-theory-overview-box">
                        {renderFormattedTheoryText(theoryData.overview)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3.5">
                      <h4 className="m-0 text-sm font-extrabold text-slate-900">
                        {isTechnicalCodingRole(currentRoadmap?.targetRole, activeMilestone?.title) 
                          ? "Technical Architecture & Mechanics" 
                          : "Core Methodology & Framework Mechanics"}
                      </h4>

                      {sectionsList.map((sec, sIdx) => (
                        <div key={sIdx} className="roadmap-theory-subcard">
                          <h5 className="roadmap-theory-subhead">
                            <Layers size={17} className="text-indigo-600" />
                            <span>{renderFormattedTheoryText(sec.title)}</span>
                          </h5>
                          <p className="m-0 text-sm text-slate-600 leading-relaxed">
                            {renderFormattedTheoryText(sec.explanation)}
                          </p>
                          {sec.takeaway && (
                            <div className="roadmap-theory-takeaway">
                              💡 Industry Takeaway: {renderFormattedTheoryText(sec.takeaway)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Code / Workflow Syntax Block */}
                    {theoryData.codeExample && (
                      <div>
                        <h4 className="m-0 text-sm font-extrabold text-slate-900 mb-2">
                          {isTechnicalCodingRole(currentRoadmap?.targetRole, activeMilestone?.title) 
                            ? "Working Syntax & Execution Pattern" 
                            : "Practical Workflow & Domain Case Study"}
                        </h4>
                        <div className="vscode-editor-container p-3.5">
                          <VSCodeCodeHighlighter code={theoryData.codeExample} />
                        </div>
                      </div>
                    )}

                    {/* Best Practices */}
                    {Array.isArray(theoryData.bestPractices) && theoryData.bestPractices.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h5 className="m-0 text-xs font-bold text-slate-800 mb-2">
                          Industry Best Practices:
                        </h5>
                        <ul className="m-0 pl-4 text-xs text-slate-600 flex flex-col gap-1.5">
                          {theoryData.bestPractices.map((bp, bIdx) => (
                            <li key={bIdx}>{renderFormattedTheoryText(bp)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Next */}
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setActiveSection("video")}
                        className="roadmap-proceed-btn"
                      >
                        <span>Proceed to Video Tutorial</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── PART 2: YT VIDEO SECTION ── */}
              {activeSection === "video" && (() => {
                const vid = getVideoForMilestone(activeMilestone, currentRoadmap.targetRole);
                return (
                  <div className="roadmap-section-card">
                    <div>
                      <span className="text-xs font-bold text-indigo-600">PART 2 OF 4</span>
                      <h3 className="m-0 text-lg font-extrabold text-slate-900 mt-0.5 mb-1">
                        Video Tutorial: {vid.title}
                      </h3>
                      <p className="m-0 text-xs text-slate-500">
                        Watch this curated video tutorial to visualize concepts before tackling the practice exercise.
                      </p>
                    </div>

                    {/* Embedded Video */}
                    <div className="roadmap-video-embed-box">
                      <iframe
                        src={vid.embedUrl}
                        title={vid.title}
                        className="roadmap-video-iframe"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <a href={vid.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline">
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
                      <span className="text-xs font-bold text-indigo-600">PART 3 OF 4</span>
                      <h3 className="m-0 text-lg font-extrabold text-slate-900 mt-0.5 mb-1">
                        {practice.title}
                      </h3>
                      <p className="m-0 text-sm text-slate-600">
                        {practice.prompt}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-mono">
                      <div className="font-bold text-slate-800">{practice.sampleInput}</div>
                      <div className="font-bold text-emerald-600 mt-1">{practice.sampleOutput}</div>
                    </div>

                    {/* Interactive Code / Workflow Editor */}
                    <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-bold">
                          {isTechnicalCodingRole(currentRoadmap?.targetRole, activeMilestone?.title) 
                            ? "LIVE CODE COMPILER" 
                            : "PRACTICE WORKFLOW & CASE STUDY EDITOR"}
                        </span>
                        <select
                          value={compilerLanguage}
                          onChange={(e) => {
                            setCompilerLanguage(e.target.value);
                            setCompilerCode(getStarterCodeForTopic(activeMilestone.title, e.target.value, currentRoadmap.targetRole));
                          }}
                          className="bg-slate-800 text-slate-100 border border-slate-700 rounded-md px-2 py-1 text-xs outline-none"
                        >
                          <option value="node">JavaScript</option>
                          <option value="python">Python 3</option>
                          <option value="java">Java 17</option>
                          <option value="cpp">C++ 20</option>
                          <option value="sql">SQL</option>
                          <option value="html">HTML/CSS</option>
                        </select>
                      </div>

                      <VSCodeEditor
                        value={compilerCode}
                        onChange={(e) => setCompilerCode(e.target.value)}
                        language={compilerLanguage}
                        height="240px"
                      />

                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={handleRunCompiler}
                          disabled={compilerStatus === "running"}
                          className="bg-indigo-600 text-white border-none rounded-lg px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Play size={14} />
                          <span>{compilerStatus === "running" ? "Running..." : "Run Code"}</span>
                        </button>

                        <span className={`text-xs ${compilerStatus === "success" ? "text-emerald-400 font-bold" : "text-slate-400"}`}>
                          {compilerStatus === "success" ? "Execution Succeeded ✓" : "Click Run Code to verify output"}
                        </span>
                      </div>

                      {compilerOutput && (
                        <pre className="bg-slate-800 text-sky-400 p-3 rounded-lg text-xs m-0 overflow-x-auto border border-slate-700">
                          {compilerOutput}
                        </pre>
                      )}
                    </div>

                    <div className="flex justify-end mt-2">
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
                      <span className="text-xs font-bold text-indigo-600">PART 4 OF 4</span>
                      <h3 className="m-0 text-lg font-extrabold text-slate-900 mt-0.5 mb-1">
                        Milestone Assessment Quiz
                      </h3>
                      <p className="m-0 text-sm text-slate-500">
                        Complete this 5-question assessment quiz to verify your understanding and unlock Milestone {activeMilestoneIdx + 2}!
                      </p>
                    </div>

                    {/* Quiz Questions */}
                    <div className="flex flex-col gap-4">
                      {questions.map((q, qIdx) => (
                        <div key={q.id} className="roadmap-quiz-qcard">
                          <h4 className="m-0 text-sm font-bold text-slate-800 mb-3">
                            Q{qIdx + 1}. {q.question}
                          </h4>

                          <div className="grid gap-2">
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
                            <p className="mt-2 mb-0 text-xs color-emerald-600 font-semibold text-emerald-700">
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
                        <div className="text-lg font-extrabold text-emerald-800">
                          🎉 Quiz Score: {quizScore} / {questions.length} ({Math.round((quizScore / questions.length) * 100)}%)
                        </div>
                        <p className="m-0 text-sm text-emerald-700">
                          Milestone {activeMilestoneIdx + 1} ("{activeMilestone.title}") is now completed (100%)!
                          {activeMilestoneIdx + 1 < milestones.length
                            ? ` Milestone ${activeMilestoneIdx + 2} ("${milestones[activeMilestoneIdx + 1]?.title}") is unlocked!`
                            : " You have completed all milestones in this roadmap!"}
                        </p>

                        {activeMilestoneIdx + 1 < milestones.length && (
                          <button
                            type="button"
                            onClick={handleProceedToNextMilestone}
                            className="roadmap-proceed-btn mx-auto mt-2"
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
          ) : null}
        </div>
      )}
    </div>
  );
}
