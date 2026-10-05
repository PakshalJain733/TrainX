import React, { createContext, useContext, useState, useEffect } from "react";
import { getApiBaseUrl } from "../utils/api";

const initialMaintenanceConfig = {
  globalEmergencyMode: false,
  modules: {
    // 1. Auth & Security
    loginWithPassword: {
      key: "loginWithPassword",
      name: "Password Login System",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Standard login authentication via registered email/username and secure password hashing",
      message: "Password authentication is undergoing routine security upgrades.",
      updatedAt: "Just now",
    },
    loginWithOTP: {
      key: "loginWithOTP",
      name: "OTP Login System",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Instant Email verification and one-time passcode (OTP) Email delivery authentication",
      message: "OTP authentication gateway is temporarily offline for maintenance.",
      updatedAt: "Just now",
    },
    emailSystem: {
      key: "emailSystem",
      name: "6-Digit Email OTP & Transactional Email Gateway",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Brevo API email dispatch gateway for registration 6-digit OTPs, instant verification code validation, login codes, password resets, and system notifications",
      message: "Email delivery & 6-digit OTP verification system is currently disabled by Super Admin maintenance policy.",
      updatedAt: "Just now",
    },
    twoFactorAuth: {
      key: "twoFactorAuth",
      name: "Two-Factor Authentication (2FA)",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Secondary security verification layer via Google/Microsoft Authenticator app",
      message: "Two-Factor Security verification is updating.",
      updatedAt: "Just now",
    },
    userRegistration: {
      key: "userRegistration",
      name: "Self-Registration & Sign-Up Flow",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "New users account creation and validation portal",
      message: "Registration portal is temporarily paused for database maintenance.",
      updatedAt: "Just now",
    },
    passwordReset: {
      key: "passwordReset",
      name: "Password Recovery & Reset Modal",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Self-service password reset, email recovery links, and profile password change modal",
      message: "Password recovery service is updating.",
      updatedAt: "Just now",
    },
    authSystem: {
      key: "authSystem",
      name: "JWT Authorization & Token Security Guard",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Session token authorization, automatic token refresh, and role access security guard",
      message: "Authentication gateway is undergoing security maintenance.",
      updatedAt: "Just now",
    },
    preRegistrationCheck: {
      key: "preRegistrationCheck",
      name: "Administrator Pre-Registration Lookup Engine",
      category: "Auth & Security",
      active: true,
      role: "All Roles",
      description: "Automatic lookup of pre-approved email rosters added by college administration",
      message: "Pre-registration verification lookup is temporarily updating.",
      updatedAt: "Just now",
    },

    // 2. Student Dashboard Features (Main Tabs & Small Sub-Features)
    studentDashboard: {
      key: "studentDashboard",
      name: "Student Workspace Overview Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Student main dashboard overview, quick stats, target career goal, and milestone summary card",
      message: "Student Workspace overview is undergoing scheduled platform upgrades.",
      updatedAt: "Just now",
    },
    aiRoadmaps: {
      key: "aiRoadmaps",
      name: "AI Milestone Roadmap Generator Tab",
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
      name: "AI Dynamic Roadmap Node Progress Tracker",
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
      name: "AI Interview Practice Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      isUSP: true,
      description: "Technical mock interviews with automated AI feedback and grading",
      message: "AI Interview servers are performing routine maintenance.",
      updatedAt: "Just now",
    },
    aiInterviewCode: {
      key: "aiInterviewCode",
      name: "AI In-Interview Code Runner",
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
      name: "Skill-Gap Analysis",
      category: "Student Features",
      active: true,
      role: "Student",
      isUSP: true,
      description: "Analysis identifying student weak areas, topic deficiencies, and skill radar breakdown",
      message: "Skill gap analysis engine is undergoing optimization.",
      updatedAt: "Just now",
    },
    studentSkillGaps: {
      key: "studentSkillGaps",
      name: "Detailed Skill Radar & Weak Areas",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Radar chart, weak concept breakdowns, and recommended practice drills",
      message: "Detailed skill radar view is under maintenance.",
      updatedAt: "Just now",
    },
    learningContent: {
      key: "learningContent",
      name: "Learning Content & Study Notes",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Study guides, faculty uploaded notes, PDF resources, and reference material",
      message: "Learning content repository is updating.",
      updatedAt: "Just now",
    },
    academicQuizzes: {
      key: "academicQuizzes",
      name: "Academic Quiz",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "MCQs, timed test assessments, auto-grading, and detailed answer explanations",
      message: "Academic Quiz engine is currently offline for maintenance.",
      updatedAt: "Just now",
    },
    practiceCoding: {
      key: "practiceCoding",
      name: "Coding Practice",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Coding problem library, algorithm challenge lists, live test runner, and submission judge",
      message: "Coding practice problem library is undergoing maintenance.",
      updatedAt: "Just now",
    },
    codingCompiler: {
      key: "codingCompiler",
      name: "Code Playground & Execution Sandbox",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Live C, C++, Java, Python, and JS code execution sandbox with real-time test case assertions",
      message: "Code execution sandbox is under maintenance.",
      updatedAt: "Just now",
    },
    attendance: {
      key: "attendance",
      name: "Student Attendance & History Tracker Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Subject & class attendance percentages, attendance log history, and defaulter warnings",
      message: "Attendance module sync is undergoing maintenance.",
      updatedAt: "Just now",
    },
    weeklyReports: {
      key: "weeklyReports",
      name: "Weekly Student Performance PDF Reports Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Weekly automated PDF performance reports summarizing quiz scores, coding progress, and skill gaps",
      message: "Weekly report generator is paused for maintenance.",
      updatedAt: "Just now",
    },
    mockDrives: {
      key: "mockDrives",
      name: "Placement Mock Drive & Aptitude Tests Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Simulated campus recruitment tests, company aptitude rounds, and placement qualification scores",
      message: "Mock drive system is undergoing updates.",
      updatedAt: "Just now",
    },
    studentBatches: {
      key: "studentBatches",
      name: "Student Batches Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "View assigned batch details, class schedules, division information, and peer cohort roster",
      message: "Batch portal is updating.",
      updatedAt: "Just now",
    },
    studentLeaderboard: {
      key: "studentLeaderboard",
      name: "Student Batch Leaderboard & Gamified XP Rankings Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Real-time class rankings based on coding points, solved problem counts, and active streaks",
      message: "Student Leaderboard is currently updating.",
      updatedAt: "Just now",
    },
    studentProgressAnalytics: {
      key: "studentProgressAnalytics",
      name: "Student Detailed Progress Analytics & Performance Radar Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Comprehensive progress charts, speed metrics, quiz accuracy, and subject readiness breakdown",
      message: "Student analytics portal is under maintenance.",
      updatedAt: "Just now",
    },
    studentNotifications: {
      key: "studentNotifications",
      name: "Student Notification Center & Real-Time Alerts Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Broadcast alerts, deadline reminders, test notifications, and mentor announcements",
      message: "Student Notification center is updating.",
      updatedAt: "Just now",
    },
    studentHelp: {
      key: "studentHelp",
      name: "Student Helpdesk & Support Ticket Portal Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Student support ticket submission, FAQ directory, and technical support inquiry form",
      message: "Student Helpdesk is currently under maintenance.",
      updatedAt: "Just now",
    },
    studentProfile: {
      key: "studentProfile",
      name: "Student Profile & Account Settings Tab",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Managing personal details, profile picture, avatar selection, and security settings",
      message: "Student Profile editor is undergoing updates.",
      updatedAt: "Just now",
    },
    studentAvatarSelector: {
      key: "studentAvatarSelector",
      name: "Student Custom Profile Avatar Selector",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Interactive 3D avatar & cartoon portrait picker for student profiles",
      message: "Avatar picker tool is under maintenance.",
      updatedAt: "Just now",
    },
    studentDarkMode: {
      key: "studentDarkMode",
      name: "Student Portal Dark / Light Theme Toggle",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Theme switcher allowing students to toggle between dark mode and sleek light mode",
      message: "Theme customization engine is updating.",
      updatedAt: "Just now",
    },
    studentSpeechToText: {
      key: "studentSpeechToText",
      name: "AI Interview Audio Speech Recognition & Mic Input",
      category: "Student Features",
      active: true,
      role: "Student",
      isUSP: true,
      description: "Live microphone audio capture and Web Speech-to-Text conversion for voice interviews",
      message: "Speech recognition service is under maintenance.",
      updatedAt: "Just now",
    },
    studentCodeHints: {
      key: "studentCodeHints",
      name: "Coding Practice AI Solution Hints & Explainer",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Interactive AI hints, time complexity analysis, and solution breakdowns for coding problems",
      message: "AI code explainer is updating.",
      updatedAt: "Just now",
    },
    studentDsaFilters: {
      key: "studentDsaFilters",
      name: "Coding Problem DSA Category & Difficulty Filters",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Filtering DSA practice challenges by Easy/Medium/Hard and topic tags (Arrays, Graphs, DP)",
      message: "Problem filter engine is under maintenance.",
      updatedAt: "Just now",
    },
    studentPdfDownloader: {
      key: "studentPdfDownloader",
      name: "Student PDF Progress Certificate & Weekly Audit Downloader",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "One-click export of verified PDF progress certificates and performance audits",
      message: "PDF download service is updating.",
      updatedAt: "Just now",
    },
    studentStreakTracker: {
      key: "studentStreakTracker",
      name: "Daily Coding Practice Activity Streak Counter",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Gamified streak counter highlighting consecutive days of active coding and quiz practice",
      message: "Streak counter service is under maintenance.",
      updatedAt: "Just now",
    },
    studentBatchSchedule: {
      key: "studentBatchSchedule",
      name: "Batch Lecture Timetable & Class Schedule Calendar",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Interactive weekly timetable showing scheduled lab sessions, lectures, and live workshops",
      message: "Class timetable widget is updating.",
      updatedAt: "Just now",
    },
    studentC2CEnrollment: {
      key: "studentC2CEnrollment",
      name: "Campus-to-Corporate (C2C) Special Course Registration",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Specialized C2C industry track enrollment and module access portal",
      message: "C2C registration portal is under maintenance.",
      updatedAt: "Just now",
    },
    studentQnaDiscussion: {
      key: "studentQnaDiscussion",
      name: "Topic-Wise Q&A Discussion Forum & Doubt Resolver",
      category: "Student Features",
      active: true,
      role: "Student",
      description: "Peer discussion board and faculty Q&A thread for solving academic doubts",
      message: "Q&A discussion forum is updating.",
      updatedAt: "Just now",
    },

    // 3. Mentor Features (Main Tabs & Small Sub-Features)
    mentorDashboard: {
      key: "mentorDashboard",
      name: "Mentor Overview Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Mentor Dashboard Overview, assigned batch progress, and pending student reviews",
      message: "Mentor Workspace is currently undergoing scheduled maintenance.",
      updatedAt: "Just now",
    },
    mentorStudents: {
      key: "mentorStudents",
      name: "Assigned Students Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "List of assigned students, academic filters, and individual student progress lookup",
      message: "Student directory is updating.",
      updatedAt: "Just now",
    },
    mentorLeaderboard: {
      key: "mentorLeaderboard",
      name: "Mentor Leaderboard & Student Rankings Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Batch leaderboard ranking students by coding points, solved problem counts, and active streaks",
      message: "Mentor leaderboard is currently updating.",
      updatedAt: "Just now",
    },
    mentorRoadmaps: {
      key: "mentorRoadmaps",
      name: "Mentor Review of Student AI Roadmaps Tab",
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
      name: "Mentor Review of AI Interview Transcripts Tab",
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
      name: "Mentor Review of Student Skill Diagnostics Tab",
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
      name: "Live Class Attendance Marker & Register Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Marking daily student attendance for theory and practical lab batches",
      message: "Attendance marker is undergoing updates.",
      updatedAt: "Just now",
    },
    defaulters: {
      key: "defaulters",
      name: "Defaulter Management Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      isUSP: true,
      description: "Low-attendance and low-performance student tracking, intervention workflows, and status tracking",
      message: "Defaulter tracking system is undergoing updates.",
      updatedAt: "Just now",
    },  
    mentorAssignments: {
      key: "mentorAssignments",
      name: "Faculty Homework & Assignment Grading Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Creating custom assignments, collecting student submissions, and entering manual grades",
      message: "Assignments portal is updating.",
      updatedAt: "Just now",
    },
    mentorSessions: {
      key: "mentorSessions",
      name: "Live Interactive Session Scheduling Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Scheduling live video sessions, posting meeting links, and managing Q&A agendas",
      message: "Session scheduling is under maintenance.",
      updatedAt: "Just now",
    },
    mentorStudyMaterial: {
      key: "mentorStudyMaterial",
      name: "Faculty Study Material & Resource Uploader Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Uploading PDF lectures, code samples, reference links, and batch resources",
      message: "Material uploader is undergoing updates.",
      updatedAt: "Just now",
    },
    mentorBroadcast: {
      key: "mentorBroadcast",
      name: "Mentor Cohort Broadcast Notifications Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Sending instant broadcast announcements to assigned student batches",
      message: "Broadcast notification system is updating.",
      updatedAt: "Just now",
    },
    mentorQuizzes: {
      key: "mentorQuizzes",
      name: "Mentor Quiz & Assessment Authoring Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Creating chapter-wise practice tests, setting answer keys, and managing quiz timers",
      message: "Mentor quiz authoring tool is under maintenance.",
      updatedAt: "Just now",
    },
    mentorPerformance: {
      key: "mentorPerformance",
      name: "Mentor Student Analytics & Progress Audit Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Detailed analytics of student test scores, coding speed, and attendance percentage",
      message: "Mentor analytics portal is updating.",
      updatedAt: "Just now",
    },
    mentorMockDrives: {
      key: "mentorMockDrives",
      name: "Mentor Placement Mock Drive Management Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Coordinating placement drive rounds, mock interviews, and student evaluation entries",
      message: "Placement drive manager is under maintenance.",
      updatedAt: "Just now",
    },
    mentorWeeklyReports: {
      key: "mentorWeeklyReports",
      name: "Mentor's Weekly Student PDF Audits Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Generating and reviewing weekly batch progress PDF summaries for college management",
      message: "Mentor's weekly student report tool is updating.",
      updatedAt: "Just now",
    },
    mentorNotifications: {
      key: "mentorNotifications",
      name: "Mentor Notification Center & System Alerts Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Receiving real-time notifications for student submission alerts and admin notices",
      message: "Mentor notification system is under maintenance.",
      updatedAt: "Just now",
    },
    mentorHelp: {
      key: "mentorHelp",
      name: "Mentor Help & Support Center Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Mentor help center, technical support documentation, and issue reporting",
      message: "Mentor help center is updating.",
      updatedAt: "Just now",
    },
    mentorProfile: {
      key: "mentorProfile",
      name: "Mentor Profile & Account Settings Tab",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Mentor profile details, designation, subject expertise, and login password change",
      message: "Mentor profile editor is under maintenance.",
      updatedAt: "Just now",
    },
    mentorScoreOverride: {
      key: "mentorScoreOverride",
      name: "Manual AI Interview & Quiz Score Override Tool",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      isUSP: true,
      description: "Allowing faculty mentors to manually edit and adjust AI interview and test grades",
      message: "Score override tool is under maintenance.",
      updatedAt: "Just now",
    },
    mentorDefaulterEscalation: {
      key: "mentorDefaulterEscalation",
      name: "Defaulter Escalation to Department Coordinator",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "One-click escalation of persistent defaulter students to department head",
      message: "Defaulter escalation workflow is under maintenance.",
      updatedAt: "Just now",
    },
    mentorBatchFilter: {
      key: "mentorBatchFilter",
      name: "Batch & Division Filter for Mentor Reports",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Filtering mentor dashboard reports by specific division (Div A, Div B, Div C)",
      message: "Division filter control is updating.",
      updatedAt: "Just now",
    },
    mentorLiveQnaRoom: {
      key: "mentorLiveQnaRoom",
      name: "Live Session Audience Q&A Room & Chat Control",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Moderating live student Q&A messages and controlling chat permissions during webinars",
      message: "Q&A chat control is under maintenance.",
      updatedAt: "Just now",
    },
    mentorRemarksLog: {
      key: "mentorRemarksLog",
      name: "Student Behavior & Counseling Remarks Logger",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Logging private faculty remarks, counseling notes, and disciplinary observations for students",
      message: "Remarks log system is updating.",
      updatedAt: "Just now",
    },
    mentorExportCsv: {
      key: "mentorExportCsv",
      name: "Mentor Cohort Attendance & Grade CSV Exporter",
      category: "Mentor Features",
      active: true,
      role: "Mentor",
      description: "Exporting raw student attendance registers and test marks to Excel/CSV format",
      message: "CSV export tool is under maintenance.",
      updatedAt: "Just now",
    },

    // 4. Coordinator Features (Main Tabs & Small Sub-Features)
    coordinatorDashboard: {
      key: "coordinatorDashboard",
      name: "Coordinator Overview Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Department overview, faculty workloads, student pass rates, and risk alerts",
      message: "Coordinator Workspace is temporarily offline for maintenance.",
      updatedAt: "Just now",
    },
    coordinatorBatches: {
      key: "coordinatorBatches",
      name: "Department Batch & Division Setup Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Department batch allocations, division setups, and mentor assignments",
      message: "Batch management is updating.",
      updatedAt: "Just now",
    },
    coordinatorStudents: {
      key: "coordinatorStudents",
      name: "Department Student Roster Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Department student directory, roll numbers, and academic records",
      message: "Student roster is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorPerformances: {
      key: "coordinatorPerformances",
      name: "Department Quiz & Coding Test Analytics Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Department assessment scores, coding accuracy averages, and batch comparisons",
      message: "Performance analytics portal is updating.",
      updatedAt: "Just now",
    },
    coordinatorInterviewPerformance: {
      key: "coordinatorInterviewPerformance",
      name: "Department AI Interview  Analytics Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "AI interview completion rates and technical fluency scores across department batches",
      message: "Interview analytics is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorStudentsNeedImprovement: {
      key: "coordinatorStudentsNeedImprovement",
      name: "Low-Performing Student Intervention Tracker Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Automated list of students scoring under threshold with intervention assignment controls",
      message: "Intervention tracker is updating.",
      updatedAt: "Just now",
    },
    coordinatorAttendance: {
      key: "coordinatorAttendance",
      name: "Department Attendance Register & Defaulter Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Reviewing department-wide daily attendance registers and defaulter counts",
      message: "Attendance sync is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorMentors: {
      key: "coordinatorMentors",
      name: "Faculty Mentors Directory Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Managing department mentors, assigning subject modules, and tracking mentor activity",
      message: "Mentors directory is updating.",
      updatedAt: "Just now",
    },
    coordinatorRequests: {
      key: "coordinatorRequests",
      name: "Student Approvals & Requests Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Approving student batch transfer requests, leave applications, and re-test permissions",
      message: "Requests workflow is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorBroadcast: {
      key: "coordinatorBroadcast",
      name: "Department Broadcast Announcement Center Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Sending official department announcements to students and faculty mentors",
      message: "Broadcast center is updating.",
      updatedAt: "Just now",
    },
    coordinatorHelp: {
      key: "coordinatorHelp",
      name: "Coordinator Support & System Documentation Center Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Coordinator documentation, ticket escalation to College Admin, and system guides",
      message: "Coordinator support portal is updating.",
      updatedAt: "Just now",
    },
    coordinatorProfile: {
      key: "coordinatorProfile",
      name: "Coordinator Profile & Department Credentials Tab",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Coordinator personal details, department head credentials, and password security",
      message: "Coordinator profile page is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorRetestApproval: {
      key: "coordinatorRetestApproval",
      name: "Student Re-Test & Special Assessment Approval Workflow",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Granting re-test access to students absent during official examination windows",
      message: "Re-test approval workflow is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorMentorWorkload: {
      key: "coordinatorMentorWorkload",
      name: "Mentor Workload & Batch Allocation Balancer",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Visualizing mentor student load and rebalancing batch assignments across department faculty",
      message: "Mentor workload balancer is updating.",
      updatedAt: "Just now",
    },
    coordinatorBatchCapacity: {
      key: "coordinatorBatchCapacity",
      name: "Division Capacity Limits",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Setting max student limits per division (A, B, C) and auto-assigning student roll IDs",
      message: "Division capacity manager is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorRiskAlerts: {
      key: "coordinatorRiskAlerts",
      name: "Automated Department At-Risk Student Warning System",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Algorithmic flagging of students with falling attendance, failing quiz scores, or inactive coding",
      message: "Risk warning system is under maintenance.",
      updatedAt: "Just now",
    },
    coordinatorCustomNotice: {
      key: "coordinatorCustomNotice",
      name: "Department Noticeboard Banner Customizer",
      category: "Coordinator Features",
      active: true,
      role: "Coordinator",
      description: "Pinning priority exam alerts and assignment deadlines to department student dashboards",
      message: "Noticeboard customizer is updating.",
      updatedAt: "Just now",
    },

    // 5. College Admin Features (Main Tabs & Small Sub-Features)
    adminDashboard: {
      key: "adminDashboard",
      name: "College Admin Executive Dashboard Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "College overview, overall pass rates, active department counts, and institutional metrics",
      message: "College Admin portal is undergoing maintenance.",
      updatedAt: "Just now",
    },
    manageUsers: {
      key: "manageUsers",
      name: "College User Directory & Role Assignment Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Managing college students, coordinators, and mentors, editing profiles and role permissions",
      message: "User Management portal is under maintenance.",
      updatedAt: "Just now",
    },
    adminBulkUserImport: {
      key: "adminBulkUserImport",
      name: "Bulk Student & Faculty CSV Import Tool Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Uploading CSV rosters for automatic user account creation and password generation",
      message: "CSV Import tool is under maintenance.",
      updatedAt: "Just now",
    },
    adminBatches: {
      key: "adminBatches",
      name: "College Batches & Academic Year Setup Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Creating academic cohorts (2025, 2026, 2027), assigning departments and capacity limits",
      message: "Batches setup portal is updating.",
      updatedAt: "Just now",
    },
    adminDepartments: {
      key: "adminDepartments",
      name: "Academic Streams & Department Structure Manager Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Managing college engineering streams (CS, IT, AIML, DS, EXTC) and HOD assignments",
      message: "Departments manager is under maintenance.",
      updatedAt: "Just now",
    },
    adminAttendance: {
      key: "adminAttendance",
      name: "Institutional Attendance CSV Register Upload Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Bulk uploading college attendance registers and biometrics sync",
      message: "Attendance register upload is under maintenance.",
      updatedAt: "Just now",
    },
    adminLearningContent: {
      key: "adminLearningContent",
      name: "Institutional Study Material Repository Setup Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Managing college-wide syllabus materials, course outlines, and shared assets",
      message: "Syllabus repository is updating.",
      updatedAt: "Just now",
    },
    adminQuizzes: {
      key: "adminQuizzes",
      name: "College Quiz & Assessment Test Authoring Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Authoring college-level examinations, setting question banks, time limits, and pass marks",
      message: "Test authoring tool is under maintenance.",
      updatedAt: "Just now",
    },
    adminPracticeProblems: {
      key: "adminPracticeProblems",
      name: "Coding Practice Problem Authoring Tool Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Adding custom DSA coding challenges, test cases, sample inputs/outputs, and solution hints",
      message: "Problem authoring tool is updating.",
      updatedAt: "Just now",
    },
    adminBroadcast: {
      key: "adminBroadcast",
      name: "College-Wide Announcement Broadcast System Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Publishing official institutional notices, exam schedules, and holiday broadcasts",
      message: "Broadcast system is under maintenance.",
      updatedAt: "Just now",
    },
    adminProgress: {
      key: "adminProgress",
      name: "Institutional Performance & Benchmark Analytics Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Department performance comparisons, placement readiness scores, and audit summaries",
      message: "Institutional analytics is updating.",
      updatedAt: "Just now",
    },
    adminDefaulters: {
      key: "adminDefaulters",
      name: "College-Wide Defaulter Audit Portal Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Institutional audit of defaulter lists across all departments and remediation tracking",
      message: "College defaulters audit is under maintenance.",
      updatedAt: "Just now",
    },
    adminMockDrives: {
      key: "adminMockDrives",
      name: "College Placement Drive & Company Setup Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Configuring campus recruitment drives, company eligibility criteria, and interview dates",
      message: "College placement setup is updating.",
      updatedAt: "Just now",
    },
    adminC2CEnrollments: {
      key: "adminC2CEnrollments",
      name: "Campus-to-Corporate (C2C) Institutional Program Management Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Managing C2C student enrollment rosters, partner company training modules, and batch locks",
      message: "C2C program manager is under maintenance.",
      updatedAt: "Just now",
    },
    adminApproveUsers: {
      key: "adminApproveUsers",
      name: "Pending Account Registration Approval Queue Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Reviewing and approving newly registered student and mentor accounts before granting platform login",
      message: "Registration approval queue is updating.",
      updatedAt: "Just now",
    },
    adminHelp: {
      key: "adminHelp",
      name: "College Admin Support & Ticket Center Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Submitting high-priority institutional tickets to platform operations",
      message: "Admin support center is under maintenance.",
      updatedAt: "Just now",
    },
    adminProfile: {
      key: "adminProfile",
      name: "College Admin Profile & Institutional Logo/Branding Settings Tab",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "College administrator profile, institutional branding, logo upload, and contact info",
      message: "College admin profile is updating.",
      updatedAt: "Just now",
    },
    adminUserLocking: {
      key: "adminUserLocking",
      name: "User Account Lock, Temporary Suspension & Unlock Switch",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Instantly locking compromised or suspended student/mentor accounts across the college",
      message: "User lock control is under maintenance.",
      updatedAt: "Just now",
    },
    adminRoleEscalation: {
      key: "adminRoleEscalation",
      name: "Local Role Escalation & Demotion (Student ↔ Mentor ↔ Coordinator)",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Promoting faculty to Coordinator or demoting user roles within the institutional domain",
      message: "Role escalation manager is updating.",
      updatedAt: "Just now",
    },
    adminPasswordResetLink: {
      key: "adminPasswordResetLink",
      name: "Manual Password Reset Link Dispatcher for Users",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Triggering automated password reset emails for students or faculty with forgotten passwords",
      message: "Password reset dispatcher is under maintenance.",
      updatedAt: "Just now",
    },
    adminCollegeBranding: {
      key: "adminCollegeBranding",
      name: "Institutional Logo, Banner & Theme Color Customizer",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Uploading college logos, header banners, and customizing portal accent themes",
      message: "Branding customizer is updating.",
      updatedAt: "Just now",
    },
    adminAttendanceThreshold: {
      key: "adminAttendanceThreshold",
      name: "Defaulter Attendance Percentage Threshold Setter",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Configuring mandatory minimum attendance percentage (e.g., 75%) for defaulter auto-flagging",
      message: "Attendance threshold tool is under maintenance.",
      updatedAt: "Just now",
    },
    adminSystemBackupExport: {
      key: "adminSystemBackupExport",
      name: "College User Data & Academic Records Backup Exporter",
      category: "College Admin",
      active: true,
      role: "College Admin",
      description: "Exporting full institutional backups of student grades, attendance logs, and user credentials",
      message: "Data backup exporter is under maintenance.",
      updatedAt: "Just now",
    },
  },
};

const SystemMaintenanceContext = createContext(null);

export function SystemMaintenanceProvider({ children }) {
  // Always load from initialMaintenanceConfig merged with sessionStorage
  const loadStoredConfig = () => {
    try {
      const saved = sessionStorage.getItem("system_maintenance_config_v2");
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

  // Sync with SessionStorage & Backend Database
  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    try {
      sessionStorage.setItem("system_maintenance_config_v2", JSON.stringify(newConfig));
    } catch (e) {}

    const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken') || '';
    fetch(`${getApiBaseUrl()}/shared-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        type: 'maintenance',
        title: 'System Maintenance Configuration',
        data: newConfig,
        status: 'Active'
      })
    }).catch(err => console.warn('Failed to sync maintenance config to backend:', err));
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken') || '';
    if (!token) return;
    // Fetch maintenance config directly from MySQL Database
    fetch(`${getApiBaseUrl()}/shared-content?type=maintenance`, {
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
                sessionStorage.setItem("system_maintenance_config_v2", JSON.stringify(updated));
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
