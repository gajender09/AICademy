import { getCourseUsage } from "./services/courseApi";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  FaArrowRight,
  FaBrain,
  FaChartLine,
  FaCode,
  FaRobot
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../styles/CoursesPage.css";

const CoursesPage = () => {
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const trendingTopics = [
    "Machine Learning",
    "Data Science",
    "Web Development",
    "Artificial Intelligence",
    "Blockchain",
    "System Design",
  ];

  const featureCards = [
    {
      icon: <FaBrain />,
      title: "AI Roadmaps",
      text: "Generate structured learning paths personalized for your goals.",
    },
    {
      icon: <FaRobot />,
      title: "Smart Course Engine",
      text: "AI builds modules, notes, and resources instantly.",
    },
    {
      icon: <FaCode />,
      title: "Project-Based Learning",
      text: "Learn with practical real-world implementations.",
    },
    {
      icon: <FaChartLine />,
      title: "Progress Analytics",
      text: "Track your learning growth and performance.",
    },
  ];

  /* =====================================================
     🔥 GENERATE COURSE (FIXED)
  ===================================================== */
  const handleGenerateCourse = async () => {
    const token = localStorage.getItem("token");


    if (!token) {
      navigate("/login");
      return;
    }

    if (!keywords.trim()) {
      alert("Please enter a topic!");
      return;
    }

    try {

      const usage = await getCourseUsage();

      const limitReached =
        usage.limit !== null &&
        usage.activeCourses >= usage.limit;

        if (limitReached) {
          navigate("/upgrade");
          return;
        }

      setLoading(true);

      const API_BASE =
        process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
        "http://localhost:3001";
      const API_URL = `${API_BASE}/api/courses`;

      const response = await fetch(
        `${API_URL}/generate-structure`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: keywords,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.structure) {
        const slug = keywords
          .toLowerCase()
          .replace(/\s+/g, "-");

        navigate(`/courses/${slug}`, {
          state: {
            title: keywords,
            modules: data.structure,
            progress: 0,
          },
        });
      } else {
        alert("Invalid response from server");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };


  return (

      <div className="courses-page">
        {/* HERO */}
        <section className="courses-hero">
          <div className="hero-glow"></div>

          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="hero-badge">
              AI Learning Ecosystem
            </span>

            <h1>
              Build Personalized
              <br />
              AI-Powered Courses
            </h1>

            <p>
              Generate intelligent learning roadmaps,
              structured modules, quizzes, and resources instantly.
            </p>

            {/* SEARCH */}
            <div className="course-generator">
              <input
                type="text"
                value={keywords}
                onChange={(e) =>
                  setKeywords(e.target.value)
                }
                placeholder="Enter topic like Machine Learning..."
              />

              <button
                onClick={handleGenerateCourse}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Course"}
                <FaArrowRight />
              </button>
            </div>

            {/* TAGS */}
            <div className="trending-topics">
              {trendingTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => setKeywords(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section className="course-features">
          <div className="section-header">
            <span>PLATFORM FEATURES</span>
            <h2>Learn Smarter with AI</h2>
          </div>

          <div className="features-grid">
            {featureCards.map((feature, index) => (
              <motion.div
                className="feature-card"
                key={index}
                whileHover={{ y: -8 }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

  );
};

export default CoursesPage;