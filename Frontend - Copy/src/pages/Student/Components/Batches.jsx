import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  Clock,
  BookOpen,
  ArrowUpRight,
  Code2,
  Database,
  Layers,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Video,
  PlayCircle,
  Trophy,
  AlertCircle,
  Clock3,
  CalendarDays,
  CheckSquare,
  Square,
  Award,
  Flame,
  Check,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/Batches.css";

const batchesList = [
  {
    id: "batch-py",
    title: "Python Backend & Cloud Systems",
    code: "PY-BE-2026",
    track: "Backend Engineering",
    trainer: "Prof. Rajesh Sharma",
    timing: "Mon, Wed, Fri · 10:00 AM - 12:00 PM",
    studentsEnrolled: 64,
    progress: 72,
    status: "Active",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: Code2,
    description: "FastAPI, PostgreSQL indexing, Celery distributed tasks, Docker containers, and AWS Cloud deployment.",
    stats: {
      completedTasks: 5,
      pendingTasks: 3,
      urgentTaskNumber: "Task 04",
      urgentTaskName: "Custom HashMap & Collision",
      urgentTaskDeadline: "Tomorrow, 11:59 PM",
    },
    leaderboard: [
      { rank: 1, name: "Riya Shah", xp: 2480, initials: "RS" },
      { rank: 2, name: "Kabir Menon", xp: 2415, initials: "KM" },
      { rank: 3, name: "Ananya Rao", xp: 2390, initials: "AR" },
      { rank: 7, name: "Ganesh Shinde (You)", xp: 2150, initials: "GS", self: true },
      { rank: 8, name: "Siddharth Verma", xp: 2120, initials: "SV" },
    ],
    modules: [
      {
        number: 1,
        title: "FastAPI Architecture & Async Endpoints",
        tasks: [
          {
            taskNumber: "Task 01",
            title: "Async Handlers & Event Loop Optimization",
            type: "Lab Code Submission",
            due: "Completed on Aug 15",
            status: "Completed",
          },
          {
            taskNumber: "Task 02",
            title: "Pydantic v2 Custom Schema Validators",
            type: "Coding Assessment",
            due: "Completed on Aug 18",
            status: "Completed",
          },
          {
            taskNumber: "Task 03",
            title: "OAuth2 JWT Authentication Middleware",
            type: "Hands-on Exercise",
            due: "Completed on Aug 20",
            status: "Completed",
          },
        ],
      },
      {
        number: 2,
        title: "Relational Storage & PostgreSQL ORM",
        tasks: [
          {
            taskNumber: "Task 04",
            title: "Custom HashMap & Key Collision Resolution",
            type: "Graded Assignment",
            due: "Due Tomorrow, 11:59 PM",
            status: "Pending",
            urgent: true,
          },
          {
            taskNumber: "Task 05",
            title: "Alembic Production Migration Scripts",
            type: "Lab Exercise",
            due: "Completed on Aug 22",
            status: "Completed",
          },
          {
            taskNumber: "Task 06",
            title: "B-Tree Indexing & Connection Pooling",
            type: "Performance Drill",
            due: "Due Friday, 5:00 PM",
            status: "Pending",
          },
        ],
      },
      {
        number: 3,
        title: "Distributed Queues & Cloud Deployment",
        tasks: [
          {
            taskNumber: "Task 07",
            title: "Celery Task Queue with Redis Broker",
            type: "Mini Project",
            due: "Due Sep 02, 2026",
            status: "Pending",
          },
          {
            taskNumber: "Task 08",
            title: "Multi-stage Docker Containerization & AWS ECS",
            type: "Capstone Project",
            due: "Completed on Aug 24",
            status: "Completed",
          },
        ],
      },
    ],
  },
  {
    id: "batch-dsa",
    title: "Data Structures & Competitive Algorithms",
    code: "DSA-ADV-02",
    track: "Problem Solving & C2C",
    trainer: "Ms. R. Kulkarni",
    timing: "Tue, Thu · 02:00 PM - 04:30 PM",
    studentsEnrolled: 58,
    progress: 88,
    status: "Active",
    color: "#7c3aed",
    bg: "#f5f3ff",
    icon: Layers,
    description: "Graph traversals, Dynamic Programming, Segment Trees, and real-time LeetCode medium/hard patterns.",
    stats: {
      completedTasks: 6,
      pendingTasks: 1,
      urgentTaskNumber: "Task 07",
      urgentTaskName: "Segment Tree Lazy Propagation",
      urgentTaskDeadline: "Due Saturday, 11:59 PM",
    },
    leaderboard: [
      { rank: 1, name: "Ganesh Shinde (You)", xp: 2650, initials: "GS", self: true },
      { rank: 2, name: "Riya Shah", xp: 2590, initials: "RS" },
      { rank: 3, name: "Pranav Joshi", xp: 2480, initials: "PJ" },
      { rank: 4, name: "Neha Kulkarni", xp: 2390, initials: "NK" },
    ],
    modules: [
      {
        number: 1,
        title: "Advanced Graphs & Network Flow",
        tasks: [
          {
            taskNumber: "Task 01",
            title: "Dijkstra Priority Queue Implementation",
            type: "Algorithm Lab",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 02",
            title: "Disjoint Set Union (DSU) & Kruskal's MST",
            type: "Problem Set",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 03",
            title: "Tarjan's Strongly Connected Components",
            type: "Live Coding Test",
            due: "Completed",
            status: "Completed",
          },
        ],
      },
      {
        number: 2,
        title: "Dynamic Programming & Range Queries",
        tasks: [
          {
            taskNumber: "Task 04",
            title: "2D/3D Grid DP State Transitions",
            type: "Practice Assessment",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 05",
            title: "Bitmask DP & Traveling Salesperson",
            type: "Problem Set",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 06",
            title: "Binary Indexed Fenwick Trees",
            type: "Algorithm Drill",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 07",
            title: "Segment Tree with Lazy Propagation",
            type: "Graded Challenge",
            due: "Due Saturday, 11:59 PM",
            status: "Pending",
            urgent: true,
          },
        ],
      },
    ],
  },
  {
    id: "batch-sql",
    title: "Database Engineering & SQL Mastery",
    code: "DB-SQL-06",
    track: "Data Architecture",
    trainer: "Prof. Amit Deshmukh",
    timing: "Saturday · 09:30 AM - 01:30 PM",
    studentsEnrolled: 72,
    progress: 100,
    status: "Completed",
    color: "#059669",
    bg: "#ecfdf5",
    icon: Database,
    description: "ACID transactions, B-Tree indexes, 3NF schema normalization, query plan optimizations, and Redis caching.",
    stats: {
      completedTasks: 6,
      pendingTasks: 0,
      urgentTaskNumber: "All Completed",
      urgentTaskName: "Full Cohort Curriculum Cleared",
      urgentTaskDeadline: "100% Score Achieved",
    },
    leaderboard: [
      { rank: 1, name: "Neha Kulkarni", xp: 2710, initials: "NK" },
      { rank: 2, name: "Ganesh Shinde (You)", xp: 2680, initials: "GS", self: true },
      { rank: 3, name: "Aman Gupta", xp: 2540, initials: "AG" },
    ],
    modules: [
      {
        number: 1,
        title: "Query Optimization & Execution Plans",
        tasks: [
          {
            taskNumber: "Task 01",
            title: "EXPLAIN ANALYZE Cost Parsing & Optimizations",
            type: "Case Study Lab",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 02",
            title: "B-Tree Index Selectivity & Clustered Scans",
            type: "Query Drill",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 03",
            title: "Subquery Unnesting & Hash Join Plans",
            type: "Assignment",
            due: "Completed",
            status: "Completed",
          },
        ],
      },
      {
        number: 2,
        title: "Transactions, Locks & Concurrency Control",
        tasks: [
          {
            taskNumber: "Task 04",
            title: "ACID Isolation Levels & Phantom Reads",
            type: "Theory Assessment",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 05",
            title: "Row-level Locks & MVCC Simulation",
            type: "Hands-on Exercise",
            due: "Completed",
            status: "Completed",
          },
          {
            taskNumber: "Task 06",
            title: "Database Sharding & Redis Read Replicas",
            type: "Architecture Capstone",
            due: "Completed",
            status: "Completed",
          },
        ],
      },
    ],
  },
  {
    id: "batch-aptitude",
    title: "Aptitude & Problem Solving",
    code: "APT-PS-01",
    track: "Placement Readiness",
    trainer: "Ms. Priya Nair",
    timing: "Monday, Wednesday · 11:00 AM - 12:30 PM",
    studentsEnrolled: 85,
    progress: 57,
    status: "Active",
    color: "#d97706",
    bg: "#fffbeb",
    icon: Award,
    description: "Quantitative aptitude, logical reasoning, verbal ability, and timed mock tests to prepare for campus placement rounds.",
    stats: {
      completedTasks: 4,
      pendingTasks: 3,
      urgentTaskNumber: "Task 05",
      urgentTaskName: "Mock Aptitude Test – Series 2",
      urgentTaskDeadline: "Due Friday, 6:00 PM",
    },
    leaderboard: [
      { rank: 1, name: "Sneha Patil", xp: 1980, initials: "SP" },
      { rank: 2, name: "Riya Shah", xp: 1850, initials: "RS" },
      { rank: 3, name: "Ganesh Shinde (You)", xp: 1720, initials: "GS", self: true },
      { rank: 4, name: "Aman Gupta", xp: 1610, initials: "AG" },
    ],
    modules: [
      {
        number: 1,
        title: "Quantitative Aptitude Foundations",
        tasks: [
          { taskNumber: "Task 01", title: "Number System, LCM & HCF Problem Set", type: "MCQ Quiz", due: "Completed on Aug 10", status: "Completed", platform: "mcq" },
          { taskNumber: "Task 02", title: "Percentages, Profit & Loss Exercises", type: "MCQ Practice", due: "Completed on Aug 14", status: "Completed", platform: "mcq" },
          { taskNumber: "Task 03", title: "Time, Speed & Distance – Timed Drill", type: "Timed Test", due: "Completed on Aug 18", status: "Completed", platform: "mcq" },
          { taskNumber: "Task 04", title: "Ratios, Averages & Mixtures", type: "MCQ Practice", due: "Completed on Aug 22", status: "Completed", platform: "mcq" },
        ],
      },
      {
        number: 2,
        title: "Logical Reasoning & Verbal Ability",
        tasks: [
          { taskNumber: "Task 05", title: "Mock Aptitude Test – Series 2", type: "Full Mock Test", due: "Due Friday, 6:00 PM", status: "Pending", urgent: true, platform: "mcq" },
          { taskNumber: "Task 06", title: "Syllogisms & Seating Arrangements", type: "MCQ Problem Set", due: "Due Sep 05, 2026", status: "Pending", platform: "mcq" },
          { taskNumber: "Task 07", title: "Reading Comprehension & Para Jumbles", type: "Verbal Test", due: "Due Sep 08, 2026", status: "Pending", platform: "mcq" },
        ],
      },
    ],
  },
  {
    id: "batch-lifeskills",
    title: "Life Skills & Communication",
    code: "LS-COMM-01",
    track: "Professional Development",
    trainer: "Prof. Anita Desai",
    timing: "Friday · 02:00 PM - 04:00 PM",
    studentsEnrolled: 78,
    progress: 33,
    status: "Active",
    color: "#0891b2",
    bg: "#ecfeff",
    icon: Flame,
    description: "Group discussions, personality development, resume writing, professional communication, and interview preparation skills.",
    stats: {
      completedTasks: 2,
      pendingTasks: 4,
      urgentTaskNumber: "Task 03",
      urgentTaskName: "Group Discussion: AI in Education",
      urgentTaskDeadline: "Due Sep 12, 2026",
    },
    leaderboard: [
      { rank: 1, name: "Ananya Rao", xp: 1740, initials: "AR" },
      { rank: 2, name: "Neha Kulkarni", xp: 1680, initials: "NK" },
      { rank: 3, name: "Ganesh Shinde (You)", xp: 1590, initials: "GS", self: true },
      { rank: 4, name: "Kabir Menon", xp: 1520, initials: "KM" },
    ],
    modules: [
      {
        number: 1,
        title: "Communication & Personality",
        tasks: [
          { taskNumber: "Task 01", title: "Resume Building & LinkedIn Profile", type: "Submission", due: "Completed on Aug 12", status: "Completed", platform: "submission" },
          { taskNumber: "Task 02", title: "Email & Professional Writing Etiquette", type: "Written Task", due: "Completed on Aug 20", status: "Completed", platform: "submission" },
          { taskNumber: "Task 03", title: "Group Discussion: AI in Education", type: "GD Session", due: "Due Sep 12, 2026", status: "Pending", urgent: true, platform: "gd" },
          { taskNumber: "Task 04", title: "Mock Interview – HR Round", type: "Live Interview", due: "Due Sep 15, 2026", status: "Pending", platform: "gd" },
        ],
      },
      {
        number: 2,
        title: "Interview & Presentation Skills",
        tasks: [
          { taskNumber: "Task 05", title: "Personal Introduction & Elevator Pitch", type: "Video Submission", due: "Due Sep 18, 2026", status: "Pending", platform: "submission" },
          { taskNumber: "Task 06", title: "Team Role-Play & Conflict Resolution", type: "Activity", due: "Due Sep 22, 2026", status: "Pending", platform: "gd" },
        ],
      },
    ],
  },
];

export default function Batches() {
  const [selectedBatch, setSelectedBatch] = useState(null);

  if (selectedBatch) {
    const Icon = selectedBatch.icon;
    const totalBatchTasks = selectedBatch.stats.completedTasks + selectedBatch.stats.pendingTasks;
    return (
      <div className="student-page-inner coursework-view-container">
        <button
          type="button"
          className="coursework-back-btn"
          onClick={() => setSelectedBatch(null)}
        >
          <ArrowLeft size={16} />
          <span>Back to All Batches</span>
        </button>

        {/* Coursework Banner */}
        <div className="coursework-header-banner">
          <div className="coursework-header-left">
            <div
              className="coursework-header-icon"
              style={{ background: selectedBatch.bg, color: selectedBatch.color }}
            >
              <Icon size={28} />
            </div>
            <div>
              <h2 className="coursework-header-title">{selectedBatch.title}</h2>
              <p className="coursework-header-subtitle">
                {selectedBatch.code} · Instructor: {selectedBatch.trainer} · {selectedBatch.timing}
              </p>
            </div>
          </div>

          <div className="coursework-header-meta">
            <div className="coursework-meta-stat">
              <span className="coursework-meta-stat-label">Syllabus Progress</span>
              <span className="coursework-meta-stat-value">{selectedBatch.progress}%</span>
            </div>
            <div className="coursework-meta-stat">
              <span className="coursework-meta-stat-label">Batch Status</span>
              <Badge variant={selectedBatch.status === "Active" ? "primary" : "success"}>
                {selectedBatch.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* 4 KPI Stats Row */}
        <div className="cw-stats-row">
          <div className="cw-stat-card">
            <div className="cw-stat-icon-wrap cw-stat-icon--emerald">
              <CheckCircle2 size={20} />
            </div>
            <div className="cw-stat-info-col">
              <p className="cw-stat-label">Completed Tasks</p>
              <h4 className="cw-stat-value">{selectedBatch.stats.completedTasks}</h4>
            </div>
          </div>

          <div className="cw-stat-card">
            <div className="cw-stat-icon-wrap cw-stat-icon--amber">
              <Clock3 size={20} />
            </div>
            <div className="cw-stat-info-col">
              <p className="cw-stat-label">Pending Tasks</p>
              <h4 className="cw-stat-value">{selectedBatch.stats.pendingTasks}</h4>
            </div>
          </div>

          <div className="cw-stat-card">
            <div className="cw-stat-icon-wrap cw-stat-icon--blue">
              <CheckSquare size={20} />
            </div>
            <div className="cw-stat-info-col">
              <p className="cw-stat-label">Task Completion Rate</p>
              <h4 className="cw-stat-value">
                {totalBatchTasks > 0 ? Math.round((selectedBatch.stats.completedTasks / totalBatchTasks) * 100) : 100}%
              </h4>
            </div>
          </div>

          <div className="cw-stat-card">
            <div className="cw-stat-icon-wrap cw-stat-icon--red">
              <AlertCircle size={20} />
            </div>
            <div className="cw-stat-info-col">
              <p className="cw-stat-label">
                Next Deadline ({selectedBatch.stats.urgentTaskNumber})
              </p>
              <div className="cw-stat-due-wrapper">
                <span className="cw-stat-due-text">
                  {selectedBatch.stats.urgentTaskDeadline}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Split Arena: Left (Unified Module-wise Tasks Container) & Right (Cohort Leaderboard) */}
        <div className="cw-content-split-grid">
          {/* LEFT PANE: Single Unified Container with Module-wise Tasks */}
          <div className="cw-left-pane">
            <div className="cw-unified-container">
              <div className="cw-unified-header">
                <div className="cw-unified-title-wrap">
                  <BookOpen size={20} className="cw-unified-title-icon" />
                  <h3 className="cw-unified-title">Coursework & Tasks</h3>
                </div>
                <Badge variant="primary">{totalBatchTasks} Total Tasks Assigned</Badge>
              </div>

              <div className="cw-unified-modules-stack">
                <div className="cw-module-items-stack">
                  {selectedBatch.modules.flatMap(m => m.tasks).map((task) => {
                    const taskSlug = task.taskNumber.replace(/\s+/g, '-').toLowerCase();
                    const platform = task.platform || "coding";
                    let taskHref = `/student/coding-platform/${taskSlug}`;
                    if (platform === "mcq") taskHref = `/student/mcq-exam`;
                    else if (platform === "gd") taskHref = `/student/ai-interview`;
                    else if (platform === "submission") taskHref = `/student/notes`;

                    return (
                      <Link
                        to={taskHref}
                        key={task.taskNumber}
                        className={`cw-item-row ${task.urgent ? "cw-item-row--urgent" : ""}`}
                        style={{ textDecoration: 'none', display: 'flex', color: 'inherit' }}
                      >
                        <div className="cw-item-left">
                          <span className="cw-task-num-badge">{task.taskNumber}</span>
                          {task.status === "Completed" ? (
                            <CheckCircle2 size={18} className="cw-item-icon-done" />
                          ) : (
                            <Clock3 size={18} className="cw-item-icon-pending" />
                          )}
                          <div className="cw-item-title-col">
                            <h5 className="cw-item-title">{task.title}</h5>
                            <p className="cw-item-meta-sub">
                              <span>{task.type}</span>
                              <span>•</span>
                              <span className={task.urgent ? "cw-item-due--urgent" : ""}>
                                {task.due}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="cw-item-right">
                          <Badge
                            variant={
                              task.status === "Completed"
                                ? "success"
                                : task.urgent
                                ? "danger"
                                : "warning"
                            }
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: Batch Leaderboard */}
          <div className="cw-right-pane">
            <div className="cw-leaderboard-card">
              <div className="cw-section-header-row">
                <div className="cw-lb-title-wrap">
                  <Trophy size={18} className="cw-lb-icon" />
                  <h3 className="cw-section-title">Cohort Leaderboard</h3>
                </div>
                <Badge variant="outline">Top Performers</Badge>
              </div>

              <div className="cw-lb-list">
                {selectedBatch.leaderboard.map((student) => (
                  <div
                    key={student.rank}
                    className={`cw-lb-item ${student.self ? "cw-lb-item--self" : ""}`}
                  >
                    <div className="cw-lb-item-left">
                      <span className={`cw-lb-rank ${student.rank <= 3 ? "cw-lb-rank--top" : ""}`}>
                        #{student.rank}
                      </span>
                      <div className={`cw-lb-avatar ${student.self ? "cw-lb-avatar--self" : ""}`}>
                        {student.initials}
                      </div>
                      <span className="cw-lb-name">{student.name}</span>
                    </div>

                    <span className="cw-lb-xp">{student.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page-inner batches-page-container">
      <SectionHeader
        eyebrow="Training Cohorts"
        title="Enrolled Training Batches"
        description="View your active C2C cohorts, faculty-led sessions, curriculum completion rates, and learning resources."
      />

      {/* Summary KPI Bar */}
      <div className="batches-summary-grid">
        <div className="batches-summary-card">
          <div className="batches-summary-icon-box batches-summary-icon-box--blue">
            <Users size={22} />
          </div>
          <div>
            <p className="batches-summary-label">Total Enrolled</p>
            <h4 className="batches-summary-val">3 Batches</h4>
          </div>
        </div>

        <div className="batches-summary-card">
          <div className="batches-summary-icon-box batches-summary-icon-box--emerald">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="batches-summary-label">Average Completion</p>
            <h4 className="batches-summary-val">85%</h4>
          </div>
        </div>

        <div className="batches-summary-card">
          <div className="batches-summary-icon-box batches-summary-icon-box--purple">
            <Clock size={22} />
          </div>
          <div>
            <p className="batches-summary-label">Weekly Hours</p>
            <h4 className="batches-summary-val">12 Hours / Wk</h4>
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="batches-cards-grid">
        {batchesList.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.id} className="batch-card" style={{ "--accent-color": b.color, "--accent-bg": b.bg }}>
              <div>
                <div className="batch-card-top">
                  <div
                    className="batch-card-icon-wrap"
                    style={{ background: b.bg, color: b.color }}
                  >
                    <Icon size={22} />
                  </div>
                  <Badge
                    variant={b.status === "Active" ? "primary" : "success"}
                    className="batch-card-status-badge"
                  >
                    {b.status}
                  </Badge>
                </div>

                <h3 className="batch-card-title">{b.title}</h3>
                <p className="batch-card-desc">{b.description}</p>
              </div>

              <div className="batch-meta-list">
                <div className="batch-meta-item">
                  <span className="batch-meta-label">
                    <BookOpen size={14} /> Batch Code
                  </span>
                  <span className="batch-meta-value">{b.code}</span>
                </div>

                <div className="batch-meta-item">
                  <span className="batch-meta-label">
                    <Users size={14} /> Instructor
                  </span>
                  <span className="batch-meta-value">{b.trainer}</span>
                </div>

                <div className="batch-meta-item">
                  <span className="batch-meta-label">
                    <Calendar size={14} /> Schedule
                  </span>
                  <span className="batch-meta-value">{b.timing}</span>
                </div>
              </div>

              <div className="batch-progress-section">
                <div className="batch-progress-top">
                  <span className="batch-progress-label">Syllabus Progress</span>
                  <span className="batch-progress-pct">{b.progress}%</span>
                </div>
                <div className="batch-progress-bar-bg">
                  <div
                    className="batch-progress-bar-fill"
                    style={{
                      width: `${b.progress}%`,
                      background:
                        b.status === "Completed"
                          ? "linear-gradient(90deg, #059669 0%, #10b981 100%)"
                          : "linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)",
                    }}
                  />
                </div>
              </div>

              <div className="batch-card-actions">
                <button
                  type="button"
                  className="batch-open-btn"
                  onClick={() => setSelectedBatch(b)}
                >
                  <span>Open Coursework</span>
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
