export const coordinatorProfile = {
  name: "Harshad Nandurkar",
  email: "harshadnandurkar851@gmail.com",
  role: "Department Coordinator",
  department: "Electronics & Computer Science",
  college: "Apex Institute of Technology",
  phone: "+91 77109 07045",
  joinDate: "Jan 2024",
  totalStudents: 420,
  activeBatchesCount: 4,
  assignedMentorsCount: 8,
  overallAttendanceRate: 92.4,
  placementReadinessScore: 84.8,
  pendingRequestsCount: 6,
};

export const coordinatorStats = [
  { id: "students", label: "Total Students", value: "420", subtext: "Across 4 active batches", trend: "+12 this month", color: "indigo" },
  { id: "batches", label: "Active Batches", value: "4", subtext: "CSE, IT & AI-DS tracks", trend: "100% on schedule", color: "blue" },
  { id: "mentors", label: "Assigned Trainers", value: "8", subtext: "Industry specialists", trend: "4.9 avg rating", color: "emerald" },
  { id: "attendance", label: "Avg Attendance", value: "92.4%", subtext: "14 students flagged <75%", trend: "+1.8% vs last week", color: "purple" },
];

export const coordinatorBatches = [
  {
    id: 1,
    name: "CSE 2026 Alpha Cohort",
    code: "CSE-2026-A",
    college: "Apex Institute of Technology",
    department: "Computer Science & Engineering",
    enrolledStudents: 120,
    progress: 78,
    schedule: "Mon, Wed, Fri (10:00 AM - 12:00 PM)",
    nextSession: "Tomorrow at 10:00 AM",
    mentor: "Rohan Sharma",
    status: "Active",
    avgAttendance: 94.2,
    avgQuizScore: 86.5,
    topPerformer: "Ananya Sharma",
    defaultersCount: 2,
  },
  {
    id: 2,
    name: "Fullstack React & Node Specialization",
    code: "FS-WEB-04",
    college: "Apex Institute of Technology",
    department: "Computer Science & Engineering",
    enrolledStudents: 105,
    progress: 62,
    schedule: "Mon, Thu (04:00 PM - 06:00 PM)",
    nextSession: "Thu at 04:00 PM",
    mentor: "Ananya Gupta",
    status: "Active",
    avgAttendance: 89.4,
    avgQuizScore: 78.2,
    topPerformer: "Karan Singh",
    defaultersCount: 5,
  },
  {
    id: 3,
    name: "Data Science & ML 2025",
    code: "DSML-2025-B",
    college: "Apex Institute of Technology",
    department: "AI & Data Science",
    enrolledStudents: 110,
    progress: 91,
    schedule: "Tue, Thu (02:00 PM - 04:00 PM)",
    nextSession: "Today at 02:00 PM",
    mentor: "Dr. Vikram Seth",
    status: "Near Completion",
    avgAttendance: 95.1,
    avgQuizScore: 91.0,
    topPerformer: "Priya Roy",
    defaultersCount: 1,
  },
  {
    id: 4,
    name: "Cloud Native & DevOps Infrastructure",
    code: "CLOUD-DO-02",
    college: "Apex Institute of Technology",
    department: "Information Technology",
    enrolledStudents: 85,
    progress: 45,
    schedule: "Tue, Fri (09:00 AM - 11:00 AM)",
    nextSession: "Friday at 09:00 AM",
    mentor: "Siddharth Roy",
    status: "Active",
    avgAttendance: 85.8,
    avgQuizScore: 72.4,
    topPerformer: "Rohan Deshmukh",
    defaultersCount: 6,
  },
];

export const coordinatorStudents = [
  {
    id: 1,
    name: "Ananya Sharma",
    rollNo: "CSE26-009",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    attendance: 98,
    avgScore: 94,
    interviewScore: 92,
    selectedGoal: "fullstack",
    selectedGoalName: "Full Stack Engineer",
    placementStatus: "Placed (TCS Digital - 12 LPA)",
    riskStatus: "Top Performer",
    email: "ananya.s@apex.edu.in",
    phone: "+91 98111 22334",
  },
  {
    id: 2,
    name: "Aarav Mehta",
    rollNo: "CSE26-042",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    attendance: 94,
    avgScore: 88,
    interviewScore: 85,
    selectedGoal: "python-backend",
    selectedGoalName: "Python Backend Developer",
    placementStatus: "Eligible & Shortlisted",
    riskStatus: "Good",
    email: "aarav.m@apex.edu.in",
    phone: "+91 98222 33445",
  },
  {
    id: 3,
    name: "Priya Roy",
    rollNo: "DS25-012",
    batch: "Data Science & ML 2025",
    department: "AI & DS",
    attendance: 96,
    avgScore: 92,
    interviewScore: 90,
    selectedGoal: "data-ai",
    selectedGoalName: "Data Science & AI Engineer",
    placementStatus: "Placed (Fractal AI - 14 LPA)",
    riskStatus: "Top Performer",
    email: "priya.r@apex.edu.in",
    phone: "+91 98333 44556",
  },
  {
    id: 4,
    name: "Karan Singh",
    rollNo: "FS04-089",
    batch: "Fullstack React & Node",
    department: "CSE",
    attendance: 85,
    avgScore: 76,
    interviewScore: 74,
    selectedGoal: "react-frontend",
    selectedGoalName: "React Frontend Developer",
    placementStatus: "Eligible for Drives",
    riskStatus: "Moderate",
    email: "karan.s@apex.edu.in",
    phone: "+91 98444 55667",
  },
  {
    id: 5,
    name: "Neha Reddy",
    rollNo: "DS25-018",
    batch: "Data Science & ML 2025",
    department: "AI & DS",
    attendance: 72,
    avgScore: 58,
    interviewScore: 54,
    selectedGoal: "data-ai",
    selectedGoalName: "Data Science & AI Engineer",
    placementStatus: "Needs Improvement",
    riskStatus: "High Risk",
    email: "neha.r@apex.edu.in",
    phone: "+91 98555 66778",
  },
  {
    id: 6,
    name: "Rohan Verma",
    rollNo: "CSE26-099",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    attendance: 68,
    avgScore: 52,
    interviewScore: 48,
    selectedGoal: "python-backend",
    selectedGoalName: "Python Backend Developer",
    placementStatus: "Not Eligible (Attendance < 75%)",
    riskStatus: "High Risk",
    email: "rohan.v@apex.edu.in",
    phone: "+91 98666 77889",
  },
  {
    id: 7,
    name: "Siddharth Nair",
    rollNo: "CLOUD-034",
    batch: "Cloud Native & DevOps Infrastructure",
    department: "IT",
    attendance: 82,
    avgScore: 79,
    interviewScore: 80,
    selectedGoal: "cloud-devops",
    selectedGoalName: "Cloud & DevOps Specialist",
    placementStatus: "Eligible for Drives",
    riskStatus: "Good",
    email: "siddharth.n@apex.edu.in",
    phone: "+91 98777 88990",
  },
  {
    id: 8,
    name: "Ishita Deshmukh",
    rollNo: "FS04-022",
    batch: "Fullstack React & Node",
    department: "CSE",
    attendance: 91,
    avgScore: 84,
    interviewScore: 82,
    selectedGoal: "react-frontend",
    selectedGoalName: "React Frontend Developer",
    placementStatus: "Eligible & Shortlisted",
    riskStatus: "Good",
    email: "ishita.d@apex.edu.in",
    phone: "+91 98888 99001",
  },
];

export const coordinatorMentors = [
  {
    id: 1,
    name: "Dr. Vikram Seth",
    email: "v.seth@campustraining.edu.in",
    specialization: "AI, ML & PyTorch Architecture",
    assignedBatch: "Data Science & ML 2025",
    studentsCount: 110,
    rating: 4.9,
    experience: "8+ Years",
    status: "Active",
    phone: "+91 97111 22334",
  },
  {
    id: 2,
    name: "Rohan Sharma",
    email: "r.sharma@campustraining.edu.in",
    specialization: "Data Structures & Advanced Algorithms",
    assignedBatch: "CSE 2026 Alpha Cohort",
    studentsCount: 120,
    rating: 4.8,
    experience: "6 Years",
    status: "Active",
    phone: "+91 97222 33445",
  },
  {
    id: 3,
    name: "Ananya Gupta",
    email: "a.gupta@campustraining.edu.in",
    specialization: "Fullstack MERN & System Design",
    assignedBatch: "Fullstack React & Node Specialization",
    studentsCount: 105,
    rating: 4.9,
    experience: "7 Years",
    status: "Active",
    phone: "+91 97333 44556",
  },
  {
    id: 4,
    name: "Siddharth Roy",
    email: "s.roy@campustraining.edu.in",
    specialization: "AWS Cloud, Kubernetes & DevOps",
    assignedBatch: "Cloud Native & DevOps Infrastructure",
    studentsCount: 85,
    rating: 4.7,
    experience: "5 Years",
    status: "Active",
    phone: "+91 97444 55667",
  },
  {
    id: 5,
    name: "Rais Mulla",
    email: "r.mulla@campustraining.edu.in",
    specialization: "CS HOD",
    assignedBatch: "Computer Science & Engineering",
    studentsCount: 150,
    rating: 5.0,
    experience: "15+ Years",
    status: "Active",
    phone: "+91 98999 11223",
  },
  {
    id: 6,
    name: "Anagha Dhavlikar",
    email: "a.dhavlikar@campustraining.edu.in",
    specialization: "ECS HOD",
    assignedBatch: "Electronics & Computer Science",
    studentsCount: 140,
    rating: 5.0,
    experience: "14+ Years",
    status: "Active",
    phone: "+91 98999 44556",
  },
];

export const coordinatorSchedules = [
  {
    id: 1,
    title: "Advanced Graph Algorithms & Shortest Path",
    batch: "CSE 2026 Alpha Cohort",
    trainer: "Rohan Sharma",
    time: "Today, 10:00 AM - 12:00 PM",
    room: "Lab 402 / Meet",
    meetLink: "https://meet.google.com/xyz-abcd-efg",
    status: "Live Now",
    attendees: 114,
  },
  {
    id: 2,
    title: "PyTorch Neural Nets & Hyperparameter Tuning",
    batch: "Data Science & ML 2025",
    trainer: "Dr. Vikram Seth",
    time: "Today, 02:00 PM - 04:00 PM",
    room: "Seminar Hall 2 / Meet",
    meetLink: "https://meet.google.com/dsml-live-meet",
    status: "Upcoming",
    attendees: 110,
  },
  {
    id: 3,
    title: "Microservices Architecture & JWT Auth",
    batch: "Fullstack React & Node",
    trainer: "Ananya Gupta",
    time: "Tomorrow, 04:00 PM - 06:00 PM",
    room: "Lab 301 / Zoom",
    meetLink: "https://meet.google.com/fs-web-live",
    status: "Scheduled",
    attendees: 105,
  },
  {
    id: 4,
    title: "Kubernetes Cluster Config & Helm Charts",
    batch: "Cloud Native & DevOps",
    trainer: "Siddharth Roy",
    time: "Friday, 09:00 AM - 11:00 AM",
    room: "Cloud Innovation Lab",
    meetLink: "https://meet.google.com/cloud-devops-live",
    status: "Scheduled",
    attendees: 85,
  },
];

export const coordinatorAssessments = [
  {
    id: 1,
    title: "Data Structures & Graph Theory Mid-Term Quiz",
    batch: "CSE 2026 Alpha Cohort",
    type: "MCQ & Coding",
    dueDate: "2026-09-05",
    submissions: "112 / 120",
    avgScore: "84%",
    passRate: "92%",
    status: "Active",
  },
  {
    id: 2,
    title: "Generative AI & Fine-Tuning LLMs Assessment",
    batch: "Data Science & ML 2025",
    type: "Project & Quiz",
    dueDate: "2026-08-30",
    submissions: "110 / 110",
    avgScore: "91%",
    passRate: "98%",
    status: "Completed",
  },
  {
    id: 3,
    title: "Fullstack Authentication & Redis Caching Exam",
    batch: "Fullstack React & Node",
    type: "Coding Assessment",
    dueDate: "2026-09-08",
    submissions: "45 / 105",
    avgScore: "76%",
    passRate: "81%",
    status: "In Progress",
  },
  {
    id: 4,
    title: "Docker Containerization & Kubernetes Challenge",
    batch: "Cloud Native & DevOps",
    type: "Hands-on Lab",
    dueDate: "2026-09-12",
    submissions: "12 / 85",
    avgScore: "--",
    passRate: "--",
    status: "Scheduled",
  },
];

export const coordinatorRequests = [
  {
    id: 1,
    studentName: "Neha Reddy",
    rollNo: "DS25-018",
    batch: "Data Science & ML 2025",
    requestType: "Leave Application",
    reason: "Medical Emergency (Doctor certificate attached)",
    requestedOn: "2026-09-01",
    status: "Pending",
  },
  {
    id: 2,
    studentName: "Rohan Verma",
    rollNo: "CSE26-099",
    batch: "CSE 2026 Alpha Cohort",
    requestType: "Re-assessment Permission",
    reason: "Missed Quiz #3 due to fever",
    requestedOn: "2026-08-31",
    status: "Pending",
  },
  {
    id: 3,
    studentName: "Karan Singh",
    rollNo: "FS04-089",
    batch: "Fullstack React & Node",
    requestType: "Batch Transfer Request",
    reason: "Clash with internship hours; request evening slot",
    requestedOn: "2026-08-30",
    status: "Pending",
  },
  {
    id: 4,
    studentName: "Aarav Mehta",
    rollNo: "CSE26-042",
    batch: "CSE 2026 Alpha Cohort",
    requestType: "Certificate Approval",
    reason: "Completed AWS Certified Cloud Practitioner",
    requestedOn: "2026-08-28",
    status: "Approved",
  },
];

export const coordinatorPlacementDrives = [
  {
    id: 1,
    company: "Google & Microsoft Partner Placement Drive",
    role: "Associate Software Engineer / SDE-1",
    targetBatches: "CSE 2026 & DS 2025",
    driveDate: "2026-09-15",
    registeredCount: 185,
    eligibleCount: 198,
    cutoffScore: "80%",
    status: "Upcoming",
  },
  {
    id: 2,
    company: "Goldman Sachs FinTech Hackathon & Hiring",
    role: "Financial Technology Specialist",
    targetBatches: "CSE 2026 & Fullstack Web",
    driveDate: "2026-09-02",
    registeredCount: 142,
    eligibleCount: 160,
    cutoffScore: "75%",
    status: "Active Today",
  },
  {
    id: 3,
    company: "TCS Digital & Innovator Hiring Drive",
    role: "Digital Systems Developer",
    targetBatches: "All 2025 & 2026 Batches",
    driveDate: "2026-08-20",
    registeredCount: 210,
    eligibleCount: 220,
    cutoffScore: "70%",
    status: "Completed (24 Placed)",
  },
];

export const coordinatorWeeklyReports = [
  {
    id: 1,
    title: "Week 35 Department Progress & Attendance Audit",
    batch: "All Managed Batches",
    date: "2026-09-01",
    status: "Submitted & Approved",
    fileSize: "1.8 MB",
  },
  {
    id: 2,
    title: "Week 34 Defaulter Remediation & Counseling Log",
    batch: "CSE 2026 Alpha & DSML 2025",
    date: "2026-08-25",
    status: "Archived",
    fileSize: "2.1 MB",
  },
  {
    id: 3,
    title: "Monthly Industry Mentor Feedback & Learning Rating",
    batch: "All Managed Batches",
    date: "2026-08-18",
    status: "Archived",
    fileSize: "1.4 MB",
  },
];

export const coordinatorQuizActivityLogs = [
  { id: 1, studentName: "Ananya Sharma", rollNo: "CSE26-009", batch: "CSE 2026 Alpha Cohort", quizTitle: "Data Structures & Graph Theory Mid-Term Quiz", score: "96%", timeSpent: "24 mins", status: "Passed", submittedAt: "10 mins ago" },
  { id: 2, studentName: "Aarav Mehta", rollNo: "CSE26-042", batch: "CSE 2026 Alpha Cohort", quizTitle: "Data Structures & Graph Theory Mid-Term Quiz", score: "88%", timeSpent: "28 mins", status: "Passed", submittedAt: "25 mins ago" },
  { id: 3, studentName: "Priya Roy", rollNo: "DS25-012", batch: "Data Science & ML 2025", quizTitle: "Generative AI & Fine-Tuning LLMs Assessment", score: "94%", timeSpent: "32 mins", status: "Passed", submittedAt: "1 hour ago" },
  { id: 4, studentName: "Karan Singh", rollNo: "FS04-089", batch: "Fullstack React & Node", quizTitle: "Fullstack Authentication & Redis Caching Exam", score: "72%", timeSpent: "35 mins", status: "Passed", submittedAt: "2 hours ago" },
  { id: 5, studentName: "Neha Reddy", rollNo: "DS25-018", batch: "Data Science & ML 2025", quizTitle: "Generative AI & Fine-Tuning LLMs Assessment", score: "54%", timeSpent: "40 mins", status: "Needs Retake", submittedAt: "3 hours ago" },
  { id: 6, studentName: "Rohan Verma", rollNo: "CSE26-099", batch: "CSE 2026 Alpha Cohort", quizTitle: "Data Structures & Graph Theory Mid-Term Quiz", score: "48%", timeSpent: "42 mins", status: "Needs Retake", submittedAt: "4 hours ago" },
];

export const coordinatorDetailedQuizScorecards = {
  1: {
    quizTitle: "Data Structures & Graph Theory Mid-Term Quiz",
    batch: "CSE 2026 Alpha Cohort",
    totalEnrolled: 120,
    attempted: 112,
    passedCount: 103,
    avgScore: "84%",
    highestScore: "98%",
    lowestScore: "42%",
    questionAnalytics: [
      { qNo: 1, text: "Dijkstra's Shortest Path Complexity with Binary Heap", topic: "Graph Theory", correctPct: "88%", difficulty: "Medium" },
      { qNo: 2, text: "Detecting Cycles in Directed Graph using Kahn's Algorithm", topic: "Topological Sort", correctPct: "64%", difficulty: "Hard" },
      { qNo: 3, text: "Time complexity of Union-Find with Path Compression", topic: "Disjoint Set Union", correctPct: "92%", difficulty: "Easy" },
      { qNo: 4, text: "Dynamic Programming Memoization vs Tabulation Memory Trade-off", topic: "Dynamic Programming", correctPct: "71%", difficulty: "Medium" },
    ],
    studentSubmissions: [
      { id: 1, name: "Ananya Sharma", rollNo: "CSE26-009", score: 96, status: "Passed", timeSpent: "24m", attemptedAt: "2026-09-02 10:15", correctCount: "19/20" },
      { id: 2, name: "Aarav Mehta", rollNo: "CSE26-042", score: 88, status: "Passed", timeSpent: "28m", attemptedAt: "2026-09-02 10:00", correctCount: "17/20" },
      { id: 3, name: "Karan Singh", rollNo: "FS04-089", score: 76, status: "Passed", timeSpent: "35m", attemptedAt: "2026-09-02 09:30", correctCount: "15/20" },
      { id: 4, name: "Rohan Verma", rollNo: "CSE26-099", score: 48, status: "Needs Retake", timeSpent: "42m", attemptedAt: "2026-09-02 08:45", correctCount: "9/20" },
    ]
  },
  2: {
    quizTitle: "Generative AI & Fine-Tuning LLMs Assessment",
    batch: "Data Science & ML 2025",
    totalEnrolled: 110,
    attempted: 110,
    passedCount: 108,
    avgScore: "91%",
    highestScore: "100%",
    lowestScore: "54%",
    questionAnalytics: [
      { qNo: 1, text: "LoRA & QLoRA Parameter Efficient Fine-Tuning Memory Savings", topic: "PEFT Architecture", correctPct: "95%", difficulty: "Medium" },
      { qNo: 2, text: "Self-Attention Query Key Value Matrix Dimensions in Transformers", topic: "Transformer Attention", correctPct: "89%", difficulty: "Medium" },
      { qNo: 3, text: "RLHF PPO Reward Model Calibration", topic: "RLHF", correctPct: "78%", difficulty: "Hard" },
    ],
    studentSubmissions: [
      { id: 1, name: "Priya Roy", rollNo: "DS25-012", score: 98, status: "Passed", timeSpent: "30m", attemptedAt: "2026-08-30 14:20", correctCount: "24/25" },
      { id: 2, name: "Neha Reddy", rollNo: "DS25-018", score: 54, status: "Needs Retake", timeSpent: "40m", attemptedAt: "2026-08-30 15:10", correctCount: "13/25" },
    ]
  }
};

export const coordinatorCodingPerformance = [
  {
    id: 1,
    studentName: "Ananya Sharma",
    rollNo: "CSE26-009",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    totalSolved: 248,
    easySolved: 110,
    mediumSolved: 102,
    hardSolved: 36,
    accuracyRate: 94.5,
    totalSubmissions: 310,
    streakDays: 42,
    primaryLanguage: "C++",
    leaderboardRank: 1,
    status: "Top Performer",
    lastActive: "Today at 09:30 AM",
    topics: { "Data Structures": 96, "Dynamic Programming": 92, "Graphs": 90, "Algorithms": 95, "SQL": 88 },
    recentSubmissions: [
      { id: "s1", problem: "LRU Cache Implementation", difficulty: "Hard", language: "C++", status: "Accepted", time: "12ms", memory: "24.2MB", submittedAt: "2 hours ago" },
      { id: "s2", problem: "Word Ladder II", difficulty: "Hard", language: "C++", status: "Accepted", time: "45ms", memory: "18.6MB", submittedAt: "Yesterday" },
      { id: "s3", problem: "Serialize and Deserialize Binary Tree", difficulty: "Hard", language: "Python", status: "Accepted", time: "38ms", memory: "22.1MB", submittedAt: "2 days ago" }
    ]
  },
  {
    id: 2,
    studentName: "Aarav Mehta",
    rollNo: "CSE26-042",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    totalSolved: 195,
    easySolved: 90,
    mediumSolved: 85,
    hardSolved: 20,
    accuracyRate: 88.2,
    totalSubmissions: 260,
    streakDays: 18,
    primaryLanguage: "Python",
    leaderboardRank: 4,
    status: "Good",
    lastActive: "Today at 11:15 AM",
    topics: { "Data Structures": 90, "Dynamic Programming": 78, "Graphs": 84, "Algorithms": 86, "SQL": 92 },
    recentSubmissions: [
      { id: "s4", problem: "Binary Tree Zigzag Level Order Traversal", difficulty: "Medium", language: "Python", status: "Accepted", time: "18ms", memory: "16.4MB", submittedAt: "3 hours ago" },
      { id: "s5", problem: "Longest Increasing Subsequence", difficulty: "Medium", language: "Python", status: "Accepted", time: "52ms", memory: "15.9MB", submittedAt: "1 day ago" }
    ]
  },
  {
    id: 3,
    studentName: "Priya Roy",
    rollNo: "DS25-012",
    batch: "Data Science & ML 2025",
    department: "AI & DS",
    totalSolved: 220,
    easySolved: 100,
    mediumSolved: 95,
    hardSolved: 25,
    accuracyRate: 92.0,
    totalSubmissions: 275,
    streakDays: 31,
    primaryLanguage: "Python",
    leaderboardRank: 2,
    status: "Top Performer",
    lastActive: "Yesterday",
    topics: { "Data Structures": 88, "Dynamic Programming": 85, "Graphs": 82, "Algorithms": 90, "SQL": 98 },
    recentSubmissions: [
      { id: "s6", problem: "Kth Smallest Element in a BST", difficulty: "Medium", language: "Python", status: "Accepted", time: "22ms", memory: "19.0MB", submittedAt: "Yesterday" }
    ]
  },
  {
    id: 4,
    studentName: "Karan Singh",
    rollNo: "FS04-089",
    batch: "Fullstack React & Node",
    department: "CSE",
    totalSolved: 142,
    easySolved: 75,
    mediumSolved: 55,
    hardSolved: 12,
    accuracyRate: 76.4,
    totalSubmissions: 210,
    streakDays: 7,
    primaryLanguage: "JavaScript",
    leaderboardRank: 12,
    status: "Average",
    lastActive: "2 days ago",
    topics: { "Data Structures": 75, "Dynamic Programming": 62, "Graphs": 68, "Algorithms": 78, "SQL": 80 },
    recentSubmissions: [
      { id: "s7", problem: "Flatten Nested List Iterator", difficulty: "Medium", language: "JavaScript", status: "Time Limit Exceeded", time: "TLE", memory: "--", submittedAt: "2 days ago" },
      { id: "s8", problem: "Valid Parentheses", difficulty: "Easy", language: "JavaScript", status: "Accepted", time: "8ms", memory: "14.1MB", submittedAt: "3 days ago" }
    ]
  },
  {
    id: 5,
    studentName: "Neha Reddy",
    rollNo: "DS25-018",
    batch: "Data Science & ML 2025",
    department: "AI & DS",
    totalSolved: 78,
    easySolved: 50,
    mediumSolved: 24,
    hardSolved: 4,
    accuracyRate: 58.0,
    totalSubmissions: 165,
    streakDays: 0,
    primaryLanguage: "Python",
    leaderboardRank: 28,
    status: "Struggling",
    lastActive: "5 days ago",
    topics: { "Data Structures": 55, "Dynamic Programming": 42, "Graphs": 48, "Algorithms": 60, "SQL": 70 },
    recentSubmissions: [
      { id: "s9", problem: "Course Schedule II", difficulty: "Medium", language: "Python", status: "Wrong Answer", time: "--", memory: "--", submittedAt: "5 days ago" },
      { id: "s10", problem: "Two Sum", difficulty: "Easy", language: "Python", status: "Accepted", time: "30ms", memory: "15.2MB", submittedAt: "6 days ago" }
    ]
  },
  {
    id: 6,
    studentName: "Rohan Verma",
    rollNo: "CSE26-099",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    totalSolved: 62,
    easySolved: 45,
    mediumSolved: 15,
    hardSolved: 2,
    accuracyRate: 51.5,
    totalSubmissions: 140,
    streakDays: 0,
    primaryLanguage: "Java",
    leaderboardRank: 35,
    status: "Struggling",
    lastActive: "8 days ago",
    topics: { "Data Structures": 50, "Dynamic Programming": 35, "Graphs": 40, "Algorithms": 52, "SQL": 60 },
    recentSubmissions: [
      { id: "s11", problem: "Merge K Sorted Lists", difficulty: "Hard", language: "Java", status: "Runtime Error", time: "--", memory: "--", submittedAt: "8 days ago" }
    ]
  },
  {
    id: 7,
    studentName: "Siddharth Nair",
    rollNo: "CLOUD-034",
    batch: "Cloud Native & DevOps",
    department: "IT",
    totalSolved: 165,
    easySolved: 80,
    mediumSolved: 70,
    hardSolved: 15,
    accuracyRate: 82.5,
    totalSubmissions: 225,
    streakDays: 12,
    primaryLanguage: "Go",
    leaderboardRank: 8,
    status: "Good",
    lastActive: "Yesterday",
    topics: { "Data Structures": 82, "Dynamic Programming": 70, "Graphs": 75, "Algorithms": 84, "SQL": 85 },
    recentSubmissions: [
      { id: "s12", problem: "Container With Most Water", difficulty: "Medium", language: "Go", status: "Accepted", time: "16ms", memory: "17.4MB", submittedAt: "Yesterday" }
    ]
  },
  {
    id: 8,
    studentName: "Ishita Deshmukh",
    rollNo: "FS04-022",
    batch: "Fullstack React & Node",
    department: "CSE",
    totalSolved: 182,
    easySolved: 85,
    mediumSolved: 80,
    hardSolved: 17,
    accuracyRate: 86.0,
    totalSubmissions: 240,
    streakDays: 15,
    primaryLanguage: "JavaScript",
    leaderboardRank: 6,
    status: "Good",
    lastActive: "Today at 08:45 AM",
    topics: { "Data Structures": 85, "Dynamic Programming": 76, "Graphs": 80, "Algorithms": 88, "SQL": 90 },
    recentSubmissions: [
      { id: "s13", problem: "3Sum", difficulty: "Medium", language: "JavaScript", status: "Accepted", time: "34ms", memory: "18.1MB", submittedAt: "Today" }
    ]
  }
];

export const coordinatorInterviewRecords = [
  {
    id: 1,
    studentName: "Ananya Sharma",
    rollNo: "CSE26-009",
    department: "CSE",
    batch: "CSE 2026 Alpha Cohort",
    targetRole: "Full Stack Engineer",
    interviewType: "Technical Core & System Design",
    interviewer: "AI Evaluator v3.2",
    conductedDate: "06 Sep 2026",
    duration: "45 mins",
    questionsCount: 5,
    status: "Completed",
    techScore: 94,
    communicationScore: 92,
    problemSolvingScore: 96,
    confidenceScore: 90,
    overallScore: 92,
    grade: "Excellent",
    strengths: [
      "✓ Good understanding of DBMS and SQL query optimization",
      "✓ Clear explanation of OOP concepts & System Design principles",
      "✓ Exceptional DSA problem solving in C++"
    ],
    weaknesses: [
      "• Minor latency in explaining Redis cache invalidation edge cases",
      "• Could provide deeper real-world examples for microservices"
    ],
    recommendation: "Excellent technical foundation. Recommended to practice high-concurrency microservice architectures and attempt the Senior Fullstack mock drive.",
    nextTopics: ["System Design", "Redis Caching", "Microservices"],
    interviewHistory: [
      { attempt: "Attempt 1", date: "20 Aug 2026", score: "58%", status: "Needs Work" },
      { attempt: "Attempt 2", date: "28 Aug 2026", score: "84%", status: "Good" },
      { attempt: "Attempt 3", date: "06 Sep 2026", score: "92%", status: "Excellent" }
    ]
  },
  {
    id: 2,
    studentName: "Aarav Mehta",
    rollNo: "CSE26-042",
    department: "CSE",
    batch: "CSE 2026 Alpha Cohort",
    targetRole: "Python Backend Developer",
    interviewType: "Backend APIs & Data Structures",
    interviewer: "AI Evaluator v3.2",
    conductedDate: "04 Sep 2026",
    duration: "40 mins",
    questionsCount: 5,
    status: "Completed",
    techScore: 86,
    communicationScore: 84,
    problemSolvingScore: 85,
    confidenceScore: 88,
    overallScore: 85,
    grade: "Excellent",
    strengths: [
      "✓ Clean Python syntax & PEP8 adherence",
      "✓ Good REST API design intuition and database indexing clarity",
      "✓ Confident articulation during technical Q&A"
    ],
    weaknesses: [
      "• Edge cases in Directed Graph cycle detection algorithms",
      "• Answers occasionally lack practical deployment examples"
    ],
    recommendation: "Solid backend interview performance. Focus on Graph topological sorting edge cases and proceed to Advanced Backend mock evaluation.",
    nextTopics: ["Graph Algorithms", "Asyncio", "Docker & CI/CD"],
    interviewHistory: [
      { attempt: "Attempt 1", date: "15 Aug 2026", score: "62%", status: "Average" },
      { attempt: "Attempt 2", date: "25 Aug 2026", score: "74%", status: "Good" },
      { attempt: "Attempt 3", date: "04 Sep 2026", score: "85%", status: "Excellent" }
    ]
  },
  {
    id: 3,
    studentName: "Priya Roy",
    rollNo: "DS25-012",
    department: "AI & DS",
    batch: "Data Science & ML 2025",
    targetRole: "Data Science & AI Engineer",
    interviewType: "ML Models & PyTorch Math",
    interviewer: "AI Evaluator v3.2",
    conductedDate: "03 Sep 2026",
    duration: "50 mins",
    questionsCount: 6,
    status: "Completed",
    techScore: 92,
    communicationScore: 90,
    problemSolvingScore: 92,
    confidenceScore: 88,
    overallScore: 90,
    grade: "Excellent",
    strengths: [
      "✓ Deep mathematical clarity on Neural Network backpropagation",
      "✓ High confidence in LLM fine-tuning & Transformers",
      "✓ Structured presentation of data preprocessing pipelines"
    ],
    weaknesses: [
      "• Time complexity trade-offs in Attention mechanisms need refinement",
      "• Could explain model quantization techniques in more detail"
    ],
    recommendation: "Outstanding AI/ML technical depth. Ready for premier AI engineering campus placement drives.",
    nextTopics: ["Transformer Optimization", "Model Quantization", "ONNX Runtime"],
    interviewHistory: [
      { attempt: "Attempt 1", date: "18 Aug 2026", score: "75%", status: "Good" },
      { attempt: "Attempt 2", date: "26 Aug 2026", score: "82%", status: "Good" },
      { attempt: "Attempt 3", date: "03 Sep 2026", score: "90%", status: "Excellent" }
    ]
  },
  {
    id: 4,
    studentName: "Karan Singh",
    rollNo: "FS04-089",
    department: "CSE",
    batch: "Fullstack React & Node",
    targetRole: "React Frontend Developer",
    interviewType: "Frontend Frameworks & UI Logic",
    interviewer: "AI Evaluator v3.2",
    conductedDate: "02 Sep 2026",
    duration: "35 mins",
    questionsCount: 4,
    status: "Completed",
    techScore: 75,
    communicationScore: 78,
    problemSolvingScore: 72,
    confidenceScore: 76,
    overallScore: 75,
    grade: "Good",
    strengths: [
      "✓ Good UI component structuring with React & Tailwind",
      "✓ Clear understanding of state management using Redux Toolkit"
    ],
    weaknesses: [
      "• Weak in Operating System fundamentals & memory management",
      "• React Context API re-render optimizations lack practical examples",
      "• Answers lack practical depth in asynchronous Event Loop"
    ],
    recommendation: "Practice OS concepts, asynchronous JS event loop, and attempt another technical mock interview.",
    nextTopics: ["Operating Systems", "React Performance", "Event Loop"],
    interviewHistory: [
      { attempt: "Attempt 1", date: "10 Aug 2026", score: "55%", status: "Needs Work" },
      { attempt: "Attempt 2", date: "22 Aug 2026", score: "68%", status: "Average" },
      { attempt: "Attempt 3", date: "02 Sep 2026", score: "75%", status: "Good" }
    ]
  },
  {
    id: 5,
    studentName: "Neha Reddy",
    rollNo: "DS25-018",
    department: "AI & DS",
    batch: "Data Science & ML 2025",
    targetRole: "Data Science & AI Engineer",
    interviewType: "Data Analytics & ML Fundamentals",
    interviewer: "AI Evaluator v3.2",
    conductedDate: "01 Sep 2026",
    duration: "30 mins",
    questionsCount: 4,
    status: "Not Attempted",
    techScore: 54,
    communicationScore: 55,
    problemSolvingScore: 50,
    confidenceScore: 52,
    overallScore: 54,
    grade: "Needs Work",
    strengths: [
      "✓ Basic Python programming syntax awareness"
    ],
    weaknesses: [
      "• Weak in Linear Algebra & PyTorch matrix calculations",
      "• Answers lack practical examples and structure",
      "• Experienced noticeable interview pressure and hesitation"
    ],
    recommendation: "Student requires mentor remediation in Linear Algebra & ML basics before scheduling a mandatory retake interview.",
    nextTopics: ["Linear Algebra", "Python Data Analysis", "Mock Practice"],
    interviewHistory: [
      { attempt: "Attempt 1", date: "01 Sep 2026", score: "54%", status: "Needs Work" }
    ]
  },
  {
    id: 6,
    studentName: "Rohan Verma",
    rollNo: "CSE26-099",
    department: "CSE",
    batch: "CSE 2026 Alpha Cohort",
    targetRole: "Python Backend Developer",
    interviewType: "Core DSA & Problem Solving",
    interviewer: "AI Evaluator v3.2",
    conductedDate: "30 Aug 2026",
    duration: "30 mins",
    questionsCount: 4,
    status: "In Progress",
    techScore: 68,
    communicationScore: 66,
    problemSolvingScore: 65,
    confidenceScore: 70,
    overallScore: 67,
    grade: "Average",
    strengths: [
      "✓ Understands basic array manipulation and loops"
    ],
    weaknesses: [
      "• Weak in recursion, trees, and dynamic programming",
      "• Needs improved articulation during live code walk-through"
    ],
    recommendation: "Continue ongoing evaluation module. Focus on recursion base cases and tree traversal problems.",
    nextTopics: ["Trees & Recursion", "Time Complexity", "Mock Practice"],
    interviewHistory: [
      { attempt: "Attempt 1", date: "12 Aug 2026", score: "48%", status: "Needs Work" },
      { attempt: "Attempt 2", date: "30 Aug 2026", score: "67%", status: "Average" }
    ]
  },
  {
    id: 7,
    studentName: "Ishita Deshmukh",
    rollNo: "ECS26-015",
    department: "ECS",
    batch: "ECS 2026 Beta Cohort",
    targetRole: "Embedded & IoT Engineer",
    interviewType: "C++ & Microcontroller Systems",
    interviewer: "AI Evaluator v3.2",
    conductedDate: "05 Sep 2026",
    duration: "45 mins",
    questionsCount: 5,
    status: "Completed",
    techScore: 88,
    communicationScore: 86,
    problemSolvingScore: 87,
    confidenceScore: 85,
    overallScore: 87,
    grade: "Excellent",
    strengths: [
      "✓ Excellent clarity on RTOS memory management & interrupt handlers",
      "✓ Strong C++ pointer arithmetic & memory optimization"
    ],
    weaknesses: [
      "• Minor hesitation on CAN bus protocol edge cases"
    ],
    recommendation: "Strong candidate for embedded systems roles. Ready for company-specific technical drives.",
    nextTopics: ["CAN Bus", "FreeRTOS", "Embedded Linux"],
    interviewHistory: [
      { attempt: "Attempt 1", date: "20 Aug 2026", score: "74%", status: "Good" },
      { attempt: "Attempt 2", date: "05 Sep 2026", score: "87%", status: "Excellent" }
    ]
  },
  {
    id: 8,
    studentName: "Siddharth Patil",
    rollNo: "IT26-033",
    department: "IT",
    batch: "IT 2026 Cloud Cohort",
    targetRole: "Cloud & DevOps Specialist",
    interviewer: "AI Bot v3.2",
    conductedDate: "2026-08-31",
    status: "Completed",
    techScore: 82,
    behavioralScore: 78,
    overallScore: 80,
    grade: "B+",
    weakSpot: "Kubernetes Custom Resource Definitions (CRDs) and ingress controller security",
    strengths: ["Docker containerization", "CI/CD Pipeline creation", "Linux CLI fluency"],
    summary: "Passed evaluation smoothly. Recommended for upcoming AWS placement drives.",
    detailedScores: {
      problemSolving: 80,
      codeQuality: 82,
      systemDesign: 84,
      communication: 78,
      csFundamentals: 80
    },
    questionFeedback: [
      { q: "Set up Multi-Stage Dockerfile for Go Application", score: "88%", notes: "Optimized image size down to 15MB using scratch stage." }
    ]
  },
  {
    id: 8,
    studentName: "Ishita Deshmukh",
    rollNo: "FS04-022",
    batch: "Fullstack React & Node",
    targetRole: "React Frontend Developer",
    interviewer: "AI Bot v3.2",
    conductedDate: "2026-09-02",
    status: "Completed",
    techScore: 84,
    behavioralScore: 80,
    overallScore: 82,
    grade: "A",
    weakSpot: "Web Security (CSRF/XSS) prevention mechanisms in JWT storage",
    strengths: ["Component modularity", "TypeScript typing", "Clean UI state design"],
    summary: "Strong candidate for web frontend positions. Solved state synchronization problem using custom hooks.",
    detailedScores: {
      problemSolving: 82,
      codeQuality: 86,
      systemDesign: 80,
      communication: 82,
      csFundamentals: 82
    },
    questionFeedback: [
      { q: "Custom React Hook for Debounced Search API Call", score: "88%", notes: "Clean implementation using setTimeout and cleanup function." }
    ]
  }
];

export const coordinatorStudentsNeedImprovement = [
  {
    id: 1,
    studentName: "Neha Reddy",
    rollNo: "DS25-018",
    batch: "Data Science & ML 2025",
    department: "AI & DS",
    attendance: 72.0,
    avgQuizScore: 58.0,
    codingAccuracy: 58.0,
    interviewScore: 54,
    assignedMentor: "Dr. Vikram Seth",
    riskLevel: "High Risk",
    riskFactors: ["Low Attendance (<75%)", "Failed AI Interview (54%)", "Weak Coding Activity"],
    remediationStatus: "Remediation Plan Assigned",
    assignedPlan: "Remedial Linear Algebra & PyTorch Practice Set + 1-on-1 Mentor Counseling",
    targetDeadline: "2026-09-12",
    lastContact: "2026-09-02",
    notes: "Student missed 4 lectures due to illness. Needs mandatory attendance catch-up and retake of AI Mock Interview #2.",
    email: "neha.r@apex.edu.in",
    phone: "+91 98555 66778"
  },
  {
    id: 2,
    studentName: "Rohan Verma",
    rollNo: "CSE26-099",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    attendance: 68.0,
    avgQuizScore: 52.0,
    codingAccuracy: 51.5,
    interviewScore: 48,
    assignedMentor: "Rohan Sharma",
    riskLevel: "High Risk",
    riskFactors: ["Critical Attendance (<70%)", "Failed AI Interview (48%)", "Low Quiz Average"],
    remediationStatus: "Mentorship Scheduled",
    assignedPlan: "Attendance Defaulter Warning + Mandatory DSA Bootcamp (Arrays & Recursion)",
    targetDeadline: "2026-09-10",
    lastContact: "2026-09-01",
    notes: "Official warning notice sent to student and HOD. 1-on-1 session booked with mentor Rohan Sharma for Friday 11:00 AM.",
    email: "rohan.v@apex.edu.in",
    phone: "+91 98666 77889"
  },
  {
    id: 3,
    studentName: "Karan Singh",
    rollNo: "FS04-089",
    batch: "Fullstack React & Node",
    department: "CSE",
    attendance: 85.0,
    avgQuizScore: 76.0,
    codingAccuracy: 76.4,
    interviewScore: 74,
    assignedMentor: "Ananya Gupta",
    riskLevel: "Moderate Risk",
    riskFactors: ["Lagging in Coding Problem Submissions", "Batch Attendance Dip"],
    remediationStatus: "Under Review",
    assignedPlan: "Assigned 15 Intermediate React & Async JS Practice Challenges",
    targetDeadline: "2026-09-15",
    lastContact: "2026-08-30",
    notes: "Student has good foundational attendance but needs focused push on advanced coding tasks to boost placement readiness.",
    email: "karan.s@apex.edu.in",
    phone: "+91 98444 55667"
  },
  {
    id: 4,
    studentName: "Manish Kumar",
    rollNo: "CLOUD-055",
    batch: "Cloud Native & DevOps",
    department: "IT",
    attendance: 71.5,
    avgQuizScore: 61.0,
    codingAccuracy: 64.0,
    interviewScore: 60,
    assignedMentor: "Siddharth Roy",
    riskLevel: "High Risk",
    riskFactors: ["Low Attendance (<75%)", "Borderline Assessment Score"],
    remediationStatus: "Remediation Plan Assigned",
    assignedPlan: "Linux CLI & Docker Hands-on Lab Catchup",
    targetDeadline: "2026-09-14",
    lastContact: "2026-08-31",
    notes: "Requires makeup lab sessions for Docker networking and Kubernetes cluster deployment.",
    email: "manish.k@apex.edu.in",
    phone: "+91 98999 11223"
  },
  {
    id: 5,
    studentName: "Simran Kaur",
    rollNo: "CSE26-078",
    batch: "CSE 2026 Alpha Cohort",
    department: "CSE",
    attendance: 78.0,
    avgQuizScore: 64.5,
    codingAccuracy: 62.0,
    interviewScore: 65,
    assignedMentor: "Rohan Sharma",
    riskLevel: "Moderate Risk",
    riskFactors: ["Borderline Interview Score (65%)", "Low Coding Submissions in Graph Algorithms"],
    remediationStatus: "Mentorship Scheduled",
    assignedPlan: "Graph Theory & Dynamic Programming Tutorial Pack",
    targetDeadline: "2026-09-18",
    lastContact: "2026-09-02",
    notes: "Showing steady effort, but needs assistance on time complexity optimization.",
    email: "simran.k@apex.edu.in",
    phone: "+91 98123 45678"
  }
];

export const coordinatorSkillGapStudents = [
  {
    id: 1,
    studentName: "Neha Reddy",
    rollNo: "DS25-018",
    department: "AI & DS",
    batch: "2025",
    overallPerformance: 61,
    weakSkillsCount: 3,
    priority: "High",
    trendStatus: "Not Improving",
    assignedMentor: "Dr. Vikram Seth",
    weakSkills: [
      {
        skillName: "DBMS",
        currentScore: 45,
        level: "Critical",
        source: "Quiz",
        suggestedImprovement: "Complete Relational Algebra practice module & retake DBMS Quiz #3."
      },
      {
        skillName: "Data Structures",
        currentScore: 52,
        level: "High",
        source: "Coding",
        suggestedImprovement: "Solve 10 medium Tree traversal problems on Coding Practice portal."
      },
      {
        skillName: "Operating Systems",
        currentScore: 58,
        level: "Moderate",
        source: "Interview",
        suggestedImprovement: "Review Deadlock prevention and Memory Management notes."
      }
    ]
  },
  {
    id: 2,
    studentName: "Rohan Verma",
    rollNo: "CSE26-099",
    department: "CSE",
    batch: "2026",
    overallPerformance: 54,
    weakSkillsCount: 4,
    priority: "High",
    trendStatus: "Not Improving",
    assignedMentor: "Rohan Sharma",
    weakSkills: [
      {
        skillName: "System Design",
        currentScore: 40,
        level: "Critical",
        source: "Interview",
        suggestedImprovement: "Attend Saturday System Design bootcamp & review Load Balancers video."
      },
      {
        skillName: "DBMS",
        currentScore: 48,
        level: "Critical",
        source: "Quiz",
        suggestedImprovement: "Practice B-Trees and 3NF normalization exercises."
      },
      {
        skillName: "Data Structures",
        currentScore: 50,
        level: "High",
        source: "Coding",
        suggestedImprovement: "Work through DP pattern guide (Knapsack, LCS)."
      },
      {
        skillName: "Operating Systems",
        currentScore: 55,
        level: "Moderate",
        source: "Quiz",
        suggestedImprovement: "Re-take OSI Model & TCP Handshake quick quiz."
      }
    ]
  },
  {
    id: 3,
    studentName: "Student B",
    rollNo: "102",
    department: "ECS",
    batch: "2026",
    overallPerformance: 58,
    weakSkillsCount: 3,
    priority: "High",
    trendStatus: "Not Improving",
    assignedMentor: "Anagha Dhavlikar",
    weakSkills: [
      {
        skillName: "DBMS",
        currentScore: 45,
        level: "Critical",
        source: "Quiz",
        suggestedImprovement: "Complete SQL join assignments & retake DBMS Quiz."
      },
      {
        skillName: "Data Structures",
        currentScore: 52,
        level: "High",
        source: "Coding",
        suggestedImprovement: "Review Stack & Queue implementation in C++."
      },
      {
        skillName: "Operating Systems",
        currentScore: 58,
        level: "Moderate",
        source: "Interview",
        suggestedImprovement: "Study Paging & Virtual Memory concepts."
      }
    ]
  },
  {
    id: 4,
    studentName: "Karan Singh",
    rollNo: "FS04-089",
    department: "CSE",
    batch: "2026",
    overallPerformance: 68,
    weakSkillsCount: 2,
    priority: "Medium",
    trendStatus: "Improving",
    assignedMentor: "Ananya Gupta",
    weakSkills: [
      {
        skillName: "React State Management",
        currentScore: 56,
        level: "High",
        source: "Coding",
        suggestedImprovement: "Build 2 mini-projects using Redux Toolkit and React Query."
      },
      {
        skillName: "Node.js Middleware",
        currentScore: 62,
        level: "Moderate",
        source: "Quiz",
        suggestedImprovement: "Complete JWT authentication & rate-limiting lab practice."
      }
    ]
  },
  {
    id: 5,
    studentName: "Manish Kumar",
    rollNo: "CLOUD-055",
    department: "IT",
    batch: "2026",
    overallPerformance: 63,
    weakSkillsCount: 2,
    priority: "Medium",
    trendStatus: "Improving",
    assignedMentor: "Siddharth Roy",
    weakSkills: [
      {
        skillName: "Docker Networking",
        currentScore: 52,
        level: "High",
        source: "Lab",
        suggestedImprovement: "Complete Docker Compose multi-container lab exercise."
      },
      {
        skillName: "Kubernetes Pods",
        currentScore: 60,
        level: "Moderate",
        source: "Interview",
        suggestedImprovement: "Practice kubectl deployment & service configurations."
      }
    ]
  },
  {
    id: 6,
    studentName: "Simran Kaur",
    rollNo: "CSE26-078",
    department: "CSE",
    batch: "2026",
    overallPerformance: 72,
    weakSkillsCount: 1,
    priority: "Low",
    trendStatus: "Improving",
    assignedMentor: "Rohan Sharma",
    weakSkills: [
      {
        skillName: "Graph Algorithms",
        currentScore: 62,
        level: "Moderate",
        source: "Coding",
        suggestedImprovement: "Solve Dijkstra & Bellman-Ford problem set."
      }
    ]
  },
  {
    id: 7,
    studentName: "Student A",
    rollNo: "101",
    department: "ECS",
    batch: "2026",
    overallPerformance: 84,
    weakSkillsCount: 1,
    priority: "Low",
    trendStatus: "Improving",
    assignedMentor: "Anagha Dhavlikar",
    weakSkills: [
      {
        skillName: "System Architecture",
        currentScore: 68,
        level: "Moderate",
        source: "Quiz",
        suggestedImprovement: "Read Microservices patterns documentation."
      }
    ]
  }
];

export const coordinatorAttendanceStudents = [
  {
    id: 1,
    name: "Student A",
    rollNo: "101",
    department: "ECS",
    batch: "2026",
    present: 42,
    absent: 8,
    totalClasses: 50,
    attendance: 84,
    status: "Good",
    riskLevel: "Good",
    email: "studenta@apex.edu.in",
    phone: "+91 98100 11101",
    monthlyAttendance: [
      { month: "Jun", percent: 88, present: 14, absent: 2 },
      { month: "Jul", percent: 85, present: 17, absent: 3 },
      { month: "Aug", percent: 80, present: 11, absent: 3 }
    ],
    subjectHistory: [
      { subject: "DBMS", present: 12, absent: 2, percent: 86 },
      { subject: "Data Structures", present: 15, absent: 3, percent: 83 },
      { subject: "Operating Systems", present: 15, absent: 3, percent: 83 }
    ],
    dateLogs: [
      { date: "2026-09-05", subject: "DBMS Lab", status: "Present", remarks: "On time" },
      { date: "2026-09-03", subject: "Data Structures", status: "Present", remarks: "On time" },
      { date: "2026-09-01", subject: "Operating Systems", status: "Absent", remarks: "Medical leave submitted" },
      { date: "2026-08-28", subject: "DBMS Theory", status: "Present", remarks: "On time" },
      { date: "2026-08-25", subject: "Data Structures Lab", status: "Absent", remarks: "Unexcused" }
    ],
    trend: "Stable"
  },
  {
    id: 2,
    name: "Student B",
    rollNo: "102",
    department: "ECS",
    batch: "2026",
    present: 32,
    absent: 18,
    totalClasses: 50,
    attendance: 64,
    status: "Low",
    riskLevel: "Critical",
    email: "studentb@apex.edu.in",
    phone: "+91 98100 11102",
    monthlyAttendance: [
      { month: "Jun", percent: 75, present: 12, absent: 4 },
      { month: "Jul", percent: 65, present: 13, absent: 7 },
      { month: "Aug", percent: 55, present: 7, absent: 7 }
    ],
    subjectHistory: [
      { subject: "DBMS", present: 9, absent: 6, percent: 60 },
      { subject: "Data Structures", present: 11, absent: 7, percent: 61 },
      { subject: "Operating Systems", present: 12, absent: 5, percent: 70 }
    ],
    dateLogs: [
      { date: "2026-09-05", subject: "DBMS Lab", status: "Absent", remarks: "Unexcused" },
      { date: "2026-09-03", subject: "Data Structures", status: "Absent", remarks: "Unexcused" },
      { date: "2026-09-01", subject: "Operating Systems", status: "Present", remarks: "Late by 10m" },
      { date: "2026-08-28", subject: "DBMS Theory", status: "Absent", remarks: "Unexcused" },
      { date: "2026-08-25", subject: "Data Structures Lab", status: "Present", remarks: "On time" }
    ],
    trend: "Declining"
  },
  {
    id: 3,
    name: "Rohan Verma",
    rollNo: "CSE26-099",
    department: "CSE",
    batch: "2026",
    present: 34,
    absent: 16,
    totalClasses: 50,
    attendance: 68,
    status: "Warning",
    riskLevel: "Warning",
    email: "rohan.v@apex.edu.in",
    phone: "+91 98666 77889",
    monthlyAttendance: [
      { month: "Jun", percent: 78, present: 14, absent: 4 },
      { month: "Jul", percent: 70, present: 14, absent: 6 },
      { month: "Aug", percent: 60, present: 6, absent: 6 }
    ],
    subjectHistory: [
      { subject: "Algorithms", present: 10, absent: 6, percent: 62.5 },
      { subject: "Fullstack Web", present: 12, absent: 5, percent: 70.5 },
      { subject: "System Design", present: 12, absent: 5, percent: 70.5 }
    ],
    dateLogs: [
      { date: "2026-09-04", subject: "Algorithms Lab", status: "Absent", remarks: "Unexcused" },
      { date: "2026-09-02", subject: "Fullstack Web", status: "Present", remarks: "On time" },
      { date: "2026-08-30", subject: "System Design", status: "Absent", remarks: "Personal emergency" }
    ],
    trend: "Declining"
  },
  {
    id: 4,
    name: "Neha Reddy",
    rollNo: "DS25-018",
    department: "AI & DS",
    batch: "2025",
    present: 36,
    absent: 14,
    totalClasses: 50,
    attendance: 72,
    status: "Warning",
    riskLevel: "Warning",
    email: "neha.r@apex.edu.in",
    phone: "+91 98555 66778",
    monthlyAttendance: [
      { month: "Jun", percent: 80, present: 16, absent: 4 },
      { month: "Jul", percent: 72, present: 13, absent: 5 },
      { month: "Aug", percent: 65, present: 7, absent: 5 }
    ],
    subjectHistory: [
      { subject: "Machine Learning", present: 12, absent: 4, percent: 75 },
      { subject: "Python for DS", present: 11, absent: 5, percent: 68.7 },
      { subject: "Linear Algebra", present: 13, absent: 5, percent: 72.2 }
    ],
    dateLogs: [
      { date: "2026-09-04", subject: "Machine Learning Lab", status: "Present", remarks: "On time" },
      { date: "2026-09-01", subject: "Python for DS", status: "Absent", remarks: "Sick leave" }
    ],
    trend: "Improving"
  },
  {
    id: 5,
    name: "Manish Kumar",
    rollNo: "CLOUD-055",
    department: "IT",
    batch: "2026",
    present: 31,
    absent: 19,
    totalClasses: 50,
    attendance: 62,
    status: "Low",
    riskLevel: "Critical",
    email: "manish.k@apex.edu.in",
    phone: "+91 98999 11223",
    monthlyAttendance: [
      { month: "Jun", percent: 70, present: 14, absent: 6 },
      { month: "Jul", percent: 62, present: 11, absent: 7 },
      { month: "Aug", percent: 54, present: 6, absent: 6 }
    ],
    subjectHistory: [
      { subject: "Cloud Infrastructure", present: 10, absent: 7, percent: 58.8 },
      { subject: "DevOps & CI/CD", present: 11, absent: 6, percent: 64.7 },
      { subject: "Linux Admin", present: 10, absent: 6, percent: 62.5 }
    ],
    dateLogs: [
      { date: "2026-09-04", subject: "DevOps Lab", status: "Absent", remarks: "Unexcused" },
      { date: "2026-09-02", subject: "Cloud Infra", status: "Absent", remarks: "Unexcused" }
    ],
    trend: "Declining"
  },
  {
    id: 6,
    name: "Ananya Sharma",
    rollNo: "CSE26-009",
    department: "CSE",
    batch: "2026",
    present: 49,
    absent: 1,
    totalClasses: 50,
    attendance: 98,
    status: "Good",
    riskLevel: "Good",
    email: "ananya.s@apex.edu.in",
    phone: "+91 98111 22334",
    monthlyAttendance: [
      { month: "Jun", percent: 100, present: 16, absent: 0 },
      { month: "Jul", percent: 95, present: 19, absent: 1 },
      { month: "Aug", percent: 100, present: 14, absent: 0 }
    ],
    subjectHistory: [
      { subject: "Data Structures", present: 18, absent: 0, percent: 100 },
      { subject: "Web Dev", present: 16, absent: 1, percent: 94.1 },
      { subject: "Algorithms", present: 15, absent: 0, percent: 100 }
    ],
    dateLogs: [
      { date: "2026-09-05", subject: "Web Dev", status: "Present", remarks: "On time" }
    ],
    trend: "Stable"
  }
];

export const coordinatorDepartmentAttendanceSummary = [
  { department: "ECS", totalStudents: 100, presentToday: 84, absentToday: 16, avgAttendance: 84.0, lowAttendanceCount: 18 },
  { department: "CSE", totalStudents: 120, presentToday: 110, absentToday: 10, avgAttendance: 91.6, lowAttendanceCount: 6 },
  { department: "IT", totalStudents: 60, presentToday: 52, absentToday: 8, avgAttendance: 86.6, lowAttendanceCount: 10 },
  { department: "AI & DS", totalStudents: 40, presentToday: 37, absentToday: 3, avgAttendance: 92.5, lowAttendanceCount: 3 }
];


