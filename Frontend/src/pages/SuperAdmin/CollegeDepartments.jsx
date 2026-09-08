import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initialDepartments } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { GraduationCap, Search, Plus, ArrowLeft } from 'lucide-react';
import './SuperAdmin.css';

export default function CollegeDepartments() {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  // Filter or fetch based on collegeId in a real app
  const [departments] = useState(initialDepartments);
  const [search, setSearch] = useState('');

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sa-page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => navigate('/super-admin/colleges')} 
              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>College Departments</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 ml-9">Manage departments inside this specific college</p>
        </div>

        <button className="sa-btn-primary">
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="sa-search-card">
        <div className="sa-search-wrap">
          <Search className="sa-search-icon" />
          <input
            type="text"
            placeholder="Search department stream or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((dept) => (
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
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.activeStudents}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Batches</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.batchesCount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
