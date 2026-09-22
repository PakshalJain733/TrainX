import React, { createContext, useContext, useState, useEffect } from "react";

const initialMaintenanceConfig = {
  globalEmergencyMode: false,
  modules: {
    // 1. Authentication & Security
    authSystem: {
      key: "authSystem",
      name: "User Login & Registration System",
      category: "Auth & Gateways",
      active: true,
      role: "All Roles",
      description: "Student, Admin, Mentor & Coordinator login, signup, role authorization, and JWT authentication",
      message: "Authentication gateway is currently undergoing security upgrades and system maintenance.",
      updatedAt: "Just now",
    },

    // 2. Role Dashboards & Workspaces
    studentDashboard: {
      key: "studentDashboard",
      name: "Student Workspace & Dashboard",
      category: "Dashboards",
      active: true,
      role: "Student",
      description: "Student portal overview, goal selection, roadmap view, and personal analytics",
      message: "The Student Workspace is currently undergoing scheduled platform upgrades.",
      updatedAt: "Just now",
    },
    adminDashboard: {
      key: "adminDashboard",
      name: "College Admin Workspace",
      category: "Dashboards",
      active: true,
      role: "College Admin",
      description: "College admin management, department oversight, and college leaderboards",
      message: "College Admin portal is undergoing maintenance.",
      updatedAt: "Just now",
    },
    coordinatorDashboard: {
      key: "coordinatorDashboard",
      name: "Coordinator Faculty Workspace",
      category: "Dashboards",
      active: true,
      role: "Coordinator",
      description: "Faculty coordinator portal, department management, and student risk tracking",
      message: "Coordinator Workspace is temporarily offline for maintenance.",
      updatedAt: "Just now",
    },
    mentorDashboard: {
      key: "mentorDashboard",
      name: "Mentor & Trainer Workspace",
      category: "Dashboards",
      active: true,
      role: "Mentor",
      description: "Trainer portal, defaulter meetings, study material uploads, and skill gap reviews",
      message: "Mentor Workspace is currently undergoing scheduled maintenance.",
      updatedAt: "Just now",
    },
    superAdminDashboard: {
      key: "superAdminDashboard",
      name: "Super Admin Platform Control Hub",
      category: "Dashboards",
      active: true,
      role: "Super Admin",
      description: "Platform-wide governance, multiple college management, admin verification, and health oversight",
      message: "Super Admin Control Hub is undergoing maintenance.",
      updatedAt: "Just now",
    },

    // 3. Main USPs & Core AI Systems
    aiRoadmaps: {
      key: "aiRoadmaps",
      name: "AI Personalized Roadmap Generator",
      category: "AI Engine",
      active: true,
      role: "All Roles",
      isUSP: true,
      description: "AI engine generating career milestone roadmaps based on career goals (Python, Web, AI/ML, etc.) and adaptive updates",
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
      description: "AI-generated technical interview practice, automated voice/code evaluation, and performance analysis",
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
      description: "Automated analysis identifying student weak areas, improvement suggestions, and adaptive roadmap modifications",
      message: "Skill gap analytics engine is undergoing optimization.",
      updatedAt: "Just now",
    },

    // 4. Student Learning & Practice Flow
    learningContent: {
      key: "learningContent",
      name: "Learning Content & AI Study Material",
      category: "Learning & Practice",
      active: true,
      role: "Student & Mentor",
      description: "Study material repository, AI-generated learning content, topic-wise resources, and milestone guides",
      message: "Learning content repository is updating.",
      updatedAt: "Just now",
    },
    practiceCoding: {
      key: "practiceCoding",
      name: "Coding Practice & Code Compiler",
      category: "Learning & Practice",
      active: true,
      role: "Student",
      description: "Hands-on coding environment, algorithm practice problems, test runner, and submission judge",
      message: "Coding practice platform is temporarily undergoing database maintenance.",
      updatedAt: "Just now",
    },
    academicQuizzes: {
      key: "academicQuizzes",
      name: "Academic Quiz & Assessment Engine",
      category: "Learning & Practice",
      active: true,
      role: "Student & Coordinator",
      description: "MCQ assessments, timed tests, topic quizzes, and quiz performance analytics",
      message: "Quiz assessment module is currently offline for maintenance.",
      updatedAt: "Just now",
    },

    // 5. Operations, Performance & Governance
    leaderboards: {
      key: "leaderboards",
      name: "Milestone-Based Leaderboard System",
      category: "Operations & Monitoring",
      active: true,
      role: "All Roles",
      isUSP: true,
      description: "Overall college comparison, milestone-based ranking, and department-specific scoreboards",
      message: "Leaderboard rankings are recalculating.",
      updatedAt: "Just now",
    },
    attendance: {
      key: "attendance",
      name: "Attendance Tracking & History Module",
      category: "Operations & Monitoring",
      active: true,
      role: "All Roles",
      description: "Student attendance percentage tracking, absence history, and performance connection",
      message: "Attendance module sync is undergoing maintenance.",
      updatedAt: "Just now",
    },
    defaulters: {
      key: "defaulters",
      name: "Defaulter Management & Intervention Cycle",
      category: "Operations & Monitoring",
      active: true,
      role: "Mentor & Coordinator",
      isUSP: true,
      description: "Poor performance tracking, mentor meeting scheduling, parent notification triggers, and improvement cycles",
      message: "Defaulter remediation tracking system is undergoing updates.",
      updatedAt: "Just now",
    },
    mockDrives: {
      key: "mockDrives",
      name: "Mock Placement Drive System",
      category: "Operations & Monitoring",
      active: true,
      role: "Super Admin, Coordinator & Student",
      description: "Aptitude tests, machine tests, placement interview scoring, and recruitment recommendations",
      message: "Mock placement drive module is currently undergoing updates.",
      updatedAt: "Just now",
    },
    weeklyReports: {
      key: "weeklyReports",
      name: "Weekly Student Performance Report Generator",
      category: "Operations & Monitoring",
      active: true,
      role: "All Roles",
      description: "Automated weekly PDF and dashboard student performance analysis reports (quiz, coding, AI interview, skill gaps)",
      message: "Weekly report generation service is paused for scheduled maintenance.",
      updatedAt: "Just now",
    },
    collegeGovernance: {
      key: "collegeGovernance",
      name: "College, Department & Batch Management",
      category: "Operations & Monitoring",
      active: true,
      role: "Super Admin & College Admin",
      description: "Multi-college management, department creation (IT, CS, AIML, etc.), batch allocations, and admin verification",
      message: "Institutional college governance module is under maintenance.",
      updatedAt: "Just now",
    },
  },
};

const SystemMaintenanceContext = createContext(null);

export function SystemMaintenanceProvider({ children }) {
  const [config, setConfig] = useState(initialMaintenanceConfig);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';
    if (!token) return;
    // Fetch maintenance config directly from MySQL Database
    fetch('/api/v1/shared-content?type=maintenance', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        if (json && json.data && json.data.length > 0) {
          const item = json.data[0];
          if (item && item.data && Object.keys(item.data).length > 0) {
            setConfig(prev => ({
              ...prev,
              ...item.data,
              modules: {
                ...prev.modules,
                ...(item.data?.modules || {}),
              },
            }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Module state checker helper
  const isModuleActive = (moduleKey) => {
    if (config.globalEmergencyMode) return false;
    if (!moduleKey) return true;
    const mod = config.modules[moduleKey];
    return mod ? Boolean(mod.active) : true;
  };

  // Get module configuration details for maintenance screen
  const getModuleConfig = (moduleKey) => {
    if (!moduleKey || !config.modules[moduleKey]) {
      return {
        key: moduleKey || 'system',
        name: "Module Maintenance",
        category: "Platform System",
        role: "All Roles",
        message: "This section is currently undergoing maintenance by the platform engineering team.",
        updatedAt: "Active",
      };
    }
    return config.modules[moduleKey];
  };

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

  return (
    <SystemMaintenanceContext.Provider
      value={{
        config,
        isModuleActive,
        getModuleConfig,
        toggleModule,
        updateModuleMessage,
        toggleGlobalEmergencyMode,
        turnAllModulesOn,
      }}
    >
      {children}
    </SystemMaintenanceContext.Provider>
  );
}

export function useSystemMaintenance() {
  const ctx = useContext(SystemMaintenanceContext);
  if (!ctx) {
    throw new Error("useSystemMaintenance must be used within SystemMaintenanceProvider");
  }
  return ctx;
}
