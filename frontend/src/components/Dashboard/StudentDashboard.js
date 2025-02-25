import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Dashboard.css'; // Adjusted path


const StudentDashboard = () => {
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    // Check for user in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure only the first name is displayed
        const firstName = parsedUser.name?.split(" ")[0] || "User";
        setUserName(firstName);
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }
  }, []);

  const mockCourses = [
    {
      id: 1,
      title: "Machine Learning",
      description: "Learn the basics of Machine Learning and its applications.",
      progress: 75,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4sXvAhlZ68GDr_LA9ho4jhOz7-8Mzp7d-pQ&s",
    },
    {
      id: 2,
      title: "Web Development",
      description: "Master HTML, CSS, JavaScript, and modern web frameworks.",
      progress: 50,
      image: "data:image/png;base64,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",
    },
    {
      id: 3,
      title: "Data Science",
      description: "Analyze and visualize data using Python and tools.",
      progress: 90,
      image: "data:image/jpeg;base64,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",
    },
  ];

  const mockRecommendations = [
    {
      title: "Introduction to AI",
      image: "https://via.placeholder.com/100?text=AI",
    },
    {
      title: "Blockchain Basics",
      image: "https://via.placeholder.com/100?text=Blockchain",
    },
    {
      title: "Advanced React Techniques",
      image: "https://via.placeholder.com/100?text=React",
    },
  ];

  const recentActivity = [
    { activity: "Completed Web Development - 2 hours ago" },
    { activity: "Started Machine Learning - 1 day ago" },
    { activity: "Enrolled in Data Science - 3 days ago" },
  ];

  return (
    <div className="dashboard-container">
      { /* Sidebar */ }
      <div className="sidebar">
        <div className="profile-info">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAK0AAACUCAMAAADWBFkUAAAAMFBMVEXk5ueutLenrrHg4+Tn6eqqsLSxt7rq7O26v8LGyszd4OHR1NbY29zBxsjV2Nq0urz6zFdmAAAD+0lEQVR4nO2c2XajMAxAWWTjDfj/vx0TkjZJW2JLRjJnfF+mp0/3aITkRW7XNRqNRqPRaDQajUajIQyAtEEa0zS5sETcOE01O0M3Om/6YRhUJP6jZ++2X1cIdMGuveqfidLGhvrSAiZv9KvqQ1ibUFtKLL+qPozXUJEuBHPguukOs6vFF/xRYO++2leiaz6p7sw16Lr1Y2Dv4TXy2RDWNNeNVVgXXLprRIu2CnCJWfCl6yRlM9Jgx4xyuonV4EV3EnKd5sw82BisTOpCGPJlIzJdeMxO2h0jIQsWJ9srL2AbkLIR/roAM1pW8X9oDveJyQR3QpTab7iDO1JkuTsauiDsqIU3uB+2Np9sZ05XCJoU27h05LT1pNDG1ULg1MWsZ55hLbkjMRHipodx4ThSWsMeXMbYLnRbvsQFS0zbCN9hCGrT8AbfZ0ZbJOzwndxMyF3DM4bPli7bbJstv+21vrJrVbBLdYdrdd7OX2lVQztM2G0vtRrXnMe4+GOlOzOjLX0XufDJxh06NbashzUjsT+wnn6QT5aYL33zbvXeWZmvza51IkprEOw3kkAILmexvXOpWxJ8P1NWQBYccrEgczENyHUj8yn+l+6VbqW3/puvK3bjj7l+WAWnKbIv/TXrfcMP3SUrF5T00NKSkQxafpwx9KnhrWH2MnaJJF0lOa70BNiEbNBidfadjxOt/WAqyIIH0Pmj7FW9r2t6HA7SYfUVTo53ftZKvY+5r3NlcX0AnVvs2u8PCLYnBMrYxdXpeif+pwfvrfc+jPUlwCtwY9rYf5QW+oPoGDMhLDGodif+tIQY4E1c2u4ZgDH4edW/VgW9xuytIym2pzmLNbcv66Dexi8u1oYg+sUBOG/Nj6r1p3K/Gcs85oKp82v+rldr67hf7cQE8OuAPHEeeutGPmEYt66FU72hemOZdhFxRfD+jAyDnh3D7ne05NunO8qcXCPA2QJh/WYO5/lCZ1NfECWi9HzWKh2WoqYPTtkBgTOlEvYVpYsvgI+2BnRM2fIL1PuxD+iSp6TgT3Xtb8POpXxLDE981C30DBHIo8FpukUOySD5lSbZl36dmnrKVYKBqssX2Rs0Xc7IbpCSAcaia5gECMkA2Nd5FPB9gva8BQmykHE0hZ8ojTpCJ88lYXUx85hAn1DDgvnSzl11HYG4Ajx92fU3iNdnYnmw6WZO4k0i9eCbvMylPdKkk7W1JDwtLkPWYED+X3EoTUYVk+liL2RcCp+8w00iveYG8dBmPPOsIBHiSjfVdpLsDA+G5B37OQdemSSmgtRS8Y3EZ0eoEbryJDaIEi+cCpB6diPeyG4knjtiJ1VLk9R8Ydn+lGIFJBYFN9ZBkmzjv+QfEsU4auaNFxoAAAAASUVORK5CYII=" alt="Student Profile" className="profile-photo" />
          <span className="username">{userName}</span> {/* Replace with actual username */}
        </div>
        <ul className="sidebar-nav">
          <li>🏠 Dashboard</li>
          <li>📚 My Courses</li>
          <li>💡 Recommendations</li>
          <li>📊 Activity</li>
          <li>⚙️ Settings</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="dashboard-heading">Welcome Back! {userName}</h1>

        {/* My Courses Section */}
        <section className="courses-section">
          <h2>My Courses</h2>
          <div className="courses-list">
            {mockCourses.map((course) => (
              <div key={course.id} className="course-card">
                <img src={course.image} alt={course.title} className="course-image" />
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <p className="progress-text">{course.progress}% completed</p>
                <button className="btn-view-course">View Course</button>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="recommendations-section">
          <h2>Recommended for You</h2>
          <div className="recommendations-list">
            {mockRecommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <img src={rec.image} alt={rec.title} />
                <p>{rec.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="quiz-demo">
          <h2>Take a Quick Quiz to Get Personalized Recommendations</h2>
          <Link to="/quiz" className="quiz-btn">Start Quiz</Link>
        </section>


        {/* Activity Section */}
        <section className="activity-section">
          <h2>Recent Activity</h2>
          <ul className="activity-list">
            {recentActivity.map((item, index) => (
              <li key={index}>{item.activity}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;