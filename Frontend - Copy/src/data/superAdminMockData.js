export const overviewStats = [
  { id: 'colleges', label: 'Total Colleges', value: '18', change: '+2 this month', trend: 'up', icon: 'Building2' },
  { id: 'students', label: 'Active Students', value: '4,850', change: '+12% growth', trend: 'up', icon: 'Users' },
  { id: 'departments', label: 'Departments Covered', value: '42', change: 'Across 18 colleges', trend: 'neutral', icon: 'GraduationCap' },
  { id: 'verifications', label: 'Pending Verifications', value: '5', change: 'Requires review', trend: 'warning', icon: 'ShieldAlert' },
];

export const initialColleges = [
  { id: 1, name: 'Apex Institute of Technology', location: 'Bangalore', code: 'AIT-BLR', status: 'Active', studentsCount: 420, departmentsCount: 6, adminName: 'Dr. Rajesh Verma', adminEmail: 'r.verma@apex.edu.in' },
  { id: 2, name: 'Meridian Engineering College', location: 'Hyderabad', code: 'MEC-HYD', status: 'Active', studentsCount: 380, departmentsCount: 5, adminName: 'Prof. Sunita Rao', adminEmail: 's.rao@meridian.edu.in' },
  { id: 3, name: 'Vanguard Academy of Science', location: 'Pune', code: 'VAS-PNE', status: 'Active', studentsCount: 510, departmentsCount: 7, adminName: 'Dr. Amit Patel', adminEmail: 'a.patel@vanguard.edu.in' },
  { id: 4, name: 'St. Xavier Technical Campus', location: 'Mumbai', code: 'SXC-MUM', status: 'Pending Verification', studentsCount: 290, departmentsCount: 4, adminName: 'Priya Shah', adminEmail: 'p.shah@stxaviers.edu.in' },
  { id: 5, name: 'Global Institute of Computer Applications', location: 'Delhi NCR', code: 'GICA-DEL', status: 'Active', studentsCount: 630, departmentsCount: 8, adminName: 'Dr. Suresh Nair', adminEmail: 's.nair@gica.ac.in' },
];

export const initialDepartments = [
  { id: 1, name: 'Computer Science & Engineering', code: 'CSE', collegesCount: 18, activeStudents: 1850, batchesCount: 24, status: 'Active' },
  { id: 2, name: 'Information Technology', code: 'IT', collegesCount: 15, activeStudents: 1200, batchesCount: 16, status: 'Active' },
  { id: 3, name: 'Artificial Intelligence & Data Science', code: 'AI-DS', collegesCount: 12, activeStudents: 950, batchesCount: 12, status: 'Active' },
  { id: 4, name: 'Electronics & Communication', code: 'ECE', collegesCount: 10, activeStudents: 850, batchesCount: 10, status: 'Active' },
];

export const initialBatches = [
  { id: 1, name: 'CSE 2026 Alpha Cohort', college: 'Apex Institute of Technology', department: 'Computer Science', students: 120, progress: 78, mentor: 'Rohan Sharma', status: 'In Progress' },
  { id: 2, name: 'Fullstack Web Dev Batch #4', college: 'Meridian Engineering College', department: 'Information Technology', students: 95, progress: 62, mentor: 'Ananya Gupta', status: 'In Progress' },
  { id: 3, name: 'Data Science & ML 2025', college: 'Vanguard Academy of Science', department: 'AI & Data Science', students: 110, progress: 91, mentor: 'Dr. Vikram Seth', status: 'Near Completion' },
  { id: 4, name: 'Cloud Computing & DevOps', college: 'Global Institute of Computer Applications', department: 'Computer Science', students: 85, progress: 45, mentor: 'Siddharth Roy', status: 'In Progress' },
];

export const initialAdminVerifications = [
  { id: 1, name: 'Priya Shah', email: 'p.shah@stxaviers.edu.in', college: 'St. Xavier Technical Campus', designation: 'Head of Academics', requestedAt: '2026-08-27', status: 'Pending' },
  { id: 2, name: 'Dr. Manish Kulkarni', email: 'm.kulkarni@mitpune.edu.in', college: 'MIT School of Engineering', designation: 'Dean Student Affairs', requestedAt: '2026-08-28', status: 'Pending' },
  { id: 3, name: 'Kavita Menon', email: 'k.menon@ritchennai.edu.in', college: 'RIT Chennai', designation: 'Placement Officer', requestedAt: '2026-08-29', status: 'Pending' },
];

export const initialCoordinators = [
  { id: 1, name: 'Alok Mishra', email: 'a.mishra@trainingportal.com', college: 'Apex Institute of Technology', department: 'CSE', assignedBatches: 3, status: 'Active' },
  { id: 2, name: 'Sneha Deshmukh', email: 's.deshmukh@trainingportal.com', college: 'Meridian Engineering College', department: 'IT', assignedBatches: 2, status: 'Active' },
  { id: 3, name: 'Rahul Joshi', email: 'r.joshi@trainingportal.com', college: 'Vanguard Academy of Science', department: 'AI & DS', assignedBatches: 4, status: 'Active' },
];

export const initialMentors = [
  { id: 1, name: 'Rohan Sharma', specialization: 'Fullstack React & Node', allocatedStudents: 150, rating: 4.9, status: 'Available' },
  { id: 2, name: 'Ananya Gupta', specialization: 'Data Structures & Algorithms', allocatedStudents: 135, rating: 4.8, status: 'Available' },
  { id: 3, name: 'Dr. Vikram Seth', specialization: 'Machine Learning & Python', allocatedStudents: 180, rating: 5.0, status: 'Busy' },
  { id: 4, name: 'Siddharth Roy', specialization: 'AWS & Cloud Architecture', allocatedStudents: 120, rating: 4.7, status: 'Available' },
];

export const initialStudentsRiskAlerts = [
  { id: 1, name: 'Aarav Mehta', college: 'Apex Institute', batch: 'CSE 2026 Alpha', riskLevel: 'High', reason: 'Low attendance (< 50%)', score: '42%' },
  { id: 2, name: 'Neha Reddy', college: 'Meridian College', batch: 'Fullstack Batch #4', riskLevel: 'Medium', reason: 'Missed 3 assignment deadlines', score: '58%' },
  { id: 3, name: 'Karan Singh', college: 'Vanguard Academy', batch: 'Data Science 2025', riskLevel: 'Low', reason: 'Marginal test score dip', score: '68%' },
];

export const initialPerformanceData = {
  overallPassRate: 84.2,
  avgPlacementReadiness: 78.4,
  collegeBenchmarks: [
    { college: 'Apex Institute of Technology', passRate: 89.5, readinessScore: 84.2, activeStudents: 420 },
    { college: 'Vanguard Academy of Science', passRate: 88.0, readinessScore: 81.5, activeStudents: 510 },
    { college: 'Global Institute of Comp Apps', passRate: 83.4, readinessScore: 77.0, activeStudents: 630 },
    { college: 'Meridian Engineering College', passRate: 81.2, readinessScore: 74.8, activeStudents: 380 },
    { college: 'St. Xavier Technical Campus', passRate: 76.5, readinessScore: 71.2, activeStudents: 290 },
  ],
  subjectProficiency: [
    { subject: 'Data Structures & Algorithms', score: 82 },
    { subject: 'Full Stack Development', score: 79 },
    { subject: 'System Design', score: 68 },
    { subject: 'Cloud & DevOps', score: 74 },
    { subject: 'AI & Data Engineering', score: 86 },
  ]
};

export const initialAttendanceData = [
  { id: 1, college: 'Apex Institute of Technology', batch: 'CSE 2026 Alpha', totalStudents: 120, avgAttendance: '94.2%', flaggedStudents: 2, status: 'Healthy' },
  { id: 2, college: 'Meridian Engineering College', batch: 'Fullstack Batch #4', totalStudents: 95, avgAttendance: '88.5%', flaggedStudents: 6, status: 'Moderate' },
  { id: 3, college: 'Vanguard Academy of Science', batch: 'Data Science 2025', totalStudents: 110, avgAttendance: '92.1%', flaggedStudents: 3, status: 'Healthy' },
  { id: 4, college: 'Global Institute of Comp Apps', batch: 'Cloud DevOps', totalStudents: 85, avgAttendance: '79.4%', flaggedStudents: 11, status: 'Attention Required' },
  { id: 5, college: 'St. Xavier Technical Campus', batch: 'ECE 2024 Cohort', totalStudents: 75, avgAttendance: '82.0%', flaggedStudents: 8, status: 'Moderate' },
];

export const initialAIRoadmaps = [
  { id: 1, title: 'Full Stack Web Engineering (React/Node)', track: 'Software Engineering', modulesCount: 18, enrolledStudents: 1450, completionRate: '76%', aiAdaptation: 'High' },
  { id: 2, title: 'Generative AI & LLM Systems', track: 'AI & Data Science', modulesCount: 14, enrolledStudents: 980, completionRate: '82%', aiAdaptation: 'Very High' },
  { id: 3, title: 'Cloud Native & DevOps Infrastructure', track: 'Cloud Computing', modulesCount: 16, enrolledStudents: 820, completionRate: '68%', aiAdaptation: 'Moderate' },
  { id: 4, title: 'Enterprise Cyber Security & Ethical Hacking', track: 'Security', modulesCount: 12, enrolledStudents: 590, completionRate: '71%', aiAdaptation: 'High' },
];

export const initialAIInterviews = [
  { id: 1, studentName: 'Aarav Mehta', college: 'Apex Institute', role: 'Full Stack Engineer', technicalScore: 78, behavioralScore: 84, overallScore: 81, weakAreas: 'Edge cases in Graph algorithms' },
  { id: 2, studentName: 'Priya Sharma', college: 'Vanguard Academy', role: 'AI / Data Scientist', technicalScore: 92, behavioralScore: 88, overallScore: 90, weakAreas: 'High-scale SQL query tuning' },
  { id: 3, studentName: 'Rohan Deshmukh', college: 'Meridian College', role: 'DevOps Specialist', technicalScore: 64, behavioralScore: 72, overallScore: 68, weakAreas: 'Kubernetes ingress config & Security policies' },
  { id: 4, studentName: 'Ananya Roy', college: 'Global Institute', role: 'Frontend Architect', technicalScore: 88, behavioralScore: 90, overallScore: 89, weakAreas: 'SSR vs Hydration nuances' },
];

export const initialMockDrives = [
  { id: 1, driveName: 'Tier-1 Tech Mega Recruitment Drive', company: 'Google & Microsoft Partners', targetBatch: 'Batch 2025 & 2026', registeredStudents: 850, passCriteria: '80%', status: 'Upcoming', date: '2026-09-15' },
  { id: 2, driveName: 'FinTech Systems Coding Challenge', company: 'Goldman Sachs & Morgan Stanley', targetBatch: 'CSE & IT 2025', registeredStudents: 620, passCriteria: '75%', status: 'Active', date: '2026-09-02' },
  { id: 3, driveName: 'Cloud & DevOps Hiring Hackathon', company: 'AWS & Azure Cloud Network', targetBatch: 'Cloud Cohorts', registeredStudents: 410, passCriteria: '70%', status: 'Completed', date: '2026-08-20' },
];

export const initialWeeklyReports = [
  { id: 1, title: 'Weekly Governance & Compliance Audit', weekRange: 'Aug 22 - Aug 28, 2026', reportType: 'Institutional Governance', generatedBy: 'Dr. Sara Rao', status: 'Verified', size: '2.4 MB' },
  { id: 2, title: 'Cross-College Placement Readiness Index', weekRange: 'Aug 15 - Aug 21, 2026', reportType: 'Analytics & Risk Audit', generatedBy: 'AI Systems Diagnostic', status: 'Archived', size: '1.8 MB' },
  { id: 3, title: 'Faculty & Coordinator Activity Log', weekRange: 'Aug 08 - Aug 14, 2026', reportType: 'Operations', generatedBy: 'System Admin', status: 'Archived', size: '3.1 MB' },
];
