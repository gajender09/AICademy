import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FaArrowRight,
  FaBookOpen,
  FaLayerGroup,
  FaPlay,
  FaPlus,
  FaRedoAlt,
  FaSearch,
} from "react-icons/fa";

import "../../styles/MyCoursesPage.css";

const MyCoursesPage = () => {
  const { courses = [], loading } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const openCourse = (course, targetTab) => {
    const courseIdentifier = course.slug || course._id;
    navigate(`/courses/${courseIdentifier}`, {
      state: {
        _id: course._id,
        resume: course.resume,
        activeTab: targetTab,
      },
    });
  };

  const getResumeTab = (resume) => {
    if (!resume) return "content";
    if (resume.type?.startsWith("final")) return "final";
    return "content";
  };

  const getStatusLabel = (progress) => {
    if (progress === 100) return "Completed";
    if (progress > 0) return "In Progress";
    return "Not Started";
  };

  const getActionLabel = (course) => {
    if (course.progress === 100) return "Review";
    if (course.progress > 0) return "Resume";
    return "Start";
  };

  const getActionIcon = (course) => {
    if (course.progress === 100) return <FaRedoAlt />;
    if (course.progress > 0) return <FaArrowRight />;
    return <FaPlay />;
  };

  const getFallbackImageText = (title = "AI") =>
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "AI";

  const filteredCourses = courses.filter((c) =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !courses.length) {
    return (
      <main className="dashboard-main my-courses-main">
        <div className="my-courses-header">
          <div>
            <h1 className="dashboard-hero-title">My Courses</h1>
            <p className="dashboard-hero-quote" style={{ fontStyle: "normal", padding: "12px 18px" }}>
              <span>Manage your generated AI courses and continue learning.</span>
            </p>
          </div>
        </div>
        <div className="dashboard-courses-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-course-card skeleton-card" style={{ height: 280 }} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-main my-courses-main">
      <div className="my-courses-header">
        <div>
          <h1 className="dashboard-hero-title">My Courses</h1>
          <p className="dashboard-hero-quote" style={{ fontStyle: "normal", padding: "12px 18px" }}>
            <span>Manage your generated AI courses and continue learning.</span>
          </p>
        </div>
        <button className="dashboard-cta-btn" onClick={() => navigate("/courses")}>
          <FaPlus /> New Course
        </button>
      </div>

      <div className="my-courses-toolbar">
        <div className="search-input-wrap">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search your courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="dashboard-empty">
          <p style={{ margin: 0, fontWeight: 600 }}>
            {searchQuery
              ? "No courses found matching your search."
              : "No saved courses yet. Generate your first AI-powered course."}
          </p>
          {!searchQuery && (
            <button className="dashboard-cta-btn" onClick={() => navigate("/courses")}>
              Create Course
            </button>
          )}
        </div>
      ) : (
        <div className="dashboard-courses-grid">
          {filteredCourses.map((course) => (
            <article
              key={course._id}
              className="dashboard-course-card"
              onClick={() => openCourse(course, getResumeTab(course.resume))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openCourse(course, getResumeTab(course.resume));
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-course-media">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} loading="lazy" />
                ) : (
                  <div className="dashboard-course-image-fallback">
                    {getFallbackImageText(course.title)}
                  </div>
                )}
                <span
                  className={`dashboard-course-status ${
                    course.progress === 100 ? "is-complete" : course.progress > 0 ? "is-active" : ""
                  }`}
                >
                  {getStatusLabel(course.progress)}
                </span>
              </div>

              <div className="dashboard-course-body">
                <div className="dashboard-course-tags" aria-label="Course tags">
                  {(course.tags?.length ? course.tags : ["AI Course"]).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <h3 className="dashboard-course-title">{course.title}</h3>

                <div className="dashboard-course-facts">
                  <span>
                    <FaLayerGroup /> {course.moduleCount || 0} Modules
                  </span>
                  <span>
                    <FaBookOpen /> {course.chapterCount || 0} Chapters
                  </span>
                </div>

                <div className="dashboard-course-progress">
                  <div className="dashboard-course-progress-meta">
                    <span>Progress</span>
                    <strong>{course.progress || 0}%</strong>
                  </div>
                  <div className="dashboard-progress-bar">
                    <div className="dashboard-progress-fill" style={{ width: `${course.progress || 0}%` }} />
                  </div>
                </div>

                <div className="dashboard-course-footer">
                  <button
                    className="dashboard-course-action"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCourse(course, getResumeTab(course.resume));
                    }}
                  >
                    {getActionIcon(course)}
                    {getActionLabel(course)}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default MyCoursesPage;
