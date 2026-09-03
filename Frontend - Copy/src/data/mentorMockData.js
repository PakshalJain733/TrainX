export const mentorProfile = {
  name: "Dr. Vikram Seth",
  email: "v.seth@campustraining.edu.in",
  role: "Senior Mentor & Industry Trainer",
  specialization: "AI, Machine Learning & Data Systems",
  department: "Computer Science & AI",
  experience: "8+ Years",
  rating: 4.9,
  allocatedBatchesCount: 3,
  totalStudentsAssigned: 345,
  pendingEvaluationsCount: 14,
  upcomingSessionsCount: 4,
};

export const mentorBatches = [
  {
    id: 1,
    name: "CSE 2026 Alpha Cohort",
    code: "CSE-2026-A",
    college: "Apex Institute of Technology",
    department: "Computer Science",
    enrolledStudents: 120,
    progress: 78,
    schedule: "Mon, Wed, Fri (10:00 AM - 12:00 PM)",
    nextSession: "Tomorrow at 10:00 AM",
    status: "Active",
    topicsCovered: 14,
    totalTopics: 18,
  },
  {
    id: 2,
    name: "Data Science & ML 2025",
    code: "DSML-2025-B",
    college: "Vanguard Academy of Science",
    department: "AI & Data Science",
    enrolledStudents: 110,
    progress: 91,
    schedule: "Tue, Thu (02:00 PM - 04:00 PM)",
    nextSession: "Today at 02:00 PM",
    status: "Near Completion",
    topicsCovered: 16,
    totalTopics: 18,
  },
  {
    id: 3,
    name: "Fullstack React & Node Specialization",
    code: "FS-WEB-04",
    college: "Meridian Engineering College",
    department: "Information Technology",
    enrolledStudents: 115,
    progress: 62,
    schedule: "Mon, Thu (04:00 PM - 06:00 PM)",
    nextSession: "Thu at 04:00 PM",
    status: "Active",
    topicsCovered: 11,
    totalTopics: 18,
  },
];

export const mentorStudents = [
  {
    id: 1,
    name: "Aarav Mehta",
    rollNo: "CSE26-042",
    college: "Apex Institute",
    batch: "CSE 2026 Alpha Cohort",
    attendance: "94%",
    avgScore: "88%",
    riskStatus: "Good",
    lastActive: "10 mins ago",
  },
  {
    id: 2,
    name: "Neha Reddy",
    rollNo: "DS25-018",
    college: "Vanguard Academy",
    batch: "Data Science & ML 2025",
    attendance: "72%",
    avgScore: "58%",
    riskStatus: "High Risk",
    lastActive: "2 days ago",
  },
  {
    id: 3,
    name: "Karan Singh",
    rollNo: "FS04-089",
    college: "Meridian College",
    batch: "Fullstack React & Node",
    attendance: "85%",
    avgScore: "76%",
    riskStatus: "Moderate",
    lastActive: "1 hour ago",
  },
  {
    id: 4,
    name: "Ananya Sharma",
    rollNo: "CSE26-009",
    college: "Apex Institute",
    batch: "CSE 2026 Alpha Cohort",
    attendance: "98%",
    avgScore: "94%",
    riskStatus: "Top Performer",
    lastActive: "Just now",
  },
];

export const mentorAssignments = [
  {
    id: 1,
    title: "Graph Algorithms & Shortest Path Implementation",
    batch: "CSE 2026 Alpha Cohort",
    dueDate: "2026-09-02",
    totalSubmitted: 108,
    totalStudents: 120,
    evaluated: 94,
    status: "Grading in Progress",
  },
  {
    id: 2,
    title: "Build a Custom LLM Fine-Tuning Pipeline",
    batch: "Data Science & ML 2025",
    dueDate: "2026-08-28",
    totalSubmitted: 110,
    totalStudents: 110,
    evaluated: 110,
    status: "Completed",
  },
  {
    id: 3,
    title: "Fullstack Authentication & JWT Authorization API",
    batch: "Fullstack React & Node Specialization",
    dueDate: "2026-09-05",
    totalSubmitted: 45,
    totalStudents: 115,
    evaluated: 20,
    status: "Active Submissions",
  },
];

export const mentorLiveSessions = [
  {
    id: 1,
    title: "Advanced PyTorch & Neural Network Optimization",
    batch: "Data Science & ML 2025",
    time: "Today, 02:00 PM - 04:00 PM",
    attendees: 105,
    link: "https://meet.google.com/xyz-abcd-efg",
    status: "Live Soon",
  },
  {
    id: 2,
    title: "System Design: Scaling Microservices & Redis Caching",
    batch: "CSE 2026 Alpha Cohort",
    time: "Tomorrow, 10:00 AM - 12:00 PM",
    attendees: 118,
    link: "https://meet.google.com/abc-defg-hij",
    status: "Scheduled",
  },
];

export const mentorStudentDoubts = [
  {
    id: 1,
    student: "Aarav Mehta",
    batch: "CSE 2026 Alpha",
    topic: "Dijkstra Algorithm Memory Leak",
    time: "15 mins ago",
    status: "Unresolved",
  },
  {
    id: 2,
    student: "Neha Reddy",
    batch: "Data Science 2025",
    topic: "Overfitting in Gradient Boosting Trees",
    time: "1 hour ago",
    status: "In Discussion",
  },
];

export const mentorWeeklyReports = [
  {
    id: 1,
    title: "Week 34 Batch Progress & Performance Report",
    batch: "All Allocated Batches",
    submittedAt: "2026-08-28",
    status: "Approved by Super Admin",
  },
  {
    id: 2,
    title: "Week 33 Mid-Term Learning Outcome Audit",
    batch: "Data Science & ML 2025",
    submittedAt: "2026-08-21",
    status: "Archived",
  },
];

export const mentorSkillGaps = [
  { id: 1, topic: "Graph Theory & Dynamic Programming", batch: "CSE 2026 Alpha Cohort", deficiencyRate: "34%", avgScore: "62%", priority: "High" },
  { id: 2, topic: "High-Scale SQL Query Indexing & Tuning", batch: "Data Science & ML 2025", deficiencyRate: "28%", avgScore: "68%", priority: "Medium" },
  { id: 3, topic: "Docker Containerization & Kubernetes Ingress", batch: "Fullstack React & Node", deficiencyRate: "42%", avgScore: "54%", priority: "High" },
  { id: 4, topic: "React State Management (Redux/Zustand)", batch: "Fullstack React & Node", deficiencyRate: "18%", avgScore: "82%", priority: "Low" },
];

export const mentorLeaderboard = [
  { rank: 1, name: "Ananya Sharma", batch: "CSE 2026 Alpha", points: 2850, solved: 142, streak: "18 Days", badge: "Diamond Coder" },
  { rank: 2, name: "Aarav Mehta", batch: "CSE 2026 Alpha", points: 2620, solved: 128, streak: "12 Days", badge: "Gold Master" },
  { rank: 3, name: "Priya Roy", batch: "Data Science & ML 2025", points: 2490, solved: 119, streak: "14 Days", badge: "Gold Master" },
  { rank: 4, name: "Karan Singh", batch: "Fullstack React & Node", points: 2150, solved: 98, streak: "8 Days", badge: "Silver Specialist" },
];

export const mentorMockDrives = [
  { id: 1, title: "Google & Microsoft Partner Placement Assessment", date: "2026-09-15", registered: 185, passCutoff: "80%", status: "Upcoming" },
  { id: 2, title: "FinTech Coding Assessment (Goldman Sachs)", date: "2026-09-02", registered: 142, passCutoff: "75%", status: "Active Today" },
  { id: 3, title: "Cloud Systems Hackathon (AWS Network)", date: "2026-08-20", registered: 110, passCutoff: "70%", status: "Completed" },
];

export const mentorDefaulters = [
  { id: 1, name: "Neha Reddy", rollNo: "DS25-018", batch: "Data Science & ML 2025", attendance: "72%", missedAssignments: 3, lastTestScore: "48%", reason: "Critical Attendance & Test Dip", risk: "High Risk" },
  { id: 2, name: "Rohan Verma", rollNo: "CSE26-099", batch: "CSE 2026 Alpha Cohort", attendance: "68%", missedAssignments: 4, lastTestScore: "42%", reason: "Inactivity > 5 Days", risk: "High Risk" },
  { id: 3, name: "Karan Singh", rollNo: "FS04-089", batch: "Fullstack React & Node", attendance: "78%", missedAssignments: 2, lastTestScore: "59%", reason: "Missing assignment deadlines", risk: "Moderate Risk" },
];

export const mentorStudyMaterial = [
  { id: 1, title: "Advanced Graph Algorithms & Memory Optimization Cheatsheet", batch: "CSE 2026 Alpha", category: "PDF Notes", date: "2026-08-26", downloads: 114 },
  { id: 2, title: "PyTorch Deep Learning & Tensor Operations Masterclass Slides", batch: "Data Science 2025", category: "Lecture Deck", date: "2026-08-22", downloads: 98 },
  { id: 3, title: "Fullstack JWT Auth & Security Boilerplate Repository", batch: "Fullstack Web", category: "Code Repo", date: "2026-08-18", downloads: 105 },
];
