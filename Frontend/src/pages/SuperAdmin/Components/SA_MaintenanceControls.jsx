import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
  SlidersHorizontal,
  Power,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
  RefreshCw,
  Search,
  Edit3,
  Code,
  Users,
  CalendarCheck,
  Eye,
  Shield,
  X,
  MessageSquare,
  Lock,
  ArrowRight,
  Info
} from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import "../Styles/SA_MaintenanceControls.css";

/* ── Interactive Modal Component for Editing Notice ─────────────────── */
function EditNoticeModal({ moduleData, onClose, onSave }) {
  const [message, setMessage] = useState(moduleData.message || "");

  const quickTemplates = [
    "Scheduled Database Maintenance in progress until 04:00 AM UTC.",
    "System API & Security Upgrades undergoing routine maintenance.",
    "AI Evaluation Model recalibration in progress. Returning shortly.",
    "Platform performance optimization & server updates active."
  ];

  if (!moduleData) return null;

  return ReactDOM.createPortal(
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="mc-modal-header">
          <div className="mc-modal-title">
            <Edit3 size={18} className="mc-modal-title-icon" />
            <span>Customize Maintenance Message</span>
          </div>
          <button
            onClick={onClose}
            className="mc-modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mc-modal-body">
          <div className="mc-modal-module-card">
            <div className="mc-modal-module-icon">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <div className="mc-modal-module-title">{moduleData.name}</div>
              <div className="mc-modal-module-sub">{moduleData.category} • Target Role: {moduleData.role}</div>
            </div>
          </div>

          <div>
            <label className="mc-modal-label">
              Notice Message Shown To Users:
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter custom notice message..."
              className="mc-modal-textarea"
            />
          </div>

          <div>
            <label className="mc-modal-sublabel">Quick Notice Templates:</label>
            <div className="mc-template-chips">
              {quickTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(tmpl)}
                  className="mc-template-chip"
                >
                  + {tmpl.split(' ')[0]} {tmpl.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mc-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="mc-modal-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(moduleData.key, message)}
            className="sa-btn-primary"
          >
            <span>Save Notice Message</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Interactive Modal Component for Live Screen Preview ─────────── */
function LivePreviewModal({ moduleData, onClose }) {
  if (!moduleData) return null;

  return ReactDOM.createPortal(
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="mc-modal-header">
          <div className="mc-modal-title">
            <Eye size={18} className="text-indigo-600" />
            <span>Simulated User Maintenance Screen</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mc-modal-body">
          <div className="mc-preview-screen-card">
            <div className="mc-preview-lock-icon">
              <Lock size={24} />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider mb-2">
                Under Scheduled Maintenance
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">{moduleData.name}</h3>
              <p className="text-xs text-amber-900 font-semibold mt-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
                "{moduleData.message}"
              </p>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
              <Info size={13} className="text-slate-400" />
              <span>Target Role Restricted: <strong>{moduleData.role}</strong></span>
            </div>
          </div>
        </div>

        <div className="mc-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="sa-btn-primary"
          >
            <span>Close Preview</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MaintenanceControls() {
  const {
    config,
    toggleModule,
    updateModuleMessage,
    toggleGlobalEmergencyMode,
    turnAllModulesOn,
  } = useSystemMaintenance();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingModule, setEditingModule] = useState(null);
  const [previewModule, setPreviewModule] = useState(null);

  const modulesList = Object.values(config.modules);

  const filteredModules = modulesList.filter((mod) => {
    const matchesSearch =
      mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || mod.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalModules = modulesList.length;
  const activeCount = modulesList.filter((m) => m.active && !config.globalEmergencyMode).length;
  const maintenanceCount = totalModules - activeCount;
  const uspCount = modulesList.filter((m) => m.isUSP).length;

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Auth & Gateways":
        return Shield;
      case "Dashboards":
        return Users;
      case "AI Engine":
        return Sparkles;
      case "Learning & Practice":
        return Code;
      case "Operations & Monitoring":
        return CalendarCheck;
      default:
        return SlidersHorizontal;
    }
  };

  const handleSaveMessage = (key, msg) => {
    updateModuleMessage(key, msg);
    setEditingModule(null);
  };

  const categories = [
    { id: "all", label: "All Modules", count: totalModules },
    { id: "Auth & Gateways", label: "Auth & Login", count: modulesList.filter(m => m.category === "Auth & Gateways").length },
    { id: "Dashboards", label: "Role Dashboards", count: modulesList.filter(m => m.category === "Dashboards").length },
    { id: "AI Engine", label: "AI Systems (USPs)", count: modulesList.filter(m => m.category === "AI Engine").length },
    { id: "Learning & Practice", label: "Learning & Coding", count: modulesList.filter(m => m.category === "Learning & Practice").length },
    { id: "Operations & Monitoring", label: "Operations & Reports", count: modulesList.filter(m => m.category === "Operations & Monitoring").length },
  ];

  return (
    <div className="maintenancecontrols-page-wrap">
      {/* Page Header */}
      <div className="maintenancecontrols-header-wrap">
        <div>
          <h2 className="maintenancecontrols-header-title">
            <SlidersHorizontal className="maintenancecontrols-header-icon" />
            <span>Feature Switches &amp; Module Controls</span>
          </h2>
          <p className="maintenancecontrols-header-subtitle">
            Manage live accessibility for all 18 platform modules across Student, Coordinator, Mentor, and Admin roles
          </p>
        </div>
        <div className="maintenancecontrols-header-actions">
          <button
            type="button"
            onClick={toggleGlobalEmergencyMode}
            className={`maintenancecontrols-btn-emergency ${config.globalEmergencyMode ? 'maintenancecontrols-btn-emergency--on' : ''}`}
          >
            <Power size={15} />
            <span>{config.globalEmergencyMode ? "Emergency Mode ON" : "Emergency Maintenance"}</span>
          </button>
          <button type="button" onClick={turnAllModulesOn} className="sa-btn-primary">
            <RefreshCw size={15} />
            <span>Restore All Systems ON</span>
          </button>
        </div>
      </div>

      {/* Global Emergency Alert Banner if ON */}
      {config.globalEmergencyMode && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-900 font-semibold">
              Emergency Maintenance Mode is currently active. All role dashboards are temporarily redirected to scheduled maintenance screens.
            </p>
          </div>
        </div>
      )}

      {/* Standardized KPI Grid */}
      <div className="sa-kpi-grid">
        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Managed Modules</span>
            <div className="sa-stats-icon-box sa-stats-icon-box--default">
              <SlidersHorizontal size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{totalModules} Systems</h3>
            <p className="sa-stats-change">
              <span className="sa-stats-change-text--up">Full feature inventory</span>
            </p>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Active Online</span>
            <div className="sa-stats-icon-box sa-stats-icon-box--default">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val text-emerald-600">{activeCount} Systems</h3>
            <p className="sa-stats-change">
              <span className="sa-stats-change-text--up">
                {((activeCount / totalModules) * 100).toFixed(0)}% Operational
              </span>
            </p>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Under Maintenance</span>
            <div className="sa-stats-icon-box sa-stats-icon-box--default">
              <Wrench size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val text-amber-600">{maintenanceCount} Systems</h3>
            <p className="sa-stats-change">
              <span className="sa-stats-change-text--up">Toggled OFF</span>
            </p>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Core USPs</span>
            <div className="sa-stats-icon-box sa-stats-icon-box--default">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val text-purple-600">{uspCount} Key Features</h3>
            <p className="sa-stats-change">
              <span className="sa-stats-change-text--up">AI Roadmaps, Interviews, etc.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="maintenancecontrols-categories-wrap">
        {categories.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`maintenancecontrols-category-pill ${isActive ? 'maintenancecontrols-category-pill--active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="mc-tab-badge">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Card */}
      <div className="departments-filter-card">
        <div className="sa-search-wrap dept-search-box w-full">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search module or feature name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      {/* Clean Table Card Layout */}
      <div className="maintenancecontrols-table-card">
        <div className="maintenancecontrols-table-wrap">
          <table className="maintenancecontrols-table">
            <thead>
              <tr className="maintenancecontrols-thead-row">
                <th className="maintenancecontrols-th">Module Details</th>
                <th className="maintenancecontrols-th">Category</th>
                <th className="maintenancecontrols-th">Target Role</th>
                <th className="maintenancecontrols-th">Live Status</th>
                <th className="maintenancecontrols-th-right">Switch Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((mod) => {
                const CategoryIcon = getCategoryIcon(mod.category);
                const isCurrentlyActive = mod.active && !config.globalEmergencyMode;

                return (
                  <tr key={mod.key} className="maintenancecontrols-tr">
                    <td className="maintenancecontrols-td">
                      <div className="mc-module-info-wrap">
                        <div className={`mc-module-icon-box ${isCurrentlyActive ? 'mc-module-icon-box--active' : 'mc-module-icon-box--maintenance'}`}>
                          <CategoryIcon size={18} />
                        </div>
                        <div>
                          <div className="mc-module-title-row">
                            <span>{mod.name}</span>
                            {mod.isUSP && (
                              <span className="mc-usp-badge">
                                USP
                              </span>
                            )}
                          </div>
                          <div className="mc-module-desc">{mod.description}</div>
                        </div>
                      </div>
                    </td>

                    <td className="maintenancecontrols-td">
                      <span className="mc-category-badge">
                        {mod.category}
                      </span>
                    </td>

                    <td className="maintenancecontrols-td">
                      <span className="mc-role-badge">
                        {mod.role}
                      </span>
                    </td>

                    <td className="maintenancecontrols-td">
                      {isCurrentlyActive ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Maintenance
                        </span>
                      )}
                    </td>

                    <td className="maintenancecontrols-td-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* High-Contrast Toggle Switch Button */}
                        <button
                          type="button"
                          onClick={() => toggleModule(mod.key)}
                          className={`maintenancecontrols-switch-btn ${
                            isCurrentlyActive
                              ? 'maintenancecontrols-switch-btn--enabled'
                              : 'maintenancecontrols-switch-btn--disabled'
                          }`}
                        >
                          <span className={`maintenancecontrols-switch-dot ${
                            isCurrentlyActive
                              ? 'maintenancecontrols-switch-dot--enabled'
                              : 'maintenancecontrols-switch-dot--disabled'
                          }`}></span>
                          <span>{isCurrentlyActive ? "Enabled" : "Maintenance"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingModule(mod)}
                          className="maintenancecontrols-action-icon-btn"
                          title="Edit Custom Notice Message"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewModule(mod)}
                          className="maintenancecontrols-action-icon-btn"
                          title="Preview Simulated Live Screen"
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

      {/* Edit Notice Modal Portal */}
      {editingModule && (
        <EditNoticeModal
          moduleData={editingModule}
          onClose={() => setEditingModule(null)}
          onSave={handleSaveMessage}
        />
      )}

      {/* Live Preview Modal Portal */}
      {previewModule && (
        <LivePreviewModal
          moduleData={previewModule}
          onClose={() => setPreviewModule(null)}
        />
      )}
    </div>
  );
}
