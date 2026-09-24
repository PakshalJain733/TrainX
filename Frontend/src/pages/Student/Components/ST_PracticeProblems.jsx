import { useState, useEffect } from "react";
import { apiFetch } from "../../../utils/api";
import { getSharedCodingTasks, EVENTS } from "../../../utils/sharedStore";
import {
  Code2, Search, Filter, CheckCircle2, Circle, Flame, Trophy,
  BookOpen, Sparkles, ChevronRight, Play, Award, ArrowUpRight,
  Bookmark, Sliders, ExternalLink, Cpu, Terminal
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import "../Styles/ST_PracticeProblems.css";
const practiceProblemsData = [];

export default function PracticeProblems() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [problemsList, setProblemsList] = useState(practiceProblemsData);

  useEffect(() => {
    const loadProblems = async () => {
      try {
        const res = await apiFetch("/student/practice-problems");
        let apiItems = [];
        if (res.data && res.data.length > 0) {
          apiItems = res.data.map((p) => ({
            id: p.id,
            title: p.title,
            topic: p.category || "General DSA",
            difficulty: p.difficulty,
            acceptance: "65.0%",
            points: p.points || 100,
            solved: p.solve_status === "Solved",
            companies: ["TCS", "Infosys"],
            solutionAvailable: true,
            description: p.description || "No problem description provided.",
          }));
        }
        const shared = await getSharedCodingTasks([]);
        const mappedShared = shared.map((s) => ({
          id: s.id,
          title: s.title,
          topic: s.data?.category || s.category || s.topic || "General DSA",
          difficulty: s.data?.difficulty || s.difficulty || "Medium",
          acceptance: "70.0%",
          points: s.data?.points || s.points || 100,
          solved: false,
          companies: ["Core Tech"],
          solutionAvailable: true,
          description: s.data?.description || s.description || "No problem description provided.",
        }));
        const existingIds = new Set(apiItems.map((i) => i.id));
        const uniqueShared = mappedShared.filter((s) => !existingIds.has(s.id));
        setProblemsList([...uniqueShared, ...apiItems]);
      } catch {
        const shared = await getSharedCodingTasks([]);
        if (shared.length > 0) {
          setProblemsList(
            shared.map((s) => ({
              id: s.id,
              title: s.title,
              topic: s.data?.category || s.category || s.topic || "General DSA",
              difficulty: s.data?.difficulty || s.difficulty || "Medium",
              acceptance: "70.0%",
              points: s.data?.points || s.points || 100,
              solved: false,
              companies: ["Core Tech"],
              solutionAvailable: true,
            }))
          );
        }
      }
    };

    loadProblems();
    const handleUpdate = () => loadProblems();
    window.addEventListener(EVENTS.CODING_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENTS.CODING_UPDATED, handleUpdate);
  }, []);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const topics = ["All", "Arrays & Hashing", "Sliding Window", "Two Pointers", "Linked List", "Trees & Graphs", "Dynamic Programming", "Heap / Priority Queue"];
  const difficulties = ["All", "Easy", "Medium", "Hard"];

  const filteredProblems = problemsList.filter((prob) => {
    const matchesSearch = prob.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prob.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = selectedDifficulty === "All" || prob.difficulty === selectedDifficulty;
    const matchesTopic = selectedTopic === "All" || prob.topic === selectedTopic;
    const matchesStatus = statusFilter === "All" ||
                          (statusFilter === "Solved" && prob.solved) ||
                          (statusFilter === "Unsolved" && !prob.solved);
    return matchesSearch && matchesDiff && matchesTopic && matchesStatus;
  });

  const handleToggleSolved = (id) => {
    setProblemsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, solved: !p.solved } : p))
    );
  };

  const totalProblemsCount = problemsList.length;
  const solvedCount = problemsList.filter((p) => p.solved).length;
  const completionRate = totalProblemsCount > 0 ? Math.round((solvedCount / totalProblemsCount) * 100) : 0;

  const easyProblems = problemsList.filter((p) => p.difficulty === "Easy");
  const easyTotal = easyProblems.length;
  const easySolved = easyProblems.filter((p) => p.solved).length;
  const easyPct = easyTotal > 0 ? Math.round((easySolved / easyTotal) * 100) : 0;

  const mediumProblems = problemsList.filter((p) => p.difficulty === "Medium");
  const mediumTotal = mediumProblems.length;
  const mediumSolved = mediumProblems.filter((p) => p.solved).length;
  const mediumPct = mediumTotal > 0 ? Math.round((mediumSolved / mediumTotal) * 100) : 0;

  const hardProblems = problemsList.filter((p) => p.difficulty === "Hard");
  const hardTotal = hardProblems.length;
  const hardSolved = hardProblems.filter((p) => p.solved).length;
  const hardPct = hardTotal > 0 ? Math.round((hardSolved / hardTotal) * 100) : 0;

  const accuracyRate = solvedCount > 0 ? Math.min(100, Math.round(75 + (solvedCount * 2))) : 0;

  return (
    <div className="student-page-inner stack-6">
      <div className="student-header-box">
        <span className="student-header-eyebrow">C2C TRAINING PROGRAM</span>
        <h2 className="student-header-title">
          <Terminal size={22} style={{ color: "#4f46e5" }} />
          <span>Coding Practice Problems</span>
        </h2>
        <p className="student-header-desc">Master Data Structures & Algorithms with pattern-based coding problems designed for campus placements.</p>
      </div>

      {/* Proper Stats Cards Row */}
      <div className="practice-metrics-grid">
        <div className="stat-card-modern card-blue">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-blue-soft">
              <Code2 size={22} />
            </div>
            <span className="stat-badge badge-blue">{completionRate}% Completed</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{solvedCount} <span className="stat-total">/ {totalProblemsCount}</span></div>
            <div className="stat-title">Problems Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-blue-bar" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="stat-card-modern card-emerald">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-emerald-soft">
              <CheckCircle2 size={22} />
            </div>
            <span className="stat-badge badge-emerald">{easySolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-emerald">{easySolved}</div>
            <div className="stat-title">Easy Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-emerald-bar" style={{ width: `${easyPct}%` }} />
          </div>
        </div>

        <div className="stat-card-modern card-amber">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-amber-soft">
              <Flame size={22} />
            </div>
            <span className="stat-badge badge-amber">{mediumSolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-amber">{mediumSolved}</div>
            <div className="stat-title">Medium Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-amber-bar" style={{ width: `${mediumPct}%` }} />
          </div>
        </div>

        <div className="stat-card-modern card-red">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-red-soft">
              <Flame size={22} />
            </div>
            <span className="stat-badge badge-red">{hardSolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-red">{hardSolved}</div>
            <div className="stat-title">Hard Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-red-bar" style={{ width: `${hardPct}%` }} />
          </div>
        </div>

        <div className="stat-card-modern card-purple">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-purple-soft">
              <Trophy size={22} />
            </div>
            <span className="stat-badge badge-purple">High Score</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-purple">{accuracyRate}%</div>
            <div className="stat-title">Accuracy Rate</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-purple-bar" style={{ width: `${accuracyRate}%` }} />
          </div>
        </div>
      </div>




      {/* Filter & Search Controls */}
      <div className="practice-controls-card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search problems by name or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-row">
          {/* Difficulty Filter */}
          <div className="filter-group">
            <span className="filter-label">Difficulty:</span>
            <div className="filter-pills">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  className={`filter-pill ${selectedDifficulty === diff ? "active" : ""}`}
                  onClick={() => setSelectedDifficulty(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <span className="filter-label">Status:</span>
            <div className="filter-pills">
              {["All", "Solved", "Unsolved"].map((st) => (
                <button
                  key={st}
                  className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic Pills */}
        <div className="topic-pills-row">
          <span className="filter-label">Topics:</span>
          <div className="topic-scroll">
            {topics.map((t) => (
              <button
                key={t}
                className={`topic-pill ${selectedTopic === t ? "active" : ""}`}
                onClick={() => setSelectedTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Problems List Table */}
      <div id="problems-table-section" className="problems-table-card">
        <div className="table-header-info">
          <h3>All Practice Problems ({filteredProblems.length})</h3>
          <span className="table-sub">Click 'Solve' to launch live compiler and test cases</span>
        </div>

        <div className="problems-table-wrapper">
          <table className="problems-table">
            <thead>
              <tr>
                <th className="pp-th-status">Status</th>
                <th>Title</th>
                <th>Topic</th>
                <th>Difficulty</th>
                <th>Acceptance</th>
                <th className="pp-th-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pp-empty-cell">
                    No practice problems found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((prob) => (
                  <tr key={prob.id} className="problem-row">
                    <td>
                      <button
                        type="button"
                        className="status-toggle-btn"
                        onClick={() => handleToggleSolved(prob.id)}
                        title={prob.solved ? "Mark as Unsolved" : "Mark as Solved"}
                        aria-label={prob.solved ? "Mark as Unsolved" : "Mark as Solved"}
                      >
                        {prob.solved ? (
                          <CheckCircle2 size={18} className="solved-icon" />
                        ) : (
                          <Circle size={18} className="unsolved-icon" />
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="prob-title-box">
                        <Link
                          to={`/student/coding-platform/task-${String(prob.id).padStart(2, '0')}`}
                          state={{ task: prob, source: 'practice' }}
                          className="prob-title-link"
                        >
                          {prob.title}
                        </Link>
                        <span className="prob-points">+{prob.points} XP</span>
                      </div>
                    </td>
                    <td>
                      <span className="topic-badge">{prob.topic}</span>
                    </td>
                    <td>
                      <span className={`diff-badge diff-${prob.difficulty.toLowerCase()}`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="acceptance-cell">{prob.acceptance}</td>

                    <td className="pp-td-action">
                      <Button
                        size="sm"
                        className="solve-btn"
                        onClick={() => navigate(`/student/coding-platform/task-${String(prob.id).padStart(2, '0')}`, { state: { task: prob, source: 'practice' } })}
                      >
                        <Terminal size={14} /> Solve
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
