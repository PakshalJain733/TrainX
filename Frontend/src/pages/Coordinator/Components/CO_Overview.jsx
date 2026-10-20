import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, GraduationCap, UserCheck, LineChart, AlertTriangle, CheckCircle, Sparkles, LayoutDashboard, Info, ChevronRight, ChevronLeft, Calendar, Activity, Clock, User, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import CustomSelect from "../../../components/ui/CustomSelect";
import { apiFetch } from "../../../utils/api";
import { getShortDept } from "../../../utils/departmentHelper";
import "../Styles/CO_Overview.css";

const DEFAULT_TRAINING_SESSIONS = [];

const categories = [
  { id: "general", label: "General Notice", icon: Info },
  { id: "urgent", label: "Urgent Alert", icon: AlertTriangle },
  { id: "academic", label: "Schedule Change", icon: Clock },
];

export default function CoordinatorOverview() {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("general");
  const [targetAudience, setTargetAudience] = useState("all");
  const [broadcastSent, setBroadcastSent] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const targetAudienceOptions = [
    { value: "all", label: "All CSE Batches & Enrolled Students" },
    { value: "cse26", label: "CSE 2026 Alpha Batch" },
    { value: "fs", label: "Fullstack React & Node Specialization" },
    { value: "ds", label: "Data Science & AI/ML 2025" },
  ];

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    try {
      await apiFetch("/coordinator/broadcasts", {
        method: "POST",
        body: JSON.stringify({
          message: broadcastMsg,
          category: noticeCategory,
          targetAudience,
        }),
      }).catch(() => null);
      setBroadcastSent(true);
      setBroadcastMsg("");
      setTimeout(() => setBroadcastSent(false), 3500);
    } catch (err) {
      console.error("Broadcast error:", err);
    }
  };

  const [coordUser, setCoordUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
    } catch (_) {
      return {};
    }
  });

  const [liveBatches, setLiveBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [mentorCount, setMentorCount] = useState(0);
  const [liveSessions, setLiveSessions] = useState([]);
  const [highRiskStudents, setHighRiskStudents] = useState([]);
  const [attendanceRate, setAttendanceRate] = useState("0%");

  // Deterministic day-of-year offset for realistic syllabus progression per date
  const getDayOffset = (dateStr) => {
    if (!dateStr) return 0;
    const parts = dateStr.split("-").map(Number);
    const target = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    const start = new Date(parts[0], 0, 1);
    const diff = Math.floor((target - start) / (24 * 60 * 60 * 1000));
    return isNaN(diff) ? 0 : Math.abs(diff);
  };

  // Formatted date label for badge and display
  const getDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    const target = new Date(y, (m || 1) - 1, d || 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (24 * 60 * 60 * 1000));
    const formatted = target.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (diffDays === 0) return `Today, ${formatted}`;
    if (diffDays === 1) return `Tomorrow, ${formatted}`;
    if (diffDays === -1) return `Yesterday, ${formatted}`;
    return target.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const isTodayDate = (dateStr) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return dateStr === `${yyyy}-${mm}-${dd}`;
  };

  const handleDateStep = (days) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const current = new Date(y, (m || 1) - 1, d || 1);
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleResetToToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Curriculum topic generator based on batch specialty & selected date
  const getDynamicTopicForBatch = (batchName = "", dateStr = "") => {
    const bName = String(batchName).toLowerCase();
    const offset = getDayOffset(dateStr);

    if (bName.includes("python") || bName.includes("py")) {
      const pythonSyllabus = [
        { topic: "Python OOP & Design Patterns", detail: "Classes, multiple inheritance, dunder methods, metaclasses, and property decorators." },
        { topic: "Asynchronous Python & AsyncIO", detail: "Event loops, coroutines, non-blocking I/O, TaskGroup, and concurrent network requests." },
        { topic: "FastAPI REST API Architecture", detail: "Pydantic validation schemas, dependency injection, async endpoints, and Swagger OpenAPI." },
        { topic: "Data Manipulation with Pandas & NumPy", detail: "Vectorized arrays, multi-index DataFrames, handling missing values, and aggregation." },
        { topic: "Data Visualization & Dashboards", detail: "Matplotlib, Seaborn heatmaps, statistical charts, and executive reporting visualizations." },
        { topic: "Web Scraping & DOM Automation", detail: "BeautifulSoup4, Playwright headless browser control, rate limiting, and regex parsing." },
        { topic: "Database Architecture with SQLAlchemy", detail: "Declarative models, relationship joins, eager loading, transactions, and Alembic migrations." },
        { topic: "Testing & TDD with PyTest", detail: "Parametrized test fixtures, mocking external APIs, coverage analysis, and CI assertions." },
        { topic: "Machine Learning with Scikit-Learn", detail: "Supervised pipelines, feature scaling, model hyperparameter tuning, and ROC-AUC metrics." },
        { topic: "Advanced Python Algorithms", detail: "Dynamic programming in Python, memoization LRU cache, heap queues, and bisect search." },
        { topic: "Python Packaging & Dockerization", detail: "Poetry/Pipenv packaging, multi-stage Docker builds, production WSGI/Uvicorn runtime." },
        { topic: "Microservices & Message Queues", detail: "Celery task queues, Redis pub/sub brokers, distributed async workers, and monitoring." }
      ];
      return pythonSyllabus[offset % pythonSyllabus.length];
    }

    if (bName.includes("java") || bName.includes("spring")) {
      const javaSyllabus = [
        { topic: "Java Collections & Memory Internals", detail: "Internal mechanics of HashMap, ConcurrentHashMap, garbage collection, and custom generics." },
        { topic: "Multithreading & Concurrency in Java", detail: "ExecutorService, CompletableFuture pipelines, virtual threads, and synchronized locks." },
        { topic: "Spring Boot Core & IoC Container", detail: "Dependency injection, Bean lifecycle callbacks, profile configurations, and custom annotations." },
        { topic: "Spring Data JPA & Hibernate Optimization", detail: "Entity relationships, solving N+1 queries, Criteria API, and pessimistic/optimistic locking." },
        { topic: "REST API Design & Validation", detail: "Controller advice, custom exception handlers, DTO mappings, and OpenAPI documentation." },
        { topic: "Spring Security & JWT Authentication", detail: "Filter chains, stateless token auth, role-based method security, and bcrypt hashing." },
        { topic: "Microservices with Spring Cloud", detail: "Eureka service discovery, Spring Cloud Gateway routing, Resilience4j circuit breakers." },
        { topic: "Event-Driven Java with Apache Kafka", detail: "KafkaTemplate producers, consumer groups, partition balancing, and dead letter topics." },
        { topic: "Unit & Integration Testing with Mockito", detail: "JUnit 5 assertions, @MockBean injections, MockMvc endpoint testing, and Testcontainers." },
        { topic: "JVM Performance Tuning & Profiling", detail: "JProfiler analysis, heap dump diagnosis, garbage collection algorithms, and JVM flags." },
        { topic: "Reactive Programming with Spring WebFlux", detail: "Project Reactor, Mono/Flux publishers, backpressure handling, and reactive databases." },
        { topic: "Cloud Native Java & Docker Deployment", detail: "Containerizing Spring apps, GraalVM native images, health actuators, and K8s manifests." }
      ];
      return javaSyllabus[offset % javaSyllabus.length];
    }

    if (bName.includes("react") || bName.includes("node") || bName.includes("full") || bName.includes("web") || bName.includes("fs")) {
      const webSyllabus = [
        { topic: "Modern React & Component Architecture", detail: "Custom hooks, state management, render optimizations, and component composition." },
        { topic: "Next.js & Server-Side Rendering (SSR)", detail: "App router, server actions, streaming, static site generation, and SEO optimization." },
        { topic: "Node.js Architecture & Event Loop", detail: "Worker threads, streams, asynchronous non-blocking I/O, and clustering performance." },
        { topic: "REST & GraphQL API Architecture", detail: "API endpoint versioning, rate limiting, GraphQL schemas, queries, and mutations." },
        { topic: "State Management with Zustand & Redux", detail: "Global state slices, selectors, immutability, and middleware integration." },
        { topic: "WebSockets & Real-Time Communication", detail: "Socket.io rooms, bi-directional event emission, heartbeat pings, and reconnection." },
        { topic: "Database Design & SQL Optimization", detail: "Indexing strategies, query execution plans, transactions, and relational schema normalization." },
        { topic: "Web Security & Authentication", detail: "OAuth 2.0, JWT tokens, CSRF protection, Content Security Policy, and sanitized inputs." },
        { topic: "Testing with Jest, RTL & Playwright", detail: "Unit testing components, integration mock servers, and end-to-end browser flows." },
        { topic: "Docker, CI/CD & Cloud Deployment", detail: "GitHub Actions CI/CD pipelines, containerized deployments, and cloud environment configs." }
      ];
      return webSyllabus[offset % webSyllabus.length];
    }

    // Default: DSA & System Architecture Syllabus (Batch A, etc.)
    const dsaSyllabus = [
      { topic: "DSA: Two Pointers & Sliding Window", detail: "Variable & fixed window techniques, prefix sums, and two-pointer interview patterns." },
      { topic: "DSA: Fast & Slow Pointers & Linked Lists", detail: "Cycle detection, linked list reversal in groups, palindrome lists, and LRU cache." },
      { topic: "DSA: Binary Search & Divide and Conquer", detail: "Rotated array search, boundary condition heuristics, search on answer space, and matrices." },
      { topic: "DSA: Stacks, Queues & Monotonic Sequences", detail: "Next greater element, largest rectangle in histogram, sliding window maximum." },
      { topic: "DSA: Binary Trees & Lowest Common Ancestor", detail: "Level order traversals, tree construction, path sums, LCA, and Morris in-order traversal." },
      { topic: "DSA: Heap & Priority Queue Patterns", detail: "Kth largest elements, median finder in data streams, and task scheduler algorithms." },
      { topic: "DSA: Graphs - BFS, DFS & Cycle Detection", detail: "Topological sorting, Kahn's algorithm, bipartite testing, and strongly connected components." },
      { topic: "DSA: Shortest Path - Dijkstra & Bellman-Ford", detail: "Weighted graph shortest paths, priority queue relaxation, and negative cycle detection." },
      { topic: "DSA: Dynamic Programming - 1D Memoization", detail: "State space formulation, memoized recursion, iterative tabulation, and coin change." },
      { topic: "DSA: Dynamic Programming - 2D & Knapsack", detail: "0/1 Knapsack, longest common subsequence, edit distance, and matrix chain multiplication." },
      { topic: "System Architecture: Caching & Rate Limiting", detail: "Redis distributed caching, cache stampede mitigation, token bucket, and sliding logs." },
      { topic: "System Architecture: Scalability & DB Sharding", detail: "Horizontal scaling, load balancing algorithms, database partitioning, and replication." }
    ];
    return dsaSyllabus[offset % dsaSyllabus.length];
  };

  const coordDept = coordUser?.department || coordUser?.dept || coordUser?.departmentName || "";

  useEffect(() => {
    // 1. Fetch Logged-in User Profile from MySQL DB
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          setCoordUser(res.data);
          try {
            sessionStorage.setItem("user", JSON.stringify(res.data));
          } catch (_) {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // 2. Fetch Enrolled Department Students from DB & compute defaulters / avg attendance
    const queryParam = coordDept ? `?department=${encodeURIComponent(coordDept)}` : "";
    apiFetch(`/coordinator/students${queryParam}`)
      .then((res) => {
        const studentList = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(studentList)) {
          const isDeptMatch = (deptA, deptB) => {
            if (!deptA || !deptB) return false;
            const a = String(deptA).toLowerCase().trim();
            const b = String(deptB).toLowerCase().trim();
            if (a === b || a.includes(b) || b.includes(a)) return true;
            const acronyms = {
              cs: ["computer", "comp", "cse", "ce"],
              ce: ["computer", "comp", "cse", "cs"],
              it: ["information technology", "info tech"],
              aids: ["artificial intelligence", "data science", "ai&ds", "ai-ds", "ai/ds"],
              ecs: ["electronics & computer", "electronics and computer"],
              extc: ["electronics and telecommunication", "telecommunication"],
              mech: ["mechanical"],
            };
            for (const [code, aliases] of Object.entries(acronyms)) {
              const aMatches = a === code || aliases.some((al) => a.includes(al));
              const bMatches = b === code || aliases.some((al) => b.includes(al));
              if (aMatches && bMatches) return true;
            }
            return false;
          };

          const filteredList = coordDept
            ? studentList.filter((s) => !s.department || isDeptMatch(s.department, coordDept))
            : studentList;

          setStudents(filteredList);
          setStudentCount(filteredList.length);

          // Calculate department average attendance from DB records
          if (filteredList.length > 0) {
            const totalAtt = filteredList.reduce((sum, s) => {
              const val = Number(s.attendance ?? s.attendance_rate ?? s.studentProfile?.attendance ?? 0);
              return sum + (isNaN(val) ? 0 : val);
            }, 0);
            setAttendanceRate(`${Math.round(totalAtt / filteredList.length)}%`);
          } else {
            setAttendanceRate("0%");
          }

          // Filter high risk students from DB records (<75% attendance or high risk status)
          const flagged = filteredList.filter((s) => {
            const att = Number(s.attendance ?? s.attendance_rate ?? s.studentProfile?.attendance ?? 100);
            const risk = String(s.riskStatus || s.risk_level || s.risk_status || "");
            return att < 75 || risk.toLowerCase().includes("high");
          });
          setHighRiskStudents(flagged);
        }
      })
      .catch(() => {
        setStudentCount(0);
        setAttendanceRate("0%");
      });
  }, [coordDept]);

  useEffect(() => {
    // 3. Fetch Department Assigned Mentors from MySQL DB
    apiFetch("/coordinator/mentors")
      .then((res) => {
        const mentorList = res?.data || (Array.isArray(res) ? res : []);
        setMentorCount(mentorList.length);
      })
      .catch(() => {
        apiFetch("/mentors")
          .then((res) => {
            const list = res?.data || (Array.isArray(res) ? res : []);
            setMentorCount(list.length);
          })
          .catch(() => setMentorCount(0));
      });
  }, []);

  // Fetch batches & dynamic sessions whenever selectedDate changes
  useEffect(() => {
    let isCancelled = false;

    const fetchSessionsForDate = async () => {
      try {
        const [batchRes, liveRes] = await Promise.all([
          apiFetch(`/batches?date=${selectedDate}`).catch(() => null),
          apiFetch(`/coordinator/live-sessions?date=${selectedDate}`).catch(() => null),
        ]);

        if (isCancelled) return;

        const batchList = batchRes?.data || (Array.isArray(batchRes) ? batchRes : []);
        const liveList = liveRes?.data?.sessions || liveRes?.data || (Array.isArray(liveRes) ? liveRes : []);

        if (Array.isArray(batchList)) {
          setLiveBatches(batchList);

          const activeBatches = batchList.filter((b) => String(b.status).toLowerCase() !== "inactive");
          if (activeBatches.length > 0) {
            const isToday = isTodayDate(selectedDate);
            const [y, m, d] = selectedDate.split("-").map(Number);
            const selectedDateTime = new Date(y, (m || 1) - 1, d || 1).setHours(0, 0, 0, 0);
            const todayDateTime = new Date().setHours(0, 0, 0, 0);
            const isPast = selectedDateTime < todayDateTime;

            const mappedSessions = activeBatches.map((b) => {
              // Check if there is an explicit live session for this batch on this date
              const matchedLive = Array.isArray(liveList)
                ? liveList.find(
                    (ls) =>
                      ls.batch === b.name ||
                      ls.batch_name === b.name ||
                      ls.batchId === b.id ||
                      ls.batch_id === b.id
                  )
                : null;

              if (matchedLive) {
                return {
                  id: `live-${matchedLive.id}`,
                  trainerName: matchedLive.trainer || matchedLive.mentor_name || b.trainer || "Faculty Instructor",
                  topic: matchedLive.title || matchedLive.subject || b.topic,
                  topicDetail: matchedLive.subject ? `Subject: ${matchedLive.subject}` : "Scheduled interactive live lecture.",
                  batch: matchedLive.batch || b.name,
                  time: matchedLive.time || b.schedule || "10:00 AM - 05:00 PM",
                  status: matchedLive.status || (isPast ? "Completed" : isToday ? "Live" : "Scheduled"),
                  displayDate: selectedDate,
                  isLiveRecord: true,
                };
              }

              // Check if batch has an explicit database topic for this specific date
              const hasExplicitDateTopic = b.dailyTopic && b.date === selectedDate;
              if (hasExplicitDateTopic) {
                return {
                  id: b.id,
                  trainerName: b.trainer || b.mentorName || b.mentor_name || "Faculty Instructor",
                  topic: b.dailyTopic,
                  topicDetail: b.dailyDescription || b.description || "Active scheduled training module.",
                  batch: b.name || "CSE Batch",
                  time: b.schedule || "10:00 AM - 05:00 PM",
                  status: isPast ? "Completed" : isToday ? "Live" : "Scheduled",
                  displayDate: selectedDate,
                  isLiveRecord: false,
                };
              }

              // Dynamically compute structured curriculum topic based on date offset
              const dynamicCurriculum = getDynamicTopicForBatch(b.name, selectedDate);
              return {
                id: b.id,
                trainerName: b.trainer || b.mentorName || b.mentor_name || "Faculty Instructor",
                topic: dynamicCurriculum.topic,
                topicDetail: dynamicCurriculum.detail,
                batch: b.name || "CSE Batch",
                time: b.schedule || "10:00 AM - 05:00 PM",
                status: isPast ? "Completed" : isToday ? "Live" : "Scheduled",
                displayDate: selectedDate,
                isLiveRecord: false,
              };
            });

            setLiveSessions(mappedSessions);
          } else {
            setLiveSessions([]);
          }
        }
      } catch (err) {
        console.warn("[CO_Overview] Error loading date sessions:", err);
      }
    };

    fetchSessionsForDate();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate]);

  const rawFullName = coordUser.name || coordUser.fullName || coordUser.full_name;
  const email = coordUser.email || "";
  let fullName = rawFullName;
  if (!fullName || fullName.includes("@")) {
    const src = (email && email.includes("@")) ? email.split("@")[0] : (fullName && fullName.includes("@") ? fullName.split("@")[0] : "");
    if (src) {
      fullName = src.replace(/[0-9_.-]+/g, " ").trim().split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
  }
  if (!fullName) fullName = "Department Coordinator";
  const dept = coordUser.department || coordUser.dept || coordUser.coordinatorProfile?.department || "CSE Department";
  const role = coordUser.role || "Coordinator";

  const getInitials = (name) => {
    if (!name) return "DC";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(fullName);

  const statsList = [
    { label: "Enrolled Students", value: `${studentCount}`, hint: `Active in ${getShortDept(dept) || "CS"}`, icon: GraduationCap },
    { label: "Managed Batches", value: `${liveBatches.length} Batches`, hint: "Current active batches", icon: Users },
    { label: "Mentors", value: `${mentorCount} Trainers`, hint: "Assigned department mentors", icon: UserCheck },
    { label: "Attendance Rate", value: attendanceRate || "0%", hint: "Department average", icon: LineChart },
  ];

  const displaySessions = liveSessions;

  return (
    <div className="student-page-inner stack-6 overview-wrapper">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card-coordinator">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {userInitials}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <LayoutDashboard size={14} /> COORDINATOR WORKSPACE DASHBOARD
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {fullName}!
            </h1>
            <p className="overview-hero-desc">
              {getShortDept(dept) || "CS"} &nbsp;|&nbsp; {role || "Training Coordinator"} &nbsp;|&nbsp; {email || "coordinator@pvppcoe.ac.in"}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {statsList.map((s) => (
          <Card key={s.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <s.icon size={16} />
                </div>
                <span className="overview-stat-label">{s.label}</span>
                
              </div>

              <p className="overview-stat-value">{s.value}</p>

              <div className="overview-stat-hint-row">
                <span className="overview-stat-trend-pill">{s.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dynamic Training Sessions with Date Selection */}
      {/* Dynamic Training Sessions with Date Selection */}
      <div className="co-arena-card co-sessions-card">
        <div className="co-arena-card-header co-sessions-header">
          <div className="co-arena-header-left overview-header-left">
            <div className="co-arena-icon-wrap co-arena-icon-wrap--emerald co-sessions-icon-wrap overview-header-icon-wrap">
              <Activity size={18} className="co-pulse-icon" />
            </div>
            <div>
              <h3 className="co-arena-header-title">Current Training Sessions</h3>
              <p className="co-arena-header-sub">
                Curriculum topics & active schedule for {getDateLabel(selectedDate)}
              </p>
            </div>
          </div>

          <div className="co-sessions-header-right">
            {/* Interactive Dynamic Date Control Group */}
            <div className="co-date-control-group">
              <button 
                type="button" 
                className="co-date-nav-btn" 
                title="Previous Day"
                onClick={() => handleDateStep(-1)}
              >
                <ChevronLeft size={15} />
              </button>

              <label className="co-date-picker-wrap" title="Select date to change topics dynamically">
                <Calendar size={14} className="co-date-picker-icon" />
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)} 
                  className="co-sessions-date-input"
                />
                <span className="co-date-display-badge">
                  {getDateLabel(selectedDate)}
                </span>
              </label>

              <button 
                type="button" 
                className="co-date-nav-btn" 
                title="Next Day"
                onClick={() => handleDateStep(1)}
              >
                <ChevronRight size={15} />
              </button>

              {!isTodayDate(selectedDate) && (
                <button 
                  type="button" 
                  className="co-date-today-btn" 
                  title="Jump to Today"
                  onClick={handleResetToToday}
                >
                  Today
                </button>
              )}
            </div>

            <span className="co-sessions-count-pill">
              {displaySessions.length} Active Sessions
            </span>
          </div>
        </div>

        <div className="co-arena-card-body">
          {displaySessions.length === 0 ? (
            <div className="co-risk-empty-box">
              <Calendar size={32} color="#6366f1" />
              <h4 className="co-risk-empty-title">No training sessions scheduled for {getDateLabel(selectedDate)}</h4>
              <p className="co-risk-empty-sub">Use the date controls above to navigate to other days or check department batches.</p>
            </div>
          ) : (
            <div className="co-sessions-grid">
              {displaySessions.map((session, index) => (
                <div key={session.id || index} className="co-session-card">
                  {/* Trainer Box Header */}
                  <div className="co-session-trainer-box">
                    <div className="co-session-trainer-badge">
                      <User size={12} />
                      <span>TRAINER</span>
                    </div>
                    <h4 className="co-session-trainer-name">{session.trainerName}</h4>
                  </div>

                  {/* Session Main Content with Topic & Dynamic Status */}
                  <div className="co-session-main">
                    <div className="co-session-status-row">
                      <span className={`co-session-status-tag ${(session.status || "scheduled").toLowerCase()}`}>
                        <span className="co-status-dot" />
                        {session.status || "Scheduled"}
                      </span>
                      <span className="co-session-date-tag">
                        <Calendar size={11} /> {getDateLabel(selectedDate)}
                      </span>
                    </div>
                    <h4 className="co-session-title">{session.topic}</h4>
                    <p className="co-session-desc">{session.topicDetail || session.description || "Active training module."}</p>
                  </div>

                  {/* Session Footer with Batch & Schedule Time */}
                  <div className="co-session-footer">
                    <div className="co-session-footer-left">
                      <User size={13} className="co-session-user-icon" />
                      <span>{session.batch}</span>
                    </div>
                    <div className="co-session-footer-right">
                      <Clock size={12} />
                      <span>{session.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flagged High Risk Students Audit Arena */}
      <div className="co-arena-card">
        <div className="co-arena-card-header">
          <div className="co-arena-header-left">
            <div className="co-arena-icon-wrap co-arena-icon-wrap--rose">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="co-arena-header-title">Defaulter & Risk Audit</h3>
              <p className="co-arena-header-sub">Students requiring active intervention</p>
            </div>
          </div>
          <Link to="/coordinator/students" className="co-arena-badge-link">
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="co-arena-card-body">
          {highRiskStudents.length === 0 ? (
            <div className="co-risk-empty-box">
              <CheckCircle size={32} color="#10b981" />
              <h4 className="co-risk-empty-title">No high risk students flagged.</h4>
              <p className="co-risk-empty-sub">All department students are within attendance compliance.</p>
            </div>
          ) : (
            highRiskStudents.map((s) => {
              const initials = s.name
                ? s.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
                : "ST";
              const attendanceVal = s.attendance ?? 72;
              const perfVal = s.testAvg ?? s.avgScore ?? s.score ?? 58;

              return (
                <div key={s.id} className="co-risk-item-card">
                  <div className="co-risk-item-left">
                    <div className="co-risk-avatar">{initials}</div>
                    <div className="co-risk-info-wrap">
                      <h5 className="co-risk-info-name">{s.name}</h5>
                      <p className="co-risk-info-sub">
                        {s.rollNo || s.studentId || "CSE26-001"} · {s.batch || "CSE 2026 Cohort"}
                      </p>
                      <div className="co-risk-metrics-row">
                        <span className="co-risk-metric-pill--danger">
                          Attendance: {attendanceVal}%
                        </span>
                        <span className="co-risk-metric-pill--warning">
                          Performance: {perfVal}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="co-risk-badge">High Risk</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
