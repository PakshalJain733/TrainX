import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../utils/api';
import { FileCode, Plus, X, RefreshCw } from 'lucide-react';
import "../Styles/MN_Assignments.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getList = (response, key) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") {
    const nested = value.name || value.code || value.title;
    return nested ? String(nested) : null;
  }
  const text = String(value).trim();
  return text || null;
};

const firstValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getNumber = (source, keys) => asNumber(firstValue(source, keys));

const getBatchId = (batch) => firstValue(batch, ["id", "batchId", "batch_id"]);

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const getCreatedAssignment = (response) => {
  const payload = unwrap(response);
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload.assignment && typeof payload.assignment === "object") return payload.assignment;
  if (payload.id || payload.title || payload.assignmentId) return payload;
  return null;
};

const emptyForm = () => ({
  batchId: "",
  title: "",
  description: "",
  dueDate: new Date().toISOString().slice(0, 10),
  type: "",
});

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    topic: 'DSA & Algorithms',
    difficulty: 'Medium',
    points: 100,
    deadline: '2026-09-30',
    description: '',
  });

  const loadAssignments = () => {
    setLoading(true);
    apiFetch("/batches/1/tasks")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setAssignments(res.data);
        } else if (res && Array.isArray(res)) {
          setAssignments(res);
        } else {
          setAssignments([]);
        }
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      await apiFetch("/batches/1/tasks", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({
        title: '',
        topic: 'DSA & Algorithms',
        difficulty: 'Medium',
        points: 100,
        deadline: '2026-09-30',
        description: '',
      });
      loadAssignments();
    } catch (err) {
      console.error("Failed to publish task to DB:", err);
    }
  };

  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const [assignmentResponse, batchResponse] = await Promise.all([
      apiFetch("/mentor/assignments"),
      apiFetch("/mentor/batches"),
    ]);
    return {
      assignments: getList(assignmentResponse, "assignments"),
      batches: getList(batchResponse, "batches"),
    };
  }, []);

  const applyData = useCallback((next) => {
    setAssignments(next.assignments);
    setBatches(next.batches);
    setForm((current) => {
      const stillAssigned = next.batches.some((batch) => String(getBatchId(batch)) === String(current.batchId));
      if (stillAssigned) return current;
      return { ...current, batchId: next.batches.length > 0 ? getBatchId(next.batches[0]) ?? "" : "" };
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    loadData()
      .then((next) => {
        if (mounted) applyData(next);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadData, applyData]);

  const handleRefresh = () => {
    loadData().then(applyData);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const selectedBatch = batches.find((batch) => String(getBatchId(batch)) === String(form.batchId));
    const batchId = selectedBatch ? getBatchId(selectedBatch) : null;
    if (batchId === null || batchId === "") {
      setError("Select an assigned batch.");
      return;
    }
    if (!form.title.trim() || !form.dueDate || !form.type.trim()) {
      setError("Title, due date, and type are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch("/mentor/assignments", {
        method: "POST",
        body: JSON.stringify({
          batchId,
          title: form.title.trim(),
          description: form.description.trim(),
          dueDate: form.dueDate,
          type: form.type.trim(),
        }),
      });
      if (!response || response.error) {
        throw new Error(response?.error || "The assignment could not be created.");
      }
      const created = getCreatedAssignment(response);
      if (created) {
        setAssignments((current) => [created, ...current]);
      } else {
        applyData(await loadData());
      }
      setForm(emptyForm());
      setShowForm(false);
    } catch (submitError) {
      setError(submitError.message || "The assignment could not be created.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mentor-assignments-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <FileCode size={20} color="#4f46e5" />
            <span>Assignments & Code Evaluation Queue</span>
          </h2>
          <p className="mentor-page-subtitle">Create programming tasks, review submitted student code, and assign marks saved in database</p>
        </div>

        <button className="mentor-btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Publish New Assignment</span>
        </button>
      </div>

      {/* Assignments List */}
      <div className="mentor-assignments-list">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
            No coding assignments found in database. Click "Publish New Assignment" to assign tasks to batches.
          </div>
        ) : (
          assignments.map((a, idx) => (
            <div key={a.id || idx} className="mentor-assignment-card">
              <div className="mentor-assign-header">
                <div>
                  <span className="mentor-assign-batch-tag">
                    {a.batch_name || a.batch || "All Batches"}
                  </span>
                  <h3 className="mentor-assign-title">{a.title}</h3>
                  <p className="mentor-assign-duedate">Due Date: {a.deadline || a.dueDate || "Flexible"}</p>
                </div>

                <span className={`mentor-assign-status ${
                  a.status === 'Completed'
                    ? 'mentor-assign-status--completed'
                    : 'mentor-assign-status--pending'
                }`}>
                  {a.status || 'Active'}
                </span>
              </div>

              <div className="mentor-assign-stats-grid">
                <div className="mentor-assign-stat-box">
                  <span className="mentor-assign-stat-label">Points Weight:</span>
                  <p className="mentor-assign-stat-val">{a.points || 100} pts</p>
                </div>
                <div className="mentor-assign-stat-box">
                  <span className="mentor-assign-stat-label">Difficulty:</span>
                  <p className="mentor-assign-stat-val mentor-assign-stat-val--green">{a.difficulty || "Medium"}</p>
                </div>
                <div className="mentor-assign-stat-box">
                  <span className="mentor-assign-stat-label">Topic:</span>
                  <p className="mentor-assign-stat-val mentor-assign-stat-val--rose">{a.topic || "General"}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Publish Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px', width: '90%', padding: '24px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Publish Coding Assignment</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Binary Search Tree Validation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Topic</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Points</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Problem Description & Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Describe the coding challenge and edge cases..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>Save to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
