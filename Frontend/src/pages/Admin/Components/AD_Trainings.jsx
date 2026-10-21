import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Briefcase,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  XCircle,
  Clock,
  Plus,
  ArrowLeft,
  Copy,
  Edit3,
  Calendar,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";
import CustomSelect from "../../../components/ui/CustomSelect";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_Trainings.css";
import "../Styles/AD_C2CEnrollments.css";

const statusBadgeClasses = {
  open: "badge-status--open",
  draft: "badge-status--draft",
  closed: "badge-status--closed",
  completed: "badge-status--completed",
};

const approvalBadgeClasses = {
  approved: "badge-approval--approved",
  pending: "badge-approval--pending",
  rejected: "badge-approval--rejected",
};

const paymentStatusMeta = {
  completed: { label: "Completed", cls: "c2c-status--paid" },
  paid: { label: "Completed", cls: "c2c-status--paid" },
  "part payment": { label: "Part Payment", cls: "c2c-status--partial" },
  partial: { label: "Part Payment", cls: "c2c-status--partial" },
  pending: { label: "Pending", cls: "c2c-status--unpaid" },
  unpaid: { label: "Pending", cls: "c2c-status--unpaid" },
  cancelled: { label: "Cancelled", cls: "c2c-status--cancelled" },
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || val === "") return "₹0";
  const num = Number(val);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : "₹0";
};

const textValue = (val) => {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str || null;
};

const getInitials = (name) => {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function AdminTrainings() {
  // Views: 'trainings_list' | 'enrollments_drilldown'
  const [viewMode, setViewMode] = useState("trainings_list");
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);

  // Data states
  const [trainingsList, setTrainingsList] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [enrollmentsData, setEnrollmentsData] = useState({ enrollments: [], counts: null, training: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Filters for Trainings List
  const [programSearch, setProgramSearch] = useState("");
  const [programStatusFilter, setProgramStatusFilter] = useState("all");

  // Filters for Enrollments Drilldown
  const [studentSearch, setStudentSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");

  // Modals
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null); // null for new, obj for edit
  const [programForm, setProgramForm] = useState({
    name: "",
    code: "",
    short_name: "",
    description: "",
    start_date: "",
    end_date: "",
    registration_open_date: "",
    registration_close_date: "",
    fee_amount: 3500,
    payment_instructions: "",
    payment_qr_url: "",
    eligibility_criteria: "",
    status: "Open",
    google_sheet_url: "",
  });

  const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
  const [amountModalData, setAmountModalData] = useState({ enrollmentId: null, studentName: "", totalFee: 0, currentPaid: 0, newPaid: "" });
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferModalData, setTransferModalData] = useState({ enrollmentId: null, studentName: "", currentTrainingName: "", targetTrainingId: "" });
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Fetch all trainings & overview stats
  const fetchTrainingsAndStats = useCallback(async () => {
    try {
      const [trainingsRes, statsRes] = await Promise.all([
        apiFetch("/trainings"),
        apiFetch("/trainings/overview-stats"),
      ]);

      if (trainingsRes?.data) {
        setTrainingsList(Array.isArray(trainingsRes.data) ? trainingsRes.data : []);
      }
      if (statsRes?.data) {
        setOverallStats(statsRes.data);
      }
    } catch (err) {
      console.error("[fetchTrainings error]", err);
      setError("Failed to load training programs: " + err.message);
    }
  }, []);

  // Fetch specific training enrollments
  const fetchTrainingEnrollments = useCallback(async (trainingId) => {
    if (!trainingId) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/trainings/${trainingId}/enrollments`);
      if (res?.data) {
        setEnrollmentsData(res.data);
        setSelectedTraining(res.data.training);
      }
    } catch (err) {
      console.error("[fetchTrainingEnrollments error]", err);
      setError("Failed to load enrollments: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchTrainingsAndStats().finally(() => setLoading(false));
  }, [fetchTrainingsAndStats]);

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    if (viewMode === "trainings_list") {
      fetchTrainingsAndStats().finally(() => setLoading(false));
    } else if (selectedTrainingId) {
      fetchTrainingEnrollments(selectedTrainingId);
    }
  };

  const handleOpenDrilldown = (training) => {
    setSelectedTrainingId(training.id);
    setSelectedTraining(training);
    setViewMode("enrollments_drilldown");
    fetchTrainingEnrollments(training.id);
  };

  const handleBackToList = () => {
    setViewMode("trainings_list");
    setSelectedTrainingId(null);
    setSelectedTraining(null);
    fetchTrainingsAndStats();
  };

  const handleCopyLink = (training) => {
    const origin = window.location.origin;
    const url = `${origin}/trainings/register?code=${encodeURIComponent(training.code)}`;
    navigator.clipboard.writeText(url).then(
      () => showToast(`Copied registration link for '${training.name}'!`),
      () => alert(`Registration Link: ${url}`)
    );
  };

  // Open Create/Edit modal
  const handleOpenProgramModal = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setProgramForm({
        name: program.name || "",
        code: program.code || "",
        short_name: program.short_name || "",
        description: program.description || "",
        start_date: program.start_date ? program.start_date.substring(0, 10) : "",
        end_date: program.end_date ? program.end_date.substring(0, 10) : "",
        registration_open_date: program.registration_open_date ? program.registration_open_date.substring(0, 10) : "",
        registration_close_date: program.registration_close_date ? program.registration_close_date.substring(0, 10) : "",
        fee_amount: program.fee_amount !== undefined ? program.fee_amount : 3500,
        payment_instructions: program.payment_instructions || "",
        payment_qr_url: program.payment_qr_url || "",
        eligibility_criteria: program.eligibility_criteria || "",
        status: program.status || "Open",
        google_sheet_url: program.google_sheet_url || "",
      });
    } else {
      setEditingProgram(null);
      setProgramForm({
        name: "",
        code: "",
        short_name: "",
        description: "",
        start_date: "",
        end_date: "",
        registration_open_date: "",
        registration_close_date: "",
        fee_amount: 3500,
        payment_instructions: "Scan the QR code or pay via UPI to register. Keep your UTR number ready.",
        payment_qr_url: "",
        eligibility_criteria: "Open for all registered students.",
        status: "Open",
        google_sheet_url: "",
      });
    }
    setIsProgramModalOpen(true);
  };

  // Submit Program form
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!programForm.name.trim() || !programForm.code.trim()) {
      alert("Training Name and Unique Code are required.");
      return;
    }

    try {
      let res;
      if (editingProgram) {
        res = await apiFetch(`/trainings/${editingProgram.id}`, {
          method: "PUT",
          body: JSON.stringify(programForm),
        });
      } else {
        res = await apiFetch("/trainings", {
          method: "POST",
          body: JSON.stringify(programForm),
        });
      }

      if (res?.error) {
        alert("Failed to save training: " + res.error);
        return;
      }

      setIsProgramModalOpen(false);
      showToast(editingProgram ? "Training updated successfully!" : "New Training program created successfully!");
      fetchTrainingsAndStats();
    } catch (err) {
      alert("Error saving training: " + err.message);
    }
  };

  // Update Training status directly from table
  const handleChangeProgramStatus = async (trainingId, newStatus) => {
    try {
      const res = await apiFetch(`/trainings/${trainingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res?.error) {
        alert("Failed to update status: " + res.error);
      } else {
        showToast(`Training status updated to ${newStatus}`);
        fetchTrainingsAndStats();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Enrollment actions: Payment Status change
  const handlePaymentStatusChange = async (enrollmentId, newPaymentStatus) => {
    setActionInProgressId(enrollmentId);
    try {
      const res = await apiFetch(`/trainings/enrollments/${enrollmentId}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });

      if (res?.error) {
        alert("Failed to update payment status: " + res.error);
      } else {
        showToast(`Payment status updated to '${newPaymentStatus}'`);
        // Refresh drilldown data
        fetchTrainingEnrollments(selectedTrainingId);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Enrollment actions: Approval Status change
  const handleApprovalChange = async (enrollmentId, newApprovalStatus) => {
    setActionInProgressId(enrollmentId);
    try {
      const res = await apiFetch(`/trainings/enrollments/${enrollmentId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ approval_status: newApprovalStatus }),
      });

      if (res?.error) {
        alert("Failed to update approval: " + res.error);
      } else {
        showToast(`Registration marked as '${newApprovalStatus}'`);
        fetchTrainingEnrollments(selectedTrainingId);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Open Edit Paid Amount Modal
  const handleOpenAmountModal = (row) => {
    const totalFee = row.total_fee || selectedTraining?.fee_amount || 3500;
    setAmountModalData({
      enrollmentId: row.id,
      studentName: row.full_name || row.name || "Student",
      totalFee: totalFee,
      currentPaid: row.amount_paid || 0,
      newPaid: String(row.amount_paid || 0),
    });
    setIsAmountModalOpen(true);
  };

  const handleSaveAmountPaid = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(amountModalData.newPaid);
    if (isNaN(parsed) || parsed < 0) {
      alert("Please enter a valid numeric amount.");
      return;
    }

    try {
      const res = await apiFetch(`/trainings/enrollments/${amountModalData.enrollmentId}/payment`, {
        method: "PATCH",
        body: JSON.stringify({
          amount_paid: parsed,
          payment_status: parsed >= amountModalData.totalFee ? "Completed" : parsed > 0 ? "Part Payment" : "Pending",
        }),
      });

      if (res?.error) {
        alert("Failed to update amount: " + res.error);
      } else {
        setIsAmountModalOpen(false);
        showToast("Amount paid updated successfully!");
        fetchTrainingEnrollments(selectedTrainingId);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleOpenTransferModal = (row) => {
    const candidate = trainingsList.find((t) => t.id !== selectedTrainingId);
    setTransferModalData({
      enrollmentId: row.id,
      studentName: row.full_name || row.name || "Student",
      currentTrainingName: selectedTraining?.name || row.training_name || "Current Training",
      targetTrainingId: candidate ? String(candidate.id) : "",
    });
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    if (!transferModalData.targetTrainingId) {
      alert("Please select a target training program.");
      return;
    }
    setActionInProgressId(transferModalData.enrollmentId);
    try {
      const res = await apiFetch(`/trainings/enrollments/${transferModalData.enrollmentId}/transfer`, {
        method: "PATCH",
        body: JSON.stringify({ target_training_id: transferModalData.targetTrainingId }),
      });
      if (res?.error) {
        alert("Failed to transfer student: " + res.error);
      } else {
        setIsTransferModalOpen(false);
        showToast(res?.message || "Student transferred to target training successfully!");
        fetchTrainingEnrollments(selectedTrainingId);
        fetchTrainingsAndStats();
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Filtered trainings
  const filteredTrainings = trainingsList.filter((t) => {
    const q = programSearch.trim().toLowerCase();
    if (q) {
      const hay = [t.name, t.code, t.short_name, t.description].map(textValue).filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (programStatusFilter !== "all" && String(t.status).toLowerCase() !== programStatusFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Filtered enrollments for drill-down
  const drilldownEnrollments = enrollmentsData.enrollments || [];
  const branchOptions = [...new Set(drilldownEnrollments.map((r) => textValue(r.branch || r.department)).filter(Boolean))].sort();

  const filteredEnrollments = drilldownEnrollments.filter((row) => {
    const q = studentSearch.trim().toLowerCase();
    if (q) {
      const hay = [row.name, row.full_name, row.roll_number, row.email, row.mobile, row.utr_number]
        .map(textValue)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (branchFilter !== "all" && (row.branch || row.department) !== branchFilter) return false;

    if (paymentFilter !== "all") {
      const normPay = String(row.payment_status || "Pending").toLowerCase();
      const target = paymentFilter.toLowerCase();
      if (target === "completed" && !["completed", "paid"].includes(normPay)) return false;
      if (target === "part payment" && !["part payment", "partial"].includes(normPay)) return false;
      if (target === "pending" && !["pending", "unpaid"].includes(normPay)) return false;
      if (target === "cancelled" && normPay !== "cancelled") return false;
    }

    if (approvalFilter !== "all") {
      const normApp = String(row.approval_status || "Pending").toLowerCase();
      if (normApp !== approvalFilter.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <div className="admin-page-inner trainings-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="trainings-toast">
          <CheckCircle2 size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb / Top Bar */}
      {viewMode === "enrollments_drilldown" ? (
        <div className="trainings-view-nav">
          <div className="trainings-breadcrumb">
            <button type="button" className="trainings-btn-back" onClick={handleBackToList}>
              <ArrowLeft size={16} /> All Trainings
            </button>
            <span>/</span>
            <span className="trainings-breadcrumb-active">
              {selectedTraining?.name || "Training"}
            </span>
            <span className="code-pill">{selectedTraining?.code}</span>
          </div>

          <div className="trainings-header-actions">
            <button
              type="button"
              className="trainings-btn-secondary"
              onClick={() => handleCopyLink(selectedTraining)}
              title="Copy Registration Link"
            >
              <Copy size={15} /> Copy Registration Link
            </button>
            <button
              type="button"
              className="trainings-btn-secondary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="ui-section-header-AD">
          <div className="ui-section-main-AD">
            <div>
              <h2 className="ui-section-title">
                <Briefcase size={22} className="ui-section-title-icon" />
                <span>Training Management & Enrollments</span>
              </h2>
              <p className="ui-section-desc">
                Manage multiple training programs, configure fees and registration links, verify payments, and review student approvals.
              </p>
            </div>
            <div className="ui-section-action trainings-header-actions">
              <button
                type="button"
                className="trainings-btn-primary"
                onClick={() => handleOpenProgramModal(null)}
              >
                <Plus size={16} /> Create Training
              </button>
              <button
                type="button"
                className="trainings-btn-secondary"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="c2c-error-banner">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* =========================================================================
          VIEW 1: ALL TRAININGS OVERVIEW & TABLE
          ========================================================================= */}
      {viewMode === "trainings_list" && (
        <>
          {/* 5 Overall Metric Cards */}
          <div className="trainings-stats-grid">
            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--indigo">
                <Briefcase size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">{overallStats?.total_trainings ?? trainingsList.length}</span>
                <span className="trainings-stat-lbl">Total Programs</span>
              </div>
            </div>

            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--emerald">
                <CheckCircle2 size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">{overallStats?.open_trainings ?? trainingsList.filter((t) => t.status === "Open").length}</span>
                <span className="trainings-stat-lbl">Open Trainings</span>
              </div>
            </div>

            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--blue">
                <Users size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">{overallStats?.total_registrations ?? 0}</span>
                <span className="trainings-stat-lbl">Total Registrations</span>
              </div>
            </div>

            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--amber">
                <Clock size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">{overallStats?.pending_approvals ?? 0}</span>
                <span className="trainings-stat-lbl">Pending Approvals</span>
              </div>
            </div>

            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--rose">
                <TrendingUp size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">{overallStats?.pending_payments ?? 0}</span>
                <span className="trainings-stat-lbl">Pending Payments</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="trainings-toolbar">
            <div className="trainings-search-wrap">
              <Search size={16} className="trainings-search-icon" />
              <input
                type="text"
                className="trainings-search-input"
                placeholder="Search training by name, unique code, or keywords..."
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
              />
              {programSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setProgramSearch("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="trainings-filters">
              <CustomSelect
                value={programStatusFilter}
                onChange={(val) => setProgramStatusFilter(val)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "Open", label: "Open" },
                  { value: "Draft", label: "Draft" },
                  { value: "Closed", label: "Closed" },
                  { value: "Completed", label: "Completed" },
                ]}
                className="c2c-custom-select"
              />
            </div>
          </div>

          {/* Trainings Table */}
          <div className="trainings-table-card">
            <div className="trainings-table-responsive">
              <table className="trainings-table">
                <thead>
                  <tr>
                    <th>Training Program</th>
                    <th>Code / ID</th>
                    <th>Fee</th>
                    <th>Dates / Duration</th>
                    <th>Status</th>
                    <th>Registrations</th>
                    <th>Approved</th>
                    <th>Pending</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && trainingsList.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="c2c-empty">Loading training programs...</div>
                      </td>
                    </tr>
                  ) : filteredTrainings.length > 0 ? (
                    filteredTrainings.map((t) => {
                      const statusKey = String(t.status || "Draft").toLowerCase();
                      const statusCls = statusBadgeClasses[statusKey] || "badge-status--draft";
                      const totalRegs = t.total_registrations || 0;
                      const approvedCount = t.approved_count || 0;
                      const pendingCount = t.pending_approval_count || 0;

                      const startDate = t.start_date ? new Date(t.start_date).toLocaleDateString("en-IN") : "—";
                      const endDate = t.end_date ? new Date(t.end_date).toLocaleDateString("en-IN") : "—";

                      return (
                        <tr key={t.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{t.name}</div>
                            {t.description && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#64748b",
                                  maxWidth: "280px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {t.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="code-pill">{t.code}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>
                              {formatCurrency(t.fee_amount)}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: "12.5px", color: "#334155" }}>
                              {startDate} to {endDate}
                            </div>
                            {t.registration_close_date && (
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                Closes: {new Date(t.registration_close_date).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </td>
                          <td>
                            <CustomSelect
                              value={t.status || "Open"}
                              options={[
                                { value: "Draft", label: "Draft" },
                                { value: "Open", label: "Open" },
                                { value: "Closed", label: "Closed" },
                                { value: "Completed", label: "Completed" },
                              ]}
                              onChange={(val) => handleChangeProgramStatus(t.id, val)}
                              className="ad-training-table-select"
                            />
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{totalRegs}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: "#059669" }}>{approvedCount}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: pendingCount > 0 ? "#d97706" : "#64748b" }}>
                              {pendingCount}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="btn-action-sm btn-action-primary"
                                onClick={() => handleOpenDrilldown(t)}
                                title="Manage Enrollments"
                              >
                                Manage Enrollments
                              </button>
                              <button
                                type="button"
                                className="btn-action-sm"
                                onClick={() => handleCopyLink(t)}
                                title="Copy Public Registration Link"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-action-sm"
                                onClick={() => handleOpenProgramModal(t)}
                                title="Edit Training Details"
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9}>
                        <div className="c2c-empty">
                          <Briefcase size={28} />
                          <p>No training programs found. Create your first training to get started.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW 2: SPECIFIC PROGRAM ENROLLMENTS DRILL-DOWN
          ========================================================================= */}
      {viewMode === "enrollments_drilldown" && (
        <>
          {/* Program Specific 5-Stat Cards */}
          <div className="trainings-stats-grid">
            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--indigo">
                <Users size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">
                  {enrollmentsData?.counts?.total ?? drilldownEnrollments.length}
                </span>
                <span className="trainings-stat-lbl">Total Enrolled</span>
              </div>
            </div>

            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--emerald">
                <CheckCircle2 size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">{enrollmentsData?.counts?.approved ?? 0}</span>
                <span className="trainings-stat-lbl">Approved Students</span>
              </div>
            </div>

            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--amber">
                <Clock size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">{enrollmentsData?.counts?.pending_approval ?? 0}</span>
                <span className="trainings-stat-lbl">Pending Approval</span>
              </div>
            </div>

            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--blue">
                <CheckCircle2 size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">{enrollmentsData?.counts?.completed ?? 0}</span>
                <span className="trainings-stat-lbl">Completed Payment</span>
              </div>
            </div>

            <div className="trainings-stat-card">
              <div className="trainings-stat-icon trainings-stat-icon--rose">
                <TrendingUp size={22} />
              </div>
              <div className="trainings-stat-info">
                <span className="trainings-stat-num">
                  {(enrollmentsData?.counts?.pending ?? 0) + (enrollmentsData?.counts?.partPayment ?? 0)}
                </span>
                <span className="trainings-stat-lbl">Pending / Partial Pay</span>
              </div>
            </div>
          </div>

          {/* Drilldown Toolbar & Filters */}
          <div className="trainings-toolbar">
            <div className="trainings-search-wrap">
              <Search size={16} className="trainings-search-icon" />
              <input
                type="text"
                className="trainings-search-input"
                placeholder="Search by student name, email, roll number, mobile or UTR..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              {studentSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setStudentSearch("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="trainings-filters">
              <CustomSelect
                value={branchFilter}
                onChange={(val) => setBranchFilter(val)}
                options={[
                  { value: "all", label: "All Branches" },
                  ...branchOptions.map((b) => ({ value: b, label: b })),
                ]}
                className="c2c-custom-select"
              />
              <CustomSelect
                value={paymentFilter}
                onChange={(val) => setPaymentFilter(val)}
                options={[
                  { value: "all", label: "Payment: All" },
                  { value: "Pending", label: "Payment: Pending" },
                  { value: "Part Payment", label: "Payment: Part Payment" },
                  { value: "Completed", label: "Payment: Completed" },
                  { value: "Cancelled", label: "Payment: Cancelled" },
                ]}
                className="c2c-custom-select"
              />
              <CustomSelect
                value={approvalFilter}
                onChange={(val) => setApprovalFilter(val)}
                options={[
                  { value: "all", label: "Approval: All" },
                  { value: "Approved", label: "Approval: Approved" },
                  { value: "Pending", label: "Approval: Pending" },
                  { value: "Rejected", label: "Approval: Rejected" },
                ]}
                className="c2c-custom-select"
              />
            </div>
          </div>

          {/* Enrollments Table */}
          <div className="trainings-table-card">
            <div className="trainings-table-responsive">
              <table className="trainings-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>College / Branch</th>
                    <th>Fee</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Payment Status</th>
                    <th>Approval Status</th>
                    <th>UTR Number</th>
                    <th>Proof</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && drilldownEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={11}>
                        <div className="c2c-empty">Loading student enrollments...</div>
                      </td>
                    </tr>
                  ) : filteredEnrollments.length > 0 ? (
                    filteredEnrollments.map((row, idx) => {
                      const currentPayment = row.payment_status || "Pending";
                      const payMeta = paymentStatusMeta[String(currentPayment).toLowerCase()] || {
                        label: currentPayment,
                        cls: "",
                      };

                      const approvalStatus = row.approval_status || "Pending";
                      const appCls = approvalBadgeClasses[String(approvalStatus).toLowerCase()] || "badge-approval--pending";

                      const name = textValue(row.full_name || row.name) || "Student";
                      const rollNumber = textValue(row.roll_number) || "N/A";
                      const college = textValue(row.college) || "";
                      const branch = textValue(row.branch || row.department) || "N/A";
                      const year = textValue(row.year) || "";
                      const div = textValue(row.division) || "";
                      const batch = textValue(row.batch) || "";

                      const totalFee = row.total_fee || selectedTraining?.fee_amount || 3500;
                      const amountPaid = row.amount_paid !== undefined ? row.amount_paid : 0;
                      const balance = row.balance !== undefined ? row.balance : Math.max(0, totalFee - amountPaid);

                      const utr = textValue(row.utr_number) || "—";
                      const proofUrl = row.payment_proof_url;
                      const dateStr = row.created_at || row.payment_date;
                      const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "—";

                      const isBusy = actionInProgressId === row.id;

                      return (
                        <tr key={row.id || idx}>
                          <td>
                            <div className="c2c-user-cell">
                              <div className="c2c-avatar">{getInitials(name)}</div>
                              <div>
                                <div className="c2c-name-title">{name}</div>
                                <div className="c2c-email-sub">
                                  {rollNumber !== "N/A" ? `Roll: ${rollNumber}` : ""}
                                  {row.email ? ` · ${row.email}` : ""}
                                  {row.mobile ? ` · Ph: ${row.mobile}` : ""}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="c2c-branch">{branch}</div>
                            <div className="c2c-batch" title={college}>
                              {college ? `${college} · ` : ""}
                              {[year, div, batch].filter(Boolean).join(" ")}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>
                              {formatCurrency(totalFee)}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 600,
                                color: amountPaid > 0 ? "#059669" : "#64748b",
                              }}
                            >
                              {formatCurrency(amountPaid)}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 600,
                                color: balance > 0 ? "#e11d48" : "#059669",
                              }}
                            >
                              {formatCurrency(balance)}
                            </span>
                          </td>
                          <td>
                            <CustomSelect
                              value={currentPayment}
                              disabled={isBusy}
                              options={[
                                { value: "Pending", label: "Pending" },
                                { value: "Part Payment", label: "Part Payment" },
                                { value: "Completed", label: "Completed" },
                                { value: "Cancelled", label: "Cancelled" },
                              ]}
                              onChange={(val) => handlePaymentStatusChange(row.id, val)}
                              className="ad-training-table-select"
                            />
                          </td>
                          <td>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span className={`badge-approval ${appCls}`}>
                                {approvalStatus}
                              </span>
                              {approvalStatus === "Pending" && (
                                <div style={{ display: "inline-flex", gap: "3px" }}>
                                  <button
                                    type="button"
                                    className="btn-action-sm btn-action-success"
                                    style={{ padding: "2px 6px", fontSize: "11px" }}
                                    onClick={() => handleApprovalChange(row.id, "Approved")}
                                    disabled={isBusy}
                                    title="Approve Student"
                                  >
                                    <Check size={12} /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-action-sm btn-action-danger"
                                    style={{ padding: "2px 6px", fontSize: "11px" }}
                                    onClick={() => handleApprovalChange(row.id, "Rejected")}
                                    disabled={isBusy}
                                    title="Reject Student"
                                  >
                                    <X size={12} /> Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: "12px",
                                color: "#334155",
                              }}
                            >
                              {utr}
                            </span>
                          </td>
                          <td>
                            {proofUrl && /^https?:\/\//i.test(proofUrl) ? (
                              <a
                                href={proofUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="c2c-proof-link"
                              >
                                <ExternalLink size={13} /> View
                              </a>
                            ) : (
                              <span className="c2c-proof-none">—</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {formattedDate}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              className="btn-action-sm"
                              style={{ marginRight: "6px" }}
                              onClick={() => handleOpenAmountModal(row)}
                              disabled={isBusy}
                            >
                              Edit Paid
                            </button>
                            <button
                              type="button"
                              className="btn-action-sm"
                              style={{ background: "#f8fafc", color: "#4f46e5", border: "1px solid #c7d2fe" }}
                              onClick={() => handleOpenTransferModal(row)}
                              disabled={isBusy}
                              title="Move / Reallocate student to another training program"
                            >
                              Move Training
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11}>
                        <div className="c2c-empty">
                          <Users size={28} />
                          <p>No enrollment records found for this training program.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          MODAL: CREATE / EDIT TRAINING PROGRAM
          ========================================================================= */}
      {isProgramModalOpen && createPortal(
        <div className="trainings-modal-backdrop" onClick={() => setIsProgramModalOpen(false)}>
          <div className="trainings-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="trainings-modal-header">
              <h3 className="trainings-modal-title">
                {editingProgram ? "Edit Training Program" : "Create New Training Program"}
              </h3>
              <button
                type="button"
                className="trainings-modal-close"
                onClick={() => setIsProgramModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgram}>
              <div className="trainings-modal-body">
                <div className="form-row-grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Training Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AWS Cloud Masterclass 2026"
                      value={programForm.name}
                      onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Unique Training Code <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AWS-2026"
                      value={programForm.code}
                      onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })}
                      required
                    />
                    <span className="form-hint">Must be unique across all trainings. Used in registration URL.</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Brief overview of curriculum and skills covered..."
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  />
                </div>

                <div className="form-row-grid-2">
                  <div className="form-group">
                    <label className="form-label">Training Fee (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="3500"
                      value={programForm.fee_amount}
                      onChange={(e) => setProgramForm({ ...programForm, fee_amount: e.target.value })}
                      min={0}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Status</label>
                    <CustomSelect
                      value={programForm.status}
                      options={[
                        { value: "Open", label: "Open (Accepting Registrations)" },
                        { value: "Draft", label: "Draft (Hidden)" },
                        { value: "Closed", label: "Closed" },
                        { value: "Completed", label: "Completed" },
                      ]}
                      onChange={(val) => setProgramForm({ ...programForm, status: val })}
                    />
                  </div>
                </div>

                <div className="form-row-grid-2">
                  <div className="form-group">
                    <label className="form-label">Training Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={programForm.start_date}
                      onChange={(e) => setProgramForm({ ...programForm, start_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Training End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={programForm.end_date}
                      onChange={(e) => setProgramForm({ ...programForm, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-grid-2">
                  <div className="form-group">
                    <label className="form-label">Registration Opens</label>
                    <input
                      type="date"
                      className="form-input"
                      value={programForm.registration_open_date}
                      onChange={(e) => setProgramForm({ ...programForm, registration_open_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Closes</label>
                    <input
                      type="date"
                      className="form-input"
                      value={programForm.registration_close_date}
                      onChange={(e) => setProgramForm({ ...programForm, registration_close_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Instructions & Details</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Instructions shown to student on registration page..."
                    value={programForm.payment_instructions}
                    onChange={(e) => setProgramForm({ ...programForm, payment_instructions: e.target.value })}
                  />
                </div>

                <div className="form-row-grid-2">
                  <div className="form-group">
                    <label className="form-label">Payment QR Image URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://.../qr.png"
                      value={programForm.payment_qr_url}
                      onChange={(e) => setProgramForm({ ...programForm, payment_qr_url: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Linked Google Sheet URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={programForm.google_sheet_url}
                      onChange={(e) => setProgramForm({ ...programForm, google_sheet_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Eligibility Criteria & Restrictions</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BE / TE students from CS, IT, and AI-DS branches"
                    value={programForm.eligibility_criteria}
                    onChange={(e) => setProgramForm({ ...programForm, eligibility_criteria: e.target.value })}
                  />
                </div>
              </div>

              <div className="trainings-modal-footer">
                <button
                  type="button"
                  className="trainings-btn-secondary"
                  onClick={() => setIsProgramModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="trainings-btn-primary">
                  {editingProgram ? "Update Training" : "Create Training"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          MODAL: EDIT PAID AMOUNT
          ========================================================================= */}
      {isAmountModalOpen && createPortal(
        <div className="trainings-modal-backdrop" onClick={() => setIsAmountModalOpen(false)}>
          <div className="trainings-modal-dialog" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="trainings-modal-header">
              <h3 className="trainings-modal-title">Edit Amount Paid</h3>
              <button
                type="button"
                className="trainings-modal-close"
                onClick={() => setIsAmountModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAmountPaid}>
              <div className="trainings-modal-body">
                <p style={{ fontSize: "13.5px", color: "#475569", margin: 0 }}>
                  Updating payment record for <strong>{amountModalData.studentName}</strong>.
                </p>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                  <div>Total Program Fee: <strong>{formatCurrency(amountModalData.totalFee)}</strong></div>
                  <div>Current Recorded Paid: <strong>{formatCurrency(amountModalData.currentPaid)}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    New Amount Paid (₹) <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={amountModalData.newPaid}
                    onChange={(e) => setAmountModalData({ ...amountModalData, newPaid: e.target.value })}
                    min={0}
                    required
                    autoFocus
                  />
                  <span className="form-hint">
                    Outstanding balance will be updated automatically.
                  </span>
                </div>
              </div>

              <div className="trainings-modal-footer">
                <button
                  type="button"
                  className="trainings-btn-secondary"
                  onClick={() => setIsAmountModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="trainings-btn-primary">
                  Save Amount
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
