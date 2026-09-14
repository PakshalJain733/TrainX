export const overviewStats = [
  { id: 'colleges', label: 'Total Colleges', value: '0', change: 'Live count from DB', trend: 'neutral', icon: 'Building2' },
  { id: 'students', label: 'Active Students', value: '0', change: 'Live count from DB', trend: 'neutral', icon: 'Users' },
  { id: 'departments', label: 'Departments Covered', value: '0', change: 'Live count from DB', trend: 'neutral', icon: 'GraduationCap' },
  { id: 'security', label: 'Security & Key Access', value: 'Protected', change: 'Secure Code Enforced', trend: 'up', icon: 'ShieldCheck' },
];

export const initialColleges = [];
export const initialDepartments = [];
export const initialBatches = [];
export const initialAdminVerifications = [];
export const initialCoordinators = [];
export const initialMentors = [];
export const initialStudentsRiskAlerts = [];

export const initialPerformanceData = {
  overallPassRate: 0,
  avgPlacementReadiness: 0,
  activeStudents: 0,
  collegeBenchmarks: [],
  subjectProficiency: []
};

export const initialAttendanceData = [];
export const initialAIRoadmaps = [];
export const initialAIInterviews = [];
export const initialMockDrives = [];

export const initialWeeklyReports = [];
