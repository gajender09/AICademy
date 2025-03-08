import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/CourseDetailsPage.css";

// Dummy content for each section
const dummyContent = {
  roadmap: "This is a structured roadmap for learning this topic.",
  glossary: "A list of key terms and definitions related to the course.",
  content: "Curated learning content from OpenAI and other sources.",
  articles: "A list of suggested articles from reliable sources.",
  videos: "Embedded YouTube videos related to this topic.",
};

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const [activeSection, setActiveSection] = useState("roadmap");

  return (
    <div className="course-details-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <ul>
          <li
            className={activeSection === "roadmap" ? "active" : ""}
            onClick={() => setActiveSection("roadmap")}
          >
            Roadmap
          </li>
          <li
            className={activeSection === "glossary" ? "active" : ""}
            onClick={() => setActiveSection("glossary")}
          >
            Glossary
          </li>
          <li
            className={activeSection === "content" ? "active" : ""}
            onClick={() => setActiveSection("content")}
          >
            Curated Content
          </li>
          <li
            className={activeSection === "articles" ? "active" : ""}
            onClick={() => setActiveSection("articles")}
          >
            Suggested Articles
          </li>
          <li
            className={activeSection === "videos" ? "active" : ""}
            onClick={() => setActiveSection("videos")}
          >
            YouTube Videos
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <div className="content">
        <h2>{activeSection.replace(/^\w/, (c) => c.toUpperCase())}</h2>
        <p>{dummyContent[activeSection]}</p>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
