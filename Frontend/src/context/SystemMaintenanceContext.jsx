import React, { createContext, useContext, useState, useEffect } from "react";

const initialMaintenanceConfig = {
  globalEmergencyMode: false,
  modules: {
    // Role Dashboards
    studentDashboard: {
      key: "studentDashboard",
      name: "Student Dashboard & Workspace",
      category: "Dashboards",
      active: true,
      role: "Student",
      description: "Student portal, goal selection, roadmap view, and personal analytics",
      message: "The Student Workspace is currently undergoing scheduled platform upgrades.",
      updatedAt: "Just now",
    },
    adminDashboard: {
      key: "adminDashboard",
      name: "College Admin Dashboard",
      category: "Dashboards",
      active: true,
      role: "College Admin",
      description: "College admin management, department oversight, and college leaderboards",
      message: "College Admin portal is undergoing maintenance.",
      updatedAt: "Just now",
    },
    coordinatorDashboard: {
      key: "coordinatorDashboard",
      name: "Coordinator Dashboard",
      category: "Dashboards",
      active: true,
      role: "Coordinator",
      description: "Faculty coordinator portal, department management, and student risk tracking",
      message: "Coordinator Workspace is temporarily offline for maintenance.",
      updatedAt: "Just now",
    },
    mentorDashboard: {
      key: "mentorDashboard",
      name: "Mentor / Trainer Workspace",
      category: "Dashboards",
      active: true,
      role: "Mentor",
      description: "Trainer portal, defaulter meetings, study material uploads, and skill gap reviews",
      message: "Mentor Workspace is currently undergoing scheduled maintenance.",
      updatedAt: "Just now",
    },

    // Core AI Systems (USPs)
    aiRoadmaps: {
      key: "aiRoadmaps",
      name: "AI Personalized Roadmap Generator",
      category: "AI Engine",
      active: true,
      role: "All Roles",
      isUSP: true,
      description: "AI engine generating career milestone roadmaps based on skill goals and performance",
      message: "AI Roadmap Generator algorithm model is being recalibrated. Feature will return shortly.",
      updatedAt: "Just now",
    },
    aiInterviews: {
      key: "aiInterviews",
      name: "AI Mock Interview & Evaluation System",
      category: "AI Engine",
      active: true,
      role: "Student & Mentor",
      isUSP: true,
      description: "AI-powered voice/code mock interviews, automated scoring, and technical evaluation",
      message: "AI Interview evaluation servers are currently performing routine model maintenance.",
      updatedAt: "Just now",
    },
    skillGapAnalysis: {
      key: "skillGapAnalysis",
      name: "Skill-Gap Diagnostics Engine",
      category: "AI Engine",
      active: true,
      role: "Student, Mentor & Coordinator",
      isUSP: true,
      description: "Automated analysis identifying student weak areas and adaptive roadmap updates",
      message: "Skill gap analytics engine is undergoing optimization.",
      updatedAt: "Just now",
    },

    // Learning & Practice Modules
    practiceCoding: {
      key: "practiceCoding",
      name: "Practice & Coding Platform",
      category: "Learning Flow",
      active: true,
      role: "Student",
      description: "Hands-on code execution environment, problem sets, and submission judge",
      message: "Coding practice platform is temporarily undergoing database maintenance.",
      updatedAt: "Just now",
    },
    learningContent: {
      key: "learningContent",
      name: "Learning Content & Study Material",
      category: "Learning Flow",
      active: true,
      role: "Student & Mentor",
      description: "Topic-wise learning resources, notes, and AI study materials",
      message: "Learning content repository is updating.",
      updatedAt: "Just now",
    },
    academicQuizzes: {
      key: "academicQuizzes",
      name: "Academic Quiz Engine",
      category: "Learning Flow",
      active: true,
      role: "Student & Coordinator",
      description: "MCQ assessments, timed tests, and score tracking",
      message: "Quiz assessment module is currently offline for maintenance.",
      updatedAt: "Just now",
    },

    // Operations & Governance
    leaderboards: {
      key: "leaderboards",
      name: "Leaderboard System (Overall & Dept)",
      category: "Operations",
      active: true,
      role: "All Roles",
      isUSP: true,
      description: "Milestone-based ranking, department scoreboards, and college leaderboard",
      message: "Leaderboard rankings are recalculating.",
      updatedAt: "Just now",
    },
    attendance: {
      key: "attendance",
      name: "Attendance Governance Module",
      category: "Operations",
      active: true,
      role: "All Roles",
      description: "Student attendance tracking, percentage calculations, and absence logs",
      message: "Attendance module sync is undergoing maintenance.",
      updatedAt: "Just now",
    },
    defaulters: {
      key: "defaulters",
      name: "Defaulter Management & Intervention Cycle",
      category: "Operations",
      active: true,
      role: "Mentor & Coordinator",
      isUSP: true,
      description: "Poor performance tracking, mentor meeting booking, and parent notification triggers",
      message: "Defaulter remediation tracking system is undergoing updates.",
      updatedAt: "Just now",
    },
    weeklyReports: {
      key: "weeklyReports",
      name: "Weekly Student Performance Report Generator",
      category: "Operations",
      active: true,
      role: "All Roles",
      description: "Automated weekly PDF/dashboard analysis reports for students, mentors, and admins",
      message: "Weekly report generation service is paused for scheduled maintenance.",
      updatedAt: "Just now",
    },
    mockDrives: {
      key: "mockDrives",
      name: "Placement & Mock Drive System",
      category: "Operations",
      active: true,
      role: "Super Admin, Coordinator & Student",
      description: "Aptitude tests, machine tests, placement eligibility, and drive management",
      message: "Mock drives module is currently undergoing updates.",
      updatedAt: "Just now",
    },
  },
};

const SystemMaintenanceContext = createContext(null);

export function SystemMaintenanceProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("platform_system_maintenance_config");
      return saved ? JSON.parse(saved) : initialMaintenanceConfig;
    } catch {
      return initialMaintenanceConfig;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("platform_system_maintenance_config", JSON.stringify(config));
    } catch (e) {
      console.error("Failed to save maintenance state:", e);
    }
  }, [config]);

  // Toggle single module ON/OFF
  const toggleModule = (moduleKey) => {
    setConfig((prev) => {
      const mod = prev.modules[moduleKey];
      if (!mod) return prev;
      const nextActive = !mod.active;
      return {
        ...prev,
        modules: {
          ...prev.modules,
          [moduleKey]: {
            ...mod,
            active: nextActive,
            updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        },
      };
    });
  };

  // Update maintenance message for a module
  const updateModuleMessage = (moduleKey, message) => {
    setConfig((prev) => {
      const mod = prev.modules[moduleKey];
      if (!mod) return prev;
      return {
        ...prev,
        modules: {
          ...prev.modules,
          [moduleKey]: {
            ...mod,
            message,
            updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        },
      };
    });
  };

  // Master Global Emergency Maintenance Switch
  const toggleGlobalEmergencyMode = () => {
    setConfig((prev) => ({
      ...prev,
      globalEmergencyMode: !prev.globalEmergencyMode,
    }));
  };

  // Turn all modules ON
  const turnAllModulesOn = () => {
    setConfig((prev) => {
      const updatedModules = { ...prev.modules };
      Object.keys(updatedModules).forEach((k) => {
        updatedModules[k] = {
          ...updatedModules[k],
          active: true,
          updatedAt: "Just now",
        };
      });
      return {
        ...prev,
        globalEmergencyMode: false,
        modules: updatedModules,
      };
    });
  };

  // Helper check function
  const isModuleActive = (moduleKey) => {
    if (config.globalEmergencyMode) return false;
    return config.modules[moduleKey]?.active ?? true;
  };

  const getModuleConfig = (moduleKey) => {
    return config.modules[moduleKey] || { active: true, message: "Under maintenance" };
  };

  return (
    <SystemMaintenanceContext.Provider
      value={{
        config,
        toggleModule,
        updateModuleMessage,
        toggleGlobalEmergencyMode,
        turnAllModulesOn,
        isModuleActive,
        getModuleConfig,
      }}
    >
      {children}
    </SystemMaintenanceContext.Provider>
  );
}

export function useSystemMaintenance() {
  const context = useContext(SystemMaintenanceContext);
  if (!context) {
    throw new Error("useSystemMaintenance must be used within a SystemMaintenanceProvider");
  }
  return context;
}
