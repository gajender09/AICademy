import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { FaBookOpen, FaChalkboardTeacher, FaUsers, FaProjectDiagram, FaBook, FaLink, FaBrain } from "react-icons/fa";
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
      <div className="features-container">
        <h2 className="features-header">Unlock Your Potential with AICademy</h2>
        <section className="features-section">
          {/* Feature Cards Here */}
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
          <motion.div className="feature-card" whileHover={{ scale: 1.05 }}>
            <FaProjectDiagram size={40} />
            <h3>AI Roadmap</h3>
            <p>Generate an AI-powered learning roadmap tailored to your goals.</p>
          </motion.div>
          <motion.div className="feature-card" whileHover={{ scale: 1.05 }}>
            <FaBook size={40} />
            <h3>Glossary</h3>
            <p>Access a comprehensive glossary of key terms and concepts.</p>
          </motion.div>
          <motion.div className="feature-card" whileHover={{ scale: 1.05 }}>
            <FaLink size={40} />
            <h3>Resources</h3>
            <p>Get curated learning materials, articles, and recommended books.</p>
          </motion.div>
          <motion.div className="feature-card" whileHover={{ scale: 1.05 }}>
            <FaBrain size={40} />
            <h3>AI-Curated Content</h3>
            <p>Receive AI-curated learning content to enhance your knowledge.</p>
          </motion.div>
        </section>
      </div>

      {/* Video Section */}
      <section className="video-section">
        <h2>Learn More About AICademy</h2>
        <ReactPlayer url="https://www.youtube.com/watch?v=your-video-id" width="800px" height="400px" controls />
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <p className="sub-heading">
          Learn smarter with our AI-powered personalized learning journey!
        </p>

        <div className="steps-container">
          <div className="step">
            <div className="step-icon"><i className="fas fa-user-plus"></i></div>
            <h3>Sign Up</h3>
            <p>Create your account and set your learning preferences.</p>
          </div>

          <div className="step">
            <div className="step-icon"><i className="fas fa-graduation-cap"></i></div>
            <h3>Get Personalized Courses</h3>
            <p>AI curates a roadmap based on your skills and interests.</p>
          </div>

          <div className="step">
            <div className="step-icon"><i className="fas fa-book-open"></i></div>
            <h3>Start Learning</h3>
            <p>Watch videos, read content, and track progress interactively.</p>
          </div>

          <div className="step">
            <div className="step-icon"><i className="fas fa-trophy"></i></div>
            <h3>Earn Achievements</h3>
            <p>Complete courses, earn badges, and get certified.</p>
          </div>
        </div>
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

      {/* CTA Section */}
      {!isLoggedIn && (
        <div className="cta-banner">
          <p>Ready to get started? <Link to="/register">Sign Up</Link></p>
        </div>
      )}

    </div>
  );
};

export default HomePage;
