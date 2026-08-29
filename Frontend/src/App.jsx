import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Super Admin Workspace Imports
import SuperAdminLayout from './pages/SuperAdmin/SuperAdminLayout';
import SuperAdminOverview from './pages/SuperAdmin/Overview';
import CollegesPage from './pages/SuperAdmin/Colleges';
import DepartmentsPage from './pages/SuperAdmin/Departments';
import SuperAdminBatches from './pages/SuperAdmin/Batches';
import AdminVerificationPage from './pages/SuperAdmin/AdminVerification';
import CoordinatorsPage from './pages/SuperAdmin/Coordinators';
import MentorsTrainersPage from './pages/SuperAdmin/MentorsTrainers';
import StudentsRiskPage from './pages/SuperAdmin/Students';
import SuperAdminPerformancePage from './pages/SuperAdmin/Performance';
import SuperAdminAttendancePage from './pages/SuperAdmin/Attendance';
import SuperAdminAIRoadmapsPage from './pages/SuperAdmin/AIRoadmaps';
import SuperAdminAIInterviewsPage from './pages/SuperAdmin/AIInterviews';
import SuperAdminMockDrivesPage from './pages/SuperAdmin/MockDrives';
import SuperAdminWeeklyReportsPage from './pages/SuperAdmin/WeeklyReports';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Student Workspace Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Overview />} />
          <Route path="roadmap" element={<AIRoadmap />} />
          <Route path="learning" element={<LearningContent />} />
          <Route path="ai-interview" element={<AIInterview />} />
          <Route path="progress" element={<ProgressAnalytics />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="quiz" element={<AcademicQuiz />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="weekly-reports" element={<WeeklyReports />} />
          <Route path="batches" element={<Batches />} />
          <Route path="practice" element={<PracticeProblems />} />
          <Route path="coding-platform/:taskId" element={<CodingPlatform />} />
          <Route path="coding-platform" element={<CodingPlatform />} />
          <Route path="help" element={<Help />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<ProfilePage />} />
        </Route>

        {/* Mentor Workspace Routes */}
        <Route path="/mentor" element={<MentorLayout />}>
          <Route index element={<MentorOverview />} />
          <Route path="students" element={<MentorStudents />} />
          <Route path="roadmaps" element={<MentorRoadmaps />} />
          <Route path="ai-interviews" element={<MentorAIInterviews />} />
          <Route path="skill-gaps" element={<MentorSkillGaps />} />
          <Route path="attendance" element={<MentorAttendance />} />
          <Route path="leaderboard" element={<MentorLeaderboard />} />
          <Route path="mock-drives" element={<MentorMockDrives />} />
          <Route path="defaulters" element={<MentorDefaulters />} />
          <Route path="study-material" element={<MentorStudyMaterial />} />
          <Route path="weekly-reports" element={<MentorWeeklyReports />} />
          <Route path="batches" element={<MentorBatches />} />
          <Route path="assignments" element={<MentorAssignments />} />
          <Route path="sessions" element={<MentorLiveSessions />} />
          <Route path="notifications" element={<MentorNotifications />} />
          <Route path="profile" element={<MentorProfilePage />} />
          <Route path="settings" element={<MentorProfilePage />} />
          <Route path="help" element={<MentorHelp />} />
        </Route>

        {/* Super Admin Workspace Routes */}
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminOverview />} />
          <Route path="colleges" element={<CollegesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="batches" element={<SuperAdminBatches />} />
          <Route path="verification" element={<AdminVerificationPage />} />
          <Route path="coordinators" element={<CoordinatorsPage />} />
          <Route path="mentors" element={<MentorsTrainersPage />} />
          <Route path="students" element={<StudentsRiskPage />} />
          <Route path="performance" element={<SuperAdminPerformancePage />} />
          <Route path="attendance" element={<SuperAdminAttendancePage />} />
          <Route path="ai-roadmaps" element={<SuperAdminAIRoadmapsPage />} />
          <Route path="ai-interviews" element={<SuperAdminAIInterviewsPage />} />
          <Route path="mock-drives" element={<SuperAdminMockDrivesPage />} />
          <Route path="weekly-reports" element={<SuperAdminWeeklyReportsPage />} />
        </Route>
        <Route path="/superadmin/*" element={<Navigate to="/super-admin" replace />} />
        <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
