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
import Settings from "./pages/Student/Components/Settings";

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

import CoordinatorLayout from './pages/Coordinator/Component/CoordinatorLayout';
import CoordinatorOverview from './pages/Coordinator/Component/CoordinatorOverview';
import CoordinatorBatches from './pages/Coordinator/Component/CoordinatorBatches';
import CoordinatorAttendance from './pages/Coordinator/Component/CoordinatorAttendance';
import CoordinatorWeeklyReports from './pages/Coordinator/Component/CoordinatorWeeklyReports';
import CoordinatorLearning from './pages/Coordinator/Component/CoordinatorLearning';
import CoordinatorHelp from './pages/Coordinator/Component/CoordinatorHelp';

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
          <Route path="progress" element={<AdminProgress />} />
          <Route path="leaderboard" element={<AdminLeaderboard />} />
          <Route path="weekly-reports" element={<AdminWeeklyReports />} />
          <Route path="help" element={<AdminHelp />} />
        </Route>

        {/* Coordinator Workspace Routes */}
        <Route path="/coordinator" element={<CoordinatorLayout />}>
          <Route index element={<CoordinatorOverview />} />
          <Route path="batches" element={<CoordinatorBatches />} />
          <Route path="attendance" element={<CoordinatorAttendance />} />
          <Route path="weekly-reports" element={<CoordinatorWeeklyReports />} />
          <Route path="learning" element={<CoordinatorLearning />} />
          <Route path="help" element={<CoordinatorHelp />} />
          <Route path="profile" element={<CoordinatorOverview />} />
          <Route path="settings" element={<CoordinatorOverview />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
