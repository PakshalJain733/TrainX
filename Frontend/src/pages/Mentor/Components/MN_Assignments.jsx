import { useCallback, useEffect, useState } from "react";
import { FileCode, Plus, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../utils/api";
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
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    loadData()
      .then(applyData)
      .finally(() => setLoading(false));
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
          <p className="mentor-page-subtitle">Assignments returned for your assigned batches</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="mentor-btn-secondary" onClick={handleRefresh} disabled={loading} aria-label="Refresh assignments">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="mentor-btn-primary"
            onClick={() => { setError(""); setShowForm((current) => !current); }}
            disabled={loading || batches.length === 0}
            title={batches.length === 0 ? "No assigned batches are available." : undefined}
          >
            <Plus size={16} />
            <span>Publish Assignment</span>
          </button>
        </div>
      </div>

      {batches.length === 0 && !loading && (
        <div className="mentor-assignment-form-card mentor-assignment-message">No assigned batches are available for assignment creation.</div>
      )}

      {showForm && batches.length > 0 && (
        <form className="mentor-assignment-form-card" onSubmit={handleSubmit}>
          <div className="mentor-assignment-form-heading">
            <div>
              <h3>Create Assignment</h3>
              <p>Publish to one of your assigned batches.</p>
            </div>
            <button type="button" className="mentor-assignment-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <div className="mentor-assignment-form-grid">
            <label>
              <span>Assigned Batch *</span>
              <select value={form.batchId} onChange={(event) => setForm((current) => ({ ...current, batchId: event.target.value }))} required>
                <option value="">Select an assigned batch</option>
                {batches.map((batch, index) => {
                  const id = getBatchId(batch);
                  if (id === null || id === "") return null;
                  return <option key={String(id) || index} value={id}>{textValue(firstValue(batch, ["name", "batchName", "batch_name", "code"])) || "N/A"}</option>;
                })}
              </select>
            </label>
            <label>
              <span>Title *</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </label>
            <label>
              <span>Type *</span>
              <input value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} required />
            </label>
            <label>
              <span>Due Date *</span>
              <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} required />
            </label>
            <label className="mentor-assignment-form-wide">
              <span>Description</span>
              <textarea rows="3" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
          </div>
          {error && <p className="mentor-assignment-form-error">{error}</p>}
          <div className="mentor-assignment-form-actions">
            <button type="submit" className="mentor-btn-primary" disabled={saving}>
              {saving ? "Publishing..." : "Publish Assignment"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mentor-assignment-form-card mentor-assignment-message">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="mentor-assignment-form-card mentor-assignment-message">No records yet</div>
      ) : (
        <div className="mentor-assignments-list">
          {assignments.map((assignment, index) => {
            const batch = textValue(firstValue(assignment, ["batch", "batchName", "batch_name"])) || "N/A";
            const title = textValue(firstValue(assignment, ["title", "name"])) || "N/A";
            const dueDate = formatDate(firstValue(assignment, ["dueDate", "due_date", "deadline"]));
            const status = textValue(firstValue(assignment, ["status", "state"])) || "N/A";
            const totalSubmitted = getNumber(assignment, ["totalSubmitted", "submittedCount", "submissions", "total_submissions"]);
            const totalStudents = getNumber(assignment, ["totalStudents", "studentCount", "studentsCount", "total_students"]);
            const evaluated = getNumber(assignment, ["evaluated", "evaluatedCount", "reviewed", "evaluated_count"]);
            const pending = totalSubmitted !== null && evaluated !== null ? Math.max(0, totalSubmitted - evaluated) : null;
            return (
              <div key={textValue(firstValue(assignment, ["id", "assignmentId", "assignment_id"])) || index} className="mentor-assignment-card">
                <div className="mentor-assign-header">
                  <div>
                    <span className="mentor-assign-batch-tag">{batch}</span>
                    <h3 className="mentor-assign-title">{title}</h3>
                    <p className="mentor-assign-duedate">Due Date: {dueDate}</p>
                  </div>
                  <span className={`mentor-assign-status ${status.toLowerCase() === "completed" ? "mentor-assign-status--completed" : "mentor-assign-status--pending"}`}>
                    {status}
                  </span>
                </div>
                <div className="mentor-assign-stats-grid">
                  <div className="mentor-assign-stat-box">
                    <span className="mentor-assign-stat-label">Submissions Received:</span>
                    <p className="mentor-assign-stat-val">{totalSubmitted === null || totalStudents === null ? "N/A" : `${totalSubmitted} / ${totalStudents}`}</p>
                  </div>
                  <div className="mentor-assign-stat-box">
                    <span className="mentor-assign-stat-label">Evaluated:</span>
                    <p className="mentor-assign-stat-val mentor-assign-stat-val--green">{evaluated === null ? "N/A" : evaluated}</p>
                  </div>
                  <div className="mentor-assign-stat-box">
                    <span className="mentor-assign-stat-label">Pending Review:</span>
                    <p className="mentor-assign-stat-val mentor-assign-stat-val--rose">{pending === null ? "N/A" : pending}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
