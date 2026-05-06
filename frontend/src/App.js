import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";

import CoursesPage from "./features/course/CoursesPage";
import CourseDetailsPage from "./features/course/CourseDetailsPage";

import Login from "./features/auth/Login";
import Register from "./features/auth/Register";

import StudentDashboard from "./features/dashboard/StudentDashboard";

import Profile from "./features/profile/Profile";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";


const App = () => {
  return (
    <Router>
      <MainApp />
    </Router>
  );
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
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {/* Show footer only on Home Page */}
      {location.pathname === "/" && <Footer />}
    </>
  );
};

export default App;
