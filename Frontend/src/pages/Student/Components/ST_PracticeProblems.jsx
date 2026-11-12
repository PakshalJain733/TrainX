import { useState, useEffect } from "react";
import { apiFetch } from "../../../utils/api";
import { getSharedCodingTasks, EVENTS } from "../../../utils/sharedStore";
import { Code2, Search, Filter, CheckCircle2, Circle, Flame, Trophy, BookOpen, Sparkles, ChevronRight, Play, Award, ArrowUpRight, Bookmark, Sliders, ExternalLink, Cpu, Terminal, X, Lock, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import "../Styles/ST_PracticeProblems.css";

const isDeadlinePassed = (dueDate) => {
  if (!dueDate || dueDate === "No Deadline" || dueDate === "N/A" || dueDate === "Flexible Deadline") return false;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return false;
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
};

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
        const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const mapped = rawList.map((p) => ({
          id: p.id,
          title: p.title,
          topic: p.category || "General DSA",
          difficulty: p.difficulty || "Medium",
          points: p.points || 100,
          solved: p.solve_status === "Solved",
          solveStatus: p.solve_status || "Unsolved",
          scoreObtained: p.marks_obtained ?? p.score_obtained ?? null,
          percentage: p.percentage ?? null,
          companies: p.tags ? (Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(",").map(t => t.trim()) : [])) : ["TCS", "Infosys"],
          solutionAvailable: true,
          description: p.description || "No problem description provided.",
          language: p.language || "",
          dueDate: (p.due_date || p.dueDate) ? new Date(p.due_date || p.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "No Deadline",
          rawDueDate: p.due_date || p.dueDate || null,
          isExpired: Boolean(p.isExpired || p.is_expired || (p.due_date && isDeadlinePassed(p.due_date))),
          attemptsCount: p.attempts_count ?? p.attemptsCount ?? 0,
          maxAttempts: p.max_attempts ?? 3,
        }));
        setProblemsList(mapped);
      } catch (err) {
        console.error("Failed to load student practice problems from DB:", err);
      }
    };
    loadProblems();

    window.addEventListener(EVENTS.CODING_UPDATED, loadProblems);
    window.addEventListener("codeSubmitted", loadProblems);
    window.addEventListener("portal_coding_updated", loadProblems);
    window.addEventListener("focus", loadProblems);

    return () => {
      window.removeEventListener(EVENTS.CODING_UPDATED, loadProblems);
      window.removeEventListener("codeSubmitted", loadProblems);
      window.removeEventListener("portal_coding_updated", loadProblems);
      window.removeEventListener("focus", loadProblems);
    };
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
          <Terminal size={24} style={{ color: "#2563eb", flexShrink: 0, marginRight: "10px" }} />
          <span>Coding Practice Problems</span>
        </h2>
        <p className="student-header-desc">Master Data Structures & Algorithms with pattern-based coding problems designed for campus placements.</p>
      </div>

      {/* Proper Stats Cards Row */}
      <div className="practice-metrics-grid">
        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <Code2 size={22} />
            </div>
            <span className="stat-badge">{completionRate}% Completed</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{solvedCount} <span className="stat-total">/ {totalProblemsCount}</span></div>
            <div className="stat-title">Problems Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <CheckCircle2 size={22} />
            </div>
            <span className="stat-badge">{easySolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{easySolved}</div>
            <div className="stat-title">Easy Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: `${easyPct}%` }} />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <Flame size={22} />
            </div>
            <span className="stat-badge">{mediumSolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{mediumSolved}</div>
            <div className="stat-title">Medium Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: `${mediumPct}%` }} />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <Flame size={22} />
            </div>
            <span className="stat-badge">{hardSolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{hardSolved}</div>
            <div className="stat-title">Hard Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: `${hardPct}%` }} />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <Trophy size={22} />
            </div>
            <span className="stat-badge">High Score</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{accuracyRate}%</div>
            <div className="stat-title">Accuracy Rate</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: `${accuracyRate}%` }} />
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
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
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
                <th>Title</th>
                <th>Topic</th>
                <th>Difficulty</th>
                <th>Status & Marks</th>
                <th>Due Date</th>
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
                filteredProblems.map((prob) => {
                  const isSolved = prob.solved || prob.solveStatus === "Solved";
                  const isPartial = prob.solveStatus === "Partial";
                  const hasAttempted = prob.solveStatus === "Attempted";
                  const isExpired = !isSolved && (Boolean(prob.isExpired) || (prob.dueDate && isDeadlinePassed(prob.dueDate)));
                  const attemptsUsed = prob.attemptsCount || 0;
                  const maxAttempts = prob.maxAttempts || 3;
                  const attemptsExhausted = attemptsUsed >= maxAttempts && !isSolved;

                  // Determine action button label
                  let btnLabel = "Solve";
                  if (isSolved) btnLabel = "Review";
                  else if (isExpired) btnLabel = "Expired";
                  else if (attemptsExhausted) btnLabel = `${maxAttempts}/${maxAttempts} Used`;
                  else if (attemptsUsed > 0) btnLabel = `Resume (${attemptsUsed}/${maxAttempts})`;

                  return (
                    <tr key={prob.id} className="problem-row">
                      <td>
                        <div className="prob-title-box">
                          <Link
                            to={`/student/coding-platform/practice-${prob.id}`}
                            state={{ task: { ...prob, isExpired }, source: 'practice', enterFullscreen: true }}
                            className="prob-title-link"
                            onClick={async () => {
                              try {
                                if (!document.fullscreenElement) {
                                  await document.documentElement.requestFullscreen?.();
                                }
                              } catch (err) {
                                console.warn("Fullscreen request error on practice title click:", err);
                              }
                            }}
                          >
                            {prob.title}
                          </Link>
                          <span className="prob-points">{prob.points} pts</span>
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
                      <td>
                        <div className="pp-status-col">
                          {isSolved ? (
                            <span className="pp-status-badge solved">
                              <CheckCircle2 size={13} /> {prob.scoreObtained != null ? `${prob.scoreObtained}/${prob.points} pts` : `${prob.points}/${prob.points} pts`}
                            </span>
                          ) : isExpired ? (
                            <span className="pp-status-badge expired">
                              <Lock size={12} /> Expired
                            </span>
                          ) : isPartial ? (
                            <span className="pp-status-badge partial">
                              <AlertCircle size={12} /> Partial • {prob.scoreObtained != null ? `${prob.scoreObtained}/${prob.points} pts` : "Partial"}
                            </span>
                          ) : hasAttempted ? (
                            <span className="pp-status-badge attempted">
                              <X size={12} strokeWidth={2.5} /> Attempted • 0/{prob.points} pts
                            </span>
                          ) : (
                            <span className="pp-status-badge unsolved">
                              Unsolved ({prob.points} pts)
                            </span>
                          )}

                          {/* Attempt tracking indicator */}
                          {attemptsUsed > 0 ? (
                            <span className={`pp-attempts-pill ${attemptsExhausted ? "exhausted" : "active"}`}>
                              <span style={{ fontSize: "8px" }}>●</span> {attemptsUsed}/{maxAttempts} attempts used
                            </span>
                          ) : (
                            <span className="pp-attempts-pill empty">
                              0/{maxAttempts} attempts used
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: isExpired ? '#dc2626' : (prob.dueDate && prob.dueDate !== 'No Deadline' && prob.dueDate !== 'N/A' ? '#ef4444' : '#94a3b8'), fontWeight: isExpired ? 700 : (prob.dueDate && prob.dueDate !== 'No Deadline' && prob.dueDate !== 'N/A' ? 600 : 400), fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          {prob.dueDate}
                          {isExpired && (
                            <span style={{ fontSize: '10px', background: '#fee2e2', color: '#991b1b', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>EXPIRED</span>
                          )}
                        </span>
                      </td>

                      <td className="pp-td-action">
                        <Button
                          size="sm"
                          className="solve-btn"
                          disabled={attemptsExhausted}
                          onClick={async () => {
                            if (attemptsExhausted) return;
                            try {
                              if (!document.fullscreenElement) {
                                await document.documentElement.requestFullscreen?.();
                              }
                            } catch (err) {
                              console.warn("Fullscreen request error on solve click:", err);
                            }
                            navigate(`/student/coding-platform/practice-${prob.id}`, { 
                              state: { task: { ...prob, isExpired }, source: 'practice', enterFullscreen: true } 
                            });
                          }}
                          style={
                            attemptsExhausted
                              ? { background: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0', cursor: 'not-allowed' }
                              : isExpired
                              ? { background: '#f1f5f9', color: '#64748b', borderColor: '#cbd5e1' }
                              : {}
                          }
                        >
                          <Terminal size={14} /> {btnLabel}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
