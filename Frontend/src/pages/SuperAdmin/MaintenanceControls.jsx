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
import { useSystemMaintenance } from "../../context/SystemMaintenanceContext";

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
    <div className="space-y-6 text-slate-800">
      {/* Standard SuperAdmin Header */}
      <div className="sa-page-header">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <span>Feature Switches &amp; Module Controls</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage live accessibility for all 18 platform modules across Student, Coordinator, Mentor, and Admin roles
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleGlobalEmergencyMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              config.globalEmergencyMode
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
            }`}
          >
            <Power size={14} />
            <span>{config.globalEmergencyMode ? "Emergency ON" : "Emergency Maintenance"}</span>
          </button>
          <button onClick={turnAllModulesOn} className="sa-btn-primary">
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
            onClick={toggleGlobalEmergencyMode}
            className="px-2.5 py-1 bg-amber-600 text-white font-semibold text-xs rounded-lg transition shrink-0"
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
      <div className="flex items-center gap-2.5 pb-2 overflow-x-auto">
        {categories.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              style={{
                borderRadius: "20px",
                border: "none",
                outline: "none",
                boxShadow: isActive ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "none",
                background: isActive
                  ? "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)"
                  : "#f1f5f9",
                color: isActive ? "#ffffff" : "#475569",
                height: "38px",
                padding: "0 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
              className="text-xs font-bold transition-all duration-200 select-none whitespace-nowrap cursor-pointer hover:opacity-95"
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Standard Search Card */}
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
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-[10px] text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold bg-slate-50">
              <tr>
                <th className="py-3.5 px-4">Module Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Target Role</th>
                <th className="py-3.5 px-4">Live Status</th>
                <th className="py-3.5 px-4 text-right">Switch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredModules.map((mod) => {
                const CategoryIcon = getCategoryIcon(mod.category);
                const isCurrentlyActive = mod.active && !config.globalEmergencyMode;
                const isEditing = editingModuleKey === mod.key;

                return (
                  <React.Fragment key={mod.key}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
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

                      <td className="py-3.5 px-4">
                        <span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {mod.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {mod.role}
                      </td>

                      <td className="py-3.5 px-4">
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

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Clean High-Contrast Toggle Switch Button */}
                          <button
                            type="button"
                            onClick={() => toggleModule(mod.key)}
                            style={{
                              border: isCurrentlyActive ? "1px solid #a7f3d0" : "1px solid #fecdd3",
                              outline: "none",
                              background: isCurrentlyActive ? "#ecfdf5" : "#fff1f2",
                              color: isCurrentlyActive ? "#047857" : "#be123c"
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none"
                          >
                            <span className="w-2 h-2 rounded-full" style={{ background: isCurrentlyActive ? "#059669" : "#e11d48" }}></span>
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
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200 transition cursor-pointer"
                            title="Edit Maintenance Message"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewModuleKey(previewModuleKey === mod.key ? null : mod.key)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200 transition cursor-pointer"
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
