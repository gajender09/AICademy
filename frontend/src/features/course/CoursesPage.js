import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/CoursesPage.css";

const CoursesPage = () => {
  const [keywords, setKeywords] = useState("");
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  // Check if user is logged in
  const isAuthenticated = localStorage.getItem("user");

  const handleGenerateCourse = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return;
  }

  if (!keywords.trim()) {
    alert("Please enter a topic!");
    return;
  }

  try {
    const COURSE_API = "https://aicademy-bpk8.onrender.com";

    const response = await fetch(`${COURSE_API}/api/courses/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ FIXED
      },
      body: JSON.stringify({ courseId: keywords }),
    });

    const data = await response.json();

    if (response.ok) {
      setCourses((prev) => [...prev, data]);
      setKeywords("");
      navigate(`/courses/${data.courseId}`);
    } else {
      console.error("API ERROR:", data);
      alert(data.error || data.message);
    }
  } catch (error) {
    console.error("FETCH ERROR:", error);
    alert("Network error");
  }
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
              <button onClick={() => navigate(`${course.title}`)}>
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
