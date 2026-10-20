import React, { useState, useEffect } from "react";
import { 
  UserCheck, Check, Search, CheckCircle2, XCircle, Clock, 
  RefreshCw, AlertCircle, Mail, Phone, LayoutGrid, List, Eye, 
  X, Sparkles, Copy, Building2, ShieldCheck, GraduationCap
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/SA_ApproveUsers.css";

export default function SuperAdminApproveUsers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/pending-users");
      if (res && res.data && Array.isArray(res.data)) {
        const adminOnly = res.data.filter((u) => {
          const r = String(u.role || "").toLowerCase();
          const isVerifiedOr2fa = u.is_verified === 1 || u.is_verified === true || u.is_verified === "1" ||
                                  u.two_factor_enabled === 1 || u.two_factor_enabled === true || u.two_factor_enabled === "1";
          return (r === "college_admin" || r === "admin" || r === "hod" || r.includes("admin")) && !r.includes("super") && isVerifiedOr2fa;
        });
        setPendingUsers(adminOnly);
      } else {
        setPendingUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch pending users:", err);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyEmail = (email, id) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (user) => {
    if (!user || !user.id) return;
    setActionLoadingId(user.id);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/approve`, {
        method: "PATCH",
      });
      if (res && (res.success || !res.error)) {
        showToast(`Account approved for ${user.name}!`);
        setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
        if (selectedUserModal?.id === user.id) {
          setSelectedUserModal(null);
        }
      } else {
        showToast(res?.error || "Failed to approve user", "error");
      }
    } catch (err) {
      console.error("Error approving user:", err);
      showToast("Server error when approving user", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (user) => {
    if (!user || !user.id) return;
    if (!window.confirm(`Are you sure you want to reject registration for ${user.name}?`)) {
      return;
    }
    setActionLoadingId(user.id);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/reject`, {
        method: "PATCH",
      });
      if (res && (res.success || !res.error)) {
        showToast(`Registration rejected for ${user.name}`, "info");
        setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
        if (selectedUserModal?.id === user.id) {
          setSelectedUserModal(null);
        }
      } else {
        showToast(res?.error || "Failed to reject user", "error");
      }
    } catch (err) {
      console.error("Error rejecting user:", err);
      showToast("Server error when rejecting user", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Role Counts (Admin only for Super Admin)
  const collegeAdminCount = pendingUsers.filter((u) => {
    const r = String(u.role || "").toLowerCase();
    return r === "college_admin" || r === "admin" || r === "hod" || r.includes("admin");
  }).length;

  const collegesRepresentedCount = new Set(
    pendingUsers.map((u) => u.college_name || u.college || "General")
  ).size;

  // Filtered List based on Search Query
  const filteredUsers = pendingUsers.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.mobile_number && String(u.mobile_number).includes(q)) ||
      (u.college_name && u.college_name.toLowerCase().includes(q)) ||
      (u.college && u.college.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="sa-approve-container">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`sa-approve-toast ${toastMessage.type === "error" ? "error" : toastMessage.type === "info" ? "info" : "success"}`}>
          {toastMessage.type === "error" ? (
            <AlertCircle size={20} />
          ) : toastMessage.type === "info" ? (
            <Sparkles size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Page Header Section */}
      <div className="sa-approve-header">
        <div>
          <div className="sa-approve-title-row">
            <h1 className="sa-approve-page-title">Pending Registrations</h1>
            {pendingUsers.length > 0 && (
              <span className="sa-approve-count-badge">
                {pendingUsers.length} Action Required
              </span>
            )}
          </div>
          <p className="sa-approve-page-subtitle">
            Review and approve newly registered college admins, department heads, and institutional representatives before granting them portal access.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid - 3 Core Cards for Admin Approvals */}
      <div className="sa-approve-stats-grid">
        <div className="sa-approve-stat-card">
          <div>
            <div className="sa-approve-stat-lbl">Total Pending</div>
            <div className="sa-approve-stat-val">{pendingUsers.length}</div>
            <div className="sa-approve-stat-sub">Awaiting Super Admin review</div>
          </div>
          <div className="sa-approve-stat-icon sa-icon-amber">
            <Clock size={18} />
          </div>
        </div>

        <div className="sa-approve-stat-card">
          <div>
            <div className="sa-approve-stat-lbl">Admin Accounts</div>
            <div className="sa-approve-stat-val">{collegeAdminCount}</div>
            <div className="sa-approve-stat-sub">Campus administrative accounts</div>
          </div>
          <div className="sa-approve-stat-icon sa-icon-blue">
            <Building2 size={18} />
          </div>
        </div>

        <div className="sa-approve-stat-card">
          <div>
            <div className="sa-approve-stat-lbl">Institutions</div>
            <div className="sa-approve-stat-val">{collegesRepresentedCount}</div>
            <div className="sa-approve-stat-sub">Colleges requesting access</div>
          </div>
          <div className="sa-approve-stat-icon sa-icon-emerald">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Toolbar Section: Search & View Switcher */}
      <div className="sa-approve-toolbar">
        <div className="sa-approve-search-box">
          <Search size={17} className="sa-approve-search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, department, college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sa-approve-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="sa-approve-search-clear"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="sa-approve-view-switch">
          <button
            type="button"
            className={`sa-approve-view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Card Grid View"
          >
            <LayoutGrid size={17} />
          </button>
          <button
            type="button"
            className={`sa-approve-view-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Detailed Table View"
          >
            <List size={17} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="sa-approve-skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="sa-approve-skeleton-card" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="sa-approve-empty">
          <div className="sa-approve-empty-icon">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="sa-approve-empty-title">All Caught Up!</h3>
          <p className="sa-approve-empty-desc">
            {searchTerm
              ? `No pending registration requests match "${searchTerm}". Try resetting your search query.`
              : "There are currently no new registration requests waiting for approval."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="sa-approve-cards-grid">
          {filteredUsers.map((u) => {
            const isProcessing = actionLoadingId === u.id;
            return (
              <div key={u.id} className="sa-approve-card">
                <div>
                  <div className="sa-approve-card-top">
                    <div className="sa-approve-avatar">
                      {getInitials(u.name)}
                    </div>
                    <div className="sa-approve-user-info">
                      <div className="sa-approve-name-row">
                        <h3 className="sa-approve-name" title={u.name}>
                          {u.name}
                        </h3>
                        <span className="sa-approve-role-badge">
                          {u.role || "Admin"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="sa-approve-email-copy"
                        onClick={() => handleCopyEmail(u.email, u.id)}
                        title="Click to copy email"
                      >
                        <Mail size={13} />
                        <span className="sa-approve-email-text">
                          {u.email}
                        </span>
                        {copiedId === u.id && (
                          <span className="sa-approve-copied-tag">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="sa-approve-card-details">
                    {(u.college_name || u.college) && (
                      <div className="sa-approve-detail-row">
                        <Building2 size={15} className="sa-approve-detail-icon" />
                        <span className="sa-approve-highlight-text">{u.college_name || u.college}</span>
                      </div>
                    )}
                    {u.department && (
                      <div className="sa-approve-detail-row">
                        <GraduationCap size={15} className="sa-approve-detail-icon" />
                        <span>{u.department}</span>
                      </div>
                    )}
                    {u.mobile_number && (
                      <div className="sa-approve-detail-row">
                        <Phone size={15} className="sa-approve-detail-icon" />
                        <span>{u.mobile_number}</span>
                      </div>
                    )}
                    <div className="sa-approve-detail-row">
                      <Clock size={15} className="sa-approve-detail-icon" />
                      <span>
                        Registered {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recently"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sa-approve-card-footer">
                  <button
                    type="button"
                    className="sa-approve-btn-view"
                    onClick={() => setSelectedUserModal(u)}
                  >
                    <Eye size={15} />
                    <span>View Details</span>
                  </button>

                  <div className="sa-approve-actions-grp">
                    <button
                      type="button"
                      className="sa-approve-btn-reject"
                      onClick={() => handleReject(u)}
                      disabled={isProcessing}
                    >
                      <X size={15} />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      className="sa-approve-btn-accept"
                      onClick={() => handleApprove(u)}
                      disabled={isProcessing}
                    >
                      <Check size={15} />
                      <span>{isProcessing ? "Processing..." : "Approve"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="sa-approve-table-card">
          <div className="sa-approve-table-wrap">
            <table className="sa-approve-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Contact Info</th>
                  <th>College & Department</th>
                  <th>Registered On</th>
                  <th className="sa-approve-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isProcessing = actionLoadingId === u.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="sa-approve-table-user-wrap">
                          <div className="sa-approve-avatar sa-approve-avatar-sm">
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="sa-approve-table-user-name">{u.name}</div>
                            <span className="sa-approve-role-badge sa-approve-role-badge-table">
                              {u.role || "Admin"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="sa-approve-table-email">{u.email}</div>
                        {u.mobile_number && (
                          <div className="sa-approve-table-subtext">
                            {u.mobile_number}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="sa-approve-table-college">
                          {u.college_name || u.college || "Campus Admin"}
                        </div>
                        {u.department && (
                          <div className="sa-approve-table-subtext">
                            {u.department}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="sa-approve-table-date">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recently"}
                        </div>
                      </td>
                      <td className="sa-approve-td-actions">
                        <div className="sa-approve-table-actions-wrap">
                          <button
                            type="button"
                            className="sa-approve-btn-view"
                            onClick={() => setSelectedUserModal(u)}
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="sa-approve-btn-reject"
                            onClick={() => handleReject(u)}
                            disabled={isProcessing}
                          >
                            <X size={15} />
                            <span>Reject</span>
                          </button>
                          <button
                            type="button"
                            className="sa-approve-btn-accept"
                            onClick={() => handleApprove(u)}
                            disabled={isProcessing}
                          >
                            <Check size={15} />
                            <span>{isProcessing ? "Approving..." : "Approve"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserModal && (
        <div
          className="sa-approve-modal-backdrop"
          onClick={() => setSelectedUserModal(null)}
        >
          <div
            className="sa-approve-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sa-approve-modal-header">
              <div className="sa-approve-modal-user-info">
                <div className="sa-approve-avatar">
                  {getInitials(selectedUserModal.name)}
                </div>
                <div>
                  <h3 className="sa-approve-modal-title">{selectedUserModal.name}</h3>
                  <span className="sa-approve-role-badge">
                    {selectedUserModal.role || "Admin"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedUserModal(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="sa-approve-modal-body">
              <div className="sa-approve-modal-grid">
                <div className="sa-approve-modal-field">
                  <div className="sa-approve-modal-field-lbl">Email Address</div>
                  <div className="sa-approve-modal-field-val sa-approve-break-word">
                    {selectedUserModal.email}
                  </div>
                </div>

                <div className="sa-approve-modal-field">
                  <div className="sa-approve-modal-field-lbl">Mobile Number</div>
                  <div className="sa-approve-modal-field-val">
                    {selectedUserModal.mobile_number || "Not provided"}
                  </div>
                </div>

                {(selectedUserModal.college_name || selectedUserModal.college) && (
                  <div className="sa-approve-modal-field sa-approve-col-span-2">
                    <div className="sa-approve-modal-field-lbl">College / Institution</div>
                    <div className="sa-approve-modal-field-val">
                      {selectedUserModal.college_name || selectedUserModal.college}
                    </div>
                  </div>
                )}

                {selectedUserModal.department && (
                  <div className="sa-approve-modal-field sa-approve-col-span-2">
                    <div className="sa-approve-modal-field-lbl">Department</div>
                    <div className="sa-approve-modal-field-val">
                      {selectedUserModal.department}
                    </div>
                  </div>
                )}

                <div className="sa-approve-modal-field">
                  <div className="sa-approve-modal-field-lbl">Registered On</div>
                  <div className="sa-approve-modal-field-val">
                    {selectedUserModal.created_at
                      ? new Date(selectedUserModal.created_at).toLocaleString()
                      : "Recently"}
                  </div>
                </div>

                <div className="sa-approve-modal-field">
                  <div className="sa-approve-modal-field-lbl">Verification Status</div>
                  <div className="sa-approve-modal-field-val sa-approve-status-pending">
                    Pending Approval
                  </div>
                </div>
              </div>
            </div>

            <div className="sa-approve-modal-footer">
              <button
                type="button"
                className="sa-approve-btn-reject"
                onClick={() => handleReject(selectedUserModal)}
                disabled={actionLoadingId === selectedUserModal.id}
              >
                <X size={16} />
                <span>Reject Registration</span>
              </button>
              <button
                type="button"
                className="sa-approve-btn-accept"
                onClick={() => handleApprove(selectedUserModal)}
                disabled={actionLoadingId === selectedUserModal.id}
              >
                <Check size={16} />
                <span>Approve Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
