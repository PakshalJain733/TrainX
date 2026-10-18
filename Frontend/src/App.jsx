import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SystemMaintenanceProvider } from './context/SystemMaintenanceContext';
import MaintenanceGuard from './components/Common/MaintenanceGuard';
import ProtectedRoute from './components/Common/ProtectedRoute';
import DesktopNotificationListener from './components/Common/DesktopNotificationListener';
import MeetingReminderBanner from './components/Common/MeetingReminderBanner';
import RouteLoadingFallback from './components/Common/RouteLoadingFallback';

// ── Auth & Registration Pages (Lazy Loaded) ──
const Login = lazy(() => import('./pages/authentication/login'));
const Register = lazy(() => import('./pages/authentication/register'));
const TrainingRegistrationPage = lazy(() => import('./pages/Student/Components/TrainingRegistrationPage'));

// ── Student Workspace Pages (Lazy Loaded) ──
const StudentLayout = lazy(() => import('./pages/Student/Components/ST_Layout'));
const Overview = lazy(() => import('./pages/Student/Components/ST_Overview'));
const AIRoadmap = lazy(() => import('./pages/Student/Components/ST_AiRoadmap'));
const LearningContent = lazy(() => import('./pages/Student/Components/ST_LearningContent'));
const AIInterview = lazy(() => import('./pages/Student/Components/ST_AiInterview'));
const ProgressAnalytics = lazy(() => import('./pages/Student/Components/ST_ProgressAnalytics'));
const Leaderboard = lazy(() => import('./pages/Student/Components/ST_Leaderboard'));
const WeeklyReports = lazy(() => import('./pages/Student/Components/ST_WeeklyReports'));
const Attendance = lazy(() => import('./pages/Student/Components/ST_Attendance'));
const Batches = lazy(() => import('./pages/Student/Components/ST_Batches'));
const PracticeProblems = lazy(() => import('./pages/Student/Components/ST_PracticeProblems'));
const CodingPlatform = lazy(() => import('./pages/Student/Components/ST_CodingPlatform'));
const Help = lazy(() => import('./pages/Student/Components/ST_Help'));
const Notifications = lazy(() => import('./pages/Student/Components/ST_Notifications'));
const ProfilePage = lazy(() => import('./pages/Student/Components/ST_ProfilePage'));
const AcademicQuiz = lazy(() => import('./pages/Student/Components/ST_AcademicQuiz'));
const Settings = lazy(() => import('./pages/Student/Components/ST_Settings'));
const StudentSkillGaps = lazy(() => import('./pages/Student/Components/ST_SkillGaps'));

// ── Admin Workspace Pages (Lazy Loaded) ──
const AdminLayout = lazy(() => import('./pages/Admin/Components/AD_Layout'));
const AdminOverview = lazy(() => import('./pages/Admin/Components/AD_Overview'));
const AdminUsers = lazy(() => import('./pages/Admin/Components/AD_Users'));
const AdminBatches = lazy(() => import('./pages/Admin/Components/AD_Batches'));
const AdminAttendance = lazy(() => import('./pages/Admin/Components/AD_Attendance'));
const AdminLearningContent = lazy(() => import('./pages/Admin/Components/AD_LearningContent'));
const AdminQuizzes = lazy(() => import('./pages/Admin/Components/AD_Quizzes'));
const AdminPracticeProblems = lazy(() => import('./pages/Admin/Components/AD_PracticeProblems'));
const AdminProgress = lazy(() => import('./pages/Admin/Components/AD_Progress'));
const AdminLeaderboard = lazy(() => import('./pages/Admin/Components/AD_Leaderboard'));
const AdminHelp = lazy(() => import('./pages/Admin/Components/AD_Help'));
const AdminProfile = lazy(() => import('./pages/Admin/Components/AD_Profile'));
const AdminBroadcast = lazy(() => import('./pages/Admin/Components/AD_Broadcast'));
const AdminWeeklyReports = lazy(() => import('./pages/Admin/Components/AD_WeeklyReports'));
const AdminTrainings = lazy(() => import('./pages/Admin/Components/AD_Trainings'));
const AdminApproveUsers = lazy(() => import('./pages/Admin/Components/AD_ApproveUsers'));
const AdminDepartmentsPage = lazy(() => import('./pages/Admin/Components/AD_Departments'));

// ── Super Admin Workspace Pages (Lazy Loaded) ──
const SuperAdminLayout = lazy(() => import('./pages/SuperAdmin/Components/SA_Layout'));
const SuperAdminOverview = lazy(() => import('./pages/SuperAdmin/Components/SA_Overview'));
const CollegesPage = lazy(() => import('./pages/SuperAdmin/Components/SA_Colleges'));
const SuperAdminBatches = lazy(() => import('./pages/SuperAdmin/Components/SA_Batches'));
const SuperAdminManageUsers = lazy(() => import('./pages/SuperAdmin/Components/SA_ManageUsers'));
const SuperAdminSystemHealth = lazy(() => import('./pages/SuperAdmin/Components/SA_SystemHealth'));
const SuperAdminProfilePage = lazy(() => import('./pages/SuperAdmin/Components/SA_Profile'));
const SuperAdminMaintenanceControls = lazy(() => import('./pages/SuperAdmin/Components/SA_MaintenanceControls'));
const SuperAdminTickets = lazy(() => import('./pages/SuperAdmin/Components/SA_Tickets'));
const SuperAdminPerformancePage = lazy(() => import('./pages/SuperAdmin/Components/SA_Performance'));
const SuperAdminApproveUsers = lazy(() => import('./pages/SuperAdmin/Components/SA_ApproveUsers'));

// ── Mentor Workspace Pages (Lazy Loaded) ──
const MentorLayout = lazy(() => import('./pages/Mentor/Components/MN_Layout'));
const MentorOverview = lazy(() => import('./pages/Mentor/Components/MN_Overview'));
const MentorBatches = lazy(() => import('./pages/Mentor/Components/MN_Batches'));
const MentorStudents = lazy(() => import('./pages/Mentor/Components/MN_Students'));
const MentorRoadmaps = lazy(() => import('./pages/Mentor/Components/MN_Roadmaps'));
const MentorAIInterviews = lazy(() => import('./pages/Mentor/Components/MN_AIInterviews'));
const MentorSkillGaps = lazy(() => import('./pages/Mentor/Components/MN_SkillGaps'));
const MentorAttendance = lazy(() => import('./pages/Mentor/Components/MN_Attendance'));
const MentorLeaderboard = lazy(() => import('./pages/Mentor/Components/MN_Leaderboard'));
const MentorDefaulters = lazy(() => import('./pages/Mentor/Components/MN_Defaulters'));
const MentorStudyMaterial = lazy(() => import('./pages/Mentor/Components/MN_StudyMaterial'));
const MentorWeeklyReports = lazy(() => import('./pages/Mentor/Components/MN_WeeklyReports'));
const MentorAssignments = lazy(() => import('./pages/Mentor/Components/MN_Assignments'));
const MentorLiveSessions = lazy(() => import('./pages/Mentor/Components/MN_LiveSessions'));
const MentorNotifications = lazy(() => import('./pages/Mentor/Components/MN_Notifications'));
const MentorProfilePage = lazy(() => import('./pages/Mentor/Components/MN_ProfilePage'));
const MentorHelp = lazy(() => import('./pages/Mentor/Components/MN_Help'));
const MentorQuizzes = lazy(() => import('./pages/Mentor/Components/MN_Quizzes'));
const MentorPerformance = lazy(() => import('./pages/Mentor/Components/MN_Performance'));
const MentorBroadcast = lazy(() => import('./pages/Mentor/Components/MN_Broadcast'));

// ── Coordinator Workspace Pages (Lazy Loaded) ──
const CoordinatorLayout = lazy(() => import('./pages/Coordinator/Components/CO_Layout'));
const CoordinatorOverview = lazy(() => import('./pages/Coordinator/Components/CO_Overview'));
const CoordinatorBatches = lazy(() => import('./pages/Coordinator/Components/CO_Batches'));
const CoordinatorStudents = lazy(() => import('./pages/Coordinator/Components/CO_Students'));
const CoordinatorInterviewPerformance = lazy(() =>
  import('./pages/Coordinator/Components/CO_Performances').then(m => ({ default: m.InterviewPerformance }))
);
const CoordinatorStudentsNeedImprovement = lazy(() => import('./pages/Coordinator/Components/CO_StudentsNeedImprovement'));
const CoordinatorMentors = lazy(() => import('./pages/Coordinator/Components/CO_Mentors'));
const CoordinatorAttendance = lazy(() => import('./pages/Coordinator/Components/CO_Attendance'));
const CoordinatorPlacement = lazy(() => import('./pages/Coordinator/Components/CO_Placement'));
const CoordinatorRequests = lazy(() => import('./pages/Coordinator/Components/CO_Requests'));
const CoordinatorNotifications = lazy(() => import('./pages/Coordinator/Components/CO_Notifications'));
const CoordinatorProfilePage = lazy(() => import('./pages/Coordinator/Components/CO_ProfilePage'));
const CoordinatorQuizAndCodes = lazy(() => import('./pages/Coordinator/Components/CO_QuizzesAndCodes'));
const CoordinatorPerformances = lazy(() => import('./pages/Coordinator/Components/CO_Performances'));
const CoordinatorHelp = lazy(() => import('./pages/Coordinator/Components/CO_Help'));
const CoordinatorBroadcast = lazy(() => import('./pages/Coordinator/Components/CO_Broadcast'));
const CoordinatorLeaderboard = lazy(() => import('./pages/Coordinator/Components/CO_Leaderboard'));

function App() {
  return (
    <SystemMaintenanceProvider>
      <BrowserRouter>
        <DesktopNotificationListener />
        <MeetingReminderBanner />
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Auth & Public Routes */}
            <Route path="/" element={<MaintenanceGuard moduleKey="loginWithPassword"><Login /></MaintenanceGuard>} />
            <Route path="/register" element={<MaintenanceGuard moduleKey="userRegistration"><Register /></MaintenanceGuard>} />
            <Route path="/trainings/register" element={<MaintenanceGuard moduleKey="trainingRegistration"><TrainingRegistrationPage /></MaintenanceGuard>} />

            {/* Student Workspace Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MaintenanceGuard moduleKey="studentDashboard"><Overview /></MaintenanceGuard>} />
              <Route path="roadmap" element={<MaintenanceGuard moduleKey="aiRoadmaps"><AIRoadmap /></MaintenanceGuard>} />
              <Route path="learning" element={<MaintenanceGuard moduleKey="learningContent"><LearningContent /></MaintenanceGuard>} />
              <Route path="ai-interview" element={<MaintenanceGuard moduleKey="aiInterviews"><AIInterview /></MaintenanceGuard>} />
              <Route path="progress" element={<MaintenanceGuard moduleKey="skillGapAnalysis"><ProgressAnalytics /></MaintenanceGuard>} />
              <Route path="leaderboard" element={<MaintenanceGuard moduleKey="studentLeaderboard"><Leaderboard /></MaintenanceGuard>} />
              <Route path="quiz" element={<MaintenanceGuard moduleKey="academicQuizzes"><AcademicQuiz /></MaintenanceGuard>} />
              <Route path="attendance" element={<MaintenanceGuard moduleKey="attendance"><Attendance /></MaintenanceGuard>} />
              <Route path="skill-gaps" element={<MaintenanceGuard moduleKey="studentSkillGaps"><StudentSkillGaps /></MaintenanceGuard>} />
              <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="weeklyReports"><WeeklyReports /></MaintenanceGuard>} />
              <Route path="batches" element={<MaintenanceGuard moduleKey="studentBatches"><Batches /></MaintenanceGuard>} />
              <Route path="practice" element={<MaintenanceGuard moduleKey="practiceCoding"><PracticeProblems /></MaintenanceGuard>} />
              <Route path="coding-platform/:taskId" element={<MaintenanceGuard moduleKey="codingCompiler"><CodingPlatform /></MaintenanceGuard>} />
              <Route path="coding-platform" element={<MaintenanceGuard moduleKey="codingCompiler"><CodingPlatform /></MaintenanceGuard>} />
              <Route path="help" element={<MaintenanceGuard moduleKey="studentHelp"><Help /></MaintenanceGuard>} />
              <Route path="notifications" element={<MaintenanceGuard moduleKey="studentNotifications"><Notifications /></MaintenanceGuard>} />
              <Route path="profile" element={<MaintenanceGuard moduleKey="studentProfile"><ProfilePage /></MaintenanceGuard>} />
              <Route path="settings" element={<MaintenanceGuard moduleKey="studentProfile"><Settings /></MaintenanceGuard>} />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MaintenanceGuard moduleKey="adminDashboard"><AdminOverview /></MaintenanceGuard>} />
              <Route path="users" element={<MaintenanceGuard moduleKey="manageUsers"><AdminUsers /></MaintenanceGuard>} />
              <Route path="approve-users" element={<MaintenanceGuard moduleKey="adminBulkUserImport"><AdminApproveUsers /></MaintenanceGuard>} />
              <Route path="batches" element={<MaintenanceGuard moduleKey="adminBatches"><AdminBatches /></MaintenanceGuard>} />
              <Route path="departments" element={<MaintenanceGuard moduleKey="adminDepartments"><AdminDepartmentsPage /></MaintenanceGuard>} />
              <Route path="trainings" element={<MaintenanceGuard moduleKey="adminC2C"><AdminTrainings /></MaintenanceGuard>} />
              <Route path="c2c" element={<MaintenanceGuard moduleKey="adminC2C"><AdminTrainings /></MaintenanceGuard>} />
              <Route path="attendance" element={<MaintenanceGuard moduleKey="adminAttendance"><AdminAttendance /></MaintenanceGuard>} />
              <Route path="learning" element={<MaintenanceGuard moduleKey="adminLearningContent"><AdminLearningContent /></MaintenanceGuard>} />
              <Route path="quiz" element={<MaintenanceGuard moduleKey="adminQuizzes"><AdminQuizzes /></MaintenanceGuard>} />
              <Route path="practice" element={<MaintenanceGuard moduleKey="adminPracticeProblems"><AdminPracticeProblems /></MaintenanceGuard>} />
              <Route path="coding-practice" element={<MaintenanceGuard moduleKey="adminPracticeProblems"><AdminPracticeProblems /></MaintenanceGuard>} />
              <Route path="broadcast" element={<MaintenanceGuard moduleKey="adminBroadcast"><AdminBroadcast /></MaintenanceGuard>} />
              <Route path="notifications" element={<MaintenanceGuard moduleKey="adminBroadcast"><AdminBroadcast /></MaintenanceGuard>} />
              <Route path="progress" element={<MaintenanceGuard moduleKey="adminProgress"><AdminProgress /></MaintenanceGuard>} />
              <Route path="leaderboard" element={<MaintenanceGuard moduleKey="adminLeaderboard"><AdminLeaderboard /></MaintenanceGuard>} />
              <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="adminWeeklyReports"><AdminWeeklyReports /></MaintenanceGuard>} />
              <Route path="defaulters" element={<MaintenanceGuard moduleKey="defaulters"><MentorDefaulters /></MaintenanceGuard>} />
              <Route path="help" element={<MaintenanceGuard moduleKey="adminHelp"><AdminHelp /></MaintenanceGuard>} />
              <Route path="profile" element={<MaintenanceGuard moduleKey="adminProfile"><AdminProfile /></MaintenanceGuard>} />
            </Route>

            {/* Mentor Workspace Routes */}
            <Route
              path="/mentor"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <MentorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MaintenanceGuard moduleKey="mentorDashboard"><MentorOverview /></MaintenanceGuard>} />
              <Route path="students" element={<MaintenanceGuard moduleKey="mentorStudents"><MentorStudents /></MaintenanceGuard>} />
              <Route path="quizzes" element={<MaintenanceGuard moduleKey="mentorQuizzes"><MentorQuizzes /></MaintenanceGuard>} />
              <Route path="assessments" element={<MaintenanceGuard moduleKey="mentorQuizzes"><MentorQuizzes /></MaintenanceGuard>} />
              <Route path="roadmaps" element={<MaintenanceGuard moduleKey="mentorRoadmaps"><MentorRoadmaps /></MaintenanceGuard>} />
              <Route path="ai-interviews" element={<MaintenanceGuard moduleKey="mentorAIInterviews"><MentorAIInterviews /></MaintenanceGuard>} />
              <Route path="skill-gaps" element={<MaintenanceGuard moduleKey="mentorSkillGaps"><MentorSkillGaps /></MaintenanceGuard>} />
              <Route path="attendance" element={<MaintenanceGuard moduleKey="mentorAttendance"><MentorAttendance /></MaintenanceGuard>} />
              <Route path="performance" element={<MaintenanceGuard moduleKey="mentorPerformance"><MentorPerformance /></MaintenanceGuard>} />
              <Route path="leaderboard" element={<MaintenanceGuard moduleKey="mentorLeaderboard"><MentorLeaderboard /></MaintenanceGuard>} />
              <Route path="defaulters" element={<MaintenanceGuard moduleKey="defaulters"><MentorDefaulters /></MaintenanceGuard>} />
              <Route path="study-material" element={<MaintenanceGuard moduleKey="mentorStudyMaterial"><MentorStudyMaterial /></MaintenanceGuard>} />
              <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="mentorWeeklyReports"><MentorWeeklyReports /></MaintenanceGuard>} />
              <Route path="batches" element={<MaintenanceGuard moduleKey="mentorStudents"><MentorBatches /></MaintenanceGuard>} />
              <Route path="assignments" element={<MaintenanceGuard moduleKey="mentorAssignments"><MentorAssignments /></MaintenanceGuard>} />
              <Route path="sessions" element={<MaintenanceGuard moduleKey="mentorSessions"><MentorLiveSessions /></MaintenanceGuard>} />
              <Route path="notifications" element={<MaintenanceGuard moduleKey="mentorNotifications"><MentorNotifications /></MaintenanceGuard>} />
              <Route path="broadcast" element={<MaintenanceGuard moduleKey="mentorBroadcast"><MentorBroadcast /></MaintenanceGuard>} />
              <Route path="profile" element={<MaintenanceGuard moduleKey="mentorProfile"><MentorProfilePage /></MaintenanceGuard>} />
              <Route path="settings" element={<MaintenanceGuard moduleKey="mentorProfile"><MentorProfilePage /></MaintenanceGuard>} />
              <Route path="help" element={<MaintenanceGuard moduleKey="mentorHelp"><MentorHelp /></MaintenanceGuard>} />
            </Route>

            {/* Coordinator Workspace Routes */}
            <Route
              path="/coordinator"
              element={
                <ProtectedRoute allowedRoles={["coordinator"]}>
                  <CoordinatorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MaintenanceGuard moduleKey="coordinatorDashboard"><CoordinatorOverview /></MaintenanceGuard>} />
              <Route path="batches" element={<MaintenanceGuard moduleKey="coordinatorBatches"><CoordinatorBatches /></MaintenanceGuard>} />
              <Route path="students" element={<MaintenanceGuard moduleKey="coordinatorStudents"><CoordinatorStudents /></MaintenanceGuard>} />
              <Route path="quizzes-and-codes" element={<MaintenanceGuard moduleKey="academicQuizzes"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
              <Route path="performances" element={<MaintenanceGuard moduleKey="coordinatorPerformances"><CoordinatorPerformances /></MaintenanceGuard>} />
              <Route path="practice" element={<MaintenanceGuard moduleKey="practiceCoding"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
              <Route path="coding-performance" element={<MaintenanceGuard moduleKey="coordinatorPerformances"><CoordinatorPerformances /></MaintenanceGuard>} />
              <Route path="assessments" element={<MaintenanceGuard moduleKey="academicQuizzes"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
              <Route path="interviews" element={<MaintenanceGuard moduleKey="coordinatorInterviewPerformance"><CoordinatorInterviewPerformance /></MaintenanceGuard>} />
              <Route path="improvement" element={<MaintenanceGuard moduleKey="coordinatorStudentsNeedImprovement"><CoordinatorStudentsNeedImprovement /></MaintenanceGuard>} />
              <Route path="attendance" element={<MaintenanceGuard moduleKey="coordinatorAttendance"><CoordinatorAttendance /></MaintenanceGuard>} />
              <Route path="mentors" element={<MaintenanceGuard moduleKey="coordinatorMentors"><CoordinatorMentors /></MaintenanceGuard>} />
              <Route path="requests" element={<MaintenanceGuard moduleKey="coordinatorRequests"><CoordinatorRequests /></MaintenanceGuard>} />
              <Route path="placement" element={<MaintenanceGuard moduleKey="coordinatorPlacement"><CoordinatorPlacement /></MaintenanceGuard>} />
              <Route path="notifications" element={<MaintenanceGuard moduleKey="coordinatorNotifications"><CoordinatorNotifications /></MaintenanceGuard>} />
              <Route path="broadcast" element={<MaintenanceGuard moduleKey="coordinatorBroadcast"><CoordinatorBroadcast /></MaintenanceGuard>} />
              <Route path="support" element={<MaintenanceGuard moduleKey="coordinatorHelp"><CoordinatorHelp /></MaintenanceGuard>} />
              <Route path="help" element={<MaintenanceGuard moduleKey="coordinatorHelp"><CoordinatorHelp /></MaintenanceGuard>} />
              <Route path="leaderboard" element={<MaintenanceGuard moduleKey="studentLeaderboard"><CoordinatorLeaderboard /></MaintenanceGuard>} />
              <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="mentorWeeklyReports"><AdminWeeklyReports /></MaintenanceGuard>} />
              <Route path="profile" element={<MaintenanceGuard moduleKey="coordinatorProfile"><CoordinatorProfilePage /></MaintenanceGuard>} />
              <Route path="settings" element={<MaintenanceGuard moduleKey="coordinatorProfile"><CoordinatorProfilePage /></MaintenanceGuard>} />
            </Route>

            {/* Super Admin Workspace Routes */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={["superadmin"]}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MaintenanceGuard moduleKey="superAdminOverview"><SuperAdminOverview /></MaintenanceGuard>} />
              <Route path="colleges" element={<MaintenanceGuard moduleKey="superAdminColleges"><CollegesPage /></MaintenanceGuard>} />
              <Route path="colleges/:collegeId" element={<MaintenanceGuard moduleKey="superAdminColleges"><CollegesPage /></MaintenanceGuard>} />
              <Route path="batches" element={<MaintenanceGuard moduleKey="superAdminBatches"><SuperAdminBatches /></MaintenanceGuard>} />
              <Route path="users" element={<MaintenanceGuard moduleKey="superAdminUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
              <Route path="approve-users" element={<MaintenanceGuard moduleKey="superAdminApproveUsers"><SuperAdminApproveUsers /></MaintenanceGuard>} />
              <Route path="verification" element={<MaintenanceGuard moduleKey="superAdminUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
              <Route path="coordinators" element={<MaintenanceGuard moduleKey="superAdminUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
              <Route path="mentors" element={<MaintenanceGuard moduleKey="superAdminUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
              <Route path="students" element={<MaintenanceGuard moduleKey="superAdminUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
              <Route path="tickets" element={<MaintenanceGuard moduleKey="superAdminTickets"><SuperAdminTickets /></MaintenanceGuard>} />
              <Route path="support" element={<MaintenanceGuard moduleKey="superAdminTickets"><SuperAdminTickets /></MaintenanceGuard>} />
              <Route path="maintenance" element={<SuperAdminMaintenanceControls />} />
              <Route path="leaderboard" element={<MaintenanceGuard moduleKey="adminLeaderboard"><AdminLeaderboard /></MaintenanceGuard>} />
              <Route path="attendance" element={<MaintenanceGuard moduleKey="superAdminPerformance"><SuperAdminPerformancePage /></MaintenanceGuard>} />
              <Route path="coding-practice" element={<MaintenanceGuard moduleKey="superAdminPerformance"><SuperAdminPerformancePage /></MaintenanceGuard>} />
              <Route path="ai-roadmaps" element={<MaintenanceGuard moduleKey="superAdminPerformance"><SuperAdminPerformancePage /></MaintenanceGuard>} />
              <Route path="ai-interviews" element={<MaintenanceGuard moduleKey="superAdminPerformance"><SuperAdminPerformancePage /></MaintenanceGuard>} />
              <Route path="health" element={<MaintenanceGuard moduleKey="superAdminSystemHealth"><SuperAdminSystemHealth /></MaintenanceGuard>} />
              <Route path="notifications" element={<MaintenanceGuard moduleKey="superAdminBroadcast"><AdminBroadcast /></MaintenanceGuard>} />
              <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="adminWeeklyReports"><AdminWeeklyReports /></MaintenanceGuard>} />
              <Route path="profile" element={<MaintenanceGuard moduleKey="superAdminProfile"><SuperAdminProfilePage /></MaintenanceGuard>} />
            </Route>
            <Route path="/superadmin/*" element={<Navigate to="/super-admin" replace />} />
            <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SystemMaintenanceProvider>
  );
}

export default App;
