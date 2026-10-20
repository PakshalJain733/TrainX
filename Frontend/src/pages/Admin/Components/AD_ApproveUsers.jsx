import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { UserCheck, Check, Search, CheckCircle2, XCircle, Clock, GraduationCap, Briefcase, Users, RefreshCw, AlertCircle, Mail, Phone, LayoutGrid, List, Eye, X, Sparkles, Copy, Building2, Calendar, UserCog, ShieldCheck, BookOpen, Layers, Hash } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_ApproveUsers.css";

export default function AD_ApproveUsers() {
  const location = useLocation();
  let storedUser = null;
  try {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (raw) storedUser = JSON.parse(raw);
  } catch (e) {
    storedUser = null;
  }
  const isSuperAdmin =
    location.pathname.toLowerCase().includes("/super-admin") ||
    location.pathname.toLowerCase().includes("/superadmin") ||
    String(storedUser?.role || "").toLowerCase().includes("super");

  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
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
        // Both Super Admin and College Admin receive their respective pending users directly from the backend API
        setPendingUsers(res.data);
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

  // Filtered List
  const filteredUsers = pendingUsers.filter((u) => {
    const roleLower = String(u.role || "").toLowerCase();
    let matchesRole = true;
    if (selectedRole !== "all") {
      if (selectedRole === "admin") {
        matchesRole = roleLower === "college_admin" || roleLower === "admin" || roleLower.includes("admin");
      } else if (selectedRole === "student") {
        matchesRole = roleLower.includes("student");
      } else if (selectedRole === "mentor") {
        matchesRole = roleLower.includes("mentor") || roleLower.includes("faculty");
      } else if (selectedRole === "coordinator") {
        matchesRole = roleLower.includes("coordinator");
      } else {
        matchesRole = roleLower === selectedRole.toLowerCase();
      }
    }

    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      ((u.mobile_number || u.mobile || u.phone) && String(u.mobile_number || u.mobile || u.phone).includes(q)) ||
      (u.college_name && u.college_name.toLowerCase().includes(q)) ||
      (u.college && u.college.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.roll_number && String(u.roll_number).toLowerCase().includes(q));

    return matchesRole && matchesSearch;
  });

  // Initials Helper
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Super Admin counts
  const collegeAdminCount = pendingUsers.filter((u) => {
    const r = String(u.role || "").toLowerCase();
    return r === "college_admin" || r === "admin" || r.includes("admin");
  }).length;
  const collegesRepresentedCount = new Set(
    pendingUsers.map((u) => u.college_name || u.college || "General")
  ).size;

  // College Admin counts
  const studentCount = pendingUsers.filter((u) => String(u.role).toLowerCase() === "student").length;
  const mentorCount = pendingUsers.filter(
    (u) => String(u.role).toLowerCase() === "mentor" || String(u.role).toLowerCase() === "faculty"
  ).length;
  const coordCount = pendingUsers.filter((u) => String(u.role).toLowerCase() === "coordinator").length;

  return (
    <div className="approve-users-container">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "14px 22px",
            borderRadius: "14px",
            background: toastMessage.type === "error" ? "#fff1f2" : toastMessage.type === "info" ? "#eff6ff" : "#ecfdf5",
            border: `1.5px solid ${toastMessage.type === "error" ? "#fecdd3" : toastMessage.type === "info" ? "#bfdbfe" : "#a7f3d0"}`,
            color: toastMessage.type === "error" ? "#be123c" : toastMessage.type === "info" ? "#1d4ed8" : "#047857",
            fontWeight: "700",
            fontSize: "14px",
            boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.12)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            animation: "fadeIn 0.25s ease-out",
          }}
        >
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
      <div className="approve-text-header">
        <div>
          <div className="approve-title-row">
            <UserCheck size={24} className="ui-section-title-icon" />
            <h1 className="approve-page-title">Pending Registrations</h1>
            {pendingUsers.length > 0 && (
              <span className="approve-count-badge">
                {pendingUsers.length} Action Required
              </span>
            )}
          </div>
          <p className="approve-page-subtitle">
            {isSuperAdmin
              ? "Review and approve newly registered college admins, department heads, and institutional representatives before granting them portal access."
              : "Review and approve newly registered students, mentors, and coordinators before granting them full access to the portal."}
          </p>
        </div>

        <div className="approve-header-actions">
          <button
            type="button"
            onClick={fetchPendingUsers}
            className="approve-btn-refresh-text"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="approve-stats-grid">
        <div className="approve-stat-card">
          <div>
            <div className="approve-stat-lbl">Total Pending</div>
            <div className="approve-stat-val">{pendingUsers.length}</div>
            <div className="approve-stat-sub">
              {isSuperAdmin ? "Awaiting Super Admin review" : "Awaiting admin review"}
            </div>
          </div>
          <div className="approve-stat-icon-wrap icon-wrap--amber">
            <Clock size={24} />
          </div>
        </div>

        {isSuperAdmin ? (
          <>
            <div className="approve-stat-card">
              <div>
                <div className="approve-stat-lbl">Admin Accounts</div>
                <div className="approve-stat-val">{collegeAdminCount}</div>
                <div className="approve-stat-sub">Campus administrative accounts</div>
              </div>
              <div className="approve-stat-icon-wrap icon-wrap--blue">
                <Building2 size={24} />
              </div>
            </div>

            <div className="approve-stat-card">
              <div>
                <div className="approve-stat-lbl">Students &amp; Faculty</div>
                <div className="approve-stat-val">{studentCount + mentorCount}</div>
                <div className="approve-stat-sub">Student &amp; Faculty applicants</div>
              </div>
              <div className="approve-stat-icon-wrap icon-wrap--purple">
                <GraduationCap size={24} />
              </div>
            </div>

            <div className="approve-stat-card">
              <div>
                <div className="approve-stat-lbl">Institutions</div>
                <div className="approve-stat-val">{collegesRepresentedCount}</div>
                <div className="approve-stat-sub">Colleges requesting access</div>
              </div>
              <div className="approve-stat-icon-wrap icon-wrap--emerald">
                <ShieldCheck size={24} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="approve-stat-card">
              <div>
                <div className="approve-stat-lbl">Students</div>
                <div className="approve-stat-val">{studentCount}</div>
                <div className="approve-stat-sub">Registered student accounts</div>
              </div>
              <div className="approve-stat-icon-wrap icon-wrap--blue">
                <GraduationCap size={24} />
              </div>
            </div>

            <div className="approve-stat-card">
              <div>
                <div className="approve-stat-lbl">Mentors</div>
                <div className="approve-stat-val">{mentorCount}</div>
                <div className="approve-stat-sub">Mentor requests</div>
              </div>
              <div className="approve-stat-icon-wrap icon-wrap--purple">
                <Briefcase size={24} />
              </div>
            </div>

            <div className="approve-stat-card">
              <div>
                <div className="approve-stat-lbl">Coordinators</div>
                <div className="approve-stat-val">{coordCount}</div>
                <div className="approve-stat-sub">Department coordinator requests</div>
              </div>
              <div className="approve-stat-icon-wrap icon-wrap--emerald">
                <ShieldCheck size={24} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toolbar & Filters Card */}
      <div className="approve-toolbar-card">
        <div className="approve-toolbar-top">
          {/* Left Group: Search Box + Role Filter Tabs */}
          <div className="approve-toolbar-left">
            {/* Search Box */}
            <div className="approve-search-box">
              <Search size={18} className="approve-search-icon" />
              <input
                type="text"
                placeholder="Search by name, email, department, roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="approve-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="approve-search-clear"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="approve-tabs-wrap">
              <button
                type="button"
                className={`approve-tab-btn ${selectedRole === "all" ? "active" : ""}`}
                onClick={() => setSelectedRole("all")}
              >
                All Requests ({pendingUsers.length})
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  className={`approve-tab-btn ${selectedRole === "admin" ? "active" : ""}`}
                  onClick={() => setSelectedRole("admin")}
                >
                  Admins ({collegeAdminCount})
                </button>
              )}
              <button
                type="button"
                className={`approve-tab-btn ${selectedRole === "student" ? "active" : ""}`}
                onClick={() => setSelectedRole("student")}
              >
                Students ({studentCount})
              </button>
              <button
                type="button"
                className={`approve-tab-btn ${selectedRole === "mentor" ? "active" : ""}`}
                onClick={() => setSelectedRole("mentor")}
              >
                Mentors ({mentorCount})
              </button>
              <button
                type="button"
                className={`approve-tab-btn ${selectedRole === "coordinator" ? "active" : ""}`}
                onClick={() => setSelectedRole("coordinator")}
              >
                Coordinators ({coordCount})
              </button>
            </div>
          </div>

          {/* View Switcher */}
          <div className="approve-view-switch">
            <button
              type="button"
              className={`approve-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              className={`approve-view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b" }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#4338ca" }} />
          <p style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>Loading pending approvals...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="approve-empty-state">
          <div className="approve-empty-icon">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="approve-empty-h3">All Caught Up!</h3>
          <p className="approve-empty-p">
            {searchTerm || selectedRole !== "all"
              ? "No pending registrations match your filter criteria. Try adjusting your search term."
              : "There are currently no new registration requests waiting for approval."}
          </p>
          {(searchTerm || selectedRole !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("all");
              }}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                background: "#f1f5f9",
                color: "#475569",
                fontWeight: "600",
                fontSize: "13.5px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW */
        <div className="approve-cards-grid">
          {filteredUsers.map((u) => {
            const isProcessing = actionLoadingId === u.id;
            const roleStr = String(u.role || "").toLowerCase();

            let avatarClass = "user-avatar--student";
            let roleBadgeBg = "#dbeafe";
            let roleBadgeColor = "#1d4ed8";

            if (roleStr.includes("admin")) {
              avatarClass = "user-avatar--admin";
              roleBadgeBg = "#ede9fe";
              roleBadgeColor = "#6d28d9";
            } else if (roleStr.includes("hod")) {
              avatarClass = "user-avatar--hod";
              roleBadgeBg = "#e0f2fe";
              roleBadgeColor = "#0369a1";
            } else if (roleStr.includes("mentor") || roleStr.includes("faculty")) {
              avatarClass = "user-avatar--mentor";
              roleBadgeBg = "#ede9fe";
              roleBadgeColor = "#6d28d9";
            } else if (roleStr.includes("coordinator")) {
              avatarClass = "user-avatar--coordinator";
              roleBadgeBg = "#fef3c7";
              roleBadgeColor = "#b45309";
            }

            return (
              <div key={u.id} className="user-approval-card">
                <div>
                  {/* Card Top Header */}
                  <div className="user-card-header">
                    <div className={`user-card-avatar ${avatarClass}`}>
                      {getInitials(u.name)}
                    </div>
                    <div className="user-card-main-info">
                      <h3 className="user-card-name" title={u.name}>
                        {u.name}
                      </h3>
                      <div className="user-card-badges">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            background: roleBadgeBg,
                            color: roleBadgeColor,
                            textTransform: "uppercase",
                          }}
                        >
                          {u.role}
                        </span>
                        {(() => {
                          const isDomainMismatch = u.email && u.email.includes("@") && !u.email.endsWith("pvppcoe.ac.in") && !u.email.includes("pvppcoe.ac.in");
                          if (u.domain_flagged || isDomainMismatch) {
                            return (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  textTransform: "uppercase",
                                }}
                                title="Email domain does not match official college domain"
                              >
                                ⚠️ Domain Flagged
                              </span>
                            );
                          }
                          return null;
                        })()}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            color: "#d97706",
                            background: "#fef3c7",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          <Clock size={12} /> Pending Approval
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: "650",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: u.is_verified || u.two_factor_enabled ? "#ecfdf5" : "#fffbeb",
                            color: u.is_verified || u.two_factor_enabled ? "#059669" : "#b45309",
                            border: `1px solid ${u.is_verified || u.two_factor_enabled ? "#a7f3d0" : "#fde68a"}`,
                          }}
                        >
                          {u.is_verified || u.two_factor_enabled ? (
                            <>
                              <ShieldCheck size={12} /> Verified (2FA)
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} /> Unverified
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Contact & Info Box */}
                  <div className="user-card-body">
                    <div className="user-info-item">
                      <Mail size={14} className="user-info-icon" />
                      <span className="user-info-val">{u.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(u.email, u.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: copiedId === u.id ? "#16a34a" : "#94a3b8",
                          padding: "2px",
                          marginLeft: "auto",
                        }}
                        title="Copy email"
                      >
                        {copiedId === u.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>

                    {(u.mobile_number || u.mobile || u.phone) && (
                      <div className="user-info-item">
                        <Phone size={14} className="user-info-icon" />
                        <span className="user-info-val">{u.mobile_number || u.mobile || u.phone}</span>
                      </div>
                    )}

                    {(u.college_name || u.college) && (
                      <div className="user-info-item">
                        <Building2 size={14} className="user-info-icon" />
                        <span className="user-info-val" style={{ fontWeight: 600 }}>{u.college_name || u.college}</span>
                      </div>
                    )}

                    {u.department && (
                      <div className="user-info-item">
                        <GraduationCap size={14} className="user-info-icon" />
                        <span className="user-info-val">{u.department}</span>
                      </div>
                    )}

                    {/* Academic Chips */}
                    {!isSuperAdmin && (u.year || u.division || u.semester || u.roll_number) && (
                      <div className="user-card-academics">
                        {u.year && <span className="academic-chip">Yr: {u.year}</span>}
                        {u.semester && <span className="academic-chip">Sem: {u.semester}</span>}
                        {u.division && <span className="academic-chip">Div: {u.division}</span>}
                        {u.roll_number && <span className="academic-chip">Roll: {u.roll_number}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="user-card-footer">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(u)}
                    className="btn-card-approve"
                  >
                    {isProcessing ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleReject(u)}
                    className="btn-card-reject"
                  >
                    <XCircle size={16} />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedUserModal(u)}
                    className="btn-card-details"
                    title="View Full Profile Details"
                  >
                    <Eye size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="approve-table-card">
          <div style={{ overflowX: "auto" }}>
            <table className="approve-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Contact Info</th>
                  <th>{isSuperAdmin ? "College & Department" : "Department & Academics"}</th>
                  <th>Registered On</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isProcessing = actionLoadingId === u.id;
                  const roleStr = String(u.role || "").toLowerCase();

                  let avatarClass = "user-avatar--student";
                  if (roleStr.includes("admin")) {
                    avatarClass = "user-avatar--admin";
                  } else if (roleStr.includes("hod")) {
                    avatarClass = "user-avatar--hod";
                  } else if (roleStr.includes("mentor") || roleStr.includes("faculty")) {
                    avatarClass = "user-avatar--mentor";
                  } else if (roleStr.includes("coordinator")) {
                    avatarClass = "user-avatar--coordinator";
                  }

                  return (
                    <tr key={u.id}>
                      {/* Name & Role */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div className={`user-card-avatar ${avatarClass}`} style={{ width: "40px", height: "40px", fontSize: "14px" }}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>{u.name}</div>
                            <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#4f46e5", textTransform: "uppercase" }}>
                              {u.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#334155" }}>
                          <Mail size={14} color="#64748b" /> <span>{u.email}</span>
                        </div>
                        {(u.mobile_number || u.mobile || u.phone) && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748b", marginTop: "3px" }}>
                            <Phone size={13} color="#94a3b8" /> <span>{u.mobile_number || u.mobile || u.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Academics or College */}
                      <td>
                        <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#1e293b" }}>
                          {isSuperAdmin
                            ? (u.college_name || u.college || "Campus Admin")
                            : (u.department || "N/A")}
                        </div>
                        {isSuperAdmin ? (
                          u.department && (
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              {u.department}
                            </div>
                          )
                        ) : (
                          (u.year || u.division || u.semester || u.roll_number) && (
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              {[
                                u.year ? `Yr ${u.year}` : null,
                                u.semester ? `Sem ${u.semester}` : null,
                                u.division ? `Div ${u.division}` : null,
                                u.roll_number ? `Roll ${u.roll_number}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )
                        )}
                      </td>

                      {/* Registered Date */}
                      <td style={{ fontSize: "13px", color: "#64748b" }}>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recently"}
                      </td>

                      {/* Status */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              background: "#fef3c7",
                              color: "#d97706",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            <Clock size={13} /> Pending Approval
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: "650",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: u.is_verified || u.two_factor_enabled ? "#ecfdf5" : "#fffbeb",
                              color: u.is_verified || u.two_factor_enabled ? "#059669" : "#b45309",
                              border: `1px solid ${u.is_verified || u.two_factor_enabled ? "#a7f3d0" : "#fde68a"}`,
                            }}
                          >
                            {u.is_verified || u.two_factor_enabled ? (
                              <>
                                <ShieldCheck size={12} /> Verified (2FA)
                              </>
                            ) : (
                              <>
                                <AlertCircle size={12} /> Unverified
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprove(u)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "8px",
                              background: "#16a34a",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "700",
                              border: "none",
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <CheckCircle2 size={15} /> Approve
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReject(u)}
                            style={{
                              padding: "7px 12px",
                              borderRadius: "8px",
                              background: "#fef2f2",
                              color: "#dc2626",
                              fontSize: "13px",
                              fontWeight: "600",
                              border: "1px solid #fecdd3",
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <XCircle size={15} /> Reject
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedUserModal(u)}
                            style={{
                              padding: "7px 10px",
                              borderRadius: "8px",
                              background: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                              cursor: "pointer",
                            }}
                            title="View Details"
                          >
                            <Eye size={15} />
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

      {/* USER DETAILS MODAL */}
      {selectedUserModal && createPortal(
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedUserModal(null);
          }}
        >
          <div className="modal-dialog approve-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Registration Details</h2>
                  <p className="modal-subtitle">Review applicant credentials before granting access</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedUserModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Applicant Profile Hero Card */}
              <div className="approve-modal-hero-card">
                <div
                  className={`user-card-avatar user-avatar--${(selectedUserModal.role || "student").toLowerCase()}`}
                  style={{ width: "52px", height: "52px", fontSize: "17px", flexShrink: 0 }}
                >
                  {getInitials(selectedUserModal.name)}
                </div>
                <div className="approve-modal-hero-info">
                  <div className="approve-modal-hero-name-row">
                    <h3 className="approve-modal-hero-name">{selectedUserModal.name}</h3>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        background: "#ede9fe",
                        color: "#6d28d9",
                        textTransform: "uppercase",
                      }}
                    >
                      {selectedUserModal.role}
                    </span>
                  </div>
                  <div className="approve-modal-hero-status-row">
                    <span className="approve-status-pill">
                      <Clock size={12} /> Pending Approval
                    </span>
                    {selectedUserModal.created_at && (
                      <span className="approve-registered-time">
                        Registered on {new Date(selectedUserModal.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="sa-modal-details-grid" style={{ marginTop: "16px" }}>
                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Mail size={13} className="sa-detail-label-icon" />
                    <span>Email Address</span>
                  </span>
                  <span className="sa-modal-detail-value dept-hod-email-value" style={{ fontSize: "13px" }}>
                    {selectedUserModal.email}
                  </span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Phone size={13} className="sa-detail-label-icon" />
                    <span>Mobile Number</span>
                  </span>
                  <span className="sa-modal-detail-value">
                    {(selectedUserModal.mobile_number || selectedUserModal.mobile || selectedUserModal.phone || selectedUserModal.contact_number) ? (
                      selectedUserModal.mobile_number || selectedUserModal.mobile || selectedUserModal.phone || selectedUserModal.contact_number
                    ) : (
                      <span style={{ color: "#94a3b8", fontStyle: "italic", fontWeight: 500 }}>Not provided</span>
                    )}
                  </span>
                </div>

                {(selectedUserModal.college_name || selectedUserModal.college) && (
                  <div className="sa-modal-detail-item">
                    <span className="sa-modal-detail-label">
                      <Building2 size={13} className="sa-detail-label-icon" />
                      <span>College / Institution</span>
                    </span>
                    <span className="sa-modal-detail-value">{selectedUserModal.college_name || selectedUserModal.college}</span>
                  </div>
                )}

                {selectedUserModal.department && (
                  <div className="sa-modal-detail-item">
                    <span className="sa-modal-detail-label">
                      <GraduationCap size={13} className="sa-detail-label-icon" />
                      <span>Department</span>
                    </span>
                    <span className="sa-modal-detail-value">{selectedUserModal.department}</span>
                  </div>
                )}

                {selectedUserModal.year && (
                  <div className="sa-modal-detail-item">
                    <span className="sa-modal-detail-label">
                      <Calendar size={13} className="sa-detail-label-icon" />
                      <span>Academic Year</span>
                    </span>
                    <span className="sa-modal-detail-value">{selectedUserModal.year}</span>
                  </div>
                )}

                {selectedUserModal.semester && (
                  <div className="sa-modal-detail-item">
                    <span className="sa-modal-detail-label">
                      <BookOpen size={13} className="sa-detail-label-icon" />
                      <span>Current Semester</span>
                    </span>
                    <span className="sa-modal-detail-value">{selectedUserModal.semester}</span>
                  </div>
                )}

                {selectedUserModal.division && (
                  <div className="sa-modal-detail-item">
                    <span className="sa-modal-detail-label">
                      <Layers size={13} className="sa-detail-label-icon" />
                      <span>Division</span>
                    </span>
                    <span className="sa-modal-detail-value">{selectedUserModal.division}</span>
                  </div>
                )}

                {selectedUserModal.roll_number && (
                  <div className="sa-modal-detail-item">
                    <span className="sa-modal-detail-label">
                      <Hash size={13} className="sa-detail-label-icon" />
                      <span>Roll Number</span>
                    </span>
                    <span className="sa-modal-detail-value">{selectedUserModal.roll_number}</span>
                  </div>
                )}

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Clock size={13} className="sa-detail-label-icon" />
                    <span>Registered On</span>
                  </span>
                  <span className="sa-modal-detail-value">
                    {selectedUserModal.created_at
                      ? new Date(selectedUserModal.created_at).toLocaleString("en-IN")
                      : "Recently"}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedUserModal(null)}
              >
                Close
              </button>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  disabled={actionLoadingId === selectedUserModal.id}
                  onClick={() => handleReject(selectedUserModal)}
                  className="btn-card-reject"
                  style={{ height: "38px", padding: "0 16px" }}
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === selectedUserModal.id}
                  onClick={() => handleApprove(selectedUserModal)}
                  className="btn-card-approve"
                  style={{ height: "38px", padding: "0 18px" }}
                >
                  {actionLoadingId === selectedUserModal.id ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  <span>Approve Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
