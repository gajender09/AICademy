import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";

import CourseDetailsPage from "./features/course/CourseDetailsPage";
import CoursesPage from "./features/course/CoursesPage";

import Login from "./features/auth/Login";
import Register from "./features/auth/Register";

import StudentDashboard from "./features/dashboard/StudentDashboard";
import MyCoursesPage from "./features/course/MyCoursesPage";
import ProgressPage from "./features/dashboard/ProgressPage";
import AiLabPage from "./features/dashboard/AiLabPage";

import Profile from "./features/profile/Profile";

import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import DashboardLayout from "./components/layout/DashboardLayout";

const hasUsableToken = () => {
  const token = localStorage.getItem("token");

  if (!token || token === "undefined") return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return false;
  }

  return true;
};

const App = () => {
  return (
    <Router>
      <MainApp />
    </Router>
  );
};

const ProtectedRoute = ({ children }) => {
  if (!hasUsableToken()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const MainApp = () => {
  const location = useLocation(); // Get current route

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Unified Student Dashboard Workspace */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/ai-lab" element={<AiLabPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <CoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:slug"
            element={
              <ProtectedRoute>
                <CourseDetailsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {/* Show footer only on Home Page */}
      {location.pathname === "/" && <Footer />}
    </>
  );
};

export default App;
