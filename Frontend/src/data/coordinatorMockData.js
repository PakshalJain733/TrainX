export const coordinatorProfile = {
  name: "",
  email: "",
  role: "Department Coordinator",
  department: "",
  college: "",
  phone: "",
  joinDate: "",
  totalStudents: 0,
  activeBatchesCount: 0,
  assignedMentorsCount: 0,
  overallAttendanceRate: 0,
  placementReadinessScore: 0,
  pendingRequestsCount: 0,
};

export const coordinatorStats = [
  { id: "students", label: "Total Students", value: "0", subtext: "Across active batches", trend: "DB synced", color: "indigo" },
  { id: "batches", label: "Active Batches", value: "0", subtext: "Department tracks", trend: "DB synced", color: "blue" },
  { id: "mentors", label: "Assigned Trainers", value: "0", subtext: "Industry specialists", trend: "DB synced", color: "emerald" },
  { id: "attendance", label: "Avg Attendance", value: "0%", subtext: "Student attendance summary", trend: "DB synced", color: "purple" },
];

export const coordinatorBatches = [];
export const coordinatorMentors = [];
export const coordinatorStudents = [];
export const coordinatorDefaulters = [];
export const coordinatorInterventions = [];
export const coordinatorAnnouncements = [];
export const coordinatorReports = [];
export const coordinatorAIInterviews = [];
export const coordinatorAIRoadmaps = [];
export const coordinatorMockDrives = [];

export const coordinatorCodingPerformance = [];
export const coordinatorInterviewRecords = [];
export const coordinatorSkillGapStudents = [];
export const coordinatorRequests = [];
export const coordinatorAssessments = [];
export const coordinatorAttendanceStudents = [];
export const coordinatorDepartmentAttendanceSummary = {
  overallPercentage: 0,
  totalStudents: 0,
  presentToday: 0,
  defaulterCount: 0,
};
export const coordinatorQuizActivityLogs = [];
export const coordinatorDetailedQuizScorecards = [];
