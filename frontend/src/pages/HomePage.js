// // src/pages/HomePage.js
// import React from 'react';
// import { Link } from 'react-router-dom';
// import '../styles/HomePage.css';

// const HomePage = () => {
//   return (
//     <div>
//       <section className="home-page">
//         <div className="hero-content">
//           <h1>Welcome to the AI-Powered Learning Platform</h1>
//           <p>Discover personalized learning paths tailored to your skills and interests.</p>
//           <Link to="/register">Start Your Journey</Link>
//         </div>
//       </section>

//       <section className="features-section">
//         <div className="feature-card">
//           <h3>Personalized Courses</h3>
//           <p>Get course recommendations based on your skills and preferences.</p>
//         </div>
//         <div className="feature-card">
//           <h3>Expert Instructors</h3>
//           <p>Learn from industry experts who will guide you every step of the way.</p>
//         </div>
//         <div className="feature-card">
//           <h3>Interactive Learning</h3>
//           <p>Engage with interactive content and quizzes to test your knowledge.</p>
//         </div>
//       </section>

//       <footer className="footer">
//         <p>&copy; 2025 AI Learning Platform. All rights reserved.</p>
//       </footer>
//     </div>
//   );
// };

// export default HomePage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  // First-time user state to trigger animations or welcome message
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const isLoggedIn = !!localStorage.getItem("user");


  useEffect(() => {
    // Simulate a delay for first-time user interaction
    setTimeout(() => {
      setIsFirstVisit(false);
    }, 3000); // 3 seconds
  }, []);

  return (
    <div>
      {/* Hero Section with Animations for First-time Users */}
      <section className={`home-page ${isFirstVisit ? 'fade-in' : ''}`}>
        <div className="hero-content">
          <h1>Welcome to the AI-Powered Learning Platform</h1>
          <p>Discover personalized learning paths tailored to your skills and interests.</p>
          {!isLoggedIn && (
            <Link to="/Login" className="cta-button">
              Start Your Journey
            </Link>
          )}
          {isLoggedIn && (
            <Link to="/Dashboard" className="cta-button">
              Start Your Journey
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="feature-card">
          <h3>Personalized Courses</h3>
          <p>Get course recommendations based on your skills and preferences.</p>
        </div>
        <div className="feature-card">
          <h3>Expert Instructors</h3>
          <p>Learn from industry experts who will guide you every step of the way.</p>
        </div>
        <div className="feature-card">
          <h3>Interactive Learning</h3>
          <p>Engage with interactive content and quizzes to test your knowledge.</p>
        </div>
      </section>

      {/* Interactive Testimonial Section */}
      <section className="testimonial-section">
        <h2>What Our Users Say</h2>
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <p>"AICademy transformed the way I learn!"</p>
            <p>- Student Name</p>
          </div>
          <div className="testimonial-card">
            <p>"Great personalized learning experience!"</p>
            <p>- Instructor Name</p>
          </div>
        </div>
      </section>

      <section className="video-section">
        <h2>Learn More About AICademy</h2>
        <iframe
          width="100%"
          height="400"
          src="https://www.youtube.com/embed/your-video-id"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="step">
          <div className="step-icon">1</div>
          <p>Sign Up</p>
        </div>
        <div className="step">
          <div className="step-icon">2</div>
          <p>Get Personalized Courses</p>
        </div>
        <div className="step">
          <div className="step-icon">3</div>
          <p>Start Learning</p>
        </div>
      </section>


      <section className="faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-item">
          <h3>How do I get started?</h3>
          <p>Simply sign up, and we'll guide you through the process of selecting your learning path!</p>
        </div>
        <div className="faq-item">
          <h3>What types of courses are available?</h3>
          <p>We offer courses in various tech fields, including AI, Machine Learning, Web Development, and more.</p>
        </div>
      </section>

      {!isLoggedIn && (
        <div className="cta-banner">
          <p>Ready to get started? <Link to="/register">Sign Up</Link></p>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 AI Learning Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
