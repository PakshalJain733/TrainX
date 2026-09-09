import React, { useState } from "react";
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
  Shield
} from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import '../Styles/MaintenanceControls.css';

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
  const [editingModuleKey, setEditingModuleKey] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [previewModuleKey, setPreviewModuleKey] = useState(null);

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

  const handleSaveMessage = (key) => {
    updateModuleMessage(key, messageInput);
    setEditingModuleKey(null);
  };

  const categories = [
    { id: "all", label: "All Modules", count: totalModules },
    { id: "Auth & Gateways", label: "Auth & Login" },
    { id: "Dashboards", label: "Role Dashboards" },
    { id: "AI Engine", label: "AI Systems (USPs)" },
    { id: "Learning & Practice", label: "Learning & Coding" },
    { id: "Operations & Monitoring", label: "Operations & Reports" },
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
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={toggleGlobalEmergencyMode}
            className={`maintenancecontrols-btn-emergency ${config.globalEmergencyMode ? 'maintenancecontrols-btn-emergency--on' : ''}`}
          >
            <Power size={14} />
            <span>{config.globalEmergencyMode ? "Emergency ON" : "Emergency Maintenance"}</span>
          </button>
          <button type="button" onClick={turnAllModulesOn} className="sa-btn-primary">
            <RefreshCw size={14} />
            <span>Restore All Systems ON</span>
          </button>
        </div>
      </div>

      {/* Global Emergency Alert Banner if ON */}
      {config.globalEmergencyMode && (
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              Emergency Maintenance Mode is currently active. All role dashboards are temporarily redirected to scheduled maintenance screens.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleGlobalEmergencyMode}
            className="px-2.5 py-1 bg-amber-600 text-white font-semibold text-xs rounded-lg transition shrink-0 cursor-pointer"
          >
            Turn Off Emergency
          </button>
        </div>
      )}

      {/* Standardized KPI Grid */}
      <div className="sa-kpi-grid">
        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Managed Modules</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <SlidersHorizontal size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val">{totalModules} Systems</h3>
            <span className="text-xs text-slate-500 font-medium">Full feature inventory</span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Active Online</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val text-emerald-600">{activeCount} Systems</h3>
            <span className="text-xs text-emerald-600 font-semibold">
              {((activeCount / totalModules) * 100).toFixed(0)}% Operational
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Under Maintenance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Wrench size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val text-amber-600">{maintenanceCount} Systems</h3>
            <span className="text-xs text-amber-600 font-semibold">Toggled OFF</span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Core USPs</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val text-purple-600">{uspCount} Key Features</h3>
            <span className="text-xs text-purple-600 font-semibold">AI Roadmaps, Interviews, etc.</span>
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
            </button>
          );
        })}
      </div>

      {/* Search Input Card */}
      <div className="sa-search-card">
        <div className="sa-search-wrap" style={{ maxWidth: "100%" }}>
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
                const isEditing = editingModuleKey === mod.key;

                return (
                  <React.Fragment key={mod.key}>
                    <tr className="maintenancecontrols-tr">
                      <td className="maintenancecontrols-td">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex flex-shrink-0 items-center justify-center font-bold text-xs border ${
                            isCurrentlyActive
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}>
                            <CategoryIcon size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{mod.name}</span>
                              {mod.isUSP && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                  USP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{mod.description}</div>
                          </div>
                        </div>
                      </td>

                      <td className="maintenancecontrols-td">
                        <span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {mod.category}
                        </span>
                      </td>

                      <td className="maintenancecontrols-td font-medium text-slate-700">
                        {mod.role}
                      </td>

                      <td className="maintenancecontrols-td">
                        {isCurrentlyActive ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Maintenance
                          </span>
                        )}
                      </td>

                      <td className="maintenancecontrols-td-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Clean High-Contrast Toggle Switch Button */}
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
                            <span>{isCurrentlyActive ? "Enabled" : "Disabled"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isEditing) {
                                setEditingModuleKey(null);
                              } else {
                                setEditingModuleKey(mod.key);
                                setMessageInput(mod.message);
                              }
                            }}
                            className="maintenancecontrols-action-icon-btn"
                            title="Edit Maintenance Message"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewModuleKey(previewModuleKey === mod.key ? null : mod.key)}
                            className="maintenancecontrols-action-icon-btn"
                            title="Preview Screen"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Notice Editor Row */}
                    {isEditing && (
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td colSpan={5} className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-700 shrink-0">Custom Notice Message:</span>
                            <input
                              type="text"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                              placeholder="Message shown to users during maintenance..."
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveMessage(mod.key)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition"
                            >
                              Save Message
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingModuleKey(null)}
                              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Expandable Preview Row */}
                    {previewModuleKey === mod.key && (
                      <tr className="bg-indigo-50/40 border-b border-slate-200">
                        <td colSpan={5} className="py-3 px-4">
                          <div className="text-xs text-indigo-900 font-medium flex items-center gap-2">
                            <span className="font-bold text-indigo-950">Maintenance View Preview:</span>
                            <span className="italic">"{mod.message}"</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
