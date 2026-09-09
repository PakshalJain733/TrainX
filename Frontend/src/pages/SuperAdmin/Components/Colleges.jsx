import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { initialColleges, initialDepartments } from '../../../data/superAdminMockData';
import StatusBadge from '../../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../../components/SuperAdmin/ActionDropdown';
import EmptyState from '../../../components/ui/EmptyState';
import {
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Mail,
  Users,
  X,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import '../Styles/SuperAdmin.css';
import '../../Admin/Styles/AdminUsers.css';
import '../Styles/Colleges.css';

export default function Colleges() {
  const { collegeId } = useParams();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState(initialColleges);
  const [departments, setDepartments] = useState(initialDepartments);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCollegeModalOpen, setIsAddCollegeModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);

  // Form states
  const [collegeForm, setCollegeForm] = useState({
    name: '', code: '', location: '', adminName: '', adminEmail: '', departmentsCount: 5, studentsCount: 150,
  });
  const [deptForm, setDeptForm] = useState({
    name: '', code: '', hodName: '', hodEmail: '',
  });

  const selectedCollege = colleges.find(c => String(c.id) === String(collegeId));

  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDepts = departments.filter((d) =>
    (!collegeId || String(d.collegeId) === String(collegeId)) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     d.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddCollege = (e) => {
    e.preventDefault();
    if (!collegeForm.name || !collegeForm.code || !collegeForm.location) return;
    setColleges([{ ...collegeForm, id: Date.now(), status: 'Active' }, ...colleges]);
    setIsAddCollegeModalOpen(false);
    setCollegeForm({ name: '', code: '', location: '', adminName: '', adminEmail: '', departmentsCount: 5, studentsCount: 150 });
  };

  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;

    const newDept = {
      id: Date.now(),
      name: deptForm.name,
      code: deptForm.code,
      collegeId: collegeId || 1,
      collegeName: selectedCollege ? selectedCollege.name : "College Campus",
      hodName: deptForm.hodName || "Dr. Department HOD",
      hodEmail: deptForm.hodEmail || `hod.${deptForm.code.toLowerCase()}@college.edu.in`,
      activeStudents: 0,
      batchesCount: 0,
      status: "Active",
    };

    setDepartments([newDept, ...departments]);
    setIsAddDeptModalOpen(false);
    setDeptForm({ name: '', code: '', hodName: '', hodEmail: '' });
  };

  const handleDeleteCollege = (id) => {
    setColleges(colleges.filter((c) => c.id !== id));
  };

  // If collegeId URL param is present, render College Departments view
  if (collegeId) {
    return (
      <div className="space-y-6 text-slate-800">
        <div className="sa-page-header">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button 
                onClick={() => navigate('/super-admin/colleges')} 
                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition cursor-pointer"
                title="Back to Colleges Directory"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>{selectedCollege ? selectedCollege.name : "College Departments"}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 ml-9">
              Managing departments inside {selectedCollege ? selectedCollege.name : "selected college"}
            </p>
          </div>

          <button className="sa-btn-primary ml-auto" onClick={() => setIsAddDeptModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        <div className="sa-search-card">
          <div className="sa-search-wrap" style={{ maxWidth: "100%" }}>
            <Search className="sa-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search department stream or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sa-search-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDepts.map((dept) => (
            <div key={dept.id} className="sa-widget-card hover:border-indigo-300 transition" style={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600 mb-1 border border-indigo-100">
                    {dept.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                </div>
                <ActionDropdown
                  onView={() => alert(`View ${dept.name}`)}
                  onEdit={() => alert(`Edit ${dept.name}`)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Active Students</p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">{dept.activeStudents || 120}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Batches</p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">{dept.batchesCount || 4}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Department Modal */}
        {isAddDeptModalOpen && createPortal(
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddDeptModalOpen(false); }}>
            <div className="modal-dialog" style={{ maxWidth: "540px" }}>
              <div className="modal-header">
                <div className="modal-header-left">
                  <div className="modal-header-icon-wrap modal-header-icon--indigo">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h2 className="modal-title">Add New Department</h2>
                    <p className="modal-subtitle">Create an academic department for this college.</p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setIsAddDeptModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddDepartment}>
                <div className="modal-body">
                  <div className="form-row-2">
                    <div className="form-group-admin">
                      <label>Department Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input-admin"
                        placeholder="e.g. Computer Science & Engineering"
                        value={deptForm.name}
                        onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Department Code *</label>
                      <input
                        type="text"
                        required
                        className="form-input-admin"
                        placeholder="e.g. CSE"
                        value={deptForm.code}
                        onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group-admin">
                      <label>HOD Name</label>
                      <input
                        type="text"
                        className="form-input-admin"
                        placeholder="Dr. Arvind Kulkarni"
                        value={deptForm.hodName}
                        onChange={(e) => setDeptForm({ ...deptForm, hodName: e.target.value })}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>HOD Email</label>
                      <input
                        type="email"
                        className="form-input-admin"
                        placeholder="hod.cse@college.edu.in"
                        value={deptForm.hodEmail}
                        onChange={(e) => setDeptForm({ ...deptForm, hodEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsAddDeptModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-submit">
                    Save Department
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

  // Primary View: Colleges Directory
  return (
    <div className="colleges-page-wrap">
      {/* Header & Main Action */}
      <div className="sa-page-header">
        <div>
          <div className="colleges-header-title-wrap">
            <Building2 className="colleges-header-icon" />
            <span className="colleges-header-title">Colleges Directory</span>
          </div>
          <p className="colleges-header-subtitle">Manage all registered institutions and partner universities</p>
        </div>
        <button onClick={() => setIsAddCollegeModalOpen(true)} className="sa-btn-primary">
          <Plus size={16} />
          <span>Add New College</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="colleges-search-card">
        <div className="sa-search-wrap colleges-search-wrap">
          <Search className="sa-search-icon" />
          <input
            type="text"
            placeholder="Search college name, city, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>

        <div>
          <button type="button" className="colleges-filter-btn">
            <Filter className="colleges-filter-icon" />
            <span>Filter Status</span>
          </button>
        </div>
      </div>

      {/* Colleges Table */}
      <div className="colleges-table-card">
        {filteredColleges.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Colleges Found"
            description={searchQuery ? `No colleges matching "${searchQuery}"` : "Get started by registering the first partner college."}
            actionText="Add New College"
            onAction={() => setIsAddCollegeModalOpen(true)}
          />
        ) : (
          <div className="colleges-table-wrap">
            <table className="colleges-table">
              <thead>
                <tr className="colleges-table-thead">
                  <th className="colleges-th">College Name</th>
                  <th className="colleges-th">Location</th>
                  <th className="colleges-th">College Admin</th>
                  <th className="colleges-th">Departments</th>
                  <th className="colleges-th">Active Students</th>
                  <th className="colleges-th">Status</th>
                  <th className="colleges-th-right">Actions</th>
                </tr>
              </thead>
              <tbody className="colleges-tbody">
                {filteredColleges.map((college) => (
                  <tr key={college.id} className="colleges-tr">
                    <td className="colleges-td">
                      <div className="colleges-name">{college.name}</div>
                      <div className="colleges-code">{college.code}</div>
                    </td>
                    <td className="colleges-td">
                      <div className="colleges-location-wrap">
                        <MapPin className="colleges-location-icon" />
                        <span>{college.location}</span>
                      </div>
                    </td>
                    <td className="colleges-td">
                      <div className="colleges-admin-name">{college.adminName || 'Dr. Verma'}</div>
                      <div className="colleges-admin-email-wrap">
                        <Mail size={12} />
                        <span>{college.adminEmail || 'admin@college.edu.in'}</span>
                      </div>
                    </td>
                    <td className="colleges-td colleges-admin-name">{college.departmentsCount}</td>
                    <td className="colleges-td">
                      <div className="colleges-students-count">
                        <Users className="colleges-students-icon" />
                        <span>{college.studentsCount}</span>
                      </div>
                    </td>
                    <td className="colleges-td">
                      <StatusBadge status={college.status} />
                    </td>
                    <td className="colleges-td-right">
                      <ActionDropdown
                        onView={() => navigate(`/super-admin/colleges/${college.id}`)}
                        onEdit={() => alert(`Editing ${college.name}`)}
                        onDelete={() => handleDeleteCollege(college.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add College Modal */}
      {isAddCollegeModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddCollegeModalOpen(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Register Institution</h2>
                  <p className="modal-subtitle">Onboard a new college to the training portal network.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddCollegeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCollege}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>College Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    placeholder="e.g. Padmabhushan Vasantdada Patil Pratishthan's College of Engineering"
                    value={collegeForm.name}
                    onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Code / Abbreviation *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. PVPPCOE"
                      value={collegeForm.code}
                      onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>City / Location *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. Sion, Mumbai"
                      value={collegeForm.location}
                      onChange={(e) => setCollegeForm({ ...collegeForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Assigned Admin Name</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      placeholder="Dr. K. S. Patil"
                      value={collegeForm.adminName}
                      onChange={(e) => setCollegeForm({ ...collegeForm, adminName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Admin Email</label>
                    <input
                      type="email"
                      className="form-input-admin"
                      placeholder="admin@pvppcoe.ac.in"
                      value={collegeForm.adminEmail}
                      onChange={(e) => setCollegeForm({ ...collegeForm, adminEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsAddCollegeModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Register Institution
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
