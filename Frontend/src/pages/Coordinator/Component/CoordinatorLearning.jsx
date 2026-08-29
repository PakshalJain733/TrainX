import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  Code2,
  Video,
  FileText
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import "../Style/CoordinatorLearning.css";

const initialTopics = [
  {
    id: 1,
    title: "FastAPI Async Handlers & Middleware",
    description: "Curated resources for designing asynchronous REST APIs, implementing custom middleware, and handling CORS/JWT auth.",
    type: "Document",
    tag: "Python Backend",
    link: "https://fastapi.tiangolo.com/"
  },
  {
    id: 2,
    title: "Indexed DB & Query Tuning in PostgreSQL",
    description: "Video lecture covering B-Tree indexes, query execution planning (EXPLAIN ANALYZE), and read/write optimization.",
    type: "Video",
    tag: "Databases",
    link: "https://www.youtube.com"
  },
  {
    id: 3,
    title: "Graph Algorithms: Shortest Paths Dijkstra",
    description: "Algorithm challenge resource and implementations for Dijkstra's shortest path traversal using heap priority queues.",
    type: "Coding Challenge",
    tag: "DSA Algorithms",
    link: "https://leetcode.com"
  }
];

export default function CoordinatorLearning() {
  const [topics, setTopics] = useState(initialTopics);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: "",
    description: "",
    type: "Document",
    tag: "Python Backend",
    link: ""
  });

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopic.title) return;

    const topicObj = {
      ...newTopic,
      id: Date.now()
    };

    setTopics([topicObj, ...topics]);
    setShowAddForm(false);
    setNewTopic({
      title: "",
      description: "",
      type: "Document",
      tag: "Python Backend",
      link: ""
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      setTopics(topics.filter((t) => t.id !== id));
    }
  };

  const getIcon = (type) => {
    if (type === "Video") return <Video size={16} />;
    if (type === "Coding Challenge") return <Code2 size={16} />;
    return <FileText size={16} />;
  };

  return (
    <div className="student-page-inner stack-6 learning-wrapper">
      {/* Title */}
      <div className="learning-header-row">
        <div>
          <h1 className="learning-page-title">Curated Learning Content</h1>
          <p className="learning-page-subtitle">Publish and manage documents, coding drills, and training lectures</p>
        </div>
        <Button className="btn-add-resource" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} /> Publish Resource
        </Button>
      </div>

      {/* Add Resource Form Box */}
      {showAddForm && (
        <div className="form-card shadow-sm stack-4 animate-slide-down">
          <h3 className="form-title">Publish Learning Resource</h3>
          <form onSubmit={handleAddTopic} className="stack-4">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master React Custom Hooks"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Resource Type</label>
                <select
                  value={newTopic.type}
                  onChange={(e) => setNewTopic({ ...newTopic, type: e.target.value })}
                >
                  <option value="Document">Document / Article</option>
                  <option value="Video">Video Lecture</option>
                  <option value="Coding Challenge">Coding Challenge</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Course Tag</label>
                <select
                  value={newTopic.tag}
                  onChange={(e) => setNewTopic({ ...newTopic, tag: e.target.value })}
                >
                  <option value="Python Backend">Python Backend</option>
                  <option value="DSA Algorithms">DSA Algorithms</option>
                  <option value="React Frontend">React Frontend</option>
                  <option value="Databases">Databases / SQL</option>
                </select>
              </div>
              <div className="form-group">
                <label>Resource URL / Link</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={newTopic.link}
                  onChange={(e) => setNewTopic({ ...newTopic, link: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description / Instruction</label>
              <textarea
                rows={3}
                placeholder="Write a brief overview of this content..."
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Publish Content
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Cards list */}
      <div className="topics-list stack-4">
        {topics.map((topic) => (
          <div key={topic.id} className="topic-card shadow-sm">
            <div className="topic-card-left stack-2">
              <div className="topic-card-type-row">
                <div className="type-icon-wrapper">
                  {getIcon(topic.type)}
                  <span>{topic.type}</span>
                </div>
                <Badge variant="outline" className="tag-badge">{topic.tag}</Badge>
              </div>
              <h3 className="topic-card-title">{topic.title}</h3>
              <p className="topic-card-desc">{topic.description}</p>
            </div>

            <div className="topic-card-right">
              {topic.link && (
                <a href={topic.link} target="_blank" rel="noopener noreferrer" className="btn-link">
                  Open <ExternalLink size={12} />
                </a>
              )}
              <button className="btn-delete-resource" onClick={() => handleDelete(topic.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
