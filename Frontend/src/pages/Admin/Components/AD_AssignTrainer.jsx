import React, { useState } from "react";
import { UserPlus, Users, Briefcase, UserCheck, Trash2, CheckCircle2, ChevronDown, BookOpenCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AD_AssignTrainer.css";

const MOCK_BATCHES = [
  { id: 1, name: "CSE 2026 Alpha" },
  { id: 2, name: "Fullstack React & Node" },
  { id: 3, name: "Data Science & AI/ML 2025" },
];

const MOCK_TRAINERS = [
  { id: 101, name: "Anubhav Shukla", role: "Senior Java Expert" },
  { id: 102, name: "Priya Sharma", role: "React Architect" },
  { id: 103, name: "Rahul Verma", role: "DSA Specialist" },
];



const INITIAL_ASSIGNMENTS = [
  {
    id: 1,
    trainer: MOCK_TRAINERS[0],
    batch: MOCK_BATCHES[0],
    status: "Active",
    date: "2026-09-15",
  },
  {
    id: 2,
    trainer: MOCK_TRAINERS[1],
    batch: MOCK_BATCHES[1],
    status: "Active",
    date: "2026-09-18",
  }
];

export default function AdminAssignTrainer() {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [topics, setTopics] = useState([]);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [isAddingNewTrainer, setIsAddingNewTrainer] = useState(false);
  const [newTrainerName, setNewTrainerName] = useState("");

  const handleAssign = (e) => {
    e.preventDefault();
    if (!selectedBatch || !selectedTrainer) return;
    
    const trainerObj = MOCK_TRAINERS.find(t => String(t.id) === String(selectedTrainer));
    const batchObj = MOCK_BATCHES.find(b => String(b.id) === String(selectedBatch));

    const newAssignment = {
      id: Date.now(),
      trainer: trainerObj,
      batch: batchObj,
      status: "Active",
      date: new Date().toISOString().split("T")[0],
    };

    setAssignments([newAssignment, ...assignments]);
    setSelectedBatch("");
    setSelectedTrainer("");
  };

  const handleRemove = (id) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicTitle || !newTopicDesc) return;
    const newTopic = {
      id: Date.now(),
      title: newTopicTitle,
      description: newTopicDesc,
    };
    setTopics([newTopic, ...topics]);
    setNewTopicTitle("");
    setNewTopicDesc("");
  };

  return (
    <div className="admin-assign-trainer page-fade-in">
      <SectionHeader
        title="Assign Trainer"
        description="Allocate trainers and mentors to specific batches or cohorts."
        icon={UserPlus}
      />

      <form onSubmit={(e) => {
        e.preventDefault();
        
        let finalTrainerId = selectedTrainer;
        let trainerObj;

        if (isAddingNewTrainer) {
          if (!newTrainerName) return;
          trainerObj = {
            id: `custom-${Date.now()}`,
            name: newTrainerName,
            role: "External Trainer"
          };
        } else {
          if (!selectedTrainer) return;
          trainerObj = MOCK_TRAINERS.find(t => String(t.id) === String(selectedTrainer));
        }

        if (!selectedBatch || !trainerObj) return;

        const batchObj = MOCK_BATCHES.find(b => String(b.id) === String(selectedBatch));

        const newAssignment = {
          id: Date.now(),
          trainer: trainerObj,
          batch: batchObj,
          status: "Active",
          date: new Date().toISOString().split("T")[0],
        };

        setAssignments([newAssignment, ...assignments]);
        
        if (newTopicTitle && newTopicDesc) {
          const newTopic = {
            id: Date.now() + 1,
            title: newTopicTitle,
            description: newTopicDesc,
          };
          setTopics([newTopic, ...topics]);
        }
        
        const session = {
          id: Date.now() + 2,
          trainerName: trainerObj.name,
          topic: newTopicTitle || "General Training",
          topicDetail: newTopicDesc || "Assigned for the upcoming training cycle.",
          batch: batchObj.name,
          time: "Ongoing",
          status: "Live"
        };
        const existingSessionsStr = localStorage.getItem('coordinatorLiveSessions');
        let existingSessions = [];
        if (existingSessionsStr) {
          try { existingSessions = JSON.parse(existingSessionsStr); } catch(e){}
        } else {
          existingSessions = [
            {
              id: 1,
              trainerName: "Anubhav Shukla",
              topic: "Java Masterclass: Core to Advanced",
              topicDetail: "Deep dive into JVM architecture, Classes, Interfaces, Exception Handling, Collections Framework, and Multithreading.",
              batch: "CSE 2026 Cohort",
              time: "10:00 AM - 05:00 PM",
              status: "Live",
            },
            {
              id: 2,
              trainerName: "Priya Sharma",
              topic: "React Intensive Bootcamp",
              topicDetail: "Complete guide from JSX, Hooks & Context API to building scalable single-page applications and global state management.",
              batch: "Fullstack Specialization",
              time: "09:30 AM - 04:30 PM",
              status: "Live",
            },
            {
              id: 3,
              trainerName: "Rahul Verma",
              topic: "DSA Marathon: Trees & Graphs",
              topicDetail: "Intensive problem-solving session covering BSTs, Tries, Graph traversals, shortest paths, and DP on trees.",
              batch: "CSE 2025 Alpha",
              time: "11:00 AM - 06:00 PM",
              status: "Live",
            }
          ];
        }
        localStorage.setItem('coordinatorLiveSessions', JSON.stringify([session, ...existingSessions]));

        setSelectedBatch("");
        setSelectedTrainer("");
        setNewTopicTitle("");
        setNewTopicDesc("");
        setIsAddingNewTrainer(false);
        setNewTrainerName("");
      }}>
        <Card className="admin-at-form-card">
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} className="text-indigo-600" />
              New Assignment & Course Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="admin-at-form">
              <div className="admin-at-field">
                <label className="admin-at-label">
                  <Users size={14} /> Target Batch / Cohort
                </label>
                <div className="relative">
                  <select
                    className="admin-at-select"
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a batch...</option>
                    {MOCK_BATCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-at-field">
                <label className="admin-at-label">
                  <UserCheck size={14} /> Select Trainer
                </label>
                <div className="relative">
                  {isAddingNewTrainer ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="admin-at-input"
                        placeholder="Enter trainer name..."
                        value={newTrainerName}
                        onChange={(e) => setNewTrainerName(e.target.value)}
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewTrainer(false);
                          setNewTrainerName("");
                          setSelectedTrainer("");
                        }}
                        style={{ padding: '0 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      className="admin-at-select"
                      value={selectedTrainer}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setIsAddingNewTrainer(true);
                        } else {
                          setSelectedTrainer(e.target.value);
                        }
                      }}
                      required
                    >
                      <option value="" disabled>Select a trainer...</option>
                      {MOCK_TRAINERS.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                      ))}
                      <option value="new" className="font-semibold text-blue-600">+ Add New Trainer...</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Topics Inputs Row */}
            <div className="admin-at-add-topic-form">
              <input
                type="text"
                placeholder="Main Topic (e.g. Java Masterclass)"
                className="admin-at-input"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
              />
              <input
                type="text"
                placeholder="Subtopics (e.g. JVM architecture, Classes...)"
                className="admin-at-input"
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
              />
              <button
                type="submit"
                className="admin-at-btn"
                disabled={!selectedBatch || (isAddingNewTrainer ? !newTrainerName : !selectedTrainer)}
              >
                <UserPlus size={16} /> Assign Trainer
              </button>
            </div>
            <div className="admin-at-topics-grid">
              {topics.length === 0 ? (
                <div className="text-center text-slate-500 py-6" style={{ fontSize: '14px' }}>
                  No topics added yet. Add your first course module above!
                </div>
              ) : (
                topics.map(topic => (
                <div key={topic.id} className="admin-at-topic-item">
                  <div className="admin-at-topic-content">
                    <h4 className="admin-at-topic-title">{topic.title}</h4>
                    <p className="admin-at-topic-desc">{topic.description}</p>
                  </div>
                  <button className="admin-at-topic-btn">
                    <UserPlus size={14} /> Assign
                  </button>
                </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Assigned List */}
      <Card className="admin-at-table-card">
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} className="text-emerald-600" />
              Current Assignments
            </CardTitle>
          </CardHeader>
          <div className="admin-at-table-wrapper">
            <table className="admin-at-table">
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>Assigned Batch</th>
                  <th>Status</th>
                  <th>Date Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-slate-500 py-8">
                      No trainers assigned yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="admin-at-trainer-cell">
                          <div className="admin-at-avatar">
                            {a.trainer.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="admin-at-name">{a.trainer.name}</div>
                            <div className="admin-at-email">{a.trainer.role}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-at-batch-pill">{a.batch.name}</span>
                      </td>
                      <td>
                        <span className="admin-at-status-pill">{a.status}</span>
                      </td>
                      <td className="text-slate-500 font-medium">{a.date}</td>
                      <td>
                        <button
                          onClick={() => handleRemove(a.id)}
                          className="admin-at-action-btn"
                          title="Remove Assignment"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
    </div>
  );
}
