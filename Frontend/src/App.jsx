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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
