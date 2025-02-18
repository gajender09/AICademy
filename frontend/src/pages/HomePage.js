import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import Slider from 'react-slick';
import { FaBookOpen, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';
import { motion } from 'framer-motion';
import 'slick-carousel/slick/slick.css'; 
import 'slick-carousel/slick/slick-theme.css';
import '../styles/HomePage.css';

const HomePage = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const isLoggedIn = !!localStorage.getItem('user');

  useEffect(() => {
    setTimeout(() => {
      setIsFirstVisit(false);
    }, 3000);
  }, []);

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const testimonialSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div>
      {/* Hero Section */}
      <motion.section className={`home-page ${isFirstVisit ? 'fade-in' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}>
        <div className="hero-content">
          <h1>Welcome to the AI-Powered Learning Platform</h1>
          <p>Discover personalized learning paths tailored to your skills and interests.</p>
          <Link to={isLoggedIn ? '/Dashboard' : '/Login'} className="cta-button">
            {isLoggedIn ? 'Go to Dashboard' : 'Start Your Journey'}
          </Link>
        </div>
      </motion.section>

      {/* Features Section with Icons */}
      <section className="features-section">
        <motion.div className="feature-card" whileHover={{ scale: 1.05 }}>
          <FaBookOpen size={40} />
          <h3>Personalized Courses</h3>
          <p>Get course recommendations based on your skills and preferences.</p>
        </motion.div>
        <motion.div className="feature-card" whileHover={{ scale: 1.05 }}>
          <FaChalkboardTeacher size={40} />
          <h3>Expert Instructors</h3>
          <p>Learn from industry experts who will guide you every step of the way.</p>
        </motion.div>
        <motion.div className="feature-card" whileHover={{ scale: 1.05 }}>
          <FaUsers size={40} />
          <h3>Interactive Learning</h3>
          <p>Engage with interactive content and quizzes to test your knowledge.</p>
        </motion.div>
      </section>

      {/* Testimonial Carousel */}
      <section className="testimonial-section">
        <h2>What Our Users Say</h2>
        <Slider {...testimonialSettings}>
          <div className="testimonial-card">
            <p>"AICademy transformed the way I learn!"</p>
            <p>- Student Name</p>
          </div>
          <div className="testimonial-card">
            <p>"Great personalized learning experience!"</p>
            <p>- Instructor Name</p>
          </div>
        </Slider>
      </section>

      {/* Video Section */}
      <section className="video-section">
        <h2>Learn More About AICademy</h2>
        <ReactPlayer url="https://www.youtube.com/watch?v=your-video-id" width="100%" height="400px" controls />
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="step"><div className="step-icon">1</div><p>Sign Up</p></div>
        <div className="step"><div className="step-icon">2</div><p>Get Personalized Courses</p></div>
        <div className="step"><div className="step-icon">3</div><p>Start Learning</p></div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <h2>Frequently Asked Questions</h2>
        {["How do I get started?", "What types of courses are available?"].map((question, index) => (
          <div className="faq-item" key={index} onClick={() => toggleFAQ(index)}>
            <h3>{question}</h3>
            {expandedFAQ === index && (
              <p>{index === 0 ? "Simply sign up, and we'll guide you through the process!" : "We offer AI, ML, Web Dev, and more."}</p>
            )}
          </div>
        ))}
      </section>

      {/* Interactive Career Roadmaps
      <section className="career-roadmaps">
        <h2>Career Roadmaps</h2>
        <div className="roadmap-container">
          <div className="roadmap-card">
            <h3>AI & Machine Learning</h3>
            <p>Follow a structured path to master AI and ML.</p>
            <Link to="/ai-roadmap">View Roadmap</Link>
          </div>
          <div className="roadmap-card">
            <h3>Full-Stack Development</h3>
            <p>Master frontend and backend development step by step.</p>
            <Link to="/fullstack-roadmap">View Roadmap</Link>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
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
