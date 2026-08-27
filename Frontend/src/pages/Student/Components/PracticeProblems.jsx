import { useState, useEffect } from "react";
import { apiFetch } from "../../../utils/api";
import {
  Code2, Search, Filter, CheckCircle2, Circle, Flame, Trophy,
  BookOpen, Sparkles, ChevronRight, Play, Award, ArrowUpRight,
  Bookmark, Sliders, ExternalLink, Cpu, Terminal
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import "../Styles/PracticeProblems.css";

const practiceProblemsData = [
  {
    id: 1,
    title: "Two Sum",
    topic: "Arrays & Hashing",
    difficulty: "Easy",
    acceptance: "49.2%",
    points: 100,
    solved: true,
    companies: ["TCS", "Infosys", "Amazon"],
    solutionAvailable: true
  },
  {
    id: 2,
    title: "Longest Substring Without Repeating Characters",
    topic: "Sliding Window",
    difficulty: "Medium",
    acceptance: "33.8%",
    points: 200,
    solved: true,
    companies: ["Wipro", "Capgemini", "Google"],
    solutionAvailable: true
  },
  {
    id: 3,
    title: "Reverse Linked List",
    topic: "Linked List",
    difficulty: "Easy",
    acceptance: "72.4%",
    points: 100,
    solved: true,
    companies: ["Cognizant", "TCS"],
    solutionAvailable: true
  },
  {
    id: 4,
    title: "Binary Tree Level Order Traversal",
    topic: "Trees & Graphs",
    difficulty: "Medium",
    acceptance: "64.1%",
    points: 150,
    solved: false,
    companies: ["Accenture", "Microsoft"],
    solutionAvailable: true
  },
  {
    id: 5,
    title: "Container With Most Water",
    topic: "Two Pointers",
    difficulty: "Medium",
    acceptance: "54.3%",
    points: 180,
    solved: false,
    companies: ["Tech Mahindra", "Amazon"],
    solutionAvailable: true
  },
  {
    id: 6,
    title: "Merge K Sorted Lists",
    topic: "Heap / Priority Queue",
    difficulty: "Hard",
    acceptance: "51.0%",
    points: 300,
    solved: false,
    companies: ["Goldman Sachs", "Google"],
    solutionAvailable: true
  },
  {
    id: 7,
    title: "Valid Anagram",
    topic: "Arrays & Hashing",
    difficulty: "Easy",
    acceptance: "63.2%",
    points: 100,
    solved: true,
    companies: ["LTI Mindtree", "TCS"],
    solutionAvailable: true
  },
  {
    id: 8,
    title: "Climbing Stairs",
    topic: "Dynamic Programming",
    difficulty: "Easy",
    acceptance: "52.1%",
    points: 120,
    solved: true,
    companies: ["Infosys", "Wipro"],
    solutionAvailable: true
  },
  {
    id: 9,
    title: "Course Schedule (Graph Cycle Detection)",
    topic: "Trees & Graphs",
    difficulty: "Medium",
    acceptance: "46.8%",
    points: 220,
    solved: false,
    companies: ["Amazon", "Uber"],
    solutionAvailable: true
  },
  {
    id: 10,
    title: "Word Break",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    acceptance: "45.9%",
    points: 250,
    solved: false,
    companies: ["Oracle", "Microsoft"],
    solutionAvailable: true
  }
];

const practiceTracks = [
  {
    title: "Top 75 Blind Coding Essentials",
    count: "75 Problems",
    level: "All Levels",
    desc: "Most frequently asked DSA questions for campus recruitment placements.",
    icon: Flame,
    color: "#f59e0b",
    bg: "#fef3c7"
  },
  {
    title: "Product Based Company Track",
    count: "50 Problems",
    level: "Medium - Hard",
    desc: "Curated problem set targeted for Tier-1 technology companies.",
    icon: Trophy,
    color: "#2563eb",
    bg: "#dbeafe"
  },
  {
    title: "Service Based Company Essentials",
    count: "40 Problems",
    level: "Easy - Medium",
    desc: "Pattern-based coding questions for TCS NQT, Wipro NLTH, Infosys DSE.",
    icon: Award,
    color: "#10b981",
    bg: "#d1fae5"
  }
];

export default function PracticeProblems() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [problemsList, setProblemsList] = useState(practiceProblemsData);

  useEffect(() => {
    apiFetch("/student/practice-problems")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map(p => ({
            id: p.id,
            title: p.title,
            topic: p.category || "General DSA",
            difficulty: p.difficulty,
            acceptance: "65.0%",
            points: p.points || 100,
            solved: p.solve_status === "Solved",
            companies: ["TCS", "Infosys"],
            solutionAvailable: true
          }));
          setProblemsList(mapped);
        }
      })
      .catch((err) => console.error("PRACTICE PROBLEMS FETCH ERROR:", err));
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

  const solvedCount = practiceProblemsData.filter(p => p.solved).length;

  return (
    <div className="student-page-inner stack-6">
      <SectionHeader
        eyebrow="C2C TRAINING PROGRAM"
        title="Coding Practice Problems"
        description="Master Data Structures & Algorithms with pattern-based coding problems designed for campus placements."
      />

      {/* Proper Stats Cards Row */}
      <div className="practice-metrics-grid">
        <div className="stat-card-modern card-blue">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-blue-soft">
              <Code2 size={22} />
            </div>
            <span className="stat-badge badge-blue">50% Completed</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{solvedCount} <span className="stat-total">/ {practiceProblemsData.length}</span></div>
            <div className="stat-title">Problems Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-blue-bar" style={{ width: "50%" }} />
          </div>
        </div>

        <div className="stat-card-modern card-emerald">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-emerald-soft">
              <CheckCircle2 size={22} />
            </div>
            <span className="stat-badge badge-emerald">5 Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-emerald">5</div>
            <div className="stat-title">Easy Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-emerald-bar" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="stat-card-modern card-amber">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-amber-soft">
              <Flame size={22} />
            </div>
            <span className="stat-badge badge-amber">1 Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-amber">1</div>
            <div className="stat-title">Medium Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-amber-bar" style={{ width: "25%" }} />
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
            <div className="stat-number text-purple">88%</div>
            <div className="stat-title">Accuracy Rate</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-purple-bar" style={{ width: "88%" }} />
          </div>
        </div>
      </div>


      {/* Recommended Practice Tracks */}
      <div className="tracks-section">
        <h3 className="section-title">
          <Trophy size={18} className="text-amber" /> Recommended Practice Tracks
        </h3>
        <div className="tracks-grid">
          {practiceTracks.map((track, i) => {
            const Icon = track.icon;
            return (
              <div key={i} className="track-card">
                <div className="track-card-header">
                  <div className="track-icon-box" style={{ background: track.bg, color: track.color }}>
                    <Icon size={22} />
                  </div>
                  <span className="track-level-tag">{track.level}</span>
                </div>
                <h4 className="track-title">{track.title}</h4>
                <p className="track-desc">{track.desc}</p>
                <div className="track-card-footer">
                  <span className="track-count">{track.count}</span>
                  <button className="track-start-btn" onClick={() => navigate("/student/coding-platform")}>
                    Start Track <ChevronRight size={14} />
                  </button>
                </div>

              </div>
            );
          })}
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
      <div className="problems-table-card">
        <div className="table-header-info">
          <h3>All Practice Problems ({filteredProblems.length})</h3>
          <span className="table-sub">Click 'Solve' to launch live compiler and test cases</span>
        </div>

        <div className="problems-table-wrapper">
          <table className="problems-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Status</th>
                <th>Title</th>
                <th>Topic</th>
                <th>Difficulty</th>
                <th>Acceptance</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No practice problems found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((prob) => (
                  <tr key={prob.id} className="problem-row">
                    <td>
                      {prob.solved ? (
                        <CheckCircle2 size={18} className="solved-icon" title="Solved" />
                      ) : (
                        <Circle size={18} className="unsolved-icon" title="Unsolved" />
                      )}
                    </td>
                    <td>
                      <div className="prob-title-box">
                        <Link to="/student/coding-platform" className="prob-title-link">
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

                    <td style={{ textAlign: "right" }}>
                      <Button
                        size="sm"
                        className="solve-btn"
                        onClick={() => navigate("/student/coding-platform")}
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
