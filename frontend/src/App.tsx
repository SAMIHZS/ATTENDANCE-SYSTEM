import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRedirect } from './routes/RoleRedirect';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { TeacherLayout } from './layouts/TeacherLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Auth pages
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

import {
  TeacherDashboardPage,
  TeacherHistoryPage,
  TeacherTimetablePage,
  TeacherProfilePage,
  TeacherRollCallPage,
} from './pages/teacher';

// Student pages
import {
  StudentDashboardPage,
  StudentHistoryPage,
  StudentSubjectsPage,
  StudentProfilePage,
  StudentSetupPage,
} from './pages/student';

// Admin pages
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminTimetablePage,
  AdminReportsPage,
  AdminAttendancePage,
  AdminClassesPage,
  AdminSubjectsPage,
  TeacherRequestsPage,
} from './pages/admin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect → role home */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* OAuth Callback — outside AuthLayout, no nav chrome */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Teacher routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher" element={<TeacherDashboardPage />} />
            <Route path="/teacher/history" element={<TeacherHistoryPage />} />
            <Route path="/sessions/:id/roll-call" element={<TeacherRollCallPage />} />
            <Route path="/teacher/timetable" element={<TeacherTimetablePage />} />
            <Route path="/teacher/profile" element={<TeacherProfilePage />} />
          </Route>

          {/* Student routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/student" element={<StudentDashboardPage />} />
            <Route path="/student/setup" element={<StudentSetupPage />} />
            <Route path="/student/history" element={<StudentHistoryPage />} />
            <Route path="/student/subjects" element={<StudentSubjectsPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/teacher-requests" element={<TeacherRequestsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/timetable" element={<AdminTimetablePage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            <Route path="/admin/classes" element={<AdminClassesPage />} />
            <Route path="/admin/subjects" element={<AdminSubjectsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
