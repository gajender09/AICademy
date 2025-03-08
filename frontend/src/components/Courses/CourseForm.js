import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/CourseForm.css";

const CourseForm = ({ onGenerateCourse }) => {
  const [keywords, setKeywords] = useState("");
  const navigate = useNavigate();

  // Check if user is logged in
  const isAuthenticated = localStorage.getItem("user");

  const handleGenerateCourse = () => {
    if (!isAuthenticated) {
      navigate("/login"); // Redirect to login if not logged in
      return;
    }

    if (!keywords.trim()) {
      alert("Please enter some keywords to generate a course.");
      return;
    }

    // Mock generated course (later will be replaced with API response)
    const newCourse = {
      title: `AI Course on: ${keywords}`,
      description: `This course provides an overview of ${keywords}.`,
    };

    onGenerateCourse(newCourse); // Update courses list

    setKeywords(""); // Reset input field
  };

  return (
    <div className="course-form">
      <input
        type="text"
        placeholder="Enter keywords (e.g., Machine Learning, Python)"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
      />
      <button onClick={handleGenerateCourse}>Generate Course</button>
    </div>
  );
};

export default CourseForm;
