import React from "react";
import { useParams } from "react-router-dom";

const CourseDetails = () => {
  const { courseId } = useParams();

  return (
    <div className="course-details">
      <h1>Course Details for Course ID: {courseId}</h1>
      {/* Add detailed course content and learning path here */}
    </div>
  );
};

export default CourseDetails;
