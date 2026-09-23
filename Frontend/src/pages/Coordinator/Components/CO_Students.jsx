import { useState, useEffect } from "react";
import { apiFetch } from "../../../utils/api";
import {
  Search,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  Sparkles,
  CheckCircle2,
  CircleDot,
  Lock,
  BookOpen,
  MapPin,
  TrendingUp,
  ArrowLeft,
  Award,
  Send,
  UserCheck,
  Target,
} from "lucide-react";
import { coordinatorStudents, coordinatorBatches } from "../../../data/coordinatorMockData";
import CustomSelect from "../../../components/ui/CustomSelect";
import { batchAPI } from "../../../services/api";
import { EVENTS } from "../../../utils/sharedStore";
import "../Styles/CO_Students.css";

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
      progress: 65,
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
  "data-ai": [
    {
      id: 1,
      title: "Milestone 1: Python for Data Science & Pandas",
      desc: "NumPy vectorization, Pandas DataFrames, and data cleaning.",
      status: "completed",
      progress: 100,
      tags: ["NumPy", "Pandas", "Data Cleaning", "Matplotlib"],
      quizzes: 4,
      exercises: 15,
    },
    {
      id: 2,
      title: "Milestone 2: Classical Machine Learning",
      desc: "Supervised & Unsupervised ML algorithms, Scikit-learn, and evaluation.",
      status: "completed",
      progress: 100,
      tags: ["Regression", "Random Forest", "K-Means", "Scikit-Learn"],
      quizzes: 5,
      exercises: 14,
    },
    {
      id: 3,
      title: "Milestone 3: Deep Learning & PyTorch",
      desc: "Neural network architectures, Backpropagation, and PyTorch tensors.",
      status: "in-progress",
      progress: 40,
      tags: ["PyTorch", "CNNs", "Loss Functions", "Tensors"],
      quizzes: 3,
      exercises: 10,
    },
  ],
  "cloud-devops": [
    {
      id: 1,
      title: "Milestone 1: Linux Administration & Shell Scripting",
      desc: "Bash commands, file permissions, networking, and systemd services.",
      status: "completed",
      progress: 100,
      tags: ["Linux", "Bash", "SSH", "Systemd"],
      quizzes: 4,
      exercises: 10,
    },
    {
      id: 2,
      title: "Milestone 2: Docker Containerization",
      desc: "Building Dockerfiles, multi-stage builds, and Docker Compose.",
      status: "in-progress",
      progress: 80,
      tags: ["Docker", "Containers", "Images", "Compose"],
      quizzes: 3,
      exercises: 9,
    },
    {
      id: 3,
      title: "Milestone 3: Kubernetes & AWS Cloud",
      desc: "Cluster orchestration, Pods, Deployments, and AWS EKS.",
      status: "locked",
      progress: 0,
      tags: ["Kubernetes", "AWS EKS", "Ingress", "Helm"],
      quizzes: 4,
      exercises: 11,
    },
  ],
};

export default function CoordinatorStudents() {
  const [students, setStudents] = useState([]);
  const [batchesList, setBatchesList] = useState(coordinatorBatches);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap"); // 'roadmap', 'overview', 'skills'
  const [selectedGoal, setSelectedGoal] = useState("python-backend");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getBatches();
      if (Array.isArray(data) && data.length > 0) {
        setBatchesList(data);
      }
    } catch (err) {
      console.warn("Using local batches fallback in CO_Students.");
    }
  };

  const getCoordinatorDept = () => {
    try {
      const local = JSON.parse(localStorage.getItem("user") || "{}");
      return local.department || local.dept || null;
    } catch {
      return null;
    }
  };
  const coordDept = getCoordinatorDept();

  useEffect(() => {
    setLoading(true);
    fetchBatches();
    const handleBatchUpdate = () => fetchBatches();
    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);

    apiFetch("/coordinator/students")
      .then((res) => {
        let fetched = [];
        if (res && res.data && Array.isArray(res.data)) {
          fetched = res.data;
        } else if (res && res.students && Array.isArray(res.students)) {
          fetched = res.students;
        } else {
          fetched = coordinatorStudents;
        }
        if (coordDept && fetched.length > 0) {
          const targetDept = coordDept.toLowerCase();
          const deptFiltered = fetched.filter(s => 
            !s.department || 
            s.department.toLowerCase().includes(targetDept) || 
            targetDept.includes(s.department.toLowerCase())
          );
          setStudents(deptFiltered.length > 0 ? deptFiltered : fetched);
        } else {
          setStudents(fetched);
        }
      })
      .catch(() => {
        if (coordDept) {
          const targetDept = coordDept.toLowerCase();
          const deptFiltered = coordinatorStudents.filter(s => 
            !s.department || 
            s.department.toLowerCase().includes(targetDept) || 
            targetDept.includes(s.department.toLowerCase())
          );
          setStudents(deptFiltered);
        } else {
          setStudents(coordinatorStudents);
        }
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
  }, []);

  const handleOpenStudentDetail = (student) => {
    setSelectedStudent(student);
    setSelectedGoal(student.selectedGoal || "python-backend");
    setActiveTab("roadmap");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNo || s.roll_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === "All" || s.batch === batchFilter;
    const matchesRisk = riskFilter === "All" || s.riskStatus === riskFilter;
    const matchesDept = !coordDept || !s.department || s.department.toLowerCase().includes(coordDept.toLowerCase()) || coordDept.toLowerCase().includes(s.department.toLowerCase());
    return matchesSearch && matchesBatch && matchesRisk && matchesDept;
  });

  const milestones = roadmapData[selectedGoal] || roadmapData["python-backend"];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
            }}
          >
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            In Progress
          </span>
        );
      case "locked":
      default:
        return (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#f1f5f9",
              color: "#64748b",
              border: "1px solid #cbd5e1",
            }}
          >
            Locked
          </span>
        );
    }
  };

  // FULLSCREEN STUDENT DETAIL VIEW (NO MODAL POPUP)
  if (selectedStudent) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Back Navigation Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            className="coord-btn"
            style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#334155" }}
            onClick={() => setSelectedStudent(null)}
          >
            <ArrowLeft size={16} /> Back to Student Directory
          </button>

          <span
            className={`coord-student-pill ${
              selectedStudent.riskStatus === "Top Performer"
                ? "coord-student-pill--top"
                : selectedStudent.riskStatus === "Good"
                ? "coord-student-pill--good"
                : selectedStudent.riskStatus === "Moderate"
                ? "coord-student-pill--moderate"
                : "coord-student-pill--risk"
            }`}
            style={{ padding: "6px 14px", fontSize: "12px" }}
          >
            {selectedStudent.riskStatus}
          </span>
        </div>

        {/* Student Profile Overview Header Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "24px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 8px 24px rgba(30, 27, 75, 0.15)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
                }}
              >
                {selectedStudent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>{selectedStudent.name}</h1>
                <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.8)", margin: "4px 0 0 0" }}>
                  Roll No: <strong>{selectedStudent.rollNo}</strong> · Batch: <strong>{selectedStudent.batch}</strong> ({selectedStudent.department})
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", marginTop: "16px", fontSize: "13px", color: "rgba(255, 255, 255, 0.9)" }}>
              <span>
                <Mail size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} /> {selectedStudent.email}
              </span>
              <span>
                <Phone size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} /> {selectedStudent.phone}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", textAlign: "right" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.1)", padding: "12px 18px", borderRadius: "12px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>Attendance</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#34d399" }}>{selectedStudent.attendance}%</div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.1)", padding: "12px 18px", borderRadius: "12px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>Quiz Average</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#818cf8" }}>{selectedStudent.avgScore}%</div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.1)", padding: "12px 18px", borderRadius: "12px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>AI Interview</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#c084fc" }}>{selectedStudent.interviewScore}%</div>
            </div>
          </div>
        </div>

        {/* Fullscreen Navigation Tabs Bar */}
        <div className="coord-tabs-bar" style={{ marginBottom: "8px" }}>
          <button
            className={`coord-tab-btn ${activeTab === "roadmap" ? "coord-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("roadmap")}
          >
            <Sparkles size={16} /> Selected AI Career Roadmap
          </button>
          <button
            className={`coord-tab-btn ${activeTab === "overview" ? "coord-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <GraduationCap size={16} /> Academic Scores & Placement Readiness
          </button>
        </div>

        {/* TAB 1: FULLSCREEN AI ROADMAP INTERFACE */}
        {activeTab === "roadmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Career Goal Generator Card */}
            <div className="student-roadmap-generator-card">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Sparkles size={22} color="#2563eb" />
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Select career / skill goal
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                    AI analyses student goal, current scores and skill gaps to build their personalized roadmap.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", marginTop: "4px" }}>
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <CustomSelect
                    value={selectedGoal}
                    options={careerTracks.map(t => ({ value: t.id, label: t.name }))}
                    onChange={(val) => setSelectedGoal(val)}
                    placeholder="Select career / skill goal..."
                    icon={Target}
                  />
                </div>

                <button
                  className="coord-btn coord-btn--primary"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  style={{ padding: "10px 22px" }}
                >
                  <Sparkles size={16} />
                  {isGenerating ? "Generating Roadmap..." : "Generate roadmap"}
                </button>
              </div>
            </div>

            {/* Milestones Timeline */}
            <div className="student-roadmap-timeline">
              {milestones.map((m) => (
                <div key={m.id} className={`student-roadmap-milestone-card milestone-status-${m.status}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {m.status === "completed" && <CheckCircle2 size={20} color="#10b981" />}
                      {m.status === "in-progress" && <CircleDot size={20} color="#2563eb" />}
                      {m.status === "locked" && <Lock size={18} color="#94a3b8" />}
                      <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        {m.title}
                      </h4>
                    </div>
                    {getStatusBadge(m.status)}
                  </div>

                  <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 14px 0" }}>{m.desc}</p>

                  {/* Progress Bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "7px",
                      background: "#f1f5f9",
                      borderRadius: "999px",
                      overflow: "hidden",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${m.progress}%`,
                        background: m.status === "completed" ? "#10b981" : "#2563eb",
                        borderRadius: "999px",
                      }}
                    />
                  </div>

                  {/* Tags & Meta Stats */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {m.tags.map((tag) => (
                        <span key={tag} className="student-tag-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 500 }}>
                      {m.quizzes} quizzes · {m.exercises} coding exercises
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: OVERVIEW & ACADEMICS */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="coord-card">
              <div className="coord-card-title">Placement Readiness Audit</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#4f46e5", marginTop: "4px" }}>
                {selectedStudent.placementStatus}
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                Candidate has cleared department criteria and is currently eligible for tier-1 partner recruitment drives.
              </p>
            </div>

            <div className="coord-card">
              <div className="coord-card-title">Coordinator Actions & Warnings</div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  className="coord-btn coord-btn--primary"
                  onClick={() => alert(`Warning notice sent to ${selectedStudent.name}`)}
                >
                  <Send size={15} /> Send Counseling Warning
                </button>
                <button
                  className="coord-btn"
                  style={{ background: "#ecfdf5", color: "#047857" }}
                  onClick={() => alert(`Medical override granted for ${selectedStudent.name}`)}
                >
                  Grant Attendance Medical Override
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT STUDENT DIRECTORY TABLE VIEW
  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Student Directory & AI Roadmap Audit</h1>
          <p className="coord-page-sub">
            Monitor student attendance %, academic scores, selected AI career roadmaps, and risk level.
          </p>
        </div>
      </div>

      <div className="coord-filter-bar" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-start", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "340px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#64748b" }} />
          <input
            type="text"
            className="coord-search-input"
            placeholder="Search student name, roll no or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px", width: "100%", height: "40px", borderRadius: "10px" }}
          />
        </div>

        <div style={{ flex: "1 1 200px", maxWidth: "240px" }}>
          <CustomSelect
            value={batchFilter}
            options={[
              { value: "All", label: "All Batches" },
              ...batchesList.map((b) => ({ value: b.name, label: b.name }))
            ]}
            onChange={(val) => setBatchFilter(val)}
            placeholder="Select batch..."
          />
        </div>

        <div style={{ flex: "1 1 200px", maxWidth: "240px" }}>
          <CustomSelect
            value={riskFilter}
            options={[
              { value: "All", label: "All Risk Levels" },
              { value: "Top Performer", label: "Top Performer" },
              { value: "Good", label: "Good Standing" },
              { value: "Moderate", label: "Moderate Risk" },
              { value: "High Risk", label: "High Risk" },
            ]}
            onChange={(val) => setRiskFilter(val)}
            placeholder="Select risk level..."
          />
        </div>
      </div>

      <div className="coord-table-card">
        <table className="coord-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll No & Batch</th>
              <th>Selected AI Roadmap</th>
              <th>Attendance</th>
              <th>Quiz Score</th>
              <th>AI Interview</th>
              <th>Risk Level</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{s.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{s.email}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: "#334155" }}>{s.rollNo}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{s.batch}</div>
                </td>
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#2563eb",
                      background: "#eff6ff",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <Sparkles size={13} color="#2563eb" />
                    {s.selectedGoalName || "Python Backend"}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      fontWeight: 700,
                      color: s.attendance >= 90 ? "#059669" : s.attendance >= 75 ? "#d97706" : "#dc2626",
                    }}
                  >
                    {s.attendance}%
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: "#4f46e5" }}>{s.avgScore}%</span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: "#7c3aed" }}>{s.interviewScore}%</span>
                </td>
                <td>
                  <span
                    className={`coord-student-pill ${
                      s.riskStatus === "Top Performer"
                        ? "coord-student-pill--top"
                        : s.riskStatus === "Good"
                        ? "coord-student-pill--good"
                        : s.riskStatus === "Moderate"
                        ? "coord-student-pill--moderate"
                        : "coord-student-pill--risk"
                    }`}
                  >
                    {s.riskStatus}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <button
                    className="coord-btn coord-btn--primary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => handleOpenStudentDetail(s)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
