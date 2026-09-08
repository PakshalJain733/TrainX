import React, { useState } from "react";
import {
  SlidersHorizontal,
  Power,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Shield,
  Sparkles,
  RefreshCw,
  Search,
  MessageSquare,
  Eye,
  Edit3,
  Bot,
  Code,
  Users,
  GraduationCap,
  Briefcase,
  Target,
  FileText,
  CalendarCheck,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSystemMaintenance } from "../../context/SystemMaintenanceContext";
import MaintenanceGuard from "../../components/Common/MaintenanceGuard";

export default function MaintenanceControls() {
  const {
    config,
    toggleModule,
    updateModuleMessage,
    toggleGlobalEmergencyMode,
    turnAllModulesOn,
  } = useSystemMaintenance();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingModuleKey, setEditingModuleKey] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [previewModuleKey, setPreviewModuleKey] = useState(null);

  const modulesList = Object.values(config.modules);

  // Category Filter
  const filteredModules = modulesList.filter((mod) => {
    const matchesSearch =
      mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === "all" ||
      (activeCategory === "Dashboards" && mod.category === "Dashboards") ||
      (activeCategory === "AI Engine" && mod.category === "AI Engine") ||
      (activeCategory === "Learning Flow" && mod.category === "Learning Flow") ||
      (activeCategory === "Operations" && mod.category === "Operations");
    return matchesSearch && matchesCategory;
  });

  const totalModules = modulesList.length;
  const activeCount = modulesList.filter((m) => m.active && !config.globalEmergencyMode).length;
  const maintenanceCount = totalModules - activeCount;
  const uspCount = modulesList.filter((m) => m.isUSP).length;

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Dashboards":
        return Users;
      case "AI Engine":
        return Sparkles;
      case "Learning Flow":
        return Code;
      case "Operations":
        return CalendarCheck;
      default:
        return SlidersHorizontal;
    }
  };

  const handleSaveMessage = (key) => {
    updateModuleMessage(key, messageInput);
    setEditingModuleKey(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10 pointer-events-none">
          <SlidersHorizontal size={240} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300 mb-3 backdrop-blur-sm">
              <Shield size={14} className="text-indigo-400" />
              <span>Platform Governance & Maintenance Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Super Admin On/Off Settings</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Control live accessibility for role dashboards (Student, Coordinator, Mentor) and core platform USPs during maintenance or feature rollouts.
            </p>
          </div>

          {/* Master Control Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleGlobalEmergencyMode}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                config.globalEmergencyMode
                  ? "bg-rose-600 text-white hover:bg-rose-700 animate-pulse"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <Power size={16} />
              {config.globalEmergencyMode ? "Emergency Maintenance: ON" : "Emergency Maintenance"}
            </button>

            <button
              onClick={turnAllModulesOn}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-md"
            >
              <RefreshCw size={14} />
              Restore All Systems ON
            </button>
          </div>
        </div>
      </div>

      {/* Global Emergency Alert Banner if ON */}
      {config.globalEmergencyMode && (
        <div className="p-4 bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl text-rose-300 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Emergency System Maintenance Active</h3>
              <p className="text-xs text-rose-200 mt-0.5">
                All student, coordinator, and mentor access is currently redirected to scheduled maintenance screens.
              </p>
            </div>
          </div>
          <button
            onClick={toggleGlobalEmergencyMode}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
          >
            Turn Off Emergency Mode
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Managed Modules</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalModules} Systems</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all dashboards</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-emerald-200 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Online</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{activeCount} Systems</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              {((activeCount / totalModules) * 100).toFixed(0)}% operational
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-amber-200 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Wrench size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Under Maintenance</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{maintenanceCount} Systems</p>
            <p className="text-[11px] text-amber-700/70 mt-0.5">Toggled OFF</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-200 transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Core USPs</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{uspCount} Key Features</p>
            <p className="text-[11px] text-purple-700/70 mt-0.5">AI Roadmaps, Interviews, etc.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search module or feature name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {[
              { id: "all", label: "All Modules" },
              { id: "Dashboards", label: "Role Dashboards" },
              { id: "AI Engine", label: "AI Systems" },
              { id: "Learning Flow", label: "Learning & Coding" },
              { id: "Operations", label: "Operations & Reports" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCategory === tab.id
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModules.map((mod) => {
          const CategoryIcon = getCategoryIcon(mod.category);
          const isCurrentlyActive = mod.active && !config.globalEmergencyMode;
          const isEditing = editingModuleKey === mod.key;

          return (
            <div
              key={mod.key}
              className={`bg-white rounded-2xl border transition p-5 space-y-4 ${
                isCurrentlyActive
                  ? "border-slate-200/80 shadow-xs hover:border-indigo-200"
                  : "border-amber-200 bg-amber-50/20 shadow-xs"
              }`}
            >
              {/* Card Top: Title & Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isCurrentlyActive
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <CategoryIcon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">{mod.name}</h3>
                      {mod.isUSP && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-xs">
                          CORE USP
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Target Role: <strong className="text-slate-600">{mod.role}</strong>
                    </p>
                  </div>
                </div>

                {/* ON / OFF Toggle Switch */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isCurrentlyActive ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {isCurrentlyActive ? "ON" : "OFF"}
                  </span>
                  <button
                    onClick={() => toggleModule(mod.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isCurrentlyActive ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isCurrentlyActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed">{mod.description}</p>

              {/* Status Badge & Maintenance Notice */}
              <div
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  isCurrentlyActive
                    ? "bg-slate-50 border-slate-100 text-slate-600"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                    {isCurrentlyActive ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : (
                      <Wrench size={13} className="text-amber-600 animate-spin" />
                    )}
                    Status: {isCurrentlyActive ? "ONLINE & OPERATIONAL" : "UNDER SCHEDULED MAINTENANCE"}
                  </span>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditingModuleKey(null);
                      } else {
                        setEditingModuleKey(mod.key);
                        setMessageInput(mod.message);
                      }
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    {isEditing ? "Close Notice" : "Edit Notice"}
                  </button>
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Customize Maintenance Banner Text for Users:
                    </label>
                    <textarea
                      rows={2}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingModuleKey(null)}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[11px] rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveMessage(mod.key)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-md"
                      >
                        Save Notice
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] italic text-slate-500 truncate">
                    Notice: "{mod.message}"
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Updated: {mod.updatedAt}</span>
                <button
                  onClick={() =>
                    setPreviewModuleKey(previewModuleKey === mod.key ? null : mod.key)
                  }
                  className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-indigo-600"
                >
                  <Eye size={13} />
                  {previewModuleKey === mod.key ? "Hide Preview" : "Preview Maintenance Screen"}
                </button>
              </div>

              {/* Live Preview Dropdown */}
              {previewModuleKey === mod.key && (
                <div className="mt-3 pt-3 border-t border-slate-200 animate-in fade-in">
                  <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase">
                    Preview of User Maintenance View ({mod.name}):
                  </p>
                  <MaintenanceGuard moduleKey={mod.key}>
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                      ✓ Module is currently ONLINE. Users can access this section normally.
                    </div>
                  </MaintenanceGuard>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
