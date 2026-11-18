import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Sparkles,
  ListOrdered,
  Eye,
  EyeOff,
  Layers
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/TR_Batches.css";

export function TrainerTasks() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchTasks, setBatchTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState("add"); // "add" or "list"

  // Feedback Banner
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [submittingTask, setSubmittingTask] = useState(false);

  // Form State
  const [taskForm, setTaskForm] = useState({
    title: "",
    topic: "",
    difficulty: "Medium",
    points: 100,
    deadline: "",
    description: "",
    language: "Java",
    starterCode: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
    testCases: [
      { input: "1 2", expectedOutput: "3", isHidden: false },
      { input: "5 7", expectedOutput: "12", isHidden: true }
    ]
  });

  // Language starter templates
  const starterTemplates = {
    Java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
    Python: `def solution():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    solution()`,
    "C++": `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    C: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    JavaScript: `function solution() {\n    // Write your solution here\n}\n\nsolution();`
  };

  // 1. Fetch Trainer's Joined Batches
  useEffect(() => {
    const fetchMyBatches = async () => {
      try {
        const res = await apiFetch("/batches/my-batches");
        const list = res?.data || (Array.isArray(res) ? res : []);
        setBatches(list);
        if (list.length > 0) {
          setSelectedBatchId(String(list[0].id));
        }
      } catch (_e) {
        setBatches([]);
      }
    };
    fetchMyBatches();
  }, []);

  // 2. Fetch Tasks of Selected Batch
  const fetchTasks = async (batchId) => {
    if (!batchId) return;
    setLoadingTasks(true);
    try {
      const res = await apiFetch(`/batches/${batchId}/tasks`);
      setBatchTasks(res?.data || (Array.isArray(res) ? res : []));
    } catch (_e) {
      setBatchTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchTasks(selectedBatchId);
    }
  }, [selectedBatchId]);

  // Language Change Handler
  const handleLanguageChange = (lang) => {
    setTaskForm((prev) => ({
      ...prev,
      language: lang,
      starterCode: starterTemplates[lang] || prev.starterCode
    }));
  };

  // Add / Remove Test Cases
  const handleAddTestCase = () => {
    setTaskForm((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "", isHidden: false }]
    }));
  };

  const handleRemoveTestCase = (index) => {
    setTaskForm((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setTaskForm((prev) => {
      const updated = [...prev.testCases];
      updated[index][field] = value;
      return { ...prev, testCases: updated };
    });
  };

  // Submit / Publish New Task
  const handlePublishTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !selectedBatchId) return;

    setSubmittingTask(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        title: taskForm.title,
        topic: taskForm.topic || "General Assignment",
        difficulty: taskForm.difficulty || "Medium",
        points: taskForm.points || 100,
        deadline: taskForm.deadline || "",
        description: taskForm.description || "",
        language: taskForm.language || "Java",
        starter_code: taskForm.starterCode,
        test_cases: JSON.stringify(taskForm.testCases)
      };

      const res = await apiFetch(`/batches/${selectedBatchId}/tasks`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res?.success || res?.status === "success" || res?.id) {
        setFeedback({
          type: "success",
          message: `Task "${taskForm.title}" published successfully to batch!`
        });

        // Reset form
        setTaskForm({
          title: "",
          topic: "",
          difficulty: "Medium",
          points: 100,
          deadline: "",
          description: "",
          language: "Java",
          starterCode: starterTemplates["Java"],
          testCases: [
            { input: "1 2", expectedOutput: "3", isHidden: false },
            { input: "5 7", expectedOutput: "12", isHidden: true }
          ]
        });

        // Refresh task list and switch to list tab
        await fetchTasks(selectedBatchId);
        setActiveTab("list");
      } else {
        setFeedback({
          type: "error",
          message: res?.message || "Failed to publish task to batch."
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message || "Error publishing batch task."
      });
    } finally {
      setSubmittingTask(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await apiFetch(`/batches/${selectedBatchId}/tasks/${taskId}`, { method: "DELETE" });
      setBatchTasks((prev) => prev.filter((t) => t.id !== taskId));
      setFeedback({ type: "success", message: "Task deleted successfully." });
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  };

  const selectedBatch = batches.find((b) => String(b.id) === String(selectedBatchId));

  return (
    <div className="trainer-batches-container">
      {/* Page Header */}
      <div className="trainer-header-row">
        <div className="trainer-header-title-group">
          <div className="trainer-page-icon-box">
            <Code2 size={22} />
          </div>
          <div>
            <h1 className="trainer-page-title">Add Batch Task</h1>
            <p className="trainer-page-sub">
              Create programming problems and automated test suite evaluations for students in your batch.
            </p>
          </div>
        </div>

        {/* Batch Selector */}
        {batches.length > 0 && (
          <div className="trainer-batch-selector-box">
            <span className="trainer-batch-selector-label">
              <Layers size={15} className="trainer-selector-icon" /> Target Batch:
            </span>
            <div className="trainer-batch-selector-dropdown">
              <CustomSelect
                value={selectedBatchId}
                onChange={(val) => setSelectedBatchId(val)}
                options={batches.map((b) => ({ value: String(b.id), label: b.name }))}
                placeholder="Select Target Batch..."
                className="trainer-header-select"
              />
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`trainer-feedback-banner ${
            feedback.type === "success"
              ? "trainer-feedback-banner--success"
              : "trainer-feedback-banner--error"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="trainer-tabs-bar">
        <button
          type="button"
          className={`trainer-tab-btn ${activeTab === "add" ? "active" : ""}`}
          onClick={() => setActiveTab("add")}
        >
          <Plus size={16} /> Create New Task
        </button>
        <button
          type="button"
          className={`trainer-tab-btn ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          <ListOrdered size={16} /> Active Tasks ({batchTasks.length})
        </button>
      </div>

      {/* TAB 1: ADD TASK FORM */}
      {activeTab === "add" && (
        <div className="trainer-add-task-card">
          <div className="trainer-add-task-header">
            <h3 className="trainer-add-task-title">
              Assign Problem to {selectedBatch?.name || "Batch"}
            </h3>
            <p className="trainer-add-task-sub">
              This task will immediately be available on the student dashboard for auto-graded compiler execution.
            </p>
          </div>

          <form onSubmit={handlePublishTask} className="trainer-task-form">
            {/* Row 1: Title & Language */}
            <div className="trainer-form-grid-2">
              <div>
                <label className="trainer-field-label">Problem Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Two Sum Array Optimization, Binary Tree DFS"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="trainer-field-input"
                />
              </div>

              <div>
                <label className="trainer-field-label">Programming Language</label>
                <CustomSelect
                  value={taskForm.language}
                  onChange={(val) => handleLanguageChange(val)}
                  options={[
                    { value: "Java", label: "Java" },
                    { value: "Python", label: "Python" },
                    { value: "C++", label: "C++" },
                    { value: "C", label: "C" },
                    { value: "JavaScript", label: "JavaScript" },
                  ]}
                  placeholder="Select Language..."
                />
              </div>
            </div>

            {/* Row 2: Topic, Difficulty, Points, Deadline */}
            <div className="trainer-form-grid-4 mobile-pair-2">
              <div>
                <label className="trainer-field-label">Topic / Concept</label>
                <input
                  type="text"
                  placeholder="e.g., Arrays, Dynamic Programming"
                  value={taskForm.topic}
                  onChange={(e) => setTaskForm({ ...taskForm, topic: e.target.value })}
                  className="trainer-field-input"
                />
              </div>

              <div>
                <label className="trainer-field-label">Difficulty</label>
                <CustomSelect
                  value={taskForm.difficulty}
                  onChange={(val) => setTaskForm({ ...taskForm, difficulty: val })}
                  options={[
                    { value: "Easy", label: "Easy" },
                    { value: "Medium", label: "Medium" },
                    { value: "Hard", label: "Hard" },
                  ]}
                  placeholder="Select Difficulty..."
                />
              </div>

              <div>
                <label className="trainer-field-label">Points / Max Marks</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={taskForm.points}
                  onChange={(e) => setTaskForm({ ...taskForm, points: Number(e.target.value) || 100 })}
                  className="trainer-field-input"
                />
              </div>

              <div>
                <label className="trainer-field-label">Deadline Date</label>
                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="trainer-field-input"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="trainer-field-label">Problem Statement & Requirements</label>
              <textarea
                rows="4"
                placeholder="Describe the task requirements, input/output specifications, time complexity constraints, and sample expectations..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="trainer-field-textarea"
              />
            </div>

            {/* Test Cases Section */}
            <div className="trainer-testcases-box">
              <div className="trainer-testcases-header">
                <div>
                  <h4 className="trainer-testcases-title">Automated Test Cases</h4>
                  <p className="trainer-testcases-sub">
                    Add standard input and expected output pairs for the compiler auto-grader.
                  </p>
                </div>
                <button
                  type="button"
                  className="trainer-btn-outline trainer-btn-compact"
                  onClick={handleAddTestCase}
                >
                  <Plus size={14} /> Add Test Case
                </button>
              </div>

              <div className="trainer-testcases-list">
                {taskForm.testCases.map((tc, idx) => (
                  <div key={idx} className="trainer-tc-item-card">
                    <div className="trainer-tc-item-header">
                      <div className="trainer-tc-header-left">
                        <span className="trainer-tc-badge">Test Case #{idx + 1}</span>
                        <span className={`trainer-tc-status-pill ${tc.isHidden ? "hidden" : "public"}`}>
                          {tc.isHidden ? (
                            <><EyeOff size={12} /> Hidden Test Case</>
                          ) : (
                            <><Eye size={12} /> Public Sample</>
                          )}
                        </span>
                      </div>

                      <div className="trainer-tc-item-header-actions">
                        <label className="trainer-tc-hidden-toggle">
                          <input
                            type="checkbox"
                            checked={tc.isHidden}
                            onChange={(e) => handleTestCaseChange(idx, "isHidden", e.target.checked)}
                          />
                          <span>Secret / Hidden Case</span>
                        </label>
                        {taskForm.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTestCase(idx)}
                            className="trainer-tc-remove-btn"
                            title="Remove Test Case"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="trainer-tc-grid">
                      <div className="trainer-tc-field">
                        <label className="trainer-tc-label">Standard Input (stdin)</label>
                        <textarea
                          rows="2"
                          placeholder="e.g. 5 10"
                          value={tc.input}
                          onChange={(e) => handleTestCaseChange(idx, "input", e.target.value)}
                          className="trainer-tc-textarea"
                          spellCheck="false"
                        />
                      </div>
                      <div className="trainer-tc-field">
                        <label className="trainer-tc-label">Expected Output (stdout)</label>
                        <textarea
                          rows="2"
                          placeholder="e.g. 15"
                          value={tc.expectedOutput}
                          onChange={(e) => handleTestCaseChange(idx, "expectedOutput", e.target.value)}
                          className="trainer-tc-textarea"
                          spellCheck="false"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="trainer-form-actions-footer">
              <button
                type="submit"
                disabled={submittingTask}
                className="trainer-btn-primary"
              >
                <Code2 size={16} />
                {submittingTask ? "Publishing Task..." : "Publish Task to Batch"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ACTIVE TASKS LIST */}
      {activeTab === "list" && (
        <div className="trainer-tasks-list-wrap">
          <div className="trainer-tasks-list-header">
            <h3 className="trainer-tasks-list-title">
              Assigned Tasks for {selectedBatch?.name || "Batch"}
            </h3>
            <button
              type="button"
              className="trainer-btn-primary trainer-btn-compact"
              onClick={() => setActiveTab("add")}
            >
              <Plus size={15} /> Add Another Task
            </button>
          </div>

          {loadingTasks ? (
            <div className="trainer-loading-state">Loading batch tasks...</div>
          ) : batchTasks.length === 0 ? (
            <div className="trainer-task-empty-card">
              <Code2 size={42} className="trainer-task-empty-icon" />
              <h4 className="trainer-task-empty-title">
                No tasks assigned to {selectedBatch?.name || "this batch"} yet
              </h4>
              <p className="trainer-task-empty-sub">
                Create practice problems and coding assignments for students in this batch.
              </p>
              <button
                type="button"
                className="trainer-btn-primary"
                onClick={() => setActiveTab("add")}
              >
                <Plus size={16} /> Create First Batch Task
              </button>
            </div>
          ) : (
            <div className="trainer-tasks-cards-list">
              {batchTasks.map((task) => (
                <div key={task.id} className="trainer-task-item-card">
                  <div className="trainer-task-item-top">
                    <div>
                      <div className="trainer-task-item-meta-row">
                        <h4 className="trainer-task-item-title">{task.title}</h4>
                        <span
                          className={`trainer-task-diff-badge ${
                            task.difficulty === "Easy"
                              ? "trainer-task-diff-badge--easy"
                              : task.difficulty === "Hard"
                              ? "trainer-task-diff-badge--hard"
                              : "trainer-task-diff-badge--medium"
                          }`}
                        >
                          {task.difficulty || "Medium"}
                        </span>
                        <span className="trainer-task-lang-badge">
                          {task.language || "Java"}
                        </span>
                      </div>
                      <p className="trainer-task-item-sub">
                        Topic: <strong>{task.topic || "General Assignment"}</strong> • Points:{" "}
                        <strong>{task.points || 100} pts</strong>
                        {task.deadline && ` • Due: ${task.deadline}`}
                      </p>
                    </div>

                    <div className="trainer-task-item-actions">
                      <button
                        type="button"
                        className="trainer-btn-primary trainer-btn-compact"
                        onClick={() => navigate("/trainer/submissions")}
                      >
                        <Eye size={15} /> View Submissions
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="trainer-task-delete-btn"
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {task.description && (
                    <p className="trainer-task-desc-text">{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TrainerTasks;
