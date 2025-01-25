import React from "react";

const recommendedCourses = [
  { id: 1, title: "Python Programming", image: "path/to/image1.jpg" },
  { id: 2, title: "Data Structures", image: "path/to/image2.jpg" },
];

const Recommendations = () => {
  return (
    <div className="recommendations-container">
      {recommendedCourses.map((course) => (
        <div key={course.id} className="recommendation-card">
          <img
            src={course.image}
            alt={course.title}
            className="recommendation-image"
          />
          <h3>{course.title}</h3>
          <button className="enroll-button">Enroll Now</button>
        </div>
      ))}
    </div>
  );
};

export default Recommendations;
