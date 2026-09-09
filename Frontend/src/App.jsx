import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SystemMaintenanceProvider } from './context/SystemMaintenanceContext';
import MaintenanceGuard from './components/Common/MaintenanceGuard';
import Login from './pages/authentication/login';
import Register from './pages/authentication/register';
import StudentLayout from './pages/Student/Components/StudentLayout';
import Overview from "./pages/Student/Components/Overview";
import AIRoadmap from "./pages/Student/Components/AiRoadmap";
import LearningContent from "./pages/Student/Components/LearningContent";
import AIInterview from "./pages/Student/Components/AiInterview";
import ProgressAnalytics from "./pages/Student/Components/ProgressAnalytics";
import Leaderboard from "./pages/Student/Components/Leaderboard";
import WeeklyReports from "./pages/Student/Components/WeeklyReports";
import Attendance from "./pages/Student/Components/Attendance";
import Batches from "./pages/Student/Components/Batches";
import PracticeProblems from "./pages/Student/Components/PracticeProblems";
import CodingPlatform from "./pages/Student/Components/CodingPlatform";
import Help from "./pages/Student/Components/Help";
import Notifications from "./pages/Student/Components/Notifications";
import ProfilePage from "./pages/Student/Components/ProfilePage";
import AcademicQuiz from "./pages/Student/Components/AcademicQuiz";
import Settings from "./pages/Student/Components/Settings";
import StudentSkillGaps from "./pages/Student/Components/StudentSkillGaps";

// Admin imports
import AdminLayout from "./pages/Admin/Components/AdminLayout";
import AdminOverview from "./pages/Admin/Components/AdminOverview";
import AdminUsers from "./pages/Admin/Components/AdminUsers";
import AdminBatches from "./pages/Admin/Components/AdminBatches";
import AdminAttendance from "./pages/Admin/Components/AdminAttendance";
import AdminLearningContent from "./pages/Admin/Components/AdminLearningContent";
import AdminQuizzes from "./pages/Admin/Components/AdminQuizzes";
import AdminPracticeProblems from "./pages/Admin/Components/AdminPracticeProblems";
import AdminProgress from "./pages/Admin/Components/AdminProgress";
import AdminLeaderboard from "./pages/Admin/Components/AdminLeaderboard";
import AdminWeeklyReports from "./pages/Admin/Components/AdminWeeklyReports";
import AdminHelp from "./pages/Admin/Components/AdminHelp";
import AdminProfile from './pages/Admin/Components/AdminProfile';
import AdminBroadcast from './pages/Admin/Components/AdminBroadcast';


// Super Admin Workspace Imports
import SuperAdminLayout from './pages/SuperAdmin/SuperAdminLayout';
import SuperAdminOverview from './pages/SuperAdmin/Overview';
import CollegesPage from './pages/SuperAdmin/Colleges';
import CollegeDepartments from './pages/SuperAdmin/CollegeDepartments';
import DepartmentsPage from './pages/SuperAdmin/Departments';
import SuperAdminBatches from './pages/SuperAdmin/Batches';
import AdminVerificationPage from './pages/SuperAdmin/AdminVerification';
import CoordinatorsPage from './pages/SuperAdmin/Coordinators';
import MentorsTrainersPage from './pages/SuperAdmin/MentorsTrainers';
import StudentsRiskPage from './pages/SuperAdmin/Students';
import SuperAdminManageUsers from './pages/SuperAdmin/ManageUsers';
import SuperAdminPerformancePage from './pages/SuperAdmin/Performance';
import SuperAdminAttendancePage from './pages/SuperAdmin/Attendance';
import SuperAdminAIRoadmapsPage from './pages/SuperAdmin/AIRoadmaps';
import SuperAdminAIInterviewsPage from './pages/SuperAdmin/AIInterviews';
import SuperAdminMockDrivesPage from './pages/SuperAdmin/MockDrives';
import SuperAdminWeeklyReportsPage from './pages/SuperAdmin/WeeklyReports';
import SuperAdminSystemHealth from './pages/SuperAdmin/SystemHealth';
import SuperAdminProfilePage from './pages/SuperAdmin/SuperAdminProfile';
import SuperAdminMaintenanceControls from './pages/SuperAdmin/MaintenanceControls';
import SuperAdminCodingPracticeMonitoring from './pages/SuperAdmin/CodingPracticeMonitoring';


// Mentor Workspace Imports
import MentorLayout from './pages/Mentor/Components/MentorLayout';
import MentorOverview from './pages/Mentor/Components/Overview';
import MentorBatches from './pages/Mentor/Components/Batches';
import MentorStudents from './pages/Mentor/Components/Students';
import MentorRoadmaps from './pages/Mentor/Components/Roadmaps';
import MentorAIInterviews from './pages/Mentor/Components/AIInterviews';
import MentorSkillGaps from './pages/Mentor/Components/SkillGaps';
import MentorAttendance from './pages/Mentor/Components/Attendance';
import MentorLeaderboard from './pages/Mentor/Components/Leaderboard';
import MentorMockDrives from './pages/Mentor/Components/MockDrives';
import MentorDefaulters from './pages/Mentor/Components/Defaulters';
import MentorStudyMaterial from './pages/Mentor/Components/StudyMaterial';
import MentorWeeklyReports from './pages/Mentor/Components/WeeklyReports';
import MentorAssignments from './pages/Mentor/Components/Assignments';
import MentorLiveSessions from './pages/Mentor/Components/LiveSessions';
import MentorNotifications from './pages/Mentor/Components/Notifications';
import MentorProfilePage from './pages/Mentor/Components/ProfilePage';
import MentorHelp from './pages/Mentor/Components/Help';
import MentorQuizzes from './pages/Mentor/Components/MentorQuizzes';
import MentorPerformance from './pages/Mentor/Components/Performance';

// Coordinator Workspace Imports
import CoordinatorLayout from './pages/Coordinator/Components/CoordinatorLayout';
import CoordinatorOverview from './pages/Coordinator/Components/Overview';
import CoordinatorBatches from './pages/Coordinator/Components/Batches';
import CoordinatorStudents from './pages/Coordinator/Components/Students';
import CoordinatorCodingPractice from './pages/Coordinator/Components/CodingPractice';
import CoordinatorCodingPerformance from './pages/Coordinator/Components/CodingPerformance';
import CoordinatorInterviewPerformance from './pages/Coordinator/Components/InterviewPerformance';
import CoordinatorStudentsNeedImprovement from './pages/Coordinator/Components/StudentsNeedImprovement';
import CoordinatorMentors from './pages/Coordinator/Components/Mentors';
import CoordinatorAssessments from './pages/Coordinator/Components/Assessments';
import CoordinatorAttendance from './pages/Coordinator/Components/Attendance';
import CoordinatorPlacement from './pages/Coordinator/Components/Placement';
import CoordinatorRequests from './pages/Coordinator/Components/Requests';
import CoordinatorNotifications from './pages/Coordinator/Components/Notifications';
import CoordinatorProfilePage from './pages/Coordinator/Components/ProfilePage';
import CoordinatorQuizAndCodes from './pages/Coordinator/Components/QuizzesAndCodes';
import CoordinatorPerformances from './pages/Coordinator/Components/Performances';

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
            <Route path="progress" element={<AdminProgress />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="weekly-reports" element={<AdminWeeklyReports />} />
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
            <Route path="leaderboard" element={<MaintenanceGuard moduleKey="leaderboards"><MentorLeaderboard /></MaintenanceGuard>} />
            <Route path="mock-drives" element={<MaintenanceGuard moduleKey="mockDrives"><MentorMockDrives /></MaintenanceGuard>} />
            <Route path="defaulters" element={<MaintenanceGuard moduleKey="defaulters"><MentorDefaulters /></MaintenanceGuard>} />
            <Route path="study-material" element={<MaintenanceGuard moduleKey="learningContent"><MentorStudyMaterial /></MaintenanceGuard>} />
            <Route path="weekly-reports" element={<MaintenanceGuard moduleKey="weeklyReports"><MentorWeeklyReports /></MaintenanceGuard>} />
            <Route path="batches" element={<MentorBatches />} />
            <Route path="assignments" element={<MentorAssignments />} />
            <Route path="sessions" element={<MentorLiveSessions />} />
            <Route path="notifications" element={<MentorNotifications />} />
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
            <Route path="notifications" element={<CoordinatorNotifications />} />
            <Route path="profile" element={<CoordinatorProfilePage />} />
            <Route path="settings" element={<CoordinatorProfilePage />} />
          </Route>


          {/* Super Admin Workspace Routes */}
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminOverview />} />
            <Route path="colleges" element={<CollegesPage />} />
            <Route path="colleges/:collegeId" element={<CollegeDepartments />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="batches" element={<SuperAdminBatches />} />
            <Route path="users" element={<SuperAdminManageUsers />} />
            <Route path="verification" element={<SuperAdminManageUsers />} />
            <Route path="coordinators" element={<SuperAdminManageUsers />} />
            <Route path="mentors" element={<SuperAdminManageUsers />} />
            <Route path="students" element={<SuperAdminManageUsers />} />
            <Route path="maintenance" element={<SuperAdminMaintenanceControls />} />
            <Route path="performance" element={<SuperAdminPerformancePage />} />
            <Route path="attendance" element={<SuperAdminAttendancePage />} />
            <Route path="coding-practice" element={<SuperAdminCodingPracticeMonitoring />} />
            <Route path="ai-roadmaps" element={<SuperAdminAIRoadmapsPage />} />
            <Route path="ai-interviews" element={<SuperAdminAIInterviewsPage />} />
            <Route path="mock-drives" element={<SuperAdminMockDrivesPage />} />
            <Route path="health" element={<SuperAdminSystemHealth />} />
            <Route path="weekly-reports" element={<SuperAdminWeeklyReportsPage />} />
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
