import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CoursesPage.css";

const CoursesPage = () => {
  const [keywords, setKeywords] = useState("");
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  // Check if user is logged in
  const isAuthenticated = localStorage.getItem("user");

  const handleGenerateCourse = () => {
    if (!isAuthenticated) {
      navigate("/login"); // Redirect to login if not logged in
      return;
    }

    if (!keywords.trim()) {
      alert("Please enter a topic!");
      return;
    }

    // Simulating AI-generated course data
    const newCourse = {
      id: Date.now(),
      title: keywords.toUpperCase(),
      description: `Comprehensive learning path for ${keywords}`,
      image: `https://source.unsplash.com/300x200/?${keywords},technology`, // Random relevant image
    };

    setCourses([...courses, newCourse]);
    setKeywords("");
  };

  return (
    <div className="courses-container">
      <h1>🚀 Explore AI-Powered Courses</h1>
      <p>Enter a topic to generate a structured AI-powered course roadmap.</p>

      {/* Course Input Form */}
      <div className="course-form">
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Enter a topic (e.g., Data Science)"
        />
        <button onClick={handleGenerateCourse}>Generate Course</button>
      </div>

      {/* Display Generated Courses */}
      <div className="course-list">
        {courses.map((course) => (
          <div key={course.id} className="course-card">
            <img src={course.image} alt={course.title} />
            <div className="course-info">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <button onClick={() => navigate(`/courses/${course.id}/roadmap`)}>
                📚 View Course
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
