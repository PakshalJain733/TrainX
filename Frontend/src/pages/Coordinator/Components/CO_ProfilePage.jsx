import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, User, Camera, GraduationCap, Building, Users, ShieldCheck, CheckCircle2, Save, Sparkles, MapPin, Clock, KeyRound, QrCode, Copy, Loader2, X, Edit2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { coordinatorProfile } from "../../../data/coordinatorMockData";
import CustomSelect from "../../../components/ui/CustomSelect";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import { apiFetch } from "../../../utils/api";
import "../Styles/CO_ProfilePage.css";

export default function CoordinatorProfilePage() {
  const fileInputRef = useRef(null);
  const [deptOptions, setDeptOptions] = useState([]);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  const resolveUser = () => {
    let localUser = {};
    try { localUser = JSON.parse(sessionStorage.getItem("user")) || {}; } catch { }
    let name = localUser.name || localUser.fullName || localUser.full_name || coordinatorProfile?.name || "Department Coordinator";
    let email = localUser.email || coordinatorProfile?.email || "coordinator@pvppcoe.ac.in";
    return { name, email, ...localUser };
  };

  const initialUser = resolveUser();

  const [form, setForm] = useState({
    name: initialUser.name,
    email: initialUser.email,
    phone: initialUser.mobile_number || coordinatorProfile?.phone || "",
    department: initialUser.department || coordinatorProfile?.department || "",
    role: "Department Coordinator",
    college: coordinatorProfile?.college || "P.V.P.P. College of Engineering",
    officeLocation: coordinatorProfile?.officeLocation || "Room 402, Block B",
    officeHours: coordinatorProfile?.officeHours || "Mon-Fri 10:00 AM - 5:00 PM",
    managedBatches: coordinatorProfile?.managedBatches || 0,
    totalStudents: coordinatorProfile?.totalStudents || 0,
    skills: Array.isArray(coordinatorProfile?.skills) ? coordinatorProfile.skills.join(", ") : (coordinatorProfile?.skills || ""),
    bio: coordinatorProfile?.bio || "",
    empId: initialUser.empId || initialUser.emp_id || initialUser.employee_id || "EMP-CO-101",
    notifBatchAlerts: coordinatorProfile?.notifications?.notifBatchAlerts ?? true,
    notifWeeklyReport: coordinatorProfile?.notifications?.notifWeeklyReport ?? true,
    notifNewStudents: coordinatorProfile?.notifications?.notifNewStudents ?? true,
  });

  useEffect(() => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && (res.user || res.data)) {
          const u = res.user || res.data;
          setForm((prev) => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            phone: u.mobile_number || u.phone || prev.phone,
            department: u.department || prev.department,
          }));
        }
      })
      .catch(() => { });

    apiFetch("/departments")
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          const opts = list.map((d) => {
            const code = (d.code && d.code.trim()) || d.name;
            const name = (d.name && d.name.trim()) || code;
            return {
              id: d.id,
              value: code,
              label: code,
              code: code,
              name: name,
            };
          });
          setDeptOptions(opts);
        }
      })
      .catch(() => {});
  }, []);


  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const matchedDept = deptOptions.find(d => d.value === form.department || d.code === form.department || d.name === form.department);
    try {
      await apiFetch("/admin/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          department_id: matchedDept?.id || form.department_id || null,
        }),
      });

      let localUser = {};
      try { localUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"); } catch {}
      const updatedUser = {
        ...localUser,
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        department_id: matchedDept?.id || form.department_id || localUser.department_id,
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.setItem("coordinatorProfile", JSON.stringify(updatedUser));
      localStorage.setItem("coordinatorProfile", JSON.stringify(updatedUser));

      window.dispatchEvent(new Event("userProfileUpdated"));

      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save coordinator profile:", err);
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return "CO";
    const parts = nameStr.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className="student-page-inner profile-container">
      <div className="ui-section-header-CO">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <User size={22} className="ui-section-title-icon" />
              <span>Coordinator Profile & Settings</span>
            </h2>
            <p className="ui-section-desc">
              Manage your coordinator dossier, assigned department scope, and notification preferences.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile updated and saved successfully!</span>
        </div>
      )}

      <div className="profile-main-grid">
        {/* LEFT COLUMN: Dossier Card */}
        <div className="profile-dossier-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt={form.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials">{getInitials(form.name)}</div>
              )}
              {isEditing && (
                <button
                  type="button"
                  className="profile-camera-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Avatar Image"
                >
                  <Camera size={14} />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="profile-file-input"
                disabled={!isEditing}
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="profile-name">{form.name}</h2>

            <div className="profile-badges-wrap" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant="success">Active Coordinator</Badge>
              <Badge variant="default">{form.department || "Engineering"}</Badge>
            </div>
          </div>

          <div className="profile-academic-divider" />

          <div className="profile-academic-details">
            <h4 className="profile-section-subtitle">Scope Overview</h4>

            <div className="profile-detail-row">
              <Building size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Institution</span>
                <p className="profile-detail-value">{form.college}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <GraduationCap size={16} className="profile-detail-icon" />
              <div>
                <span className="profile-detail-label">Department</span>
                <p className="profile-detail-value">{form.department}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <ShieldCheck size={16} className="profile-detail-icon profile-icon-indigo" />
              <div>
                <span className="profile-detail-label">Designation & Role</span>
                <p className="profile-detail-value profile-role-value">{form.role}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Users size={16} className="profile-detail-icon profile-icon-emerald" />
              <div>
                <span className="profile-detail-label">Managed Scope</span>
                <p className="profile-detail-value">{form.managedBatches} · {form.totalStudents}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <MapPin size={16} className="profile-detail-icon profile-icon-amber" />
              <div>
                <span className="profile-detail-label">Office Location</span>
                <p className="profile-detail-value">{form.officeLocation}</p>
              </div>
            </div>

            <div className="profile-detail-row">
              <Clock size={16} className="profile-detail-icon profile-icon-purple" />
              <div>
                <span className="profile-detail-label">Office Hours</span>
                <p className="profile-detail-value">{form.officeHours}</p>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="profile-actions-wrapper">
              <button
                type="button"
                onClick={() => setShowChangePassModal(true)}
                className="profile-change-pass-btn"
              >
                <span>Change Password</span>
              </button>


            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Profile Form */}
        <div className="profile-form-card">
          <form onSubmit={handleSave}>
            <div className="profile-form-section">
              <div className="profile-section-heading profile-section-heading-flex">
                <div className="profile-heading-group">
                  <User size={18} className="profile-heading-icon profile-icon-indigo" />
                  <div>
                    <h3 className="profile-heading-title">{isEditing ? "Edit Personal & Contact Details" : "Personal & Contact Details"}</h3>
                    <p className="profile-heading-desc">Saved directly to your coordinator profile in MySQL database.</p>
                  </div>
                </div>

                <div className="profile-heading-actions">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="profile-edit-trigger-btn"
                    >
                      <Edit2 size={15} /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="profile-cancel-btn"
                      >
                        <X size={15} /> Cancel
                      </button>
                      <button
                        type="submit"
                        className="profile-save-btn"
                      >
                        <Save size={15} /> Save Profile
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-field">
                  <label className="profile-label">Full Name *</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Email Address *</label>
                  <input
                    type="email"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Phone Number *</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Office Hours</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.officeHours}
                    onChange={(e) => setForm((p) => ({ ...p, officeHours: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    placeholder="e.g. Mon-Fri 10:00 AM - 5:00 PM"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Departmental & Role Governance (SHIFTED DOWN) */}
            <div className="profile-form-section">
              <div className="profile-section-heading">
                <Sparkles size={18} className="profile-heading-icon profile-icon-indigo" />
                <div>
                  <h3 className="profile-heading-title">Departmental & Role Governance</h3>
                  <p className="profile-heading-desc">Enter your designation, department, employee ID, and office cabin location.</p>
                </div>
              </div>

              <div className="profile-form-grid mobile-pair-2">
                <div className="profile-field mobile-field-full">
                  <label className="profile-label">Official Designation / Title *</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profile-field mobile-field-full">
                  <label className="profile-label">Department *</label>
                  <CustomSelect
                    value={form.department}
                    options={deptOptions}
                    disabled={!isEditing}
                    onChange={(val) => setForm((p) => ({ ...p, department: val }))}
                    placeholder="Select Department"
                    icon={Building}
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Employee / Staff ID *</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.empId}
                    onChange={(e) => setForm((p) => ({ ...p, empId: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Office Location / Cabin</label>
                  <input
                    type="text"
                    className={`profile-input ${!isEditing ? 'profile-input-readonly' : ''}`}
                    value={form.officeLocation}
                    onChange={(e) => setForm((p) => ({ ...p, officeLocation: e.target.value }))}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    placeholder="e.g. Room 402, Block B"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
      />
      
    </div>
  );
}
