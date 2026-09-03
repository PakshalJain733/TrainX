import React, { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  FileText,
  Video,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/LearningContent.css";

const initialResources = [
  {
    id: 1,
    title: "Mastering SQL Joins",
    category: "SQL & Databases",
    type: "AI Notes",
    duration: "25 min",
    status: "Completed",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "Indexing & Query Plans",
    category: "SQL & Databases",
    type: "Article",
    duration: "18 min",
    status: "Pending",
    icon: FileText,
  },
  {
    id: 3,
    title: "Transactions and ACID Properties",
    category: "SQL & Databases",
    type: "Video",
    duration: "32 min",
    status: "Pending",
    icon: Video,
  },
  {
    id: 4,
    title: "Designing Clean REST Endpoints",
    category: "REST APIs with FastAPI",
    type: "AI Notes",
    duration: "22 min",
    status: "Completed",
    icon: Sparkles,
  },
  {
    id: 5,
    title: "JWT Authentication Explained",
    category: "REST APIs with FastAPI",
    type: "Video",
    duration: "28 min",
    status: "Pending",
    icon: Video,
  },
  {
    id: 6,
    title: "SOLID Principles in Python",
    category: "Object Oriented Programming",
    type: "Article",
    duration: "20 min",
    status: "Completed",
    icon: FileText,
  },
  {
    id: 7,
    title: "Advanced Pydantic Validation",
    category: "REST APIs with FastAPI",
    type: "Article",
    duration: "15 min",
    status: "Pending",
    icon: FileText,
  },
  {
    id: 8,
    title: "Database Sharding & Replication",
    category: "SQL & Databases",
    type: "AI Notes",
    duration: "30 min",
    status: "Pending",
    icon: Sparkles,
  },
];

const allTopics = [
  "Variables & Types",
  "Loops",
  "Functions",
  "Exceptions",
  "Classes",
  "Inheritance",
  "Magic Methods",
  "SOLID",
  "Joins",
  "Aggregations",
  "Indexes",
  "Transactions",
  "Routing",
  "Pydantic",
  "JWT Auth",
  "Testing",
  "JSX",
  "Hooks",
  "Routing",
  "State",
  "Project Planning",
  "Deployment",
  "Code Review",
  "DSA",
  "HR Round",
  "System Design",
];

export default function LearningContent() {
  const [resources, setResources] = useState(initialResources);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All resources");

  const categories = ["All resources", "SQL & Databases", "REST APIs with FastAPI", "Object Oriented Programming"];

  const toggleStatus = (id) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "Completed" ? "Pending" : "Completed" }
          : r
      )
    );
  };

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "All resources" || item.category === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [resources, searchQuery, selectedFilter]);

  return (
    <div className="learning-content-page">
      {/* Search and Category Filter Card */}
      <div className="learning-search-card">
        <div className="learning-search-bar">
          <Search size={18} className="learning-search-icon" />
          <input
            type="text"
            className="learning-search-input"
            placeholder="Search topics or study resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="learning-filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`learning-filter-btn ${
                selectedFilter === cat ? "active" : ""
              }`}
              onClick={() => setSelectedFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="learning-resources-grid">
        {filteredResources.map((item) => {
          const IconComponent = item.icon;
          const isCompleted = item.status === "Completed";
          return (
            <div key={item.id} className="learning-resource-card">
              <div className="learning-card-top">
                <div className="learning-type-icon-wrap">
                  <IconComponent size={18} />
                </div>
              </div>

              <div className="learning-card-body">
                <h3 className="learning-card-title">{item.title}</h3>
                <p className="learning-card-meta">
                  {item.category} · {item.type} · {item.duration}
                </p>
              </div>

              {isCompleted ? (
                <div className="learning-completed-label">
                  <CheckCircle2 size={15} className="learning-completed-icon" />
                  Completed
                </div>
              ) : (
                <button
                  className="learning-toggle-btn btn-mark-complete"
                  onClick={() => toggleStatus(item.id)}
                >
                  Mark complete
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Topic Mastery Coverage */}
      <div className="topic-coverage-card">
        <div className="topic-coverage-header">
          <BookOpen size={18} className="text-blue-600" />
          <span>Topic coverage</span>
        </div>
        <p className="topic-coverage-subtitle">
          Topics and skills unlocked across your personal curriculum roadmap
        </p>

        <div className="topic-coverage-tags">
          {allTopics.map((topic, idx) => (
            <span key={idx} className="topic-coverage-tag-pill">
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
