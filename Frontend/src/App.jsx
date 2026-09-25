import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SystemMaintenanceProvider } from './context/SystemMaintenanceContext';
import MaintenanceGuard from './components/Common/MaintenanceGuard';
import Login from './pages/authentication/login';
import Register from './pages/authentication/register';
import StudentLayout from './pages/Student/Components/ST_Layout';
import Overview from "./pages/Student/Components/ST_Overview";
import AIRoadmap from "./pages/Student/Components/ST_AiRoadmap";
import LearningContent from "./pages/Student/Components/ST_LearningContent";
import AIInterview from "./pages/Student/Components/ST_AiInterview";
import ProgressAnalytics from "./pages/Student/Components/ST_ProgressAnalytics";
import Leaderboard from "./pages/Student/Components/ST_Leaderboard";
import WeeklyReports from "./pages/Student/Components/ST_WeeklyReports";
import Attendance from "./pages/Student/Components/ST_Attendance";
import Batches from "./pages/Student/Components/ST_Batches";
import PracticeProblems from "./pages/Student/Components/ST_PracticeProblems";
import CodingPlatform from "./pages/Student/Components/ST_CodingPlatform";
import Help from "./pages/Student/Components/ST_Help";
import Notifications from "./pages/Student/Components/ST_Notifications";
import ProfilePage from "./pages/Student/Components/ST_ProfilePage";
import AcademicQuiz from "./pages/Student/Components/ST_AcademicQuiz";
import Settings from "./pages/Student/Components/ST_Settings";
import StudentSkillGaps from "./pages/Student/Components/ST_SkillGaps";
import StudentMockDrives from "./pages/Student/Components/ST_MockDrives";

// Admin imports
import AdminLayout from "./pages/Admin/Components/AD_Layout";
import AdminOverview from "./pages/Admin/Components/AD_Overview";
import AdminUsers from "./pages/Admin/Components/AD_Users";
import AdminBatches from "./pages/Admin/Components/AD_Batches";
import AdminAttendance from "./pages/Admin/Components/AD_Attendance";
import AdminLearningContent from "./pages/Admin/Components/AD_LearningContent";
import AdminQuizzes from "./pages/Admin/Components/AD_Quizzes";
import AdminPracticeProblems from "./pages/Admin/Components/AD_PracticeProblems";
import AdminProgress from "./pages/Admin/Components/AD_Progress";
import AdminLeaderboard from "./pages/Admin/Components/AD_Leaderboard";
import AdminHelp from "./pages/Admin/Components/AD_Help";
import AdminProfile from './pages/Admin/Components/AD_Profile';
import AdminBroadcast from './pages/Admin/Components/AD_Broadcast';


// Super Admin Workspace Imports
import SuperAdminLayout from './pages/SuperAdmin/Components/SA_Layout';
import SuperAdminOverview from './pages/SuperAdmin/Components/SA_Overview';
import CollegesPage from './pages/SuperAdmin/Components/SA_Colleges';
import DepartmentsPage from './pages/SuperAdmin/Components/SA_Departments';
import SuperAdminBatches from './pages/SuperAdmin/Components/SA_Batches';
import SuperAdminManageUsers from './pages/SuperAdmin/Components/SA_ManageUsers';
import SuperAdminPerformancePage from './pages/SuperAdmin/Components/SA_Performance';
import SuperAdminSystemHealth from './pages/SuperAdmin/Components/SA_SystemHealth';
import SuperAdminProfilePage from './pages/SuperAdmin/Components/SA_Profile';
import SuperAdminMaintenanceControls from './pages/SuperAdmin/Components/SA_MaintenanceControls';
import SuperAdminTickets from './pages/SuperAdmin/Components/SA_Tickets';

// Mentor Workspace Imports
import MentorLayout from './pages/Mentor/Components/MN_Layout';
import MentorOverview from './pages/Mentor/Components/MN_Overview';
import MentorBatches from './pages/Mentor/Components/MN_Batches';
import MentorStudents from './pages/Mentor/Components/MN_Students';
import MentorRoadmaps from './pages/Mentor/Components/MN_Roadmaps';
import MentorAIInterviews from './pages/Mentor/Components/MN_AIInterviews';
import MentorSkillGaps from './pages/Mentor/Components/MN_SkillGaps';
import MentorAttendance from './pages/Mentor/Components/MN_Attendance';
import MentorLeaderboard from './pages/Mentor/Components/MN_Leaderboard';
import MentorMockDrives from './pages/Mentor/Components/MN_MockDrives';
import MentorDefaulters from './pages/Mentor/Components/MN_Defaulters';
import MentorStudyMaterial from './pages/Mentor/Components/MN_StudyMaterial';
import MentorWeeklyReports from './pages/Mentor/Components/MN_WeeklyReports';
import MentorAssignments from './pages/Mentor/Components/MN_Assignments';
import MentorLiveSessions from './pages/Mentor/Components/MN_LiveSessions';
import MentorNotifications from './pages/Mentor/Components/MN_Notifications';
import MentorProfilePage from './pages/Mentor/Components/MN_ProfilePage';
import MentorHelp from './pages/Mentor/Components/MN_Help';
import MentorQuizzes from './pages/Mentor/Components/MN_Quizzes';
import MentorPerformance from './pages/Mentor/Components/MN_Performance';

// Coordinator Workspace Imports
import CoordinatorLayout from './pages/Coordinator/Components/CO_Layout';
import CoordinatorOverview from './pages/Coordinator/Components/CO_Overview';
import CoordinatorBatches from './pages/Coordinator/Components/CO_Batches';
import CoordinatorStudents from './pages/Coordinator/Components/CO_Students';
import CoordinatorInterviewPerformance from './pages/Coordinator/Components/CO_InterviewPerformance';
import CoordinatorStudentsNeedImprovement from './pages/Coordinator/Components/CO_StudentsNeedImprovement';
import CoordinatorMentors from './pages/Coordinator/Components/CO_Mentors';
import CoordinatorAttendance from './pages/Coordinator/Components/CO_Attendance';
import CoordinatorPlacement from './pages/Coordinator/Components/CO_Placement';
import CoordinatorRequests from './pages/Coordinator/Components/CO_Requests';
import CoordinatorNotifications from './pages/Coordinator/Components/CO_Notifications';
import CoordinatorProfilePage from './pages/Coordinator/Components/CO_ProfilePage';
import CoordinatorQuizAndCodes from './pages/Coordinator/Components/CO_QuizzesAndCodes';
import CoordinatorPerformances from './pages/Coordinator/Components/CO_Performances';
import CoordinatorHelp from './pages/Coordinator/Components/CO_Help';
import MentorBroadcast from './pages/Mentor/Components/MN_Broadcast';
import CoordinatorBroadcast from './pages/Coordinator/Components/CO_Broadcast';

function App() {
  return (
    <SystemMaintenanceProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<MaintenanceGuard moduleKey="loginWithPassword"><Login /></MaintenanceGuard>} />
          <Route path="/register" element={<MaintenanceGuard moduleKey="userRegistration"><Register /></MaintenanceGuard>} />
          
          {/* Student Workspace Routes */}
          <Route
            path="/student"
            element={
              <MaintenanceGuard moduleKey="studentDashboard">
                <StudentLayout />
              </MaintenanceGuard>
            }
          >
            <Route index element={<Overview />} />
            <Route path="roadmap" element={<MaintenanceGuard moduleKey="aiRoadmaps"><AIRoadmap /></MaintenanceGuard>} />
            <Route path="learning" element={<MaintenanceGuard moduleKey="learningContent"><LearningContent /></MaintenanceGuard>} />
            <Route path="ai-interview" element={<MaintenanceGuard moduleKey="aiInterviews"><AIInterview /></MaintenanceGuard>} />
            <Route path="progress" element={<MaintenanceGuard moduleKey="skillGapAnalysis"><ProgressAnalytics /></MaintenanceGuard>} />
            <Route path="quiz" element={<MaintenanceGuard moduleKey="academicQuizzes"><AcademicQuiz /></MaintenanceGuard>} />
            <Route path="attendance" element={<MaintenanceGuard moduleKey="attendance"><Attendance /></MaintenanceGuard>} />
            <Route path="skill-gaps" element={<MaintenanceGuard moduleKey="studentSkillGaps"><StudentSkillGaps /></MaintenanceGuard>} />
            <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="weeklyReports"><WeeklyReports /></MaintenanceGuard>} />
            <Route path="mock-drives" element={<MaintenanceGuard moduleKey="mockDrives"><StudentMockDrives /></MaintenanceGuard>} />
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
          <Route path="/admin" element={<MaintenanceGuard moduleKey="adminDashboard"><AdminLayout /></MaintenanceGuard>}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<MaintenanceGuard moduleKey="manageUsers"><AdminUsers /></MaintenanceGuard>} />
            <Route path="batches" element={<MaintenanceGuard moduleKey="adminBatches"><AdminBatches /></MaintenanceGuard>} />
            <Route path="attendance" element={<MaintenanceGuard moduleKey="adminAttendance"><AdminAttendance /></MaintenanceGuard>} />
            <Route path="learning" element={<MaintenanceGuard moduleKey="adminLearningContent"><AdminLearningContent /></MaintenanceGuard>} />
            <Route path="quiz" element={<MaintenanceGuard moduleKey="adminQuizzes"><AdminQuizzes /></MaintenanceGuard>} />
            <Route path="practice" element={<MaintenanceGuard moduleKey="adminPracticeProblems"><AdminPracticeProblems /></MaintenanceGuard>} />
            <Route path="coding-practice" element={<MaintenanceGuard moduleKey="adminPracticeProblems"><AdminPracticeProblems /></MaintenanceGuard>} />
            <Route path="broadcast" element={<MaintenanceGuard moduleKey="adminBroadcast"><AdminBroadcast /></MaintenanceGuard>} />
            <Route path="progress" element={<MaintenanceGuard moduleKey="adminProgress"><AdminProgress /></MaintenanceGuard>} />
            <Route path="defaulters" element={<MaintenanceGuard moduleKey="adminDefaulters"><MentorDefaulters /></MaintenanceGuard>} />
            <Route path="mock-drives" element={<MaintenanceGuard moduleKey="adminMockDrives"><MentorMockDrives /></MaintenanceGuard>} />
            <Route path="help" element={<MaintenanceGuard moduleKey="adminHelp"><AdminHelp /></MaintenanceGuard>} />
            <Route path="profile" element={<MaintenanceGuard moduleKey="adminProfile"><AdminProfile /></MaintenanceGuard>} />
          </Route>

          {/* Mentor Workspace Routes */}
          <Route
            path="/mentor"
            element={
              <MaintenanceGuard moduleKey="mentorDashboard">
                <MentorLayout />
              </MaintenanceGuard>
            }
          >
            <Route index element={<MentorOverview />} />
            <Route path="students" element={<MaintenanceGuard moduleKey="mentorStudents"><MentorStudents /></MaintenanceGuard>} />
            <Route path="quizzes" element={<MaintenanceGuard moduleKey="mentorQuizzes"><MentorQuizzes /></MaintenanceGuard>} />
            <Route path="assessments" element={<MaintenanceGuard moduleKey="mentorQuizzes"><MentorQuizzes /></MaintenanceGuard>} />
            <Route path="roadmaps" element={<MaintenanceGuard moduleKey="mentorRoadmaps"><MentorRoadmaps /></MaintenanceGuard>} />
            <Route path="ai-interviews" element={<MaintenanceGuard moduleKey="mentorAIInterviews"><MentorAIInterviews /></MaintenanceGuard>} />
            <Route path="skill-gaps" element={<MaintenanceGuard moduleKey="mentorSkillGaps"><MentorSkillGaps /></MaintenanceGuard>} />
            <Route path="attendance" element={<MaintenanceGuard moduleKey="mentorAttendance"><MentorAttendance /></MaintenanceGuard>} />
            <Route path="performance" element={<MaintenanceGuard moduleKey="mentorPerformance"><MentorPerformance /></MaintenanceGuard>} />
            <Route path="leaderboard" element={<MaintenanceGuard moduleKey="mentorLeaderboard"><MentorLeaderboard /></MaintenanceGuard>} />
            <Route path="mock-drives" element={<MaintenanceGuard moduleKey="mentorMockDrives"><MentorMockDrives /></MaintenanceGuard>} />
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
              <MaintenanceGuard moduleKey="coordinatorDashboard">
                <CoordinatorLayout />
              </MaintenanceGuard>
            }
          >
            <Route index element={<CoordinatorOverview />} />
            <Route path="batches" element={<MaintenanceGuard moduleKey="coordinatorBatches"><CoordinatorBatches /></MaintenanceGuard>} />
            <Route path="students" element={<MaintenanceGuard moduleKey="coordinatorStudents"><CoordinatorStudents /></MaintenanceGuard>} />
            <Route path="quizzes-and-codes" element={<MaintenanceGuard moduleKey="coordinatorPerformances"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
            <Route path="performances" element={<MaintenanceGuard moduleKey="coordinatorPerformances"><CoordinatorPerformances /></MaintenanceGuard>} />
            <Route path="practice" element={<MaintenanceGuard moduleKey="coordinatorPerformances"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
            <Route path="coding-performance" element={<MaintenanceGuard moduleKey="coordinatorPerformances"><CoordinatorPerformances /></MaintenanceGuard>} />
            <Route path="assessments" element={<MaintenanceGuard moduleKey="coordinatorPerformances"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
            <Route path="interviews" element={<MaintenanceGuard moduleKey="coordinatorInterviewPerformance"><CoordinatorInterviewPerformance /></MaintenanceGuard>} />
            <Route path="improvement" element={<MaintenanceGuard moduleKey="coordinatorStudentsNeedImprovement"><CoordinatorStudentsNeedImprovement /></MaintenanceGuard>} />
            <Route path="attendance" element={<MaintenanceGuard moduleKey="coordinatorAttendance"><CoordinatorAttendance /></MaintenanceGuard>} />
            <Route path="mentors" element={<MaintenanceGuard moduleKey="coordinatorMentors"><CoordinatorMentors /></MaintenanceGuard>} />
            <Route path="requests" element={<MaintenanceGuard moduleKey="coordinatorRequests"><CoordinatorRequests /></MaintenanceGuard>} />
            <Route path="notifications" element={<MaintenanceGuard moduleKey="coordinatorBroadcast"><CoordinatorNotifications /></MaintenanceGuard>} />
            <Route path="broadcast" element={<MaintenanceGuard moduleKey="coordinatorBroadcast"><CoordinatorBroadcast /></MaintenanceGuard>} />
            <Route path="placement" element={<MaintenanceGuard moduleKey="coordinatorPlacement"><CoordinatorPlacement /></MaintenanceGuard>} />
            <Route path="support" element={<MaintenanceGuard moduleKey="coordinatorHelp"><CoordinatorHelp /></MaintenanceGuard>} />
            <Route path="help" element={<MaintenanceGuard moduleKey="coordinatorHelp"><CoordinatorHelp /></MaintenanceGuard>} />
            <Route path="profile" element={<MaintenanceGuard moduleKey="coordinatorProfile"><CoordinatorProfilePage /></MaintenanceGuard>} />
            <Route path="settings" element={<MaintenanceGuard moduleKey="coordinatorProfile"><CoordinatorProfilePage /></MaintenanceGuard>} />
          </Route>

          {/* Super Admin Workspace Routes */}
          <Route path="/super-admin" element={<MaintenanceGuard moduleKey="superAdminDashboard"><SuperAdminLayout /></MaintenanceGuard>}>
            <Route index element={<SuperAdminOverview />} />
            <Route path="colleges" element={<MaintenanceGuard moduleKey="collegesPage"><CollegesPage /></MaintenanceGuard>} />
            <Route path="colleges/:collegeId" element={<MaintenanceGuard moduleKey="collegesPage"><CollegesPage /></MaintenanceGuard>} />
            <Route path="departments" element={<MaintenanceGuard moduleKey="departmentsPage"><DepartmentsPage /></MaintenanceGuard>} />
            <Route path="batches" element={<MaintenanceGuard moduleKey="superAdminBatches"><SuperAdminBatches /></MaintenanceGuard>} />
            <Route path="users" element={<MaintenanceGuard moduleKey="superAdminManageUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
            <Route path="verification" element={<MaintenanceGuard moduleKey="superAdminManageUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
            <Route path="coordinators" element={<MaintenanceGuard moduleKey="superAdminManageUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
            <Route path="mentors" element={<MaintenanceGuard moduleKey="superAdminManageUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
            <Route path="students" element={<MaintenanceGuard moduleKey="superAdminManageUsers"><SuperAdminManageUsers /></MaintenanceGuard>} />
            <Route path="tickets" element={<MaintenanceGuard moduleKey="superAdminTickets"><SuperAdminTickets /></MaintenanceGuard>} />
            <Route path="support" element={<MaintenanceGuard moduleKey="superAdminTickets"><SuperAdminTickets /></MaintenanceGuard>} />
            <Route path="maintenance" element={<MaintenanceGuard moduleKey="featureSwitches"><SuperAdminMaintenanceControls /></MaintenanceGuard>} />
            <Route path="performance" element={<MaintenanceGuard moduleKey="systemHealth"><SuperAdminPerformancePage /></MaintenanceGuard>} />
            <Route path="health" element={<MaintenanceGuard moduleKey="systemHealth"><SuperAdminSystemHealth /></MaintenanceGuard>} />
            <Route path="profile" element={<SuperAdminProfilePage />} />
          </Route>
          <Route path="/superadmin/*" element={<Navigate to="/super-admin" replace />} />
          <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SystemMaintenanceProvider>
  );
}

export default App;
