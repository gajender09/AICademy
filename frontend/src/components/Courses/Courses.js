import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses');
        setCourses(response.data.elements || []);  // Extract courses from API response
      } catch (error) {
        setError('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container">
      <h2 className="title">Available Courses</h2>
      <div className="course-grid">
        {courses.map((course) => (
          <div key={course.id} className="course-card">
            <img src={course.imageUrl || 'https://via.placeholder.com/300'} alt={course.name} />
            <h3>{course.name}</h3>
            <p>{course.description || 'No description available'}</p>
            <a href={`https://www.coursera.org/learn/${course.slug}`} target="_blank" rel="noopener noreferrer">
              <button className="enroll-btn">View Course</button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
