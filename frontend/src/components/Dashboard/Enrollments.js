import React from "react";

const enrolledCourses = [
  { id: 1, title: "JavaScript for Beginners", progress: 50 },
  { id: 2, title: "React Essentials", progress: 30 },
];

const Enrollments = () => {
  return (
    <div className="enrollments-container">
      {enrolledCourses.map((course) => (
        <div key={course.id} className="enrollment-card">
          <h3>{course.title}</h3>
          <div className="progress-bar-container">
            <label>Progress: {course.progress}%</label>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
          <button className="continue-button">Continue Learning</button>
        </div>
      ))}
    </div>
  );
};

export default Enrollments;
