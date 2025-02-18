import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import "../../styles/CourseDetail.css";

const CourseDetail = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    const storedCourses = JSON.parse(localStorage.getItem("enrolledCourses")) || [];
    const selectedCourse = storedCourses.find(course => course.id === parseInt(courseId));
    if (selectedCourse) {
      setCourse(selectedCourse);
      setProgress(selectedCourse.progress || []);
    }
  }, [courseId]);

  const handleMarkComplete = (index) => {
    const updatedProgress = [...progress];
    updatedProgress[index] = !updatedProgress[index];
    setProgress(updatedProgress);

    const storedCourses = JSON.parse(localStorage.getItem("enrolledCourses")) || [];
    const updatedCourses = storedCourses.map((c) =>
      c.id === parseInt(courseId) ? { ...c, progress: updatedProgress } : c
    );

    localStorage.setItem("enrolledCourses", JSON.stringify(updatedCourses));
  };

  return (
    <div className="course-detail-container">
      {course ? (
        <>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-progress">
            {course.videos.map((video, index) => (
              <div key={index} className="video-item">
                <ReactPlayer url={video.url} controls />
                <label>
                  <input type="checkbox" checked={progress[index] || false} onChange={() => handleMarkComplete(index)} />
                  Mark as Completed
                </label>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default CourseDetail;
