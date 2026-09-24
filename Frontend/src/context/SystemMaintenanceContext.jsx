import React, { createContext, useContext, useState, useEffect } from "react";

const initialMaintenanceConfig = {
  globalEmergencyMode: false,
  modules: {
    // 1. Authentication & Security (Deep Breakdown)
    loginWithPassword: {
      key: "loginWithPassword",
      name: "Email & Password Login System",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Standard login authentication via registered email/username and secure password hashing",
      message: "Password authentication is undergoing routine security upgrades.",
      updatedAt: "Just now",
    },
    loginWithOTP: {
      key: "loginWithOTP",
      name: "Mobile & SMS OTP Login System",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Instant mobile number verification and one-time passcode (OTP) SMS gateway authentication",
      message: "SMS OTP authentication gateway is temporarily offline for maintenance.",
      updatedAt: "Just now",
    },
    twoFactorAuth: {
      key: "twoFactorAuth",
      name: "Two-Factor Authentication (2FA)",
      category: "Auth & Security",
      active: true,
      role: "Admin & Super Admin",
      description: "Secondary security verification layer for administrator login and sensitive actions",
      message: "Two-Factor Security verification is updating.",
      updatedAt: "Just now",
    },
    userRegistration: {
      key: "userRegistration",
      name: "Self-Registration & Sign-Up Flow",
      category: "Auth & Security",
      active: true,
      role: "Student & Faculty",
      description: "New student account creation, college selection, roll number validation, and registration portal",
      message: "Registration portal is temporarily paused for database maintenance.",
      updatedAt: "Just now",
    },
    passwordReset: {
      key: "passwordReset",
      name: "Password Recovery & Change Password Modal",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Self-service password reset, email recovery links, and profile password change modal",
      message: "Password recovery service is updating.",
      updatedAt: "Just now",
    },
    authSystem: {
      key: "authSystem",
      name: "JWT Authorization & Token Guard",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Session token authorization, automatic token refresh, and role access security",
      message: "Authentication gateway is undergoing security maintenance.",
      updatedAt: "Just now",
    },

    // 2. Student Role Features (Deep Breakdown)
    studentDashboard: {
      key: "studentDashboard",
      name: "Student Workspace & Dashboard Overview",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Student dashboard, personal analytics cards, target career goal, and milestone summary",
      message: "Student Workspace overview is currently undergoing scheduled platform upgrades.",
      updatedAt: "Just now",
    },
    aiRoadmaps: {
      key: "aiRoadmaps",
      name: "AI Career Milestone Roadmap Generator",
      category: "Student Features",
      active: true,
      role: "Student",
      isUSP: true,
      description: "Personalized AI roadmap generation based on chosen career domain (Python, Web, AI/ML, DevOps)",
      message: "AI Roadmap Generator model is being recalibrated.",
      updatedAt: "Just now",
    },
    aiRoadmapUpdater: {
      key: "aiRoadmapUpdater",
      name: "AI Dynamic Roadmap Node Progress Update",
      category: "Student Features",
      active: true,
      role: "Student",
      isUSP: true,
      description: "Real-time updates to roadmap node milestones as students complete topics and coding tasks",
      message: "Dynamic roadmap tracker is updating.",
      updatedAt: "Just now",
    },
    aiInterviews: {
      key: "aiInterviews",
      name: "AI Voice Technical Mock Interview Practice",
      category: "Student Features",
      active: true,
      role: "Student",
      isUSP: true,
      description: "Interactive voice & audio technical mock interviews with automated AI feedback and grading",
      message: "AI Interview servers are performing routine maintenance.",
      updatedAt: "Just now",
    },
    aiInterviewCode: {
      key: "aiInterviewCode",
      name: "AI In-Interview Code Runner & Evaluation",
      category: "Student Features",
      active: true,
      role: "Student",
      isUSP: true,
      description: "Real-time coding playground and code correctness evaluation during AI interview sessions",
      message: "Interview coding sandbox is undergoing upgrades.",
      updatedAt: "Just now",
    },
    skillGapAnalysis: {
      key: "skillGapAnalysis",
      name: "Skill-Gap Diagnostics Engine",
      category: "Student Features",
      active: true,
      role: "Student",
      isUSP: true,
      description: "Automated analysis identifying student weak areas, topic deficiencies, and skill radar breakdown",
      message: "Skill gap analytics engine is undergoing optimization.",
      updatedAt: "Just now",
    },
    studentSkillGaps: {
      key: "studentSkillGaps",
      name: "Student Detailed Skill Radar & Weak Areas View",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Detailed topic-wise skill radar chart, weak concept breakdowns, and recommended practice drills",
      message: "Detailed skill radar view is under maintenance.",
      updatedAt: "Just now",
    },
    learningContent: {
      key: "learningContent",
      name: "Learning Content & Document Repository",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Topic-wise study guides, faculty uploaded notes, PDF resources, and milestone reference material",
      message: "Learning content repository is updating.",
      updatedAt: "Just now",
    },
    academicQuizzes: {
      key: "academicQuizzes",
      name: "Academic Quiz & Timed Assessment Engine",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Topic MCQs, timed test assessments, auto-grading, and detailed answer explanations",
      message: "Academic Quiz engine is currently offline for maintenance.",
      updatedAt: "Just now",
    },
    practiceCoding: {
      key: "practiceCoding",
      name: "Coding Practice & Multi-Language Compiler",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Hands-on coding playground, algorithm challenge library, live test runner, and submission judge",
      message: "Coding practice compiler is undergoing database maintenance.",
      updatedAt: "Just now",
    },
    codingCompiler: {
      key: "codingCompiler",
      name: "Interactive Multi-Language Code Playground & Execution Sandbox",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Live C, C++, Java, Python, and JS code execution sandbox with real-time test case assertions",
      message: "Code execution sandbox is under maintenance.",
      updatedAt: "Just now",
    },
    attendance: {
      key: "attendance",
      name: "Student Attendance & History Tracker",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Subject & class attendance percentages, attendance log history, and defaulter warnings",
      message: "Attendance module sync is undergoing maintenance.",
      updatedAt: "Just now",
    },
    weeklyReports: {
      key: "weeklyReports",
      name: "Weekly Student Performance PDF Reports",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Weekly automated PDF performance reports summarizing quiz scores, coding progress, and skill gaps",
      message: "Weekly report generator is paused for maintenance.",
      updatedAt: "Just now",
    },
    mockDrives: {
      key: "mockDrives",
      name: "Placement Mock Drive & Aptitude Tests",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Simulated campus recruitment tests, company aptitude rounds, and placement qualification scores",
      message: "Mock drive system is undergoing updates.",
      updatedAt: "Just now",
    },
    studentBatches: {
      key: "studentBatches",
      name: "Student Cohort & Batch Enrollments View",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "View assigned batch details, class schedules, and peer cohort information",
      message: "Batch portal is updating.",
      updatedAt: "Just now",
    },
    studentNotifications: {
      key: "studentNotifications",
      name: "Student Notification Center & Real-Time Alerts",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Broadcast alerts, deadline reminders, test notifications, and mentor messages",
      message: "Student Notification center is updating.",
      updatedAt: "Just now",
    },
    studentHelp: {
      key: "studentHelp",
      name: "Student Helpdesk & Ticket Submission Portal",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Student ticket submission, FAQ directory, and technical support inquiry form",
      message: "Student Helpdesk is currently under maintenance.",
      updatedAt: "Just now",
    },
    studentProfile: {
      key: "studentProfile",
      name: "Student Profile & Account Customization",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Managing personal details, profile picture, avatar selection, and security settings",
      message: "Student Profile editor is undergoing updates.",
      updatedAt: "Just now",
    },

    // 3. Mentor & Trainer Features (Deep Breakdown)
    mentorDashboard: {
      key: "mentorDashboard",
      name: "Mentor Workspace Overview",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Trainer portal overview, assigned cohort progress, and pending student reviews",
      message: "Mentor Workspace is currently undergoing scheduled maintenance.",
      updatedAt: "Just now",
    },
    mentorStudents: {
      key: "mentorStudents",
      name: "Assigned Students Directory & Filter",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Roster of assigned students, academic filters, and individual student progress lookup",
      message: "Student directory is updating.",
      updatedAt: "Just now",
    },
    mentorRoadmaps: {
      key: "mentorRoadmaps",
      name: "Mentor Review of Student AI Roadmaps",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      isUSP: true,
      description: "Faculty review, custom topic additions, and approval of student AI-generated roadmaps",
      message: "Roadmap review portal is under maintenance.",
      updatedAt: "Just now",
    },
    mentorAIInterviews: {
      key: "mentorAIInterviews",
      name: "Mentor Review of AI Interview Transcripts",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      isUSP: true,
      description: "Listening to audio recordings, reviewing AI feedback, and overriding interview scores",
      message: "Interview audit portal is updating.",
      updatedAt: "Just now",
    },
    mentorSkillGaps: {
      key: "mentorSkillGaps",
      name: "Mentor Review of Student Skill Diagnostics",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      isUSP: true,
      description: "Analyzing cohort weak spots and assigning targeted remediation tasks",
      message: "Skill gap review system is under maintenance.",
      updatedAt: "Just now",
    },
    mentorAttendance: {
      key: "mentorAttendance",
      name: "Live Class Attendance Marker & Register",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Marking daily student attendance for theory and practical lab batches",
      message: "Attendance marker is undergoing updates.",
      updatedAt: "Just now",
    },
    defaulters: {
      key: "defaulters",
      name: "Defaulter Management & Remediation Cycles",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      isUSP: true,
      description: "Low-attendance and low-performance student tracking, intervention workflows, and status tracking",
      message: "Defaulter tracking system is undergoing updates.",
      updatedAt: "Just now",
    },
    mentorMeetingScheduler: {
      key: "mentorMeetingScheduler",
      name: "Defaulter Parent Meeting Scheduler",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      isUSP: true,
      description: "Scheduling 1-on-1 counseling meetings with defaulter students and logging meeting notes",
      message: "Meeting scheduler is under maintenance.",
      updatedAt: "Just now",
    },
    mentorAssignments: {
      key: "mentorAssignments",
      name: "Faculty Homework & Assignment Grading",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Creating custom assignments, collecting student submissions, and entering manual grades",
      message: "Assignments portal is updating.",
      updatedAt: "Just now",
    },
    mentorSessions: {
      key: "mentorSessions",
      name: "Live Interactive Session Scheduling",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Scheduling live video sessions, posting meeting links, and managing Q&A agendas",
      message: "Session scheduling is under maintenance.",
      updatedAt: "Just now",
    },
    mentorStudyMaterial: {
      key: "mentorStudyMaterial",
      name: "Faculty Study Material Uploader",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Uploading PDF lectures, code samples, reference links, and batch resources",
      message: "Material uploader is undergoing updates.",
      updatedAt: "Just now",
    },
    mentorBroadcast: {
      key: "mentorBroadcast",
      name: "Mentor Cohort Broadcast Notifications",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Sending instant broadcast announcements to assigned student batches",
      message: "Broadcast notification system is updating.",
      updatedAt: "Just now",
    },
    mentorQuizzes: {
      key: "mentorQuizzes",
      name: "Mentor Quiz & Assessment Authoring",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Creating chapter-wise practice tests, setting answer keys, and managing quiz timers",
      message: "Mentor quiz authoring tool is under maintenance.",
      updatedAt: "Just now",
    },
    mentorPerformance: {
      key: "mentorPerformance",
      name: "Mentor Student Analytics & Progress Audit",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Detailed analytics of student test scores, coding speed, and attendance percentage",
      message: "Mentor analytics portal is updating.",
      updatedAt: "Just now",
    },
    mentorMockDrives: {
      key: "mentorMockDrives",
      name: "Mentor Placement Mock Drive Management",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Coordinating placement drive rounds, mock interviews, and student evaluation entries",
      message: "Placement drive manager is under maintenance.",
      updatedAt: "Just now",
    },
    mentorWeeklyReports: {
      key: "mentorWeeklyReports",
      name: "Mentor Cohort Weekly PDF Audits",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Generating and reviewing weekly batch progress PDF summaries for college management",
      message: "Cohort weekly report tool is updating.",
      updatedAt: "Just now",
    },
    mentorNotifications: {
      key: "mentorNotifications",
      name: "Mentor Notification Center & System Alerts",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Receiving real-time notifications for student submission alerts and admin notices",
      message: "Mentor notification system is under maintenance.",
      updatedAt: "Just now",
    },
    mentorHelp: {
      key: "mentorHelp",
      name: "Mentor Faculty Help & Support Center",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Faculty help center, technical support documentation, and issue reporting",
      message: "Mentor help center is updating.",
      updatedAt: "Just now",
    },
    mentorProfile: {
      key: "mentorProfile",
      name: "Mentor Profile & Faculty Account Settings",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Faculty profile details, designation, subject expertise, and login password change",
      message: "Mentor profile editor is under maintenance.",
      updatedAt: "Just now",
    },

    // 4. Faculty Coordinator Features (Deep Breakdown)
    coordinatorDashboard: {
      key: "coordinatorDashboard",
      name: "Coordinator Faculty Workspace Overview",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Department overview, faculty workloads, student pass rates, and risk alerts",
      message: "Coordinator Workspace is temporarily offline for maintenance.",
      updatedAt: "Just now",
    },
    coordinatorBatches: {
      key: "coordinatorBatches",
      name: "Department Cohort & Batch Setup",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Department batch allocations, division setups, and mentor assignments",
      message: "Batch management is updating.",
      updatedAt: "Just now",
    },
    coordinatorStudents: {
      key: "coordinatorStudents",
      name: "Department Student Roster & Status",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Department student directory, semester status, roll numbers, and academic records",
      message: "Student roster is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorPerformances: {
      key: "coordinatorPerformances",
      name: "Department Quiz & Coding Test Analytics",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Department assessment scores, coding accuracy averages, and batch comparisons",
      message: "Performance analytics portal is updating.",
      updatedAt: "Just now",
    },
    coordinatorInterviewPerformance: {
      key: "coordinatorInterviewPerformance",
      name: "Department AI Interview Clearance Analytics",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "AI interview completion rates and technical fluency scores across department batches",
      message: "Interview analytics is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorStudentsNeedImprovement: {
      key: "coordinatorStudentsNeedImprovement",
      name: "Low-Performing Student Intervention Tracker",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Automated list of students scoring under threshold with intervention assignment controls",
      message: "Intervention tracker is updating.",
      updatedAt: "Just now",
    },
    coordinatorAttendance: {
      key: "coordinatorAttendance",
      name: "Department Attendance Register Sync",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Reviewing department-wide daily attendance registers and defaulter counts",
      message: "Attendance sync is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorMentors: {
      key: "coordinatorMentors",
      name: "Faculty Mentors & Trainers Directory",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Managing department mentors, assigning subject modules, and tracking mentor activity",
      message: "Mentors directory is updating.",
      updatedAt: "Just now",
    },
    coordinatorRequests: {
      key: "coordinatorRequests",
      name: "Student Approvals & Special Requests Workflow",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Approving student batch transfer requests, leave applications, and re-test permissions",
      message: "Requests workflow is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorBroadcast: {
      key: "coordinatorBroadcast",
      name: "Department Broadcast Announcement Center",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Sending official department announcements to students and faculty mentors",
      message: "Broadcast center is updating.",
      updatedAt: "Just now",
    },
    coordinatorPlacement: {
      key: "coordinatorPlacement",
      name: "Department Placement Drives & Recruitment Tracker",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Tracking department student placement offers, shortlisted candidates, and salary packages",
      message: "Department placement tracker is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorHelp: {
      key: "coordinatorHelp",
      name: "Coordinator Support & Help Center",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Coordinator documentation, ticket escalation to College Admin, and system guides",
      message: "Coordinator support portal is updating.",
      updatedAt: "Just now",
    },
    coordinatorProfile: {
      key: "coordinatorProfile",
      name: "Coordinator Profile & Department Account Settings",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Coordinator personal details, department head credentials, and password security",
      message: "Coordinator profile page is under maintenance.",
      updatedAt: "Just now",
    },

    // 5. College Admin Features (Deep Breakdown)
    adminDashboard: {
      key: "adminDashboard",
      name: "College Admin Executive Dashboard",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "College overview, overall pass rates, active department counts, and institutional metrics",
      message: "College Admin portal is undergoing maintenance.",
      updatedAt: "Just now",
    },
    manageUsers: {
      key: "manageUsers",
      name: "College User Directory & Role Assignment",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Managing college students, coordinators, and mentors, editing profiles and role permissions",
      message: "User Management portal is under maintenance.",
      updatedAt: "Just now",
    },
    adminBulkUserImport: {
      key: "adminBulkUserImport",
      name: "Bulk Student & Faculty CSV Import Tool",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Uploading CSV rosters for automatic user account creation and password generation",
      message: "CSV Import tool is under maintenance.",
      updatedAt: "Just now",
    },
    adminBatches: {
      key: "adminBatches",
      name: "College Batches & Academic Year Setup",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Creating academic cohorts (2025, 2026, 2027), assigning departments and capacity limits",
      message: "Batches setup portal is updating.",
      updatedAt: "Just now",
    },
    adminAttendance: {
      key: "adminAttendance",
      name: "Institutional Attendance CSV Register Upload",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Bulk uploading college attendance registers and biometrics sync",
      message: "Attendance register upload is under maintenance.",
      updatedAt: "Just now",
    },
    adminLearningContent: {
      key: "adminLearningContent",
      name: "Institutional Study Material Repository Setup",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Managing college-wide syllabus materials, course outlines, and shared assets",
      message: "Syllabus repository is updating.",
      updatedAt: "Just now",
    },
    adminQuizzes: {
      key: "adminQuizzes",
      name: "College Quiz & Assessment Test Authoring",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Authoring college-level examinations, setting question banks, time limits, and pass marks",
      message: "Test authoring tool is under maintenance.",
      updatedAt: "Just now",
    },
    adminPracticeProblems: {
      key: "adminPracticeProblems",
      name: "Coding Practice Problem Authoring Tool",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Adding custom DSA coding challenges, test cases, sample inputs/outputs, and solution hints",
      message: "Problem authoring tool is updating.",
      updatedAt: "Just now",
    },
    adminBroadcast: {
      key: "adminBroadcast",
      name: "College-Wide Announcement Broadcast System",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Publishing official institutional notices, exam schedules, and holiday broadcasts",
      message: "Broadcast system is under maintenance.",
      updatedAt: "Just now",
    },
    adminProgress: {
      key: "adminProgress",
      name: "Institutional Performance & Benchmark Analytics",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Department performance comparisons, placement readiness scores, and audit summaries",
      message: "Institutional analytics is updating.",
      updatedAt: "Just now",
    },
    adminDefaulters: {
      key: "adminDefaulters",
      name: "College-Wide Defaulter Audit Portal",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Institutional audit of defaulter lists across all departments and remediation tracking",
      message: "College defaulters audit is under maintenance.",
      updatedAt: "Just now",
    },
    adminMockDrives: {
      key: "adminMockDrives",
      name: "College Placement Drive & Company Setup",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Configuring campus recruitment drives, company eligibility criteria, and interview dates",
      message: "College placement setup is updating.",
      updatedAt: "Just now",
    },
    adminHelp: {
      key: "adminHelp",
      name: "College Admin Support & Ticket Center",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Submitting high-priority institutional tickets to Super Admin platform operations",
      message: "Admin support center is under maintenance.",
      updatedAt: "Just now",
    },
    adminProfile: {
      key: "adminProfile",
      name: "College Admin Profile & Institution Settings",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "College administrator profile, institutional branding, logo upload, and contact info",
      message: "College admin profile is updating.",
      updatedAt: "Just now",
    },

    // 6. Super Admin & Infrastructure Governance (Deep Breakdown)
    superAdminDashboard: {
      key: "superAdminDashboard",
      name: "Super Admin Platform Control Hub Overview",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Multi-college ecosystem summary, active subscription counts, and platform activity",
      message: "Super Admin Control Hub is undergoing maintenance.",
      updatedAt: "Just now",
    },
    collegesPage: {
      key: "collegesPage",
      name: "Partner College Directory & Profile Registration",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Registering new partner universities, editing college details, and location setup",
      message: "Colleges directory is under maintenance.",
      updatedAt: "Just now",
    },
    collegeAccessKeys: {
      key: "collegeAccessKeys",
      name: "College Security Access Key Generator",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Generating secure college activation keys and verifying administrator credentials",
      message: "Access Key generator is updating.",
      updatedAt: "Just now",
    },
    departmentsPage: {
      key: "departmentsPage",
      name: "Academic Streams & Department Structure Setup",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Managing engineering streams (CS, IT, AIML, DS, EXTC) and HOD assignments across colleges",
      message: "Department structure portal is under maintenance.",
      updatedAt: "Just now",
    },
    superAdminBatches: {
      key: "superAdminBatches",
      name: "Platform-Wide Cohort & Batch Governance",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Global batch monitoring, student volume caps, and cross-college cohort sync",
      message: "Cohort governance portal is updating.",
      updatedAt: "Just now",
    },
    superAdminManageUsers: {
      key: "superAdminManageUsers",
      name: "Multi-College User Directory & Security Access",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Global user search, role escalation (Super Admin, Admin, Coordinator, Mentor, Student), and account locking",
      message: "Global User Management is under maintenance.",
      updatedAt: "Just now",
    },
    superAdminRoleEscalation: {
      key: "superAdminRoleEscalation",
      name: "Platform User Role Escalation & Account Lock Controls",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Promoting users, revoking administrator roles, temporary user locks, and account suspensions",
      message: "Role escalation control is under maintenance.",
      updatedAt: "Just now",
    },
    superAdminTickets: {
      key: "superAdminTickets",
      name: "Support Tickets & Helpdesk Resolution Center",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Cross-institutional support tickets, bug reports, feature requests, and resolution workflows",
      message: "Support Ticket resolution center is updating.",
      updatedAt: "Just now",
    },
    systemHealth: {
      key: "systemHealth",
      name: "Real-Time Infrastructure Latency & Health Diagnostics",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Real-time MySQL ping latency, Node.js memory/CPU load, API throughput, and socket connections",
      message: "Infrastructure monitoring service is updating.",
      updatedAt: "Just now",
    },
    featureSwitches: {
      key: "featureSwitches",
      name: "Feature Switches & System Maintenance Controls",
      category: "Super Admin & Core AI",
      active: true,
      role: "Super Admin",
      description: "Deep granular feature toggle matrix, emergency maintenance mode, and notice customization",
      message: "Feature Switch control hub is under maintenance.",
      updatedAt: "Just now",
    },
  },
};

const SystemMaintenanceContext = createContext(null);

export function SystemMaintenanceProvider({ children }) {
  // Always load from initialMaintenanceConfig merged with localStorage
  const loadStoredConfig = () => {
    try {
      const saved = localStorage.getItem("system_maintenance_config_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialMaintenanceConfig,
          ...parsed,
          modules: {
            ...initialMaintenanceConfig.modules,
            ...(parsed.modules || {}),
          },
        };
      }
    } catch (e) {}
    return initialMaintenanceConfig;
  };

  const [config, setConfig] = useState(loadStoredConfig);

  // Sync with LocalStorage
  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem("system_maintenance_config_v2", JSON.stringify(newConfig));
    } catch (e) {}
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken') || '';
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
            setConfig(prev => {
              const updated = {
                ...prev,
                ...item.data,
                modules: {
                  ...initialMaintenanceConfig.modules,
                  ...(prev.modules || {}),
                  ...(item.data?.modules || {}),
                },
              };
              try {
                localStorage.setItem("system_maintenance_config_v2", JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
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
        name: "Module Maintenance",
        role: "Platform System",
        message: "This section is currently undergoing maintenance by the platform engineering team.",
        updatedAt: "Active",
      };
    }
    return config.modules[moduleKey];
  };

  // Toggle single module ON/OFF
  const toggleModule = (moduleKey) => {
    const mod = config.modules[moduleKey];
    if (!mod) return;
    const nextActive = !mod.active;
    const nextConfig = {
      ...config,
      modules: {
        ...config.modules,
        [moduleKey]: {
          ...mod,
          active: nextActive,
          updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      },
    };
    saveConfig(nextConfig);
  };

  // Update maintenance message for a module
  const updateModuleMessage = (moduleKey, message) => {
    const mod = config.modules[moduleKey];
    if (!mod) return;
    const nextConfig = {
      ...config,
      modules: {
        ...config.modules,
        [moduleKey]: {
          ...mod,
          message,
          updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      },
    };
    saveConfig(nextConfig);
  };

  // Master Global Emergency Maintenance Switch
  const toggleGlobalEmergencyMode = () => {
    saveConfig({
      ...config,
      globalEmergencyMode: !config.globalEmergencyMode,
    });
  };

  // Turn all modules ON
  const turnAllModulesOn = () => {
    const updatedModules = { ...initialMaintenanceConfig.modules };
    Object.keys(updatedModules).forEach((k) => {
      updatedModules[k] = {
        ...updatedModules[k],
        ...(config.modules[k] || {}),
        active: true,
        updatedAt: "Just now",
      };
    });
    saveConfig({
      ...config,
      globalEmergencyMode: false,
      modules: updatedModules,
    });
  };

  // Reset to initial full list
  const resetToFullDefault = () => {
    saveConfig(initialMaintenanceConfig);
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
        resetToFullDefault,
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
