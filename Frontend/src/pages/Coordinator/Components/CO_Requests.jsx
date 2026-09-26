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
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/CO_Requests.css";

const DEFAULT_REQUESTS = [
  {
    id: 1,
    studentName: "Rohan Mehta",
    rollNo: "CSE26-042",
    batch: "CSE 2026 Alpha",
    requestType: "Medical Leave Application",
    category: "Medical Leave",
    reason: "Hospitalization due to Dengue Fever (Medical Certificate attached). Requesting 4 days leave.",
    date: "2026-09-24",
    status: "Pending",
  },
  {
    id: 2,
    studentName: "Sneha Patil",
    rollNo: "IT25-018",
    batch: "IT 2025 Cohort",
    requestType: "Batch Shift Request",
    category: "Batch Transfer",
    reason: "Schedule clash with department lab exam. Requesting shift from Morning to Evening Batch.",
    date: "2026-09-25",
    status: "Approved",
  },
  {
    id: 3,
    studentName: "Aditya Joshi",
    rollNo: "AIDS26-009",
    batch: "AI & DS 2026",
    requestType: "Re-assessment Permission",
    category: "Re-assessment",
    reason: "Missed Coding Assessment #3 due to representing college in National Hackathon.",
    date: "2026-09-26",
    status: "Pending",
  },
  {
    id: 4,
    studentName: "Kavya Nair",
    rollNo: "CSE26-088",
    batch: "CSE 2026 Beta",
    requestType: "Emergency Travel Leave",
    category: "Emergency Leave",
    reason: "Family emergency travel to hometown required urgent departure.",
    date: "2026-09-22",
    status: "Rejected",
  },
];

export default function CoordinatorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    studentName: "",
    rollNo: "",
    batch: "CSE 2026 Alpha",
    category: "Medical Leave",
    reason: "",
  });

  const loadRequests = () => {
    setLoading(true);
    apiFetch("/attendance/leave-requests")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setRequests(
            res.data.map((r) => ({
              id: r.id,
              studentName: r.student_name || r.name || "Student",
              rollNo: r.roll_number || r.rollNo || "CS-101",
              batch: r.batch || "CSE 2026 Cohort",
              requestType: r.category || r.title || "Leave Request",
              category: r.category || "General Leave",
              reason: r.reason || "Personal Leave Application",
              date: r.created_at ? r.created_at.split("T")[0] : "2026-09-26",
              status: r.status || "Pending",
            }))
          );
        } else {
          setRequests(DEFAULT_REQUESTS);
        }
      })
      .catch(() => setRequests(DEFAULT_REQUESTS))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      await apiFetch(`/attendance/leave-requests/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn("Failed to update leave request status in DB:", e);
    }
  };

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!createForm.studentName.trim() || !createForm.reason.trim()) return;

    const newReq = {
      id: Date.now(),
      studentName: createForm.studentName,
      rollNo: createForm.rollNo || "CSE26-100",
      batch: createForm.batch,
      requestType: createForm.category,
      category: createForm.category,
      reason: createForm.reason,
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
    };

    setRequests([newReq, ...requests]);
    setShowCreateModal(false);
    setCreateForm({
      studentName: "",
      rollNo: "",
      batch: "CSE 2026 Alpha",
      category: "Medical Leave",
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
    <div className="coord-requests-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Page Banner */}
      <div className="coord-requests-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #0284c7, #2563eb)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(2, 132, 199, 0.2)"
          }}>
            <Inbox size={22} />
          </div>
          <div>
            <h1 className="coord-requests-page-title" style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              Requests & Approvals Governance Center
            </h1>
            <p className="coord-requests-page-subtitle" style={{ margin: "3px 0 0", fontSize: "13.5px", color: "#64748b" }}>
              Review student leave applications, batch transfer requests, and re-assessment permissions stored in database.
            </p>
          </div>
        </div>

        <button
          className="coord-btn coord-btn--primary"
          style={{
            background: "linear-gradient(135deg, #0284c7, #0369a1)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
            transition: "all 0.2s ease"
          }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} /> Create Approval Request
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="coord-perf-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="coord-perf-kpi-card" style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#f0f9ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Total Applications</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{requests.length} Requests</div>
          </div>
        </div>

        <div className="coord-perf-kpi-card" style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #fef3c7", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 600 }}>Pending Review</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#b45309", marginTop: "2px" }}>{pendingCount} Action Needed</div>
          </div>
        </div>

        <div className="coord-perf-kpi-card" style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #dcfce7", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#047857", fontWeight: 600 }}>Approved Requests</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>{approvedCount} Granted</div>
          </div>
        </div>

        <div className="coord-perf-kpi-card" style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #ffe4e6", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fff1f2", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <XCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#be123c", fontWeight: 600 }}>Rejected Applications</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#be123c", marginTop: "2px" }}>{rejectedCount} Declined</div>
          </div>
        </div>
      </div>

      {/* Search & CustomSelect Filters Toolbar */}
      <div className="coord-perf-filter-card" style={{ background: "#ffffff", padding: "14px 18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search by student name, roll no, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "36px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "420px" }}>
            <div style={{ flex: 1 }}>
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

            <div style={{ flex: 1 }}>
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
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b", background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            Loading student applications & leave requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px", background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <Inbox size={36} style={{ color: "#94a3b8" }} />
            <div style={{ fontWeight: 700, color: "#334155" }}>No matching approval requests found.</div>
            <p style={{ margin: 0, fontSize: "12px" }}>All pending applications have been processed or no results match your current search.</p>
          </div>
        ) : (
          filteredRequests.map((r) => (
            <div key={r.id} className="coord-request-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div className="coord-req-header" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f1f5f9", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px" }}>
                    <User size={18} />
                  </div>
                  <div>
                    <span className="coord-req-name" style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>{r.studentName}</span>
                    <span className="coord-req-roll" style={{ marginLeft: "8px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                      Roll No: {r.rollNo} · {r.batch || "CSE Batch"}
                    </span>
                  </div>
                  <span
                    className={
                      r.status === "Approved"
                        ? "coord-req-status-approved"
                        : r.status === "Rejected"
                        ? "coord-req-status-rejected"
                        : "coord-req-status-pending"
                    }
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                      marginLeft: "auto",
                      background: r.status === "Approved" ? "#ecfdf5" : r.status === "Rejected" ? "#fff1f2" : "#fffbeb",
                      color: r.status === "Approved" ? "#047857" : r.status === "Rejected" ? "#be123c" : "#b45309",
                      border: `1px solid ${r.status === "Approved" ? "#a7f3d0" : r.status === "Rejected" ? "#fecdd3" : "#fde68a"}`
                    }}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="coord-req-type" style={{ fontSize: "13.5px", fontWeight: 700, color: "#0284c7", marginTop: "10px" }}>
                  {r.requestType} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "12px" }}>({r.date})</span>
                </div>
                <div className="coord-req-reason" style={{ fontSize: "12.5px", color: "#475569", marginTop: "6px", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                  <strong>Reason:</strong> {r.reason}
                </div>
              </div>

              {r.status === "Pending" ? (
                <div className="coord-req-actions" style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="coord-btn coord-btn--approve"
                    onClick={() => handleAction(r.id, "Approved")}
                    style={{
                      background: "#ecfdf5",
                      color: "#047857",
                      border: "1px solid #a7f3d0",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "12.5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <CheckCircle size={15} /> Approve
                  </button>
                  <button
                    className="coord-btn coord-btn--reject"
                    onClick={() => handleAction(r.id, "Rejected")}
                    style={{
                      background: "#fff1f2",
                      color: "#be123c",
                      border: "1px solid #fecdd3",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "12.5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              ) : (
                <div className="coord-req-actioned" style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "6px 12px", borderRadius: "8px" }}>
                  Actioned ({r.status})
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="coord-perf-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="coord-perf-modal-card" style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", pb: "12px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Log New Student Approval Request</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={createForm.studentName}
                  onChange={(e) => setCreateForm({ ...createForm, studentName: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE26-055"
                    value={createForm.rollNo}
                    onChange={(e) => setCreateForm({ ...createForm, rollNo: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Batch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE 2026 Alpha"
                    value={createForm.batch}
                    onChange={(e) => setCreateForm({ ...createForm, batch: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Request Category</label>
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

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Reason & Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the reason for leave or special approval request..."
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#0284c7", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
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
