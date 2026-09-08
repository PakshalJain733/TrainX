export const mentorProfile = {
  name: "Dr. Vikram Sharma",
  email: "vikram.sharma@acadnexus.edu",
  role: "Senior Technical Mentor",
  specialization: "Full Stack & System Architecture",
  department: "Computer Engineering & IT",
  experience: "8+ Years",
  rating: 4.9,
  allocatedBatchesCount: 3,
  totalStudentsAssigned: 140,
  pendingEvaluationsCount: 14,
  upcomingSessionsCount: 2,
};

export const mentorBatches = [
  {
    id: 1,
    code: "BE-CS-2026-A",
    name: "Full Stack Web Development & System Design",
    college: "PVPPCOE",
    department: "Computer Engineering",
    progress: 78,
    status: "Active",
  },
  {
    id: 2,
    code: "TE-IT-2026-B",
    name: "Data Structures & Advanced Algorithms",
    college: "PVPPCOE",
    department: "Information Technology",
    progress: 65,
    status: "Active",
  },
  {
    id: 3,
    code: "BE-EXTC-2026-C",
    name: "Python for Machine Learning & Data Science",
    college: "PVPPCOE",
    department: "EXTC",
    progress: 42,
    status: "Active",
  },
];

export const mentorStudents = [
  { id: 1, name: "Rahul Verma", rollNo: "CS202601", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: "94%", quizScore: "92 / 100", riskLevel: "Top Performer" },
  { id: 2, name: "Ananya Patel", rollNo: "CS202604", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: "88%", quizScore: "84 / 100", riskLevel: "Good" },
  { id: 3, name: "Siddharth Rao", rollNo: "IT202612", department: "Information Technology", batch: "TE-IT-2026-B", attendance: "68%", quizScore: "54 / 100", riskLevel: "High Risk" },
  { id: 4, name: "Pooja Deshmukh", rollNo: "IT202615", department: "Information Technology", batch: "TE-IT-2026-B", attendance: "96%", quizScore: "96 / 100", riskLevel: "Top Performer" },
];

export const mentorAssignments = [
  { id: 1, title: "React & Redux E-Commerce Store", batch: "BE-CS-2026-A", submitted: 42, total: 45, dueDate: "2026-09-10" },
  { id: 2, title: "Graph Traversal Algorithms in C++", batch: "TE-IT-2026-B", submitted: 38, total: 48, dueDate: "2026-09-12" },
];

export const mentorLiveSessions = [
  {
    id: 1,
    title: "System Design: Microservices & Message Queues",
    batch: "BE-CS-2026-A",
    time: "Today at 02:00 PM - 03:30 PM",
    status: "Upcoming",
    link: "https://meet.google.com/abc-defg-hij",
  },
  {
    id: 2,
    title: "Dynamic Programming Masterclass",
    batch: "TE-IT-2026-B",
    time: "Tomorrow at 10:00 AM - 11:30 AM",
    status: "Scheduled",
    link: "https://meet.google.com/xyz-uvwx-rst",
  },
];

export const mentorStudentDoubts = [];
export const mentorWeeklyReports = [];
export const mentorSkillGaps = [];
export const mentorLeaderboard = [];
export const mentorMockDrives = [];
export const mentorDefaulters = [];
export const mentorStudyMaterial = [];
