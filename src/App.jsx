import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Verification from './pages/Verification';
import PublicResources from './pages/PublicResources';
import Layout from './components/Layout';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import BatchManagement from './pages/admin/BatchManagement';
import TaskManagement from './pages/admin/TaskManagement';
import BatchTracker from './pages/admin/BatchTracker';
import SubmissionReviews from './pages/admin/SubmissionReviews';
import EnrollmentRequests from './pages/admin/EnrollmentRequests';
import AttendanceLogs from './pages/admin/AttendanceLogs';
import AdminProfile from './pages/admin/AdminProfile';
import StudentList from './pages/admin/StudentList';
import QuizManagement from './pages/admin/QuizManagement';
import LiveQuizHost from './pages/admin/LiveQuizHost';
import AdminLeetcode from './pages/admin/AdminLeetcode';
import BatchChat from './pages/BatchChat';
import LeaveRequests from './pages/admin/LeaveRequests';
import MockDriveManagement from './pages/admin/MockDriveManagement';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableBatches from './pages/student/AvailableBatches';
import MyBatches from './pages/student/MyBatches';
import MyTasks from './pages/student/MyTasks';
import MyGrades from './pages/student/MyGrades';
import MyAttendance from './pages/student/MyAttendance';
import UserProfile from './pages/student/UserProfile';
import StudentSetup from './pages/student/StudentSetup';
import MyQuizzes from './pages/student/MyQuizzes';
import QuizPlayer from './pages/student/QuizPlayer';
import StudentLeaderboard from './pages/student/StudentLeaderboard';
import StudentLeetcode from './pages/student/StudentLeetcode';
import LeaveApplication from './pages/student/LeaveApplication';
import LiveQuizPlayer from './pages/student/LiveQuizPlayer';
import JoinQuiz from './pages/student/JoinQuiz';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verification />} />
          <Route path="/public" element={<PublicResources />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Admin Routes */}
            <Route index element={
              <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="batches" element={
              <ProtectedRoute allowedRoles={['admin']}><BatchManagement /></ProtectedRoute>
            } />
            <Route path="tasks" element={
              <ProtectedRoute allowedRoles={['admin']}><TaskManagement /></ProtectedRoute>
            } />
            <Route path="batch-tracker" element={
              <ProtectedRoute allowedRoles={['admin']}><BatchTracker /></ProtectedRoute>
            } />
            <Route path="reviews" element={
              <ProtectedRoute allowedRoles={['admin']}><SubmissionReviews /></ProtectedRoute>
            } />
            <Route path="enrollments" element={
              <ProtectedRoute allowedRoles={['admin']}><EnrollmentRequests /></ProtectedRoute>
            } />
            <Route path="attendance-logs" element={
              <ProtectedRoute allowedRoles={['admin']}><AttendanceLogs /></ProtectedRoute>
            } />
            <Route path="students" element={
              <ProtectedRoute allowedRoles={['admin']}><StudentList /></ProtectedRoute>
            } />
            <Route path="chat" element={
              <ProtectedRoute allowedRoles={['admin', 'student']}><BatchChat /></ProtectedRoute>
            } />
            <Route path="quizzes" element={
              <ProtectedRoute allowedRoles={['admin']}><QuizManagement /></ProtectedRoute>
            } />
            <Route path="/host-quiz/:id" element={
              <ProtectedRoute allowedRoles={['admin']}><LiveQuizHost /></ProtectedRoute>
            } />
            <Route path="leetcode" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminLeetcode /></ProtectedRoute>
            } />
            <Route path="leaves" element={
              <ProtectedRoute allowedRoles={['admin']}><LeaveRequests /></ProtectedRoute>
            } />
            <Route path="mock-drives" element={
              <ProtectedRoute allowedRoles={['admin']}><MockDriveManagement /></ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminProfile /></ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="student/setup" element={
              <ProtectedRoute allowedRoles={['student']}><StudentSetup /></ProtectedRoute>
            } />
            <Route path="student" element={
              <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="student/available-batches" element={
              <ProtectedRoute allowedRoles={['student']}><AvailableBatches /></ProtectedRoute>
            } />
            <Route path="student/my-batches" element={
              <ProtectedRoute allowedRoles={['student']}><MyBatches /></ProtectedRoute>
            } />
            <Route path="student/tasks" element={
              <ProtectedRoute allowedRoles={['student']}><MyTasks /></ProtectedRoute>
            } />
            <Route path="student/chat" element={
              <ProtectedRoute allowedRoles={['student', 'admin']}><BatchChat /></ProtectedRoute>
            } />
            <Route path="student/grades" element={
              <ProtectedRoute allowedRoles={['student']}><MyGrades /></ProtectedRoute>
            } />
            <Route path="student/attendance" element={
              <ProtectedRoute allowedRoles={['student']}><MyAttendance /></ProtectedRoute>
            } />
            <Route path="student/quizzes" element={
              <ProtectedRoute allowedRoles={['student']}><MyQuizzes /></ProtectedRoute>
            } />
            <Route path="student/play-quiz/:id" element={
              <ProtectedRoute allowedRoles={['student']}><QuizPlayer /></ProtectedRoute>
            } />
            <Route path="student/join-quiz" element={
              <ProtectedRoute allowedRoles={['student']}><JoinQuiz /></ProtectedRoute>
            } />
            <Route path="student/play-live-quiz/:pin" element={
              <ProtectedRoute allowedRoles={['student']}><LiveQuizPlayer /></ProtectedRoute>
            } />
            <Route path="student/profile" element={
              <ProtectedRoute allowedRoles={['student']}><UserProfile /></ProtectedRoute>
            } />
            <Route path="student/leetcode" element={
              <ProtectedRoute allowedRoles={['student']}><StudentLeetcode /></ProtectedRoute>
            } />
            <Route path="student/leaves" element={
              <ProtectedRoute allowedRoles={['student']}><LeaveApplication /></ProtectedRoute>
            } />
            <Route path="student/leaderboard" element={
              <ProtectedRoute allowedRoles={['student', 'admin']}><StudentLeaderboard /></ProtectedRoute>
            } />
            <Route path="*" element={<div className="p-8"><h1 className="text-2xl">Page Under Construction</h1></div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
