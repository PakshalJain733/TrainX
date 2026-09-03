import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  CircleDot,
  Lock,
  ArrowRight,
  BookOpen,
  Code2,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import "../Styles/AiRoadmap.css";

const careerTracks = [
  { id: "python-backend", name: "Python Backend Developer" },
  { id: "react-frontend", name: "React Frontend Developer" },
  { id: "fullstack", name: "Full Stack Engineer" },
  { id: "data-ai", name: "Data Science & AI Engineer" },
  { id: "cloud-devops", name: "Cloud & DevOps Specialist" },
];

const roadmapData = {
  "python-backend": [
    {
      id: 1,
      title: "Milestone 1: Python Fundamentals",
      desc: "Syntax, data types, control flow, functions and error handling.",
      status: "completed",
      progress: 100,
      tags: ["Variables & Types", "Loops", "Functions", "Exceptions"],
      quizzes: 4,
      exercises: 12,
    },
    {
      id: 2,
      title: "Milestone 2: Object Oriented Programming",
      desc: "Classes, inheritance, polymorphism and design principles.",
      status: "completed",
      progress: 100,
      tags: ["Classes", "Inheritance", "Magic Methods", "SOLID"],
      quizzes: 3,
      exercises: 10,
    },
    {
      id: 3,
      title: "Milestone 3: SQL & Databases",
      desc: "Relational modelling, joins, indexing and query optimisation.",
      status: "in-progress",
      progress: 55,
      tags: ["Joins", "Aggregations", "Indexes", "Transactions"],
      quizzes: 3,
      exercises: 8,
    },
    {
      id: 4,
      title: "Milestone 4: REST APIs with FastAPI",
      desc: "Routing, validation, auth and API documentation.",
      status: "in-progress",
      progress: 20,
      tags: ["Routing", "Pydantic", "JWT Auth", "Testing"],
      quizzes: 2,
      exercises: 9,
    },
    {
      id: 5,
      title: "Milestone 5: React Frontend Basics",
      desc: "Components, state, hooks and consuming APIs.",
      status: "locked",
      progress: 0,
      tags: ["JSX", "Hooks", "Routing", "State"],
      quizzes: 3,
      exercises: 10,
    },
    {
      id: 6,
      title: "Milestone 6: Capstone Projects",
      desc: "Two end-to-end projects reviewed by your mentor.",
      status: "locked",
      progress: 0,
      tags: ["Project Planning", "Deployment", "Code Review"],
      quizzes: 1,
      exercises: 4,
    },
    {
      id: 7,
      title: "Milestone 7: Interview Preparation",
      desc: "DSA revision, system design basics and AI mock interviews.",
      status: "locked",
      progress: 0,
      tags: ["DSA", "HR Round", "System Design"],
      quizzes: 4,
      exercises: 15,
    },
  ],
  "react-frontend": [
    {
      id: 1,
      title: "Milestone 1: Modern JavaScript (ES6+)",
      desc: "Async/await, closures, prototypes, array methods, and event loop.",
      status: "completed",
      progress: 100,
      tags: ["ES6 Modules", "Promises", "Destructuring", "DOM API"],
      quizzes: 5,
      exercises: 14,
    },
    {
      id: 2,
      title: "Milestone 2: React Core & Component Design",
      desc: "JSX, virtual DOM, props vs state, and component life cycles.",
      status: "in-progress",
      progress: 70,
      tags: ["Components", "Props", "Hooks", "Event Handling"],
      quizzes: 4,
      exercises: 12,
    },
    {
      id: 3,
      title: "Milestone 3: State Management & Routing",
      desc: "Zustand, Context API, Redux Toolkit, and React Router v6.",
      status: "locked",
      progress: 0,
      tags: ["Context API", "Zustand", "React Router", "Global State"],
      quizzes: 3,
      exercises: 8,
    },
    {
      id: 4,
      title: "Milestone 4: Performance & Production Deployment",
      desc: "Memoization, lazy loading, Vite bundling, and CI/CD hosting.",
      status: "locked",
      progress: 0,
      tags: ["UseMemo", "Code Splitting", "Vite", "Vercel"],
      quizzes: 2,
      exercises: 6,
    },
  ],
  fullstack: [
    {
      id: 1,
      title: "Milestone 1: Full Stack Architecture Foundations",
      desc: "Client-Server model, HTTP protocols, REST conventions, and MVC.",
      status: "completed",
      progress: 100,
      tags: ["HTTP/HTTPS", "REST", "JSON", "Architecture"],
      quizzes: 3,
      exercises: 8,
    },
    {
      id: 2,
      title: "Milestone 2: Backend & Database Engineering",
      desc: "Node.js / Express or Python backend with PostgreSQL and ORM.",
      status: "in-progress",
      progress: 45,
      tags: ["Express", "PostgreSQL", "Prisma", "Authentication"],
      quizzes: 4,
      exercises: 12,
    },
    {
      id: 3,
      title: "Milestone 3: Frontend Integration & State",
      desc: "Connecting React frontend with resilient API clients and caching.",
      status: "locked",
      progress: 0,
      tags: ["Axios", "TanStack Query", "Forms", "UI Layouts"],
      quizzes: 3,
      exercises: 10,
    },
  ],
};

export default function AIRoadmap() {
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [milestones, setMilestones] = useState(roadmapData["python-backend"]);

  const handleGenerate = () => {
    if (!inputValue.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const baseMap = roadmapData["fullstack"];
      const newMap = baseMap.map(m => ({
        ...m,
        title: m.id === 1 ? `Milestone 1: ${inputValue} Foundations` : m.title,
        status: "locked",
        progress: 0
      }));
      newMap[0].status = "in-progress";
      
      setMilestones(newMap);
      setIsGenerating(false);
      setInputValue("");
    }, 1200);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "in-progress":
        return <Badge variant="default">In Progress</Badge>;
      case "locked":
      default:
        return <Badge variant="outline">Locked</Badge>;
    }
  };

  return (
    <div className="roadmap-container">
      {/* Career Goal Card */}
      <div className="roadmap-generator-card">
        <div className="roadmap-generator-header">
          <Sparkles size={20} className="roadmap-generator-icon" />
          <div>
            <h2 className="roadmap-generator-title">Enter your career / skill goal</h2>
            <p className="roadmap-generator-subtitle">
              Type any course or skill goal — AI will build a personalized milestone roadmap for you.
            </p>
          </div>
        </div>

        <div className="roadmap-controls-row">
          <input
            type="text"
            className="roadmap-select-input"
            placeholder="e.g. Data Science, Web3, iOS App Development..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            className={`roadmap-gen-btn ${isGenerating ? "roadmap-gen-btn--loading" : ""}`}
            onClick={handleGenerate}
            disabled={isGenerating || !inputValue.trim()}
          >
            {isGenerating ? (
              <>
                <span className="roadmap-spinner" />
                Generating Roadmap...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Roadmap
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="roadmap-timeline">
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`roadmap-milestone-wrapper milestone-status-${m.status}`}
          >
            <div className="roadmap-milestone-indicator">
              {m.status === "completed" && <CheckCircle2 size={20} />}
              {m.status === "in-progress" && <CircleDot size={20} />}
              {m.status === "locked" && <Lock size={18} />}
            </div>

            <div className="roadmap-milestone-card">
              <div className="milestone-card-header">
                <h3 className="milestone-title">{m.title}</h3>
                {getStatusBadge(m.status)}
              </div>

              <p className="milestone-desc">{m.desc}</p>

              <div className="milestone-progress-bar-wrap">
                <div
                  className="milestone-progress-bar-fill"
                  style={{ width: `${m.progress}%` }}
                />
              </div>

              <div className="milestone-footer-row">
                <div className="milestone-tags-list">
                  {m.tags.map((tag) => (
                    <span key={tag} className="milestone-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="milestone-stats-meta">
                  {m.quizzes} quizzes · {m.exercises} coding exercises
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
