import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

// Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Verification = lazy(() => import('./pages/Verification'));
const PublicResources = lazy(() => import('./pages/PublicResources'));
const Layout = lazy(() => import('./components/Layout'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const BatchManagement = lazy(() => import('./pages/admin/BatchManagement'));
const TaskManagement = lazy(() => import('./pages/admin/TaskManagement'));
const TaskCreateEdit = lazy(() => import('./pages/admin/TaskCreateEdit'));
const BatchTracker = lazy(() => import('./pages/admin/BatchTracker'));
const AttendanceTracker = lazy(() => import('./pages/admin/AttendanceTracker'));
const SubmissionReviews = lazy(() => import('./pages/admin/SubmissionReviews'));
const EnrollmentRequests = lazy(() => import('./pages/admin/EnrollmentRequests'));
const AttendanceLogs = lazy(() => import('./pages/admin/AttendanceLogs'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const StudentList = lazy(() => import('./pages/admin/StudentList'));
const AdminLeetcode = lazy(() => import('./pages/admin/AdminLeetcode'));
const BatchChat = lazy(() => import('./pages/BatchChat'));
const LeaveRequests = lazy(() => import('./pages/admin/LeaveRequests'));
const MockDriveManagement = lazy(() => import('./pages/admin/MockDriveManagement'));
const TrafficManagement = lazy(() => import('./pages/admin/TrafficManagement'));
const CheckInPermissions = lazy(() => import('./pages/admin/CheckInPermissions'));
const FacultyAttendance = lazy(() => import('./pages/admin/FacultyAttendance'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const AvailableBatches = lazy(() => import('./pages/student/AvailableBatches'));
const MyBatches = lazy(() => import('./pages/student/MyBatches'));
const MyTasks = lazy(() => import('./pages/student/MyTasks'));
const MyGrades = lazy(() => import('./pages/student/MyGrades'));
const MyAttendance = lazy(() => import('./pages/student/MyAttendance'));
const UserProfile = lazy(() => import('./pages/student/UserProfile'));
const StudentSetup = lazy(() => import('./pages/student/StudentSetup'));
const StudentLeaderboard = lazy(() => import('./pages/student/StudentLeaderboard'));
const StudentLeetcode = lazy(() => import('./pages/student/StudentLeetcode'));
const LeaveApplication = lazy(() => import('./pages/student/LeaveApplication'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<Loader />}>
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
            <Route path="tasks/create" element={
              <ProtectedRoute allowedRoles={['admin']}><TaskCreateEdit /></ProtectedRoute>
            } />
            <Route path="tasks/edit/:id" element={
              <ProtectedRoute allowedRoles={['admin']}><TaskCreateEdit /></ProtectedRoute>
            } />
            <Route path="batch-tracker" element={
              <ProtectedRoute allowedRoles={['admin', 'student']}><BatchTracker /></ProtectedRoute>
            } />
            <Route path="attendance-tracker" element={
              <ProtectedRoute allowedRoles={['admin', 'student']}><AttendanceTracker /></ProtectedRoute>
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
            <Route path="traffic" element={
              <ProtectedRoute allowedRoles={['admin']}><TrafficManagement /></ProtectedRoute>
            } />
            <Route path="checkin-permissions" element={
              <ProtectedRoute allowedRoles={['admin']}><CheckInPermissions /></ProtectedRoute>
            } />
            <Route path="attendence" element={
              <ProtectedRoute allowedRoles={['admin']}><FacultyAttendance /></ProtectedRoute>
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
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
