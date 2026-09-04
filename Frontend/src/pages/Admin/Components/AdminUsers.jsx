import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  GraduationCap,
  Briefcase,
  UserCheck,
  RefreshCw,
  X,
  AlertCircle
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stats, setStats] = useState({ totalUsers: 0, students: 0, mentors: 0, coordinators: 0 });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    role: "student",
    roll_number: "",
    department: "",
    year: "",
    division: "",
    semester: "",
    is_active: 1,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (roleFilter !== "all") queryParams.append("role", roleFilter);
      if (search.trim()) queryParams.append("search", search.trim());

      const res = await apiFetch(`/admin/users?${queryParams.toString()}`);
      if (res && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch("/admin/stats");
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      email: "",
      mobile_number: "",
      role: "student",
      roll_number: "",
      department: "COMPS",
      year: "FE",
      division: "A",
      semester: "1",
      is_active: 1,
    });
    setFeedback({ type: "", message: "" });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      mobile_number: user.mobile_number || "",
      role: user.role || "student",
      roll_number: user.roll_number || "",
      department: user.department || "",
      year: user.year || "",
      division: user.division || "",
      semester: user.semester || "",
      is_active: user.is_active !== undefined ? user.is_active : 1,
    });
    setFeedback({ type: "", message: "" });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res && res.data) {
        setIsAddModalOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create user" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "An error occurred" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (res && res.data) {
        setIsEditModalOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update user" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "An error occurred" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      setIsDeleteModalOpen(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    const r = (role || "").toLowerCase();
    if (r.includes("student")) return "role-badge--student";
    if (r.includes("mentor") || r.includes("faculty")) return "role-badge--mentor";
    if (r.includes("coordinator")) return "role-badge--coordinator";
    return "role-badge--admin";
  };

  return (
    <div className="admin-page-inner admin-users-container">
      {/* Header Banner */}
      <div className="admin-users-hero">
        <div className="admin-users-hero-left">
          <div className="admin-users-hero-icon">
            <Users size={28} />
          </div>
          <div>
            <div className="admin-users-eyebrow">
              <Sparkles size={12} /> USER DIRECTORY & ACCESS CONTROL
            </div>
            <h1 className="admin-users-title">User Management</h1>
            <p className="admin-users-desc">
              Manage registered student profiles, mentors, coordinators, and assign system access roles.
            </p>
          </div>
        </div>

        <button className="admin-btn-add" onClick={handleOpenAdd}>
          <UserPlus size={16} /> Add New User
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="admin-users-stats-grid">
        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--indigo">
            <Users size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.totalUsers}</span>
            <span className="admin-user-stat-lbl">Total Registered Users</span>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--blue">
            <GraduationCap size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.students}</span>
            <span className="admin-user-stat-lbl">Enrolled Students</span>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--purple">
            <Briefcase size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.mentors}</span>
            <span className="admin-user-stat-lbl">Faculty & Mentors</span>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--emerald">
            <Shield size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.coordinators}</span>
            <span className="admin-user-stat-lbl">Program Coordinators</span>
          </div>
        </div>
      </div>

      {/* Toolbar with Search and Filters */}
      <div className="admin-users-toolbar">
        <div className="admin-users-search-wrap">
          <Search size={16} className="admin-users-search-icon" />
          <input
            type="text"
            className="admin-users-search-input"
            placeholder="Search by name, email, roll no, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-users-filters">
          <button
            className={`admin-filter-pill ${roleFilter === "all" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("all")}
          >
            All Roles ({stats.totalUsers})
          </button>
          <button
            className={`admin-filter-pill ${roleFilter === "student" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("student")}
          >
            Students ({stats.students})
          </button>
          <button
            className={`admin-filter-pill ${roleFilter === "mentor" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("mentor")}
          >
            Mentors ({stats.mentors})
          </button>
          <button
            className={`admin-filter-pill ${roleFilter === "coordinator" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("coordinator")}
          >
            Coordinators ({stats.coordinators})
          </button>
          <button
            className={`admin-filter-pill ${roleFilter === "college_admin" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("college_admin")}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-users-table-card">
        <div className="admin-users-table-responsive">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Assigned Role</th>
                <th>Academic / Dept</th>
                <th>Mobile Number</th>
                <th>Status</th>
                <th className="th-actions-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{getInitials(u.name)}</div>
                        <div>
                          <div className="user-name-title">{u.name || "Unnamed User"}</div>
                          <div className="user-email-sub">{u.email || "No email"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                        {u.role ? u.role.replace("_", " ") : "student"}
                      </span>
                    </td>
                    <td>
                      {u.role === "student" ? (
                        <div>
                          <div className="user-dept-student">
                            {u.department || "No Dept"} {u.year ? `· ${u.year}` : ""} {u.division ? `(Div ${u.division})` : ""}
                          </div>
                          <div className="user-dept-roll">
                            ID: {u.roll_number || "N/A"} · Sem {u.semester || "N/A"}
                          </div>
                        </div>
                      ) : (
                        <span className="user-dept-staff">{u.department || "Institutional Staff"}</span>
                      )}
                    </td>
                    <td>
                      <span className="user-mobile-text">
                        {u.mobile_number || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${u.is_active ? "status-badge--active" : "status-badge--inactive"}`}>
                        <span className="status-dot"></span>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns-row action-btns-right">
                        <button
                          className="btn-table-action"
                          title="Edit User"
                          onClick={() => handleOpenEdit(u)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-table-action btn-table-action--delete"
                          title="Delete User"
                          onClick={() => handleOpenDelete(u)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-users-empty">
                      <div className="admin-users-empty-icon">
                        <Users size={28} />
                      </div>
                      <h3>No Users Found</h3>
                      <p>No registered accounts match your current filter or search criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="modal-title">Create New User</h2>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                {feedback.message && (
                  <div className={`modal-feedback-alert ${feedback.type === "error" ? "modal-feedback--error" : "modal-feedback--success"}`}>
                    {feedback.message}
                  </div>
                )}
                <div className="form-group-admin">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    placeholder="Enter user's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input-admin"
                      placeholder="user@pvppcoe.ac.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input-admin"
                      placeholder="9876543210"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Assign Role *</label>
                  <select
                    className="form-select-admin"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor / Faculty</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="college_admin">College Admin</option>
                  </select>
                </div>

                {formData.role === "student" && (
                  <>
                    <div className="form-row-2">
                      <div className="form-group-admin">
                        <label>College / Roll ID</label>
                        <input
                          type="text"
                          className="form-input-admin"
                          placeholder="e.g. VU21CS042"
                          value={formData.roll_number}
                          onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Department</label>
                        <select
                          className="form-select-admin"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        >
                          <option value="COMPS">COMPS</option>
                          <option value="IT">IT</option>
                          <option value="AIML">AIML</option>
                          <option value="ECS">ECS</option>
                          <option value="MTRX">MTRX</option>
                          <option value="EXTC">EXTC</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group-admin">
                        <label>Academic Year</label>
                        <select
                          className="form-select-admin"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        >
                          <option value="FE">FE</option>
                          <option value="SE">SE</option>
                          <option value="TE">TE</option>
                          <option value="BE">BE</option>
                        </select>
                      </div>
                      <div className="form-group-admin">
                        <label>Division</label>
                        <select
                          className="form-select-admin"
                          value={formData.division}
                          onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                        >
                          <option value="A">Division A</option>
                          <option value="B">Division B</option>
                          <option value="C">Division C</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={actionLoading}>
                  {actionLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="modal-title">Edit User Profile</h2>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                {feedback.message && (
                  <div className={`modal-feedback-alert ${feedback.type === "error" ? "modal-feedback--error" : "modal-feedback--success"}`}>
                    {feedback.message}
                  </div>
                )}
                <div className="form-group-admin">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-input-admin"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input-admin"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Role</label>
                    <select
                      className="form-select-admin"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="mentor">Mentor / Faculty</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="college_admin">College Admin</option>
                    </select>
                  </div>
                  <div className="form-group-admin">
                    <label>Account Status</label>
                    <select
                      className="form-select-admin"
                      value={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>

                {formData.role === "student" && (
                  <div className="form-row-2">
                    <div className="form-group-admin">
                      <label>Roll Number / ID</label>
                      <input
                        type="text"
                        className="form-input-admin"
                        value={formData.roll_number}
                        onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Department</label>
                      <input
                        type="text"
                        className="form-input-admin"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {isDeleteModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="modal-title">Delete User</h2>
              <button className="modal-close-btn" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-user-row">
                <div className="delete-user-icon-wrap">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="delete-user-title">
                    Are you sure you want to delete user "{selectedUser.name}"?
                  </p>
                  <p className="delete-user-sub">
                    This action will permanently remove the user and any associated student profile records.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit btn-modal-danger"
                onClick={handleDeleteUser}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
