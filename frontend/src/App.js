import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import StudentDashboard from "./components/Dashboard/StudentDashboard";
import Courses from "./components/Courses/Courses";
import CourseDetail from "./components/Courses/CourseDetail";
import Footer from "./components/Footer";
import Header from "./components/Header";


const App = () => {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;
