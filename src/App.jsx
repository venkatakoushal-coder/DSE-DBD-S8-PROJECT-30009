import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { RoleSelection } from './pages/RoleSelection';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { StudentDashboard } from './pages/StudentDashboard';
import { CourseList } from './pages/CourseList';
import { CourseDetails } from './pages/CourseDetails';
import { QuizPage } from './pages/QuizPage';

import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherCourses } from './pages/TeacherCourses';
import { CourseManagement } from './pages/CourseManagement';
import { StudentPerformance } from './pages/StudentPerformance';
import { Interventions } from './pages/Interventions';

import './styles/index.css';

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<RoleSelection />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <ProtectedRoute allowedRole="student">
                    <CourseList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:id"
                element={
                  <ProtectedRoute allowedRole="student">
                    <CourseDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz/:quizId"
                element={
                  <ProtectedRoute allowedRole="student">
                    <QuizPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teacher/dashboard"
                element={
                  <ProtectedRoute allowedRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/courses"
                element={
                  <ProtectedRoute allowedRole="teacher">
                    <TeacherCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/courses/:id/manage"
                element={
                  <ProtectedRoute allowedRole="teacher">
                    <CourseManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/performance"
                element={
                  <ProtectedRoute allowedRole="teacher">
                    <StudentPerformance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/interventions"
                element={
                  <ProtectedRoute allowedRole="teacher">
                    <Interventions />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
