import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaBook, FaLightbulb, FaChartLine, FaCog, FaPlayCircle, FaClock, FaStar, FaBell, FaMoon, FaSun, FaUser, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import "../../styles/StudentDashboard.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StudentDashboard = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.name) {
      const firstName = storedUser.name.split(" ")[0];
      setUserName(firstName);
    }

    const savedCourses = JSON.parse(localStorage.getItem("enrolledCourses")) || [];
    const enhancedCourses = savedCourses.map((course) => ({
      ...course,
      lastActivity: new Date(course.lastAccessed || Date.now()).toLocaleDateString(),
      quizScore: Math.floor(Math.random() * 100),
    }));
    setEnrolledCourses(enhancedCourses);
  }, []);

  const calculateProgress = (course) => {
    const totalSubtopics = course.modules?.reduce((sum, m) => sum + m.subtopics.length, 0) || 0;
    const completed = Object.values(course.completedSubtopics || {}).filter(Boolean).length;
    return totalSubtopics > 0 ? Math.round((completed / totalSubtopics) * 100) : 0;
  };

  const resumeCourse = (courseId) => {
    const course = enrolledCourses.find((c) => c.courseId === courseId);
    navigate(`/courses/${courseId}`, { state: { courseData: course } });
  };

  const totalProgress = enrolledCourses.reduce((sum, course) => sum + calculateProgress(course), 0) / enrolledCourses.length || 0;
  const completedCourses = enrolledCourses.filter(course => calculateProgress(course) === 100).length;
  const notifications = ["New course available!", "Quiz score updated!"];

  const filteredCourses = enrolledCourses.filter(course =>
    course.courseId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const courseData = {
    labels: enrolledCourses.map(course => course.courseId),
    datasets: [{
      label: "Progress (%)",
      data: enrolledCourses.map(course => calculateProgress(course)),
      backgroundColor: "#3498db",
      borderColor: "#2980b9",
      borderWidth: 1,
    }],
  };

  return (
    <div className={`student-dashboard ${isDarkMode ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
        <h2 className="sidebar-logo">🧠 AICademy</h2>
        </div>
        <ul className="sidebar-nav">
          <li className="nav-item active"><FaTachometerAlt /> Dashboard</li>
          <li className="nav-item"><FaBook /> My Courses</li>
          <li className="nav-item"><FaLightbulb /> Recommendations</li>
          <li className="nav-item"><FaChartLine /> Activity</li>
          <li className="nav-item" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <FaSun /> : <FaMoon />} Theme
          </li>
        </ul>
      </aside>

      <div className="main-content">
        <header className="dashboard-header">
          <motion.h1
            className="welcome-text"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome back, {userName} 👋
          </motion.h1>
          <div className="profile-summary">
            <FaUser /> <span>Total Hours: 50 | Badges: {completedCourses}</span>
          </div>
          <FaBell className="notification-bell" onClick={() => setShowNotifications(!showNotifications)} />
          {showNotifications && (
            <div className="notifications-panel">
              {notifications.map((note, i) => <p key={i}>{note}</p>)}
            </div>
          )}
        </header>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="progress-overview">
          <h3 className="overview-title">Learning Overview</h3>
          <div className="progress-chart">
            <Bar data={courseData} options={{ responsive: true, plugins: { legend: { position: "top" }, title: { display: true, text: "Course Progress" } } }} />
          </div>
          <div className="progress-stats">
            <p>Average Progress: <span className="stat-value">{totalProgress.toFixed(1)}%</span></p>
            <p>Completed Courses: <span className="stat-value">{completedCourses}</span></p>
          </div>
        </div>

        <main className="courses-section">
          {filteredCourses.length ? (
            filteredCourses.map((course, i) => (
              <motion.div
                key={i}
                className="course-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}
              >
                <div className="course-header">
                  <h3 className="course-title">{course.courseId}</h3>
                  {calculateProgress(course) === 100 && <FaStar className="achievement-icon" />}
                </div>
                <div className="progress-container">
                  <FaCheckCircle className="progress-icon" />
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${calculateProgress(course)}%` }}></div>
                  </div>
                  <p className="progress-text">{calculateProgress(course)}% Completed</p>
                </div>
                <div className="course-details">
                  <p className="activity-text"><FaClock /> {course.lastActivity}</p>
                  <p className="score-text"><FaStar /> Quiz Score: {course.quizScore}%</p>
                </div>
                <button
                  className="resume-btn"
                  onClick={() => resumeCourse(course.courseId)}
                >
                  <FaPlayCircle /> {calculateProgress(course) === 0 ? "Start Course" : "Resume Course"}
                </button>
              </motion.div>
            ))
          ) : (
            <div className="empty-state">
              <h2 className="empty-title">No courses enrolled</h2>
              <p className="empty-subtitle">Browse and start your first course now!</p>
              <button className="browse-btn" onClick={() => navigate("/courses")}>
                Browse Courses
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;