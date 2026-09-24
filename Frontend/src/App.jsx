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
import AdminWeeklyReports from "./pages/Admin/Components/AD_WeeklyReports";
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
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
            <Route path="leaderboard" element={<MaintenanceGuard moduleKey="leaderboards"><Leaderboard /></MaintenanceGuard>} />
            <Route path="quiz" element={<MaintenanceGuard moduleKey="academicQuizzes"><AcademicQuiz /></MaintenanceGuard>} />
            <Route path="attendance" element={<MaintenanceGuard moduleKey="attendance"><Attendance /></MaintenanceGuard>} />
            <Route path="skill-gaps" element={<StudentSkillGaps />} />
            <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="weeklyReports"><WeeklyReports /></MaintenanceGuard>} />
            <Route path="mock-drives" element={<MaintenanceGuard moduleKey="mockDrives"><StudentMockDrives /></MaintenanceGuard>} />
            <Route path="batches" element={<Batches />} />
            <Route path="practice" element={<MaintenanceGuard moduleKey="practiceCoding"><PracticeProblems /></MaintenanceGuard>} />
            <Route path="coding-platform/:taskId" element={<MaintenanceGuard moduleKey="practiceCoding"><CodingPlatform /></MaintenanceGuard>} />
            <Route path="coding-platform" element={<MaintenanceGuard moduleKey="practiceCoding"><CodingPlatform /></MaintenanceGuard>} />
            <Route path="help" element={<Help />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="batches" element={<AdminBatches />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="learning" element={<AdminLearningContent />} />
            <Route path="quiz" element={<AdminQuizzes />} />
            <Route path="practice" element={<AdminPracticeProblems />} />
            <Route path="coding-practice" element={<AdminPracticeProblems />} />
            <Route path="broadcast" element={<AdminBroadcast />} />
            <Route path="notifications" element={<AdminBroadcast />} />
            <Route path="progress" element={<AdminProgress />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="weekly-reports" element={<AdminWeeklyReports />} />
            <Route path="defaulters" element={<MentorDefaulters />} />
            <Route path="mock-drives" element={<MentorMockDrives />} />
            <Route path="help" element={<AdminHelp />} />
            <Route path="profile" element={<AdminProfile />} />
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
            <Route path="students" element={<MentorStudents />} />
            <Route path="quizzes" element={<MentorQuizzes />} />
            <Route path="assessments" element={<MentorQuizzes />} />
            <Route path="roadmaps" element={<MaintenanceGuard moduleKey="aiRoadmaps"><MentorRoadmaps /></MaintenanceGuard>} />
            <Route path="ai-interviews" element={<MaintenanceGuard moduleKey="aiInterviews"><MentorAIInterviews /></MaintenanceGuard>} />
            <Route path="skill-gaps" element={<MaintenanceGuard moduleKey="skillGapAnalysis"><MentorSkillGaps /></MaintenanceGuard>} />
            <Route path="attendance" element={<MaintenanceGuard moduleKey="attendance"><MentorAttendance /></MaintenanceGuard>} />
            <Route path="performance" element={<MentorPerformance />} />
            <Route path="leaderboard" element={<MaintenanceGuard moduleKey="leaderboards"><MentorLeaderboard /></MaintenanceGuard>} />
            <Route path="mock-drives" element={<MaintenanceGuard moduleKey="mockDrives"><MentorMockDrives /></MaintenanceGuard>} />
            <Route path="defaulters" element={<MaintenanceGuard moduleKey="defaulters"><MentorDefaulters /></MaintenanceGuard>} />
            <Route path="study-material" element={<MaintenanceGuard moduleKey="learningContent"><MentorStudyMaterial /></MaintenanceGuard>} />
            <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="weeklyReports"><MentorWeeklyReports /></MaintenanceGuard>} />
            <Route path="batches" element={<MentorBatches />} />
            <Route path="assignments" element={<MentorAssignments />} />
            <Route path="sessions" element={<MentorLiveSessions />} />
            <Route path="notifications" element={<MentorNotifications />} />
            <Route path="broadcast" element={<MentorBroadcast />} />
            <Route path="profile" element={<MentorProfilePage />} />
            <Route path="settings" element={<MentorProfilePage />} />
            <Route path="help" element={<MentorHelp />} />
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
            <Route path="batches" element={<CoordinatorBatches />} />
            <Route path="students" element={<CoordinatorStudents />} />
            <Route path="quizzes-and-codes" element={<MaintenanceGuard moduleKey="academicQuizzes"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
            <Route path="performances" element={<MaintenanceGuard moduleKey="practiceCoding"><CoordinatorPerformances /></MaintenanceGuard>} />
            <Route path="practice" element={<MaintenanceGuard moduleKey="practiceCoding"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
            <Route path="coding-performance" element={<MaintenanceGuard moduleKey="practiceCoding"><CoordinatorPerformances /></MaintenanceGuard>} />
            <Route path="assessments" element={<MaintenanceGuard moduleKey="academicQuizzes"><CoordinatorQuizAndCodes /></MaintenanceGuard>} />
            <Route path="interviews" element={<MaintenanceGuard moduleKey="aiInterviews"><CoordinatorInterviewPerformance /></MaintenanceGuard>} />
            <Route path="improvement" element={<MaintenanceGuard moduleKey="defaulters"><CoordinatorStudentsNeedImprovement /></MaintenanceGuard>} />
            <Route path="attendance" element={<CoordinatorAttendance />} />
            <Route path="mentors" element={<CoordinatorMentors />} />
            <Route path="requests" element={<CoordinatorRequests />} />
            <Route path="placement" element={<CoordinatorPlacement />} />
            <Route path="notifications" element={<CoordinatorNotifications />} />
            <Route path="broadcast" element={<CoordinatorBroadcast />} />
            <Route path="support" element={<CoordinatorHelp />} />
            <Route path="help" element={<CoordinatorHelp />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="weekly-reports" element={<AdminWeeklyReports />} />
            <Route path="profile" element={<CoordinatorProfilePage />} />
            <Route path="settings" element={<CoordinatorProfilePage />} />
          </Route>



          {/* Super Admin Workspace Routes */}
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminOverview />} />
            <Route path="colleges" element={<CollegesPage />} />
            <Route path="colleges/:collegeId" element={<CollegesPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="batches" element={<SuperAdminBatches />} />
            <Route path="users" element={<SuperAdminManageUsers />} />
            <Route path="verification" element={<SuperAdminManageUsers />} />
            <Route path="coordinators" element={<SuperAdminManageUsers />} />
            <Route path="mentors" element={<SuperAdminManageUsers />} />
            <Route path="students" element={<SuperAdminManageUsers />} />
            <Route path="tickets" element={<SuperAdminTickets />} />
            <Route path="support" element={<SuperAdminTickets />} />
            <Route path="maintenance" element={<SuperAdminMaintenanceControls />} />
            <Route path="performance" element={<SuperAdminPerformancePage />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="attendance" element={<SuperAdminPerformancePage />} />
            <Route path="coding-practice" element={<SuperAdminPerformancePage />} />
            <Route path="ai-roadmaps" element={<SuperAdminPerformancePage />} />
            <Route path="ai-interviews" element={<SuperAdminPerformancePage />} />
            <Route path="mock-drives" element={<SuperAdminPerformancePage />} />
            <Route path="health" element={<SuperAdminSystemHealth />} />
            <Route path="notifications" element={<AdminBroadcast />} />
            <Route path="weekly-reports" element={<AdminWeeklyReports />} />
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
