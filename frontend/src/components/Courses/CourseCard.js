import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/CourseCard.css";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();

  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <button onClick={() => navigate(`/courses/${course.id}`)}>View Course</button>
    </div>
  );
};

export default CourseCard;
