import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Inbox,
  Clock,
  Search,
  Plus,
  Filter,
  FileText,
  AlertCircle,
  X,
  User,
  ShieldCheck,
  Building2,
  Trash2,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/CO_Requests.css";

const DEFAULT_REQUESTS = [];

export default function CoordinatorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [dbStudents, setDbStudents] = useState([]);
  const [dbBatches, setDbBatches] = useState([]);

  const [createForm, setCreateForm] = useState({
    studentName: "",
    rollNo: "",
    batch: "All Batches",
    category: "Medical Leave Application",
    reason: "",
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadRequests = () => {
    setLoading(true);
    apiFetch("/attendance/leave-requests")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setRequests(
            res.data.map((r) => ({
              id: r.id,
              studentName: r.student_name || r.name || "Student",
              rollNo: r.roll_number || r.rollNo || "N/A",
              batch: r.batch || "All Batches",
              requestType: r.category || r.title || "Leave Request",
              category: r.category || "General Leave",
              reason: r.reason || "Personal Leave Application",
              date: r.created_at ? r.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
              status: r.status || "Pending",
            }))
          );
        } else {
          setRequests([]);
        }
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();

    // Fetch dynamic students & batches for create modal dropdowns
    apiFetch("/students")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        setDbStudents(Array.isArray(list) ? list : []);
      })
      .catch(() => setDbStudents([]));

    apiFetch("/batches")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        setDbBatches(Array.isArray(list) ? list : []);
      })
      .catch(() => setDbBatches([]));
  }, []);

  const handleAction = async (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    triggerToast(`Request status updated to "${newStatus}"!`);

    try {
      await apiFetch(`/attendance/leave-requests/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn("Failed to update leave request status in DB:", e);
    }
  };

  const handleDeleteRequest = async (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    triggerToast("Application request removed successfully!");
    try {
      await apiFetch(`/attendance/leave-requests/${id}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Failed to delete leave request in DB:", e);
    }
  };

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!createForm.studentName.trim() || !createForm.reason.trim()) return;

    const newReq = {
      id: Date.now(),
      studentName: createForm.studentName,
      rollNo: createForm.rollNo || "N/A",
      batch: createForm.batch || "All Batches",
      requestType: createForm.category,
      category: createForm.category,
      reason: createForm.reason,
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
    };

    setRequests([newReq, ...requests]);
    setShowCreateModal(false);
    triggerToast(`New approval request logged for ${createForm.studentName}!`);

    setCreateForm({
      studentName: "",
      rollNo: "",
      batch: "All Batches",
      category: "Medical Leave Application",
      reason: "",
    });

    apiFetch("/attendance/leave-requests", {
      method: "POST",
      body: JSON.stringify(newReq),
    }).catch(() => null);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      (r.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.rollNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reason || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.category || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      String(r.status).toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === "all" ||
      String(r.category).toLowerCase().includes(categoryFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const rejectedCount = requests.filter((r) => r.status === "Rejected").length;

  return (
    <div className="coord-requests-container">
      {toastMessage && (
        <div className="coord-requests-toast">
          <CheckCircle size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Page Banner */}
      <div className="coord-requests-page-header">
        <div className="coord-requests-header-left">
          <div className="coord-requests-header-icon">
            <Inbox size={22} />
          </div>
          <div>
            <h1 className="coord-requests-page-title">
              Requests & Approvals Governance Center
            </h1>
            <p className="coord-requests-page-subtitle">
              Review student leave applications, batch transfer requests, and re-assessment permissions stored in database.
            </p>
          </div>
        </div>

        <button
          className="coord-requests-create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} /> Create Approval Request
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="coord-requests-kpi-grid">
        <div className="coord-requests-kpi-card">
          <div className="coord-requests-kpi-icon coord-requests-kpi-icon--blue">
            <FileText size={20} />
          </div>
          <div>
            <div className="coord-requests-kpi-label">Total Applications</div>
            <div className="coord-requests-kpi-value">{requests.length} Requests</div>
          </div>
        </div>

        <div className="coord-requests-kpi-card coord-requests-kpi-card--pending">
          <div className="coord-requests-kpi-icon coord-requests-kpi-icon--amber">
            <Clock size={20} />
          </div>
          <div>
            <div className="coord-requests-kpi-label">Pending Review</div>
            <div className="coord-requests-kpi-value">{pendingCount} Action Needed</div>
          </div>
        </div>

        <div className="coord-requests-kpi-card coord-requests-kpi-card--approved">
          <div className="coord-requests-kpi-icon coord-requests-kpi-icon--green">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="coord-requests-kpi-label">Approved Requests</div>
            <div className="coord-requests-kpi-value">{approvedCount} Granted</div>
          </div>
        </div>

        <div className="coord-requests-kpi-card coord-requests-kpi-card--rejected">
          <div className="coord-requests-kpi-icon coord-requests-kpi-icon--rose">
            <XCircle size={20} />
          </div>
          <div>
            <div className="coord-requests-kpi-label">Rejected Applications</div>
            <div className="coord-requests-kpi-value">{rejectedCount} Declined</div>
          </div>
        </div>
      </div>

      {/* Search & CustomSelect Filters Toolbar */}
      <div className="coord-requests-filter-card">
        <div className="coord-requests-filter-row">
          <div className="coord-requests-search-box">
            <Search size={16} className="coord-requests-search-icon" />
            <input
              type="text"
              placeholder="Search by student name, roll no, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="coord-requests-search-input"
            />
          </div>

          <div className="coord-requests-select-group">
            <div className="coord-requests-select-item">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
            </div>

            <div className="coord-requests-select-item">
              <CustomSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[
                  { value: "all", label: "All Categories" },
                  { value: "medical leave", label: "Medical Leave" },
                  { value: "batch transfer", label: "Batch Transfer" },
                  { value: "re-assessment", label: "Re-assessment" },
                  { value: "emergency leave", label: "Emergency Leave" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Requests List Cards */}
      <div className="coord-requests-list">
        {loading ? (
          <div className="coord-requests-empty-state">
            Loading student applications & leave requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="coord-requests-empty-state">
            <Inbox size={36} color="#94a3b8" />
            <div className="coord-req-name">No matching approval requests found.</div>
            <p className="coord-requests-page-subtitle">All pending applications have been processed or no results match your current search.</p>
          </div>
        ) : (
          filteredRequests.map((r) => (
            <div key={r.id} className="coord-request-card">
              <div className="coord-requests-item-left">
                <div className="coord-req-header">
                  <div className="coord-req-user-icon">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="coord-req-name">{r.studentName}</span>
                    <span className="coord-req-roll">
                      Roll No: {r.rollNo} · {r.batch || "All Batches"}
                    </span>
                  </div>
                  <span
                    className={`coord-req-status-badge ${
                      r.status === "Approved"
                        ? "coord-req-status-approved"
                        : r.status === "Rejected"
                        ? "coord-req-status-rejected"
                        : "coord-req-status-pending"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="coord-req-type">
                  {r.requestType} <span className="coord-req-date">({r.date})</span>
                </div>
                <div className="coord-req-reason">
                  <strong>Reason:</strong> {r.reason}
                </div>
              </div>

              <div className="coord-requests-item-right">
                {r.status === "Pending" ? (
                  <div className="coord-req-actions">
                    <button
                      className="coord-btn coord-btn--approve"
                      onClick={() => handleAction(r.id, "Approved")}
                    >
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button
                      className="coord-btn coord-btn--reject"
                      onClick={() => handleAction(r.id, "Rejected")}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                ) : (
                  <div className="coord-req-actioned">
                    Actioned ({r.status})
                  </div>
                )}

                <button
                  title="Delete Request"
                  onClick={() => handleDeleteRequest(r.id)}
                  className="coord-req-delete-btn"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-requests-modal-card">
            <div className="coord-requests-modal-header">
              <h3 className="coord-requests-page-title">Log New Student Approval Request</h3>
              <button onClick={() => setShowCreateModal(false)} className="coord-perf-modal-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="coord-requests-modal-form">
              <div className="coord-requests-form-group">
                <label className="coord-requests-form-label">Student Full Name *</label>
                {dbStudents.length > 0 ? (
                  <CustomSelect
                    value={createForm.studentName}
                    onChange={(val) => {
                      const selectedSt = dbStudents.find(s => (s.name || s.student_name) === val);
                      setCreateForm({
                        ...createForm,
                        studentName: val,
                        rollNo: selectedSt ? (selectedSt.roll_number || selectedSt.roll_no || selectedSt.rollNo || "") : createForm.rollNo,
                        batch: selectedSt ? (selectedSt.batch_name || selectedSt.batch || createForm.batch) : createForm.batch
                      });
                    }}
                    options={[
                      { value: "", label: "Select Student..." },
                      ...dbStudents.map(s => ({
                        value: s.name || s.student_name,
                        label: `${s.name || s.student_name} (${s.roll_number || s.roll_no || s.email || 'Student'})`
                      }))
                    ]}
                    placeholder="Select registered student..."
                  />
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={createForm.studentName}
                    onChange={(e) => setCreateForm({ ...createForm, studentName: e.target.value })}
                    className="coord-requests-form-input"
                  />
                )}
              </div>

              <div className="coord-requests-form-row">
                <div className="coord-requests-form-group">
                  <label className="coord-requests-form-label">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE26-055"
                    value={createForm.rollNo}
                    onChange={(e) => setCreateForm({ ...createForm, rollNo: e.target.value })}
                    className="coord-requests-form-input"
                  />
                </div>

                <div className="coord-requests-form-group">
                  <label className="coord-requests-form-label">Batch Name</label>
                  {dbBatches.length > 0 ? (
                    <CustomSelect
                      value={createForm.batch}
                      onChange={(val) => setCreateForm({ ...createForm, batch: val })}
                      options={[
                        { value: "All Batches", label: "All Batches" },
                        ...dbBatches.map(b => ({
                          value: b.name || b.batch_name || b.code,
                          label: b.name || b.batch_name || b.code
                        }))
                      ]}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. CSE 2026 Alpha"
                      value={createForm.batch}
                      onChange={(e) => setCreateForm({ ...createForm, batch: e.target.value })}
                      className="coord-requests-form-input"
                    />
                  )}
                </div>
              </div>

              <div className="coord-requests-form-group">
                <label className="coord-requests-form-label">Request Category</label>
                <CustomSelect
                  value={createForm.category}
                  onChange={(val) => setCreateForm({ ...createForm, category: val })}
                  options={[
                    { value: "Medical Leave Application", label: "Medical Leave Application" },
                    { value: "Batch Shift Request", label: "Batch Shift Request" },
                    { value: "Re-assessment Permission", label: "Re-assessment Permission" },
                    { value: "Emergency Travel Leave", label: "Emergency Travel Leave" },
                  ]}
                />
              </div>

              <div className="coord-requests-form-group">
                <label className="coord-requests-form-label">Reason & Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the reason for leave or special approval request..."
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  className="coord-requests-form-textarea"
                />
              </div>

              <div className="coord-requests-form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="coord-requests-cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="coord-requests-submit-btn">
                  Log Approval Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
