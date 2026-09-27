import { useState, useEffect } from "react";
import { apiFetch } from "../../../utils/api";
import {
  Search,
  GraduationCap,
  Mail,
  Phone,
  Sparkles,
  CheckCircle2,
  CircleDot,
  Lock,
  ArrowLeft,
  Send,
  Target,
} from "lucide-react";
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
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap");
  const [selectedGoal, setSelectedGoal] = useState("python-backend");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getBatches();
      if (Array.isArray(data) && data.length > 0) {
        setBatchesList(data);
      } else {
        setBatchesList([]);
      }
    } catch (err) {
      setBatchesList([]);
    }
  };

  const getCoordinatorDept = () => {
    try {
      const local = JSON.parse(sessionStorage.getItem("user") || "{}");
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
          fetched = [];
        }
        if (coordDept && fetched.length > 0) {
          const targetDept = coordDept.toLowerCase();
          const deptFiltered = fetched.filter(s => 
            !s.department || 
            s.department.toLowerCase().includes(targetDept) || 
            targetDept.includes(s.department.toLowerCase())
          );
          setStudents(deptFiltered);
        } else {
          setStudents(fetched);
        }
      })
      .catch(() => {
        setStudents([]);
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
        return <span className="status-badge-completed">Completed</span>;
      case "in-progress":
        return <span className="status-badge-progress">In Progress</span>;
      case "locked":
      default:
        return <span className="status-badge-locked">Locked</span>;
    }
  };

  // FULLSCREEN STUDENT DETAIL VIEW
  if (selectedStudent) {
    return (
      <div className="student-detail-wrapper">
        {/* Top Back Navigation Bar */}
        <div className="student-detail-top-nav">
          <button
            className="coord-btn student-btn-back"
            onClick={() => setSelectedStudent(null)}
          >
            <ArrowLeft size={16} /> Back to Student Directory
          </button>

          <span
            className={`coord-student-pill coord-student-pill--lg ${
              selectedStudent.riskStatus === "Top Performer"
                ? "coord-student-pill--top"
                : selectedStudent.riskStatus === "Good"
                ? "coord-student-pill--good"
                : selectedStudent.riskStatus === "Moderate"
                ? "coord-student-pill--moderate"
                : "coord-student-pill--risk"
            }`}
          >
            {selectedStudent.riskStatus}
          </span>
        </div>

        {/* Student Profile Overview Header Card */}
        <div className="student-detail-header-card">
          <div>
            <div className="student-detail-user-row">
              <div className="student-detail-avatar">
                {selectedStudent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h1 className="student-detail-title">{selectedStudent.name}</h1>
                <p className="student-detail-sub">
                  Roll No: <strong>{selectedStudent.rollNo}</strong> · Batch: <strong>{selectedStudent.batch}</strong> ({selectedStudent.department})
                </p>
              </div>
            </div>

            <div className="student-detail-contact-row">
              <span>
                <Mail size={14} className="student-detail-contact-icon" /> {selectedStudent.email}
              </span>
              <span>
                <Phone size={14} className="student-detail-contact-icon" /> {selectedStudent.phone}
              </span>
            </div>
          </div>

          <div className="student-detail-stats-group">
            <div className="student-detail-stat-box">
              <div className="student-detail-stat-label">Attendance</div>
              <div className="student-detail-stat-val student-detail-stat-val--attendance">{selectedStudent.attendance}%</div>
            </div>

            <div className="student-detail-stat-box">
              <div className="student-detail-stat-label">Quiz Average</div>
              <div className="student-detail-stat-val student-detail-stat-val--quiz">{selectedStudent.avgScore}%</div>
            </div>

            <div className="student-detail-stat-box">
              <div className="student-detail-stat-label">AI Interview</div>
              <div className="student-detail-stat-val student-detail-stat-val--interview">{selectedStudent.interviewScore}%</div>
            </div>
          </div>
        </div>

        {/* Fullscreen Navigation Tabs Bar */}
        <div className="coord-tabs-bar">
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
          <div className="student-detail-wrapper">
            {/* Career Goal Generator Card */}
            <div className="student-roadmap-generator-card">
              <div className="student-roadmap-title-row">
                <Sparkles size={22} color="#2563eb" />
                <div>
                  <h3 className="student-roadmap-generator-title">
                    Select career / skill goal
                  </h3>
                  <p className="student-roadmap-generator-desc">
                    AI analyses student goal, current scores and skill gaps to build their personalized roadmap.
                  </p>
                </div>
              </div>

              <div className="student-roadmap-actions-row">
                <div className="student-roadmap-select-input">
                  <CustomSelect
                    value={selectedGoal}
                    options={careerTracks.map(t => ({ value: t.id, label: t.name }))}
                    onChange={(val) => setSelectedGoal(val)}
                    placeholder="Select career / skill goal..."
                    icon={Target}
                  />
                </div>

                <button
                  className="coord-btn coord-btn--primary student-btn-generate"
                  onClick={handleGenerate}
                  disabled={isGenerating}
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
                  <div className="student-milestone-top-row">
                    <div className="student-milestone-title-group">
                      {m.status === "completed" && <CheckCircle2 size={20} color="#10b981" />}
                      {m.status === "in-progress" && <CircleDot size={20} color="#2563eb" />}
                      {m.status === "locked" && <Lock size={18} color="#94a3b8" />}
                      <h4 className="student-milestone-title">
                        {m.title}
                      </h4>
                    </div>
                    {getStatusBadge(m.status)}
                  </div>

                  <p className="student-milestone-desc">{m.desc}</p>

                  {/* Progress Bar */}
                  <div className="student-milestone-progress-track">
                    <div
                      className={`student-milestone-progress-bar ${m.status}`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>

                  {/* Tags & Meta Stats */}
                  <div className="student-milestone-meta-row">
                    <div className="student-tag-list">
                      {m.tags.map((tag) => (
                        <span key={tag} className="student-tag-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="student-milestone-stats-text">
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
          <div className="student-detail-wrapper">
            <div className="coord-card">
              <div className="coord-card-title">Placement Readiness Audit</div>
              <div className="student-readiness-badge">
                {selectedStudent.placementStatus}
              </div>
              <p className="student-readiness-desc">
                Candidate has cleared department criteria and is currently eligible for tier-1 partner recruitment drives.
              </p>
            </div>

            <div className="coord-card">
              <div className="coord-card-title">Coordinator Actions & Warnings</div>
              <div className="student-actions-row">
                <button
                  className="coord-btn coord-btn--primary"
                  onClick={() => alert(`Warning notice sent to ${selectedStudent.name}`)}
                >
                  <Send size={15} /> Send Counseling Warning
                </button>
                <button
                  className="coord-btn student-medical-btn"
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
    <div className="coord-students-container">
      <div className="coord-page-header">
        <div className="coord-header-left">
          <div className="coord-header-icon-box">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="coord-header-title-text">Student Directory & AI Roadmap Audit</h1>
            <p className="coord-header-sub-text">
              Monitor student attendance %, academic scores, selected AI career roadmaps, and risk level.
            </p>
          </div>
        </div>
      </div>

      <div className="coord-filter-row-wrap">
        <div className="coord-search-input-box">
          <Search size={16} className="coord-search-icon-pos" />
          <input
            type="text"
            className="coord-search-input-field"
            placeholder="Search student name, roll no or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="coord-filter-select-box">
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

        <div className="coord-filter-select-box">
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
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="student-table-name">{s.name}</div>
                  <div className="student-table-email">{s.email}</div>
                </td>
                <td>
                  <div className="student-table-roll">{s.rollNo}</div>
                  <div className="student-table-batch">{s.batch}</div>
                </td>
                <td>
                  <span className="student-roadmap-pill">
                    <Sparkles size={13} color="#2563eb" />
                    {s.selectedGoalName || "Python Backend"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      s.attendance >= 90
                        ? "student-score-green"
                        : s.attendance >= 75
                        ? "student-score-amber"
                        : "student-score-red"
                    }
                  >
                    {s.attendance}%
                  </span>
                </td>
                <td>
                  <span className="student-score-indigo">{s.avgScore}%</span>
                </td>
                <td>
                  <span className="student-score-purple">{s.interviewScore}%</span>
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
                <td className="text-center">
                  <button
                    className="coord-btn coord-btn--primary coord-table-action-btn"
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
